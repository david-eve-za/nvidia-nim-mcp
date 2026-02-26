import { NIM_MODELS, getModelsByCategory, getModel } from './models.js';

describe('Models', () => {
  describe('NIM_MODELS', () => {
    it('should contain expected models', () => {
      // Check that we have models from different categories
      expect(Object.keys(NIM_MODELS)).toContain('meta/llama-3.1-405b-instruct');
      expect(Object.keys(NIM_MODELS)).toContain('nvidia/nv-embedqa-e5-v5');
      expect(Object.keys(NIM_MODELS)).toContain('nvidia/nv-rerankqa-mistral-4b-v3');
      
      // Check that we have the specialized GLM-5 model
      expect(Object.keys(NIM_MODELS)).toContain('z-ai/glm5');
    });

    it('should have proper model structure', () => {
      const model = NIM_MODELS['meta/llama-3.1-405b-instruct'];
      
      expect(model).toBeDefined();
      expect(model.id).toBe('meta/llama-3.1-405b-instruct');
      expect(model.name).toBe('Llama 3.1 405B Instruct');
      expect(model.description).toBeDefined();
      expect(model.category).toBeDefined();
      expect(typeof model.contextLength).toBe('number');
      expect(typeof model.supportsStreaming).toBe('boolean');
      expect(typeof model.supportsFunctionCalling).toBe('boolean');
    });
  });

  describe('getModelsByCategory', () => {
    it('should return models for language category', () => {
      const languageModels = getModelsByCategory('language');
      
      expect(languageModels.length).toBeGreaterThan(0);
      languageModels.forEach(model => {
        expect(model.category).toBe('language');
      });
    });

    it('should return models for embedding category', () => {
      const embeddingModels = getModelsByCategory('embedding');
      
      expect(embeddingModels.length).toBeGreaterThan(0);
      embeddingModels.forEach(model => {
        expect(model.category).toBe('embedding');
      });
    });

    it('should return models for reranking category', () => {
      const rerankingModels = getModelsByCategory('reranking');
      
      expect(rerankingModels.length).toBeGreaterThan(0);
      rerankingModels.forEach(model => {
        expect(model.category).toBe('reranking');
      });
    });

    it('should return models for code category', () => {
      const codeModels = getModelsByCategory('code');
      
      expect(codeModels.length).toBeGreaterThan(0);
      codeModels.forEach(model => {
        expect(model.category).toBe('code');
      });
      
      // Check that GLM-5 is in the code category
      const glm5 = codeModels.find(m => m.id === 'z-ai/glm5');
      expect(glm5).toBeDefined();
      expect(glm5!.name).toBe('GLM-5');
    });

    it('should return empty array for non-existent category', () => {
      const nonexistentModels = getModelsByCategory('nonexistent' as any);
      expect(nonexistentModels).toEqual([]);
    });
  });

  describe('getModel', () => {
    it('should return a specific model by ID', () => {
      const model = getModel('meta/llama-3.1-405b-instruct');
      
      expect(model).toBeDefined();
      expect(model!.id).toBe('meta/llama-3.1-405b-instruct');
      expect(model!.name).toBe('Llama 3.1 405B Instruct');
    });

    it('should return undefined for non-existent model', () => {
      const model = getModel('nonexistent-model');
      expect(model).toBeUndefined();
    });

    it('should return the GLM-5 model with correct properties', () => {
      const model = getModel('z-ai/glm5');
      
      expect(model).toBeDefined();
      expect(model!.id).toBe('z-ai/glm5');
      expect(model!.name).toBe('GLM-5');
      expect(model!.category).toBe('code');
      expect(model!.supportsFunctionCalling).toBe(true);
      expect(model!.supportsStreaming).toBe(true);
    });
  });

  describe('model categories', () => {
    it('should have diverse model categories', () => {
      const categories = new Set(Object.values(NIM_MODELS).map(m => m.category));
      
      expect(categories).toContain('language');
      expect(categories).toContain('embedding');
      expect(categories).toContain('reranking');
      expect(categories).toContain('code');
      expect(categories.size).toBeGreaterThanOrEqual(4);
    });

    it('should have appropriate context lengths', () => {
      const models = Object.values(NIM_MODELS);
      
      models.forEach(model => {
        expect(model.contextLength).toBeGreaterThan(0);
        expect(model.contextLength).toBeLessThanOrEqual(131072); // 128K max
      });
    });
  });
});