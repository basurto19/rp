import { createHash } from 'node:crypto';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import mongoose from 'mongoose';
import { AuthService } from '../../src/modules/auth/services/auth.service';
import { env } from '../../src/config/env';
import { User } from '../../src/modules/users/models/user.model';
import { Company } from '../../src/modules/companies/models/company.model';
import { Role } from '../../src/modules/roles/models/role.model';
import { Token } from '../../src/modules/auth/models/token.model';
import { EmailVerificationToken } from '../../src/modules/auth/models/email-verification-token.model';
import {
  logEmailDeliveryFailure,
  sendWelcomeEmail,
  sendVerificationEmail,
} from '../../src/modules/auth/services/email.service';
import { AppError } from '../../src/modules/shared/errors/app-error';

jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('password-hash'),
  compare: jest.fn().mockResolvedValue(true),
}));

jest.mock('../../src/modules/users/models/user.model', () => {
  const User = jest.fn().mockImplementation(function (
    this: Record<string, unknown>,
    values: Record<string, unknown>,
  ) {
    Object.assign(this, values);
    this._id = 'test-user-id';
    this.save = jest.fn().mockResolvedValue(this);
  }) as jest.Mock & Record<string, jest.Mock>;
  User.findOne = jest.fn();
  User.findById = jest.fn();
  User.findByIdAndUpdate = jest.fn();
  User.findOneAndUpdate = jest.fn();
  return { User };
});

jest.mock('../../src/modules/companies/models/company.model', () => ({
  Company: jest.fn().mockImplementation(function (
    this: Record<string, unknown>,
    values: Record<string, unknown>,
  ) {
    Object.assign(this, values);
    this.save = jest.fn().mockResolvedValue(this);
  }),
}));

jest.mock('../../src/modules/roles/models/role.model', () => {
  const Role = jest.fn().mockImplementation(function (
    this: Record<string, unknown>,
    values: Record<string, unknown>,
  ) {
    Object.assign(this, values);
    this.save = jest.fn().mockResolvedValue(this);
  }) as jest.Mock & Record<string, jest.Mock>;
  Role.findOne = jest.fn();
  return { Role };
});

jest.mock('../../src/modules/auth/models/token.model', () => ({
  Token: { create: jest.fn(), updateMany: jest.fn(), findOne: jest.fn() },
}));

jest.mock('../../src/modules/auth/models/email-verification-token.model', () => ({
  EmailVerificationToken: {
    findOneAndUpdate: jest.fn(),
    findOneAndDelete: jest.fn(),
  },
}));

jest.mock('../../src/modules/auth/services/email.service', () => ({
  sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
  sendWelcomeEmail: jest.fn().mockResolvedValue(undefined),
  logEmailDeliveryFailure: jest.fn(),
}));

function query<T>(value: T) {
  return { exec: jest.fn().mockResolvedValue(value) };
}

