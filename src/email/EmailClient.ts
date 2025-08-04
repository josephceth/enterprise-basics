import nodemailer, { type SentMessageInfo, type Transporter } from 'nodemailer';
import { validateWithZod } from '../utilities/zodUtility.js';
import { z } from 'zod';

export interface Attachment {
  filename?: string;
  fileBytes?: Uint8Array;
  contentType?: string;
}

export interface EmailWithAttachment {
  from: string;
  to: string[];
  cc?: string[];
  subject: string;
  body: string;
  attachments?: Attachment[] | null | undefined;
}

export interface SMTPConfig {
  host: string;
  port: number;
  auth: {
    user: string;
    pass: string;
  };
}

const validationSchema = z.object({
  smtpConfig: z.object({
    host: z.string(),
    port: z.number(),
    auth: z.object({
      user: z.string(),
      pass: z.string(),
    }),
  }),
});

/**
 * Class for sending emails using SMTP.
 * Provides methods to send emails with optional attachments.
 *
 * @example
 * // Create an instance with SMTP configuration
 * const emailClient = new EmailClient({
 *   host: 'smtp.example.com',
 *   port: 587,
 *   auth: { user: 'user', pass: 'pass' }
 * });
 *
 * // Send an email
 * await emailClient.sendEmail({
 *   from: 'sender@example.com',
 *   to: ['recipient@example.com'],
 *   subject: 'Test Email',
 *   body: 'This is a test email with attachment',
 *   attachments: [{
 *     filename: 'test.pdf',
 *     fileBytes: new Uint8Array([255, 255]),
 *     contentType: 'application/pdf'
 *   }]
 * });
 */
export class EmailClient {
  private smtpConfig: SMTPConfig;

  /**
   * Creates a new instance of EmailClient.
   *
   * @param {SMTPConfig} smtpConfig - SMTP server configuration
   *
   * @throws {Error} If validation of SMTP configuration fails
   */
  constructor(smtpConfig: SMTPConfig) {
    const validationResult = validateWithZod(validationSchema, { smtpConfig });
    if (validationResult.isError) {
      throw new Error(`SMTP config validation failed: ${JSON.stringify(validationResult.error)}`);
    }

    this.smtpConfig = smtpConfig;
  }

  /**
   * Sends an email with optional attachments.
   *
   * @param {EmailWithAttachment} email - Email content including sender, recipients, subject, body, and attachments
   *
   * @returns {Promise<void>} Resolves when email is sent successfully
   *
   * @throws {Error} If:
   * - Input validation fails
   * - Email client creation fails
   * - Sending email fails
   */
  async sendEmail(email: EmailWithAttachment, isDev: boolean = false): Promise<void> {
    let emailClient: nodemailer.Transporter | null = null;

    try {
      // Create email client
      emailClient = nodemailer.createTransport(this.smtpConfig);
      let attachments: nodemailer.SendMailOptions['attachments'];
      if (email.attachments != null) {
        attachments = email.attachments?.map((attachment) => ({
          filename: attachment?.filename,
          content: Buffer.from(attachment?.fileBytes ?? new Uint8Array()),
          contentType: attachment?.contentType,
        }));
      }
      const mailOptions = {
        from: email.from,
        to: email.to.join(', '),
        cc: email.cc?.join(', '),
        subject: isDev ? `[TESTING] - ${email.subject}` : email.subject,
        html: isDev ? `<p>THIS IS A TEST EMAIL. PLEASE DISREGARD.</p> ${email.body}` : email.body,
        attachments,
      };

      await emailClient.sendMail(mailOptions);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

      throw new Error(`Failed to send email: ${errorMessage}`);
    } finally {
      if (emailClient) {
        await emailClient.close();
      }
    }
  }
}
