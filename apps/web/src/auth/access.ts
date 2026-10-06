import type { SessionUser, Permission } from '../api/client';

export function hasModulePermission(user: SessionUser, module: string, action = 'read'): boolean {
  if (user.roleId !== 'super_admin') return false;
  return (
    user.permissions?.some(
      (permission: Permission) =>
        permission.module === module && permission.actions[action] === true,
    ) ?? false
  );
}

export function guardModule(
  user: SessionUser,
  requestedModule: string,
  moduleIds: ReadonlySet<string>,
): string {
  if (requestedModule === 'dashboard') return 'dashboard';
  if (moduleIds.has(requestedModule) && hasModulePermission(user, requestedModule, 'read')) {
    return requestedModule;
  }
  return 'dashboard';
}

export function passwordInputType(isVisible: boolean): 'text' | 'password' {
  return isVisible ? 'text' : 'password';
}
