import { generateText, generateObject, streamText, type LanguageModel } from 'ai';
import { z } from 'zod';

/**
 * Basic schema for AI text generation
 * Note: This is a simplified implementation that only supports core parameters.
 * Advanced parameters like topP, frequencyPenalty, presencePenalty, and stopSequences
 * are not accessible in this basic version.
 */
const schema = z.object({
  model: z.any(), // LanguageModel is a type, not a runtime class
  systemPrompt: z.string().default('You are a helpful assistant.'),
  prompt: z.string().min(1, 'Prompt is required'),
  // Optional parameters - limited to basic options only
  options: z.object({
    maxTokens: z.number().min(1, 'Max tokens is required'),
    temperature: z.number().min(0).max(1).default(0.7),
  }),
});

/**
 * Generates a text response using the AI model
 *
 * @param model - The language model instance (Azure OpenAI, OpenAI, etc.)
 * @param systemPrompt - The system prompt that defines the AI's behavior
 * @param prompt - The user's input prompt
 * @param options - Optional generation parameters (maxTokens, temperature)
 * @returns Promise that resolves to the generated text
 *
 * @example
 * ```typescript
 * const response = await generateTextResponse(
 *   azureModel,
 *   'You are a helpful coding assistant.',
 *   'Write a function to sort an array',
 *   { maxTokens: 500, temperature: 0.7 }
 * );
 * ```
 */
export const generateLLMTextResponse = async (
  model: LanguageModel,
  systemPrompt: string,
  prompt: string,
  options?: z.infer<typeof schema.shape.options>,
) => {
  const result = await generateText({
    model,
    system: systemPrompt,
    prompt,
    ...(options || {}),
  });

  return result;
};

/**
 * Generates a conversation response using the AI model
 * Handles multi-turn conversations with message history
 *
 * @param model - The language model instance
 * @param systemPrompt - The system prompt that defines the AI's behavior
 * @param messages - Array of conversation messages
 * @param options - Optional generation parameters
 * @returns Promise that resolves to the generated response
 */
export const generateLLMStreamedTextResponse = async (
  model: LanguageModel,
  systemPrompt: string,
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
  options?: z.infer<typeof schema.shape.options>,
) => {
  const result = await streamText({
    model,
    system: systemPrompt,
    messages,
    ...(options || {}),
  });

  return result;
};

/**
 * Summarizes and consolidates a conversation using AI to remove redundancy
 * while preserving all key information for seamless continuation
 *
 * @param model - The language model instance
 * @param messages - Array of conversation messages to consolidate
 * @param options - Optional generation parameters
 * @returns Promise that resolves to consolidated conversation messages
 *
 * @example
 * ```typescript
 * const consolidatedMessages = await consolidateConversation(
 *   azureModel,
 *   longConversationHistory,
 *   { maxTokens: 2000, temperature: 0.3 }
 * );
 * ```
 */
export const consolidateLLMConversation = async (
  model: LanguageModel,
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
  options?: z.infer<typeof schema.shape.options>,
): Promise<Array<{ role: 'user' | 'assistant' | 'system'; content: string }>> => {
  const summarizerPrompt = `You are a context summarizer. Your job is to take a long prior conversation and compress it into a minimal set of messages that preserve all key information without repetition. Output MUST be a JSON array of messages in the format [{"role": "user"|"assistant"|"system", "content": "..."}].

Rules:
1. Preserve factual details, user preferences, decisions, and standing instructions.
2. Remove redundant phrasing, repeated clarifications, and filler.
3. Consolidate recurring themes into one canonical statement.
4. Store ongoing directives (e.g., tone, style, priorities) as a single persistent system message.
5. Keep critical technical/code snippets intact, but remove duplicates.
6. Maintain chronological order where it matters; otherwise group by theme.
7. The output should be concise but complete enough for downstream models to continue the conversation seamlessly.

Your output must be ONLY the consolidated JSON array — no explanation or commentary.`;

  const result = await generateObject({
    model,
    system: summarizerPrompt,
    prompt: `Please consolidate this conversation:\n${JSON.stringify(messages, null, 2)}`,
    schema: z.array(
      z.object({
        role: z.enum(['user', 'assistant', 'system']),
        content: z.string(),
      }),
    ),
    ...(options || {}),
  });

  return result.object;
};
