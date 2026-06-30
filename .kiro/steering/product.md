---
inclusion: always
---

# Product: The Ember Grill

A full-stack restaurant ordering and management platform for "The Ember Grill" — a modern British, wood-fired restaurant in Shoreditch, London.

## Brand Identity

- Name: "The Ember Grill"
- Tagline: "Modern British, Wood-Fired Flavour"
- Location: 47 Ember Lane, Shoreditch, London E1 6AN
- Brand constants are centralized in `src/lib/constants.ts` — always reference them rather than hardcoding values

## Order Types

Three order types are supported: `dine-in`, `pickup`, `delivery`.

- **dine-in**: Requires `tableNumber` (1–12). No loyalty points earned.
- **pickup**: Customer collects from restaurant. Earns loyalty points (1 point per £1 spent).
- **delivery**: Requires a valid `deliveryAddress` within the delivery zone. Earns loyalty points. Creates an associated `Delivery` record.

## Order Status Workflow

```
received → preparing → ready → served (dine-in)
                              → collected (pickup)
                              → out-for-delivery → delivered (delivery)
```

Valid transitions are enforced via `ORDER_STATUS_TRANSITIONS` in constants.

## Delivery Status Workflow

```
pending → rider-assigned → en-route-to-restaurant → collecting → en-route-to-customer → delivered
```

Valid transitions are enforced via `DELIVERY_STATUS_TRANSITIONS` in constants.

## Business Rules

- Restaurant has exactly 12 tables (`TOTAL_TABLES` constant)
- Delivery is restricted to a predefined set of addresses/postcodes (`DELIVERY_ADDRESSES` constant)
- Discount codes can be percentage-based or fixed-amount, with expiry dates and usage limits
- Loyalty points: 1 point per £1 spent (floor), only on pickup and delivery orders
- Loyalty rewards can be redeemed when a customer has enough points
- Inventory tracks stock per menu item with a `lowThreshold` for alerts
- Reservations use a unique reference code and support statuses: `confirmed`, `cancelled`, `completed`

## Mock Services

External integrations are simulated with mock services in `src/lib/`:

- **Payment** (`mock-payment.ts`): Accepts only demo card `4242 4242 4242 4242`, expiry `07/12`, CVC `301`. All other cards are declined. Simulates a 1.5s processing delay.
- **Delivery** (`mock-delivery.ts`): Simulates rider assignment and delivery progress.

When adding new external integrations, follow the same mock-service pattern with simulated delays and deterministic test credentials.

## Real-Time Updates

The app uses Server-Sent Events (SSE) for real-time updates to the kitchen display, order management, and delivery tracking screens. SSE helpers are in `src/lib/events.ts`.

## Customer-Facing Features

- Menu browsing with category filtering
- Shopping cart with discount code validation
- Checkout with mock payment processing
- Table reservations (date, time, party size)
- QR code-based dine-in ordering (scanned at table)
- Mobile ordering interface with customer signup

## Admin Features

- Order management with status progression
- Kitchen display system (real-time via SSE)
- Delivery tracking with rider assignment
- Reservation management
- Inventory management with low-stock alerts
- Customer CRM with loyalty point tracking
- Loyalty rewards program configuration
- Marketing discount code management
- QR code generation for tables

## API Design Conventions

- All API routes return JSON with a top-level resource key (e.g., `{ orders }`, `{ order }`)
- Errors return `{ error: string }` with appropriate HTTP status codes
- Input validation happens at the route handler level before any database calls
- Use `export const dynamic = 'force-dynamic'` on routes that must not be cached
- Order numbers are generated via `generateOrderNumber()` from `src/lib/utils.ts`
- Customer records are upserted by email on order creation
