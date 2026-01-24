import twilio from 'twilio';

export interface TwilioConfig {
  accountSid: string;
  authToken: string;
  fromNumber: string;
}

export interface SendSmsResult {
  success: boolean;
  recipient: string;
  messageSid?: string;
  error?: string;
}

/**
 * Sends a one-way SMS to multiple recipients using the Twilio SDK.
 *
 * @param config - Twilio authentication and configuration object
 * @param message - The text message body to send
 * @param recipients - Array of recipient phone numbers (E.164 format recommended)
 * @returns A promise that resolves to an array of results for each recipient
 */
export async function sendSMS(config: TwilioConfig, message: string, recipients: string[]): Promise<SendSmsResult[]> {
  const { accountSid, authToken, fromNumber } = config;

  if (!accountSid || !authToken || !fromNumber) {
    throw new Error(
      'Twilio configuration is missing required fields: accountSid, authToken, and fromNumber must be provided.',
    );
  }

  // Initialize the Twilio client
  // We initialize inside the function to use the provided config for this specific call
  const client = twilio(accountSid, authToken);

  const sendPromises = recipients.map(
    async (to): Promise<SendSmsResult> => {
      try {
        // Twilio messages.create is for a single recipient
        const response = await client.messages.create({
          body: message,
          from: fromNumber,
          to: to,
        });

        return {
          success: true,
          recipient: to,
          messageSid: response.sid,
        };
      } catch (error: any) {
        // Log error but don't throw, so other recipients can still receive their messages
        console.error(`Twilio SMS Error for recipient ${to}:`, {
          code: error.code,
          message: error.message,
          status: error.status,
        });

        return {
          success: false,
          recipient: to,
          error: error.message || 'Unknown Twilio error',
        };
      }
    },
  );

  return await Promise.all(sendPromises);
}
