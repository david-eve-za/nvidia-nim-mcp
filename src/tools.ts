import { z } from "zod";

// ─── Shared Schemas ───────────────────────────────────────────────────────────

export const ChatMessageSchema = z.object({
  role: z.enum(["system", "user", "assistant"]),
  content: z.string(),
});

export const ToolFunctionSchema = z.object({
  name: z.string().min(1).max(64),
  description: z.string(),
  parameters: z.record(z.unknown()),
});

export const ToolSchema = z.object({
  type: z.literal("function"),
  function: ToolFunctionSchema,
});

// ─── Tool Schemas ─────────────────────────────────────────────────────────────

export const ChatCompletionSchema = z.object({
  model: z.string().optional().describe("NIM model ID. Defaults to configured default."),
  messages: z.array(ChatMessageSchema).min(1).describe("Conversation messages"),
  system_prompt: z.string().optional().describe("System prompt (prepended automatically)"),
  temperature: z.number().min(0).max(2).optional().describe("Sampling temperature (0-2)"),
  top_p: z.number().min(0).max(1).optional().describe("Nucleus sampling parameter"),
  max_tokens: z.number().int().positive().max(131072).optional().describe("Max tokens to generate"),
  stop: z.union([z.string(), z.array(z.string())]).optional().describe("Stop sequences"),
  frequency_penalty: z.number().min(-2).max(2).optional(),
  presence_penalty: z.number().min(-2).max(2).optional(),
  seed: z.number().int().optional().describe("Seed for reproducibility"),
});

export const TextGenerationSchema = z.object({
  model: z.string().optional(),
  prompt: z.string().min(1).describe("The text prompt to complete"),
  system_prompt: z.string().optional().describe("Optional system context"),
  temperature: z.number().min(0).max(2).optional(),
  max_tokens: z.number().int().positive().max(131072).optional(),
  stop: z.union([z.string(), z.array(z.string())]).optional(),
});

export const EmbeddingsSchema = z.object({
  model: z.string().optional().describe("Embedding model ID"),
  input: z.union([z.string(), z.array(z.string())]).describe("Text(s) to embed"),
  encoding_format: z.enum(["float", "base64"]).optional().default("float"),
  truncate: z.enum(["NONE", "START", "END"]).optional().default("END"),
});

export const RerankSchema = z.object({
  model: z.string().optional().describe("Reranking model ID"),
  query: z.string().min(1).describe("The search query"),
  passages: z
    .array(z.union([z.string(), z.object({ text: z.string() })]))
    .min(1)
    .max(100)
    .describe("Passages to rerank"),
  top_k: z.number().int().positive().optional().describe("Return top K results"),
  truncate: z.enum(["NONE", "END"]).optional().default("END"),
});

export const FunctionCallingSchema = z.object({
  model: z.string().optional(),
  messages: z.array(ChatMessageSchema).min(1),
  tools: z.array(ToolSchema).min(1).describe("Available tools/functions"),
  tool_choice: z
    .union([
      z.enum(["auto", "none"]),
      z.object({
        type: z.literal("function"),
        function: z.object({ name: z.string() }),
      }),
    ])
    .optional()
    .default("auto"),
  temperature: z.number().min(0).max(2).optional(),
  max_tokens: z.number().int().positive().optional(),
});

export const ImageGenerationSchema = z.object({
  model: z.string().optional().describe("Image generation model ID"),
  prompt: z.string().min(1).describe("Text prompt for image generation"),
  negative_prompt: z.string().optional().describe("Negative prompt to avoid certain features"),
  width: z.number().int().positive().max(2048).optional().default(1024).describe("Image width"),
  height: z.number().int().positive().max(2048).optional().default(1024).describe("Image height"),
  num_images: z.number().int().positive().max(4).optional().default(1).describe("Number of images to generate"),
  steps: z.number().int().positive().max(100).optional().default(20).describe("Number of diffusion steps"),
  cfg_scale: z.number().positive().max(20).optional().default(7.0).describe("Classifier-free guidance scale"),
  seed: z.number().int().optional().describe("Seed for reproducibility"),
  sampler: z.string().optional().describe("Sampler algorithm (e.g., euler, euler_a, dpmpp_2m)"),
  scheduler: z.string().optional().describe("Scheduler type (e.g., karras, exponential, simple)"),
  response_format: z.enum(["url", "b64_json"]).optional().default("url").describe("Response format"),
});

