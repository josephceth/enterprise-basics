import { z } from 'zod';
import * as path from 'path';
import { validateWithZod } from '../utilities/zodUtility';
import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';

const validationSchema = z.object({
  fullPath: z
    .string()
    .min(1, 'File path is required')
    .refine((val) => path.extname(val).toLowerCase() === '.pdf', {
      message: 'File must be a PDF (.pdf extension)',
    }),
});

type PdfParams = z.infer<typeof validationSchema>;

/**
 * Parses a PDF file using LangChain's PDFLoader and returns its text content.
 *
 * @param {string} fullPath - The complete file path to the PDF file.
 * @returns {Promise<Document<Record<string, any>>[]>} A promise that resolves with the extracted text content of the PDF.
 * @throws {Error}
 *  - If validation fails (path not provided, not a PDF).
 *  - If the file doesn't exist.
 *  - If LangChain fails to load or parse the PDF.
 *
 * @example
 * try {
 *   const pdfText = await parsePDF('path/to/your/document.pdf');
 *   console.log('PDF Content:', pdfText);
 * } catch (error) {
 *   console.error('Failed to parse PDF:', error.message);
 * }
 */
export async function parsePDF(fullPath: PdfParams['fullPath']): Promise<any> {
  const validationResult = validateWithZod(validationSchema, { fullPath });

  if (validationResult.isError) {
    throw new Error(`PDF parse validation failed: ${JSON.stringify(validationResult.error)}`);
  }

  try {
    // Normalize path (optional, but good practice)
    const normalizedPath = path.normalize(fullPath);

    // PDFLoader checks for file existence internally, but you could add an explicit fs.existsSync check if desired.

    const loader = new PDFLoader(normalizedPath, {
      splitPages: true,
    });

    const docs = await loader.load();

    // Since splitPages is false, we expect exactly one document
    if (!docs || docs.length === 0 || !docs[0].pageContent) {
      throw new Error('No content extracted from PDF.');
    }

    return docs;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    throw new Error(`Failed to parse PDF file (${fullPath}): ${errorMessage}`);
  }
}
