import { sanitizeBody } from '../../src/middleware/audit';

describe('audit body sanitization', () => {
  it('removes credentials and tokens recursively before audit logging', () => {
    const sanitized = sanitizeBody({
      email: 'user@example.test',
      password: 'password-secret',
      accessToken: 'access-secret',
      nested: {
        refresh_token: 'refresh-secret',
        verificationCode: 'code-secret',
        preferences: [{ apiKey: 'api-secret', theme: 'dark' }],
        privateKey: 'private-key-secret',
      },
    });

    expect(sanitized).toEqual({
      email: 'user@example.test',
      nested: {
        preferences: [{ theme: 'dark' }],
      },
    });
    expect(JSON.stringify(sanitized)).not.toMatch(
      /password-secret|access-secret|refresh-secret|code-secret|api-secret|private-key-secret/,
    );
  });
});
