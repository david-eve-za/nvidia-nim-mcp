# MCP Server Configurations

This directory contains ready-to-use configuration files for integrating the NVIDIA NIM MCP Server with various AI coding assistants and platforms.

## 📁 Generated Configuration Files

| File | Platform | Description |
|------|----------|-------------|
| `.opencode/mcp.json` | **OpenCode** | OpenCode MCP server configuration |
| `.vscode/mcp.json` | **GitHub Copilot** (VS Code) | VS Code MCP server configuration for Copilot |
| `config/claude-desktop-config.json` | **Claude Desktop** | Anthropic Claude Desktop MCP configuration |
| `config/openai-mcp-config.json` | **OpenAI** | OpenAI function calling format with all 10 tools |
| `config/mcp-config.json` | **Generic/Universal** | Universal MCP configuration for any client |

---

## 🚀 Quick Start by Platform

### OpenCode

1. Copy `.opencode/mcp.json` to your OpenCode config directory:
   ```bash
   # Linux/macOS
   cp .opencode/mcp.json ~/.config/opencode/mcp/nvidia-nim.json
   
   # Windows
   copy .opencode\mcp.json %APPDATA%\opencode\mcp\nvidia-nim.json
   ```

2. Set your API key:
   ```bash
   export NVIDIA_API_KEY=nvapi-your-key-here
   ```

3. Restart OpenCode - the server will be available automatically.

### GitHub Copilot (VS Code)

1. The `.vscode/mcp.json` is already in the project. Open the project in VS Code.

2. Install the **MCP** extension for VS Code (if not already installed).

3. Open Command Palette (`Ctrl+Shift+P`) → **MCP: Restart Servers**

4. When prompted, enter your `NVIDIA_API_KEY` (starts with `nvapi-`)

5. Copilot will now have access to all 10 NVIDIA NIM tools.

### Claude Desktop

1. Copy the configuration to Claude Desktop config:
   ```bash
   # macOS
   cp config/claude-desktop-config.json ~/Library/Application\ Support/Claude/claude_desktop_config.json
   
   # Windows
   copy config\claude-desktop-config.json %APPDATA%\Claude\claude_desktop_config.json
   
   # Linux
   cp config/claude-desktop-config.json ~/.config/Claude/claude_desktop_config.json
   ```

2. Edit the file and replace `/absolute/path/to/nvidia-nim-mcp` with the actual path.

3. Replace `nvapi-your-api-key-here` with your actual NVIDIA API key.

4. Restart Claude Desktop.

### OpenAI (Function Calling)

Use `config/openai-mcp-config.json` with OpenAI's function calling:

```python
import json
from openai import OpenAI

client = OpenAI()

# Load the function definitions
with open('config/openai-mcp-config.json') as f:
    config = json.load(f)

functions = config['functions']

# Use in chat completion
response = client.chat.completions.create(
    model="gpt-4",
    messages=[{"role": "user", "content": "Generate an image of a sunset"}],
    tools=[{"type": "function", "function": f} for f in functions],
    tool_choice="auto"
)
```

### Generic MCP Client

Use `config/mcp-config.json` with any MCP-compatible client:

```json
{
  "mcpServers": {
    "nvidia-nim": {
      "command": "node",
      "args": ["/path/to/nvidia-nim-mcp/dist/index.js"],
      "env": {
        "NVIDIA_API_KEY": "nvapi-your-key-here"
      }
    }
  }
}
```

---

## 🔑 Required Environment Variable

**Only one required:** `NVIDIA_API_KEY`

Get your key at: https://build.nvidia.com

```bash
export NVIDIA_API_KEY=nvapi-your-actual-key-here
```

All other variables have sensible defaults.

---

## 🛠️ Available Tools (10)

| Tool | Description |
|------|-------------|
| `chat_completion` | Multi-turn LLM conversation (50+ models) |
| `text_generation` | Single-prompt generation |
| `create_embeddings` | Vector embeddings (NV-Embed, BGE-M3) |
| `rerank_passages` | Rerank by relevance (NV-RerankQA) |
| `function_calling` | Tool/function calling support |
| `generate_image` | Text-to-image (FLUX.1, SDXL, SD3) |
| `analyze_image` | Image analysis/vision (Llama 3.2 Vision, Kimi, MiniMax) |
| `multimodal_task` | Text + image tasks (MiniMax M3, Kimi K2.6, Qwen 3.5 397B) |
| `list_models` | List models with advanced filtering |
| `compare_models` | Side-by-side model comparison |

---

## 📦 Supported Models (52)

### Frontier Reasoning
- `nvidia/nemotron-3-ultra-550b-a55b` - 550B, OpenMDW-1.1, commercial ✅
- `deepseek-ai/deepseek-v4-pro` - 1.6T MoE, MIT, commercial ✅
- `moonshotai/kimi-k2.6` - 1T MoE, Modified MIT, commercial ✅
- `z-ai/glm-5.1` - 754B DSA, MIT, commercial ✅
- `mistralai/mistral-large-3-675b-instruct-2512` - 675B, Research

### Code Specialized
- `z-ai/glm-5.1` - Software engineering, SWE-Bench 58.4%
- `qwen/qwen2.5-coder-32b-instruct` - Code generation

### Multimodal / Vision
- `minimaxai/minimax-m3` - Video (30min), 1M context
- `moonshotai/kimi-k2.6` - 300 agents, 4000 steps
- `meta/llama-3.2-90b-vision-instruct` - 128K context
- `qwen/qwen3.5-397b-a17b` - Multimodal MoE

### Image Generation
- `black-forest-labs/flux.1-dev` - Photorealistic, ControlNet
- `black-forest-labs/flux.1-kontext-dev` - Image editing
- `nvidia/stable-diffusion-xl` - High quality, commercial
- `stabilityai/sd-3-medium` - Best prompt adherence

### Open Weight
- `openai/gpt-oss-120b` - Apache 2.0, commercial ✅

---

## 🐳 Docker Quick Start

```bash
docker run --rm \
  -e NVIDIA_API_KEY=nvapi-your-key \
  -e LOG_LEVEL=info \
  nvidia-nim-mcp
```

---

## 🧪 Verify Installation

After configuration, test with:

```bash
# List available models
nvidia-nim-mcp list_models

# Or via MCP Inspector
npx @modelcontextprotocol/inspector node dist/index.js
```

---

## 🔧 Troubleshooting

| Issue | Solution |
|-------|----------|
| "Command not found" | Ensure `node` is in PATH, or use full path to `dist/index.js` |
| "API key invalid" | Verify key at https://build.nvidia.com starts with `nvapi-` |
| "Permission denied" | `chmod +x dist/index.js` |
| "Module not found" | Run `npm install && npm run build` first |

---

## 📚 Additional Resources

- **NVIDIA NIM API Docs**: https://docs.api.nvidia.com/nim/reference/models-1
- **MCP Specification**: https://modelcontextprotocol.io
- **Project Repository**: https://github.com/nvidia/nim-mcp
- **Issue Tracker**: https://github.com/nvidia/nim-mcp/issues