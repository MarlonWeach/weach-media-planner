import { Role } from '@prisma/client';

export type RoleUI = 'ADMIN' | 'MANAGER' | 'COMERCIAL';

export function mapDbRoleToUi(role: Role): RoleUI {
  if (role === Role.EXTERNO) return 'MANAGER';
  if (role === Role.ADMIN) return 'ADMIN';
  return 'COMERCIAL';
}

export function mapUiRoleToDb(role: RoleUI): Role {
  if (role === 'MANAGER') return Role.EXTERNO;
  if (role === 'ADMIN') return Role.ADMIN;
  return Role.COMERCIAL;
}
