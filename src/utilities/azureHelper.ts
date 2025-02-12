// This defines a function that is used to get a token for the ms graph api via https://login.microsoftonline.com/{tenantId} via a fetch request with a clientId and clientSecret

import { z } from 'zod';
import { validateWithZod } from './zodUtility';

const validationSchema = z.object({
  tenantId: z.string().min(1, 'Tenant ID is required'),
  clientId: z.string().min(1, 'Client ID is required'),
  clientSecret: z.string().min(1, 'Client Secret is required'),
});

type AuthParams = z.infer<typeof validationSchema>;

/**
 * Gets an authentication token from Azure AD using client credentials flow.
 *
 * @param {string} tenantId - Azure AD tenant ID
 * @param {string} clientId - Application (client) ID
 * @param {string} clientSecret - Client secret value
 *
 * @returns {Promise<string>} Access token for Microsoft Graph API
 *
 * @throws {Error}
 *  - If input validation fails
 *  - If network request fails
 *  - If Azure AD returns an error
 *
 * @example
 * try {
 *   const token = await getAzureAuthToken(
 *     'your-tenant-id',
 *     'your-client-id',
 *     'your-client-secret'
 *   );
 *   console.log('Token received');
 * } catch (error) {
 *   console.error('Auth failed:', error.message);
 * }
 */
export async function getAzureAuthToken(
  tenantId: AuthParams['tenantId'],
  clientId: AuthParams['clientId'],
  clientSecret: AuthParams['clientSecret'],
): Promise<string> {
  // Validate inputs
  const validationResult = validateWithZod(validationSchema, { tenantId, clientId, clientSecret });

  if (validationResult.isError) {
    throw new Error(`Parameter validation failed: ${JSON.stringify(validationResult.error)}`);
  }

  try {
    const response = await fetch(`https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'client_credentials',
        scope: 'https://graph.microsoft.com/.default',
      }).toString(),
    });

    if (!response.ok) {
      const errorMessage = await response.text();
      throw new Error(`Azure AD request failed: ${errorMessage}`);
    }

    const data = await response.json();
    return data.access_token;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

    throw new Error(`Failed to get Azure auth token: ${errorMessage}`);
  }
}
