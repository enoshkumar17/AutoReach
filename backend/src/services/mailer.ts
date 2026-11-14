import nodemailer from 'nodemailer';
import path from 'path';
import fs from 'fs';

export interface SendEmailOptions {
  to: string;
  subject: string;
  body: string;
  resumePath?: string | null;
  gmailUser?: string;
  gmailAppPassword?: string;
}

export function createTransporter(gmailUser?: string, gmailAppPassword?: string) {
  const user = gmailUser || process.env.GMAIL_USER;
  const pass = gmailAppPassword || process.env.GMAIL_APP_PASSWORD;

  if (!user || !pass) {
    throw new Error('Gmail credentials missing. Please set GMAIL_USER and GMAIL_APP_PASSWORD.');
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: user,
      pass: pass,
    },
  });
}

export async function verifyEmailCredentials(gmailUser?: string, gmailAppPassword?: string): Promise<{ success: boolean; message: string }> {
  try {
    const transporter = createTransporter(gmailUser, gmailAppPassword);
    await transporter.verify();
    return { success: true, message: 'Gmail SMTP credentials successfully verified.' };
  } catch (error: any) {
    return { success: false, message: error.message || 'Failed to verify Gmail credentials.' };
  }
}

export async function sendApplicationEmail(options: SendEmailOptions) {
  const transporter = createTransporter(options.gmailUser, options.gmailAppPassword);
  const senderEmail = options.gmailUser || process.env.GMAIL_USER;

  const attachments: any[] = [];
  if (options.resumePath && fs.existsSync(options.resumePath)) {
    attachments.push({
      filename: path.basename(options.resumePath),
      path: options.resumePath,
    });
  }

  // Convert plain text newlines to clean readable HTML formatting while preserving plain text
  const formattedHtml = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 15px; line-height: 1.6; color: #1f2937;">
      ${options.body.replace(/\n/g, '<br/>')}
    </div>
  `;

  const mailOptions = {
    from: senderEmail,
    to: options.to,
    subject: options.subject,
    text: options.body,
    html: formattedHtml,
    attachments: attachments,
  };

  const info = await transporter.sendMail(mailOptions);
  return {
    messageId: info.messageId,
    accepted: info.accepted,
  };
}
