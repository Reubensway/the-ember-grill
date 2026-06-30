# Implementation Plan

## Technical Overview

A full-stack restaurant ordering platform demo built with Next.js (App Router) for the frontend and API routes, using a local SQLite database (via Prisma) for persistence. The system serves four surfaces from a single codebase: landing page, dine-in page, mobile view, and admin dashboard. Real-time updates use Server-Sent Events (SSE). All data is seeded with mock content. Payment and Stuart delivery are simulated.

## Architecture

### Tech Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Framework | Next.js 14 (App Router) | Single codebase serves all surfaces, SSR for fast loads, API routes for backend |
| Language | TypeScript | Type safety across full stack |
| Styling | Tailwind CSS | Rapid UI development with consistent design tokens |
| Database | SQLite via Prisma | Zero-config local database, perfect for demo |
| State Management | React Context + useReducer | Lightweight, no extra dependencies for cart/order state |
| Real-time | Server-Sent Events (SSE) | Simple real-time updates without WebSocket infrastructure |
| UI Components | shadcn/ui | Pre-built accessible components, customisable with Tailwind |
| Icons | Lucide React | Consistent icon set included with shadcn/ui |
| Animations | Framer Motion | Smooth transitions for demo polish |
| QR Codes | qrcode.react | Generate QR codes for dine-in tables |

### Project Structure

```
/
├── prisma/
│   ├── schema.prisma          # Database schema
│   ├── seed.ts                # Mock data seeding
│   └── migrations/
├── src/
│   ├── app/
│   │   ├── (landing)/         # Landing page route group
│   │   │   ├── page.tsx       # Home/hero page
│   │   │   ├── menu/page.tsx  # Full menu page
│   │   │   ├── reserve/page.tsx # Table reservation
│   │   │   └── checkout/page.tsx # Checkout flow
│   │   ├── dine-in/
│   │   │   └── [tableId]/page.tsx # QR code dine-in ordering
│   │   ├── mobile/            # Mobile view (simulated app)
│   │   │   ├── page.tsx       # Home tab
│   │   │   ├── menu/page.tsx  # Menu tab
│   │   │   ├── orders/page.tsx # Orders tab
│   │   │   └── profile/page.tsx # Profile/loyalty tab
│   │   ├── admin/             # Admin dashboard
│   │   │   ├── page.tsx       # Dashboard overview
│   │   │   ├── orders/page.tsx # Order management
│   │   │   ├── kitchen/page.tsx # Kitchen display
│   │   │   ├── delivery/page.tsx # Stuart delivery tracking
│   │   │   ├── reservations/page.tsx # Table reservations
│   │   │   ├── inventory/page.tsx # Inventory management
│   │   │   ├── customers/page.tsx # CRM
│   │   │   ├── loyalty/page.tsx # Loyalty programme
│   │   │   └── marketing/page.tsx # Marketing (nice-to-have)
│   │   ├── api/
│   │   │   ├── orders/route.ts
│   │   │   ├── menu/route.ts
│   │   │   ├── cart/route.ts
│   │   │   ├── reservations/route.ts
│   │   │   ├── inventory/route.ts
│   │   │   ├── customers/route.ts
│   │   │   ├── loyalty/route.ts
│   │   │   ├── delivery/route.ts
│   │   │   ├── discount-codes/route.ts
│   │   │   └── events/route.ts  # SSE endpoint
│   │   └── layout.tsx
│   ├── components/
│   │   ├── ui/               # shadcn/ui components
│   │   ├── landing/          # Landing page components
│   │   ├── menu/             # Menu display components
│   │   ├── cart/             # Cart components
│   │   ├── checkout/         # Checkout flow components
│   │   ├── dine-in/          # Dine-in specific components
│   │   ├── mobile/           # Mobile view components
│   │   ├── admin/            # Admin dashboard components
│   │   └── shared/           # Shared components (header, footer, etc.)
│   ├── lib/
│   │   ├── db.ts             # Prisma client instance
│   │   ├── mock-payment.ts   # Simulated payment processing
│   │   ├── mock-stuart.ts    # Simulated Stuart delivery
│   │   ├── utils.ts          # Utility functions
│   │   └── constants.ts      # Brand colours, config
│   ├── hooks/
│   │   ├── use-cart.ts       # Cart state management
│   │   ├── use-sse.ts        # SSE connection hook
│   │   └── use-orders.ts     # Order state management
│   └── types/
│       └── index.ts          # Shared TypeScript types
├── public/
│   ├── images/               # Restaurant images, food photos
│   └── logo.svg              # The Ember Grill logo
├── tailwind.config.ts
├── next.config.js
├── package.json
└── tsconfig.json
```

### Database Schema (Prisma)

