import { BlobServiceClient } from '@azure/storage-blob';
import { validateWithZod } from '../../utilities/zodUtility.js';
import { z } from 'zod/v3';

const validationSchema = z.object({
  storageConnectionString: z.string().min(1, 'Storage connection string is required'),
  containerName: z.string().min(1, 'Container name is required'),
  path: z.string().min(1, 'Blob path is required'),
  // Allow File (browser/Web API) or Buffer (Node.js)
  file: z.union([z.instanceof(File), z.instanceof(Buffer)], {
    errorMap: () => ({ message: 'File object or Buffer is required' }),
  }),
  contentType: z.string().optional(),
});

export type UploadParams = z.infer<typeof validationSchema>;

/**
 * Uploads a file (File object or Buffer) to Azure Blob Storage
 *
 * @param {string} storageConnectionString - Azure Storage connection string
 * @param {string} containerName - Name of the blob container
 * @param {string} path - Path where the blob will be stored in the container
 * @param {File | Buffer} file - File object or Buffer to upload
 * @param {string} [contentType] - Optional MIME type (auto-detected for File)
 *
 * @returns {Promise<void>} Resolves when upload is complete
 */
export async function uploadBlob(
  storageConnectionString: UploadParams['storageConnectionString'],
  containerName: UploadParams['containerName'],
  path: UploadParams['path'],
  file: UploadParams['file'],
  contentType?: string,
): Promise<void> {
  // Validate inputs
  const validationResult = validateWithZod(validationSchema, {
    storageConnectionString,
    containerName,
    path,
    file,
    contentType,
  });

  if (validationResult.isError) {
    throw new Error(`Upload validation failed: ${JSON.stringify(validationResult.error)}`);
  }

  try {
    const blobClient = BlobServiceClient.fromConnectionString(storageConnectionString);
    const blobContainer = blobClient.getContainerClient(containerName);

    // Create container if it doesn't exist
    await blobContainer.createIfNotExists();

    const blockBlobClient = blobContainer.getBlockBlobClient(path);

    let buffer: Buffer | ArrayBuffer;
    let mimeType = contentType;

    if (file instanceof File) {
      buffer = await file.arrayBuffer();
      mimeType = mimeType || file.type;
    } else {
      buffer = file;
      mimeType = mimeType || 'application/octet-stream';
    }

    await blockBlobClient.uploadData(buffer, {
      blobHTTPHeaders: {
        blobContentType: mimeType,
      },
      metadata: {
        fileName: path.split('/').pop() || 'unknown',
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    throw new Error(`Failed to upload blob - Path: ${path}, Error: ${errorMessage}`);
  }
}
