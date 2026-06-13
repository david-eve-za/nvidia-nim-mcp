# NVIDIA NIM MCP Server

A production-ready **Model Context Protocol (MCP)** server for consuming **NVIDIA NIM** (NVIDIA Inference Microservices) models. Supports 50+ LLMs, multimodal models, image generation, embeddings, reranking, function calling, vision, and code-specialized models with rich metadata for intelligent agent selection.

---

## 🚀 Features

- **10 MCP Tools**: chat completion, text generation, embeddings, reranking, function calling, model listing, model info, **image generation**, **image analysis**, **multimodal tasks**, **model comparison**
- **50+ Supported Models**: Llama 3.1/3.2, Nemotron 3 Ultra (550B), MiniMax M3, Kimi K2.6 (1T), DeepSeek V4 Pro, GLM 5.1, Qwen 3.5 397B, Mistral Large 3 (675B), GPT-OSS 120B, DiffusionGemma, FLUX.1, SDXL, SD3, and more
- **Rich Model Metadata**: licensing, hardware requirements, benchmarks, image generation specs, reasoning modes, tags for agent selection
- **Advanced Filtering**: by commercial use, reasoning, vision, function calling, multimodal, context length, tags, hardware
- **Production-Grade**: automatic retries with exponential backoff, per-minute rate limiting, structured JSON logging
- **Type-Safe**: full TypeScript, Zod input validation on every tool
- **Docker-Ready**: multi-stage Dockerfile with non-root user, health checks
- **Configurable**: all settings via environment variables
- **Single Required Env**: Only `NVIDIA_API_KEY` required; all others have sensible defaults

---

## 📋 Prerequisites

