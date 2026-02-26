import { NIMClient, ChatMessage } from "./client.js";
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
} from "./tools.js";

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

  private async listModels(rawArgs: unknown): Promise<ToolResult> {
    const args = ListModelsSchema.parse(rawArgs);

    let models;
    if (args.category === "all") {
      models = Object.values(NIM_MODELS);
    } else {
      models = getModelsByCategory(args.category);
    }

    return ok({
      total: models.length,
      category: args.category,
      models: models.map((m) => ({
        id: m.id,
        name: m.name,
        category: m.category,
        description: m.description,
        context_length: m.contextLength,
        supports_streaming: m.supportsStreaming,
        supports_function_calling: m.supportsFunctionCalling,
        supports_vision: m.supportsVision ?? false,
      })),
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
      recommended_use_cases: getUseCases(model.category),
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
  };
  return useCases[category] ?? [];
}
