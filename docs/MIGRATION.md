# Laravel → NestJS migration notes

## 1. Architecture mapping

| Laravel | NestJS |
|---|---|
| `routes/api.php` + prefix `/api` | `@Controller()` + `app.setGlobalPrefix('api')` — **URLs unchanged** |
| `auth:sanctum` on route groups | global `JwtAuthGuard`; opt-out with `@Public()` (secure by default) |
| `role.admin` middleware (`CheckAdminRole`) | `@Roles('admin')` + `RolesGuard` (same 403 message) |
| `AppointmentPolicy` (+ `before()` admin bypass) | `AppointmentsService.assertOwner / confirm` (admin bypass kept) |
| FormRequest | DTO + `class-validator`; 422 body is `{success:false,message,errors:{field:[..]}}` like Laravel |
| `Http/Resources/*` | `toUserResource`, `ReviewsService.toResource` + global `ResponseInterceptor` (envelope + camel→snake) |
| Service + Repository + Interface | Service → `PrismaService` (Prisma *is* the repository). Add a repository class only where a query is reused |
| `DB::transaction` | `prisma.$transaction(async tx => …)` |
| SoftDeletes | explicit `deletedAt: null` filters (see §4) |
| Fortify 2FA | `TwoFactorService` (otplib TOTP, same 3 columns, AES-GCM encrypted) |
| Fortify reset password | `forgot-password` / `reset-password` using `password_reset_tokens` + Mailpit |
| Sanctum personal_access_tokens | stateless JWT; user re-loaded each request so disabled/role-changed users lose access immediately |
| Seeders | `prisma/seed.ts` |

## 2. Route map (all kept)

Auth: `POST /auth/login|register|pre-check-doctor`, `GET|PUT /auth/profile`, `POST /auth/logout`, `GET /auth/specialties/:id/doctors`
New: `POST /auth/forgot-password|reset-password`, `POST /auth/2fa/setup|confirm|disable|challenge`
Public: `GET /specialties[/:id]`, `GET /medical-services[/:id]`
Authenticated: `/appointments*`, `/doctor-schedules*`, `/queues*`, `/reviews*`, `GET /schedules`
Admin (`@Roles('admin')`): `/admin/user/*`, `/admin/profile` (apiResource), `/admin/specialties/*`, `/admin/medical-services/*`, `/admin/schedules`, `/admin/doctor-schedules/*`, `/admin/appointments/*`, `/admin/reviews`
New: `GET /admin/roles`, `/medical-records*` (Laravel had the model/table but no controller)

The odd verbs (`POST /admin/specialties/update/:id`, `POST …/destroy/:id`) are preserved so the frontend contract is unchanged. RESTify them in a later pass.

## 3. Login response

`POST /auth/login` → `{success, message, data:{token, user}}`. If the account has 2FA enabled: `data:{two_factor:true, challenge_token}` →
`POST /auth/2fa/challenge {challenge_token, code | recovery_code}` → `{token, user}`.
Send `Authorization: Bearer <token>` afterwards.

## 4. Schema deviations (all marked `// DEVIATION` in schema.prisma)

1. **IDs are `INT`, not `BIGINT UNSIGNED`.** Prisma has no unsigned BigInt; `BigInt` would force `toJSON` hacks. Fine for a clinic; if you point Prisma at an existing Laravel DB, run `prisma db pull`, accept `BigInt`, and add a BigInt serializer.
2. `users.email` nullable (Laravel's registration allowed phone-only users but the column was NOT NULL).
3. `doctors.user_id` unique (needed to model the 1-1 `User.doctor`).
4. `national_medical_records` gained `gender`, `date_of_birth` (Laravel read them from a PHP mock array).
5. Dropped: `sessions`, `cache`, `jobs`, `personal_access_tokens`, `passkeys` (not used with JWT). Add back if you need queues/passkeys.
6. Soft deletes: Prisma has no built-in. Every read filters `deletedAt: null`. Next step if you want it automatic: a `$extends` query extension.

## 5. Behaviour changes vs Laravel (deliberate)

| Change | Why |
|---|---|
| Booking takes `SELECT … FOR UPDATE` on the doctor row | Laravel's check-then-insert could overbook a slot / duplicate queue numbers under concurrency |
| Queue number is **per doctor per day** | Laravel's `generateNextQueueNumber` was per day across all doctors, while "absent → end of queue" was per doctor |
| Queue endpoints check doctor scope | Laravel let any logged-in user read/drive any doctor's queue via `doctor_id` |
| "Today" is computed in `Asia/Ho_Chi_Minh` | server UTC date would be wrong 00:00–07:00 VN time |
| `forceDelete` appointment works on trashed rows | Laravel fetched non-trashed then force-deleted only-trashed (always failed) |
| `queues.started_at` is now set when called | column existed but was never written |

**Left as-is (legacy semantics, worth a product decision):** marking a ticket `absent` cancels the appointment. The UI README describes "push to end, auto-cancel after N absences" — that needs an `absent_count` column.

## 6. Not ported yet / to finish

- **File uploads** (`icon_url` was an uploaded image in Laravel): add `@nestjs/platform-express` `FileInterceptor` + `ServeStaticModule`, or S3. DTOs currently accept a URL string.
- Laravel `Settings/*` (Inertia profile/security pages): covered by `/auth/profile` + `/auth/2fa/*`; password-change and account-delete endpoints still to add.
- Passkeys (table existed, no routes found).
- Verify `UpdateProfileRequest` / `AdminUserRequest` rules against the DTOs (I read the controllers/services, not every rule).
- Tests: none yet — see §8.

## 7. Moving existing data

Fastest path for development: **fresh DB + seed** (this repo). For real data:
1. `mysqldump` the Laravel DB (data only, `--no-create-info --complete-insert`).
2. Create the new DB via `prisma migrate deploy`; import with `SET FOREIGN_KEY_CHECKS=0`.
3. Laravel password hashes (`$2y$`) are verified by `bcryptjs` — users keep their passwords.
4. Old Sanctum tokens stop working; users log in again.
5. Fortify 2FA secrets were encrypted with `APP_KEY`; they can't be read by the new `ENCRYPTION_KEY` → ask 2FA users to re-enroll (or decrypt with PHP once and re-encrypt).

## 8. Suggested order for you to work through

1. `pnpm install && pnpm infra:up && pnpm db:migrate --name init && pnpm db:seed && pnpm dev:api` → open `/api/docs`.
2. Smoke-test in Swagger: login → profile → create schedule slots → doctor registers (`NV-1`/`CCHN-1`) → doctor shift (only Sat/Sun!) → patient books → doctor calls next → done → patient reviews.
3. Switch the frontend login page to `api.ts`; then `patient/booking`, `doctor/queue`, `admin/*`.
4. Add e2e tests (`@nestjs/testing` + supertest) for: booking conflicts, queue absent flow, RBAC 403s.
5. Retire the Laravel app.
