import { SearchIndexClient, AzureKeyCredential } from '@azure/search-documents';
import { z } from 'zod/v3';
import { validateWithZod } from '../../utilities/zodUtility.js';

const validationSchema = z.object({
  endpoint: z.string().url('Invalid Azure AI Search Endpoint'),
  apiKey: z.string().min(1, 'API Key is required'),
  indexName: z.string().min(1, 'Index Name is required'),
});

export type GetConfigParams = z.infer<typeof validationSchema>;

/**
 * Retrieves the configuration of an existing Azure AI Search index.
 * Useful for debugging schema or semantic settings.
 *
 * @param {string} endpoint - Azure AI Search Endpoint
 * @param {string} apiKey - Admin API Key
 * @param {string} indexName - Index Name
 * @returns {Promise<any>} The full index definition object
 */
export async function getIndexConfiguration(
  endpoint: GetConfigParams['endpoint'],
  apiKey: GetConfigParams['apiKey'],
  indexName: GetConfigParams['indexName'],
): Promise<any> {
  const validationResult = validateWithZod(validationSchema, { endpoint, apiKey, indexName });

  if (validationResult.isError) {
    throw new Error(`Get index config validation failed: ${JSON.stringify(validationResult.error)}`);
  }

  try {
    const client = new SearchIndexClient(endpoint, new AzureKeyCredential(apiKey));
    const index = await client.getIndex(indexName);
    return index;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    // Return null if index not found instead of throwing, or rethrow based on preference.
    // Here we rethrow with context.
    throw new Error(`Failed to get configuration for index '${indexName}': ${errorMessage}`);
  }
}
