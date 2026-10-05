import nodemailer, { type Transporter } from 'nodemailer';
import { env } from '../../../config/env';

interface VerificationEmail {
  email: string;
  firstName: string;
  token: string;
}

interface OutgoingEmail {
  to: string;
  subject: string;
  text: string;
  html: string;
}

let transporter: Transporter | undefined;

function escapeHtml(value: string): string {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
      })[character] ?? character,
  );
}

function getVerificationUrl(token: string): string {
  if (!env.frontendUrl) throw new Error('FRONTEND_URL is not configured');

  const url = new URL(env.frontendUrl);
  url.pathname = `${url.pathname.replace(/\/+$/, '')}/`;
  url.searchParams.set('verify-email', '1');
  url.searchParams.set('token', token);
  return url.toString();
}

async function getTransporter(): Promise<Transporter> {
  if (!env.smtpHost || !env.emailFrom) {
    throw new Error('SMTP email delivery is not configured');
  }

  transporter ??= nodemailer.createTransport({
    host: env.smtpHost,
    port: env.smtpPort,
    secure: env.smtpPort === 465,
    ...(env.smtpUser || env.smtpPass ? { auth: { user: env.smtpUser, pass: env.smtpPass } } : {}),
  });
  return transporter;
}

export async function sendEmail({ to, subject, text, html }: OutgoingEmail): Promise<void> {
  const mailer = await getTransporter();
  await mailer.sendMail({ from: env.emailFrom, to, subject, text, html });
}

export async function sendVerificationEmail({
  email,
  firstName,
  token,
}: VerificationEmail): Promise<void> {
  const verificationUrl = getVerificationUrl(token);
  const safeFirstName = escapeHtml(firstName);
  const text = [
    `Hola ${firstName},`,
    '',
    'Te damos la bienvenida al ERP. Verifica tu correo para activar el acceso a tu cuenta:',
    verificationUrl,
    '',
    'Este enlace vence en 24 horas. Si no creaste esta cuenta, puedes ignorar este mensaje.',
  ].join('\n');
  const html = `<p>Hola ${safeFirstName},</p>
<p>Te damos la bienvenida al ERP. Verifica tu correo para activar el acceso a tu cuenta.</p>
<p><a href="${escapeHtml(verificationUrl)}" style="display:inline-block;padding:12px 20px;background:#022656;color:#ffffff;text-decoration:none;border-radius:4px">Verificar correo</a></p>
<p>Este enlace vence en 24 horas. Si no creaste esta cuenta, puedes ignorar este mensaje.</p>`;

  await sendEmail({
    to: email,
    subject: 'Verifica tu correo para acceder al ERP',
    text,
    html,
  });
}
