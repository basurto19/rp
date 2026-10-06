import {
  guardModule,
  hasModulePermission,
  passwordInputType,
} from '../../../../apps/web/src/auth/access';

const userSession = {
  email: 'user@example.test',
  firstName: 'User',
  lastName: 'Account',
  roleId: 'user',
  tenantId: 'tenant-1',
  permissions: [{ module: 'users', actions: { read: true } }],
};

const adminSession = {
  ...userSession,
  roleId: 'super_admin',
};

describe('web authentication access controls', () => {
  it('does not grant a USER an admin permission even if stale session data contains it', () => {
    expect(hasModulePermission(userSession, 'users')).toBe(false);
  });

  it('grants ADMIN modules only when its session carries the corresponding permission', () => {
    expect(hasModulePermission(adminSession, 'users')).toBe(true);
    expect(hasModulePermission(adminSession, 'settings')).toBe(false);
  });

  it('guards direct requests to a module and falls back to dashboard for USER', () => {
    expect(guardModule(userSession, 'users', new Set(['users']))).toBe('dashboard');
    expect(guardModule(userSession, 'dashboard', new Set(['users']))).toBe('dashboard');
  });

  it('allows ADMIN to open only a known module with read access', () => {
    expect(guardModule(adminSession, 'users', new Set(['users']))).toBe('users');
    expect(guardModule(adminSession, 'settings', new Set(['users']))).toBe('dashboard');
  });

  it('maps each password visibility state to the matching input type', () => {
    expect(passwordInputType(false)).toBe('password');
    expect(passwordInputType(true)).toBe('text');
  });
});
