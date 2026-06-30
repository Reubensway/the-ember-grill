# Requirements Document

## Introduction

A restaurant ordering platform built as a video demo for a UK client presentation. The system demonstrates a complete multi-surface digital ordering and management solution for "The Ember Grill" — a modern British restaurant brand. The platform includes a branded landing page, dine-in QR-code ordering, a mobile-view web page (simulating a native app), and an admin dashboard with kitchen management, order tracking, delivery via Stuart, and CRM capabilities.

All data is mocked for demonstration purposes. Payment flows are simulated. Stuart delivery integration shows order handoff and status updates (not live API calls).

### Demo Priority

- **Must Demo**: Landing page, menu/cart, checkout, dine-in QR ordering, mobile view, kitchen display, order management, table reservations, inventory management, CRM, loyalty programme, delivery system
- **Nice-to-Have**: Marketing and engagement tools (static UI screens acceptable)

## Glossary

- **Landing_Page**: The branded restaurant website serving as the primary customer-facing entry point for online ordering
- **Dine_In_Page**: A web page accessed via QR code at restaurant tables, enabling in-house customers to browse the menu and place orders without staff interaction
- **Mobile_View**: A responsive web page styled to simulate a native mobile application for demonstration purposes
- **Admin_Dashboard**: The centralised management interface for restaurant staff to manage orders, kitchen operations, inventory, reservations, and customer data
- **Kitchen_Display**: A section within the Admin_Dashboard showing incoming orders in real time for kitchen staff to process
- **Order**: A customer request containing one or more menu items, with an order type of dine-in, pickup, or delivery
- **Order_Type**: The fulfilment method selected by the customer: dine-in, pickup, or delivery
- **Menu_Item**: A food or beverage product available for ordering, with name, description, price, image, and category
- **Cart**: A temporary collection of Menu_Items selected by a customer before order submission
- **Payment_Gateway**: A simulated payment processing flow mimicking Stripe or Paystack for demo purposes (mock data, no live transactions)
- **Stuart_Integration**: The delivery management system handling rider assignment and delivery status tracking via Stuart (simulated for demo)
- **Rider**: A Stuart delivery driver assigned to fulfil a delivery order
- **CRM**: Customer Relationship Management system capturing customer name, email, phone, and order history
- **Loyalty_Programme**: A rewards system awarding points or discounts based on customer order history
- **Table_Reservation**: A booking of a specific table for a future date and time
- **QR_Code**: A scannable code placed on restaurant tables linking to the Dine_In_Page
- **Order_Status**: The current state of an order (Received, Preparing, Ready, Served/Collected/Out for Delivery/Delivered)
- **Delivery_Status**: The current state of a delivery (Rider Assigned, Rider En Route to Restaurant, Rider Collecting, Rider En Route to Customer, Delivered)
- **Inventory**: The stock levels of ingredients and menu items tracked by the system
- **Discount_Code**: A promotional code applied at checkout to reduce order total
- **The_Ember_Grill**: The fictional restaurant brand used for the demo — a modern British restaurant with warm amber/charcoal branding

## Requirements

### Requirement 1: Restaurant Landing Page

**User Story:** As a customer, I want to visit a branded restaurant website, so that I can browse the menu and place an online order.

#### Acceptance Criteria

1. WHEN a customer navigates to the Landing_Page URL, THE Landing_Page SHALL display The_Ember_Grill brand name, logo, hero image, and navigation menu within 2 seconds
2. WHEN a customer selects "View Menu" on the Landing_Page, THE Landing_Page SHALL display all available Menu_Items grouped by category
3. WHEN a customer selects a Menu_Item, THE Landing_Page SHALL display the item name, description, price, and image in a detail view
4. WHEN a customer adds a Menu_Item to the Cart, THE Landing_Page SHALL update the Cart icon with the current item count
5. THE Landing_Page SHALL display the restaurant operating hours, location (London, UK), and contact information in a footer section
6. THE Landing_Page SHALL use The_Ember_Grill brand colours (warm amber, charcoal, cream) consistently across all elements

### Requirement 2: Menu Browsing and Cart Management

**User Story:** As a customer, I want to add items to my cart and review my selections, so that I can place a complete order.

#### Acceptance Criteria

1. WHEN a customer adds a Menu_Item to the Cart, THE Cart SHALL store the item name, quantity, unit price, and subtotal
2. WHEN a customer increases or decreases the quantity of a Cart item, THE Cart SHALL recalculate the item subtotal and Cart total
3. WHEN a customer removes a Menu_Item from the Cart, THE Cart SHALL remove the item and recalculate the Cart total
4. WHEN the Cart contains one or more items, THE Cart SHALL display the total price including all items in GBP (£)
5. IF the Cart is empty and the customer selects "Checkout", THEN THE Landing_Page SHALL display a message indicating the Cart is empty
6. THE Cart SHALL persist items during the customer's browser session

### Requirement 3: Checkout and Payment

**User Story:** As a customer, I want to select my order type and pay for my order, so that I can complete my purchase.

