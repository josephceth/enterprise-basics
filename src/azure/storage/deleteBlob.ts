import { BlobServiceClient } from '@azure/storage-blob';
import { z } from 'zod';
import { validateWithZod } from '../../utilities/zodUtility';

const validationSchema = z.object({
  storageConnectionString: z.string().min(1, 'Storage connection string is required'),
  containerName: z.string().min(1, 'Container name is required'),
  path: z.string().min(1, 'Blob path is required'),
});

type DeleteParams = z.infer<typeof validationSchema>;

/**
 * Deletes a blob from Azure Blob Storage
 *
 * @param {string} storageConnectionString - Azure Storage connection string
 * @param {string} containerName - Name of the blob container
 * @param {string} path - Path of the blob to delete
 *
 * @returns {Promise<void>} Resolves when deletion is complete
 *
 * @throws {Error}
 *  - If input validation fails
 *  - If container is not found
 *  - If blob deletion fails
 *
 * @example
 * try {
 *   await deleteBlob(connectionString, 'my-container', 'path/to/file.txt');
 *   console.log('Deletion successful');
 * } catch (error) {
 *   console.error('Deletion failed:', error.message);
 * }
 */
export async function deleteBlob(
  storageConnectionString: DeleteParams['storageConnectionString'],
  containerName: DeleteParams['containerName'],
  path: DeleteParams['path'],
): Promise<void> {
  // Validate inputs
  const validationResult = validateWithZod(validationSchema, {
    storageConnectionString,
    containerName,
    path,
  });

  if (validationResult.isError) {
    throw new Error(`Delete validation failed: ${JSON.stringify(validationResult.error)}`);
  }

  try {
    const blobClient = BlobServiceClient.fromConnectionString(storageConnectionString);
    const blobContainer = blobClient.getContainerClient(containerName);

    if (!blobContainer) {
      throw new Error(`Container ${containerName} not found`);
    }

    const blockBlobClient = blobContainer.getBlockBlobClient(path);
    await blockBlobClient.delete();
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    throw new Error(`Failed to delete blob - Path: ${path}, Error: ${errorMessage}`);
  }
}
