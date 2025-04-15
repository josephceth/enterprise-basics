import * as fs from 'fs';
import * as path from 'path';
import { z } from 'zod';
import { validateWithZod } from '../utilities/zodUtility';

const validationSchema = z.object({
  fullPath: z.string().min(1, 'File path is required'),
});

type FileParams = z.infer<typeof validationSchema>;

/**
 * Reads the contents of a text file from the specified path and removes newline/carriage return characters.
 *
 * @param {string} fullPath - The complete file path including filename and extension
 * @returns {Promise<string>} The contents of the text file as a single string with newlines and carriage returns removed.
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
    // Remove all newline and carriage return characters
    const cleanedContent = rawContent.replace(/\r?\n|\r/g, '');
    return cleanedContent;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    throw new Error(`Failed to read file: ${errorMessage}`);
  }
}
