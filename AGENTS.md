# AGENTS.md

This document provides essential information for agentic coding systems working with this NVIDIA NIM MCP Server codebase.

## Build Commands

```bash
# Clean build artifacts
npm run clean

# Build TypeScript to JavaScript
npm run build

# Development mode (watch and restart)
npm run dev

# Production start
npm start
```

## Linting Commands

```bash
# Run ESLint on source files
npm run lint
```

## Test Commands

```bash
# Run all tests
npm test

# Run a specific test file
npm test src/config.test.ts

# Run tests with verbose output
npm test -- --verbose

# Run tests matching a pattern
npm test -- --testNamePattern="Config"

# Run tests in watch mode
npm test -- --watch

# Generate coverage report
npm test -- --coverage
```

## Code Style Guidelines

### Imports
- Use ES modules with `.js` extensions even in TypeScript files
- Import ordering: external packages, internal modules, type-only imports
- Use named imports over default imports when possible
- Group imports logically with blank lines between groups

### Formatting
- TypeScript strict mode enabled
- Prettier-style formatting (via ESLint)
- 2-space indentation
- Line width: 80 characters
- Trailing commas in multi-line objects/arrays
- No semicolons (recommended by modern TypeScript)

### Types
- Prefer interfaces over types for object shapes
- Use Zod for runtime validation of external inputs
- Explicit typing for function parameters and return values
- Strict null checking enabled
- Avoid `any` type except in rare justified cases

### Naming Conventions
- camelCase for variables and functions
- PascalCase for classes, interfaces, and types
- UPPER_CASE for constants
- Descriptive names over abbreviations
- Boolean variables prefixed with `is`, `has`, `should`, etc.

### Error Handling
- Use typed errors and proper error hierarchies
- Always handle promise rejections
- Centralized error logging with winston
- User-friendly error messages for clients
- Preserve stack traces during error wrapping

### Documentation
- JSDoc comments for exported functions and classes
- Inline comments for complex logic
- Clear commit messages following conventional commits
- README.md updates for user-facing changes

## Project Structure
- `src/`: Source code
- `src/index.ts`: Entry point
- `src/client.ts`: NVIDIA NIM API client
- `src/config.ts`: Configuration management with Zod validation
- `src/logger.ts`: Winston-based logging
- `src/models.ts`: Model definitions and catalogs
- `src/tools.ts`: Tool schemas and definitions
- `src/handlers.ts`: Tool implementation handlers
- `tests/`: Unit tests (Jest)
- `dist/`: Compiled output

## Key Dependencies
- `@modelcontextprotocol/sdk`: Official MCP SDK
- `axios`: HTTP client with retry support
- `zod`: Runtime type validation
- `winston`: Structured logging
- `dotenv`: Environment configuration

## Testing Patterns
- Jest for unit testing
- Environment isolation with `process.env` mocking
- Spy/Mock patterns for external dependencies
- Comprehensive test coverage for config and core logic
- Test names should clearly describe the behavior being tested

## Configuration Management
- All config via environment variables
- Zod schema validation at startup
- Sensible defaults for optional values
- Type-safe config access
- Clear error messages for missing required values

## Logging Standards
- Structured JSON logging in production
- Colorized simple logging in development
- Appropriate log levels (error, warn, info, debug)
- Consistent metadata fields
- Request tracing with correlation IDs

## Error Recovery
- Automatic retries with exponential backoff
- Rate limiting with graceful delays
- Graceful shutdown on SIGINT/SIGTERM
- Unhandled exception and rejection handlers
- Resource cleanup on exit

## Performance Considerations
- Connection pooling via axios
- Efficient memory usage patterns
- Streaming responses where applicable
- Caching strategies for repeated operations
- Asynchronous operations for non-blocking I/O

## Security Practices
- No hardcoded secrets
- Environment variable validation
- Input sanitization through Zod schemas
- Secure header configuration
- Dependency vulnerability scanning

## Deployment Considerations
- Docker-ready with multi-stage build
- Health check endpoints
- Non-root container user
- Proper signal handling for containers
- Resource limits configuration