#### Acceptance Criteria

1. WHEN a customer selects "Checkout" with items in the Cart, THE Landing_Page SHALL display an Order_Type selection with options: Dine-in, Pickup, and Delivery
2. WHEN a customer selects "Delivery" as the Order_Type, THE Landing_Page SHALL display a delivery address form with UK address fields
3. WHEN a customer selects "Pickup" as the Order_Type, THE Landing_Page SHALL display the estimated pickup time
4. WHEN a customer selects "Dine-in" as the Order_Type, THE Landing_Page SHALL request the table number
5. WHEN a customer confirms the order details, THE Payment_Gateway SHALL present a simulated secure payment form
6. WHEN the Payment_Gateway confirms a successful payment (simulated), THE Landing_Page SHALL display an order confirmation with a unique order number
7. IF the Payment_Gateway returns a payment failure (simulated), THEN THE Landing_Page SHALL display an error message and allow the customer to retry payment
8. WHEN a Discount_Code is applied at checkout, THE Landing_Page SHALL validate the code and reduce the order total by the discount amount

### Requirement 4: Dine-In QR Code Ordering

**User Story:** As a dine-in customer, I want to scan a QR code at my table and order from my phone, so that I can order without waiting for staff.

#### Acceptance Criteria

1. WHEN a customer scans a QR_Code at a table, THE Dine_In_Page SHALL open in the customer's browser with the table number pre-populated
2. WHEN the Dine_In_Page loads, THE Dine_In_Page SHALL display the full menu with categories, item names, descriptions, prices, and images
3. WHEN a dine-in customer submits an order, THE Dine_In_Page SHALL send the order to the Kitchen_Display with the associated table number
4. WHEN a dine-in order is submitted successfully, THE Dine_In_Page SHALL display a confirmation message with the estimated preparation time
5. WHILE a dine-in order is being prepared, THE Dine_In_Page SHALL display the current Order_Status updated in real time

### Requirement 5: Mobile View (Simulated Native App)

**User Story:** As a mobile customer, I want to use a mobile-optimised ordering experience, so that I can order from my phone as if using a native app.

#### Acceptance Criteria

1. THE Mobile_View SHALL render all pages in a mobile-first layout optimised for screens 375px to 428px wide
2. WHEN a customer opens the Mobile_View, THE Mobile_View SHALL display a bottom navigation bar with Home, Menu, Orders, and Profile tabs
3. WHEN a customer browses the menu on the Mobile_View, THE Mobile_View SHALL support swipe gestures for navigating between menu categories
4. WHEN a customer places an order via the Mobile_View, THE Mobile_View SHALL follow the same Cart and checkout flow as the Landing_Page including Order_Type selection
5. THE Mobile_View SHALL display push notification placeholders for order status updates
6. THE Mobile_View SHALL use The_Ember_Grill brand colours and display the restaurant logo in the header

### Requirement 6: Admin Dashboard - Order Management

**User Story:** As a restaurant manager, I want to view and manage all incoming orders in real time, so that I can ensure timely fulfilment.

#### Acceptance Criteria

1. WHEN a new Order is placed from any surface (Landing_Page, Dine_In_Page, or Mobile_View), THE Admin_Dashboard SHALL display the order in the orders list within 3 seconds
2. WHEN a staff member selects an Order, THE Admin_Dashboard SHALL display the full order details including items, quantities, customer name, Order_Type, and table number (if dine-in)
3. WHEN a staff member updates the Order_Status, THE Admin_Dashboard SHALL persist the new status and notify the customer-facing surface in real time
4. THE Admin_Dashboard SHALL display orders grouped by status: Received, Preparing, Ready, and Served/Collected/Delivered
5. WHEN a staff member filters orders by date range or Order_Type, THE Admin_Dashboard SHALL display only matching orders

### Requirement 7: Admin Dashboard - Kitchen Display

**User Story:** As a kitchen staff member, I want to see incoming orders on a dedicated display, so that I can prepare meals in the correct sequence.

#### Acceptance Criteria

1. WHEN a new Order with status "Received" is created, THE Kitchen_Display SHALL show the order as a card with item list, quantities, special instructions, Order_Type, and order time
2. THE Kitchen_Display SHALL arrange order cards in chronological order with the oldest order displayed first
3. WHEN a kitchen staff member marks an order as "Preparing", THE Kitchen_Display SHALL visually distinguish the order from unstarted orders
4. WHEN a kitchen staff member marks an order as "Ready", THE Kitchen_Display SHALL move the order card to a "Ready" section
5. THE Kitchen_Display SHALL display the elapsed time since each order was received
6. WHEN an order has Order_Type "Delivery", THE Kitchen_Display SHALL display a delivery badge on the order card

### Requirement 8: Delivery via Stuart

**User Story:** As a restaurant manager, I want delivery orders to be handed off to Stuart riders, so that customers receive their food without the restaurant managing its own drivers.

#### Acceptance Criteria

