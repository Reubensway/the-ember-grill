// Shared TypeScript types for the Restaurant Ordering Platform
// These types mirror Prisma models but are serializable for frontend use

// --- Union Types ---

export type OrderStatus =
  | 'received'
  | 'preparing'
  | 'ready'
  | 'served'
  | 'collected'
  | 'out-for-delivery'
  | 'delivered';

export type OrderType = 'dine-in' | 'pickup' | 'delivery';

export type DeliveryStatus =
  | 'pending'
  | 'rider-assigned'
  | 'en-route-to-restaurant'
  | 'collecting'
  | 'en-route-to-customer'
  | 'delivered';

export type ReservationStatus = 'confirmed' | 'seated' | 'completed' | 'cancelled';

export type DiscountType = 'percentage' | 'fixed';

// --- Model Types ---

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  available: boolean;
  createdAt: string;
}

export interface OrderItem {
  id: string;
  quantity: number;
  unitPrice: number;
  orderId: string;
  menuItemId: string;
  menuItem: MenuItem;
}

export interface Delivery {
  id: string;
  orderId: string;
  riderName: string | null;
  status: DeliveryStatus;
  assignedAt: string | null;
  deliveredAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string | null;
  customerPhone: string | null;
  orderType: OrderType;
  tableNumber: number | null;
  deliveryAddress: string | null;
  status: OrderStatus;
  totalAmount: number;
  discountCode: string | null;
  discountAmount: number;
  specialInstructions: string | null;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
  delivery: Delivery | null;
  customerId: string | null;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  totalOrders: number;
  totalSpend: number;
  loyaltyPoints: number;
  createdAt: string;
  orders: Order[];
}

export interface Reservation {
  id: string;
  reference: string;
  customerName: string;
  phone: string;
  date: string;
  time: string;
  partySize: number;
  tableNumber: number | null;
  status: ReservationStatus;
  createdAt: string;
}

export interface Inventory {
  id: string;
  menuItemId: string;
  menuItem: MenuItem;
  currentStock: number;
  unit: string;
  lowThreshold: number;
  createdAt: string;
  updatedAt: string;
}

export interface DiscountCode {
  id: string;
  code: string;
  type: DiscountType;
  value: number;
  expiryDate: string;
  usageLimit: number;
  usageCount: number;
  active: boolean;
  createdAt: string;
}

export interface LoyaltyReward {
  id: string;
  name: string;
  description: string;
  pointsRequired: number;
  discountValue: number;
  active: boolean;
  createdAt: string;
}

// --- Utility Types ---

export interface CartItem {
  menuItem: MenuItem;
  quantity: number;
}

export interface SSEEvent {
  type: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any;
  timestamp: string;
}
