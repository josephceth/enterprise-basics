import { z } from 'zod';
import nodemailer from 'nodemailer';
import { validateWithZod } from '../utilities/zodUtility';

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
  email: z.object({
    to: z.array(z.string().email('Invalid email format')),
    cc: z.array(z.string().email('Invalid email format')).optional(),
    subject: z.string().min(1, 'Subject is required'),
    body: z.string().min(20, 'Message body must contain at least 20 characters'),
    attachments: z
      .array(
        z.object({
          filename: z.string(),
          fileBytes: z.record(z.number()),
          contentType: z.string(),
        }),
      )
      .optional()
      .default([]),
  }),
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
 * Sends an email with optional attachments using the specified SMTP configuration.
 *
 * @param {EmailWithAttachment} email - Email content including sender, recipients, subject, body, and attachments
 * @param {SMTPConfig} smtpConfig - SMTP server configuration
 *
 * @returns {Promise<void>} Resolves when email is sent successfully
 *
 * @throws {Error} If:
 * - Input validation fails
 * - Email client creation fails
 * - Sending email fails
 *
 * @example
 * ```typescript
 * await sendEmail({
 *   from: 'sender@example.com',
 *   to: ['recipient@example.com'],
 *   subject: 'Test Email',
 *   body: 'This is a test email with attachment',
 *   attachments: [{
 *     filename: 'test.pdf',
 *     fileBytes: new Uint8Array([255, 255]),
 *     contentType: 'application/pdf'
 *   }]
 * }, {
 *   host: 'smtp.example.com',
 *   port: 587,
 *   auth: { user: 'user', pass: 'pass' }
 * });
 * ```
 */
export async function sendEmail(email: EmailWithAttachment, smtpConfig: SMTPConfig): Promise<void> {
  // Validate inputs
  const validationResult = validateWithZod(validationSchema, { email, smtpConfig });

  if (validationResult.isError) {
    throw new Error(`Email validation failed: ${JSON.stringify(validationResult.error)}`);
  }

  let emailClient: nodemailer.Transporter | null = null;

  try {
    // Create email client
    emailClient = nodemailer.createTransport(smtpConfig);
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
      subject: email.subject,
      html: email.body,
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
