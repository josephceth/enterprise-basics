import { generateObject, type LanguageModel } from 'ai';
import { z } from 'zod';

// Options schema for generic functions
export const generationOptionsSchema = z.object({
  maxTokens: z.number().min(1, 'Max tokens is required'),
  temperature: z.number().min(0).max(1).default(0.7),
});

/**
 * Generic function to generate structured output using any Zod schema
 * Provides type-safe AI generation with guaranteed output structure
 *
 * @param model - The language model instance
 * @param systemPrompt - The system prompt that defines the AI's behavior
 * @param prompt - The user's input prompt
 * @param schema - Zod schema defining the expected output structure
 * @param options - Optional generation parameters
 * @returns Promise that resolves to the validated structured output
 *
 * @example
 * ```typescript
 * // Generate a user profile
 * const userProfile = await generateStructuredOutput(
 *   azureModel,
 *   'You are a user profile generator.',
 *   'Create a profile for a software developer',
 *   z.object({
 *     name: z.string(),
 *     role: z.string(),
 *     skills: z.array(z.string()),
 *     experience: z.number()
 *   })
 * );
 *
 * // Generate a task list
 * const tasks = await generateStructuredOutput(
 *   azureModel,
 *   'You are a task planner.',
 *   'Plan a project launch',
 *   z.array(z.object({
 *     title: z.string(),
 *     priority: z.enum(['low', 'medium', 'high']),
 *     deadline: z.string()
 *   }))
 * );
 * ```
 */
export const generateLLMStructuredOutput = async <T extends z.ZodType>(
  model: LanguageModel,
  systemPrompt: string,
  prompt: string,
  schema: T,
  options?: z.infer<typeof generationOptionsSchema>,
): Promise<z.infer<T>> => {
  const result = await generateObject({
    model,
    system: systemPrompt,
    prompt,
    schema,
    ...(options || {}),
  });

  return result.object;
};
