# Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (landing)/          # Customer-facing pages (grouped route)
│   │   ├── layout.tsx      # Header + Footer + CartProvider
│   │   ├── page.tsx        # Homepage
│   │   ├── menu/           # Menu browsing
│   │   ├── checkout/       # Cart checkout + confirmation
│   │   └── reserve/        # Table reservations
│   ├── admin/              # Admin dashboard (sidebar layout)
│   │   ├── layout.tsx      # Sidebar navigation
│   │   ├── orders/         # Order management
│   │   ├── kitchen/        # Kitchen display
│   │   ├── delivery/       # Delivery tracking
│   │   ├── reservations/   # Reservation management
│   │   ├── inventory/      # Stock management
│   │   ├── customers/      # Customer CRM
│   │   ├── loyalty/        # Loyalty rewards
│   │   ├── marketing/      # Discount codes
│   │   └── qr-codes/       # Table QR codes
│   ├── api/                # API route handlers
│   ├── dine-in/            # QR-based dine-in ordering
│   ├── mobile/             # Mobile ordering interface
│   ├── layout.tsx          # Root layout
│   └── globals.css         # Global styles + Tailwind
├── components/
│   ├── ui/                 # shadcn/ui primitives (button, card, etc.)
│   ├── shared/             # Shared components (Header, Footer)
│   ├── cart/               # Cart-specific components
│   ├── menu/               # Menu-specific components
│   └── mobile/             # Mobile-specific components
├── hooks/                  # Custom React hooks (use-cart, use-sse)
├── lib/                    # Utilities and shared logic
│   ├── constants.ts        # Brand config, status transitions, table count
│   ├── db.ts              # Database helper functions
│   ├── prisma.ts          # Prisma client singleton
│   ├── events.ts          # Server-Sent Events helpers
│   ├── utils.ts           # General utilities (cn, etc.)
│   └── mock-*.ts          # Mock services (payment, delivery)
├── generated/prisma/       # Auto-generated Prisma client
└── types/                  # Shared TypeScript types
prisma/
├── schema.prisma           # Database schema
├── seed.mts                # Database seed script
└── migrations/             # SQL migrations
```

## Conventions
- API routes live alongside their resource in `src/app/api/{resource}/route.ts`
- Tests are co-located with their source files (e.g., `route.test.ts`, `use-cart.test.tsx`)
- Route groups `(landing)` separate customer pages from admin without affecting URL paths
- Client components use `'use client'` directive at the top
- Prisma client is imported from `@/generated/prisma` (not `@prisma/client`)
- Brand constants (name, colors, fonts) are centralized in `src/lib/constants.ts`
