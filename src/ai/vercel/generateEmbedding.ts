import { embed, type EmbeddingModel } from 'ai';
import { z } from 'zod/v3';
import { validateWithZod } from '../../utilities/zodUtility.js';

const validationSchema = z.object({
  text: z.string().min(1, 'Text to embed is required'),
});

/**
 * Generates a vector embedding for the given text using the Vercel AI SDK.
 *
 * @param {EmbeddingModel<string>} embeddingModel - The initialized embedding model (OpenAI or Azure)
 * @param {string} text - The text content to convert into a vector
 * @returns {Promise<number[]>} The vector embedding as an array of numbers
 */
export async function generateEmbedding(embeddingModel: EmbeddingModel<string>, text: string): Promise<number[]> {
  const validationResult = validateWithZod(validationSchema, { text });

  if (validationResult.isError) {
    throw new Error(`Embedding validation failed: ${JSON.stringify(validationResult.error)}`);
  }

  try {
    // Replace newlines with spaces to improve embedding quality (common practice)
    const cleanText = text.replace(/\n/g, ' ');

    const { embedding } = await embed({
      model: embeddingModel,
      value: cleanText,
    });

    return embedding;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    throw new Error(`Failed to generate embedding: ${errorMessage}`);
  }
}
