import { NIMClient, ChatMessage, ImageGenerationRequest, ImageAnalysisRequest } from "./client.js";
import { NIM_MODELS, getModelsByCategory, getModel } from "./models.js";
import { getConfig } from "./config.js";
import { logger } from "./logger.js";
import {
  ChatCompletionSchema,
  TextGenerationSchema,
  EmbeddingsSchema,
  RerankSchema,
  FunctionCallingSchema,
  ListModelsSchema,
  ModelInfoSchema,
  ImageGenerationSchema,
  ImageAnalysisSchema,
  MultimodalTaskSchema,
  CompareModelsSchema,
} from "./tools.js";
import { z } from "zod";
import { writeFileSync, mkdirSync, existsSync } from "fs";
import { dirname, resolve } from "path";

const config = getConfig();

export type ToolResult =
  | { content: Array<{ type: "text"; text: string }>; isError?: false }
  | { content: Array<{ type: "text"; text: string }>; isError: true };

function ok(data: unknown): ToolResult {
  return {
    content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
  };
}

function err(message: string): ToolResult {
  return {
    content: [{ type: "text", text: `Error: ${message}` }],
    isError: true,
  };
}

// Extended schema for FLUX Kontext (image-to-image)
const FluxKontextSchema = ImageGenerationSchema.extend({
  image: z.string().optional().describe("Base64 data URL of input image (required for FLUX Kontext)"),
  aspect_ratio: z.string().optional().describe("Aspect ratio for output (e.g., 'match_input_image', '1:1', '16:9')"),
  // File save options
  save_path: z.string().optional().describe("Optional file path to save the generated image as PNG (e.g., './output/image.png' or '/absolute/path/image.png')"),
  save_filename: z.string().optional().describe("Optional filename (without extension) to auto-generate path in current directory"),
});

