# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.1.0] - 2026-06-12

### Added
- **FLUX.1-schnell support** via NVIDIA AI Foundation free tier (https://ai.api.nvidia.com/v1/genai/black-forest-labs/flux.1-schnell)
  - Fast text-to-image generation (4 steps, distilled model)
  - Available without dedicated GPU on free tier
- **FLUX.1-kontext-dev support** via NVIDIA AI Foundation free tier (https://ai.api.nvidia.com/v1/genai/black-forest-labs/flux.1-kontext-dev)
  - Image-to-image editing with context preservation
  - Supports inpainting, outpainting, style transfer, object replacement
  - Requires input image as base64 data URL
- **Dual image download mechanism**
  - Base64 JSON response (existing, always included)
  - PNG file save to disk with two options:
    - `save_filename`: Auto-generates path in current directory (e.g., `my-image.png`)
    - `save_path`: Full relative or absolute path (creates directories if needed)
- New configuration options:
  - `NVIDIA_AI_FOUNDATION_URL` - AI Foundation Models endpoint
  - `DEFAULT_FLUX_SCHNELL_MODEL` - Default FLUX Schnell model
  - `DEFAULT_FLUX_KONTEXT_MODEL` - Default FLUX Kontext model

### Changed
- **Default model updated** from `z-ai/glm5` (EOL) to `meta/llama-3.1-8b-instruct` (working on free tier)
- **Image generation enabled by default** (`ENABLE_IMAGE_GENERATION=true`) since FLUX models now work on free tier
- **Default image model** changed to `black-forest-labs/flux.1-schnell`
- **Fixed stdio transport logging** - All log levels now output to stderr to avoid corrupting JSON-RPC protocol on stdout
- **Enhanced 404 error handling** - Clear message about image generation model availability on free tier vs self-hosted

### Fixed
- JSON-RPC protocol corruption caused by Winston logging to stdout
- Model not found errors now provide actionable guidance

### Model Catalog Updates
- Added `black-forest-labs/flux.1-schnell` (category: image_generation, free-tier tag)
- Added `black-forest-labs/flux.1-kontext-dev` (category: image_generation, free-tier tag)
- Both models use `NVIDIA AI Foundation` runtime engine

## [2.0.0] - 2026-06-12

### Added
- Initial major release with full NVIDIA NIM model support
- 50+ models across language, embedding, reranking, vision, code, multimodal, image_generation
- Rich model metadata for agent selection (benchmarks, hardware requirements, licensing)
- MCP tools: chat_completion, text_generation, create_embeddings, rerank_passages, function_calling, generate_image, analyze_image, multimodal_task, list_models, get_model_info, compare_models
- Rate limiting, retry logic, structured logging with Winston
- Zod validation for all inputs
- Comprehensive test suite

---

For the full commit history, see `git log --oneline`.