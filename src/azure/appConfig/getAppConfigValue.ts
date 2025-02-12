import { AppConfigurationClient } from '@azure/app-configuration';
import { z } from 'zod';
import { validateWithZod } from '../../utilities/zodUtility';
import dotenv from 'dotenv';

// Load environment variables once at module level
dotenv.config();

const validationSchema = z.object({
  key: z.string().min(1, 'Config key is required'),
  label: z.string().optional(),
});

type ConfigParams = z.infer<typeof validationSchema>;

/**
 * Retrieves a configuration value from Azure App Configuration.
 * Falls back to environment-specific label if none provided.
 * Requires the use of an environment variable or .env file to store the connection string.
 *
 * @param {string} key - Configuration key to retrieve
 * @param {string} [label] - Optional configuration label (defaults to MODE env value)
 * @param {string} [connectionStringEnvKey] - Optional environment variable key for the connection string
 *
 * @returns {Promise<string | null>} Configuration value or null if not found
 *
 * @throws {Error}
 *  - If required environment variables are missing
 *  - If input validation fails
 *  - If Azure connection fails
 *
 * @example
 * try {
 *   const value = await getAzureConfigValue('myApp.setting', 'dev');
 *   console.log('Config value:', value);
 * } catch (error) {
 *   console.error('Failed to get config:', error.message);
 * }
 */
export async function getAzureConfigValue(
  key: ConfigParams['key'],
  label?: ConfigParams['label'],
  connectionStringEnvKey: string = 'AZURE_APP_CONFIG_CONNECTION_STRING',
): Promise<string | null> {
  // Validate inputs
  const validationResult = validateWithZod(validationSchema, { key, label });
  if (validationResult.isError) {
    throw new Error(`Config validation failed: ${JSON.stringify(validationResult.error)}`);
  }

  // Validate environment variables with dynamic key
  const connectionString = process.env[connectionStringEnvKey];
  if (!connectionString) {
    throw new Error(`${connectionStringEnvKey} not found in environment variables`);
  }

  try {
    const client = new AppConfigurationClient(connectionString);
    const setting = await client.getConfigurationSetting({
      key,
      label: label,
    });

    return setting.value ?? null;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

    throw new Error(`Failed to get Azure config - Key: ${key}, Label: ${label ?? '(blank)'}, Error: ${errorMessage}`);
  }
}
