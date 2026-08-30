# ReviewReply AI

**ReviewReply AI by Aara Creations** helps small businesses write natural, context-aware responses to customer reviews in seconds.

## Screenshots

Product screenshots will be added after the first deployed release is visually verified.

## Features

- Rating-aware responses in multiple tones, lengths, and languages
- Business-specific brand voice and wording preferences, with multi-business Agency support
- Editable output, copy, regenerate, and focused rewrite actions
- Searchable response history
- Atomic monthly AI-generation entitlements and persistent rate limiting
- Email/password authentication, SMTP password recovery, protected data, and brief onboarding
- Responsive light and dark themes
- Owner administration, guided installation, encrypted provider settings, and health checks
- Monthly USD subscriptions through Stripe, PayPal, or administrator-approved bank transfer

## Technology

Next.js 16.3, React 19.2, strict TypeScript, Tailwind CSS 4, shadcn-style Radix primitives, Better Auth, Prisma, PostgreSQL, Zod, and an OpenAI-compatible AI provider.

Prisma was chosen over Drizzle because its declarative relational schema, migration workflow, and Better Auth adapter provide a particularly direct fit for this small, conventional SaaS data model. Better Auth keeps authentication self-hostable and provides a first-class Prisma adapter without requiring a proprietary identity service.

## Local setup

1. Install Node.js 22 and pnpm 10.
2. Copy `.env.example` to `.env` and set the database, authentication secret, encryption key, installation token, and application URLs.
3. Create the PostgreSQL database.
4. Run:

```bash
pnpm install
pnpm db:generate
pnpm db:migrate
pnpm dev
```

Open `http://localhost:3000/install` and complete the one-time installer. Stripe and PayPal are optional; manual bank transfer can be enabled without provider credentials from Admin → Configuration.

## Environment variables

| Variable              | Purpose                                                  |
| --------------------- | -------------------------------------------------------- |
| `DATABASE_URL`        | PostgreSQL connection string                             |
| `BETTER_AUTH_SECRET`  | A random authentication secret of at least 32 characters |
| `BETTER_AUTH_URL`     | Canonical Better Auth application URL                    |
| `APP_ENCRYPTION_KEY`  | Secret used to encrypt saved provider credentials        |
| `INSTALLATION_TOKEN`  | Private token required by the one-time installer         |
| `AI_API_KEY`          | Server-only provider key                                 |
| `AI_BASE_URL`         | OpenAI-compatible API base URL                           |
| `AI_MODEL`            | Provider model identifier                                |
| `NEXT_PUBLIC_APP_URL` | Public canonical application URL                         |
| `SMTP_*`              | Optional password-reset email delivery settings          |

No AI secret is exposed to the browser.

## Quality commands

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Browser tests are defined for desktop and mobile Chromium. Install the browser once with `pnpm exec playwright install chromium`, then run `pnpm test:e2e`. Set `E2E_EXTERNAL_SERVER=1` when testing a server you started yourself; optional `E2E_USER_EMAIL` and `E2E_USER_PASSWORD` enable the authenticated smoke test.

## Deployment

The app is suitable for Vercel or any Node.js host with an externally reachable PostgreSQL database. Apply production migrations before starting the deployed application. Business logic is not coupled to Vercel or a specific database host.

## Product boundaries

The product uses manual review entry. It does not connect to Google Business Profile, publish responses, provide complex teams, or include advanced analytics. Google is a trademark of Google LLC; ReviewReply AI is not affiliated with or endorsed by Google.

## License

Proprietary — license terms to be finalized by Aara Creations before distribution.
