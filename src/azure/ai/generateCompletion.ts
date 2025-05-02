import { AzureOpenAI } from 'openai';
import { AzureKeyCredential } from '@azure/core-auth';
import { validateWithZod } from '../../utilities/zodUtility.js';
import { z } from 'zod';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';

const validationSchema = z.object({
  endpoint: z.string().url('Valid Azure OpenAI endpoint URL is required'),
  apiKey: z.string().min(1, 'API key is required'),
  deploymentName: z.string().min(1, 'Deployment name is required'),
  messages: z.array(
    z.object({
      role: z.enum(['system', 'user', 'assistant', 'function']),
      content: z.string(),
      name: z.string().optional(),
    }),
  ) as z.ZodType<ChatCompletionMessageParam[]>,
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().min(1).optional(),
  topP: z.number().min(0).max(1).optional(),
  frequencyPenalty: z.number().min(-2).max(2).optional(),
  presencePenalty: z.number().min(-2).max(2).optional(),
  stop: z.array(z.string()).optional(),
  returnJson: z.boolean().optional(),
});

type CompletionParams = z.infer<typeof validationSchema>;

/**
 * Generates a single-turn completion using an Azure-hosted OpenAI model.
 * This function is designed for one-off completions and should not be used for
 * maintaining chat history or conversational interactions.
 *
 * @param {string} endpoint - Azure OpenAI endpoint URL
 * @param {string} apiKey - Azure OpenAI API key
 * @param {string} deploymentName - Name of the deployed model
 * @param {Array<{role: string, content: string}>} messages - Array of messages for the conversation.
 *                        Should typically include a system message and a single user message.
 *                        Not designed for maintaining chat history.
 * @param {Object} options - Optional parameters
 * @param {number} [options.temperature] - Controls randomness (0-2)
 * @param {number} [options.maxTokens] - Maximum number of tokens to generate
 * @param {number} [options.topP] - Controls diversity via nucleus sampling (0-1)
 * @param {number} [options.frequencyPenalty] - Controls repetition (-2 to 2)
 * @param {number} [options.presencePenalty] - Controls topic diversity (-2 to 2)
 * @param {string[]} [options.stop] - Sequences where the API will stop generating
 * @param {boolean} [options.returnJson] - Whether to force JSON response format
 *
 * @returns {Promise<string>} The generated completion text
 *
 * @throws {Error}
 *  - If input validation fails
 *  - If the API request fails
 *  - If the response is invalid
 *
 * @example
 * try {
 *   const completion = await generateCompletion(
 *     'https://your-resource.openai.azure.com',
 *     'your-api-key',
 *     'your-deployment-name',
 *     [
 *       { role: 'system', content: 'You are a helpful assistant.' },
 *       { role: 'user', content: 'What is the capital of France?' }
 *     ],
 *     {
 *       temperature: 0.7,
 *       returnJson: true
 *     }
 *   );
 *   console.log(completion);
 * } catch (error) {
 *   console.error('Generation failed:', error.message);
 * }
 */
export async function generateCompletion(
  endpoint: CompletionParams['endpoint'],
  apiKey: CompletionParams['apiKey'],
  deploymentName: CompletionParams['deploymentName'],
  messages: CompletionParams['messages'],
  options: Omit<CompletionParams, 'endpoint' | 'apiKey' | 'deploymentName' | 'messages'> = {},
): Promise<string> {
  // Validate inputs
  const validationResult = validateWithZod(validationSchema, {
    endpoint,
    apiKey,
    deploymentName,
    messages,
    ...options,
  });

  if (validationResult.isError) {
    throw new Error(`Completion validation failed: ${JSON.stringify(validationResult.error)}`);
  }

  try {
    const client = new AzureOpenAI({
      endpoint,
      apiKey,
      apiVersion: '2025-01-01-preview',
    });

    const completionOptions = {
      model: deploymentName,
      messages,
      temperature: options.temperature,
      max_tokens: options.maxTokens,
      top_p: options.topP,
      frequency_penalty: options.frequencyPenalty,
      presence_penalty: options.presencePenalty,
      stop: options.stop,
      ...(options.returnJson && { response_format: { type: 'json_object' as const } }),
    };

    const result = await client.chat.completions.create(completionOptions);

    return result.choices[0]?.message?.content ?? '';
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    throw new Error(`Failed to generate completion - Error: ${errorMessage}`);
  }
}
