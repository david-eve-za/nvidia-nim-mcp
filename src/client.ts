import axios, { AxiosInstance, AxiosError } from "axios";
import axiosRetry from "axios-retry";
import { getConfig } from "./config.js";
import { logger } from "./logger.js";

const config = getConfig();

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string | ContentPart[];
}

export interface ContentPart {
  type: "text" | "image_url";
  text?: string;
  image_url?: { url: string; detail?: "low" | "high" | "auto" };
}

export interface ChatCompletionRequest {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  top_p?: number;
  max_tokens?: number;
  stream?: boolean;
  stop?: string | string[];
  frequency_penalty?: number;
  presence_penalty?: number;
  seed?: number;
  tools?: Tool[];
  tool_choice?: "auto" | "none" | { type: "function"; function: { name: string } };
  response_format?: { type: "text" | "json_object" };
}

export interface Tool {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
}

export interface ChatCompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Choice[];
  usage: Usage;
}

export interface Choice {
  index: number;
  message: {
    role: string;
    content: string | null;
    tool_calls?: ToolCall[];
  };
  finish_reason: string;
}

export interface ToolCall {
  id: string;
  type: "function";
  function: { name: string; arguments: string };
}

export interface Usage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export interface EmbeddingRequest {
  model: string;
  input: string | string[];
  encoding_format?: "float" | "base64";
  truncate?: "NONE" | "START" | "END";
}

export interface EmbeddingResponse {
  object: string;
  data: Array<{ object: string; embedding: number[]; index: number }>;
  model: string;
  usage: { prompt_tokens: number; total_tokens: number };
}

export interface RerankRequest {
  model: string;
  query: string;
  passages: Array<{ text: string }>;
  truncate?: "NONE" | "END";
}

export interface RerankResponse {
  rankings: Array<{
    index: number;
    logit: number;
    passage: { text: string };
  }>;
  usage: { prompt_tokens: number; total_tokens: number };
}

export interface ImageGenerationRequest {
  model: string;
  prompt: string;
  negative_prompt?: string;
  width?: number;
  height?: number;
  num_images?: number;
  steps?: number;
  cfg_scale?: number;
  seed?: number;
  sampler?: string;
  scheduler?: string;
  response_format?: "url" | "b64_json";
}

export interface ImageGenerationResponse {
  created: number;
  model?: string;
  data: Array<{
    url?: string;
    b64_json?: string;
    revised_prompt?: string;
  }>;
  usage?: { total_images: number };
}

export interface ImageAnalysisRequest {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  top_p?: number;
  max_tokens?: number;
  stream?: boolean;
}

class RateLimiter {
  private requests: number[] = [];
  private readonly maxRequests: number;
  private readonly windowMs = 60_000;

  constructor(maxRequests: number) {
    this.maxRequests = maxRequests;
  }

  async acquire(): Promise<void> {
    const now = Date.now();
    this.requests = this.requests.filter((t) => now - t < this.windowMs);

    if (this.requests.length >= this.maxRequests) {
      const oldest = this.requests[0];
      const waitMs = this.windowMs - (now - oldest) + 10;
      logger.warn(`Rate limit reached. Waiting ${waitMs}ms`);
      await new Promise((res) => setTimeout(res, waitMs));
      return this.acquire();
    }

    this.requests.push(now);
  }
}

interface HttpClient {
  http: AxiosInstance;
  rateLimiter: RateLimiter;
}

export class NIMClient {
  private readonly httpClient: HttpClient;

  constructor() {
    this.httpClient = this.createHttpClient();

    logger.info("NIMClient initialized", {
      baseUrl: config.NVIDIA_NIM_BASE_URL,
    });
  }