1. WHEN a staff member marks a delivery order as "Ready", THE Stuart_Integration SHALL create a delivery job and display "Rider Assigned" Delivery_Status
2. WHILE a delivery is in progress, THE Admin_Dashboard SHALL display the current Delivery_Status (Rider Assigned, Rider En Route to Restaurant, Rider Collecting, Rider En Route to Customer, Delivered)
3. WHEN the Delivery_Status changes, THE Admin_Dashboard SHALL update the order record with the new status in real time
4. WHEN the Delivery_Status changes, THE Landing_Page or Mobile_View SHALL display the updated Delivery_Status to the customer
5. WHEN a delivery is marked as "Delivered", THE Admin_Dashboard SHALL update the Order_Status to "Delivered" and record the delivery completion time
6. THE Admin_Dashboard SHALL display a delivery orders section showing all active deliveries with their current Delivery_Status and Rider information (simulated name)

### Requirement 9: Table Reservations

**User Story:** As a customer, I want to reserve a table online, so that I can guarantee seating when I arrive.

#### Acceptance Criteria

1. WHEN a customer selects "Reserve a Table" on the Landing_Page, THE Landing_Page SHALL display a reservation form with fields for date, time, party size, name, and phone number
2. WHEN a customer submits a valid reservation, THE Landing_Page SHALL confirm the reservation with a reference number
3. IF a customer requests a reservation for a time slot with no available tables, THEN THE Landing_Page SHALL display a message indicating unavailability and suggest alternative times
4. WHEN a new Table_Reservation is created, THE Admin_Dashboard SHALL display the reservation in the reservations calendar view
5. WHEN a staff member views the reservations list, THE Admin_Dashboard SHALL display all upcoming reservations sorted by date and time

### Requirement 10: Inventory Management

**User Story:** As a restaurant manager, I want to track ingredient and item stock levels, so that I can avoid selling unavailable items.

#### Acceptance Criteria

1. THE Admin_Dashboard SHALL display a list of all Inventory items with current stock level, unit, and low-stock threshold
2. WHEN an Inventory item stock level falls below the low-stock threshold, THE Admin_Dashboard SHALL display a visual warning indicator next to the item
3. WHEN a staff member updates an Inventory item quantity, THE Admin_Dashboard SHALL persist the new quantity immediately
4. IF an Inventory item reaches zero stock, THEN THE Landing_Page SHALL mark the associated Menu_Item as "Unavailable" and prevent customers from adding the item to the Cart
5. WHEN a staff member adds a new Inventory item, THE Admin_Dashboard SHALL store the item name, unit, current quantity, and low-stock threshold

### Requirement 11: Customer CRM

**User Story:** As a restaurant owner, I want to capture and store customer data, so that I can build direct relationships and eliminate reliance on third-party platforms.

#### Acceptance Criteria

1. WHEN a customer completes an order, THE CRM SHALL store the customer name, email, phone number, and order details
2. WHEN a staff member views a customer profile in the Admin_Dashboard, THE Admin_Dashboard SHALL display the customer name, contact details, total orders, total spend (in GBP), and order history
3. THE Admin_Dashboard SHALL display a searchable list of all customers with name, email, and total orders
4. WHEN a staff member exports the customer list, THE Admin_Dashboard SHALL generate a CSV file containing all customer records
5. WHEN a new customer places a first order, THE CRM SHALL create a new customer profile automatically

### Requirement 12: Loyalty and Rewards Programme

**User Story:** As a customer, I want to earn rewards for my orders, so that I am incentivised to return.

#### Acceptance Criteria

1. WHEN a customer completes an order, THE Loyalty_Programme SHALL award points based on the order total (1 point per £1 spent)
2. WHEN a customer views the profile section, THE Mobile_View SHALL display the current loyalty points balance and available rewards
3. WHEN a customer redeems a reward at checkout, THE Loyalty_Programme SHALL deduct the required points and apply the reward discount to the order total
4. THE Admin_Dashboard SHALL display a list of all loyalty rewards with point thresholds and descriptions
5. WHEN a staff member creates a new reward tier, THE Admin_Dashboard SHALL store the reward name, point threshold, and discount value

### Requirement 13: Marketing and Engagement Tools (Nice-to-Have)

**User Story:** As a restaurant owner, I want to send promotions and campaigns to customers, so that I can drive repeat business.

#### Acceptance Criteria

1. WHEN a staff member creates a Discount_Code in the Admin_Dashboard, THE Admin_Dashboard SHALL store the code, discount percentage or fixed amount, expiry date, and usage limit
2. WHEN a staff member initiates an email campaign, THE Admin_Dashboard SHALL allow selection of customer segments and display a preview before sending
3. THE Admin_Dashboard SHALL display a list of all active and expired Discount_Codes with usage statistics
4. WHEN a staff member creates an SMS campaign, THE Admin_Dashboard SHALL allow message composition and customer segment selection
5. THE Admin_Dashboard SHALL display a marketing dashboard showing campaign history, open rates, and redemption counts

> **Note:** This requirement is marked as nice-to-have for the demo. Static UI screens showing the marketing interface are acceptable without full backend wiring.
