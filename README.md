# NVIDIA NIM MCP Server

A production-ready **Model Context Protocol (MCP)** server for consuming **NVIDIA NIM** (NVIDIA Inference Microservices) models. Supports LLMs, embeddings, reranking, function calling, and vision models.

---

## 🚀 Features

- **7 MCP Tools**: chat completion, text generation, embeddings, reranking, function calling, model listing, and model info
- **20+ Supported Models**: Llama 3.1/3.2, Mistral, Mixtral, Phi-3, Gemma 2, Qwen 2.5, Nemotron, and more
- **Production-Grade**: automatic retries with exponential backoff, per-minute rate limiting, structured JSON logging
- **Type-Safe**: full TypeScript, Zod input validation on every tool
- **Docker-Ready**: multi-stage Dockerfile with non-root user, health checks
- **Configurable**: all settings via environment variables
- **Multiple Distribution Formats**: NPM package, Docker image, standalone executable

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

| Variable | Required | Default | Description |
|---|---|---|---|
| `NVIDIA_API_KEY` | ✅ | — | Your NVIDIA NGC API key |
| `NVIDIA_NIM_BASE_URL` | ❌ | `https://integrate.api.nvidia.com/v1` | Base URL for NIM API |
| `DEFAULT_MODEL` | ❌ | `z-ai/glm5` | Default model for completions (specialized in software development) |
| `MAX_REQUESTS_PER_MINUTE` | ❌ | `40` | Rate limit cap (NVIDIA API limit) |
| `MAX_TOKENS_PER_REQUEST` | ❌ | `4096` | Hard cap on tokens per request |
| `REQUEST_TIMEOUT_MS` | ❌ | `120000` | Request timeout (ms) |
| `MAX_RETRIES` | ❌ | `3` | Max retry attempts on failure |
| `RETRY_DELAY_MS` | ❌ | `1000` | Base delay between retries (ms) |
| `LOG_LEVEL` | ❌ | `info` | `error\|warn\|info\|debug` |

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
        "DEFAULT_MODEL": "z-ai/glm5",
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
        "DEFAULT_MODEL": "z-ai/glm5",
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
        "DEFAULT_MODEL": "z-ai/glm5",
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
  "model": "z-ai/glm5",
  "messages": [
    { "role": "user", "content": "Explain quantum computing" }
  ],
  "temperature": 0.3,
  "max_tokens": 2048
}
```

### `text_generation`
Single-prompt text generation (simplified interface).

```json
{
  "prompt": "Write a haiku about machine learning",
  "temperature": 0.5
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
  "model": "z-ai/glm5",
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

### `list_models`
List available models filtered by category.

```json
{ "category": "embedding" }
```

### `get_model_info`
Get details about a specific model.

```json
{ "model_id": "meta/llama-3.1-405b-instruct" }
```

---

## 📦 Supported Models

| Category | Models |
|---|---|
| **Language** | Llama 3.1 (8B/70B/405B), Mistral Large 2, Mixtral 8x22B/8x7B, Phi-3.5 Mini, Gemma 2 (9B/27B), Qwen 2.5 72B, Nemotron 70B, GLM-4 9B |
| **Code** | Qwen 2.5 Coder 32B, **GLM-5** (default - specialized in software development & architecture) |
| **Vision** | Llama 3.2 Vision (11B/90B) |
| **Embeddings** | NV-Embed v1, NV-EmbedQA E5 v5, BGE-M3 |
| **Reranking** | NV-RerankQA Mistral 4B v3 |

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

## 🧪 Testing

The project includes a comprehensive test suite with over 60 tests covering:

- **Unit Tests**: Configuration, logging, model handling, and tool validation
- **Integration Tests**: All 7 MCP tools with various input scenarios
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

**Current Test Status**: ✅ All tests passing (62/62 tests)

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

## 🤝 Contributing

Contributions are welcome! Here's how you can contribute:

1. **Fork the Repository**
2. **Create a Feature Branch**: `git checkout -b feature/your-feature-name`
3. **Make Your Changes**: Follow the existing code style and patterns
4. **Add Tests**: Ensure new functionality is properly tested
5. **Run Checks**: `npm run check` to verify code quality and tests
6. **Commit Changes**: Use clear, descriptive commit messages
7. **Push to Your Fork**: `git push origin feature/your-feature-name`
8. **Open a Pull Request**: Describe your changes and their benefits

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

## 📦 Packaging & Distribution

This project can be distributed and deployed in multiple formats:

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

## 📄 License

MIT
