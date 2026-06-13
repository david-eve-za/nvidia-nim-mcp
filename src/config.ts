import { z } from "zod";

const ConfigSchema = z.object({
  // NVIDIA API - Primary connection (self-hosted NIM)
  NVIDIA_API_KEY: z.string().min(1, "NVIDIA_API_KEY is required"),
  NVIDIA_NIM_BASE_URL: z
    .string()
    .url()
    .default("https://integrate.api.nvidia.com/v1"),

  // NVIDIA AI Foundation Models (cloud, free tier available)
  NVIDIA_AI_FOUNDATION_URL: z
    .string()
    .url()
    .default("https://ai.api.nvidia.com/v1/genai"),

  // Server
  MCP_SERVER_NAME: z.string().default("nvidia-nim-mcp"),
  MCP_SERVER_VERSION: z.string().default("1.0.0"),
  MCP_SERVER_PORT: z.coerce.number().int().positive().default(8080),
  LOG_LEVEL: z
    .enum(["error", "warn", "info", "debug", "silly"])
    .default("info"),

  // Rate Limiting
  MAX_REQUESTS_PER_MINUTE: z.coerce.number().int().positive().default(40),
  MAX_TOKENS_PER_REQUEST: z.coerce.number().int().positive().default(4096),
  REQUEST_TIMEOUT_MS: z.coerce.number().int().positive().default(120000),

  // Retry
  MAX_RETRIES: z.coerce.number().int().min(0).max(10).default(3),
  RETRY_DELAY_MS: z.coerce.number().int().positive().default(1000),

  // Defaults
  DEFAULT_MODEL: z.string().default("meta/llama-3.1-8b-instruct"),
  DEFAULT_TEMPERATURE: z.coerce.number().min(0).max(2).default(0.3),
  DEFAULT_TOP_P: z.coerce.number().min(0).max(1).default(0.95),
  DEFAULT_MAX_TOKENS: z.coerce.number().int().positive().default(4096),

  // Image Generation - AI Foundation Models (free tier available)
  DEFAULT_IMAGE_MODEL: z.string().default("black-forest-labs/flux.1-schnell"),
  DEFAULT_FLUX_SCHNELL_MODEL: z.string().default("black-forest-labs/flux.1-schnell"),
  DEFAULT_FLUX_KONTEXT_MODEL: z.string().default("black-forest-labs/flux.1-kontext-dev"),
  IMAGE_GENERATION_TIMEOUT_MS: z.coerce.number().int().positive().default(300000),

  // Feature flags
  ENABLE_IMAGE_GENERATION: z.coerce.boolean().default(true),
  ENABLE_VISION: z.coerce.boolean().default(true),
  ENABLE_MULTIMODAL: z.coerce.boolean().default(true),
});

export class ConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigError';
  }
}

function loadConfig() {
  const result = ConfigSchema.safeParse(process.env);

  if (!result.success) {
    const errors = result.error.issues
      .map((e) => `  - ${e.path.join(".")}: ${e.message}`)
      .join("\n");
    throw new ConfigError(`Configuration validation failed:\n${errors}`);
  }

  return result.data;
}

export function getConfig() {
  return loadConfig();
}

export type Config = ReturnType<typeof getConfig>;
