import { createAzure } from '@ai-sdk/azure';
import { createOpenAI } from '@ai-sdk/openai';
import type { LanguageModel, EmbeddingModel } from 'ai';

import { z } from 'zod/v3';

//Azure AI Foundry Schema
const azureAIFoundrySchema = z.object({
  resourceName: z.string().min(1, 'Resource name is required').trim(),
  apiKey: z.string().min(1, 'API key is required').trim(),
});

export type AzureAIFoundryConfig = z.infer<typeof azureAIFoundrySchema>;

export const createAzureLLMClient = (resourceName: string, apiKey: string, modelName: string): LanguageModel => {
  const validatedConfig = azureAIFoundrySchema.parse({ resourceName, apiKey });

  const azure = createAzure({
    resourceName: validatedConfig.resourceName,
    apiKey: validatedConfig.apiKey,
  });

  const model = azure.languageModel(modelName);

  return model;
};

export const createAzureEmbeddingClient = (resourceName: string, apiKey: string, modelName: string): EmbeddingModel => {
  const validatedConfig = azureAIFoundrySchema.parse({ resourceName, apiKey });

  const azure = createAzure({
    resourceName: validatedConfig.resourceName,
    apiKey: validatedConfig.apiKey,
  });

  return azure.embedding(modelName);
};

//OpenAI Schema
const openAISchema = z.object({
  apiKey: z.string().min(1, 'API key is required').trim(),
  modelName: z.string().min(1, 'Model name is required').trim(),
});

export type OpenAISchema = z.infer<typeof openAISchema>;

export const createOpenAILLMClient = (apiKey: string, modelName: string): LanguageModel => {
  const validatedConfig = openAISchema.parse({ apiKey, modelName });

  const openAI = createOpenAI({
    apiKey: validatedConfig.apiKey,
  });

  const model = openAI.languageModel(modelName);

  return model;
};

export const createOpenAIEmbeddingClient = (apiKey: string, modelName: string): EmbeddingModel => {
  const validatedConfig = openAISchema.parse({ apiKey, modelName });

  const openAI = createOpenAI({
    apiKey: validatedConfig.apiKey,
  });

  return openAI.embedding(modelName);
};
