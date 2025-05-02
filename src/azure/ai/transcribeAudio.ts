import { AzureOpenAI } from 'openai';
import { AzureKeyCredential } from '@azure/core-auth';
import { validateWithZod } from '../../utilities/zodUtility.js';
import { z } from 'zod';
import type { TranscriptionCreateParams } from 'openai/resources/audio/transcriptions';

const SUPPORTED_AUDIO_FORMATS = ['flac', 'm4a', 'mp3', 'mp4', 'mpeg', 'mpga', 'oga', 'ogg', 'wav', 'webm'] as const;

const validationSchema = z.object({
  endpoint: z.string().url('Valid Azure OpenAI endpoint URL is required'),
  apiKey: z.string().min(1, 'API key is required'),
  deploymentName: z.string().min(1, 'Deployment name is required'),
  audioFile: z.custom<File>(
    (val) => {
      if (!(val instanceof File)) return false;
      const extension = val.name.split('.').pop()?.toLowerCase();
      return extension ? SUPPORTED_AUDIO_FORMATS.includes(extension as any) : false;
    },
    `Audio file must be one of the supported formats: ${SUPPORTED_AUDIO_FORMATS.join(', ')}`,
  ),
  language: z.string().optional(),
  prompt: z.string().optional(),
});

type TranscriptionParams = z.infer<typeof validationSchema>;

/**
 * Transcribes audio using Azure OpenAI's Whisper model.
 *
 * @param {string} endpoint - Azure OpenAI endpoint URL
 * @param {string} apiKey - Azure OpenAI API key
 * @param {string} deploymentName - Name of the deployed Whisper model
 * @param {File} audioFile - Audio file to transcribe (supported formats: flac, m4a, mp3, mp4, mpeg, mpga, oga, ogg, wav, webm)
 * @param {Object} options - Optional parameters
 * @param {string} [options.language] - Language code (e.g., 'en', 'es', 'fr')
 * @param {string} [options.prompt] - Optional prompt to guide transcription
 *
 * @returns {Promise<string>} The transcribed text
 *
 * @throws {Error} If:
 * - Input validation fails (including unsupported file formats)
 * - API request fails
 * - Response is invalid
 *
 * @example
 * ```typescript
 * const transcription = await transcribeAudio(
 *   'https://your-resource.openai.azure.com',
 *   'your-api-key',
 *   'your-whisper-deployment',
 *   audioFile, // Must be one of: flac, m4a, mp3, mp4, mpeg, mpga, oga, ogg, wav, webm
 *   { language: 'en' }
 * );
 * ```
 */
export async function transcribeAudio(
  endpoint: TranscriptionParams['endpoint'],
  apiKey: TranscriptionParams['apiKey'],
  deploymentName: TranscriptionParams['deploymentName'],
  audioFile: TranscriptionParams['audioFile'],
  options: Omit<TranscriptionParams, 'endpoint' | 'apiKey' | 'deploymentName' | 'audioFile'> = {},
): Promise<string> {
  // Validate inputs
  const validationResult = validateWithZod(validationSchema, {
    endpoint,
    apiKey,
    deploymentName,
    audioFile,
    ...options,
  });

  if (validationResult.isError) {
    throw new Error(`Transcription validation failed: ${JSON.stringify(validationResult.error)}`);
  }

  try {
    const client = new AzureOpenAI({ endpoint, apiKey });

    const transcriptionOptions: TranscriptionCreateParams = {
      file: audioFile,
      model: deploymentName,
      language: options.language,
      prompt: options.prompt,
      response_format: 'text',
    };

    const result = await client.audio.transcriptions.create(transcriptionOptions);

    if (!result || typeof result !== 'string') {
      throw new Error('No transcription received from API');
    }

    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    throw new Error(`Failed to transcribe audio - Error: ${errorMessage}`);
  }
}
