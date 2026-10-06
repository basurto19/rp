import { env } from '../../src/config/env';
import {
  logEmailDeliveryFailure,
  sendWelcomeEmail,
  sendVerificationEmail,
} from '../../src/modules/auth/services/email.service';

describe('sendVerificationEmail', () => {
  let fetchMock: jest.SpyInstance;

  beforeEach(() => {
    fetchMock = jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
    } as Response);
    env.resendApiKey = 'test-resend-api-key';
    env.emailFrom = 'erp@example.test';
    env.frontendUrl = 'https://erp.example.test';
  });

  afterEach(() => {
    fetchMock.mockRestore();
  });

  it('sends HTML and text through the Resend HTTPS API with a verification link', async () => {
    await sendVerificationEmail({
      email: 'ana@example.test',
      firstName: '<Ana>',
      token: 'single-use-token',
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, request] = fetchMock.mock.calls[0];
    expect(url).toBe('https://api.resend.com/emails');
    expect(request).toMatchObject({
      method: 'POST',
      headers: {
        Authorization: 'Bearer test-resend-api-key',
        'Content-Type': 'application/json',
      },
      signal: expect.objectContaining({ aborted: false }),
    });
    expect(request.signal).toBeInstanceOf(AbortSignal);

    const message = JSON.parse(request.body as string) as {
      from: string;
      to: string;
      subject: string;
      text: string;
      html: string;
    };
    expect(message).toMatchObject({
      from: 'erp@example.test',
      to: 'ana@example.test',
      subject: 'Verifica tu correo para acceder al ERP',
    });
    expect(message.text).toContain(
      'https://erp.example.test/?verify-email=1&token=single-use-token',
    );
    expect(message.html).toContain(
      'https://erp.example.test/?verify-email=1&amp;token=single-use-token',
    );
    expect(message.text).toContain('Te damos la bienvenida');
    expect(message.text).toContain('vence en 24 horas');
    expect(message.text).toContain('puedes ignorar');
    expect(message.html).toContain('&lt;Ana&gt;');
  });

  it('throws a sanitized error for failed provider responses', async () => {
    fetchMock.mockResolvedValueOnce({ ok: false, status: 422 } as Response);

    await expect(
      sendVerificationEmail({
        email: 'ana@example.test',
        firstName: 'Ana',
        token: 'verification-secret',
      }),
    ).rejects.toMatchObject({
      name: 'ResendApiError',
      statusCode: 422,
      message: 'Resend email request failed',
    });
  });

  it('logs only safe error category and status, never provider messages or secrets', () => {
    const log = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    const failure = Object.assign(
      new Error('secret API key and https://site.test/?token=verification-secret'),
      { statusCode: 401 },
    );

    logEmailDeliveryFailure(failure, 'welcome');

    expect(log).toHaveBeenCalledWith('Email provider delivery failed', {
      context: 'welcome',
      category: 'authentication_rejected',
      statusCode: 401,
    });
    expect(JSON.stringify(log.mock.calls)).not.toContain('secret API key');
    expect(JSON.stringify(log.mock.calls)).not.toContain('verification-secret');
    log.mockRestore();
  });

  it.each([
    [{ name: 'TimeoutError' }, 'request_timeout'],
    [{ statusCode: 403 }, 'permission_rejected'],
    [{ statusCode: 429 }, 'rate_limited'],
    [{ statusCode: 503 }, 'provider_unavailable'],
    [{ statusCode: 422 }, 'provider_rejected'],
    [{ code: 'ECONNRESET' }, 'network_error'],
  ])('classifies Resend failures safely', (failure, category) => {
    const log = jest.spyOn(console, 'error').mockImplementation(() => undefined);

    logEmailDeliveryFailure(failure, 'resend');

    expect(log.mock.calls[0][1]).toMatchObject({ category, context: 'resend' });
    log.mockRestore();
  });

  it('fails clearly if Resend credentials or sender configuration are missing', async () => {
    env.resendApiKey = '';
    await expect(
      sendVerificationEmail({ email: 'ana@example.test', firstName: 'Ana', token: 'token' }),
    ).rejects.toThrow('Resend email delivery is not configured');
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('sendWelcomeEmail', () => {
  let fetchMock: jest.SpyInstance;

  beforeEach(() => {
    fetchMock = jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
    } as Response);
    env.resendApiKey = 'test-key';
    env.emailFrom = 'erp@example.test';
    env.frontendUrl = 'https://erp.example.test';
  });

  afterEach(() => {
    fetchMock.mockRestore();
  });

  it('sends a safe welcome email with HTML and plain-text versions through Resend', async () => {
    await sendWelcomeEmail({ email: 'ana@example.test', firstName: '<Ana>' });

    const [, request] = fetchMock.mock.calls[0];
    const message = JSON.parse(request.body as string) as {
      to: string;
      subject: string;
      text: string;
      html: string;
    };
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(message).toMatchObject({
      to: 'ana@example.test',
      subject: 'Bienvenido a ERP',
    });
    expect(message.text).toContain('Hola, <Ana>.');
    expect(message.text).toContain('https://erp.example.test/');
    expect(message.html).toContain('Hola, &lt;Ana&gt;.');
    expect(message.html).toContain('href="https://erp.example.test/"');
    expect(message.html).not.toContain('Hola, <Ana>.');
  });
});
