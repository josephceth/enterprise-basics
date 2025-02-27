//this is a utility function to get the value of an environment variable
//primarily used for temporal jobs where the environment variables are not available in the workflow
//and must be accessed via an activity
import * as dotenv from 'dotenv';

dotenv.config();

/**
 * Asynchronously retrieves the value of an environment variable
 * @param {string} key - The name of the environment variable to retrieve
 * @returns {Promise<string>} A promise that resolves with the value of the environment variable
 * @throws {Error} If the environment variable is not set, undefined, or null
 * @example
 * try {
 *   const value = await getEnvValue('API_KEY');
 *   console.log(value);
 * } catch (error) {
 *   console.error(error);
 * }
 */
export async function getEnvValue(key: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const value = process.env[key];
    if (!value || value === undefined || value === null) {
      reject(new Error(`Environment variable ${key} is not set in the .env file or environment variables`));
    }
    resolve((value as string).toString());
  });
}
