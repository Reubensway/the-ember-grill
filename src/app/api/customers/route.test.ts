import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from './route';

vi.mock('@/lib/db', () => ({
  prisma: {
    customer: {
      findMany: vi.fn(),
    },
  },
}));

import { prisma } from '@/lib/db';

const mockedPrisma = vi.mocked(prisma);

function createGetRequest(params?: Record<string, string>): NextRequest {
  const url = new URL('http://localhost:3000/api/customers');
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
  }
  return new NextRequest(url.toString(), { method: 'GET' });
}

describe('GET /api/customers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns all customers with 200', async () => {
    const mockCustomers = [
      { id: 'c1', name: 'Alice', email: 'alice@test.com', phone: '07700900000', totalOrders: 5, totalSpend: 120.5, loyaltyPoints: 120, createdAt: new Date() },
      { id: 'c2', name: 'Bob', email: 'bob@test.com', phone: '07700900001', totalOrders: 3, totalSpend: 75.0, loyaltyPoints: 75, createdAt: new Date() },
    ];
    mockedPrisma.customer.findMany.mockResolvedValue(mockCustomers as any);

    const req = createGetRequest();
    const res = await GET(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.customers).toHaveLength(2);
    expect(data.customers[0].name).toBe('Alice');
    expect(data.customers[1].name).toBe('Bob');
  });

  it('filters customers by search query (name or email)', async () => {
    mockedPrisma.customer.findMany.mockResolvedValue([]);

    const req = createGetRequest({ search: 'alice' });
    const res = await GET(req);
    expect(res.status).toBe(200);

    const findManyCall = mockedPrisma.customer.findMany.mock.calls[0][0];
    expect(findManyCall?.where?.OR).toBeDefined();
    expect(findManyCall?.where?.OR).toHaveLength(2);
    expect(findManyCall?.where?.OR[0]).toEqual({ name: { contains: 'alice', mode: 'insensitive' } });
    expect(findManyCall?.where?.OR[1]).toEqual({ email: { contains: 'alice', mode: 'insensitive' } });
  });

  it('returns all customers when no search param is provided', async () => {
    mockedPrisma.customer.findMany.mockResolvedValue([]);

    const req = createGetRequest();
    await GET(req);

    const findManyCall = mockedPrisma.customer.findMany.mock.calls[0][0];
    expect(findManyCall?.where).toBeUndefined();
  });

  it('returns 500 when an unexpected error occurs', async () => {
    mockedPrisma.customer.findMany.mockRejectedValue(new Error('DB connection failed'));

    const req = createGetRequest();
    const res = await GET(req);
    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.error).toContain('Failed to fetch customers');
  });
});
