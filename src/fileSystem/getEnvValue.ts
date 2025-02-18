//this is a utility function to get the value of an environment variable
//primarily used for temporal jobs where the environment variables are not available in the workflow
//and must be accessed via an activity
import * as dotenv from 'dotenv';

dotenv.config();

export function getEnvValue(key: string) {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Environment variable ${key} is not set in the .env file or environment variables`);
  }
  return value;
}
