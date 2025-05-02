import { z } from 'zod';
import * as fs from 'fs';
import * as path from 'path';
import { validateWithZod } from '../utilities/zodUtility.js';

const validationSchema = z.object({
  fullPath: z.string().min(1, 'File path is required'),
});

type FileParams = z.infer<typeof validationSchema>;

/**
 * Reads the contents of a text file, collapses all whitespace sequences (including newlines)
 * into single spaces, and removes leading/trailing whitespace.
 *
 * @param {string} fullPath - The complete file path including filename and extension
 * @returns {Promise<string>} The processed contents of the text file as a single-line string.
 *
 * @throws {Error}
 * - When validation fails for input parameter
 * - When file does not exist
 * - When file cannot be read
 *
 * @example
 * try {
 *   const content = await readTextFile('path/to/your/file.txt');
 *   console.log('File contents:', content);
 * } catch (error) {
 *   console.error('Failed to read file:', error.message);
 * }
 */
export async function readTextFile(fullPath: FileParams['fullPath']): Promise<string> {
  const validationResult = validateWithZod(validationSchema, { fullPath });

  if (validationResult.isError) {
    throw new Error(`File read validation failed: ${JSON.stringify(validationResult.error)}`);
  }

  try {
    const normalizedPath = path.normalize(fullPath);

    if (!fs.existsSync(normalizedPath)) {
      throw new Error(`File not found: ${normalizedPath}`);
    }

    const rawContent = fs.readFileSync(normalizedPath, 'utf-8');
    // Replace any sequence of whitespace characters (including newlines) with a single space
    // and remove leading/trailing whitespace.
    const cleanedContent = rawContent.replace(/\s+/g, ' ').trim();
    return cleanedContent;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    throw new Error(`Failed to read file: ${errorMessage}`);
  }
}