  private createHttpClient(): HttpClient {
    const rateLimiter = new RateLimiter(config.MAX_REQUESTS_PER_MINUTE);

    const http = axios.create({
      baseURL: config.NVIDIA_NIM_BASE_URL,
      timeout: config.REQUEST_TIMEOUT_MS,
      headers: {
        Authorization: `Bearer ${config.NVIDIA_API_KEY}`,
        "Content-Type": "application/json",
        "User-Agent": `${config.MCP_SERVER_NAME}/${config.MCP_SERVER_VERSION}`,
      },
    });

    axiosRetry(http, {
      retries: config.MAX_RETRIES,
      retryDelay: (retryCount) => {
        const delay = config.RETRY_DELAY_MS * Math.pow(2, retryCount - 1);
        logger.warn(`Retry attempt ${retryCount}, waiting ${delay}ms`);
        return delay;
      },
      retryCondition: (error: AxiosError) => {
        const status = error.response?.status;
        return (
          axiosRetry.isNetworkError(error) ||
          status === 429 ||
          (status !== undefined && status >= 500)
        );
      },
      onRetry: (retryCount, error) => {
        logger.warn(`Retrying request (${retryCount}/${config.MAX_RETRIES})`, {
          status: (error as AxiosError).response?.status,
          message: error.message,
        });
      },
    });

    http.interceptors.request.use((req) => {
      logger.debug("NIM API request", {
        method: req.method?.toUpperCase(),
        url: req.url,
        model: (req.data as Record<string, unknown>)?.model,
      });
      return req;
    });

    http.interceptors.response.use(
      (res) => {
        logger.debug("NIM API response", {
          status: res.status,
          usage: (res.data as Record<string, unknown>)?.usage,
        });
        return res;
      },
      (err: AxiosError) => {
        logger.error("NIM API error", {
          status: err.response?.status,
          data: err.response?.data,
          message: err.message,
        });
        return Promise.reject(this.normalizeError(err));
      }
    );

    return { http, rateLimiter };
  }

  private normalizeError(error: AxiosError): Error {
    const status = error.response?.status;
    const data = error.response?.data as Record<string, unknown> | undefined;
    const apiMsg =
      (data?.detail as string) ||
      (data?.message as string) ||
      error.message;

    if (status === 401) return new Error(`Authentication failed: ${apiMsg}`);
    if (status === 403) return new Error(`Authorization failed: ${apiMsg}`);
    if (status === 404) {
      const msg = `Model not found: ${apiMsg}. ` +
        `Note: Image generation models (SDXL, FLUX, SD3) are not deployed on the free integration endpoint. ` +
        `They require dedicated GPU instances (H100/B200). ` +
        `Use a self-hosted NIM or check https://build.nvidia.com for available models.`;
      return new Error(msg);
    }
    if (status === 422) return new Error(`Invalid request: ${apiMsg}`);
    if (status === 429) return new Error(`Rate limit exceeded: ${apiMsg}`);
    if (status && status >= 500)
      return new Error(`NVIDIA NIM server error (${status}): ${apiMsg}`);
    return new Error(`NIM API error: ${apiMsg}`);
  }

  async chatCompletion(
    request: ChatCompletionRequest
  ): Promise<ChatCompletionResponse> {
    await this.httpClient.rateLimiter.acquire();

    const payload: ChatCompletionRequest = {
      temperature: config.DEFAULT_TEMPERATURE,
      top_p: config.DEFAULT_TOP_P,
      max_tokens: Math.min(
        request.max_tokens ?? config.DEFAULT_MAX_TOKENS,
        config.MAX_TOKENS_PER_REQUEST
      ),
      ...request,
      stream: false,
    };

    const { data } = await this.httpClient.http.post<ChatCompletionResponse>(
      "/chat/completions",
      payload
    );
    return data;
  }

  async embeddings(
    request: EmbeddingRequest
  ): Promise<EmbeddingResponse> {
    await this.httpClient.rateLimiter.acquire();
    const { data } = await this.httpClient.http.post<EmbeddingResponse>(
      "/embeddings",
      request
    );
    return data;
  }

  async rerank(
    request: RerankRequest
  ): Promise<RerankResponse> {
    await this.httpClient.rateLimiter.acquire();
    const { data } = await this.httpClient.http.post<RerankResponse>(
      "/ranking",
      request
    );
    return data;
  }

  async generateImage(
    request: ImageGenerationRequest
  ): Promise<ImageGenerationResponse> {
    await this.httpClient.rateLimiter.acquire();

    const payload = {
      ...request,
      response_format: request.response_format ?? "url",
      width: request.width ?? 1024,
      height: request.height ?? 1024,
      num_images: request.num_images ?? 1,
      steps: request.steps ?? 20,
      cfg_scale: request.cfg_scale ?? 7.0,
    };

    const { data } = await this.httpClient.http.post<ImageGenerationResponse>(
      "/images/generations",
      payload,
      {
        timeout: config.IMAGE_GENERATION_TIMEOUT_MS,
      }
    );
    return data;
  }

