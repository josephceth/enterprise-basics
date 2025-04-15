import { z } from 'zod';
import { AzureOpenAIEmbeddings } from '@langchain/openai';
import { validateWithZod } from '../../utilities/zodUtility';

// Define validation schema for input parameters
const validationSchema = z.object({
  texts: z.array(z.string()).min(1, 'At least one text string is required'),
  azureApiKey: z.string().min(1, 'Azure OpenAI API Key is required'),
  azureInstanceName: z.string().min(1, 'Azure OpenAI Instance Name is required'),
  azureDeploymentName: z.string().min(1, 'Azure OpenAI Embeddings Deployment Name is required'),
  azureApiVersion: z.string().min(1, 'Azure OpenAI API Version is required'),
  maxRetries: z.number().int().min(0).optional().default(1),
});

type EmbeddingParams = z.infer<typeof validationSchema>;

/**
 * Creates embeddings for an array of texts using Azure OpenAI via LangChain.
 *
 * @param {string[]} texts - An array of text strings to embed.
 * @param {string} azureApiKey - Your Azure OpenAI API Key.
 * @param {string} azureInstanceName - Your Azure OpenAI instance name.
 * @param {string} azureDeploymentName - Your Azure OpenAI embeddings deployment name.
 * @param {string} azureApiVersion - The Azure OpenAI API version to use.
 * @param {number} [maxRetries=1] - Maximum number of retries for the API call.
 * @returns {Promise<number[][]>} A promise that resolves with an array of embeddings (each embedding is an array of numbers).
 * @throws {Error}
 *  - If validation fails for any input parameter.
 *  - If the embedding generation fails.
 *
 * @example
 * try {
 *   const textsToEmbed = ["Hello world", "How are you?"];
 *   const embeddings = await createEmbeddings(
 *     textsToEmbed,
 *     process.env.AZURE_OPENAI_API_KEY!, // Replace with your key source
 *     process.env.AZURE_OPENAI_API_INSTANCE_NAME!, // Replace with your instance name
 *     process.env.AZURE_OPENAI_API_EMBEDDINGS_DEPLOYMENT_NAME!, // Replace with your deployment name
 *     process.env.AZURE_OPENAI_API_VERSION!, // Replace with your API version
 *     3 // Optional max retries
 *   );
 *   console.log('Generated embeddings:', embeddings.length);
 * } catch (error) {
 *   console.error('Failed to create embeddings:', error.message);
 * }
 */
export async function createEmbeddings(
  texts: EmbeddingParams['texts'],
  azureApiKey: EmbeddingParams['azureApiKey'],
  azureInstanceName: EmbeddingParams['azureInstanceName'],
  azureDeploymentName: EmbeddingParams['azureDeploymentName'],
  azureApiVersion: EmbeddingParams['azureApiVersion'],
  maxRetries: EmbeddingParams['maxRetries'] = 1, // Provide default here as well
): Promise<number[][]> {
  // Validate inputs
  const validationResult = validateWithZod(validationSchema, {
    texts,
    azureApiKey,
    azureInstanceName,
    azureDeploymentName,
    azureApiVersion,
    maxRetries,
  });

  if (validationResult.isError) {
    throw new Error(`Create embeddings validation failed: ${JSON.stringify(validationResult.error)}`);
  }

  try {
    const embeddingsService = new AzureOpenAIEmbeddings({
      azureOpenAIApiKey: azureApiKey,
      azureOpenAIApiInstanceName: azureInstanceName,
      azureOpenAIApiDeploymentName: azureDeploymentName, // Note: Langchain uses DeploymentName for embeddings
      azureOpenAIApiVersion: azureApiVersion,
      maxRetries: maxRetries,
    });

    const embeddings = await embeddingsService.embedDocuments(texts);

    if (!embeddings || embeddings.length !== texts.length) {
      throw new Error('Embeddings generation returned unexpected results.');
    }

    return embeddings;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    throw new Error(`Failed to create embeddings: ${errorMessage}`);
  }
}
