import dotenv from "dotenv";
dotenv.config();

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  InitializeRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { getConfig } from "./config.js";
import { logger } from "./logger.js";
import { NIMClient } from "./client.js";
import { ToolHandlers } from "./handlers.js";
import { TOOL_DEFINITIONS } from "./tools.js";

const config = getConfig();

// ─── Graceful Shutdown ────────────────────────────────────────────────────────

function setupShutdownHandlers(server: Server): void {
  const shutdown = async (signal: string) => {
    logger.info(`Received ${signal}, shutting down gracefully...`);
    try {
      await server.close();
      logger.info("Server closed successfully");
      process.exit(0);
    } catch (err) {
      logger.error("Error during shutdown", { error: err });
      process.exit(1);
    }
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("uncaughtException", (error) => {
    logger.error("Uncaught exception", { error });
    process.exit(1);
  });
  process.on("unhandledRejection", (reason) => {
    logger.error("Unhandled rejection", { reason });
    process.exit(1);
  });
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  logger.info("Starting NVIDIA NIM MCP Server", {
    name: config.MCP_SERVER_NAME,
    version: config.MCP_SERVER_VERSION,
    baseUrl: config.NVIDIA_NIM_BASE_URL,
    defaultModel: config.DEFAULT_MODEL,
    logLevel: config.LOG_LEVEL,
    maxRPM: config.MAX_REQUESTS_PER_MINUTE,
    maxTokens: config.MAX_TOKENS_PER_REQUEST,
    timeout: config.REQUEST_TIMEOUT_MS,
    maxRetries: config.MAX_RETRIES,
  });

  // Initialize NIM client
  const nimClient = new NIMClient();
  const toolHandlers = new ToolHandlers(nimClient);

  // Create MCP server
  const server = new Server(
    {
      name: config.MCP_SERVER_NAME,
      version: config.MCP_SERVER_VERSION,
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  setupShutdownHandlers(server);

  // ─── Handler: Initialize ─────────────────────────────────────────────────
  server.setRequestHandler(InitializeRequestSchema, async (request) => {
    logger.info("Client initialized", {
      clientName: request.params.clientInfo?.name,
      clientVersion: request.params.clientInfo?.version,
    });
    return {
      protocolVersion: "2024-11-05",
      capabilities: { tools: {} },
      serverInfo: {
        name: config.MCP_SERVER_NAME,
        version: config.MCP_SERVER_VERSION,
      },
    };
  });

  // ─── Handler: List Tools ──────────────────────────────────────────────────
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    logger.debug("Listing tools");
    return { tools: TOOL_DEFINITIONS };
  });

  // ─── Handler: Call Tool ───────────────────────────────────────────────────
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    logger.info(`Tool call received: ${name}`, {
      hasArgs: args !== undefined,
    });

    const result = await toolHandlers.handle(name, args ?? {});

    if (result.isError) {
      logger.warn(`Tool ${name} returned an error`, {
        error: result.content[0]?.text,
      });
    }

    return result;
  });

  // ─── Start Transport ──────────────────────────────────────────────────────
  const transport = new StdioServerTransport();

  logger.info("Connecting MCP server via stdio transport...");
  await server.connect(transport);
  logger.info("NVIDIA NIM MCP Server is ready and listening");
}

main().catch((err) => {
  logger.error("Fatal error during startup", { error: err });
  process.exit(1);
});
