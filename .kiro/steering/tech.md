# Tech Stack

## Core
- **Framework**: Next.js 14 (App Router, React 18)
- **Language**: TypeScript (strict mode)
- **Database**: SQLite via Prisma ORM (better-sqlite3 adapter)
- **Styling**: Tailwind CSS 3 with CSS variables
- **UI Components**: shadcn/ui (base-nova style) + Lucide icons
- **Animation**: Framer Motion
- **Testing**: Vitest + Testing Library (React, jest-dom) + jsdom

## Key Libraries
- `class-variance-authority` + `clsx` + `tailwind-merge` — className composition
- `next-themes` — dark mode support
- `qrcode.react` — QR code generation
- `sonner` — toast notifications
- `tw-animate-css` / `tailwindcss-animate` — animation utilities

## Commands
| Command | Purpose |
|---------|---------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm run test` | Run tests (vitest, single run) |
| `npm run test:watch` | Run tests in watch mode |
| `npx prisma migrate dev` | Run database migrations |
| `npx prisma db seed` | Seed database |
| `npx prisma generate` | Regenerate Prisma client |

## Configuration
- Path alias: `@/*` → `./src/*`
- Prisma client output: `src/generated/prisma`
- Images allowed from `images.unsplash.com` and `plus.unsplash.com`
- ESLint extends `next/core-web-vitals`
