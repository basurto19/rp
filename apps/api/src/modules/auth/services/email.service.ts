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

const RESEND_REQUEST_TIMEOUT_MS = 10_000;
const RESEND_EMAILS_URL = 'https://api.resend.com/emails';

type EmailFailureCategory =
  | 'request_timeout'
  | 'authentication_rejected'
  | 'permission_rejected'
  | 'rate_limited'
  | 'provider_rejected'
  | 'provider_unavailable'
  | 'network_error'
  | 'unknown';

class ResendApiError extends Error {
  constructor(readonly statusCode: number) {
    super('Resend email request failed');
    this.name = 'ResendApiError';
  }
}

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

function ensureResendConfiguration(): void {
  if (!env.resendApiKey || !env.emailFrom) {
    throw new Error('Resend email delivery is not configured');
  }
}

function emailFailureDetails(error: unknown): {
  category: EmailFailureCategory;
  statusCode?: number;
} {
  const details =
    typeof error === 'object' && error !== null ? (error as Record<string, unknown>) : {};
  const name = typeof details.name === 'string' ? details.name : '';
  const code = typeof details.code === 'string' ? details.code : '';
  const statusCode =
    typeof details.statusCode === 'number' &&
    Number.isInteger(details.statusCode) &&
    details.statusCode >= 100 &&
    details.statusCode <= 599
      ? details.statusCode
      : undefined;

  let category: EmailFailureCategory = 'unknown';
  if (name === 'TimeoutError' || name === 'AbortError') {
    category = 'request_timeout';
  } else if (statusCode === 401) {
    category = 'authentication_rejected';
  } else if (statusCode === 403) {
    category = 'permission_rejected';
  } else if (statusCode === 429) {
    category = 'rate_limited';
  } else if (statusCode !== undefined && statusCode >= 500) {
    category = 'provider_unavailable';
  } else if (statusCode !== undefined && statusCode >= 400) {
    category = 'provider_rejected';
  } else if (code === 'ETIMEDOUT' || code === 'ECONNRESET' || code === 'ECONNREFUSED') {
    category = 'network_error';
  }

  return { category, ...(statusCode !== undefined ? { statusCode } : {}) };
}

export function logEmailDeliveryFailure(error: unknown, context: 'registration' | 'resend'): void {
  console.error('Email provider delivery failed', { context, ...emailFailureDetails(error) });
}

export async function sendEmail({ to, subject, text, html }: OutgoingEmail): Promise<void> {
  ensureResendConfiguration();
  const response = await fetch(RESEND_EMAILS_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from: env.emailFrom, to, subject, text, html }),
    signal: AbortSignal.timeout(RESEND_REQUEST_TIMEOUT_MS),
  });

  if (!response.ok) throw new ResendApiError(response.status);
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
