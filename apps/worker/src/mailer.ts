import nodemailer from 'nodemailer';
import { env } from './config/env.js';
import { logger } from './logger.js';

const hasSmtpConfig = Boolean(env.SMTP_HOST && env.SMTP_PORT && env.SMTP_USER && env.SMTP_PASS);

const transporter = hasSmtpConfig
  ? nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_PORT === 465,
      auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
    })
  : null;

// Degrades to logging instead of throwing when SMTP isn't configured, so the rest of the
// booking/reminder pipeline (status transitions, timestamps) still works in early dev.
export async function sendMail(to: string, subject: string, html: string, text: string): Promise<void> {
  if (!transporter) {
    logger.warn({ to, subject }, 'SMTP not configured - logging email instead of sending');
    return;
  }
  await transporter.sendMail({ from: env.EMAIL_FROM, to, subject, html, text });
}
