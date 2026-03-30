import nodemailer from 'nodemailer';
import type { SendMailOptions } from 'nodemailer';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from './config.js';
import type { SendEmailRequest } from './types.js';

const MAX_ATTEMPTS = 3;
const RETRY_DELAY_MS = 10_000;
const EMAIL_LOGO_CID = 'company-logo';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const LOGO_FILE_PATH = path.resolve(__dirname, '..', '..', 'frontend', 'public', 'branding', 'company-logo.png');

const transporter = nodemailer.createTransport({
  host: config.smtp.host,
  port: config.smtp.port,
  secure: config.smtp.secure,
  auth: {
    user: config.smtp.user,
    pass: config.smtp.pass,
  },
});

function parseRecipients(value?: string): string[] {
  if (!value) return [];
  return value
    .split(/[;,]/)
    .map((v) => v.trim())
    .filter(Boolean);
}

function normalizeBase64(contentBase64: string): string {
  const trimmed = contentBase64.trim();
  const marker = 'base64,';
  const idx = trimmed.indexOf(marker);
  return idx >= 0 ? trimmed.slice(idx + marker.length) : trimmed;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function shouldRetrySmtpError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const e = error as { responseCode?: number; code?: string };
  const code = e.responseCode ?? 0;
  // Retry only transient SMTP failures (4xx), e.g. 451 queue issues.
  if (code >= 400 && code < 500) return true;
  // Defensive fallback for temporary transport-level errors.
  return e.code === 'ETIMEDOUT' || e.code === 'ECONNECTION' || e.code === 'ESOCKET';
}

async function getInlineLogoAttachment() {
  try {
    const content = await fs.readFile(LOGO_FILE_PATH);
    return {
      filename: 'company-logo.png',
      content,
      contentType: 'image/png',
      cid: EMAIL_LOGO_CID,
    };
  } catch {
    return null;
  }
}

export async function sendEmail(payload: SendEmailRequest) {
  const toList = parseRecipients(payload.to);
  const ccList = parseRecipients(payload.cc);
  const bccSet = new Set<string>([
    config.smtp.fromEmail,
    ...parseRecipients(config.smtp.auditBcc),
  ]);
  const bccList = [...bccSet].filter(Boolean);

  const to = toList.length > 0 ? toList.join(', ') : config.smtp.defaultTo;

  const inlineLogo = await getInlineLogoAttachment();

  const attachments: NonNullable<SendMailOptions['attachments']> = [];
  if (payload.attachment) {
    attachments.push({
      filename: payload.attachment.filename,
      content: Buffer.from(normalizeBase64(payload.attachment.contentBase64), 'base64'),
      contentType: payload.attachment.mimeType || 'application/pdf',
    });
  }
  if (inlineLogo) {
    attachments.push(inlineLogo);
  }

  const mailOptions: SendMailOptions = {
    from: `"${payload.fromName || 'Claudio Theodoro'}" <${config.smtp.fromEmail}>`,
    to,
    cc: ccList.length > 0 ? ccList.join(', ') : undefined,
    bcc: bccList.length > 0 ? bccList.join(', ') : undefined,
    subject: payload.subject,
    text: payload.textBody,
    html: payload.htmlBody,
    attachments: attachments.length > 0 ? attachments : undefined,
  };

  let result: { messageId?: string } | null = null;
  let lastError: unknown;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      result = await transporter.sendMail(mailOptions);
      break;
    } catch (error) {
      lastError = error;
      const retryable = shouldRetrySmtpError(error);
      if (!retryable || attempt === MAX_ATTEMPTS) {
        const err = error as { message?: string };
        const msg = err.message ?? 'Falha ao enviar email.';
        throw new Error(
          `Falha no envio SMTP apos ${attempt} tentativa(s): ${msg}`,
        );
      }
      await sleep(RETRY_DELAY_MS);
    }
  }

  if (!result) {
    const err = lastError as { message?: string };
    throw new Error(err?.message ?? 'Falha inesperada no envio SMTP.');
  }

  return {
    messageId: result.messageId || '',
    to,
    cc: ccList.join('; '),
    bcc: bccList.join('; '),
  };
}
