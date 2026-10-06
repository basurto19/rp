import { env } from '../../../config/env';

interface VerificationEmail {
  email: string;
  firstName: string;
  token: string;
}

interface WelcomeEmail {
  email: string;
  firstName: string;
}

interface AdminRegistrationEmail {
  to: string;
  firstName: string;
  lastName: string;
  email: string;
  companyName: string;
  registeredAt: Date;
}

interface AdminBootstrapEmail {
  to: string;
  code: string;
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
  | 'configuration_missing'
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
  const message = typeof details.message === 'string' ? details.message : '';
  const statusCode =
    typeof details.statusCode === 'number' &&
    Number.isInteger(details.statusCode) &&
    details.statusCode >= 100 &&
    details.statusCode <= 599
      ? details.statusCode
      : undefined;

  let category: EmailFailureCategory = 'unknown';
  if (
    message === 'Resend email delivery is not configured' ||
    message === 'FRONTEND_URL is not configured' ||
    message === 'ADMIN_EMAIL is not configured'
  ) {
    category = 'configuration_missing';
  } else if (name === 'TimeoutError' || name === 'AbortError') {
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

export function logEmailDeliveryFailure(
  error: unknown,
  context: 'registration' | 'resend' | 'welcome' | 'admin_registration' | 'admin_bootstrap',
): void {
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

export async function sendWelcomeEmail({ email, firstName }: WelcomeEmail): Promise<void> {
  if (!env.frontendUrl) throw new Error('FRONTEND_URL is not configured');

  const frontendUrl = new URL(env.frontendUrl).toString();
  const safeFirstName = escapeHtml(firstName);
  const safeFrontendUrl = escapeHtml(frontendUrl);
  const text = [
    `Hola, ${firstName}.`,
    '',
    '¡Bienvenido a Apta Digital!',
    '',
    'Tu cuenta ya está lista y puedes comenzar a utilizar las herramientas disponibles en el sistema.',
    '',
    'Desde Apta Digital podrás gestionar de forma centralizada las diferentes áreas de tu empresa.',
    '',
    'Puedes acceder al sistema desde:',
    frontendUrl,
    '',
    'Gracias por utilizar Apta Digital.',
  ].join('\n');
  const html = `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f6f8;padding:32px 16px;font-family:Arial,sans-serif;color:#1f2937">
  <tr><td align="center">
    <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width:600px;background:#ffffff;border-radius:8px">
      <tr><td style="padding:40px 32px">
        <h1 style="margin:0 0 24px;color:#022656;font-size:24px">¡Bienvenido a Apta Digital!</h1>
        <p>Hola, ${safeFirstName}.</p>
        <p>Tu cuenta ya está lista y puedes comenzar a utilizar las herramientas disponibles en el sistema.</p>
        <p>Desde Apta Digital podrás gestionar de forma centralizada las diferentes áreas de tu empresa.</p>
        <p style="margin:28px 0">
          <a href="${safeFrontendUrl}" style="display:inline-block;padding:12px 20px;background:#022656;color:#ffffff;text-decoration:none;border-radius:4px">Acceder al sistema</a>
        </p>
        <p style="font-size:14px;color:#4b5563">Si el botón no funciona, copia este enlace en tu navegador:<br><a href="${safeFrontendUrl}" style="color:#022656">${safeFrontendUrl}</a></p>
        <p>Gracias por utilizar Apta Digital.</p>
      </td></tr>
    </table>
  </td></tr>
</table>`;

  await sendEmail({
    to: email,
    subject: 'Bienvenido a Apta Digital',
    text,
    html,
  });
}

export async function sendAdminRegistrationNotification({
  to,
  firstName,
  lastName,
  email,
  companyName,
  registeredAt,
}: AdminRegistrationEmail): Promise<void> {
  const safeFirstName = escapeHtml(firstName);
  const safeLastName = escapeHtml(lastName);
  const safeEmail = escapeHtml(email);
  const safeCompanyName = escapeHtml(companyName);
  const dateText = registeredAt.toISOString();
  const text = [
    'Se ha registrado un nuevo usuario en Apta Digital.',
    '',
    `Nombre: ${firstName}`,
    `Apellido: ${lastName}`,
    `Correo electrónico: ${email}`,
    `Empresa: ${companyName}`,
    `Fecha/hora del registro: ${dateText}`,
  ].join('\n');
  const html = `<h1>Nuevo usuario registrado en Apta Digital</h1>
<p>Se ha registrado un nuevo usuario en Apta Digital.</p>
<ul>
  <li><strong>Nombre:</strong> ${safeFirstName}</li>
  <li><strong>Apellido:</strong> ${safeLastName}</li>
  <li><strong>Correo electrónico:</strong> ${safeEmail}</li>
  <li><strong>Empresa:</strong> ${safeCompanyName}</li>
  <li><strong>Fecha/hora del registro:</strong> ${escapeHtml(dateText)}</li>
</ul>`;

  await sendEmail({
    to,
    subject: 'Nuevo usuario registrado en Apta Digital',
    text,
    html,
  });
}

export async function sendAdminBootstrapCode({ to, code }: AdminBootstrapEmail): Promise<void> {
  const text = [
    'Se solicitó inicializar la cuenta administradora principal de Apta Digital.',
    '',
    `Código de confirmación: ${code}`,
    '',
    'El código vence en 10 minutos. Si no iniciaste esta operación, ignora este correo.',
  ].join('\n');
  const html = `<p>Se solicitó inicializar la cuenta administradora principal de Apta Digital.</p>
<p><strong>Código de confirmación:</strong> ${escapeHtml(code)}</p>
<p>El código vence en 10 minutos. Si no iniciaste esta operación, ignora este correo.</p>`;

  await sendEmail({
    to,
    subject: 'Código para inicializar el administrador de Apta Digital',
    text,
    html,
  });
}