export const ImageAnalysisSchema = z.object({
  model: z.string().optional().describe("Vision/multimodal model ID"),
  image_url: z.string().url().describe("URL of the image to analyze"),
  prompt: z.string().min(1).describe("Analysis prompt or question about the image"),
  system_prompt: z.string().optional().describe("System prompt for the analysis"),
  temperature: z.number().min(0).max(2).optional().default(0.3).describe("Sampling temperature"),
  top_p: z.number().min(0).max(1).optional().default(0.95).describe("Nucleus sampling parameter"),
  max_tokens: z.number().int().positive().max(4096).optional().default(1024).describe("Max tokens in response"),
  detail: z.enum(["low", "high", "auto"]).optional().default("auto").describe("Image detail level"),
});

export const MultimodalTaskSchema = z.object({
  model: z.string().optional().describe("Multimodal model ID"),
  messages: z.array(z.object({
    role: z.enum(["system", "user", "assistant"]),
    content: z.union([
      z.string(),
      z.array(z.object({
        type: z.enum(["text", "image_url"]),
        text: z.string().optional(),
        image_url: z.object({
          url: z.string().url(),
          detail: z.enum(["low", "high", "auto"]).optional(),
        }).optional(),
      })),
    ]),
  })).min(1).describe("Conversation messages with optional images"),
  temperature: z.number().min(0).max(2).optional().default(0.3),
  top_p: z.number().min(0).max(1).optional().default(0.95),
  max_tokens: z.number().int().positive().max(4096).optional().default(2048),
  stream: z.boolean().optional().default(false),
});

export const ListModelsSchema = z.object({
  category: z
    .enum(["language", "embedding", "reranking", "vision", "code", "multimodal", "image_generation", "all"])
    .optional()
    .default("all")
    .describe("Filter models by category"),
  include_details: z.boolean().optional().default(false).describe("Include detailed model metadata"),
  commercial_use: z.boolean().optional().describe("Filter by commercial license availability"),
  supports_reasoning: z.boolean().optional().describe("Filter by reasoning capability"),
  supports_vision: z.boolean().optional().describe("Filter by vision capability"),
  supports_function_calling: z.boolean().optional().describe("Filter by function calling capability"),
  supports_multimodal: z.boolean().optional().describe("Filter by multimodal input capability"),
  min_context_length: z.number().int().positive().optional().describe("Minimum context length in tokens"),
  tags: z.array(z.string()).optional().describe("Filter by use case tags"),
  hardware: z.array(z.string()).optional().describe("Filter by GPU hardware type (e.g., Hopper, Blackwell, Ampere)"),
});

export const ModelInfoSchema = z.object({
  model_id: z.string().describe("The model ID to get info about"),
});

export const CompareModelsSchema = z.object({
  model_ids: z.array(z.string()).min(2).max(5).describe("Array of 2-5 model IDs to compare"),
});

// ─── Tool Definitions ─────────────────────────────────────────────────────────

