import { SearchClient, AzureKeyCredential, type SearchOptions } from '@azure/search-documents';
import { z } from 'zod/v3';
import { validateWithZod } from '../../utilities/zodUtility.js';

const validationSchema = z.object({
  endpoint: z.string().url('Invalid Azure AI Search Endpoint'),
  apiKey: z.string().min(1, 'API Key is required'),
  indexName: z.string().min(1, 'Index Name is required'),
  searchText: z.string().optional(),
  vector: z.array(z.number()).optional(),
  top: z.number().min(1).max(50).default(10),
  minRerankerScore: z.number().min(0).max(4).optional().describe('Minimum semantic score to return (0-4)'),
});

export type SearchParams = z.infer<typeof validationSchema>;

export interface SearchResultItem {
  id: string;
  fileName?: string | undefined;
  url?: string | undefined;
  documentType?: string | undefined;
  summary?: string | undefined;
  cleanedContent?: string | undefined;
  content?: string | undefined;
  score: number;
  rerankerScore?: number | undefined;
  highlights?: string[] | undefined;
}

// Define the interface for the document stored in the index
interface IndexDocument {
  id: string;
  fileName?: string;
  url?: string;
  documentType?: string;
  summary?: string;
  cleanedContent?: string;
  content?: string;
  contentVector?: number[];
}

/**
 * Performs a Hybrid Search (Vector + Keyword) with Semantic Reranking.
 *
 * @param {string} endpoint - Azure AI Search Endpoint
 * @param {string} apiKey - API Key
 * @param {string} indexName - Index Name
 * @param {string} [searchText] - Keyword search query
 * @param {number[]} [vector] - Embedding vector for the query
 * @param {number} [top=10] - Number of results to return
 * @param {number} [minRerankerScore] - Optional filter for result quality
 * @returns {Promise<SearchResultItem[]>}
 */
export async function queryHybridSemantic(
  endpoint: SearchParams['endpoint'],
  apiKey: SearchParams['apiKey'],
  indexName: SearchParams['indexName'],
  searchText?: string,
  vector?: number[],
  top: number = 10,
  minRerankerScore?: number,
): Promise<SearchResultItem[]> {
  const validationResult = validateWithZod(validationSchema, {
    endpoint,
    apiKey,
    indexName,
    searchText,
    vector,
    top,
    minRerankerScore,
  });

  if (validationResult.isError) {
    throw new Error(`Search validation failed: ${JSON.stringify(validationResult.error)}`);
  }

  // Ensure at least one query method is provided
  if (!searchText && (!vector || vector.length === 0)) {
    throw new Error('Either searchText or vector must be provided.');
  }

  try {
    const client = new SearchClient<IndexDocument>(endpoint, indexName, new AzureKeyCredential(apiKey));

    const searchOptions: SearchOptions<IndexDocument> = {
      top,
      select: ['id', 'fileName', 'url', 'documentType', 'summary', 'cleanedContent', 'content'],
      // Semantic Search Settings
      queryType: 'semantic',
      semanticSearchOptions: {
        configurationName: 'default', // Matches the config in ensureVectorIndex.ts
        queryCaption: 'extractive',
        queryAnswer: 'extractive',
      } as any, // Type assertion needed due to SDK type definitions
    };

    // Add Vector Query if provided
    if (vector && vector.length > 0) {
      searchOptions.vectorSearchOptions = {
        queries: [
          {
            kind: 'vector',
            vector: vector,
            fields: ['contentVector'],
            kNearestNeighborsCount: 50, // Fetch more candidates for reranking
          },
        ],
      };
    }

    const searchResults = await client.search(searchText || '*', searchOptions);
    const results: SearchResultItem[] = [];

    for await (const result of searchResults.results) {
      // Filter by reranker score if threshold is set
      if (minRerankerScore !== undefined && (result.rerankerScore || 0) < minRerankerScore) {
        continue;
      }

      // Extract highlights from semantic captions
      const highlights: string[] = [];
      const captions = (result as any)['@search.captions'];
      if (captions) {
        captions.forEach((c: any) => {
          if (c.text) highlights.push(c.text);
        });
      }

      results.push({
        id: result.document.id,
        fileName: result.document.fileName,
        url: result.document.url,
        documentType: result.document.documentType,
        summary: result.document.summary,
        cleanedContent: result.document.cleanedContent,
        content: result.document.content,
        score: result.score,
        rerankerScore: result.rerankerScore,
        highlights,
      });
    }

    return results;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    throw new Error(`Failed to perform hybrid search: ${errorMessage}`);
  }
}
