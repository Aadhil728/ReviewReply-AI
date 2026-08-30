# Upgrade guide

1. Back up the PostgreSQL database and uploaded branding assets.
2. Put the application into maintenance mode at the hosting layer.
3. Replace source files while retaining the server-managed environment values.
4. Run `pnpm install --frozen-lockfile`, `pnpm db:generate`, and `pnpm exec prisma migrate deploy`.
5. Run `pnpm build`, restart the application, and check `/api/health`.
6. Verify login, generation, history, admin access, and test-mode billing webhooks before removing maintenance mode.

Never edit an existing migration after it has been applied. New releases add forward-only migrations.