export const TOOL_DEFINITIONS = [
  {
    name: "chat_completion",
    description:
      "Send a multi-turn conversation to a NVIDIA NIM language model and receive a completion. Supports all major open-source LLMs including Llama 3.1, Mistral, Gemma, Qwen, and more.",
    inputSchema: {
      type: "object",
      properties: {
        model: { type: "string", description: "NIM model ID (optional, uses default if not set)" },
        messages: {
          type: "array",
          items: {
            type: "object",
            properties: {
              role: { type: "string", enum: ["system", "user", "assistant"] },
              content: { type: "string" },
            },
            required: ["role", "content"],
          },
          minItems: 1,
        },
        system_prompt: { type: "string", description: "System prompt to prepend" },
        temperature: { type: "number", minimum: 0, maximum: 2 },
        top_p: { type: "number", minimum: 0, maximum: 1 },
        max_tokens: { type: "integer", minimum: 1, maximum: 131072 },
        stop: { oneOf: [{ type: "string" }, { type: "array", items: { type: "string" } }] },
        seed: { type: "integer" },
      },
      required: ["messages"],
    },
  },
  {
    name: "text_generation",
    description:
      "Generate text from a single prompt (simplified interface). Ideal for one-shot tasks like summarization, translation, extraction, or Q&A.",
    inputSchema: {
      type: "object",
      properties: {
        model: { type: "string" },
        prompt: { type: "string", description: "Text prompt" },
        system_prompt: { type: "string" },
        temperature: { type: "number", minimum: 0, maximum: 2 },
        max_tokens: { type: "integer", minimum: 1, maximum: 131072 },
        stop: { oneOf: [{ type: "string" }, { type: "array", items: { type: "string" } }] },
      },
      required: ["prompt"],
    },
  },
  {
    name: "create_embeddings",
    description:
      "Convert text(s) into vector embeddings using NVIDIA NIM embedding models. Useful for semantic search, RAG, clustering, and similarity comparisons.",
    inputSchema: {
      type: "object",
      properties: {
        model: { type: "string", description: "Embedding model ID (e.g. nvidia/nv-embed-v1)" },
        input: {
          oneOf: [{ type: "string" }, { type: "array", items: { type: "string" } }],
          description: "Text or list of texts to embed",
        },
        encoding_format: { type: "string", enum: ["float", "base64"] },
        truncate: { type: "string", enum: ["NONE", "START", "END"] },
      },
      required: ["input"],
    },
  },
  {
    name: "rerank_passages",
    description:
      "Rerank a list of passages by relevance to a query using NVIDIA NIM reranking models. Essential for RAG pipelines to improve retrieval quality.",
    inputSchema: {
      type: "object",
      properties: {
        model: { type: "string", description: "Reranking model ID" },
        query: { type: "string", description: "Search query" },
        passages: {
          type: "array",
          items: { oneOf: [{ type: "string" }, { type: "object", properties: { text: { type: "string" } }, required: ["text"] }] },
          minItems: 1,
          maxItems: 100,
        },
        top_k: { type: "integer", minimum: 1, description: "Return top K results" },
        truncate: { type: "string", enum: ["NONE", "END"] },
      },
      required: ["query", "passages"],
    },
  },
  {
    name: "function_calling",
    description:
      "Use NIM models with tool/function calling capabilities. The model will decide which function to call and with what arguments.",
    inputSchema: {
      type: "object",
      properties: {
        model: { type: "string" },
        messages: {
          type: "array",
          items: {
            type: "object",
            properties: {
              role: { type: "string", enum: ["system", "user", "assistant"] },
              content: { type: "string" },
            },
            required: ["role", "content"],
          },
        },
        tools: {
          type: "array",
          items: {
            type: "object",
            properties: {
              type: { type: "string", enum: ["function"] },
              function: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  description: { type: "string" },
                  parameters: { type: "object" },
                },
                required: ["name", "description", "parameters"],
              },
            },
            required: ["type", "function"],
          },
        },
        tool_choice: {
          oneOf: [
            { type: "string", enum: ["auto", "none"] },
            { type: "object", properties: { type: { type: "string" }, function: { type: "object" } } },
          ],
        },
        temperature: { type: "number" },
        max_tokens: { type: "integer" },
      },
      required: ["messages", "tools"],
    },
  },
  {
    name: "get_model_info",
    description: "Get detailed information about a specific NVIDIA NIM model.",
    inputSchema: {
      type: "object",
      properties: {
        model_id: { type: "string", description: "The model ID" },
      },
      required: ["model_id"],
    },
  },
  {
    name: "generate_image",
    description:
      "Generate images from text prompts using NVIDIA NIM image generation models (Stable Diffusion XL, SDXL Turbo, SD3, FLUX.1). Supports various resolutions, samplers, and schedulers.",
    inputSchema: {
      type: "object",
      properties: {
        model: { type: "string", description: "Image generation model ID (e.g., nvidia/stable-diffusion-xl, nvidia/sdxl-turbo, stabilityai/sd-3-medium, black-forest-labs/flux.1-dev)" },
        prompt: { type: "string", description: "Text prompt describing the image to generate" },
        negative_prompt: { type: "string", description: "Negative prompt to avoid unwanted features" },
        width: { type: "integer", minimum: 64, maximum: 2048, default: 1024, description: "Image width in pixels" },
        height: { type: "integer", minimum: 64, maximum: 2048, default: 1024, description: "Image height in pixels" },
        num_images: { type: "integer", minimum: 1, maximum: 4, default: 1, description: "Number of images to generate" },
        steps: { type: "integer", minimum: 1, maximum: 100, default: 20, description: "Number of diffusion steps" },
        cfg_scale: { type: "number", minimum: 1, maximum: 20, default: 7.0, description: "Classifier-free guidance scale" },
        seed: { type: "integer", description: "Random seed for reproducibility" },
        sampler: { type: "string", description: "Sampler algorithm (e.g., euler, euler_a, dpmpp_2m, dpmpp_sde, ddim)" },
        scheduler: { type: "string", description: "Scheduler type (e.g., karras, exponential, simple, ddim_uniform)" },
        response_format: { type: "string", enum: ["url", "b64_json"], default: "url", description: "Response format: URL or base64 JSON" },
      },
      required: ["prompt"],
    },
  },
  {
    name: "analyze_image",
    description:
      "Analyze and describe images using NVIDIA NIM vision and multimodal models. Provide an image URL and a prompt/question to get detailed analysis, captioning, or visual Q&A.",
    inputSchema: {
      type: "object",
      properties: {
        model: { type: "string", description: "Vision/multimodal model ID (e.g., meta/llama-3.2-90b-vision-instruct, meta/llama-3.2-11b-vision-instruct, nvidia/neva-22b, microsoft/phi-3.5-vision-instruct)" },
        image_url: { type: "string", format: "uri", description: "URL of the image to analyze" },
        prompt: { type: "string", description: "Analysis prompt or question about the image (e.g., 'Describe this image', 'What objects are in this image?', 'Extract text from this image')" },
        system_prompt: { type: "string", description: "System prompt to guide the analysis" },
        temperature: { type: "number", minimum: 0, maximum: 2, default: 0.3, description: "Sampling temperature" },
        top_p: { type: "number", minimum: 0, maximum: 1, default: 0.95, description: "Nucleus sampling parameter" },
        max_tokens: { type: "integer", minimum: 1, maximum: 4096, default: 1024, description: "Maximum tokens in response" },
        detail: { type: "string", enum: ["low", "high", "auto"], default: "auto", description: "Image detail level for analysis" },
      },
      required: ["image_url", "prompt"],
    },
  },
  {
    name: "multimodal_task",
    description:
      "Perform multimodal tasks combining text and images. Send a conversation with mixed text and image content to multimodal models for complex reasoning across modalities.",
    inputSchema: {
      type: "object",
      properties: {
        model: { type: "string", description: "Multimodal model ID (e.g., nvidia/neva-22b, microsoft/phi-3.5-vision-instruct, meta/llama-3.2-90b-vision-instruct)" },
        messages: {
          type: "array",
          description: "Conversation messages with optional images. Each message can have text content or an array of text and image_url parts.",
          items: {
            type: "object",
            properties: {
              role: { type: "string", enum: ["system", "user", "assistant"] },
              content: {
                oneOf: [
                  { type: "string" },
                  {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        type: { type: "string", enum: ["text", "image_url"] },
                        text: { type: "string" },
                        image_url: {
                          type: "object",
                          properties: {
                            url: { type: "string", format: "uri" },
                            detail: { type: "string", enum: ["low", "high", "auto"] },
                          },
                        },
                      },
                    },
                  },
                ],
              },
            },
            required: ["role", "content"],
          },
          minItems: 1,
        },
        temperature: { type: "number", minimum: 0, maximum: 2, default: 0.3 },
        top_p: { type: "number", minimum: 0, maximum: 1, default: 0.95 },
        max_tokens: { type: "integer", minimum: 1, maximum: 4096, default: 2048 },
        stream: { type: "boolean", default: false },
      },
      required: ["messages"],
    },
  },
  {
    name: "list_models",
    description: "List available NVIDIA NIM models with detailed metadata for agent selection, optionally filtered by category (language, embedding, reranking, vision, code, multimodal, image_generation) and advanced filters.",
    inputSchema: {
      type: "object",
      properties: {
        category: {
          type: "string",
          enum: ["language", "embedding", "reranking", "vision", "code", "multimodal", "image_generation", "all"],
          default: "all",
          description: "Filter by model category",
        },
        include_details: { type: "boolean", default: false, description: "Include detailed model metadata for agent selection" },
        commercial_use: { type: "boolean", description: "Filter by commercial license availability" },
        supports_reasoning: { type: "boolean", description: "Filter by reasoning capability" },
        supports_vision: { type: "boolean", description: "Filter by vision capability" },
        supports_function_calling: { type: "boolean", description: "Filter by function calling capability" },
        supports_multimodal: { type: "boolean", description: "Filter by multimodal input capability" },
        min_context_length: { type: "integer", minimum: 1, description: "Minimum context length in tokens" },
        tags: { type: "array", items: { type: "string" }, description: "Filter by use case tags" },
        hardware: { type: "array", items: { type: "string" }, description: "Filter by GPU hardware type (e.g., Hopper, Blackwell, Ampere)" },
      },
    },
  },
  {
    name: "compare_models",
    description: "Compare 2-5 models side-by-side across key decision factors: licensing, hardware requirements, benchmarks, capabilities, and use case tags. Returns structured comparison table.",
    inputSchema: {
      type: "object",
      properties: {
        model_ids: {
          type: "array",
          items: { type: "string" },
          minItems: 2,
          maxItems: 5,
          description: "Array of 2-5 model IDs to compare (e.g., ['nvidia/nemotron-3-ultra-550b-a55b', 'deepseek-ai/deepseek-v4-pro', 'moonshotai/kimi-k2.6'])",
        },
      },
      required: ["model_ids"],
    },
  },
] as const;
