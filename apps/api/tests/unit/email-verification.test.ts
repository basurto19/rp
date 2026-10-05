import { createHash } from 'node:crypto';
import mongoose from 'mongoose';
import { AuthService } from '../../src/modules/auth/services/auth.service';
import { User } from '../../src/modules/users/models/user.model';
import { Company } from '../../src/modules/companies/models/company.model';
import { Role } from '../../src/modules/roles/models/role.model';
import { Token } from '../../src/modules/auth/models/token.model';
import { EmailVerificationToken } from '../../src/modules/auth/models/email-verification-token.model';
import { sendVerificationEmail } from '../../src/modules/auth/services/email.service';
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
}));

function query<T>(value: T) {
  return { exec: jest.fn().mockResolvedValue(value) };
}

function verificationHash(token: string): string {
  return createHash('sha256').update(token).digest('hex');
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
});
