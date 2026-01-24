import { SearchClient, AzureKeyCredential } from '@azure/search-documents';
import { z } from 'zod/v3';
import { validateWithZod } from '../../utilities/zodUtility.js';

const validationSchema = z.object({
  endpoint: z.string().url('Invalid Azure AI Search Endpoint'),
  apiKey: z.string().min(1, 'API Key is required'),
  indexName: z.string().min(1, 'Index Name is required'),
  document: z.object({
    id: z.string().min(1),
    fileName: z.string().min(1),
    url: z.string().url(),
    documentType: z.string().optional(),
    summary: z.string().optional(),
    cleanedContent: z.string().optional(),
    content: z.string().min(1),
    uploadedAt: z.string().datetime().optional(),
    uploadedBy: z.string().optional(),
    contentVector: z.array(z.number()).optional(), // Optional, as some docs might just be lexical-only initially
  }),
});

export type UpsertDocumentParams = z.infer<typeof validationSchema>;

/**
 * Uploads or merges a single document into the Azure AI Search index.
 *
 * @param {string} endpoint - The Azure AI Search service endpoint
 * @param {string} apiKey - The admin API key
 * @param {string} indexName - The name of the index
 * @param {object} document - The document object to index
 * @returns {Promise<void>}
 */
export async function upsertDocument(
  endpoint: UpsertDocumentParams['endpoint'],
  apiKey: UpsertDocumentParams['apiKey'],
  indexName: UpsertDocumentParams['indexName'],
  document: UpsertDocumentParams['document'],
): Promise<void> {
  const validationResult = validateWithZod(validationSchema, {
    endpoint,
    apiKey,
    indexName,
    document,
  });

  if (validationResult.isError) {
    throw new Error(`Document upsert validation failed: ${JSON.stringify(validationResult.error)}`);
  }

  try {
    const client = new SearchClient(endpoint, indexName, new AzureKeyCredential(apiKey));

    await client.mergeOrUploadDocuments([document]);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    throw new Error(`Failed to upsert document to index '${indexName}': ${errorMessage}`);
  }
}
