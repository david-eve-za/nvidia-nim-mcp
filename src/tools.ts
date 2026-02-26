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

export const ChatStreamSchema = ChatCompletionSchema;

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

export const ListModelsSchema = z.object({
  category: z
    .enum(["language", "embedding", "reranking", "vision", "code", "multimodal", "all"])
    .optional()
    .default("all")
    .describe("Filter models by category"),
});

export const ModelInfoSchema = z.object({
  model_id: z.string().describe("The model ID to get info about"),
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
    name: "list_models",
    description: "List available NVIDIA NIM models, optionally filtered by category (language, embedding, reranking, vision, code).",
    inputSchema: {
      type: "object",
      properties: {
        category: {
          type: "string",
          enum: ["language", "embedding", "reranking", "vision", "code", "multimodal", "all"],
          description: "Filter by model category",
        },
      },
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
] as const;
