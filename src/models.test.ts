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
      
      // Check new image generation models
      expect(Object.keys(NIM_MODELS)).toContain('nvidia/stable-diffusion-xl');
      expect(Object.keys(NIM_MODELS)).toContain('nvidia/sdxl-turbo');
      expect(Object.keys(NIM_MODELS)).toContain('stabilityai/sd-3-medium');
      expect(Object.keys(NIM_MODELS)).toContain('black-forest-labs/flux.1-dev');
      
      // Check new multimodal models
      expect(Object.keys(NIM_MODELS)).toContain('nvidia/neva-22b');
      expect(Object.keys(NIM_MODELS)).toContain('microsoft/phi-3.5-vision-instruct');
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

    it('should have proper image generation model structure', () => {
      const model = NIM_MODELS['nvidia/stable-diffusion-xl'];
      
      expect(model).toBeDefined();
      expect(model.id).toBe('nvidia/stable-diffusion-xl');
      expect(model.category).toBe('image_generation');
      expect(model.supportsImageGeneration).toBe(true);
      expect(model.maxTokens).toBeDefined();
      expect(model.recommendedUseCases).toBeDefined();
      expect(model.imageGenSpecs).toBeDefined();
      expect(model.imageGenSpecs?.maxImagesPerRequest).toBeDefined();
      expect(model.imageGenSpecs?.supportedResolutions).toBeDefined();
    });

    it('should have proper multimodal model structure', () => {
      const model = NIM_MODELS['nvidia/neva-22b'];
      
      expect(model).toBeDefined();
      expect(model.id).toBe('nvidia/neva-22b');
      expect(model.category).toBe('multimodal');
      expect(model.supportsVision).toBe(true);
      expect(model.recommendedUseCases).toBeDefined();
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

    it('should return models for image_generation category', () => {
      const imageModels = getModelsByCategory('image_generation');
      
      expect(imageModels.length).toBeGreaterThan(0);
      imageModels.forEach(model => {
        expect(model.category).toBe('image_generation');
        expect(model.supportsImageGeneration).toBe(true);
      });
    });

    it('should return models for multimodal category', () => {
      const multimodalModels = getModelsByCategory('multimodal');
      
      expect(multimodalModels.length).toBeGreaterThan(0);
      multimodalModels.forEach(model => {
        expect(model.category).toBe('multimodal');
        expect(model.supportsVision).toBe(true);
      });
    });

    it('should return models for vision category', () => {
      const visionModels = getModelsByCategory('vision');
      
      expect(visionModels.length).toBeGreaterThan(0);
      visionModels.forEach(model => {
        expect(model.category).toBe('vision');
        expect(model.supportsVision).toBe(true);
      });
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

    it('should return image generation model with correct properties', () => {
      const model = getModel('nvidia/stable-diffusion-xl');
      
      expect(model).toBeDefined();
      expect(model!.id).toBe('nvidia/stable-diffusion-xl');
      expect(model!.category).toBe('image_generation');
      expect(model!.supportsImageGeneration).toBe(true);
    });

    it('should return multimodal model with correct properties', () => {
      const model = getModel('nvidia/neva-22b');
      
      expect(model).toBeDefined();
      expect(model!.id).toBe('nvidia/neva-22b');
      expect(model!.category).toBe('multimodal');
      expect(model!.supportsVision).toBe(true);
    });
  });

  describe('model categories', () => {
    it('should have diverse model categories', () => {
      const categories = new Set(Object.values(NIM_MODELS).map(m => m.category));
      
      expect(categories).toContain('language');
      expect(categories).toContain('embedding');
      expect(categories).toContain('reranking');
      expect(categories).toContain('code');
      expect(categories).toContain('image_generation');
      expect(categories).toContain('multimodal');
      expect(categories).toContain('vision');
      expect(categories.size).toBeGreaterThanOrEqual(7);
    });

    it('should have appropriate context lengths', () => {
      const models = Object.values(NIM_MODELS);
      
      models.forEach(model => {
        expect(model.contextLength).toBeGreaterThan(0);
        // Allow up to 1M for ultra-long context models (Kimi K2.6, MiniMax M3)
        expect(model.contextLength).toBeLessThanOrEqual(1000000); // 1M max
      });
    });

    it('should have recommended use cases for all models', () => {
      const models = Object.values(NIM_MODELS);
      
      models.forEach(model => {
        if (model.recommendedUseCases) {
          expect(Array.isArray(model.recommendedUseCases)).toBe(true);
          expect(model.recommendedUseCases.length).toBeGreaterThan(0);
        }
      });
    });
  });
});