import { BlobServiceClient } from '@azure/storage-blob';
import { validateWithZod } from '../../utilities/zodUtility.js';
import { z } from 'zod';

const validationSchema = z.object({
  storageConnectionString: z.string().min(1, 'Storage connection string is required'),
  containerName: z.string().min(1, 'Container name is required'),
  path: z.string().min(1, 'Blob path is required'),
  file: z.instanceof(File, { message: 'File object is required' }),
});

export type UploadParams = z.infer<typeof validationSchema>;

/**
 * Uploads a file to Azure Blob Storage
 *
 * @param {string} storageConnectionString - Azure Storage connection string
 * @param {string} containerName - Name of the blob container
 * @param {string} path - Path where the blob will be stored in the container
 * @param {File} file - File object to upload
 *
 * @returns {Promise<void>} Resolves when upload is complete
 *
 * @throws {Error}
 *  - If input validation fails
 *  - If container is not found
 *  - If upload fails
 *
 * @example
 * try {
 *   await uploadBlob(connectionString, 'my-container', 'path/to/file.txt', fileObject);
 *   console.log('Upload successful');
 * } catch (error) {
 *   console.error('Upload failed:', error.message);
 * }
 */
export async function uploadBlob(
  storageConnectionString: UploadParams['storageConnectionString'],
  containerName: UploadParams['containerName'],
  path: UploadParams['path'],
  file: UploadParams['file'],
): Promise<void> {
  // Validate inputs
  const validationResult = validateWithZod(validationSchema, {
    storageConnectionString,
    containerName,
    path,
    file,
  });

  if (validationResult.isError) {
    throw new Error(`Upload validation failed: ${JSON.stringify(validationResult.error)}`);
  }

  try {
    const blobClient = BlobServiceClient.fromConnectionString(storageConnectionString);
    const blobContainer = blobClient.getContainerClient(containerName);

    if (!blobContainer) {
      throw new Error(`Container ${containerName} not found`);
    }

    const buffer = await file.arrayBuffer();
    const blockBlobClient = blobContainer.getBlockBlobClient(path);

    await blockBlobClient.uploadData(buffer, {
      blobHTTPHeaders: {
        blobContentType: file.type,
      },
      metadata: {
        fileName: file.name,
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    throw new Error(`Failed to upload blob - Path: ${path}, Error: ${errorMessage}`);
  }
}
