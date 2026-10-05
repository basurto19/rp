import nodemailer from 'nodemailer';
import { env } from '../../src/config/env';
import { sendVerificationEmail } from '../../src/modules/auth/services/email.service';

jest.mock('nodemailer', () => ({
  __esModule: true,
  default: { createTransport: jest.fn() },
}));

describe('sendVerificationEmail', () => {
  it('sends welcome HTML and text with a frontend verification link', async () => {
    const sendMail = jest.fn().mockResolvedValue({});
    (nodemailer.createTransport as jest.Mock).mockReturnValue({ sendMail });
    env.smtpHost = 'smtp.example.test';
    env.smtpPort = 587;
    env.smtpUser = '';
    env.smtpPass = '';
    env.emailFrom = 'erp@example.test';
    env.frontendUrl = 'https://erp.example.test';

    await sendVerificationEmail({
      email: 'ana@example.test',
      firstName: '<Ana>',
      token: 'single-use-token',
    });

    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        from: 'erp@example.test',
        to: 'ana@example.test',
        text: expect.stringContaining(
          'https://erp.example.test/?verify-email=1&token=single-use-token',
        ),
        html: expect.stringContaining(
          'https://erp.example.test/?verify-email=1&amp;token=single-use-token',
        ),
      }),
    );
    const message = sendMail.mock.calls[0][0];
    expect(message.text).toContain('Te damos la bienvenida');
    expect(message.text).toContain('vence en 24 horas');
    expect(message.text).toContain('puedes ignorar');
    expect(message.html).toContain('&lt;Ana&gt;');
  });
});
