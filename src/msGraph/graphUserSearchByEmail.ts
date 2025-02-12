import { z } from 'zod';
import { validateWithZod } from '../utilities/zodUtility';
import { getAzureAuthToken } from '../utilities/azureHelper';

const validationSchema = z.object({
  email: z.string().email('Invalid email address'),
  tenantId: z.string().min(1, 'Tenant ID is required'),
  clientId: z.string().min(1, 'Client ID is required'),
  clientSecret: z.string().min(1, 'Client Secret is required'),
});

type SearchParams = z.infer<typeof validationSchema>;

interface GraphUser {
  displayName: string;
  mail: string;
  id: string;
}

/**
 * Searches for an employee in Microsoft Graph API using their employee ID.
 *
 * @param {string} employeeId - Employee ID to search for
 * @param {string} tenantId - Azure AD tenant ID
 * @param {string} clientId - Application (client) ID
 * @param {string} clientSecret - Client secret value
 *
 * @returns {Promise<GraphUser | null>} User data if found, null if not found
 *
 * @throws {Error}
 *  - If input validation fails
 *  - If authentication fails
 *  - If Graph API request fails
 *
 * @example
 * try {
 *   const user = await graphSearchByEmployeeId(
 *     '12345',
 *     'tenant-id',
 *     'client-id',
 *     'client-secret'
 *   );
 *   if (user) {
 *     console.log('User found:', user.displayName);
 *   }
 * } catch (error) {
 *   console.error('Search failed:', error.message);
 * }
 */
export async function graphUserSearchByEmail(
  email: SearchParams['email'],
  tenantId: SearchParams['tenantId'],
  clientId: SearchParams['clientId'],
  clientSecret: SearchParams['clientSecret'],
): Promise<GraphUser | null> {
  // Validate inputs
  const validationResult = validateWithZod(validationSchema, { email, tenantId, clientId, clientSecret });

  if (validationResult.isError) {
    throw new Error(`Parameter validation failed: ${JSON.stringify(validationResult.error)}`);
  }

  try {
    // Get authentication token
    const token = await getAzureAuthToken(tenantId, clientId, clientSecret);

    console.log('token', token);

    // Search for user in Graph API
    const response = await fetch(
      `https://graph.microsoft.com/v1.0/users?$filter=mail eq '${email}'&$top=1&$select=displayName,mail,id`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Graph API request failed: Status ${response.status}, Details: ${errorData}`);
    }

    const data = await response.json();

    // Return first user if found, null if not found
    return data.value[0] ?? null;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

    throw new Error(`Failed to search employee by email ${email}: ${errorMessage}`);
  }
}