// Helper function to save base64 image as PNG file
function saveBase64Image(base64: string, savePath?: string, saveFilename?: string): { path: string; absolutePath: string } | null {
  if (!savePath && !saveFilename) {
    return null;
  }

  let filePath: string;
  if (savePath) {
    filePath = resolve(savePath);
  } else {
    const timestamp = Date.now();
    const filename = `${saveFilename || `generated_${timestamp}`}.png`;
    filePath = resolve(process.cwd(), filename);
  }

  // Ensure directory exists
  const dir = dirname(filePath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  // Remove data URL prefix if present
  const base64Data = base64.replace(/^data:image\/[a-z]+;base64,/, "");
  const buffer = Buffer.from(base64Data, "base64");
  
  writeFileSync(filePath, buffer);
  
  return {
    path: filePath,
    absolutePath: filePath,
  };
}

export class ToolHandlers {
  constructor(private readonly client: NIMClient) {}

  async handle(toolName: string, rawArgs: unknown): Promise<ToolResult> {
    const start = Date.now();
    logger.info(`Executing tool: ${toolName}`);

    try {
      let result: ToolResult;

      switch (toolName) {
        case "chat_completion":
          result = await this.chatCompletion(rawArgs);
          break;
        case "text_generation":
          result = await this.textGeneration(rawArgs);
          break;
        case "create_embeddings":
          result = await this.createEmbeddings(rawArgs);
          break;
        case "rerank_passages":
          result = await this.rerankPassages(rawArgs);
          break;
        case "function_calling":
          result = await this.functionCalling(rawArgs);
          break;
        case "list_models":
          result = await this.listModels(rawArgs);
          break;
        case "get_model_info":
          result = await this.getModelInfo(rawArgs);
          break;
        case "generate_image":
          result = await this.generateImage(rawArgs);
          break;
        case "analyze_image":
          result = await this.analyzeImage(rawArgs);
          break;
        case "multimodal_task":
          result = await this.multimodalTask(rawArgs);
          break;
        case "compare_models":
          result = await this.compareModels(rawArgs);
          break;
        default:
          result = err(`Unknown tool: ${toolName}`);
      }

      logger.info(`Tool ${toolName} completed in ${Date.now() - start}ms`);
      return result;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      logger.error(`Tool ${toolName} failed: ${msg}`, { error: e });
      return err(msg);
    }
  }

  // ─── Handlers ─────────────────────────────────────────────────────────────

  private async chatCompletion(rawArgs: unknown): Promise<ToolResult> {
    const args = ChatCompletionSchema.parse(rawArgs);
    const model = args.model ?? config.DEFAULT_MODEL;

    const messages: ChatMessage[] = args.messages.map(msg => ({
      role: msg.role,
      content: msg.content
    }));
    if (args.system_prompt) {
      messages.unshift({ role: "system", content: args.system_prompt });
    }

    const response = await this.client.chatCompletion({
      model,
      messages,
      temperature: args.temperature,
      top_p: args.top_p,
      max_tokens: args.max_tokens,
      stop: args.stop,
      frequency_penalty: args.frequency_penalty,
      presence_penalty: args.presence_penalty,
      seed: args.seed,
    });

    return ok({
      id: response.id,
      model: response.model,
      content: response.choices[0].message.content,
      finish_reason: response.choices[0].finish_reason,
      usage: response.usage,
    });
  }

  private async textGeneration(rawArgs: unknown): Promise<ToolResult> {
    const args = TextGenerationSchema.parse(rawArgs);
    const model = args.model ?? config.DEFAULT_MODEL;

    const messages: ChatMessage[] = [];
    if (args.system_prompt) {
      messages.push({ role: "system", content: args.system_prompt });
    }
    messages.push({ role: "user", content: args.prompt });

    const response = await this.client.chatCompletion({
      model,
      messages,
      temperature: args.temperature,
      max_tokens: args.max_tokens,
      stop: args.stop,
    });

    return ok({
      model: response.model,
      text: response.choices[0].message.content,
      finish_reason: response.choices[0].finish_reason,
      usage: response.usage,
    });
  }

  private async createEmbeddings(rawArgs: unknown): Promise<ToolResult> {
    const args = EmbeddingsSchema.parse(rawArgs);
    const model = args.model ?? "nvidia/nv-embed-v1";

    const response = await this.client.embeddings({
      model,
      input: args.input,
      encoding_format: args.encoding_format,
      truncate: args.truncate,
    });

    const inputs = Array.isArray(args.input) ? args.input : [args.input];
    return ok({
      model: response.model,
      embeddings: response.data.map((d, i) => ({
        index: d.index,
        text: inputs[i],
        dimensions: d.embedding.length,
        embedding: d.embedding,
      })),
      usage: response.usage,
    });
  }

  private async rerankPassages(rawArgs: unknown): Promise<ToolResult> {
    const args = RerankSchema.parse(rawArgs);
    const model = args.model ?? "nvidia/nv-rerankqa-mistral-4b-v3";

    // Normalize passages
    const passages = args.passages.map((p) =>
      typeof p === "string" ? { text: p } : { text: p.text }
    );

    const response = await this.client.rerank({
      model,
      query: args.query,
      passages,
      truncate: args.truncate,
    });

    let rankings = response.rankings;
    if (args.top_k) {
      rankings = rankings.slice(0, args.top_k);
    }

    return ok({
      query: args.query,
      model,
      rankings: rankings.map((r) => ({
        rank: rankings.indexOf(r) + 1,
        original_index: r.index,
        score: r.logit,
        text: r.passage.text,
      })),
      usage: response.usage,
    });
  }

  private async functionCalling(rawArgs: unknown): Promise<ToolResult> {
    const args = FunctionCallingSchema.parse(rawArgs);
    const model = args.model ?? config.DEFAULT_MODEL;

    const response = await this.client.chatCompletion({
      model,
      messages: args.messages.map(msg => ({
        role: msg.role,
        content: msg.content
      })) as ChatMessage[],
      tools: args.tools.map(tool => ({
        type: tool.type,
        function: {
          name: tool.function.name,
          description: tool.function.description,
          parameters: tool.function.parameters
        }
      })),
      tool_choice: args.tool_choice as never,
      temperature: args.temperature,
      max_tokens: args.max_tokens,
    });

    const choice = response.choices[0];

    return ok({
      model: response.model,
      finish_reason: choice.finish_reason,
      message: choice.message.content,
      tool_calls: choice.message.tool_calls?.map((tc) => ({
        id: tc.id,
        function: tc.function.name,
        arguments: (() => {
          try {
            return JSON.parse(tc.function.arguments);
          } catch {
            return tc.function.arguments;
          }
        })(),
      })),
      usage: response.usage,
    });
  }

  private async generateImage(rawArgs: unknown): Promise<ToolResult> {
    if (!config.ENABLE_IMAGE_GENERATION) {
      return err("Image generation is disabled. Set ENABLE_IMAGE_GENERATION=true to enable.");
    }

    const args = ImageGenerationSchema.parse(rawArgs);
    const model = args.model ?? config.DEFAULT_IMAGE_MODEL;

    // Route to appropriate backend based on model
    const isFluxSchnell = model === "black-forest-labs/flux.1-schnell" || model === config.DEFAULT_FLUX_SCHNELL_MODEL;
    const isFluxKontext = model === "black-forest-labs/flux.1-kontext-dev" || model === config.DEFAULT_FLUX_KONTEXT_MODEL;

    // FLUX.1-schnell: Fast text-to-image via AI Foundation
    if (isFluxSchnell) {
      const fluxArgs = FluxKontextSchema.parse(rawArgs); // Reuse schema, image is optional
      const response = await this.client.generateImageFluxSchnell({
        prompt: fluxArgs.prompt,
        width: fluxArgs.width,
        height: fluxArgs.height,
        seed: fluxArgs.seed,
      });

      const images = response.data.map((img, idx) => {
        const saved = saveBase64Image(img.b64_json, fluxArgs.save_path, fluxArgs.save_filename);
        return {
          index: idx,
          b64_json: img.b64_json,
          revised_prompt: img.revised_prompt,
          saved_path: saved?.absolutePath,
        };
      });

      return ok({
        model: response.model,
        created: response.created,
        images,
        usage: response.usage,
      });
    }

    // FLUX.1-kontext-dev: Image-to-image editing via AI Foundation
    if (isFluxKontext) {
      const fluxArgs = FluxKontextSchema.parse(rawArgs);
      if (!fluxArgs.image) {
        return err("FLUX Kontext requires an 'image' parameter (base64 data URL of input image)");
      }

      const response = await this.client.generateImageFluxKontext({
        prompt: fluxArgs.prompt,
        image: fluxArgs.image,
        aspect_ratio: fluxArgs.aspect_ratio,
        steps: fluxArgs.steps,
        cfg_scale: fluxArgs.cfg_scale,
        seed: fluxArgs.seed,
      });

      const images = response.data.map((img, idx) => {
        const saved = saveBase64Image(img.b64_json, fluxArgs.save_path, fluxArgs.save_filename);
        return {
          index: idx,
          b64_json: img.b64_json,
          revised_prompt: img.revised_prompt,
          saved_path: saved?.absolutePath,
        };
      });

      return ok({
        model: response.model,
        created: response.created,
        images,
        usage: response.usage,
      });
    }

    // Self-hosted NIM (SDXL, SD3, flux.1-dev, etc.)
    if (!config.DEFAULT_IMAGE_MODEL && !args.model) {
      return err(
        "No default image generation model configured for self-hosted NIM. " +
        "Set DEFAULT_IMAGE_MODEL or specify a model explicitly."
      );
    }

    const request: ImageGenerationRequest = {
      model,
      prompt: args.prompt,
      negative_prompt: args.negative_prompt,
      width: args.width,
      height: args.height,
      num_images: args.num_images,
      steps: args.steps,
      cfg_scale: args.cfg_scale,
      seed: args.seed,
      sampler: args.sampler,
      scheduler: args.scheduler,
      response_format: args.response_format ?? "b64_json",
    };

    const response = await this.client.generateImage(request);

    const images = response.data.map((img, idx) => {
      const saved = saveBase64Image(img.b64_json ?? "", args.save_path, args.save_filename);
      return {
        index: idx,
        url: img.url,
        b64_json: img.b64_json,
        revised_prompt: img.revised_prompt,
        saved_path: saved?.absolutePath,
      };
    });

    return ok({
      model: response.model ?? model,
      created: response.created,
      images,
      usage: response.usage,
    });
  }

  private async analyzeImage(rawArgs: unknown): Promise<ToolResult> {
    if (!config.ENABLE_VISION) {
      return err("Vision capabilities are disabled. Set ENABLE_VISION=true to enable.");
    }

    const args = ImageAnalysisSchema.parse(rawArgs);
    const model = args.model ?? "meta/llama-3.2-90b-vision-instruct";

    const messages: ChatMessage[] = [
      {
        role: "user",
        content: [
          { type: "text", text: args.prompt },
          { type: "image_url", image_url: { url: args.image_url, detail: args.detail } },
        ],
      },
    ];

    if (args.system_prompt) {
      messages.unshift({ role: "system", content: args.system_prompt });
    }

    const request: ImageAnalysisRequest = {
      model,
      messages,
      temperature: args.temperature,
      top_p: args.top_p,
      max_tokens: args.max_tokens,
      stream: false,
    };

    const response = await this.client.analyzeImage(request);

    return ok({
      model: response.model,
      analysis: response.choices[0].message.content,
      finish_reason: response.choices[0].finish_reason,
      usage: response.usage,
    });
  }

  private async multimodalTask(rawArgs: unknown): Promise<ToolResult> {
    if (!config.ENABLE_MULTIMODAL) {
      return err("Multimodal capabilities are disabled. Set ENABLE_MULTIMODAL=true to enable.");
    }

    const args = MultimodalTaskSchema.parse(rawArgs);
    const model = args.model ?? "nvidia/neva-22b";

    const messages: ChatMessage[] = args.messages.map((msg) => {
      const content = typeof msg.content === "string"
        ? msg.content
        : msg.content.map((part) => {
            if (part.type === "text") {
              return { type: "text" as const, text: part.text ?? "" };
            }
            return {
              type: "image_url" as const,
              image_url: { url: part.image_url!.url, detail: part.image_url!.detail },
            };
          });
      return { role: msg.role, content };
    });

    const response = await this.client.chatCompletion(
      {
        model,
        messages,
        temperature: args.temperature,
        top_p: args.top_p,
        max_tokens: args.max_tokens,
        stream: args.stream,
      }
    );

    return ok({
      model: response.model,
      content: response.choices[0].message.content,
      finish_reason: response.choices[0].finish_reason,
      usage: response.usage,
    });
  }

  private async listModels(rawArgs: unknown): Promise<ToolResult> {
    const args = ListModelsSchema.parse(rawArgs);

    let models;
    if (args.category === "all") {
      models = Object.values(NIM_MODELS);
    } else {
      models = getModelsByCategory(args.category as any);
    }

    // Apply additional filters
    if (args.commercial_use !== undefined) {
      models = models.filter((m) => m.commercialUse === args.commercial_use);
    }
    if (args.supports_reasoning !== undefined) {
      models = models.filter((m) => m.supportsReasoning === args.supports_reasoning);
    }
    if (args.supports_vision !== undefined) {
      models = models.filter((m) => m.supportsVision === args.supports_vision);
    }
    if (args.supports_function_calling !== undefined) {
      models = models.filter((m) => m.supportsFunctionCalling === args.supports_function_calling);
    }
    if (args.supports_multimodal !== undefined) {
      models = models.filter((m) => m.supportsMultimodalInput === args.supports_multimodal);
    }
    if (args.min_context_length !== undefined) {
      models = models.filter((m) => m.contextLength >= args.min_context_length!);
    }
    if (args.tags && args.tags.length > 0) {
      models = models.filter((m) => m.tags?.some((t) => args.tags!.includes(t)));
    }
    if (args.hardware && args.hardware.length > 0) {
      models = models.filter((m) => m.supportedHardware?.some((h) => args.hardware!.includes(h)));
    }

    const modelList = models.map((m) => {
      const base = {
        id: m.id,
        name: m.name,
        category: m.category,
        description: m.description,
        context_length: m.contextLength,
        supports_streaming: m.supportsStreaming,
        supports_function_calling: m.supportsFunctionCalling,
        supports_vision: m.supportsVision ?? false,
        supports_image_generation: m.supportsImageGeneration ?? false,
        supports_multimodal: m.supportsMultimodalInput ?? false,
        supports_reasoning: m.supportsReasoning ?? false,
        commercial_use: m.commercialUse,
        license: m.license,
        tags: m.tags ?? [],
        min_gpu_requirements: m.minGpuRequirements ?? [],
        supported_hardware: m.supportedHardware ?? [],
        runtime_engines: m.runtimeEngines ?? [],
      };

      if (args.include_details) {
        return {
          ...base,
          max_tokens: m.maxTokens,
          output_max_tokens: m.outputMaxTokens,
          recommended_use_cases: m.recommendedUseCases ?? getUseCases(m.category),
          parameters: m.parameters,
          image_gen_specs: m.imageGenSpecs,
          benchmarks: m.benchmarks,
          deployment_notes: m.deploymentNotes,
          supports_structured_output: m.supportsStructuredOutput,
          reasoning_modes: m.reasoningModes,
          supported_languages: m.supportedLanguages,
          supports_video_input: m.supportsVideoInput,
        };
      }
      return base;
    });

    return ok({
      total: modelList.length,
      category: args.category,
      models: modelList,
    });
  }

  private async getModelInfo(rawArgs: unknown): Promise<ToolResult> {
    const args = ModelInfoSchema.parse(rawArgs);
    const model = getModel(args.model_id);

    if (!model) {
      return err(
        `Model '${args.model_id}' not found in catalog. Use list_models to see available models.`
      );
    }

    return ok({
      id: model.id,
      name: model.name,
      category: model.category,
      description: model.description,
      context_length: model.contextLength,
      supports_streaming: model.supportsStreaming,
      supports_function_calling: model.supportsFunctionCalling,
      supports_vision: model.supportsVision ?? false,
      supports_image_generation: model.supportsImageGeneration ?? false,
      supports_multimodal: model.supportsMultimodalInput ?? false,
      supports_reasoning: model.supportsReasoning ?? false,
      commercial_use: model.commercialUse,
      license: model.license,
      third_party_model: model.thirdPartyModel,
      max_tokens: model.maxTokens,
      output_max_tokens: model.outputMaxTokens,
      recommended_use_cases: model.recommendedUseCases ?? getUseCases(model.category),
      parameters: model.parameters,
      image_gen_specs: model.imageGenSpecs,
      benchmarks: model.benchmarks,
      deployment_notes: model.deploymentNotes,
      min_gpu_requirements: model.minGpuRequirements,
      supported_hardware: model.supportedHardware,
      runtime_engines: model.runtimeEngines,
      tags: model.tags,
      supports_structured_output: model.supportsStructuredOutput,
      reasoning_modes: model.reasoningModes,
      supported_languages: model.supportedLanguages,
      supports_video_input: model.supportsVideoInput,
    });
  }

  private async compareModels(rawArgs: unknown): Promise<ToolResult> {
    const args = CompareModelsSchema.parse(rawArgs);
    const models = args.model_ids.map((id) => getModel(id)).filter((m): m is NonNullable<typeof m> => m !== undefined);

    if (models.length !== args.model_ids.length) {
      const foundIds = models.map((m) => m.id);
      const missingIds = args.model_ids.filter((id) => !foundIds.includes(id));
      return err(`Models not found: ${missingIds.join(", ")}`);
    }

    if (models.length < 2) {
      return err("At least 2 valid models required for comparison");
    }

    const comparison = models.map((m) => ({
      id: m.id,
      name: m.name,
      category: m.category,
      description: m.description,
      context_length: m.contextLength,
      max_tokens: m.maxTokens,
      output_max_tokens: m.outputMaxTokens,
      license: m.license,
      commercial_use: m.commercialUse,
      third_party_model: m.thirdPartyModel,
      min_gpu_requirements: m.minGpuRequirements,
      supported_hardware: m.supportedHardware,
      runtime_engines: m.runtimeEngines,
      supports_streaming: m.supportsStreaming,
      supports_function_calling: m.supportsFunctionCalling,
      supports_vision: m.supportsVision ?? false,
      supports_image_generation: m.supportsImageGeneration ?? false,
      supports_multimodal: m.supportsMultimodalInput ?? false,
      supports_video_input: m.supportsVideoInput ?? false,
      supports_reasoning: m.supportsReasoning ?? false,
      reasoning_modes: m.reasoningModes,
      supports_structured_output: m.supportsStructuredOutput,
      tags: m.tags,
      benchmarks: m.benchmarks,
      image_gen_specs: m.imageGenSpecs,
      supported_languages: m.supportedLanguages,
    }));

    return ok({
      compared_models: comparison.length,
      models: comparison,
    });
  }
}

function getUseCases(category: string): string[] {
  const useCases: Record<string, string[]> = {
    language: ["Chat", "Summarization", "Translation", "Q&A", "Content generation"],
    embedding: ["Semantic search", "RAG", "Clustering", "Similarity comparison"],
    reranking: ["RAG re-ranking", "Search quality improvement", "Relevance scoring"],
    vision: ["Image understanding", "Visual Q&A", "Document analysis"],
    code: ["Code generation", "Code review", "Debugging", "Documentation"],
    multimodal: ["Multi-modal tasks", "Image + text processing"],
    image_generation: ["Artistic creation", "Concept art", "Marketing materials", "Product visualization"],
  };
  return useCases[category] ?? [];
}
