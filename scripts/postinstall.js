#!/usr/bin/env node

/**
 * Post-installation script for NVIDIA NIM MCP Server
 * 
 * This script runs after the package is installed and provides
 * helpful information to the user.
 */

console.log(`
🎉 Thank you for installing NVIDIA NIM MCP Server!

🚀 Quick Start:
   npx nvidia-nim-mcp

🔐 Configuration:
   1. Set your NVIDIA API key: NVIDIA_API_KEY=nvapi-your-key
   2. See .env.example for all configuration options

📚 Documentation:
   - README.md for detailed usage instructions
   - Visit https://build.nvidia.com for API key registration

⚡ Next Steps:
   npx nvidia-nim-mcp --help

💡 Having trouble? Run:
   npm run verify
`);

// Only show advanced tips if this is a global installation
if (process.env.npm_config_global === 'true') {
  console.log(`🔧 Global Installation Detected:
   You can now run 'nvidia-nim-mcp' from anywhere!
   For configuration, create a .env file in your working directory.
`);
}