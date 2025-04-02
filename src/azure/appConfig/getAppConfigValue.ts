import { AppConfigurationClient } from '@azure/app-configuration';
import { z } from 'zod';
import { validateWithZod } from '../../utilities/zodUtility';

const validationSchema = z.object({
  key: z.string().min(1, 'Config key is required'),
  label: z.string().min(1, 'Label is required'),
  azureAppConfigEndpoint: z.string().min(1, 'Azure App Configuration endpoint is required'),
});

type ConfigParams = z.infer<typeof validationSchema>;
//TODO convert to a class
/**
 * Retrieves a configuration value from Azure App Configuration.
 * All parameters are required and must be provided.
 *
 * @param {string} key - Configuration key to retrieve (e.g., 'OPENAI_WHISPER_ENDPOINT')
 * @param {string} label - Configuration label (e.g., 'prod', 'dev')
 * @param {string} azureAppConfigEndpoint - Azure App Configuration endpoint URL
 *
 * @returns {Promise<string | null>} Configuration value or null if not found
 *
 * @throws {Error}
 *  - If any required parameters are missing
 *  - If input validation fails
 *  - If Azure connection fails
 *
 * @example
 * try {
 *   // Get an endpoint
 *   const whisperEndpoint = await getAzureConfigValue(
 *     'OPENAI_WHISPER_ENDPOINT',
 *     'prod',
 *     'https://my-app-config.azconfig.io'
 *   );
 *
 *   // Get an API key
 *   const apiKey = await getAzureConfigValue(
 *     'OPENAI_API_KEY',
 *     'prod',
 *     'https://my-app-config.azconfig.io'
 *   );
 *
 *   // Get a general config value
 *   const value = await getAzureConfigValue(
 *     'myApp.setting',
 *     'dev',
 *     'https://my-app-config.azconfig.io'
 *   );
 *   console.log('Config value:', value);
 * } catch (error) {
 *   console.error('Failed to get config:', error.message);
 * }
 */
export async function getAzureConfigValue(
  key: ConfigParams['key'],
  label: ConfigParams['label'],
  azureAppConfigEndpoint: ConfigParams['azureAppConfigEndpoint'],
): Promise<string | null> {
  // Validate inputs
  const validationResult = validateWithZod(validationSchema, { key, label, azureAppConfigEndpoint });
  if (validationResult.isError) {
    throw new Error(`Config validation failed: ${JSON.stringify(validationResult.error)}`);
  }

  try {
    const client = new AppConfigurationClient(azureAppConfigEndpoint);
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
