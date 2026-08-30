# ReviewReply AI Engineering Guide

## Product

ReviewReply AI is a focused micro-SaaS from Aara Creations. Its essential journey is paste review, choose rating and style, generate, edit, and copy. Preserve that simplicity. Product copy should be specific, calm, and professional.

## Architecture

- Next.js 16 App Router and React Server Components by default
- Client components only for forms and direct interaction
- PostgreSQL via Prisma; all tenant-owned records carry `userId`
- Better Auth email/password sessions with the Prisma adapter
- AI generation behind `src/lib/ai/provider.ts`; prompts live separately in `prompts.ts`
- Zod validation, ownership checks, usage enforcement, and rate limiting run on the server
- Tailwind 4 design tokens are defined in `src/app/globals.css`

Prisma was selected for its strong migration workflow and direct Better Auth fit. The AI provider uses OpenAI-compatible chat completions so base URL and model changes require environment configuration rather than UI changes.

## Conventions

- Keep TypeScript strict and avoid `any`.
- Prefer small domain modules and semantic names over broad utility layers.
- Never trust a client-provided user or business ID; derive ownership from the session.
- Never expose provider errors, stack traces, secrets, or unvalidated input.
- Use Server Components unless browser state, events, or APIs are required.
- Add dependencies only when they remove meaningful maintenance or accessibility risk.

## Brand and UI

The product name is primary; “by Aara Creations” is supporting copy. The original mark is a rounded speech bubble with a small sparkle. Do not use Google branding or imply platform affiliation. Mona Sans is the required primary family, with the declared fallback stack when a licensed local font file is unavailable.

The interface uses neutral surfaces, strategic violet, subtle borders, restrained shadows, generous spacing, and a consistent 12–16px radius. Both themes are intentional. Avoid neon, glassmorphism, giant gradient blobs, fake testimonials, excessive pills, and generic admin-dashboard density.

## Data model

`User` owns `Business`, `ReviewGeneration`, `UsageRecord`, and an optional `Subscription`. Better Auth also uses `Session`, `Account`, and `Verification`. The inactive subscription model is schema-ready only; billing is not implemented. Monthly usage keys use `YYYY-MM`.

## Key directories

- `src/app`: routes and server endpoints
- `src/components/marketing`: public product experience
- `src/components/dashboard`: authenticated product UI
- `src/components/branding` and `src/components/ui`: shared brand and primitives
- `src/lib/ai`: provider abstraction and prompt engineering
- `src/lib/auth.ts`, `db.ts`, `session.ts`, `rate-limit.ts`: server infrastructure
- `prisma`: relational schema and opt-in development seed

## Environment

See `.env.example`. `DATABASE_URL` and `BETTER_AUTH_SECRET` are required for normal operation. `AI_API_KEY`, `AI_BASE_URL`, and `AI_MODEL` enable real generation. The application must show a friendly configuration error when AI credentials are absent.

## Commands

Use pnpm: `pnpm dev`, `pnpm db:migrate`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm build`.

## Implemented MVP

Marketing and legal pages, original branding, authentication, onboarding, protected dashboard, business profile, rating/tone/length/language controls, AI generation and rewrites, editable/copyable output, persisted history, monthly limits, basic in-process rate limiting, usage, settings, responsive UI, themes, SEO, and documentation.

## Intentionally excluded

Google Business Profile and other review integrations, publishing, billing, OAuth, password recovery email, complex teams, agency profiles, advanced analytics, CRM, mobile apps, and browser extensions.

## Roadmap

Later releases may add batch generation, Google Business Profile imports, a review inbox, approval-based auto-reply rules, agency mode, analytics, AI insights, and review-request messages. Do not pre-build these into the MVP. An Aara Creations shared product ecosystem is a future architectural possibility, not a current feature.

## Change discipline

Update `PROJECT_PLAN.md` only after local gates demonstrate completion. Record meaningful architectural decisions here. Distinguish source-complete features from database-, credential-, or provider-dependent live verification.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
