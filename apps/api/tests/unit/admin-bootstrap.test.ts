import { User } from '../../src/modules/users/models/user.model';
import { isPrimaryAdminBootstrapComplete } from '../../src/modules/auth/services/admin-bootstrap.service';

describe('primary administrator bootstrap safeguards', () => {
  it('treats a repeat bootstrap for the existing primary account as already complete', () => {
    expect(
      isPrimaryAdminBootstrapComplete({ email: 'OWNER@example.test' }, ' owner@example.test '),
    ).toBe(true);
  });

  it('rejects bootstrap when a different primary administrator already exists', () => {
    expect(() =>
      isPrimaryAdminBootstrapComplete({ email: 'other@example.test' }, 'owner@example.test'),
    ).toThrow(expect.objectContaining({ code: 'DUPLICATE_RESOURCE', statusCode: 409 }));
  });

  it('persists the primary marker with a unique partial database index', () => {
    const primaryAdminIndex = User.schema
      .indexes()
      .find(([keys]) => Object.prototype.hasOwnProperty.call(keys, 'isPrimaryAdmin'));
    expect(primaryAdminIndex).toBeDefined();
    expect(primaryAdminIndex?.[0]).toEqual({ isPrimaryAdmin: 1 });
    expect(primaryAdminIndex?.[1]).toMatchObject({
      unique: true,
      partialFilterExpression: { isPrimaryAdmin: true },
    });
  });

  it('defaults newly created user records to unverified email status', () => {
    expect(User.schema.path('emailVerified').options.default).toBe(false);
    expect(User.schema.path('emailVerifiedAt').options.default).toBeNull();
  });
});
