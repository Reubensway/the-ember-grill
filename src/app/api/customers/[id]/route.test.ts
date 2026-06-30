import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from './route';

vi.mock('@/lib/db', () => ({
  prisma: {
    customer: {
      findUnique: vi.fn(),
    },
  },
}));

import { prisma } from '@/lib/db';

const mockedPrisma = vi.mocked(prisma);

function createGetRequest(): NextRequest {
  return new NextRequest('http://localhost:3000/api/customers/c1', { method: 'GET' });
}

describe('GET /api/customers/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns a customer with order history and 200 status', async () => {
    const mockCustomer = {
      id: 'c1',
      name: 'Alice',
      email: 'alice@test.com',
      phone: '07700900000',
      totalOrders: 2,
      totalSpend: 85.5,
      loyaltyPoints: 85,
      createdAt: new Date(),
      orders: [
        {
          id: 'o1',
          orderNumber: 'ORD-001',
          orderType: 'delivery',
          status: 'delivered',
          totalAmount: 45.5,
          createdAt: new Date(),
          items: [
            { id: 'oi1', quantity: 2, unitPrice: 12.5, menuItem: { id: 'm1', name: 'Burger', price: 12.5 } },
          ],
          delivery: { id: 'd1', status: 'delivered', riderName: 'Dave' },
        },
      ],
    };
    mockedPrisma.customer.findUnique.mockResolvedValue(mockCustomer as any);

    const req = createGetRequest();
    const res = await GET(req, { params: Promise.resolve({ id: 'c1' }) });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.customer.name).toBe('Alice');
    expect(data.customer.orders).toHaveLength(1);
    expect(data.customer.orders[0].items).toHaveLength(1);
    expect(data.customer.orders[0].delivery).toBeDefined();
  });

  it('returns 404 when customer is not found', async () => {
    mockedPrisma.customer.findUnique.mockResolvedValue(null);

    const req = createGetRequest();
    const res = await GET(req, { params: Promise.resolve({ id: 'nonexistent' }) });
    expect(res.status).toBe(404);
    const data = await res.json();
    expect(data.error).toContain('Customer not found');
  });

  it('includes orders with items and delivery in the response', async () => {
    mockedPrisma.customer.findUnique.mockResolvedValue(null);

    const req = createGetRequest();
    await GET(req, { params: Promise.resolve({ id: 'c1' }) });

    const findUniqueCall = mockedPrisma.customer.findUnique.mock.calls[0][0];
    expect(findUniqueCall.include?.orders).toBeDefined();
    expect(findUniqueCall.include?.orders.include?.items).toBeDefined();
    expect(findUniqueCall.include?.orders.include?.items.include?.menuItem).toBe(true);
    expect(findUniqueCall.include?.orders.include?.delivery).toBe(true);
  });

  it('returns 500 when an unexpected error occurs', async () => {
    mockedPrisma.customer.findUnique.mockRejectedValue(new Error('DB connection failed'));

    const req = createGetRequest();
    const res = await GET(req, { params: Promise.resolve({ id: 'c1' }) });
    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.error).toContain('Failed to fetch customer');
  });
});
