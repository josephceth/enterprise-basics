import * as fs from 'fs';
import * as path from 'path';
import { z } from 'zod';

const FileSchema = z.object({
  name: z
    .string()
    .min(1, 'Filename cannot be empty')
    .regex(/^[\w\-. ]+$/, 'Filename contains invalid characters')
    .refine((name) => !name.includes('..'), "Filename cannot contain '..'"),
  data: z
    .instanceof(Uint8Array)
    .or(z.string())
    .refine((data) => data.length > 0, 'File data cannot be empty'),
});

export type FileInput = z.infer<typeof FileSchema>;

/**
 * Saves file bytes to the specified directory path
 * @param {FileInput} file - Object containing file name and data
 * @param {string} directoryPath - Target directory path
 * @returns {Promise<string>} Path where the file was saved
 * @throws {Error} If validation fails or file operations fail
 *
 * @example
 * const bytes = await createExcelBytes(data);
 * await saveFileBytesToPath({
 *   name: 'report.xlsx',
 *   data: bytes
 * }, './exports');
 */
export async function saveFileBytesToPath(file: FileInput, directoryPath: string): Promise<string> {
  try {
    // Validate inputs
    const validatedFile = FileSchema.parse(file);

    if (typeof directoryPath !== 'string' || directoryPath.trim().length === 0) {
      throw new Error('Invalid directory path');
    }

    // Sanitize directory path
    const sanitizedDirPath = path.normalize(directoryPath);

    // Create directory if it doesn't exist
    await fs.promises.mkdir(sanitizedDirPath, { recursive: true });

    // Generate full file path
    const filePath = path.join(sanitizedDirPath, validatedFile.name);

    // Ensure we're not writing outside the target directory (path traversal protection)
    if (!filePath.startsWith(path.resolve(sanitizedDirPath))) {
      throw new Error('Invalid file path: Potential path traversal detected');
    }

    // Convert data to Buffer if it's Uint8Array
    const dataToWrite = validatedFile.data instanceof Uint8Array ? Buffer.from(validatedFile.data) : validatedFile.data;

    // Write file with explicit encoding for strings
    await fs.promises.writeFile(filePath, dataToWrite, typeof dataToWrite === 'string' ? 'utf8' : undefined);

    return filePath;
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`File validation failed: ${error.errors.map((e) => e.message).join(', ')}`);
    }

    throw new Error(`Failed to save file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
