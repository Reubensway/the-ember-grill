# The Ember Grill — Demo Walkthrough Script

A recommended flow for recording the video demo of the restaurant ordering platform.

---

## 1. Landing Page (0:00–0:30)

- Start at `/` — show the hero section with branding, Framer Motion entrance animations
- Highlight the tagline "Modern British, Wood-Fired Flavour"
- Point out the navigation: Menu, Reserve a Table
- Scroll down to show the "Why Dine With Us" section and footer

## 2. Browse the Menu (0:30–1:00)

- Navigate to `/menu`
- Show category tabs (Starters, Mains, Grill, Sides, Desserts, Drinks)
- Click on a menu item to show the detail modal with description and quantity selector
- Add 2–3 items to the cart using the "Add to Cart" button
- Note the toast notifications confirming items added

## 3. Cart Drawer (1:00–1:15)

- Open the cart drawer from the header
- Show items, quantities, and running total
- Adjust a quantity to demonstrate the +/- controls
- Click "Checkout" to proceed

## 4. Checkout Flow (1:15–2:00)

- Show the order summary with item list
- Select "Delivery" as order type — show the address form appearing
- Fill in customer details (name, email, phone)
- Enter discount code **EMBER10** and click Apply — show the 10% discount applied
- Fill in payment card fields (use 4242 4242 4242 4242, any expiry/CVC)
- Click "Pay Now" — show the processing spinner
- Arrive at the confirmation page with order number and real-time tracking

## 5. Order Confirmation & Tracking (2:00–2:15)

- Show the order status progress (Received → Preparing → Ready → Delivered)
- Point out the estimated delivery time
- Note that this updates in real-time via SSE

## 6. Admin Dashboard — Orders (2:15–2:45)

- Navigate to `/admin` — show the overview with today's metrics
- Go to `/admin/orders` — show the new order appearing in the "Received" column
- Click on the order to see details in the side panel
- Show the status update buttons

## 7. Kitchen Display (2:45–3:15)

- Navigate to `/admin/kitchen`
- Show the three-column layout: New Orders, Preparing, Ready
- Click "Start Preparing" on the order — watch it animate to the Preparing column
- Click "Mark Ready" — watch it move to the Ready column
- Note the AnimatePresence transitions and elapsed time timers

## 8. Delivery Flow (3:15–3:45)

- Navigate to `/admin/delivery`
- Click "Start Delivery" on the ready order
- Watch the Stuart simulation progress through statuses:
  - Rider Assigned → En Route to Restaurant → Collecting → En Route to Customer → Delivered
- Show the delivery timeline component updating in real-time
- Switch back to the customer confirmation page to see delivery tracking update

## 9. Dine-In Flow (3:45–4:15)

- Navigate to `/dine-in/5` (simulating scanning a QR code for Table 5)
- Show the branded header with table number
- Browse the menu, add items to the order
- View the order summary (no payment required for dine-in)
- Place the order — show the confirmation and real-time status tracking
- Switch to kitchen to show the dine-in order appearing

## 10. Mobile View (4:15–4:45)

- Navigate to `/mobile` — show the phone frame wrapper on desktop
- Show the bottom navigation (Home, Menu, Orders, Profile)
- Browse the menu tab, add items
- Show the orders tab with order history
- Show the profile tab with loyalty points

## 11. Admin Features Tour (4:45–5:30)

- **CRM** (`/admin/customers`): Show customer list with search, click a customer to see order history and loyalty points
- **Inventory** (`/admin/inventory`): Show stock levels, low-stock warnings (amber indicators)
- **Reservations** (`/admin/reservations`): Show upcoming reservations, status management
- **Loyalty** (`/admin/loyalty`): Show reward tiers and points system
- **Marketing** (`/admin/marketing`): Show campaign dashboard, discount code management, email/SMS composers

## 12. Closing (5:30–5:45)

- Return to the landing page `/`
- Summarise: full-stack restaurant platform with real-time ordering, kitchen management, delivery tracking, CRM, and loyalty — all in one Next.js app

---

## End-to-End Flow Verification

The following critical flow has been verified to work correctly:

1. **Place Order** — Customer places a delivery order via `/checkout`
2. **Appears in Kitchen** — Order immediately shows in `/admin/kitchen` (New Orders column) via SSE
3. **Mark Preparing** — Kitchen staff clicks "Start Preparing" → order moves to Preparing column
4. **Mark Ready** — Kitchen staff clicks "Mark Ready" → order moves to Ready column
5. **Start Delivery** — From `/admin/delivery`, click "Start Delivery" → triggers mock Stuart flow
6. **Delivery Completes** — Stuart simulation auto-progresses through statuses on accelerated timers until "Delivered"

All status transitions broadcast via SSE, so the customer's confirmation page updates in real-time without refresh.

---

## Tips for Recording

- Use a 1920×1080 browser window for consistent framing
- Start `npm run dev` before recording
- Ensure the database is seeded (`npx prisma db seed`) for realistic data
- The mock payment always succeeds — use any card details
- Stuart delivery simulation runs on accelerated timers (seconds instead of minutes)
- Discount code **EMBER10** gives 10% off; **WELCOME5** gives £5 off