  // ─── FLUX.1-schnell (AI Foundation Models) ──────────────────────────────────
  async generateImageFluxSchnell(request: {
    prompt: string;
    width?: number;
    height?: number;
    seed?: number;
    steps?: number;
  }): Promise<ImageGenerationResponse> {
    await this.httpClient.rateLimiter.acquire();

    const payload = {
      prompt: request.prompt,
      width: request.width ?? 1024,
      height: request.height ?? 1024,
      seed: request.seed ?? 0,
      steps: 4, // FLUX Schnell is fixed at 4 steps
    };

    const modelId = config.DEFAULT_FLUX_SCHNELL_MODEL;
    const url = `${config.NVIDIA_AI_FOUNDATION_URL}/${modelId}`;

    logger.debug("FLUX Schnell request", { prompt: request.prompt, width: payload.width, height: payload.height });

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${config.NVIDIA_API_KEY}`,
        "Accept": "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(config.IMAGE_GENERATION_TIMEOUT_MS),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error("FLUX Schnell API error", { status: response.status, error: errorText });
      throw new Error(`FLUX Schnell API error (${response.status}): ${errorText}`);
    }

    const data = await response.json() as {
      images?: Array<{ b64_json: string; seed: number }>;
      image?: { b64_json: string; seed: number };
      seed: number;
      data?: Array<{ b64_json: string; seed: number }>;
      artifacts?: Array<{ base64: string; seed: number }>;
      [key: string]: unknown;
    };

    logger.debug("FLUX Schnell response", { keys: Object.keys(data), hasImages: !!data.images, hasImage: !!data.image, hasData: !!data.data, hasArtifacts: !!data.artifacts, dataType: typeof data.data, imagesType: typeof data.images });

    // Handle different response formats
    const images = data.images ?? data.data ?? data.artifacts ?? (data.image ? [data.image] : []);

    return {
      created: Date.now(),
      model: modelId,
      data: images.map((img) => ({
        b64_json: img.b64_json ?? img.base64,
        revised_prompt: request.prompt,
      })),
      usage: { total_images: images.length },
    };
  }

  // ─── FLUX.1-kontext-dev (AI Foundation Models) ──────────────────────────────
  async generateImageFluxKontext(request: {
    prompt: string;
    image: string; // base64 data URL
    aspect_ratio?: string;
    steps?: number;
    cfg_scale?: number;
    seed?: number;
  }): Promise<ImageGenerationResponse> {
    await this.httpClient.rateLimiter.acquire();

    const payload = {
      prompt: request.prompt,
      image: request.image,
      aspect_ratio: request.aspect_ratio ?? "match_input_image",
      steps: request.steps ?? 30,
      cfg_scale: request.cfg_scale ?? 3.5,
      seed: request.seed ?? 0,
    };

    const modelId = config.DEFAULT_FLUX_KONTEXT_MODEL;
    const url = `${config.NVIDIA_AI_FOUNDATION_URL}/${modelId}`;

    logger.debug("FLUX Kontext request", { prompt: request.prompt, aspect_ratio: payload.aspect_ratio, steps: payload.steps });

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${config.NVIDIA_API_KEY}`,
        "Accept": "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(config.IMAGE_GENERATION_TIMEOUT_MS),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error("FLUX Kontext API error", { status: response.status, error: errorText });
      throw new Error(`FLUX Kontext API error (${response.status}): ${errorText}`);
    }

    const data = await response.json() as {
      images?: Array<{ b64_json: string; seed: number }>;
      image?: { b64_json: string; seed: number };
      seed: number;
      data?: Array<{ b64_json: string; seed: number }>;
      artifacts?: Array<{ base64: string; seed: number }>;
      [key: string]: unknown;
    };

    logger.debug("FLUX Kontext response", { keys: Object.keys(data), hasImages: !!data.images, hasImage: !!data.image, hasData: !!data.data, hasArtifacts: !!data.artifacts });

    // Handle different response formats
    const images = data.images ?? data.data ?? data.artifacts ?? (data.image ? [data.image] : []);

    return {
      created: Date.now(),
      model: modelId,
      data: images.map((img) => ({
        b64_json: img.b64_json ?? img.base64,
        revised_prompt: request.prompt,
      })),
      usage: { total_images: images.length },
    };
  }

  async analyzeImage(
    request: ImageAnalysisRequest
  ): Promise<ChatCompletionResponse> {
    await this.httpClient.rateLimiter.acquire();

    const payload = {
      ...request,
      stream: false,
    };

    const { data } = await this.httpClient.http.post<ChatCompletionResponse>(
      "/chat/completions",
      payload
    );
    return data;
  }

  async listModels(): Promise<string[]> {
    await this.httpClient.rateLimiter.acquire();
    try {
      const { data } = await this.httpClient.http.get<{ data: Array<{ id: string }> }>(
        "/models"
      );
      return data.data.map((m) => m.id);
    } catch {
      return Object.keys(NIM_MODELS_EXPORT);
    }
  }
}

import { NIM_MODELS as NIM_MODELS_EXPORT } from "./models.js";