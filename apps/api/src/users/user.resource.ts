import { Prisma } from '@prisma/client';
import { fromDateOnly } from '../common/utils/date.util';

export const userInclude = {
  roles: { include: { role: true }, orderBy: { roleId: 'asc' } },
  doctor: true,
} satisfies Prisma.UserInclude;

export type UserWithRelations = Prisma.UserGetPayload<{ include: typeof userInclude }>;

/** Port of Http/Resources/UserResource (+ DoctorResource). Returned already snake_case. */
export function toUserResource(u: UserWithRelations) {
  const roles = u.roles.map((r) => ({ id: r.role.id, name: r.role.name }));
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    gender: u.gender,
    date_of_birth: fromDateOnly(u.dateOfBirth),
    identity_card: u.identityCard,
    phone: u.phone,
    address: u.address,
    insurance_code: u.insuranceCode,
    avatar_url: u.avatarUrl,
    role: roles[0]?.name ?? 'patient', // main role as a plain string, used by frontend routing
    is_active: u.status === 1,
    two_factor_enabled: !!u.twoFactorSecret && !!u.twoFactorConfirmedAt,
    roles,
    ...(u.doctor
      ? {
          doctor_id: u.doctor.id,
          doctor: { id: u.doctor.id, price: u.doctor.price.toString(), description: u.doctor.biography },
        }
      : {}),
  };
}
