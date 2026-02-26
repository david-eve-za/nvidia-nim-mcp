export interface NIMModel {
  id: string;
  name: string;
  description: string;
  category: ModelCategory;
  contextLength: number;
  supportsStreaming: boolean;
  supportsFunctionCalling: boolean;
  supportsVision?: boolean;
}

export type ModelCategory =
  | "language"
  | "embedding"
  | "reranking"
  | "vision"
  | "code"
  | "multimodal";

export const NIM_MODELS: Record<string, NIMModel> = {
  // === LLMs ===
  "meta/llama-3.1-405b-instruct": {
    id: "meta/llama-3.1-405b-instruct",
    name: "Llama 3.1 405B Instruct",
    description: "Meta's largest Llama 3.1 model, best for complex reasoning",
    category: "language",
    contextLength: 128000,
    supportsStreaming: true,
    supportsFunctionCalling: true,
  },
  "meta/llama-3.1-70b-instruct": {
    id: "meta/llama-3.1-70b-instruct",
    name: "Llama 3.1 70B Instruct",
    description: "Balanced performance and efficiency",
    category: "language",
    contextLength: 128000,
    supportsStreaming: true,
    supportsFunctionCalling: true,
  },
  "meta/llama-3.1-8b-instruct": {
    id: "meta/llama-3.1-8b-instruct",
    name: "Llama 3.1 8B Instruct",
    description: "Fast and efficient for simpler tasks",
    category: "language",
    contextLength: 128000,
    supportsStreaming: true,
    supportsFunctionCalling: true,
  },
  "meta/llama-3.2-90b-vision-instruct": {
    id: "meta/llama-3.2-90b-vision-instruct",
    name: "Llama 3.2 90B Vision Instruct",
    description: "Multimodal model with vision capabilities",
    category: "vision",
    contextLength: 128000,
    supportsStreaming: true,
    supportsFunctionCalling: false,
    supportsVision: true,
  },
  "meta/llama-3.2-11b-vision-instruct": {
    id: "meta/llama-3.2-11b-vision-instruct",
    name: "Llama 3.2 11B Vision Instruct",
    description: "Efficient multimodal model",
    category: "vision",
    contextLength: 128000,
    supportsStreaming: true,
    supportsFunctionCalling: false,
    supportsVision: true,
  },
  "mistralai/mistral-large-2-instruct": {
    id: "mistralai/mistral-large-2-instruct",
    name: "Mistral Large 2",
    description: "Mistral's flagship model with excellent reasoning",
    category: "language",
    contextLength: 131072,
    supportsStreaming: true,
    supportsFunctionCalling: true,
  },
  "mistralai/mixtral-8x22b-instruct-v0.1": {
    id: "mistralai/mixtral-8x22b-instruct-v0.1",
    name: "Mixtral 8x22B Instruct",
    description: "MoE model with excellent performance",
    category: "language",
    contextLength: 65536,
    supportsStreaming: true,
    supportsFunctionCalling: true,
  },
  "mistralai/mixtral-8x7b-instruct-v0.1": {
    id: "mistralai/mixtral-8x7b-instruct-v0.1",
    name: "Mixtral 8x7B Instruct",
    description: "Efficient MoE model",
    category: "language",
    contextLength: 32768,
    supportsStreaming: true,
    supportsFunctionCalling: false,
  },
  "microsoft/phi-3.5-mini-instruct": {
    id: "microsoft/phi-3.5-mini-instruct",
    name: "Phi-3.5 Mini Instruct",
    description: "Microsoft's efficient small model",
    category: "language",
    contextLength: 128000,
    supportsStreaming: true,
    supportsFunctionCalling: false,
  },
  "microsoft/phi-3-medium-128k-instruct": {
    id: "microsoft/phi-3-medium-128k-instruct",
    name: "Phi-3 Medium 128K Instruct",
    description: "Microsoft's medium model with long context",
    category: "language",
    contextLength: 128000,
    supportsStreaming: true,
    supportsFunctionCalling: false,
  },
  "google/gemma-2-27b-it": {
    id: "google/gemma-2-27b-it",
    name: "Gemma 2 27B IT",
    description: "Google's Gemma 2 model",
    category: "language",
    contextLength: 8192,
    supportsStreaming: true,
    supportsFunctionCalling: false,
  },
  "google/gemma-2-9b-it": {
    id: "google/gemma-2-9b-it",
    name: "Gemma 2 9B IT",
    description: "Google's efficient Gemma 2 model",
    category: "language",
    contextLength: 8192,
    supportsStreaming: true,
    supportsFunctionCalling: false,
  },
  "qwen/qwen2.5-72b-instruct": {
    id: "qwen/qwen2.5-72b-instruct",
    name: "Qwen 2.5 72B Instruct",
    description: "Alibaba's Qwen 2.5 large model",
    category: "language",
    contextLength: 131072,
    supportsStreaming: true,
    supportsFunctionCalling: true,
  },
  "qwen/qwen2.5-coder-32b-instruct": {
    id: "qwen/qwen2.5-coder-32b-instruct",
    name: "Qwen 2.5 Coder 32B",
    description: "Specialized coding model",
    category: "code",
    contextLength: 131072,
    supportsStreaming: true,
    supportsFunctionCalling: false,
  },
  "nvidia/llama-3.1-nemotron-70b-instruct": {
    id: "nvidia/llama-3.1-nemotron-70b-instruct",
    name: "Nemotron 70B Instruct",
    description: "NVIDIA's fine-tuned Llama with RLHF",
    category: "language",
    contextLength: 131072,
    supportsStreaming: true,
    supportsFunctionCalling: false,
  },
  "z-ai/glm-4-9b-chat": {
    id: "z-ai/glm-4-9b-chat",
    name: "GLM-4 9B Chat",
    description: "Zhipu AI's GLM-4 model, strong multilingual and reasoning capabilities",
    category: "language",
    contextLength: 128000,
    supportsStreaming: true,
    supportsFunctionCalling: false,
  },
  "z-ai/glm5": {
    id: "z-ai/glm5",
    name: "GLM-5",
    description: "Zhipu AI's GLM-5 model specialized in software development and architecture - excels at code generation, debugging, refactoring, and system design",
    category: "code",
    contextLength: 128000,
    supportsStreaming: true,
    supportsFunctionCalling: true,
  },
  // === Embeddings ===
  "nvidia/nv-embedqa-e5-v5": {
    id: "nvidia/nv-embedqa-e5-v5",
    name: "NV-EmbedQA E5 v5",
    description: "NVIDIA embedding model optimized for Q&A retrieval",
    category: "embedding",
    contextLength: 512,
    supportsStreaming: false,
    supportsFunctionCalling: false,
  },
  "nvidia/nv-embed-v1": {
    id: "nvidia/nv-embed-v1",
    name: "NV-Embed v1",
    description: "NVIDIA general purpose embedding model",
    category: "embedding",
    contextLength: 4096,
    supportsStreaming: false,
    supportsFunctionCalling: false,
  },
  "baai/bge-m3": {
    id: "baai/bge-m3",
    name: "BGE-M3",
    description: "Multilingual embedding model",
    category: "embedding",
    contextLength: 8192,
    supportsStreaming: false,
    supportsFunctionCalling: false,
  },
  // === Reranking ===
  "nvidia/nv-rerankqa-mistral-4b-v3": {
    id: "nvidia/nv-rerankqa-mistral-4b-v3",
    name: "NV-RerankQA Mistral 4B v3",
    description: "NVIDIA reranking model for RAG pipelines",
    category: "reranking",
    contextLength: 4096,
    supportsStreaming: false,
    supportsFunctionCalling: false,
  },
};

export function getModelsByCategory(category: ModelCategory): NIMModel[] {
  return Object.values(NIM_MODELS).filter((m) => m.category === category);
}

export function getModel(modelId: string): NIMModel | undefined {
  return NIM_MODELS[modelId];
}
