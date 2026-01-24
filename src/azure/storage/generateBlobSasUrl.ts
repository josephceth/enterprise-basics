import {
  BlobServiceClient,
  generateBlobSASQueryParameters,
  BlobSASPermissions,
  SASProtocol,
  StorageSharedKeyCredential,
} from '@azure/storage-blob';
import { z } from 'zod/v3';
import { validateWithZod } from '../../utilities/zodUtility.js';

const validationSchema = z.object({
  storageConnectionString: z.string().min(1, 'Storage connection string is required'),
  containerName: z.string().min(1, 'Container name is required'),
  blobName: z.string().min(1, 'Blob name/path is required'),
  permissions: z.string().regex(/^[racwdl]+$/, 'Invalid permissions format (e.g. "r", "cw", "racwd")'),
  expirationMinutes: z.number().min(1).default(60),
});

export type GenerateSasParams = z.infer<typeof validationSchema>;

/**
 * Generates a SAS (Shared Access Signature) URL for a specific blob.
 * This works for both Uploading (Write) and Downloading (Read).
 *
 * @param {string} storageConnectionString - Azure Storage connection string
 * @param {string} containerName - Container name
 * @param {string} blobName - The full path of the blob
 * @param {string} permissions - 'r' (read), 'w' (write), 'c' (create), 'd' (delete), or combinations like 'rac'
 * @param {number} [expirationMinutes=60] - How long the token is valid for
 *
 * @returns {string} The full URL with SAS token
 */
export function generateBlobSasUrl(
  storageConnectionString: GenerateSasParams['storageConnectionString'],
  containerName: GenerateSasParams['containerName'],
  blobName: GenerateSasParams['blobName'],
  permissions: GenerateSasParams['permissions'],
  expirationMinutes: number = 60,
): string {
  const validationResult = validateWithZod(validationSchema, {
    storageConnectionString,
    containerName,
    blobName,
    permissions,
    expirationMinutes,
  });

  if (validationResult.isError) {
    throw new Error(`SAS generation validation failed: ${JSON.stringify(validationResult.error)}`);
  }

  try {
    // 1. Extract Account Name & Key manually (faster than instantiating a client just for this)
    const connParts = Object.fromEntries(
      storageConnectionString.split(';').map((p) => {
        const idx = p.indexOf('=');
        return [p.substring(0, idx), p.substring(idx + 1)];
      }),
    );

    const accountName = connParts['AccountName'];
    const accountKey = connParts['AccountKey'];
    const endpointSuffix = connParts['EndpointSuffix'] || 'core.windows.net';

    if (!accountName || !accountKey) {
      throw new Error('Invalid connection string: AccountName or AccountKey missing');
    }

    const cred = new StorageSharedKeyCredential(accountName, accountKey);

    const startsOn = new Date(Date.now() - 5 * 60 * 1000); // Start 5 mins ago (clock skew safety)
    const expiresOn = new Date(Date.now() + expirationMinutes * 60 * 1000);

    const sasToken = generateBlobSASQueryParameters(
      {
        containerName,
        blobName,
        permissions: BlobSASPermissions.parse(permissions),
        startsOn,
        expiresOn,
        protocol: SASProtocol.Https,
      },
      cred,
    ).toString();

    // Construct full URL
    return `https://${accountName}.blob.${endpointSuffix}/${containerName}/${encodeURIComponent(blobName)}?${sasToken}`;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    throw new Error(`Failed to generate SAS URL: ${errorMessage}`);
  }
}
