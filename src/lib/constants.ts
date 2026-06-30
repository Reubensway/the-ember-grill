export const brand = {
  name: "The Ember Grill",
  tagline: "Modern British, Wood-Fired Flavour",
  colours: {
    amber: "#CA8A04",
    amberLight: "#EAB308",
    charcoal: "#1F2937",
    charcoalLight: "#374151",
    cream: "#FFFBEB",
    creamDark: "#FEF3C7",
    white: "#FFFFFF",
    error: "#DC2626",
    success: "#059669",
  },
  fonts: {
    heading: "Outfit",
    body: "Plus Jakarta Sans",
  },
  location: "47 Ember Lane, Shoreditch, London E1 6AN",
  phone: "+44 20 7946 0958",
  email: "hello@theembergrill.co.uk",
  hours: "Mon-Thu 12:00-22:00, Fri-Sat 12:00-23:00, Sun 12:00-21:00",
};

// Valid order status transitions
export const ORDER_STATUS_TRANSITIONS: Record<string, string[]> = {
  received: ['preparing'],
  preparing: ['ready'],
  ready: ['served', 'collected', 'out-for-delivery'],
  'out-for-delivery': ['delivered'],
};

// Valid delivery status transitions
export const DELIVERY_STATUS_TRANSITIONS: Record<string, string[]> = {
  pending: ['rider-assigned'],
  'rider-assigned': ['en-route-to-restaurant'],
  'en-route-to-restaurant': ['collecting'],
  collecting: ['en-route-to-customer'],
  'en-route-to-customer': ['delivered'],
};

// Total number of tables in the restaurant
export const TOTAL_TABLES = 12;

// Delivery addresses for demo/testing
export const RESTAURANT_ADDRESS = '47 Ember Lane, Shoreditch, London E1 6AN';

export const DELIVERY_ADDRESSES = [
  { label: '12 Camden High Street, Camden Town', full: '12 Camden High Street, Camden Town, London NW1 0JH', postcode: 'NW1 0JH' },
  { label: '85 Brixton Road, Brixton', full: '85 Brixton Road, Brixton, London SW9 6LH', postcode: 'SW9 6LH' },
  { label: '34 Greenwich High Road, Greenwich', full: '34 Greenwich High Road, Greenwich, London SE10 8JL', postcode: 'SE10 8JL' },
];
