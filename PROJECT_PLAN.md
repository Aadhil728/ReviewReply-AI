# ReviewReply AI MVP Implementation Plan

This checklist follows the phased delivery order in the product brief. A phase is marked complete only after its relevant local verification passes.

## Phase 1 - Foundation

- [x] Initialize the Next.js 16 App Router project with strict TypeScript and pnpm
- [x] Configure Tailwind CSS, shadcn-style primitives, Mona Sans, themes, and design tokens
- [x] Add PostgreSQL with Prisma, environment validation, and core project structure

## Phase 2 - Branding

- [x] Create the original logo mark, text lockup, favicon, and application icon
- [x] Add shared brand, navigation, and theme components

## Phase 3 - Marketing

- [x] Build the responsive landing page, features, workflow, pricing, and footer
- [x] Add privacy and terms placeholders plus SEO metadata, robots, and sitemap

## Phase 4 - Authentication

- [x] Implement self-hosted email/password authentication with secure sessions
- [x] Build registration, login, logout, and route protection
- [x] Add persistent database-backed authentication rate limiting

## Phase 5 - Business Onboarding

- [x] Build and persist the short business-profile onboarding flow
- [x] Ensure returning users are routed according to onboarding state

## Phase 6 - Core Product

- [x] Build the review generator with rating, tone, length, and language controls
- [x] Implement provider-abstracted AI generation, editing, copying, regeneration, and rewrites
- [x] Add validation, friendly errors, server authorization, and generation rate limits

## Phase 7 - History

- [x] Persist generations and generated responses
- [x] Persist manually edited final responses
- [x] Build tenant-safe search and copy actions
- [x] Add focused rating/language/tone/date filters, view, and delete actions

## Phase 8 - Usage

- [x] Implement monthly usage records and server-side plan enforcement
- [x] Show clear usage status in the application shell and usage page

## Phase 9 - Settings

- [x] Build business profile, appearance, and basic account settings
- [x] Persist user-level default response preferences

## Phase 10 - Polish

- [x] Complete the primary responsive, dark-mode, accessibility, loading, empty, and error states
- [ ] Verify touch targets, keyboard flows, focus states, and horizontal overflow

## Phase 11 - Quality

- [ ] Complete integration and end-to-end coverage for authorization, usage concurrency, billing, and installation
- [x] Pass lint, typecheck, unit tests, Prisma validation, migrations, production build, and a clean-schema installation test

## Phase 12 - Documentation

- [x] Complete README, AGENTS.md, environment example, seed data, and architecture notes
- [x] Record locally verified behavior separately from credential-dependent AI validation

## Production and CodeCanyon foundation

- [x] Typed roles, plans, payment providers, subscription states, usage actions, and usage states
- [x] Atomic idempotent usage reservations with failed-provider release and live usage UI updates
- [x] Owner administration for users, plans, provider configuration, branding, and operational overview
- [x] Encrypted secret storage, health checks, structured error references, and production error pages
- [x] Stripe and PayPal adapters, checkout, provider plan synchronization, signed idempotent webhooks, and billing management entry points
- [x] One-time guided installer with environment, database, migration, storage, administrator, branding, and AI setup
- [x] SMTP password recovery, optional installer email setup, and administrator connection testing
- [x] Final-administrator protection, admin audit log, subscription visibility, and retryable webhook operations
- [x] White-label product metadata, marketing attribution, contact details, and legal links
- [x] Agency multi-business profiles with atomic plan-limit enforcement and generator selection
- [x] Dedicated customer upgrade page and administrator-verified manual bank-transfer subscriptions
- [x] CodeCanyon packaging script, production environment template, changelog, support/upgrade notes, and public-ready HTML documentation
- [x] Desktop/mobile Playwright coverage for public, authentication, customer, administrator, installer, branding, and bank-transfer visibility flows
- [x] GitHub Actions Linux pipeline with PostgreSQL migrations, isolated E2E accounts, quality/build gates, Chromium execution, and failure artifacts
- [ ] Verify Stripe test mode and PayPal Sandbox with real buyer credentials
- [ ] Add usage-concurrency and provider-billing integration coverage, Linux clean-install packaging CI, accessibility audit, and multi-viewport visual QA
- [ ] Create and deploy the restricted live demo, scheduled demo reset, preview images, screenshots, and marketplace listing assets
- [ ] Complete dependency security and exact license review immediately before release

## Post-release scope

- Google Business Profile and other review-platform integrations
- Automated review publishing, complex teams, CRM, advanced analytics, yearly billing, enterprise SSO, and mobile apps
