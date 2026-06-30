# Tasks

## Task 1: Project Setup and Configuration

- [x] 1.1 Initialise Next.js 14 project with TypeScript, Tailwind CSS, and App Router
- [x] 1.2 Install dependencies: Prisma, shadcn/ui, Framer Motion, Lucide React, qrcode.react
- [x] 1.3 Configure Tailwind with The Ember Grill brand design tokens (amber, charcoal, cream colours, Playfair Display + Inter fonts)
- [x] 1.4 Set up Prisma with SQLite, create the database schema (MenuItem, Order, OrderItem, Customer, Delivery, Reservation, Inventory, DiscountCode, LoyaltyReward)
- [x] 1.5 Run Prisma migrations and create the seed script with mock data (24 menu items, 15 customers, 20 orders, 8 reservations, inventory, discount codes, loyalty rewards)
- [x] 1.6 Create shared TypeScript types file (src/types/index.ts)
- [x] 1.7 Create utility files: lib/db.ts (Prisma client), lib/constants.ts (brand config), lib/utils.ts

## Task 2: API Routes

- [x] 2.1 Create GET /api/menu route returning all menu items with availability status
- [x] 2.2 Create POST /api/orders route to create new orders (handles dine-in, pickup, delivery types)
- [x] 2.3 Create GET /api/orders route with filters (status, order type, date range) for admin
- [x] 2.4 Create PATCH /api/orders/[id]/status route to update order status with validation of allowed transitions
- [x] 2.5 Create POST /api/reservations and GET /api/reservations routes with availability checking
- [x] 2.6 Create GET /api/inventory and PATCH /api/inventory/[id] routes for stock management
- [x] 2.7 Create GET /api/customers and GET /api/customers/[id] routes with search and order history
- [x] 2.8 Create POST /api/discount-codes/validate route for discount code validation
- [x] 2.9 Create GET /api/loyalty/rewards and POST /api/loyalty/redeem routes
- [x] 2.10 Create POST /api/delivery/[orderId]/start and GET /api/delivery/[orderId] routes with mock Stuart logic
- [x] 2.11 Create GET /api/events SSE endpoint for real-time order and delivery updates
- [x] 2.12 Create lib/mock-payment.ts (simulated payment with 1.5s delay, fake transaction IDs)
- [x] 2.13 Create lib/mock-stuart.ts (simulated delivery status progression with accelerated timings)

## Task 3: Shared Components and Hooks

- [x] 3.1 Set up shadcn/ui base components (Button, Card, Input, Dialog, Badge, Tabs, Select, Table, Toast)
- [x] 3.2 Create shared Header component with The Ember Grill logo and navigation
- [x] 3.3 Create shared Footer component with restaurant info (hours, location, contact)
- [x] 3.4 Create Cart context provider and use-cart hook (add, remove, update quantity, calculate totals, session persistence)
- [x] 3.5 Create use-sse hook for subscribing to real-time events from /api/events
- [x] 3.6 Create MenuItemCard component (image, name, price, add-to-cart button, unavailable state)
- [x] 3.7 Create OrderStatusBadge component with colour-coded status indicators
- [x] 3.8 Create CartDrawer component (slide-out cart with item list, quantities, total, checkout button)

## Task 4: Landing Page

- [x] 4.1 Create landing page layout with branded header, hero section (full-width image, tagline, CTA buttons)
- [x] 4.2 Create menu page with category tabs, menu item grid, and add-to-cart functionality
- [x] 4.3 Create menu item detail modal/page with full description, image, and quantity selector
- [x] 4.4 Create "Reserve a Table" page with reservation form (date, time, party size, name, phone) and confirmation
- [x] 4.5 Create checkout page with Order Type selection (Dine-in, Pickup, Delivery), delivery address form, and order summary
- [x] 4.6 Create simulated payment form (card number, expiry, CVC fields) with mock processing
- [x] 4.7 Create order confirmation page with order number, estimated time, and order tracking status
- [x] 4.8 Integrate discount code input at checkout with validation via API

## Task 5: Dine-In QR Code Ordering

- [x] 5.1 Create /dine-in/[tableId] page that extracts table number from URL and displays it prominently
- [x] 5.2 Create dine-in menu view with categories, items, and add-to-cart (reusing menu components)
- [x] 5.3 Create dine-in order submission flow (no payment required for dine-in, order sent directly to kitchen)
- [x] 5.4 Create order confirmation and real-time status tracking view for dine-in customers (using SSE)
- [x] 5.5 Create QR code generator utility/page for admin to generate and print table QR codes

