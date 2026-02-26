import winston from "winston";
import { Config } from "./config.js";

const { combine, timestamp, errors, json, colorize, simple } = winston.format;

export interface LoggerOptions {
  logLevel: Config['LOG_LEVEL'];
  isProduction: boolean;
  mcpServerVersion: string;
}

// Initialize logger with default configuration
export let logger: winston.Logger = winston.createLogger({
  level: "info",
  format: combine(
    timestamp({ format: "YYYY-MM-DD HH:mm:ss.SSS" }),
    errors({ stack: true }),
    combine(colorize({ all: true }), simple())
  ),
  defaultMeta: {
    service: "nvidia-nim-mcp",
    version: "1.0.0",
  },
  transports: [
    new winston.transports.Console({
      stderrLevels: ["error", "warn"],
    }),
  ],
});

export function initLogger(options: LoggerOptions) {
  const { logLevel, isProduction, mcpServerVersion } = options;

  logger = winston.createLogger({
    level: logLevel,
    format: combine(
      timestamp({ format: "YYYY-MM-DD HH:mm:ss.SSS" }),
      errors({ stack: true }),
      isProduction
        ? json()
        : combine(colorize({ all: true }), simple())
    ),
    defaultMeta: {
      service: "nvidia-nim-mcp",
      version: mcpServerVersion,
    },
    transports: [
      new winston.transports.Console({
        stderrLevels: ["error", "warn"],
      }),
    ],
  });

  // Log to file in production
  if (isProduction) {
    logger.add(
      new winston.transports.File({
        filename: "logs/error.log",
        level: "error",
        maxsize: 10 * 1024 * 1024, // 10MB
        maxFiles: 5,
      })
    );
    logger.add(
      new winston.transports.File({
        filename: "logs/combined.log",
        maxsize: 10 * 1024 * 1024, // 10MB
        maxFiles: 10,
      })
    );
  }
  return logger;
}
