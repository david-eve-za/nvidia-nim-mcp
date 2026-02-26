import {
  ChatCompletionSchema,
  TextGenerationSchema,
  EmbeddingsSchema,
  RerankSchema,
  FunctionCallingSchema,
  ListModelsSchema,
  ModelInfoSchema,
  TOOL_DEFINITIONS
} from './tools.js';

describe('Tools', () => {
  describe('TOOL_DEFINITIONS', () => {
    it('should contain all expected tools', () => {
      const toolNames = TOOL_DEFINITIONS.map(tool => tool.name);
      
      expect(toolNames).toContain('chat_completion');
      expect(toolNames).toContain('text_generation');
      expect(toolNames).toContain('create_embeddings');
      expect(toolNames).toContain('rerank_passages');
      expect(toolNames).toContain('function_calling');
      expect(toolNames).toContain('list_models');
      expect(toolNames).toContain('get_model_info');
    });

    it('should have proper tool definition structure', () => {
      TOOL_DEFINITIONS.forEach(tool => {
        expect(typeof tool.name).toBe('string');
        expect(typeof tool.description).toBe('string');
        expect(typeof tool.inputSchema).toBe('object');
        expect(tool.inputSchema.type).toBe('object');
        expect(tool.inputSchema.properties).toBeDefined();
      });
    });

    it('should have unique tool names', () => {
      const toolNames = TOOL_DEFINITIONS.map(tool => tool.name);
      const uniqueNames = new Set(toolNames);
      expect(toolNames.length).toBe(uniqueNames.size);
    });
  });

  describe('ChatCompletionSchema', () => {
    it('should validate correct chat completion input', () => {
      const validInput = {
        messages: [
          { role: 'user', content: 'Hello' },
        ],
        temperature: 0.7,
        max_tokens: 1000,
      };

      expect(() => ChatCompletionSchema.parse(validInput)).not.toThrow();
    });

    it('should reject invalid chat completion input', () => {
      const invalidInput = {
        // Missing required messages field
        temperature: 0.7,
      };

      expect(() => ChatCompletionSchema.parse(invalidInput)).toThrow();
    });

    it('should accept optional fields', () => {
      const validInput = {
        model: 'test-model',
        messages: [
          { role: 'user', content: 'Hello' },
        ],
        system_prompt: 'You are a helpful assistant',
        temperature: 0.7,
        top_p: 0.9,
        max_tokens: 1000,
        stop: ['\n', 'STOP'],
        seed: 42,
      };

      expect(() => ChatCompletionSchema.parse(validInput)).not.toThrow();
    });

    it('should enforce value constraints', () => {
      const invalidInput = {
        messages: [
          { role: 'user', content: 'Hello' },
        ],
        temperature: 3.0, // Too high
      };

      expect(() => ChatCompletionSchema.parse(invalidInput)).toThrow();
    });
  });

  describe('TextGenerationSchema', () => {
    it('should validate correct text generation input', () => {
      const validInput = {
        prompt: 'Write a story about',
        temperature: 0.7,
      };

      expect(() => TextGenerationSchema.parse(validInput)).not.toThrow();
    });

    it('should reject invalid text generation input', () => {
      const invalidInput = {
        // Missing required prompt field
        temperature: 0.7,
      };

      expect(() => TextGenerationSchema.parse(invalidInput)).toThrow();
    });

    it('should accept optional fields', () => {
      const validInput = {
        prompt: 'Write a story about',
        model: 'test-model',
        system_prompt: 'You are a creative writer',
        temperature: 0.7,
        max_tokens: 1000,
        stop: ['\n', 'THE END'],
      };

      expect(() => TextGenerationSchema.parse(validInput)).not.toThrow();
    });
  });

  describe('EmbeddingsSchema', () => {
    it('should validate correct embeddings input with single string', () => {
      const validInput = {
        input: 'Hello world',
      };

      expect(() => EmbeddingsSchema.parse(validInput)).not.toThrow();
    });

    it('should validate correct embeddings input with array of strings', () => {
      const validInput = {
        input: ['Hello world', 'Goodbye world'],
      };

      expect(() => EmbeddingsSchema.parse(validInput)).not.toThrow();
    });

    it('should reject invalid embeddings input', () => {
      const invalidInput = {
        // Missing required input field
      };

      expect(() => EmbeddingsSchema.parse(invalidInput)).toThrow();
    });

    it('should accept optional fields', () => {
      const validInput = {
        model: 'test-embedding-model',
        input: 'Hello world',
        encoding_format: 'float' as const,
        truncate: 'END' as const,
      };

      expect(() => EmbeddingsSchema.parse(validInput)).not.toThrow();
    });

    it('should enforce enum constraints', () => {
      const invalidInput = {
        input: 'Hello world',
        encoding_format: 'invalid' as any,
      };

      expect(() => EmbeddingsSchema.parse(invalidInput)).toThrow();
    });
  });

  describe('RerankSchema', () => {
    it('should validate correct rerank input with string passages', () => {
      const validInput = {
        query: 'What is machine learning?',
        passages: ['Machine learning is AI', 'Deep learning is subset'],
      };

      expect(() => RerankSchema.parse(validInput)).not.toThrow();
    });

    it('should validate correct rerank input with object passages', () => {
      const validInput = {
        query: 'What is machine learning?',
        passages: [
          { text: 'Machine learning is AI' },
          { text: 'Deep learning is subset' },
        ],
      };

      expect(() => RerankSchema.parse(validInput)).not.toThrow();
    });

    it('should reject invalid rerank input', () => {
      const invalidInput = {
        // Missing required query field
        passages: ['Machine learning is AI'],
      };

      expect(() => RerankSchema.parse(invalidInput)).toThrow();
    });

    it('should accept optional fields', () => {
      const validInput = {
        model: 'test-rerank-model',
        query: 'What is machine learning?',
        passages: ['Machine learning is AI'],
        top_k: 5,
        truncate: 'END' as const,
      };

      expect(() => RerankSchema.parse(validInput)).not.toThrow();
    });

    it('should enforce array length constraints', () => {
      const tooManyPassages = {
        query: 'Test query',
        passages: Array(101).fill('Test passage'), // More than max of 100
      };

      expect(() => RerankSchema.parse(tooManyPassages)).toThrow();
    });
  });

  describe('FunctionCallingSchema', () => {
    it('should validate correct function calling input', () => {
      const validInput = {
        messages: [
          { role: 'user', content: 'What is the weather?' },
        ],
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

      expect(() => FunctionCallingSchema.parse(validInput)).not.toThrow();
    });

    it('should reject invalid function calling input', () => {
      const invalidInput = {
        // Missing required messages and tools fields
      };

      expect(() => FunctionCallingSchema.parse(invalidInput)).toThrow();
    });

    it('should accept optional fields', () => {
      const validInput = {
        model: 'test-model',
        messages: [
          { role: 'user', content: 'What is the weather?' },
        ],
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
        tool_choice: 'auto' as const,
        temperature: 0.7,
        max_tokens: 1000,
      };

      expect(() => FunctionCallingSchema.parse(validInput)).not.toThrow();
    });
  });

  describe('ListModelsSchema', () => {
    it('should validate correct list models input', () => {
      const validInputs = [
        {}, // Empty object (uses defaults)
        { category: 'language' },
        { category: 'embedding' },
        { category: 'reranking' },
        { category: 'code' },
        { category: 'all' },
      ];

      validInputs.forEach(input => {
        expect(() => ListModelsSchema.parse(input)).not.toThrow();
      });
    });

    it('should reject invalid category values', () => {
      const invalidInput = {
        category: 'invalid' as any,
      };

      expect(() => ListModelsSchema.parse(invalidInput)).toThrow();
    });

    it('should set default category to all', () => {
      const result = ListModelsSchema.parse({});
      expect(result.category).toBe('all');
    });
  });

  describe('ModelInfoSchema', () => {
    it('should validate correct model info input', () => {
      const validInput = {
        model_id: 'meta/llama-3.1-405b-instruct',
      };

      expect(() => ModelInfoSchema.parse(validInput)).not.toThrow();
    });

    it('should reject invalid model info input', () => {
      const invalidInput = {
        // Missing required model_id field
      };

      expect(() => ModelInfoSchema.parse(invalidInput)).toThrow();
    });

    it('should accept any string as model_id', () => {
      const validInput = {
        model_id: 'any-model-id',
      };

      expect(() => ModelInfoSchema.parse(validInput)).not.toThrow();
    });
  });
});