import { MODULES } from '@erp/constants';

export const PRIMARY_ADMIN_PERMISSIONS = [
  { module: MODULES.USERS, actions: { read: true, create: true, update: true, delete: true } },
  { module: MODULES.COMPANIES, actions: { read: true, create: true, update: true, delete: true } },
  { module: MODULES.BRANCHES, actions: { read: true, create: true, update: true, delete: true } },
  { module: MODULES.ROLES, actions: { read: true, create: true, update: true, delete: true } },
  { module: MODULES.SETTINGS, actions: { read: true, create: true, update: true, delete: true } },
  { module: MODULES.AUDIT, actions: { read: true } },
];

export function copyPrimaryAdminPermissions() {
  return PRIMARY_ADMIN_PERMISSIONS.map((permission) => ({
    ...permission,
    actions: { ...permission.actions },
  }));
}
