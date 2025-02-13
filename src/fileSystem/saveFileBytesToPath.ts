import * as fs from 'fs';
import * as path from 'path';
import { z } from 'zod';

const inputSchema = z.object({
  data: z
    .instanceof(Uint8Array)
    .or(z.string())
    .refine((data) => data.length > 0, 'File data cannot be empty'),
  fileName: z.string().min(1, 'Filename cannot be empty'),
  directoryPath: z.string().min(1, 'Directory path cannot be empty'),
});

/**
 * Saves file bytes to the specified directory path
 * @param {Uint8Array | string} data - File data to save
 * @param {string} fileName - Name of the file with extension
 * @param {string} directoryPath - Target directory path
 * @returns {Promise<string>} Path where the file was saved
 * @throws {Error} If validation fails or file operations fail
 *
 * @example
 * const bytes = await createExcelBytes(data);
 * await saveFileBytesToPath(bytes, 'report.xlsx', './exports');
 */
export async function saveFileBytesToPath(
  data: Uint8Array | string,
  fileName: string,
  directoryPath: string,
): Promise<string> {
  try {
    // Validate inputs
    const validated = inputSchema.parse({ data, fileName, directoryPath });

    // Sanitize directory path
    const sanitizedDirPath = path.normalize(validated.directoryPath);

    // Create directory if it doesn't exist
    await fs.promises.mkdir(sanitizedDirPath, { recursive: true });

    // Generate full file path
    const filePath = path.join(sanitizedDirPath, validated.fileName);

    // Ensure we're not writing outside the target directory (path traversal protection)
    if (!filePath.startsWith(path.resolve(sanitizedDirPath))) {
      throw new Error('Invalid file path: Potential path traversal detected');
    }

    // Convert data to Buffer if it's Uint8Array
    const dataToWrite = data instanceof Uint8Array ? Buffer.from(data) : data;

    // Write file with explicit encoding for strings
    await fs.promises.writeFile(filePath, dataToWrite, typeof dataToWrite === 'string' ? 'utf8' : undefined);

    return filePath;
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Validation failed: ${error.errors.map((e) => e.message).join(', ')}`);
    }
    throw new Error(`Failed to save file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