```prisma
model MenuItem {
  id          String   @id @default(cuid())
  name        String
  description String
  price       Float
  image       String
  category    String
  available   Boolean  @default(true)
  createdAt   DateTime @default(now())
  orderItems  OrderItem[]
  inventory   Inventory?
}

model Order {
  id              String      @id @default(cuid())
  orderNumber     String      @unique
  customerName    String
  customerEmail   String?
  customerPhone   String?
  orderType       String      // dine-in, pickup, delivery
  tableNumber     Int?
  deliveryAddress String?
  status          String      @default("received") // received, preparing, ready, served, collected, out-for-delivery, delivered
  totalAmount     Float
  discountCode    String?
  discountAmount  Float       @default(0)
  specialInstructions String?
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt
  items           OrderItem[]
  delivery        Delivery?
  customer        Customer?   @relation(fields: [customerId], references: [id])
  customerId      String?
}

model OrderItem {
  id         String   @id @default(cuid())
  quantity   Int
  unitPrice  Float
  order      Order    @relation(fields: [orderId], references: [id])
  orderId    String
  menuItem   MenuItem @relation(fields: [menuItemId], references: [id])
  menuItemId String
}

model Customer {
  id          String   @id @default(cuid())
  name        String
  email       String   @unique
  phone       String?
  totalOrders Int      @default(0)
  totalSpend  Float    @default(0)
  loyaltyPoints Int    @default(0)
  createdAt   DateTime @default(now())
  orders      Order[]
}

model Delivery {
  id            String   @id @default(cuid())
  order         Order    @relation(fields: [orderId], references: [id])
  orderId       String   @unique
  riderName     String?
  status        String   @default("pending") // pending, rider-assigned, en-route-to-restaurant, collecting, en-route-to-customer, delivered
  assignedAt    DateTime?
  deliveredAt   DateTime?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

model Reservation {
  id          String   @id @default(cuid())
  reference   String   @unique
  customerName String
  phone       String
  date        DateTime
  time        String
  partySize   Int
  tableNumber Int?
  status      String   @default("confirmed") // confirmed, seated, completed, cancelled
  createdAt   DateTime @default(now())
}

model Inventory {
  id            String   @id @default(cuid())
  menuItem      MenuItem @relation(fields: [menuItemId], references: [id])
  menuItemId    String   @unique
  currentStock  Int
  unit          String
  lowThreshold  Int
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

model DiscountCode {
  id          String   @id @default(cuid())
  code        String   @unique
  type        String   // percentage, fixed
  value       Float
  expiryDate  DateTime
  usageLimit  Int
  usageCount  Int      @default(0)
  active      Boolean  @default(true)
  createdAt   DateTime @default(now())
}

model LoyaltyReward {
  id          String   @id @default(cuid())
  name        String
  description String
  pointsRequired Int
  discountValue Float
  active      Boolean  @default(true)
  createdAt   DateTime @default(now())
}
```

### Brand Design Tokens

```typescript
// The Ember Grill - Brand Constants
export const brand = {
  name: "The Ember Grill",
  tagline: "Modern British, Wood-Fired Flavour",
  colours: {
    amber: "#D97706",        // Primary - warm amber
    amberLight: "#F59E0B",   // Hover states
    charcoal: "#1F2937",     // Text, dark backgrounds
    charcoalLight: "#374151", // Secondary text
    cream: "#FFFBEB",        // Light backgrounds
    creamDark: "#FEF3C7",    // Cards, sections
    white: "#FFFFFF",
    error: "#DC2626",
    success: "#059669",
  },
  fonts: {
    heading: "Playfair Display",  // Serif for headings
    body: "Inter",                // Sans-serif for body
  },
  location: "47 Ember Lane, Shoreditch, London E1 6AN",
  phone: "+44 20 7946 0958",
  hours: "Mon-Thu 12:00-22:00, Fri-Sat 12:00-23:00, Sun 12:00-21:00",
};
```

### Real-Time Architecture (SSE)

```
Customer places order → API creates order in DB → SSE broadcasts "new-order" event
                                                 ↓
                              Kitchen Display receives event → shows new order card
                              Admin Dashboard receives event → updates order list
                              
Staff updates status → API updates DB → SSE broadcasts "order-updated" event
                                       ↓
                        Customer page receives event → updates order status display
                        Kitchen Display receives event → moves card to new column
```

### Simulated Services

**Mock Payment (mock-payment.ts):**
- Accepts any card number, always succeeds after 1.5s delay
- Returns a fake transaction ID
- 10% chance of simulated failure for demo variety (configurable)

**Mock Stuart (mock-stuart.ts):**
- On "Ready" status for delivery orders, auto-progresses through delivery statuses
- Rider Assigned (immediate) → En Route to Restaurant (30s) → Collecting (30s) → En Route to Customer (60s) → Delivered (30s)
- Assigns random rider names from a preset list
- Timings are accelerated for demo purposes

