
import { getConfig, ConfigError } from './config.js';

describe('Config', () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.resetModules(); // Clears the module cache before each test
    process.env = {}; // Start with an empty environment for predictable tests
  });

  afterAll(() => {
    process.env = OLD_ENV; // Restore original env after all tests
  });

  it('should load config from environment variables', () => {
    process.env.NVIDIA_API_KEY = 'test-key';
    process.env.NVIDIA_CHAT_MODEL = 'chat-model';
    process.env.NVIDIA_EMBEDDINGS_MODEL = 'embeddings-model';
    process.env.NVIDIA_RERANKING_MODEL = 'reranking-model';
    process.env.MCP_SERVER_PORT = '8080';
    process.env.LOG_LEVEL = 'debug';

    const loadedConfig = getConfig(); // Call the function to get config

    expect(loadedConfig.NVIDIA_API_KEY).toBe('test-key');
    expect(loadedConfig.NVIDIA_CHAT_MODEL).toBe('chat-model');
    expect(loadedConfig.NVIDIA_EMBEDDINGS_MODEL).toBe('embeddings-model');
    expect(loadedConfig.NVIDIA_RERANKING_MODEL).toBe('reranking-model');
    expect(loadedConfig.MCP_SERVER_PORT).toBe(8080);
    expect(loadedConfig.LOG_LEVEL).toBe('debug');
  });

  it('should throw ConfigError if NVIDIA_API_KEY is missing', () => {
    // Only set required default values, which will trigger an error for NVIDIA_API_KEY
    process.env.NVIDIA_NIM_BASE_URL = 'http://localhost'; // required for default to work
    process.env.MCP_SERVER_NAME = 'test';
    process.env.MCP_SERVER_VERSION = '1.0.0';
    process.env.MAX_REQUESTS_PER_MINUTE = '1';
    process.env.MAX_TOKENS_PER_REQUEST = '1';
    process.env.REQUEST_TIMEOUT_MS = '1';
    process.env.MAX_RETRIES = '0';
    process.env.RETRY_DELAY_MS = '1';
    process.env.DEFAULT_MODEL = 'model';
    process.env.DEFAULT_TEMPERATURE = '0';
    process.env.DEFAULT_TOP_P = '0';
    process.env.DEFAULT_MAX_TOKENS = '1';


    expect(() => getConfig()).toThrow(ConfigError);
    expect(() => getConfig()).toThrow('Configuration validation failed:\n  - NVIDIA_API_KEY: Required');
  });

  it('should use default values for optional fields', () => {
    process.env.NVIDIA_API_KEY = 'test-key';
    // Set minimal required variables for successful config loading
    process.env.NVIDIA_NIM_BASE_URL = 'http://localhost';
    process.env.MCP_SERVER_NAME = 'test';
    process.env.MCP_SERVER_VERSION = '1.0.0';
    process.env.MAX_REQUESTS_PER_MINUTE = '1';
    process.env.MAX_TOKENS_PER_REQUEST = '1';
    process.env.REQUEST_TIMEOUT_MS = '1';
    process.env.MAX_RETRIES = '0';
    process.env.RETRY_DELAY_MS = '1';
    process.env.DEFAULT_MODEL = 'model';
    process.env.DEFAULT_TEMPERATURE = '0';
    process.env.DEFAULT_TOP_P = '0';
    process.env.DEFAULT_MAX_TOKENS = '1';

    const loadedConfig = getConfig();

    expect(loadedConfig.MCP_SERVER_PORT).toBe(8080); // Default value
    expect(loadedConfig.LOG_LEVEL).toBe('info'); // Default value
    // Ensure other values are also correctly loaded
    expect(loadedConfig.NVIDIA_API_KEY).toBe('test-key');
    expect(loadedConfig.NVIDIA_NIM_BASE_URL).toBe('http://localhost');
  });
});