- Node.js 18+ (for NPM installation) or Docker (for container deployment)
- A [NVIDIA NGC API key](https://build.nvidia.com) (`nvapi-...`)

---

## ⚙️ Installation

### Option 1: NPM Global Installation (Recommended)

```bash
# Install globally
npm install -g nvidia-nim-mcp

# Run directly
nvidia-nim-mcp
```

### Option 2: NPM Local Installation

```bash
# Initialize your project
npm init -y

# Install locally
npm install nvidia-nim-mcp

# Run with npx
npx nvidia-nim-mcp
```

### Option 3: From Source

```bash
# Clone / download the project
cd nvidia-nim-mcp

# Install dependencies
npm install

# Build TypeScript
npm run build
```

### Option 4: Docker

```bash
# Pull from Docker Hub (when published)
docker pull nvidia-nim-mcp

# Or build locally
docker build -t nvidia-nim-mcp .
```

---

## 🔑 Configuration

Copy `.env.example` to `.env` and fill in your API key:

```bash
cp .env.example .env
```

**Only `NVIDIA_API_KEY` is required** — all other variables have production-ready defaults:

| Variable | Required | Default | Description |
|---|---|---|---|
| `NVIDIA_API_KEY` | ✅ | — | Your NVIDIA NGC API key |
| `NVIDIA_NIM_BASE_URL` | ❌ | `https://integrate.api.nvidia.com/v1` | Base URL for NIM API |
| `DEFAULT_MODEL` | ❌ | `black-forest-labs/flux.1-dev` | Default model (best image generation) |
| `MAX_REQUESTS_PER_MINUTE` | ❌ | `40` | Rate limit cap (NVIDIA API limit) |
| `MAX_TOKENS_PER_REQUEST` | ❌ | `4096` | Hard cap on tokens per request |
| `REQUEST_TIMEOUT_MS` | ❌ | `120000` | Request timeout (ms) |
| `MAX_RETRIES` | ❌ | `3` | Max retry attempts on failure |
| `RETRY_DELAY_MS` | ❌ | `1000` | Base delay between retries (ms) |
| `LOG_LEVEL` | ❌ | `info` | `error\|warn\|info\|debug` |
| `ENABLE_IMAGE_GENERATION` | ❌ | `true` | Enable image generation tools |
| `ENABLE_VISION` | ❌ | `true` | Enable vision/multimodal tools |
| `ENABLE_MULTIMODAL` | ❌ | `true` | Enable multimodal task tools |

---

## 🚀 Running

### NPM Global Installation
```bash
# Run the server
nvidia-nim-mcp

# With custom environment variables
NVIDIA_API_KEY=nvapi-your-key LOG_LEVEL=debug nvidia-nim-mcp
```

### NPM Local Installation
```bash
# Run with npx
npx nvidia-nim-mcp

# Or add to package.json scripts
# "scripts": { "start": "nvidia-nim-mcp" }
npm start
```

### From Source
```bash
# Development mode with auto-reload
npm run dev

# Production mode (compiled)
npm run build && npm start
```

### Docker
```bash
# Run with environment variables
docker run --rm \
  -e NVIDIA_API_KEY=nvapi-your-key \
  -e LOG_LEVEL=info \
  nvidia-nim-mcp

# Run in background with port mapping (if needed)
docker run -d \
  --name nvidia-nim-mcp \
  -e NVIDIA_API_KEY=nvapi-your-key \
  nvidia-nim-mcp
```

### Standalone Executable
```bash
# Make executable (if not already)
chmod +x dist/index.js

# Run directly
./dist/index.js

# With environment variables
NVIDIA_API_KEY=nvapi-your-key ./dist/index.js
```

---

## 🔧 MCP Client Configuration

### For Global NPM Installation
```json
{
  "mcpServers": {
    "nvidia-nim": {
      "command": "nvidia-nim-mcp",
      "env": {
        "NVIDIA_API_KEY": "nvapi-your-key-here",
        "LOG_LEVEL": "info"
      }
    }
  }
}
```

### For Local NPM Installation
```json
{
  "mcpServers": {
    "nvidia-nim": {
      "command": "npx",
      "args": ["nvidia-nim-mcp"],
      "env": {
        "NVIDIA_API_KEY": "nvapi-your-key-here",
        "LOG_LEVEL": "info"
      }
    }
  }
}
```

### For Direct Executable Path
```json
{
  "mcpServers": {
    "nvidia-nim": {
      "command": "node",
      "args": ["/absolute/path/to/nvidia-nim-mcp/dist/index.js"],
      "env": {
        "NVIDIA_API_KEY": "nvapi-your-key-here",
        "LOG_LEVEL": "info"
      }
    }
  }
}
```

---

## 🛠️ Available Tools

### `chat_completion`
Multi-turn conversation with any NIM LLM.

```json
{
  "model": "nvidia/nemotron-3-ultra-550b-a55b",
  "messages": [
    { "role": "user", "content": "Explain quantum computing" }
  ],
  "temperature": 0.3,
  "max_tokens": 4096
}
```

### `text_generation`
Single-prompt text generation (simplified interface).

```json
{
  "prompt": "Write a haiku about machine learning",
  "temperature": 0.5,
  "max_tokens": 512
}
```

### `create_embeddings`
Convert text(s) to vector embeddings for RAG/search.

```json
{
  "model": "nvidia/nv-embed-v1",
  "input": ["NVIDIA makes GPUs", "AI runs on GPUs"],
  "truncate": "END"
}
```

### `rerank_passages`
Rerank passages by relevance to a query.

```json
{
  "query": "What is CUDA?",
  "passages": ["CUDA is a GPU programming platform", "NIM serves AI models"],
  "top_k": 3
}
```

### `function_calling`
Use NIM models with tool/function calling.

```json
{
  "model": "z-ai/glm-5.1",
  "messages": [{ "role": "user", "content": "What's the weather in Paris?" }],
  "tools": [{
    "type": "function",
    "function": {
      "name": "get_weather",
      "description": "Get current weather",
      "parameters": {
        "type": "object",
        "properties": { "city": { "type": "string" } },
        "required": ["city"]
      }
    }
  }]
}
```

### `generate_image`
Generate images from text prompts using FLUX.1, SDXL, SD3, DiffusionGemma.

```json
{
  "model": "black-forest-labs/flux.1-dev",
  "prompt": "A photorealistic mountain landscape at sunset, 8K",
  "width": 1024,
  "height": 1024,
  "steps": 30,
  "cfg_scale": 3.5,
  "sampler": "euler_a",
  "scheduler": "simple"
}
```

### `analyze_image`
Analyze and describe images using vision/multimodal models.

```json
{
  "model": "moonshotai/kimi-k2.6",
  "image_url": "https://example.com/image.jpg",
  "prompt": "Describe this image in detail",
  "detail": "high"
}
```

### `multimodal_task`
Perform multimodal tasks combining text and images.

```json
{
  "model": "minimaxai/minimax-m3",
  "messages": [
    {
      "role": "user",
      "content": [
        { "type": "text", "text": "Analyze this chart" },
        { "type": "image_url", "image_url": { "url": "https://example.com/chart.png" } }
      ]
    }
  ],
  "max_tokens": 2048
}
```

### `list_models`
List available models with rich metadata and advanced filtering.

```json
{
  "category": "code",
  "commercial_use": true,
  "supports_reasoning": true,
  "tags": ["coding", "agentic"],
  "include_details": true
}
```

**Filter Options:**
- `category`: `language`, `embedding`, `reranking`, `vision`, `code`, `multimodal`, `image_generation`, `all`
- `commercial_use`: Filter by commercial license
- `supports_reasoning`: Filter by reasoning capability
- `supports_vision`: Filter by vision capability
- `supports_function_calling`: Filter by function calling
- `supports_multimodal`: Filter by multimodal input
- `min_context_length`: Minimum context window (tokens)
- `tags`: Filter by use case tags
- `hardware`: Filter by GPU type (Hopper, Blackwell, Ampere)
- `include_details`: Include full metadata (benchmarks, image specs, etc.)

### `get_model_info`
Get complete metadata for a specific model.

```json
{ "model_id": "nvidia/nemotron-3-ultra-550b-a55b" }
```

**Returns:** licensing, hardware requirements, benchmarks, image gen specs, reasoning modes, tags, supported languages, etc.

### `compare_models`
Compare 2-5 models side-by-side across all decision factors.

```json
{
  "model_ids": [
    "nvidia/nemotron-3-ultra-550b-a55b",
    "deepseek-ai/deepseek-v4-pro",
    "moonshotai/kimi-k2.6",
    "z-ai/glm-5.1"
  ]
}
```

**Returns:** Structured comparison table with licensing, hardware, benchmarks, capabilities, tags, image generation specs, etc.

---

## 📦 Supported Models (50+)

### Language Models (Frontier Reasoning)

| Model | Parameters | Context | License | Commercial | Best For |
|---|---|---|---|---|---|
| `nvidia/nemotron-3-ultra-550b-a55b` | 550B (55B active) | 131K | OpenMDW-1.1 | ✅ | Frontier reasoning, coding, agentic, 1M context, multilingual |
| `nvidia/nemotron-3-ultra-550b-a55b-instruct` | 550B | 131K | OpenMDW-1.1 | ✅ | Instruction-tuned variant |
| `minimaxai/minimax-m3` | 428B (22B active) | 1M | Non-Commercial | ❌ | Multimodal, video (30min), 8hr coding, agentic |
| `moonshotai/kimi-k2.6` | 1T (32B active) | 256K | Modified MIT | ✅ | Long-horizon coding, 300 agents, vision, agentic |
| `deepseek-ai/deepseek-v4-pro` | 1.6T (49B active) | 1M | MIT | ✅ | Advanced coding, math, reasoning, 3 reasoning modes |
| `z-ai/glm-5.1` | 754B (DSA) | 131K | MIT | ✅ | Software engineering, agentic, SWE-Bench 58.4% |
| `qwen/qwen3.5-397b-a17b` | 397B (MoE) | 131K | Research | ❌ | Large-scale multilingual, multimodal |
| `mistralai/mistral-large-3-675b-instruct-2512` | 675B | 131K | Research | ❌ | Frontier reasoning, multimodal |
| `openai/gpt-oss-120b` | 120B | 131K | Apache 2.0 | ✅ | Open-weight, research, fine-tuning |
| `google/diffusiongemma-26b-a4b-it` | 25.2B (3.8B active) | 256K | Apache 2.0 | ✅ | Diffusion text gen, 35+ langs, fast, multimodal |

### Code-Specialized Models

| Model | Parameters | Context | License | Commercial |
|---|---|---|---|---|
| `z-ai/glm-5.1` | 754B | 131K | MIT | ✅ |
| `z-ai/glm5` | - | 128K | Z.ai | ✅ |
| `qwen/qwen2.5-coder-32b-instruct` | 32B | 131K | Research | ❌ |

### Multimodal / Vision Models

| Model | Parameters | Context | Vision | Video | License | Commercial |
|---|---|---|---|---|---|---|
| `meta/llama-3.2-90b-vision-instruct` | 90B | 128K | ✅ | ❌ | Llama 3.2 | ✅ |
| `meta/llama-3.2-11b-vision-instruct` | 11B | 128K | ✅ | ❌ | Llama 3.2 | ✅ |
| `nvidia/neva-22b` | 22B | 4K | ✅ | ❌ | NVIDIA | ✅ |
| `microsoft/phi-3.5-vision-instruct` | - | 128K | ✅ | ❌ | MIT | ✅ |
| `minimaxai/minimax-m3` | 428B | 1M | ✅ | ✅ (30min) | Non-Commercial | ❌ |
| `moonshotai/kimi-k2.6` | 1T | 256K | ✅ | ✅ | Modified MIT | ✅ |

### Image Generation Models

| Model | Architecture | Resolutions | Aspect Ratios | Max Images | ControlNet | License | Commercial |
|---|---|---|---|---|---|---|---|
| `black-forest-labs/flux.1-dev` | Diffusion Transformer | 1024², 1152×896, 1344×768, 21:9 | 1:1, 16:9, 9:16, 4:3, 3:4, 21:9 | 1 | Canny, Depth | Apache 2.0* | ❌* |
| `black-forest-labs/flux.1-kontext-dev` | Diffusion Transformer | Same | Same | 1 | - | Apache 2.0* | ❌* |
| `nvidia/stable-diffusion-xl` | UNet + Attention | 1024², 1152×896, 1216×832 | 1:1, 16:9, 9:16, 4:3, 3:4 | 4 | - | SDXL 1.0 | ✅** |
| `stabilityai/sd-3-medium` | SD3 | Same | Same | 2 | - | Stability AI | ✅** |
| `nvidia/sdxl-turbo` | ADD | 512², 1024² | 1:1 | 4 | - | SDXL 1.0 | ✅** |

*\*Non-commercial default; commercial via contact*  
**\*\*Requires Stability AI membership**

### Embeddings & Reranking

| Model | Type | Context | Dimensions | License | Commercial |
|---|---|---|---|---|---|
| `nvidia/nv-embedqa-e5-v5` | Embedding | 512 | - | NVIDIA | ✅ |
| `nvidia/nv-embed-v1` | Embedding | 4096 | - | NVIDIA | ✅ |
| `baai/bge-m3` | Embedding | 8192 | - | MIT | ✅ |
| `nvidia/nv-rerankqa-mistral-4b-v3` | Reranking | 4096 | - | NVIDIA | ✅ |

---

## 🏭 Production Checklist

- [x] Environment variable validation on startup
- [x] Exponential backoff retry (configurable)
- [x] Per-minute rate limiter
- [x] Request/response logging with Winston
- [x] Structured JSON logs in production
- [x] Zod input validation for all tools
- [x] Graceful shutdown (SIGINT/SIGTERM)
- [x] Unhandled exception/rejection handlers
- [x] Docker multi-stage build (minimal image)
- [x] Non-root Docker user
- [x] Token cap enforcement
- [x] Single required env var (`NVIDIA_API_KEY`)
- [x] Feature flags for optional capabilities

---

## 🧪 Testing

The project includes a comprehensive test suite:

- **Unit Tests**: Configuration, logging, model handling, tool validation
- **Integration Tests**: All 10 MCP tools with various input scenarios
- **Error Handling**: Validation of edge cases and failure modes
- **Schema Validation**: Zod-based input validation for all tools

### Running Tests

```bash
# Run all tests
npm test

# Run tests with coverage report
npm test -- --coverage

# Run tests in watch mode
npm test -- --watch

# Run specific test file
npm test src/handlers.test.ts
```

**Current Test Status**: ✅ All tests passing (96 tests)

---

## 🛠️ Development

### Building the Project

```bash
# Install dependencies
npm install

# Compile TypeScript to JavaScript
npm run build

# Clean build artifacts
npm run clean

# Development mode with auto-reload
npm run dev
```

### Code Quality

```bash
# Run linter
npm run lint

# Run tests
npm test

# Run both linting and tests
npm run check
```

---

## 🤝 Contributing

Contributions are welcome!

1. **Fork the Repository**
2. **Create a Feature Branch**: `git checkout -b feature/your-feature-name`
3. **Make Your Changes**: Follow the existing code style and patterns
4. **Add Tests**: Ensure new functionality is properly tested
5. **Run Checks**: `npm run check` to verify code quality and tests
6. **Commit Changes**: Use clear, descriptive commit messages
6. **Push to Your Fork**: `git push origin feature/your-feature-name`
7. **Open a Pull Request**: Describe your changes and their benefits

### Code Standards

- **TypeScript**: Strict type checking enabled
- **ESLint**: Code formatting and best practices
- **Zod**: Runtime validation for all external inputs
- **Testing**: Comprehensive test coverage for new features
- **Documentation**: Update README.md for user-facing changes

### Development Workflow

1. **Setup**: Follow the installation instructions
2. **Development**: Use `npm run dev` for continuous development
3. **Testing**: Run `npm test` to verify your changes
4. **Building**: Use `npm run build` to compile the project
5. **Linting**: Run `npm run lint` to check code quality

---

## 📦 Packaging & Distribution

### NPM Package
- Published to npm registry for easy installation
- Includes compiled JavaScript and TypeScript definitions
- Global and local installation options
- Runs as a standard CLI tool

### Docker Image
- Multi-stage build for minimal image size
- Runs as non-root user for security
- Includes health check endpoint
- Easy deployment to containerized environments

### Standalone Executable
- Self-contained JavaScript file with shebang
- Can be run directly on any system with Node.js
- No installation required beyond Node.js

### Building Packages

```bash
# Build the project
npm run build

# Create NPM package (.tgz)
npm pack

# Build Docker image
docker build -t nvidia-nim-mcp .

# All checks (lint, test, build)
npm run check && npm run build
```

---

## 📄 License

MIT