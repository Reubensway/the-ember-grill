import 'dotenv/config';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client.js';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  // Clear existing data
  await prisma.orderItem.deleteMany();
  await prisma.delivery.deleteMany();
  await prisma.order.deleteMany();
  await prisma.inventory.deleteMany();
  await prisma.menuItem.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.reservation.deleteMany();
  await prisma.discountCode.deleteMany();
  await prisma.loyaltyReward.deleteMany();

  // ─── Menu Items (24 items across 6 categories) ───────────────────────────────

  const menuItems = await Promise.all([
    // Starters
    prisma.menuItem.create({
      data: {
        name: 'Scotch Egg',
        description: 'Free-range egg wrapped in herbed sausage meat with a crispy breadcrumb coating, served with piccalilli',
        price: 8.50,
        image: 'https://images.unsplash.com/photo-1620074329885-2053dfa84d68?w=400&h=300&fit=crop',
        category: 'Starters',
      },
    }),
    prisma.menuItem.create({
      data: {
        name: 'Soup of the Day',
        description: 'Chef\'s daily selection served with warm sourdough bread and salted butter',
        price: 7.95,
        image: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400&h=300&fit=crop',
        category: 'Starters',
      },
    }),
    prisma.menuItem.create({
      data: {
        name: 'Prawn Cocktail',
        description: 'Atlantic prawns on a bed of crisp lettuce with Marie Rose sauce and brown bread',
        price: 11.50,
        image: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&h=300&fit=crop',
        category: 'Starters',
      },
    }),
    prisma.menuItem.create({
      data: {
        name: 'Burrata & Heritage Tomatoes',
        description: 'Creamy burrata with vine-ripened heritage tomatoes, basil oil and aged balsamic',
        price: 13.95,
        image: 'https://images.unsplash.com/photo-1608897013039-887f21d8c804?w=400&h=300&fit=crop',
        category: 'Starters',
      },
    }),
    // Mains
    prisma.menuItem.create({
      data: {
        name: 'Fish & Chips',
        description: 'Beer-battered North Sea cod with triple-cooked chips, mushy peas and tartare sauce',
        price: 16.95,
        image: 'https://images.unsplash.com/photo-1579208030886-b1f5b0928671?w=400&h=300&fit=crop',
        category: 'Mains',
      },
    }),
    prisma.menuItem.create({
      data: {
        name: 'Beef Wellington',
        description: 'Prime beef fillet wrapped in mushroom duxelles and golden puff pastry with red wine jus',
        price: 28.00,
        image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400&h=300&fit=crop',
        category: 'Mains',
      },
    }),
    prisma.menuItem.create({
      data: {
        name: 'Pan-Seared Sea Bass',
        description: 'Fillets of sea bass with crushed new potatoes, samphire and lemon butter sauce',
        price: 22.50,
        image: 'https://images.unsplash.com/photo-1580476262798-bddd9f4b7369?w=400&h=300&fit=crop',
        category: 'Mains',
      },
    }),
    prisma.menuItem.create({
      data: {
        name: 'Wild Mushroom Risotto',
        description: 'Arborio rice with foraged wild mushrooms, truffle oil and aged Parmesan',
        price: 17.50,
        image: 'https://images.unsplash.com/photo-1476124369491-e7addf5db371?w=400',
        category: 'Mains',
      },
    }),
    // Grill
    prisma.menuItem.create({
      data: {
        name: '8oz Ribeye Steak',
        description: '28-day dry-aged ribeye with roasted vine tomatoes, field mushroom and peppercorn sauce',
        price: 32.00,
        image: 'https://images.unsplash.com/photo-1558030006-450675393462?w=400',
        category: 'Grill',
      },
    }),
    prisma.menuItem.create({
      data: {
        name: '10oz Sirloin',
        description: '28-day dry-aged sirloin with hand-cut chips, onion rings and béarnaise sauce',
        price: 28.50,
        image: 'https://images.unsplash.com/photo-1600891964092-4316c288032e?w=400',
        category: 'Grill',
      },
    }),
    prisma.menuItem.create({
      data: {
        name: 'Lamb Cutlets',
        description: 'Herb-crusted lamb cutlets with dauphinoise potatoes, minted pea purée and rosemary jus',
        price: 26.00,
        image: 'https://images.unsplash.com/photo-1514516345957-556ca7d90a29?w=400',
        category: 'Grill',
      },
    }),
    prisma.menuItem.create({
      data: {
        name: 'Spatchcock Chicken',
        description: 'Whole spatchcock chicken marinated in lemon and herbs, served with skinny fries and coleslaw',
        price: 18.95,
        image: 'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=400',
        category: 'Grill',
      },
    }),
    // Sides
    prisma.menuItem.create({
      data: {
        name: 'Triple-Cooked Chips',
        description: 'Crispy hand-cut chips cooked three times for the perfect crunch',
        price: 5.50,
        image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400',
        category: 'Sides',
      },
    }),
    prisma.menuItem.create({
      data: {
        name: 'Truffle Mac & Cheese',
        description: 'Creamy macaroni cheese with black truffle and a golden breadcrumb topping',
        price: 7.50,
        image: 'https://images.unsplash.com/photo-1543339494-b4cd4f7ba686?w=400',
        category: 'Sides',
      },
    }),
    prisma.menuItem.create({
      data: {
        name: 'Seasonal Greens',
        description: 'Tenderstem broccoli and sugar snap peas with garlic butter',
        price: 5.95,
        image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400',
        category: 'Sides',
      },
    }),
    prisma.menuItem.create({
      data: {
        name: 'Roasted Root Vegetables',
        description: 'Honey-glazed carrots, parsnips and beetroot with fresh thyme',
        price: 6.50,
        image: 'https://images.unsplash.com/photo-1606923829579-0cb981a83e2e?w=400',
        category: 'Sides',
      },
    }),
    // Desserts
    prisma.menuItem.create({
      data: {
        name: 'Sticky Toffee Pudding',
        description: 'Warm date sponge with butterscotch sauce and clotted cream',
        price: 9.50,
        image: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=400',
        category: 'Desserts',
      },
    }),
    prisma.menuItem.create({
      data: {
        name: 'Chocolate Fondant',
        description: 'Rich dark chocolate fondant with a molten centre, served with vanilla ice cream',
        price: 10.95,
        image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=400',
        category: 'Desserts',
      },
    }),
    prisma.menuItem.create({
      data: {
        name: 'Eton Mess',
        description: 'Crushed meringue with fresh strawberries, whipped cream and raspberry coulis',
        price: 8.95,
        image: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400',
        category: 'Desserts',
      },
    }),
    prisma.menuItem.create({
      data: {
        name: 'Cheese Board',
        description: 'Selection of British artisan cheeses with crackers, chutney and grapes',
        price: 11.50,
        image: 'https://images.unsplash.com/photo-1452195100486-9cc805987862?w=400',
        category: 'Desserts',
      },
    }),
    // Drinks
    prisma.menuItem.create({
      data: {
        name: 'Craft Lager',
        description: 'Locally brewed craft lager, crisp and refreshing (330ml)',
        price: 5.50,
        image: 'https://images.unsplash.com/photo-1535958636474-b021ee887b13?w=400',
        category: 'Drinks',
      },
    }),
    prisma.menuItem.create({
      data: {
        name: 'House Red Wine',
        description: 'Malbec from Mendoza, Argentina - rich and full-bodied (175ml)',
        price: 7.50,
        image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=400',
        category: 'Drinks',
      },
    }),
    prisma.menuItem.create({
      data: {
        name: 'Espresso Martini',
        description: 'Vodka, fresh espresso, coffee liqueur and vanilla syrup',
        price: 11.50,
        image: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=400',
        category: 'Drinks',
      },
    }),
    prisma.menuItem.create({
      data: {
        name: 'Sparkling Water',
        description: 'San Pellegrino sparkling mineral water (750ml)',
        price: 4.25,
        image: 'https://images.unsplash.com/photo-1559839914-17aae19cec71?w=400',
        category: 'Drinks',
      },
    }),
  ]);

  console.log(`✓ Created ${menuItems.length} menu items`);


  // ─── Customers (15) ───────────────────────────────────────────────────────────

  const customers = await Promise.all([
    prisma.customer.create({
      data: { name: 'Oliver Thompson', email: 'oliver.thompson@gmail.co.uk', phone: '+447911234567', totalOrders: 12, totalSpend: 456.80, loyaltyPoints: 95 },
    }),
    prisma.customer.create({
      data: { name: 'Charlotte Davies', email: 'charlotte.davies@hotmail.co.uk', phone: '+447922345678', totalOrders: 8, totalSpend: 312.50, loyaltyPoints: 65 },
    }),
    prisma.customer.create({
      data: { name: 'James Wilson', email: 'james.wilson@outlook.co.uk', phone: '+447933456789', totalOrders: 25, totalSpend: 789.20, loyaltyPoints: 200 },
    }),
    prisma.customer.create({
      data: { name: 'Amelia Brown', email: 'amelia.brown@yahoo.co.uk', phone: '+447944567890', totalOrders: 3, totalSpend: 87.50, loyaltyPoints: 20 },
    }),
    prisma.customer.create({
      data: { name: 'Harry Evans', email: 'harry.evans@gmail.co.uk', phone: '+447955678901', totalOrders: 15, totalSpend: 623.40, loyaltyPoints: 145 },
    }),
    prisma.customer.create({
      data: { name: 'Isla Mitchell', email: 'isla.mitchell@btinternet.com', phone: '+447966789012', totalOrders: 1, totalSpend: 42.50, loyaltyPoints: 10 },
    }),
    prisma.customer.create({
      data: { name: 'George Taylor', email: 'george.taylor@gmail.co.uk', phone: '+447977890123', totalOrders: 19, totalSpend: 734.60, loyaltyPoints: 180 },
    }),
    prisma.customer.create({
      data: { name: 'Sophie Clark', email: 'sophie.clark@hotmail.co.uk', phone: '+447988901234', totalOrders: 6, totalSpend: 198.75, loyaltyPoints: 45 },
    }),
    prisma.customer.create({
      data: { name: 'William Harris', email: 'william.harris@outlook.co.uk', phone: '+447911012345', totalOrders: 22, totalSpend: 678.90, loyaltyPoints: 165 },
    }),
    prisma.customer.create({
      data: { name: 'Emily Robinson', email: 'emily.robinson@gmail.co.uk', phone: '+447922123456', totalOrders: 4, totalSpend: 156.30, loyaltyPoints: 35 },
    }),
    prisma.customer.create({
      data: { name: 'Thomas Wright', email: 'thomas.wright@yahoo.co.uk', phone: '+447933234567', totalOrders: 10, totalSpend: 445.20, loyaltyPoints: 85 },
    }),
    prisma.customer.create({
      data: { name: 'Poppy Walker', email: 'poppy.walker@gmail.co.uk', phone: '+447944345678', totalOrders: 2, totalSpend: 65.00, loyaltyPoints: 15 },
    }),
    prisma.customer.create({
      data: { name: 'Jack Anderson', email: 'jack.anderson@hotmail.co.uk', phone: '+447955456789', totalOrders: 17, totalSpend: 567.80, loyaltyPoints: 130 },
    }),
    prisma.customer.create({
      data: { name: 'Grace Hughes', email: 'grace.hughes@btinternet.com', phone: '+447966567890', totalOrders: 7, totalSpend: 234.60, loyaltyPoints: 55 },
    }),
    prisma.customer.create({
      data: { name: 'Daniel Scott', email: 'daniel.scott@outlook.co.uk', phone: '+447977678901', totalOrders: 1, totalSpend: 28.50, loyaltyPoints: 0 },
    }),
  ]);

  console.log(`✓ Created ${customers.length} customers`);

  // ─── Orders (20) ──────────────────────────────────────────────────────────────

  const orderData = [
    { orderNumber: 'EMB-001', customerIdx: 0, type: 'dine-in', table: 5, status: 'served', total: 67.90 },
    { orderNumber: 'EMB-002', customerIdx: 1, type: 'pickup', table: null, status: 'ready', total: 34.45 },
    { orderNumber: 'EMB-003', customerIdx: 2, type: 'delivery', table: null, status: 'delivered', total: 52.80 },
    { orderNumber: 'EMB-004', customerIdx: 3, type: 'dine-in', table: 3, status: 'preparing', total: 89.50 },
    { orderNumber: 'EMB-005', customerIdx: 4, type: 'dine-in', table: 8, status: 'served', total: 112.40 },
    { orderNumber: 'EMB-006', customerIdx: 5, type: 'pickup', table: null, status: 'received', total: 42.50 },
    { orderNumber: 'EMB-007', customerIdx: 6, type: 'delivery', table: null, status: 'delivered', total: 78.20 },
    { orderNumber: 'EMB-008', customerIdx: 7, type: 'dine-in', table: 2, status: 'served', total: 95.60 },
    { orderNumber: 'EMB-009', customerIdx: 8, type: 'pickup', table: null, status: 'collected', total: 28.95 },
    { orderNumber: 'EMB-010', customerIdx: 9, type: 'dine-in', table: 6, status: 'preparing', total: 156.30 },
    { orderNumber: 'EMB-011', customerIdx: 10, type: 'delivery', table: null, status: 'delivered', total: 45.20 },
    { orderNumber: 'EMB-012', customerIdx: 11, type: 'dine-in', table: 1, status: 'received', total: 65.00 },
    { orderNumber: 'EMB-013', customerIdx: 12, type: 'pickup', table: null, status: 'ready', total: 38.75 },
    { orderNumber: 'EMB-014', customerIdx: 13, type: 'dine-in', table: 4, status: 'served', total: 134.60 },
    { orderNumber: 'EMB-015', customerIdx: 14, type: 'delivery', table: null, status: 'received', total: 28.50 },
    { orderNumber: 'EMB-016', customerIdx: 0, type: 'dine-in', table: 7, status: 'preparing', total: 76.40 },
    { orderNumber: 'EMB-017', customerIdx: 2, type: 'pickup', table: null, status: 'collected', total: 54.90 },
    { orderNumber: 'EMB-018', customerIdx: 4, type: 'dine-in', table: 9, status: 'served', total: 98.70 },
    { orderNumber: 'EMB-019', customerIdx: 6, type: 'delivery', table: null, status: 'delivered', total: 62.30 },
    { orderNumber: 'EMB-020', customerIdx: 8, type: 'dine-in', table: 10, status: 'received', total: 145.80 },
  ];

  const orders = [];
  for (const o of orderData) {
    const customer = customers[o.customerIdx];
    const order = await prisma.order.create({
      data: {
        orderNumber: o.orderNumber,
        customerName: customer.name,
        customerEmail: customer.email,
        customerPhone: customer.phone,
        orderType: o.type,
        tableNumber: o.table,
        deliveryAddress: o.type === 'delivery' ? '12 Camden High Street, Camden Town, London NW1 0JH' : null,
        status: o.status,
        totalAmount: o.total,
        customerId: customer.id,
      },
    });
    orders.push(order);
  }

  console.log(`✓ Created ${orders.length} orders`);

  // ─── Order Items ──────────────────────────────────────────────────────────────

  // Assign 2-4 items per order from menu items
  const orderItemsData: { orderId: string; menuItemId: string; quantity: number; unitPrice: number }[] = [];

  for (let i = 0; i < orders.length; i++) {
    const numItems = 2 + (i % 3); // 2, 3, or 4 items per order
    for (let j = 0; j < numItems; j++) {
      const menuItem = menuItems[(i * 3 + j) % menuItems.length];
      orderItemsData.push({
        orderId: orders[i].id,
        menuItemId: menuItem.id,
        quantity: 1 + (j % 2),
        unitPrice: menuItem.price,
      });
    }
  }

  await prisma.orderItem.createMany({ data: orderItemsData });
  console.log(`✓ Created ${orderItemsData.length} order items`);

  // ─── Deliveries for delivery orders ───────────────────────────────────────────

  const deliveryOrders = orders.filter((_, i) => orderData[i].type === 'delivery');
  for (const order of deliveryOrders) {
    await prisma.delivery.create({
      data: {
        orderId: order.id,
        riderName: 'Mike Johnson',
        status: order.status === 'delivered' ? 'delivered' : 'pending',
        assignedAt: order.status === 'delivered' ? new Date() : null,
        deliveredAt: order.status === 'delivered' ? new Date() : null,
      },
    });
  }

  console.log(`✓ Created deliveries for ${deliveryOrders.length} delivery orders`);


  // ─── Reservations (8) ─────────────────────────────────────────────────────────

  const now = new Date();
  const reservations = [
    { reference: 'RES-001', customerName: 'Edward Pemberton', phone: '+447911111111', daysAhead: 1, time: '18:30', partySize: 2, tableNumber: 4 },
    { reference: 'RES-002', customerName: 'Victoria Ashworth', phone: '+447922222222', daysAhead: 1, time: '19:00', partySize: 4, tableNumber: 6 },
    { reference: 'RES-003', customerName: 'Sebastian Holt', phone: '+447933333333', daysAhead: 2, time: '20:00', partySize: 6, tableNumber: 8 },
    { reference: 'RES-004', customerName: 'Arabella Whitmore', phone: '+447944444444', daysAhead: 3, time: '19:30', partySize: 3, tableNumber: 3 },
    { reference: 'RES-005', customerName: 'Rupert Blackwood', phone: '+447955555555', daysAhead: 4, time: '18:00', partySize: 8, tableNumber: 10 },
    { reference: 'RES-006', customerName: 'Penelope Hartley', phone: '+447966666666', daysAhead: 5, time: '20:30', partySize: 2, tableNumber: 2 },
    { reference: 'RES-007', customerName: 'Benedict Crawley', phone: '+447977777777', daysAhead: 6, time: '19:00', partySize: 5, tableNumber: 7 },
    { reference: 'RES-008', customerName: 'Cordelia Fairfax', phone: '+447988888888', daysAhead: 7, time: '18:30', partySize: 4, tableNumber: 5 },
  ];

  for (const r of reservations) {
    const date = new Date(now);
    date.setDate(date.getDate() + r.daysAhead);
    date.setHours(0, 0, 0, 0);

    await prisma.reservation.create({
      data: {
        reference: r.reference,
        customerName: r.customerName,
        phone: r.phone,
        date: date,
        time: r.time,
        partySize: r.partySize,
        tableNumber: r.tableNumber,
        status: 'confirmed',
      },
    });
  }

  console.log(`✓ Created ${reservations.length} reservations`);

  // ─── Inventory (one per menu item) ────────────────────────────────────────────

  const inventoryUnits: Record<string, string> = {
    'Starters': 'portions',
    'Mains': 'portions',
    'Grill': 'portions',
    'Sides': 'portions',
    'Desserts': 'portions',
    'Drinks': 'units',
  };

  for (const item of menuItems) {
    const stock = 20 + Math.floor(Math.random() * 81); // 20-100
    const threshold = 5 + Math.floor(Math.random() * 11); // 5-15
    await prisma.inventory.create({
      data: {
        menuItemId: item.id,
        currentStock: stock,
        unit: inventoryUnits[item.category] || 'portions',
        lowThreshold: threshold,
      },
    });
  }

  console.log(`✓ Created ${menuItems.length} inventory entries`);

  // ─── Discount Codes (3) ───────────────────────────────────────────────────────

  const futureDate = new Date();
  futureDate.setMonth(futureDate.getMonth() + 3);

  await prisma.discountCode.createMany({
    data: [
      {
        code: 'EMBER10',
        type: 'percentage',
        value: 10,
        expiryDate: futureDate,
        usageLimit: 100,
        usageCount: 12,
        active: true,
      },
      {
        code: 'FIRSTORDER',
        type: 'fixed',
        value: 5,
        expiryDate: futureDate,
        usageLimit: 50,
        usageCount: 8,
        active: true,
      },
      {
        code: 'LOYALTY20',
        type: 'percentage',
        value: 20,
        expiryDate: futureDate,
        usageLimit: 30,
        usageCount: 3,
        active: true,
      },
    ],
  });

  console.log('✓ Created 3 discount codes');

  // ─── Loyalty Rewards (4) ──────────────────────────────────────────────────────

  await prisma.loyaltyReward.createMany({
    data: [
      {
        name: 'Free Drink',
        description: 'Redeem for any drink from our menu',
        pointsRequired: 50,
        discountValue: 5,
        active: true,
      },
      {
        name: 'Free Starter',
        description: 'Redeem for any starter from our menu',
        pointsRequired: 100,
        discountValue: 10,
        active: true,
      },
      {
        name: 'Free Main',
        description: 'Redeem for any main course from our menu',
        pointsRequired: 200,
        discountValue: 20,
        active: true,
      },
      {
        name: 'Free Meal',
        description: 'Redeem for a complete meal including starter, main and dessert',
        pointsRequired: 500,
        discountValue: 50,
        active: true,
      },
    ],
  });

  console.log('✓ Created 4 loyalty rewards');

  console.log('\n🔥 Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
