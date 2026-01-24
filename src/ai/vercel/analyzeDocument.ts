import { generateObject, type LanguageModel } from 'ai';
import { z } from 'zod/v3';
import { validateWithZod } from '../../utilities/zodUtility.js';

const validationSchema = z.object({
  fileName: z.string().min(1, 'File name is required'),
  content: z.string().min(1, 'Content is required'),
});

// The output schema for the LLM
const documentAnalysisSchema = z.object({
  documentType: z.enum([
    'HR-Benefits',
    'HR-General',
    'IT-Policy',
    'Safety',
    'Legal',
    'Operations',
    'Finance',
    'General',
  ]),
  summary: z.string().describe('A concise 2-3 sentence summary of the key points'),
  cleanedContent: z.string().describe('The content with headers/footers removed, preserving substantive policy text'),
});

export type DocumentAnalysisResult = z.infer<typeof documentAnalysisSchema>;

/**
 * Analyzes a document using an LLM to extract metadata, summary, and clean content.
 *
 * @param {LanguageModel} languageModel - The initialized LLM (OpenAI or Azure)
 * @param {string} fileName - The name of the file
 * @param {string} content - The raw text content of the document
 * @returns {Promise<DocumentAnalysisResult>} The structured analysis result
 */
export async function analyzeDocument(
  languageModel: LanguageModel,
  fileName: string,
  content: string,
): Promise<DocumentAnalysisResult> {
  const validationResult = validateWithZod(validationSchema, { fileName, content });

  if (validationResult.isError) {
    throw new Error(`Document analysis validation failed: ${JSON.stringify(validationResult.error)}`);
  }

  try {
    const { object } = await generateObject({
      model: languageModel,
      schema: documentAnalysisSchema,
      prompt: `
You are a document analyst for a corporate policy system.
Analyze the following document: "${fileName}"

1. Classify the document type.
2. Provide a 2-3 sentence summary.
3. Clean the content by removing boilerplate, page numbers, and headers/footers.

Document Content:
${content.substring(0, 20000)} // Truncate safety limit if extremely large
      `,
    });

    return object;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    throw new Error(`Failed to analyze document: ${errorMessage}`);
  }
}
