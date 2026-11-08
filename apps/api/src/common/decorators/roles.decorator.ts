import { SetMetadata } from '@nestjs/common';
export type RoleName = 'admin' | 'doctor' | 'patient';
export const ROLES_KEY = 'roles';
/** @Roles('admin') replaces Laravel's `role.admin` middleware. Any listed role is enough. */
export const Roles = (...roles: RoleName[]) => SetMetadata(ROLES_KEY, roles);
