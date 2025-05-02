import { z } from 'zod';
import { parse } from 'csv-parse/sync';
import * as fs from 'fs/promises';
import { validateWithZod } from '../utilities/zodUtility.js';

const validationSchema = z.object({
  filePath: z.string().min(1, 'File path is required').trim(),
  delimiterChar: z.string().min(1, 'Delimiter is required').max(1, 'Delimiter must be a single character').trim(),
});

type ImportParams = z.infer<typeof validationSchema>;

/**
 * Imports and parses a delimited file (CSV, TSV, etc.) into an array of objects.
 * Expects a full, absolute file path.
 *
 * @param {string} filePath - Full path to the delimited file
 * @param {string} delimiterChar - Single character used as delimiter in the file
 *
 * @returns {Promise<Record<string, unknown>[]>} Array of objects representing file rows
 *
 * @throws {Error}
 *  - If input validation fails
 *  - If file doesn't exist
 *  - If file access is denied
 *  - If file parsing fails
 *
 * @example
 * try {
 *   const data = await importDelimitedFile('C:/data/users.csv', ',');
 *   console.log('Imported rows:', data.length);
 * } catch (error) {
 *   console.error('Import failed:', error.message);
 * }
 */
export async function importDelimitedFile(
  filePath: ImportParams['filePath'],
  delimiterChar: ImportParams['delimiterChar'],
): Promise<Record<string, unknown>[]> {
  // Validate inputs
  const validationResult = validateWithZod(validationSchema, { filePath, delimiterChar });

  if (validationResult.isError) {
    throw new Error(`Import validation failed: ${JSON.stringify(validationResult.error)}`);
  }

  try {
    // Early check if file exists
    const fileExists = await fs
      .access(filePath)
      .then(() => true)
      .catch(() => false);

    if (!fileExists) {
      throw new Error(`File not found: ${filePath}`);
    }

    // Read and parse file
    const fileContents = await fs.readFile(filePath, 'utf-8');

    const records = parse(fileContents, {
      columns: true,
      skip_empty_lines: true,
      delimiter: delimiterChar,
      bom: true,
      relax_quotes: true,
      relax_column_count: true,
    });

    return records;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

    throw new Error(`Failed to import delimited file: ${errorMessage}`);
  }
}
