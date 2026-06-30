import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST, GET } from './route';

// Mock prisma
vi.mock('@/lib/db', () => ({
  prisma: {
    menuItem: {
      findMany: vi.fn(),
    },
    customer: {
      upsert: vi.fn(),
    },
    order: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

// Mock generateOrderNumber
vi.mock('@/lib/utils', () => ({
  generateOrderNumber: vi.fn(() => 'EMB-123'),
}));

import { prisma } from '@/lib/db';

const mockedPrisma = vi.mocked(prisma);

function createRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost:3000/api/orders', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('POST /api/orders', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 400 when customerName is missing', async () => {
    const req = createRequest({ orderType: 'pickup', items: [{ menuItemId: '1', quantity: 1 }] });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain('customerName');
  });

  it('returns 400 when orderType is invalid', async () => {
    const req = createRequest({ customerName: 'John', orderType: 'invalid', items: [{ menuItemId: '1', quantity: 1 }] });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain('orderType');
  });

  it('returns 400 when items array is empty', async () => {
    const req = createRequest({ customerName: 'John', orderType: 'pickup', items: [] });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain('items');
  });

  it('returns 400 when items is missing', async () => {
    const req = createRequest({ customerName: 'John', orderType: 'pickup' });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain('items');
  });

  it('returns 400 when dine-in order has no tableNumber', async () => {
    const req = createRequest({
      customerName: 'John',
      orderType: 'dine-in',
      items: [{ menuItemId: '1', quantity: 1 }],
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain('tableNumber');
  });

  it('returns 400 when delivery order has no deliveryAddress', async () => {
    const req = createRequest({
      customerName: 'John',
      orderType: 'delivery',
      items: [{ menuItemId: '1', quantity: 1 }],
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain('deliveryAddress');
  });

  it('returns 400 when item has invalid quantity', async () => {
    const req = createRequest({
      customerName: 'John',
      orderType: 'pickup',
      items: [{ menuItemId: '1', quantity: 0 }],
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain('quantity');
  });

  it('returns 400 when a menu item is not found', async () => {
    mockedPrisma.menuItem.findMany.mockResolvedValue([]);

    const req = createRequest({
      customerName: 'John',
      orderType: 'pickup',
      items: [{ menuItemId: 'nonexistent', quantity: 1 }],
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain('not found');
  });

  it('creates a pickup order successfully and returns 201', async () => {
    const mockMenuItem = { id: 'item1', name: 'Burger', price: 12.5 };
    mockedPrisma.menuItem.findMany.mockResolvedValue([mockMenuItem] as any);

    const mockOrder = {
      id: 'order1',
      orderNumber: 'EMB-123',
      customerName: 'John',
      customerEmail: null,
      customerPhone: null,
      orderType: 'pickup',
      tableNumber: null,
      deliveryAddress: null,
      status: 'received',
      totalAmount: 25.0,
      discountCode: null,
      discountAmount: 0,
      specialInstructions: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      customerId: null,
      items: [
        { id: 'oi1', menuItemId: 'item1', quantity: 2, unitPrice: 12.5, orderId: 'order1', menuItem: mockMenuItem },
      ],
    };
    mockedPrisma.order.create.mockResolvedValue(mockOrder as any);

    const req = createRequest({
      customerName: 'John',
      orderType: 'pickup',
      items: [{ menuItemId: 'item1', quantity: 2 }],
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.order.orderNumber).toBe('EMB-123');
    expect(data.order.status).toBe('received');
  });

  it('creates a dine-in order with tableNumber', async () => {
    const mockMenuItem = { id: 'item1', name: 'Steak', price: 28.0 };
    mockedPrisma.menuItem.findMany.mockResolvedValue([mockMenuItem] as any);

    const mockOrder = {
      id: 'order2',
      orderNumber: 'EMB-123',
      customerName: 'Jane',
      orderType: 'dine-in',
      tableNumber: 5,
      status: 'received',
      totalAmount: 28.0,
      items: [{ id: 'oi2', menuItemId: 'item1', quantity: 1, unitPrice: 28.0, menuItem: mockMenuItem }],
    };
    mockedPrisma.order.create.mockResolvedValue(mockOrder as any);

    const req = createRequest({
      customerName: 'Jane',
      orderType: 'dine-in',
      tableNumber: 5,
      items: [{ menuItemId: 'item1', quantity: 1 }],
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.order.tableNumber).toBe(5);
  });

  it('creates a delivery order with deliveryAddress', async () => {
    const mockMenuItem = { id: 'item1', name: 'Pizza', price: 15.0 };
    mockedPrisma.menuItem.findMany.mockResolvedValue([mockMenuItem] as any);

    const mockOrder = {
      id: 'order3',
      orderNumber: 'EMB-123',
      customerName: 'Bob',
      orderType: 'delivery',
      deliveryAddress: '12 Camden High Street, Camden Town, London NW1 0JH',
      status: 'received',
      totalAmount: 15.0,
      items: [{ id: 'oi3', menuItemId: 'item1', quantity: 1, unitPrice: 15.0, menuItem: mockMenuItem }],
    };
    mockedPrisma.order.create.mockResolvedValue(mockOrder as any);

    const req = createRequest({
      customerName: 'Bob',
      orderType: 'delivery',
      deliveryAddress: '12 Camden High Street, Camden Town, London NW1 0JH',
      items: [{ menuItemId: 'item1', quantity: 1 }],
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.order.deliveryAddress).toBe('12 Camden High Street, Camden Town, London NW1 0JH');
  });

  it('finds or creates a customer when email is provided', async () => {
    const mockMenuItem = { id: 'item1', name: 'Salad', price: 9.0 };
    mockedPrisma.menuItem.findMany.mockResolvedValue([mockMenuItem] as any);
    mockedPrisma.customer.upsert.mockResolvedValue({ id: 'cust1', name: 'Alice', email: 'alice@test.com' } as any);

    const mockOrder = {
      id: 'order4',
      orderNumber: 'EMB-123',
      customerName: 'Alice',
      customerEmail: 'alice@test.com',
      status: 'received',
      totalAmount: 9.0,
      customerId: 'cust1',
      items: [{ id: 'oi4', menuItemId: 'item1', quantity: 1, unitPrice: 9.0, menuItem: mockMenuItem }],
    };
    mockedPrisma.order.create.mockResolvedValue(mockOrder as any);

    const req = createRequest({
      customerName: 'Alice',
      customerEmail: 'alice@test.com',
      orderType: 'pickup',
      items: [{ menuItemId: 'item1', quantity: 1 }],
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
    expect(mockedPrisma.customer.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { email: 'alice@test.com' },
      })
    );
  });

  it('applies discount amount to total', async () => {
    const mockMenuItem = { id: 'item1', name: 'Burger', price: 20.0 };
    mockedPrisma.menuItem.findMany.mockResolvedValue([mockMenuItem] as any);

    const mockOrder = {
      id: 'order5',
      orderNumber: 'EMB-123',
      customerName: 'Dave',
      status: 'received',
      totalAmount: 15.0,
      discountCode: 'EMBER10',
      discountAmount: 5,
      items: [{ id: 'oi5', menuItemId: 'item1', quantity: 1, unitPrice: 20.0, menuItem: mockMenuItem }],
    };
    mockedPrisma.order.create.mockResolvedValue(mockOrder as any);

    const req = createRequest({
      customerName: 'Dave',
      orderType: 'pickup',
      items: [{ menuItemId: 'item1', quantity: 1 }],
      discountCode: 'EMBER10',
      discountAmount: 5,
    });
    const res = await POST(req);
    expect(res.status).toBe(201);

    // Verify the order was created with the correct total (20 - 5 = 15)
    const createCall = mockedPrisma.order.create.mock.calls[0][0];
    expect(createCall.data.totalAmount).toBe(15.0);
    expect(createCall.data.discountAmount).toBe(5);
  });

  it('returns 500 when an unexpected error occurs', async () => {
    mockedPrisma.menuItem.findMany.mockRejectedValue(new Error('DB connection failed'));

    const req = createRequest({
      customerName: 'John',
      orderType: 'pickup',
      items: [{ menuItemId: 'item1', quantity: 1 }],
    });
    const res = await POST(req);
    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.error).toContain('Failed to create order');
  });
});

describe('GET /api/orders', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function createGetRequest(params?: Record<string, string>): NextRequest {
    const url = new URL('http://localhost:3000/api/orders');
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.set(key, value);
      });
    }
    return new NextRequest(url.toString(), { method: 'GET' });
  }

  it('returns all orders with 200 when no filters are provided', async () => {
    const mockOrders = [
      { id: 'order1', orderNumber: 'EMB-001', status: 'received', orderType: 'pickup', items: [], delivery: null },
      { id: 'order2', orderNumber: 'EMB-002', status: 'preparing', orderType: 'dine-in', items: [], delivery: null },
    ];
    mockedPrisma.order.findMany.mockResolvedValue(mockOrders as any);

    const req = createGetRequest();
    const res = await GET(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.orders).toHaveLength(2);
    expect(data.orders[0].orderNumber).toBe('EMB-001');
  });

  it('filters orders by status', async () => {
    const mockOrders = [
      { id: 'order1', orderNumber: 'EMB-001', status: 'preparing', orderType: 'pickup', items: [], delivery: null },
    ];
    mockedPrisma.order.findMany.mockResolvedValue(mockOrders as any);

    const req = createGetRequest({ status: 'preparing' });
    const res = await GET(req);
    expect(res.status).toBe(200);

    const findManyCall = mockedPrisma.order.findMany.mock.calls[0][0];
    expect(findManyCall?.where?.status).toBe('preparing');
  });

  it('filters orders by orderType', async () => {
    const mockOrders = [
      { id: 'order1', orderNumber: 'EMB-001', status: 'received', orderType: 'delivery', items: [], delivery: null },
    ];
    mockedPrisma.order.findMany.mockResolvedValue(mockOrders as any);

    const req = createGetRequest({ orderType: 'delivery' });
    const res = await GET(req);
    expect(res.status).toBe(200);

    const findManyCall = mockedPrisma.order.findMany.mock.calls[0][0];
    expect(findManyCall?.where?.orderType).toBe('delivery');
  });

  it('filters orders by date range (from and to)', async () => {
    mockedPrisma.order.findMany.mockResolvedValue([] as any);

    const from = '2024-01-01T00:00:00.000Z';
    const to = '2024-01-31T23:59:59.000Z';
    const req = createGetRequest({ from, to });
    const res = await GET(req);
    expect(res.status).toBe(200);

    const findManyCall = mockedPrisma.order.findMany.mock.calls[0][0];
    expect(findManyCall?.where?.createdAt).toEqual({
      gte: new Date(from),
      lte: new Date(to),
    });
  });

  it('filters orders by from date only', async () => {
    mockedPrisma.order.findMany.mockResolvedValue([] as any);

    const from = '2024-01-01T00:00:00.000Z';
    const req = createGetRequest({ from });
    const res = await GET(req);
    expect(res.status).toBe(200);

    const findManyCall = mockedPrisma.order.findMany.mock.calls[0][0];
    expect(findManyCall?.where?.createdAt).toEqual({
      gte: new Date(from),
    });
  });

  it('combines multiple filters', async () => {
    mockedPrisma.order.findMany.mockResolvedValue([] as any);

    const req = createGetRequest({ status: 'received', orderType: 'dine-in' });
    const res = await GET(req);
    expect(res.status).toBe(200);

    const findManyCall = mockedPrisma.order.findMany.mock.calls[0][0];
    expect(findManyCall?.where?.status).toBe('received');
    expect(findManyCall?.where?.orderType).toBe('dine-in');
  });

  it('includes items with menuItem details and delivery in the response', async () => {
    mockedPrisma.order.findMany.mockResolvedValue([] as any);

    const req = createGetRequest();
    await GET(req);

    const findManyCall = mockedPrisma.order.findMany.mock.calls[0][0];
    expect(findManyCall?.include?.items).toEqual({ include: { menuItem: true } });
    expect(findManyCall?.include?.delivery).toBe(true);
  });

  it('orders results by createdAt descending', async () => {
    mockedPrisma.order.findMany.mockResolvedValue([] as any);

    const req = createGetRequest();
    await GET(req);

    const findManyCall = mockedPrisma.order.findMany.mock.calls[0][0];
    expect(findManyCall?.orderBy).toEqual({ createdAt: 'desc' });
  });

  it('returns 500 when an unexpected error occurs', async () => {
    mockedPrisma.order.findMany.mockRejectedValue(new Error('DB connection failed'));

    const req = createGetRequest();
    const res = await GET(req);
    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.error).toContain('Failed to fetch orders');
  });
});
