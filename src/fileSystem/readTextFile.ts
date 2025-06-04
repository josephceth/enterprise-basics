import { z } from 'zod';
import * as fs from 'fs';
import * as path from 'path';
import { validateWithZod } from '../utilities/zodUtility.js';

const validationSchema = z.object({
  fullPath: z.string().min(1, 'File path is required'),
});

type FileParams = z.infer<typeof validationSchema>;

/**
 * Reads the contents of a SQL file, replaces line breaks with spaces (preserving token separation),
 * and trims leading/trailing whitespace.
 */
export async function readTextFileCleaned(fullPath: FileParams['fullPath']): Promise<string> {
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

    // Normalize CRLF to LF, then replace newlines with single spaces
    const cleanedContent = rawContent
      .replace(/\r\n/g, '\n') // Normalize line endings
      .replace(/\r/g, '\n')
      .replace(/\n+/g, ' ') // Replace line breaks with single space
      .trim();

    return cleanedContent;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    throw new Error(`Failed to read file: ${errorMessage}`);
  }
}

export async function readTextFileRaw(fullPath: FileParams['fullPath']): Promise<string> {
  const validationResult = validateWithZod(validationSchema, { fullPath });

  if (validationResult.isError) {
    throw new Error(`File read validation failed: ${JSON.stringify(validationResult.error)}`);
  }

  try {
    const normalizedPath = path.normalize(fullPath);
    const rawContent = fs.readFileSync(normalizedPath, 'utf-8');
    return rawContent;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    throw new Error(`Failed to read file: ${errorMessage}`);
  }
}