function verificationHash(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

async function waitForBackgroundEmail(): Promise<void> {
  await new Promise<void>((resolve) => setImmediate(resolve));
}

describe('AuthService email verification', () => {
  let authService: AuthService;
  let mockSession: { withTransaction: jest.Mock; endSession: jest.Mock };

  beforeEach(() => {
    jest.clearAllMocks();
    authService = new AuthService();
    mockSession = {
      withTransaction: jest.fn(async (callback: () => Promise<void>) => callback()),
      endSession: jest.fn().mockResolvedValue(undefined),
    };
    jest.spyOn(mongoose, 'startSession').mockResolvedValue(mockSession as never);
    (EmailVerificationToken.findOneAndUpdate as jest.Mock).mockReturnValue(query({}));
    (EmailVerificationToken.findOneAndDelete as jest.Mock).mockReturnValue(query(null));
    (sendVerificationEmail as jest.Mock).mockResolvedValue(undefined);
    (sendWelcomeEmail as jest.Mock).mockResolvedValue(undefined);
    (User.findOneAndUpdate as jest.Mock).mockReturnValue(query(null));
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('registers an unverified user and returns no session tokens', async () => {
    (User.findOne as jest.Mock).mockReturnValue({
      session: jest.fn().mockReturnValue(query(null)),
    });

    const result = await authService.register({
      firstName: 'Ana',
      lastName: 'Pérez',
      email: 'ANA@example.com',
      password: 'password123',
      companyName: 'Empresa',
    });

    expect((User as unknown as jest.Mock).mock.instances[0]).toMatchObject({
      email: 'ana@example.com',
      emailVerified: false,
      emailVerifiedAt: null,
    });
    expect(result).not.toHaveProperty('accessToken');
    expect(result).not.toHaveProperty('refreshToken');
    expect(Token.create).not.toHaveBeenCalled();
    expect(sendWelcomeEmail).not.toHaveBeenCalled();
    expect(sendVerificationEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'ana@example.com',
        firstName: 'Ana',
        token: expect.any(String),
      }),
    );
    const sentToken = (sendVerificationEmail as jest.Mock).mock.calls[0][0].token;
    const storedToken = (EmailVerificationToken.findOneAndUpdate as jest.Mock).mock.calls[0][1];
    expect(sentToken).toMatch(/^[a-f0-9]{64}$/);
    expect(storedToken.expiresAt.getTime()).toBeGreaterThan(Date.now() + 23 * 60 * 60 * 1000);
    expect(EmailVerificationToken.findOneAndUpdate).toHaveBeenCalledWith(
      { userId: 'test-user-id' },
      expect.objectContaining({ tokenHash: verificationHash(sentToken) }),
      expect.any(Object),
    );
    expect(EmailVerificationToken.findOneAndUpdate).not.toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ tokenHash: sentToken }),
      expect.anything(),
    );
  });

  it('keeps the created account when email delivery fails so it can be resent', async () => {
    (User.findOne as jest.Mock).mockReturnValue({
      session: jest.fn().mockReturnValue(query(null)),
    });
    (sendVerificationEmail as jest.Mock).mockRejectedValueOnce(
      Object.assign(new Error('SMTP unavailable'), { code: 'ETIMEDOUT' }),
    );

    await expect(
      authService.register({
        firstName: 'Ana',
        lastName: 'Pérez',
        email: 'ana@example.com',
        password: 'password123',
        companyName: 'Empresa',
      }),
    ).rejects.toMatchObject({ code: 'EMAIL_DELIVERY_FAILED' });

    expect((User as unknown as jest.Mock).mock.instances[0]).toMatchObject({
      email: 'ana@example.com',
      emailVerified: false,
    });
    expect(EmailVerificationToken.findOneAndUpdate).toHaveBeenCalledTimes(1);
    expect(Token.create).not.toHaveBeenCalled();
    expect(logEmailDeliveryFailure).toHaveBeenCalledWith(expect.any(Error), 'registration');
  });

  it('rejects valid-credential login until a new account verifies its email', async () => {
    (User.findOne as jest.Mock).mockReturnValue(
      query({
        _id: 'unverified-user',
        emailVerified: false,
        status: 'active',
        passwordHash: 'password-hash',
      }),
    );

    await expect(authService.login('user@example.com', 'correct-password')).rejects.toMatchObject({
      code: 'EMAIL_NOT_VERIFIED',
    });
    expect(Token.create).not.toHaveBeenCalled();
    expect(sendWelcomeEmail).not.toHaveBeenCalled();
    expect(User.findOneAndUpdate).not.toHaveBeenCalled();
  });

  it('verifies a valid token using its hash and expiry condition', async () => {
    (EmailVerificationToken.findOneAndDelete as jest.Mock).mockReturnValue(
      query({ userId: 'verified-user' }),
    );
    (User.findByIdAndUpdate as jest.Mock).mockReturnValue(query({ _id: 'verified-user' }));

    await expect(authService.verifyEmail('one-time-token')).resolves.toMatchObject({
      message: 'Correo verificado correctamente.',
    });
    const filter = (EmailVerificationToken.findOneAndDelete as jest.Mock).mock.calls[0][0];
    expect(filter.tokenHash).toBe(verificationHash('one-time-token'));
    expect(filter.tokenHash).not.toBe('one-time-token');
    expect(filter.expiresAt.$gt).toBeInstanceOf(Date);
    expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
      'verified-user',
      expect.objectContaining({ emailVerified: true, emailVerifiedAt: expect.any(Date) }),
      { new: true },
    );
  });

  it('rejects invalid, expired, and previously used tokens', async () => {
    await expect(authService.verifyEmail('invalid-token')).rejects.toMatchObject({
      code: 'INVALID_VERIFICATION_TOKEN',
    });
    expect(
      (EmailVerificationToken.findOneAndDelete as jest.Mock).mock.calls[0][0].expiresAt.$gt,
    ).toBeInstanceOf(Date);

    (EmailVerificationToken.findOneAndDelete as jest.Mock)
      .mockReturnValueOnce(query({ userId: 'used-user' }))
      .mockReturnValueOnce(query(null));
    (User.findByIdAndUpdate as jest.Mock).mockReturnValue(query({ _id: 'used-user' }));

    await authService.verifyEmail('one-time-token');
    await expect(authService.verifyEmail('one-time-token')).rejects.toMatchObject({
      code: 'INVALID_VERIFICATION_TOKEN',
    });
    expect(User.findByIdAndUpdate).toHaveBeenCalledTimes(1);
  });

  it('rejects an expired token by requiring expiry to be in the future', async () => {
    const startedAt = Date.now();
    await expect(authService.verifyEmail('expired-token')).rejects.toMatchObject({
      code: 'INVALID_VERIFICATION_TOKEN',
    });

    const expiryFilter = (EmailVerificationToken.findOneAndDelete as jest.Mock).mock.calls[0][0]
      .expiresAt.$gt;
    expect(expiryFilter).toBeInstanceOf(Date);
    expect(expiryFilter.getTime()).toBeGreaterThanOrEqual(startedAt);
  });

  it('allows existing users without an emailVerified field to log in', async () => {
    const existingUser = {
      _id: 'legacy-user',
      tenantId: 'legacy-tenant',
      email: 'legacy@example.com',
      passwordHash: 'password-hash',
      status: 'active',
      roleId: 'admin',
      branchId: null,
    };
    (User.findOne as jest.Mock).mockReturnValue(query(existingUser));
    (Role.findOne as jest.Mock).mockReturnValue(query({ permissions: [] }));
    (Token.create as jest.Mock).mockResolvedValue({});
    (User.findByIdAndUpdate as jest.Mock).mockReturnValue(query(existingUser));

    await expect(authService.login(existingUser.email, 'correct-password')).resolves.toHaveProperty(
      'accessToken',
    );
    expect(Token.create).toHaveBeenCalledTimes(1);
  });

  it('allows an explicitly verified user to log in', async () => {
    const verifiedUser = {
      _id: 'verified-user',
      tenantId: 'verified-tenant',
      email: 'verified@example.com',
      passwordHash: 'password-hash',
      status: 'active',
      emailVerified: true,
      roleId: 'admin',
      branchId: null,
    };
    (User.findOne as jest.Mock).mockReturnValue(query(verifiedUser));
    (Role.findOne as jest.Mock).mockReturnValue(query({ permissions: [] }));
    (Token.create as jest.Mock).mockResolvedValue({});
    (User.findByIdAndUpdate as jest.Mock).mockReturnValue(query(verifiedUser));

    await expect(authService.login(verifiedUser.email, 'correct-password')).resolves.toHaveProperty(
      'accessToken',
    );
    expect(Token.create).toHaveBeenCalledTimes(1);
  });

  it('attempts welcome delivery after the first successful verified login and marks it sent', async () => {
    const verifiedUser = {
      _id: 'first-login-user',
      tenantId: 'tenant',
      email: 'first@example.com',
      firstName: 'Ana',
      passwordHash: 'password-hash',
      status: 'active',
      emailVerified: true,
      roleId: 'admin',
      branchId: null,
    };
    (User.findOne as jest.Mock).mockReturnValue(query(verifiedUser));
    (Role.findOne as jest.Mock).mockReturnValue(query({ permissions: [] }));
    (Token.create as jest.Mock).mockResolvedValue({});
    (User.findByIdAndUpdate as jest.Mock).mockReturnValue(query(verifiedUser));
    (User.findOneAndUpdate as jest.Mock)
      .mockReturnValueOnce(query(verifiedUser))
      .mockReturnValueOnce(query(verifiedUser));

    const loginResult = await authService.login(verifiedUser.email, 'correct-password');
    await waitForBackgroundEmail();

    expect(loginResult).toHaveProperty('accessToken');
    expect(sendWelcomeEmail).toHaveBeenCalledWith({
      email: verifiedUser.email,
      firstName: verifiedUser.firstName,
    });
    expect(User.findOneAndUpdate).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        _id: verifiedUser._id,
        welcomeEmailSentAt: null,
        $or: expect.any(Array),
      }),
      { $set: { welcomeEmailSendingAt: expect.any(Date) } },
      { new: true },
    );
    expect(User.findOneAndUpdate).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ _id: verifiedUser._id, welcomeEmailSendingAt: expect.any(Date) }),
      {
        $set: { welcomeEmailSentAt: expect.any(Date) },
        $unset: { welcomeEmailSendingAt: 1 },
      },
    );
  });

  it('does not send again when a previous login already marked the welcome email', async () => {
    const verifiedUser = {
      _id: 'already-welcomed-user',
      tenantId: 'tenant',
      email: 'welcomed@example.com',
      firstName: 'Ana',
      passwordHash: 'password-hash',
      status: 'active',
      emailVerified: true,
      welcomeEmailSentAt: new Date(),
      roleId: 'admin',
      branchId: null,
    };
    (User.findOne as jest.Mock).mockReturnValue(query(verifiedUser));
    (Role.findOne as jest.Mock).mockReturnValue(query({ permissions: [] }));
    (Token.create as jest.Mock).mockResolvedValue({});
    (User.findByIdAndUpdate as jest.Mock).mockReturnValue(query(verifiedUser));

    await authService.login(verifiedUser.email, 'correct-password');
    await waitForBackgroundEmail();

    expect(sendWelcomeEmail).not.toHaveBeenCalled();
    expect(User.findOneAndUpdate).not.toHaveBeenCalled();
  });

  it('keeps login successful after a provider failure and retries on a later login', async () => {
    const verifiedUser = {
      _id: 'retry-welcome-user',
      tenantId: 'tenant',
      email: 'retry@example.com',
      firstName: 'Ana',
      passwordHash: 'password-hash',
      status: 'active',
      emailVerified: true,
      roleId: 'admin',
      branchId: null,
    };
    (User.findOne as jest.Mock).mockReturnValue(query(verifiedUser));
    (Role.findOne as jest.Mock).mockReturnValue(query({ permissions: [] }));
    (Token.create as jest.Mock).mockResolvedValue({});
    (User.findByIdAndUpdate as jest.Mock).mockReturnValue(query(verifiedUser));
    (User.findOneAndUpdate as jest.Mock)
      .mockReturnValueOnce(query(verifiedUser))
      .mockReturnValueOnce(query(verifiedUser))
      .mockReturnValueOnce(query(verifiedUser))
      .mockReturnValueOnce(query(verifiedUser));
    (sendWelcomeEmail as jest.Mock)
      .mockRejectedValueOnce(
        Object.assign(new Error('private provider response'), { statusCode: 503 }),
      )
      .mockResolvedValueOnce(undefined);

    await expect(authService.login(verifiedUser.email, 'correct-password')).resolves.toHaveProperty(
      'accessToken',
    );
    await waitForBackgroundEmail();

    expect(logEmailDeliveryFailure).toHaveBeenCalledWith(expect.any(Error), 'welcome');
    expect(User.findOneAndUpdate).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ _id: verifiedUser._id, welcomeEmailSendingAt: expect.any(Date) }),
      { $unset: { welcomeEmailSendingAt: 1 } },
    );
    expect(User.findOneAndUpdate).not.toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        $set: expect.objectContaining({ welcomeEmailSentAt: expect.any(Date) }),
      }),
      expect.anything(),
    );

    await expect(authService.login(verifiedUser.email, 'correct-password')).resolves.toHaveProperty(
      'accessToken',
    );
    await waitForBackgroundEmail();

    expect(sendWelcomeEmail).toHaveBeenCalledTimes(2);
    expect(User.findOneAndUpdate).toHaveBeenCalledTimes(4);
    expect(User.findOneAndUpdate).toHaveBeenNthCalledWith(
      4,
      expect.objectContaining({ _id: verifiedUser._id, welcomeEmailSendingAt: expect.any(Date) }),
      {
        $set: { welcomeEmailSentAt: expect.any(Date) },
        $unset: { welcomeEmailSendingAt: 1 },
      },
    );
  });

  it('uses the atomic reservation so simultaneous logins send at most one welcome email', async () => {
    const verifiedUser = {
      _id: 'concurrent-welcome-user',
      tenantId: 'tenant',
      email: 'concurrent@example.com',
      firstName: 'Ana',
      passwordHash: 'password-hash',
      status: 'active',
      emailVerified: true,
      roleId: 'admin',
      branchId: null,
    };
    (User.findOne as jest.Mock).mockReturnValue(query(verifiedUser));
    (Role.findOne as jest.Mock).mockReturnValue(query({ permissions: [] }));
    (Token.create as jest.Mock).mockResolvedValue({});
    (User.findByIdAndUpdate as jest.Mock).mockReturnValue(query(verifiedUser));
    (User.findOneAndUpdate as jest.Mock)
      .mockReturnValueOnce(query(verifiedUser))
      .mockReturnValueOnce(query(null))
      .mockReturnValueOnce(query(verifiedUser));

    await Promise.all([
      authService.login(verifiedUser.email, 'correct-password'),
      authService.login(verifiedUser.email, 'correct-password'),
    ]);
    await waitForBackgroundEmail();

    expect(sendWelcomeEmail).toHaveBeenCalledTimes(1);
  });

  it('does not trigger welcome delivery when credentials are incorrect', async () => {
    const verifiedUser = {
      _id: 'wrong-password-user',
      email: 'wrong@example.com',
      passwordHash: 'password-hash',
      status: 'active',
      emailVerified: true,
    };
    (User.findOne as jest.Mock).mockReturnValue(query(verifiedUser));
    (bcrypt.compare as jest.Mock).mockResolvedValueOnce(false);

    await expect(authService.login(verifiedUser.email, 'incorrect-password')).rejects.toMatchObject(
      {
        code: 'INVALID_CREDENTIALS',
      },
    );
    expect(sendWelcomeEmail).not.toHaveBeenCalled();
    expect(Token.create).not.toHaveBeenCalled();
  });

  it('does not trigger welcome delivery when the access token is refreshed', async () => {
    const verifiedUser = {
      _id: 'refresh-user',
      tenantId: 'tenant',
      email: 'refresh@example.com',
      passwordHash: 'password-hash',
      status: 'active',
      emailVerified: true,
      roleId: 'admin',
      branchId: null,
    };
    const refreshToken = jwt.sign({ userId: verifiedUser._id }, env.jwtRefreshSecret, {
      expiresIn: '1h',
    });
    (Token.findOne as jest.Mock).mockReturnValue(
      query({ expiresAt: new Date(Date.now() + 60 * 60 * 1000) }),
    );
    (User.findById as jest.Mock).mockReturnValue(query(verifiedUser));
    (Role.findOne as jest.Mock).mockReturnValue(query({ permissions: [] }));

    await expect(authService.refreshToken(refreshToken)).resolves.toHaveProperty('accessToken');
    expect(sendWelcomeEmail).not.toHaveBeenCalled();
    expect(User.findOneAndUpdate).not.toHaveBeenCalled();
  });

  it('replaces the outstanding verification hash when resending', async () => {
    const user = {
      _id: 'resend-user',
      email: 'user@example.com',
      firstName: 'Ari',
      emailVerified: false,
    };
    (User.findOne as jest.Mock).mockReturnValue(query(user));

    const response = await authService.resendVerification(user.email);

    expect(response.message).toBe(
      'Si la cuenta existe y aún no está verificada, enviaremos un correo de verificación.',
    );
    expect(EmailVerificationToken.findOneAndUpdate).toHaveBeenCalledWith(
      { userId: 'resend-user' },
      expect.objectContaining({
        userId: 'resend-user',
        tokenHash: expect.stringMatching(/^[a-f0-9]{64}$/),
        expiresAt: expect.any(Date),
      }),
      expect.objectContaining({ upsert: true }),
    );
    const sentToken = (sendVerificationEmail as jest.Mock).mock.calls[0][0].token;
    const replacementHash = (EmailVerificationToken.findOneAndUpdate as jest.Mock).mock.calls[0][1]
      .tokenHash;
    expect(replacementHash).toBe(verificationHash(sentToken));
    expect(replacementHash).not.toBe(sentToken);
  });

  it('returns the same resend response for an unknown email', async () => {
    (User.findOne as jest.Mock).mockReturnValueOnce(query(null));
    const unknownResponse = await authService.resendVerification('unknown@example.com');

    (User.findOne as jest.Mock).mockReturnValueOnce(
      query({
        _id: 'known-user',
        email: 'known@example.com',
        firstName: 'Known',
      }),
    );
    const knownResponse = await authService.resendVerification('known@example.com');

    expect(unknownResponse).toEqual(knownResponse);
    expect(sendVerificationEmail).toHaveBeenCalledTimes(1);
  });

  it('keeps resend responses generic when the provider fails', async () => {
    const user = {
      _id: 'resend-user',
      email: 'user@example.com',
      firstName: 'Ari',
      emailVerified: false,
    };
    (User.findOne as jest.Mock).mockReturnValue(query(user));
    (sendVerificationEmail as jest.Mock).mockRejectedValueOnce(
      Object.assign(new Error('provider response contains secret data'), { statusCode: 503 }),
    );

    const response = await authService.resendVerification(user.email);

    expect(response.message).toBe(
      'Si la cuenta existe y aún no está verificada, enviaremos un correo de verificación.',
    );
    expect(logEmailDeliveryFailure).toHaveBeenCalledWith(expect.any(Error), 'resend');
  });
});
