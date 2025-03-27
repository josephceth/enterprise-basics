import { BlobServiceClient } from '@azure/storage-blob';
import { z } from 'zod';
import { validateWithZod } from '../../utilities/zodUtility';

const validationSchema = z.object({
  storageConnectionString: z.string().min(1, 'Storage connection string is required'),
  containerName: z.string().min(1, 'Container name is required'),
  path: z.string().min(1, 'Blob path is required'),
});

type GetParams = z.infer<typeof validationSchema>;

/**
 * Downloads a blob from Azure Blob Storage
 *
 * @param {string} storageConnectionString - Azure Storage connection string
 * @param {string} containerName - Name of the blob container
 * @param {string} path - Path of the blob to download
 *
 * @returns {Promise<Buffer>} The blob content as a Buffer
 *
 * @throws {Error}
 *  - If input validation fails
 *  - If container is not found
 *  - If blob download fails
 *
 * @example
 * try {
 *   const buffer = await getBlob(connectionString, 'my-container', 'path/to/file.txt');
 *   console.log('Download successful');
 * } catch (error) {
 *   console.error('Download failed:', error.message);
 * }
 */
export async function getBlob(
  storageConnectionString: GetParams['storageConnectionString'],
  containerName: GetParams['containerName'],
  path: GetParams['path'],
): Promise<Buffer> {
  // Validate inputs
  const validationResult = validateWithZod(validationSchema, {
    storageConnectionString,
    containerName,
    path,
  });

  if (validationResult.isError) {
    throw new Error(`Get validation failed: ${JSON.stringify(validationResult.error)}`);
  }

  try {
    const blobClient = BlobServiceClient.fromConnectionString(storageConnectionString);
    const blobContainer = blobClient.getContainerClient(containerName);

    if (!blobContainer) {
      throw new Error(`Container ${containerName} not found`);
    }

    const blockBlobClient = blobContainer.getBlockBlobClient(path);
    return await blockBlobClient.downloadToBuffer();
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    throw new Error(`Failed to get blob - Path: ${path}, Error: ${errorMessage}`);
  }
}
