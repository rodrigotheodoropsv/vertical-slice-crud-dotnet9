import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Variavel de ambiente obrigatoria ausente: ${name}`);
  }
  return value;
}

function bool(value: string | undefined, fallback: boolean): boolean {
  if (!value) return fallback;
  return value.toLowerCase() === 'true';
}

function toInt(value: string | undefined, fallback: number): number {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

export const config = {
  port: toInt(process.env.PORT, 8787),
  allowedOrigin: process.env.ALLOWED_ORIGIN?.trim() || 'http://localhost:5173',
  smtp: {
    host: required('SMTP_HOST'),
    port: toInt(process.env.SMTP_PORT, 465),
    secure: bool(process.env.SMTP_SECURE, true),
    user: required('SMTP_USER'),
    pass: required('SMTP_PASS'),
    fromEmail: required('SMTP_FROM_EMAIL'),
    defaultTo: process.env.SMTP_DEFAULT_TO?.trim() || 'vendas1@lubefer.com.br',
    auditBcc: process.env.SMTP_AUDIT_BCC?.trim() || '',
  },
  logCsvPath: process.env.LOG_CSV_PATH?.trim() || path.join('logs', 'email-sends.csv'),
};