## Correctness Properties

### Property 1: Cart Total Integrity
- **Type**: Invariant
- **Description**: The cart total must always equal the sum of (quantity × unit price) for all items in the cart
- **Relates to**: Requirement 2 (AC 2, 3, 4)

### Property 2: Order Status Progression
- **Type**: State machine invariant
- **Description**: Order status can only progress forward through valid transitions: received → preparing → ready → served/collected/out-for-delivery → delivered. No backward transitions are permitted.
- **Relates to**: Requirement 6 (AC 3), Requirement 7 (AC 3, 4)

### Property 3: Delivery Status Progression
- **Type**: State machine invariant
- **Description**: Delivery status must progress through: pending → rider-assigned → en-route-to-restaurant → collecting → en-route-to-customer → delivered. No skipping or backward transitions.
- **Relates to**: Requirement 8 (AC 1, 2)

### Property 4: Inventory-Menu Consistency
- **Type**: Invariant
- **Description**: When inventory stock reaches zero, the associated menu item must be marked unavailable. When stock is above zero, the item must be available.
- **Relates to**: Requirement 10 (AC 4)

### Property 5: Loyalty Points Calculation
- **Type**: Metamorphic property
- **Description**: Points awarded must equal the floor of the order total in GBP. Multiple orders must accumulate points additively (points after N orders = sum of individual order points).
- **Relates to**: Requirement 12 (AC 1)

### Property 6: Discount Code Application
- **Type**: Invariant
- **Description**: After applying a valid discount code, the final order total must be less than the original total. A percentage discount must reduce by exactly (total × percentage / 100). A fixed discount must reduce by exactly the fixed amount (or to zero if discount exceeds total).
- **Relates to**: Requirement 3 (AC 8)

### Property 7: Cart Item Count Consistency
- **Type**: Invariant
- **Description**: The displayed cart item count must equal the sum of quantities of all items in the cart at all times.
- **Relates to**: Requirement 1 (AC 4), Requirement 2 (AC 1)

### Property 8: Reservation Availability
- **Type**: Error condition
- **Description**: If all tables are reserved for a given time slot, attempting to create a new reservation for that slot must return an unavailability error.
- **Relates to**: Requirement 9 (AC 3)

## API Design

### Key Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/menu | Get all menu items (with availability) |
| GET | /api/menu/[category] | Get menu items by category |
| POST | /api/orders | Create a new order |
| GET | /api/orders | Get all orders (admin, with filters) |
| PATCH | /api/orders/[id]/status | Update order status |
| POST | /api/reservations | Create a reservation |
| GET | /api/reservations | Get all reservations |
| GET | /api/inventory | Get all inventory items |
| PATCH | /api/inventory/[id] | Update inventory stock |
| GET | /api/customers | Get all customers (searchable) |
| GET | /api/customers/[id] | Get customer profile with history |
| POST | /api/discount-codes | Create discount code |
| POST | /api/discount-codes/validate | Validate a discount code |
| GET | /api/loyalty/rewards | Get loyalty rewards |
| POST | /api/loyalty/redeem | Redeem loyalty points |
| POST | /api/delivery/[orderId]/start | Initiate Stuart delivery |
| GET | /api/delivery/[orderId] | Get delivery status |
| GET | /api/events | SSE endpoint for real-time updates |

## Mock Data Seed

The seed script will populate:
- **Menu**: 24 items across 6 categories (Starters, Mains, Grill, Sides, Desserts, Drinks)
- **Customers**: 15 mock customers with order history
- **Orders**: 20 historical orders in various statuses
- **Reservations**: 8 upcoming reservations
- **Inventory**: Stock levels for all menu items
- **Discount Codes**: 3 active codes (EMBER10, FIRSTORDER, LOYALTY20)
- **Loyalty Rewards**: 4 reward tiers (Free Drink at 50pts, Free Starter at 100pts, Free Main at 200pts, Free Meal at 500pts)

## Key Implementation Notes

1. **Single codebase, multiple layouts**: Use Next.js route groups and layout components to serve different UIs from the same app
2. **Mobile view**: Wrap in a phone-frame component for desktop viewing during demo, responsive on actual mobile
3. **QR codes**: Generate QR codes pointing to `/dine-in/[tableId]` — can be printed or shown on screen during demo
4. **SSE for real-time**: Single `/api/events` endpoint with event types for order updates, delivery updates, and kitchen notifications
5. **Demo flow**: Seed data provides a realistic starting state; presenter can place new orders and watch them flow through the system live
6. **No authentication**: Skip auth for demo simplicity — admin pages are accessible directly