## Task 6: Mobile View (Simulated Native App)

- [x] 6.1 Create mobile layout wrapper with phone-frame styling for desktop demo viewing
- [x] 6.2 Create bottom navigation bar component (Home, Menu, Orders, Profile tabs) with active state
- [x] 6.3 Create mobile Home tab with hero banner, featured items, and quick-order section
- [x] 6.4 Create mobile Menu tab with swipeable category navigation and item cards
- [x] 6.5 Create mobile Orders tab showing order history and active order status with real-time updates
- [x] 6.6 Create mobile Profile tab with customer info, loyalty points balance, and available rewards
- [x] 6.7 Create mobile checkout flow matching landing page flow (Order Type selection, payment, confirmation)
- [x] 6.8 Add push notification placeholder UI (toast-style notifications for order status changes)

## Task 7: Admin Dashboard - Orders and Kitchen

- [x] 7.1 Create admin layout with sidebar navigation (Overview, Orders, Kitchen, Delivery, Reservations, Inventory, Customers, Loyalty, Marketing)
- [x] 7.2 Create admin overview/dashboard page with key metrics (today's orders, revenue, active deliveries, upcoming reservations)
- [x] 7.3 Create orders management page with status-grouped columns (Received, Preparing, Ready, Served/Collected/Delivered), order detail panel, and status update buttons
- [x] 7.4 Create order filtering by date range and order type
- [x] 7.5 Create Kitchen Display page with order cards (item list, quantities, special instructions, order type badge, elapsed time timer)
- [x] 7.6 Implement kitchen order card status progression (mark as Preparing, mark as Ready) with visual transitions
- [x] 7.7 Wire real-time updates via SSE so new orders appear on kitchen and orders pages without refresh

## Task 8: Admin Dashboard - Delivery (Stuart)

- [x] 8.1 Create delivery management page showing all active deliveries with current status and rider info
- [x] 8.2 Create delivery status timeline component showing progression through Stuart statuses
- [x] 8.3 Implement "Start Delivery" button on ready delivery orders that triggers mock Stuart flow
- [x] 8.4 Wire mock Stuart auto-progression (status changes on accelerated timers) with SSE broadcasts
- [x] 8.5 Show delivery status updates on customer-facing pages (landing page order tracking, mobile orders tab)

## Task 9: Admin Dashboard - Reservations and Inventory

- [x] 9.1 Create reservations page with calendar/list view showing all upcoming reservations
- [x] 9.2 Create reservation detail view and status management (confirm, seat, complete, cancel)
- [x] 9.3 Create inventory management page with item list, stock levels, low-stock warnings (amber indicators), and edit functionality
- [x] 9.4 Implement inventory update flow (inline editing of stock quantities)
- [x] 9.5 Wire inventory-to-menu availability (zero stock marks menu item as unavailable across all surfaces)

## Task 10: Admin Dashboard - CRM and Loyalty

- [x] 10.1 Create customers list page with search, sortable columns (name, email, total orders, total spend)
- [x] 10.2 Create customer detail page with profile info, order history timeline, and loyalty points
- [x] 10.3 Implement CSV export functionality for customer list
- [x] 10.4 Create loyalty programme management page (reward tiers list, create/edit reward form)
- [x] 10.5 Wire loyalty points accumulation on order completion (1 point per £1 spent)
- [x] 10.6 Implement reward redemption at checkout (select reward, deduct points, apply discount)

## Task 11: Admin Dashboard - Marketing (Nice-to-Have)

- [x] 11.1 Create marketing dashboard page with campaign history and statistics (static/mock data)
- [x] 11.2 Create discount code management page (list, create, activate/deactivate)
- [x] 11.3 Create email campaign composer UI (segment selection, message editor, preview) — static UI, no actual sending
- [x] 11.4 Create SMS campaign composer UI — static UI, no actual sending

## Task 12: Polish and Demo Readiness

- [x] 12.1 Add Framer Motion page transitions and micro-animations (cart updates, status changes, card appearances)
- [x] 12.2 Add loading states and skeleton screens for all data-fetching pages
- [x] 12.3 Add toast notifications for key actions (order placed, status updated, reservation confirmed)
- [x] 12.4 Verify responsive design across all surfaces (desktop landing, mobile view, admin on tablet/desktop)
- [x] 12.5 Create demo walkthrough script/notes documenting the recommended flow for the video recording
- [x] 12.6 Test full end-to-end flow: place order → appears in kitchen → mark preparing → mark ready → start delivery → delivery completes
