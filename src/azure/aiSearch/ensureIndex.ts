import {
  SearchIndexClient,
  AzureKeyCredential,
  type SearchIndex,
  type SemanticConfiguration,
  type SemanticPrioritizedFields,
  type SemanticField,
  type VectorSearch,
  type HnswAlgorithmConfiguration,
  type VectorSearchProfile,
} from '@azure/search-documents';
import { z } from 'zod/v3';
import { validateWithZod } from '../../utilities/zodUtility.js';

const validationSchema = z.object({
  endpoint: z.string().url('Invalid Azure AI Search Endpoint'),
  apiKey: z.string().min(1, 'API Key is required'),
  indexName: z.string().min(1, 'Index Name is required'),
  vectorDimensions: z.number().int().positive().default(1536),
});

export type EnsureIndexParams = z.infer<typeof validationSchema>;

/**
 * Ensures that an Azure AI Search index exists with the required configuration for Hybrid + Semantic Search.
 * If the index does not exist, it creates it.
 * If it exists, it updates it to include missing fields or configurations (where possible).
 *
 * @param {string} endpoint - The Azure AI Search service endpoint
 * @param {string} apiKey - The admin API key
 * @param {string} indexName - The name of the index
 * @param {number} [vectorDimensions=1536] - The dimensionality of the vector embeddings (default: 1536)
 * @returns {Promise<void>}
 */
export async function ensureIndex(
  endpoint: EnsureIndexParams['endpoint'],
  apiKey: EnsureIndexParams['apiKey'],
  indexName: EnsureIndexParams['indexName'],
  vectorDimensions: EnsureIndexParams['vectorDimensions'] = 1536,
): Promise<void> {
  const validationResult = validateWithZod(validationSchema, { endpoint, apiKey, indexName, vectorDimensions });

  if (validationResult.isError) {
    throw new Error(`Index configuration validation failed: ${JSON.stringify(validationResult.error)}`);
  }

  const client = new SearchIndexClient(endpoint, new AzureKeyCredential(apiKey));

  // --- Configuration Definitions ---

  // 1. Vector Search Configuration
  const vectorSearch: VectorSearch = {
    algorithms: [
      {
        name: 'hnsw-config',
        kind: 'hnsw',
        parameters: {
          m: 4,
          efConstruction: 400,
          efSearch: 500,
          metric: 'cosine',
        },
      } as HnswAlgorithmConfiguration,
    ],
    profiles: [
      {
        name: 'vector-profile',
        algorithmConfigurationName: 'hnsw-config',
      } as VectorSearchProfile,
    ],
  };

  // 2. Semantic Search Configuration
  const semanticConfig: SemanticConfiguration = {
    name: 'default',
    prioritizedFields: {
      titleField: { name: 'fileName' },
      contentFields: [{ name: 'cleanedContent' }, { name: 'summary' }],
      keywordsFields: [{ name: 'documentType' }],
    } as SemanticPrioritizedFields,
  };

  // 3. Index Definition
  const indexDefinition: SearchIndex = {
    name: indexName,
    fields: [
      {
        name: 'id',
        type: 'Edm.String',
        key: true,
        filterable: true,
        sortable: false,
        facetable: false,
        searchable: false,
      },
      {
        name: 'fileName',
        type: 'Edm.String',
        searchable: true,
        filterable: false,
        sortable: false,
        facetable: false,
      },
      {
        name: 'url',
        type: 'Edm.String',
        searchable: false,
        filterable: false,
        sortable: false,
        facetable: false,
      },
      {
        name: 'documentType',
        type: 'Edm.String',
        searchable: false,
        filterable: true,
        sortable: false,
        facetable: true,
      },
      {
        name: 'summary',
        type: 'Edm.String',
        searchable: true,
        analyzerName: 'en.lucene',
      },
      {
        name: 'cleanedContent',
        type: 'Edm.String',
        searchable: true,
        analyzerName: 'en.lucene',
      },
      {
        name: 'content',
        type: 'Edm.String',
        searchable: true,
        analyzerName: 'en.lucene',
      },
      {
        name: 'uploadedAt',
        type: 'Edm.DateTimeOffset',
        searchable: false,
        filterable: true,
        sortable: true,
        facetable: false,
      },
      {
        name: 'uploadedBy',
        type: 'Edm.String',
        searchable: false,
        filterable: true,
        sortable: false,
        facetable: true,
      },
      // Vector Field
      {
        name: 'contentVector',
        type: 'Collection(Edm.Single)',
        searchable: true,
        vectorSearchDimensions: vectorDimensions, // Configurable dimensions
        vectorSearchProfileName: 'vector-profile',
      },
    ],
    scoringProfiles: [
      {
        name: 'boost-title-summary',
        textWeights: {
          weights: {
            fileName: 3,
            summary: 2,
            cleanedContent: 1,
            content: 0.5,
          },
        },
      },
    ],
    defaultScoringProfile: 'boost-title-summary',
    vectorSearch,
    semanticSearch: {
      defaultConfigurationName: 'default',
      configurations: [semanticConfig],
    },
  };

  try {
    await client.createOrUpdateIndex(indexDefinition);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    throw new Error(`Failed to ensure vector index: ${errorMessage}`);
  }
}
