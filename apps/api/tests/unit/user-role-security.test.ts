import { User } from '../../src/modules/users/models/user.model';
import { UserService } from '../../src/modules/users/services/user.service';
import { RoleService } from '../../src/modules/roles/services/role.service';
import { BaseRepository } from '../../src/modules/shared/repositories/base-repository';
import { AppError } from '../../src/modules/shared/errors/app-error';
import { ROLES } from '@erp/constants';

describe('role assignment safeguards', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('creates ordinary users as USER regardless of submitted role or permissions', async () => {
    const create = jest
      .spyOn(BaseRepository.prototype, 'create')
      .mockImplementation(async (data) => data as never);
    jest.spyOn(User, 'findOne').mockReturnValue({
      exec: jest.fn().mockResolvedValue(null),
    } as never);

    const created = await new UserService().create({
      email: 'User@Example.test',
      tenantId: 'tenant-1',
      roleId: ROLES.SUPER_ADMIN,
      isPrimaryAdmin: true,
      permissions: [{ module: '*', actions: { '*': true } }],
    });

    expect(User.findOne).toHaveBeenCalledWith({ email: 'user@example.test' });
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        roleId: ROLES.USER,
        isPrimaryAdmin: false,
        emailVerified: false,
        emailVerifiedAt: null,
      }),
    );
    expect(created).toMatchObject({
      email: 'user@example.test',
      roleId: ROLES.USER,
      isPrimaryAdmin: false,
      emailVerified: false,
    });
  });

  it('rejects attempts to create or assign the primary administrator role through role CRUD', async () => {
    const service = new RoleService();

    await expect(
      service.create({ tenantId: 'tenant-1', roleId: ROLES.SUPER_ADMIN }),
    ).rejects.toMatchObject({ code: 'FORBIDDEN' });
    await expect(
      service.update('role-id', 'tenant-1', { roleId: ROLES.SUPER_ADMIN }),
    ).rejects.toMatchObject({ code: 'FORBIDDEN' });
  });

  it('prevents updates and deletion of the primary administrator account', async () => {
    const service = new UserService();
    jest.spyOn(BaseRepository.prototype, 'findById').mockResolvedValue({
      isPrimaryAdmin: true,
    } as never);

    await expect(
      service.update('primary-id', 'tenant-1', { status: 'locked' }),
    ).rejects.toBeInstanceOf(AppError);
    await expect(service.delete('primary-id', 'tenant-1')).rejects.toMatchObject({
      code: 'FORBIDDEN',
    });
  });
});
