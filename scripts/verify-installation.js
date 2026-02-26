#!/usr/bin/env node

/**
 * Installation verification script for NVIDIA NIM MCP Server
 * 
 * This script checks if the environment is properly set up to run the server.
 */

import { existsSync } from 'fs';
import { join } from 'path';

console.log('🔍 Verifying NVIDIA NIM MCP Server installation...\n');

// Check Node.js version
const nodeVersion = process.version;
const nodeMajorVersion = parseInt(nodeVersion.split('.')[0].replace('v', ''));
console.log(`✅ Node.js version: ${nodeVersion}`);

if (nodeMajorVersion < 18) {
  console.log('⚠️  Warning: Node.js 18+ is recommended for optimal performance');
}

// Check if we're running from source or installed package
const isSource = existsSync(join(process.cwd(), 'src'));
const isInstalled = existsSync(join(process.cwd(), 'dist')) || existsSync(join(process.cwd(), 'node_modules'));

if (isSource) {
  console.log('📁 Running from source directory');
  console.log('📋 To build the project, run: npm run build');
} else if (isInstalled) {
  console.log('📦 Running from installed package');
} else {
  console.log('❓ Unknown installation type');
}

// Check required environment variables (don't actually validate values)
const requiredEnvVars = ['NVIDIA_API_KEY'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.log('\n⚠️  Warning: Missing required environment variables:');
  missingEnvVars.forEach(envVar => console.log(`   - ${envVar}`));
  console.log('\n📝 Please set these variables before running the server.');
  console.log('   Example: NVIDIA_API_KEY=nvapi-your-key-here nvidia-nim-mcp');
} else {
  console.log('\n✅ All required environment variables are set');
}

console.log('\n✨ Installation verification complete!');
console.log('\n🚀 To start the server, run one of:');
console.log('   nvidia-nim-mcp');
console.log('   npm start');
console.log('   node dist/index.js');
console.log('   docker run nvidia-nim-mcp');

console.log('\n📖 For detailed configuration, see .env.example file');