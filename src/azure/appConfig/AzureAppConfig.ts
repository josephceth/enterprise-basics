import { AppConfigurationClient } from '@azure/app-configuration';
import { z } from 'zod';
import { validateWithZod } from '../../utilities/zodUtility.js';

const validationSchema = z.object({
  endPoint: z.string().min(1, 'Config endpoint is required'),
  label: z.string().min(1, 'Label is required'),
});

type ConfigParams = z.infer<typeof validationSchema>;
/**
 * Class for interacting with Azure App Configuration.
 * Provides methods to retrieve configuration values from Azure App Configuration.
 *
 * @example
 * // Create an instance for a specific environment
 * const config = new AzureAppConfig('https://my-app-config.azconfig.io', 'prod');
 *
 * // Get configuration values
 * try {
 *   // Get an endpoint
 *   const whisperEndpoint = await config.getAzureConfigValue('OPENAI_WHISPER_ENDPOINT');
 *
 *   // Get an API key
 *   const apiKey = await config.getAzureConfigValue('OPENAI_API_KEY');
 *
 *   // Get a general config value
 *   const value = await config.getAzureConfigValue('myApp.setting');
 *   console.log('Config value:', value);
 * } catch (error) {
 *   console.error('Failed to get config:', error.message);
 * }
 */

export class AzureAppConfig {
  private endPoint: string;
  private label: string;

  /**
   * Creates a new instance of AzureAppConfig.
   *
   * @param {string} endPoint - Azure App Configuration endpoint URL
   * @param {string} label - Configuration label (e.g., 'prod', 'dev')
   *
   * @throws {Error} If validation of endpoint or label fails
   */
  constructor(endPoint: string, label: string) {
    const validationResult = validateWithZod(validationSchema, { endPoint, label });
    if (validationResult.isError) {
      throw new Error(`Config validation failed: ${JSON.stringify(validationResult.error)}`);
    }

    this.endPoint = endPoint;
    this.label = label;
  }

  /**
   * Retrieves a configuration value from Azure App Configuration.
   *
   * @param {string} key - Configuration key to retrieve
   * @returns {Promise<string>} Configuration value
   *
   * @throws {Error} If:
   * - Key is not provided
   * - Configuration value is not found
   * - Azure connection fails
   */
  async getAzureConfigValue(key: string): Promise<string> {
    // Validate inputs
    if (!key) {
      throw new Error('Key is required');
    }

    try {
      const client = new AppConfigurationClient(this.endPoint);
      const setting = await client.getConfigurationSetting({
        key,
        label: this.label,
      });

      if (!setting.value) {
        throw new Error(`Config value not found for key: ${key}`);
      }

      return setting.value;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

      throw new Error(`Failed to get Azure config - Key: ${key}, Label: ${this.label}, Error: ${errorMessage}`);
    }
  }
}
