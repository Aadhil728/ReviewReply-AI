# Third-party license inventory

The application uses open-source packages distributed under their respective licenses. The release owner must run the package-manager license audit before every marketplace upload and retain the exact generated inventory with the release artifact.

Core packages include Next.js, React, Prisma, Better Auth, Zod, Tailwind CSS, Radix UI, Lucide, Sonner, React Hook Form, and Mona Sans assets from Fontsource. Their copyright notices and license texts remain in the installed packages. No Google assets, trademarks, or platform branding are included.

Run `pnpm licenses list --prod --json` (or an equivalent approved license scanner) from the locked dependency tree and review all non-permissive or unknown results before distribution.
