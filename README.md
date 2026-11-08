# e-Clinic Workspace

pnpm monorepo: **NestJS + Prisma + MySQL** API (`apps/api`) and the **Next.js** frontend (`apps/web`).
MySQL, Adminer and Mailpit run in Docker; the two apps run on the host for instant hot-reload.

```
e-clinic-workspace/
├── apps/
│   ├── api/   NestJS 11 · Prisma 6 · JWT · RBAC          → http://localhost:4000/api  (Swagger: /api/docs)
│   └── web/   Next.js 16 (Tailwind Admin e-Clinic UI)    → http://localhost:3000
├── docs/MIGRATION.md   route map, deviations, data-migration, checklist
├── docker-compose.yml  mysql:8.4 (:3307) · adminer (:8080) · mailpit (:8025)
├── pnpm-workspace.yaml
└── .env.example        ONE env file for everything
```

## First run (WSL Ubuntu / macOS / Linux)

```bash
corepack enable                      # gives you pnpm
cp .env.example .env                 # set JWT_SECRET / ENCRYPTION_KEY to real random strings
pnpm install                         # also runs `prisma generate` for the api
pnpm infra:up                        # MySQL + Adminer + Mailpit
pnpm db:migrate --name init          # creates tables from prisma/schema.prisma
pnpm db:seed                         # roles, 8 time-slots, specialties, national registry, admin user
pnpm dev                             # api + web together
```

Login: `admin@eclinic.local` / `Admin@12345` (from `.env`). Doctor registration test codes: `NV-1` / `CCHN-1`.

> MySQL is published on host port **3307** so it never collides with WampServer / a local MySQL on 3306.
> If you run the project from Windows (not WSL), the same commands work in PowerShell after `corepack enable`.

## Everyday commands

| Command | What it does |
|---|---|
| `pnpm dev` / `dev:api` / `dev:web` | run both / one |
| `pnpm db:migrate --name <x>` | create + apply a migration after editing `schema.prisma` |
| `pnpm db:studio` | Prisma Studio (DB browser) |
| `pnpm db:reset` | drop → migrate → seed |
| `pnpm infra:reset` | wipe the MySQL volume and start clean |

## Frontend note

`apps/web` currently reads **mock data** (`src/lib/eclinic/mock-data.ts`). `src/lib/eclinic/api.ts` is the
ready-made client for the new API; switch pages over one by one (start with `/auth/login`).
