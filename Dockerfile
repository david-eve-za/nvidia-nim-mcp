# ─── Build Stage ──────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --frozen-lockfile

# Build TypeScript
COPY tsconfig.json ./
COPY src ./src
COPY scripts ./scripts
RUN npm run build

# Prune dev dependencies
RUN npm prune --production

# ─── Production Stage ─────────────────────────────────────────────────────────
FROM node:20-alpine AS production

# Security: run as non-root
RUN addgroup -g 1001 -S mcpuser && \
    adduser -u 1001 -S mcpuser -G mcpuser

WORKDIR /app

# Copy only production artifacts
COPY --from=builder --chown=mcpuser:mcpuser /app/dist ./dist
COPY --from=builder --chown=mcpuser:mcpuser /app/node_modules ./node_modules
COPY --from=builder --chown=mcpuser:mcpuser /app/package.json ./package.json

# Create logs directory
RUN mkdir -p logs && chown mcpuser:mcpuser logs

USER mcpuser

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "process.exit(0)"

ENV NODE_ENV=production

CMD ["node", "dist/index.js"]
