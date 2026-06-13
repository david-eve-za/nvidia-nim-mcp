import { ToolHandlers } from './handlers.js';
import { NIMClient } from './client.js';

// Mock the NIMClient
jest.mock('./client.js', () => {
  return {
    NIMClient: jest.fn().mockImplementation(() => {
      return {
        chatCompletion: jest.fn(),
        embeddings: jest.fn(),
        rerank: jest.fn(),
        listModels: jest.fn(),
        generateImage: jest.fn(),
        analyzeImage: jest.fn(),
      };
    }),
  };
});

describe('ToolHandlers', () => {
  let handlers: ToolHandlers;
  let mockClient: jest.Mocked<NIMClient>;

  beforeEach(() => {
    // Setup environment variables
    process.env.NVIDIA_API_KEY = 'test-key';
    process.env.NVIDIA_NIM_BASE_URL = 'https://test.api.nvidia.com/v1';
    process.env.MCP_SERVER_NAME = 'test-server';
    process.env.MCP_SERVER_VERSION = '1.0.0';
    process.env.MAX_REQUESTS_PER_MINUTE = '100';
    process.env.REQUEST_TIMEOUT_MS = '5000';
    process.env.MAX_RETRIES = '3';
    process.env.RETRY_DELAY_MS = '100';
    process.env.DEFAULT_MODEL = 'test-default-model';
    process.env.DEFAULT_TEMPERATURE = '0.7';
    process.env.DEFAULT_TOP_P = '0.9';
    process.env.DEFAULT_MAX_TOKENS = '1000';
    process.env.MAX_TOKENS_PER_REQUEST = '2000';
    process.env.ENABLE_IMAGE_GENERATION = 'true';
    process.env.ENABLE_VISION = 'true';
    process.env.ENABLE_MULTIMODAL = 'true';
    process.env.DEFAULT_IMAGE_MODEL = 'nvidia/stable-diffusion-xl';

    // Create mock client
    mockClient = new NIMClient() as jest.Mocked<NIMClient>;
    handlers = new ToolHandlers(mockClient);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('handle', () => {
    it('should handle unknown tool gracefully', async () => {
      const result = await handlers.handle('unknown_tool', {});
      
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Unknown tool: unknown_tool');
    });

    it('should handle tool execution errors', async () => {
      mockClient.chatCompletion.mockRejectedValue(new Error('API Error'));
      
      const result = await handlers.handle('chat_completion', {
        messages: [{ role: 'user' as const, content: 'Hello' }],
      });
      
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('API Error');
    });
  });

  describe('chatCompletion', () => {
    it('should handle chat completion requests', async () => {
      const mockResponse = {
        id: 'test-id',
        object: 'chat.completion',
        created: Date.now(),
        model: 'test-model',
        choices: [{
          index: 0,
          message: { content: 'Test response', role: 'assistant' },
          finish_reason: 'stop',
        }],
        usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 },
      };

      mockClient.chatCompletion.mockResolvedValue(mockResponse);

      const args = {
        model: 'test-model',
        messages: [{ role: 'user' as const, content: 'Hello' }],
        temperature: 0.8,
      };

      const result = await handlers.handle('chat_completion', args);

      expect(result.isError).toBeFalsy();
      expect(JSON.parse(result.content[0].text)).toEqual({
        id: 'test-id',
        model: 'test-model',
        content: 'Test response',
        finish_reason: 'stop',
        usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 },
      });

      expect(mockClient.chatCompletion).toHaveBeenCalled();
    });

    it('should prepend system prompt when provided', async () => {
      const mockResponse = {
        id: 'test-id',
        object: 'chat.completion',
        created: Date.now(),
        model: 'test-model',
        choices: [{
          index: 0,
          message: { content: 'Test response', role: 'assistant' },
          finish_reason: 'stop',
        }],
        usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 },
      };

      mockClient.chatCompletion.mockResolvedValue(mockResponse);

      const args = {
        messages: [{ role: 'user' as const, content: 'Hello' }],
        system_prompt: 'You are a helpful assistant',
        temperature: 0.8,
      };

      await handlers.handle('chat_completion', args);

      expect(mockClient.chatCompletion).toHaveBeenCalled();
    });
  });

  describe('textGeneration', () => {
    it('should handle text generation requests', async () => {
      const mockResponse = {
        id: 'test-id',
        object: 'chat.completion',
        created: Date.now(),
        model: 'test-model',
        choices: [{
          index: 0,
          message: { content: 'Generated text', role: 'assistant' },
          finish_reason: 'stop',
        }],
        usage: { prompt_tokens: 5, completion_tokens: 15, total_tokens: 20 },
      };

      mockClient.chatCompletion.mockResolvedValue(mockResponse);

      const args = {
        prompt: 'Generate a story',
        temperature: 0.7,
      };

      const result = await handlers.handle('text_generation', args);

      expect(result.isError).toBeFalsy();
      expect(JSON.parse(result.content[0].text)).toEqual({
        model: 'test-model',
        text: 'Generated text',
        finish_reason: 'stop',
        usage: { prompt_tokens: 5, completion_tokens: 15, total_tokens: 20 },
      });
    });

    it('should include system prompt when provided', async () => {
      const mockResponse = {
        id: 'test-id',
        object: 'chat.completion',
        created: Date.now(),
        model: 'test-model',
        choices: [{
          index: 0,
          message: { content: 'Generated text', role: 'assistant' },
          finish_reason: 'stop',
        }],
        usage: { prompt_tokens: 5, completion_tokens: 15, total_tokens: 20 },
      };

      mockClient.chatCompletion.mockResolvedValue(mockResponse);

      const args = {
        prompt: 'Generate a story',
        system_prompt: 'You are a creative writer',
        temperature: 0.7,
      };

      await handlers.handle('text_generation', args);

      expect(mockClient.chatCompletion).toHaveBeenCalled();
    });
  });

  describe('createEmbeddings', () => {
    it('should handle embedding requests', async () => {
      const mockResponse = {
        object: 'list',
        model: 'test-embedding-model',
        data: [
          { object: 'embedding', index: 0, embedding: [0.1, 0.2, 0.3] },
          { object: 'embedding', index: 1, embedding: [0.4, 0.5, 0.6] },
        ],
        usage: { prompt_tokens: 10, total_tokens: 10 },
      };

      mockClient.embeddings.mockResolvedValue(mockResponse);

      const args = {
        model: 'test-embedding-model',
        input: ['Text 1', 'Text 2'],
      };

      const result = await handlers.handle('create_embeddings', args);

      expect(result.isError).toBeFalsy();
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.model).toBe('test-embedding-model');
      expect(parsed.embeddings).toHaveLength(2);
      expect(parsed.embeddings[0]).toEqual({
        index: 0,
        text: 'Text 1',
        dimensions: 3,
        embedding: [0.1, 0.2, 0.3],
      });
    });
  });

  describe('rerankPassages', () => {
    it('should handle rerank requests', async () => {
      const mockResponse = {
        rankings: [
          { index: 1, logit: 0.9, passage: { text: 'Passage 2' } },
          { index: 0, logit: 0.7, passage: { text: 'Passage 1' } },
        ],
        usage: { prompt_tokens: 5, total_tokens: 15 },
      };

      mockClient.rerank.mockResolvedValue(mockResponse);

      const args = {
        query: 'Test query',
        passages: ['Passage 1', 'Passage 2'],
        top_k: 2,
      };

      const result = await handlers.handle('rerank_passages', args);

      expect(result.isError).toBeFalsy();
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.query).toBe('Test query');
      expect(parsed.rankings).toHaveLength(2);
      expect(parsed.rankings[0]).toEqual({
        rank: 1,
        original_index: 1,
        score: 0.9,
        text: 'Passage 2',
      });
    });
  });

  describe('functionCalling', () => {
    it('should handle function calling requests', async () => {
      const mockResponse = {
        id: 'test-id',
        object: 'chat.completion',
        created: Date.now(),
        model: 'test-model',
        choices: [{
          index: 0,
          message: {
            content: 'I will call the function',
            role: 'assistant',
            tool_calls: [{
              id: 'call_1',
              type: 'function' as const,
              function: {
                name: 'get_weather',
                arguments: '{"city":"Paris"}',
              },
            }],
          },
          finish_reason: 'tool_calls',
        }],
        usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 },
      };

      mockClient.chatCompletion.mockResolvedValue(mockResponse);

      const args = {
        model: 'test-model',
        messages: [{ role: 'user' as const, content: 'What is the weather in Paris?' }],
        tools: [{
          type: 'function' as const,
          function: {
            name: 'get_weather',
            description: 'Get weather information',
            parameters: {
              type: 'object',
              properties: {
                city: { type: 'string' },
              },
              required: ['city'],
            },
          },
        }],
      };

      const result = await handlers.handle('function_calling', args);

      expect(result.isError).toBeFalsy();
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.model).toBe('test-model');
      expect(parsed.tool_calls).toHaveLength(1);
      expect(parsed.tool_calls[0].function).toBe('get_weather');
      expect(parsed.tool_calls[0].arguments).toEqual({ city: 'Paris' });
    });
  });

  describe('listModels', () => {
    it('should handle list models requests', async () => {
      const args = {
        category: 'language' as const,
      };

      const result = await handlers.handle('list_models', args);

      expect(result.isError).toBeFalsy();
      // listModels doesn't call the client's listModels method, it uses local catalog
    });
  });

  describe('getModelInfo', () => {
    it('should handle get model info requests', async () => {
      const args = {
        model_id: 'meta/llama-3.1-405b-instruct',
      };

      const result = await handlers.handle('get_model_info', args);

      expect(result.isError).toBeFalsy();
    });

    it('should return error for unknown model', async () => {
      const args = {
        model_id: 'unknown-model',
      };

      const result = await handlers.handle('get_model_info', args);

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('not found in catalog');
    });
  });

  describe('generateImage', () => {
    it('should handle image generation requests', async () => {
      const mockResponse = {
        model: 'nvidia/stable-diffusion-xl',
        created: Date.now(),
        data: [
          { url: 'https://example.com/image1.jpg', revised_prompt: 'Enhanced prompt' },
          { url: 'https://example.com/image2.jpg', revised_prompt: 'Enhanced prompt 2' },
        ],
        usage: { total_images: 2 },
      };

      mockClient.generateImage.mockResolvedValue(mockResponse);

      const args = {
        prompt: 'A beautiful sunset over mountains',
        width: 1024,
        height: 1024,
        num_images: 2,
      };

      const result = await handlers.handle('generate_image', args);

      expect(result.isError).toBeFalsy();
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.model).toBe('nvidia/stable-diffusion-xl');
      expect(parsed.images).toHaveLength(2);
      expect(parsed.images[0].url).toBe('https://example.com/image1.jpg');
      expect(parsed.images[0].revised_prompt).toBe('Enhanced prompt');
    });

    it('should use default model when not specified', async () => {
      const mockResponse = {
        model: 'nvidia/stable-diffusion-xl',
        created: Date.now(),
        data: [{ url: 'https://example.com/image.jpg' }],
        usage: { total_images: 1 },
      };

      mockClient.generateImage.mockResolvedValue(mockResponse);

      const args = {
        prompt: 'A beautiful sunset',
      };

      const result = await handlers.handle('generate_image', args);

      expect(result.isError).toBeFalsy();
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.model).toBe('nvidia/stable-diffusion-xl');
    });
  });

  describe('analyzeImage', () => {
    it('should handle image analysis requests', async () => {
      const mockResponse = {
        model: 'meta/llama-3.2-90b-vision-instruct',
        choices: [{
          index: 0,
          message: { content: 'This image shows a beautiful sunset over mountains.', role: 'assistant' },
          finish_reason: 'stop',
        }],
        usage: { prompt_tokens: 50, completion_tokens: 30, total_tokens: 80 },
      };

      mockClient.analyzeImage.mockResolvedValue(mockResponse);

      const args = {
        image_url: 'https://example.com/image.jpg',
        prompt: 'Describe this image',
      };

      const result = await handlers.handle('analyze_image', args);

      expect(result.isError).toBeFalsy();
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.model).toBe('meta/llama-3.2-90b-vision-instruct');
      expect(parsed.analysis).toBe('This image shows a beautiful sunset over mountains.');
      expect(parsed.finish_reason).toBe('stop');
    });

    it('should use default vision model when not specified', async () => {
      const mockResponse = {
        model: 'meta/llama-3.2-90b-vision-instruct',
        choices: [{
          index: 0,
          message: { content: 'Image analysis result.', role: 'assistant' },
          finish_reason: 'stop',
        }],
        usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 },
      };

      mockClient.analyzeImage.mockResolvedValue(mockResponse);

      const args = {
        image_url: 'https://example.com/image.jpg',
        prompt: 'What is in this image?',
      };

      const result = await handlers.handle('analyze_image', args);

      expect(result.isError).toBeFalsy();
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.model).toBe('meta/llama-3.2-90b-vision-instruct');
    });
  });

  describe('multimodalTask', () => {
    it('should handle multimodal task requests', async () => {
      const mockResponse = {
        model: 'nvidia/neva-22b',
        choices: [{
          index: 0,
          message: { content: 'Analysis of the multimodal input.', role: 'assistant' },
          finish_reason: 'stop',
        }],
        usage: { prompt_tokens: 100, completion_tokens: 50, total_tokens: 150 },
      };

      mockClient.chatCompletion.mockResolvedValue(mockResponse);

      const args = {
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: 'Describe this image' },
              { type: 'image_url', image_url: { url: 'https://example.com/image.jpg' } },
            ],
          },
        ],
      };

      const result = await handlers.handle('multimodal_task', args);

      expect(result.isError).toBeFalsy();
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.model).toBe('nvidia/neva-22b');
      expect(parsed.content).toBe('Analysis of the multimodal input.');
    });

    it('should handle multimodal tasks with string content', async () => {
      const mockResponse = {
        model: 'nvidia/neva-22b',
        choices: [{
          index: 0,
          message: { content: 'Text response.', role: 'assistant' },
          finish_reason: 'stop',
        }],
        usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 },
      };

      mockClient.chatCompletion.mockResolvedValue(mockResponse);

      const args = {
        messages: [
          { role: 'user', content: 'Simple text message' },
        ],
      };

      const result = await handlers.handle('multimodal_task', args);

      expect(result.isError).toBeFalsy();
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.content).toBe('Text response.');
    });
  });

  describe('listModels (enhanced)', () => {
    it('should include image_generation category', async () => {
      const args = {
        category: 'image_generation',
        include_details: true,
      };

      const result = await handlers.handle('list_models', args);

      expect(result.isError).toBeFalsy();
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.category).toBe('image_generation');
      expect(parsed.models.length).toBeGreaterThan(0);
      expect(parsed.models[0]).toHaveProperty('supports_image_generation');
    });

    it('should include multimodal category', async () => {
      const args = {
        category: 'multimodal',
        include_details: true,
      };

      const result = await handlers.handle('list_models', args);

      expect(result.isError).toBeFalsy();
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.category).toBe('multimodal');
      expect(parsed.models.length).toBeGreaterThan(0);
      expect(parsed.models[0]).toHaveProperty('supports_vision', true);
    });

    it('should include detailed metadata when requested', async () => {
      const args = {
        category: 'language',
        include_details: true,
      };

      const result = await handlers.handle('list_models', args);

      expect(result.isError).toBeFalsy();
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.models[0]).toHaveProperty('recommended_use_cases');
      // The property is max_tokens in the output (snake_case from handler)
      expect(parsed.models[0]).toHaveProperty('max_tokens');
    });
  });
});