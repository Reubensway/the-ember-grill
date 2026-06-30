import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from './route';

vi.mock('@/lib/db', () => ({
  prisma: {
    delivery: {
      findUnique: vi.fn(),
    },
  },
}));

import { prisma } from '@/lib/db';

const mockedPrisma = vi.mocked(prisma);

function createGetRequest(orderId: string): [NextRequest, { params: Promise<{ orderId: string }> }] {
  const req = new NextRequest(`http://localhost:3000/api/delivery/${orderId}`, {
    method: 'GET',
  });
  const context = { params: Promise.resolve({ orderId }) };
  return [req, context];
}

describe('GET /api/delivery/[orderId]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 200 with delivery record when found', async () => {
    const mockDelivery = {
      id: 'del1',
      orderId: 'order1',
      riderName: 'Mike Johnson',
      status: 'rider-assigned',
      assignedAt: new Date('2024-01-01T12:00:00Z'),
      deliveredAt: null,
      createdAt: new Date('2024-01-01T12:00:00Z'),
      updatedAt: new Date('2024-01-01T12:00:00Z'),
    };
    mockedPrisma.delivery.findUnique.mockResolvedValue(mockDelivery as any);

    const [req, ctx] = createGetRequest('order1');
    const res = await GET(req, ctx);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.delivery.id).toBe('del1');
    expect(data.delivery.riderName).toBe('Mike Johnson');
    expect(data.delivery.status).toBe('rider-assigned');
  });

  it('returns 404 when no delivery exists for the order', async () => {
    mockedPrisma.delivery.findUnique.mockResolvedValue(null);

    const [req, ctx] = createGetRequest('nonexistent');
    const res = await GET(req, ctx);
    expect(res.status).toBe(404);
    const data = await res.json();
    expect(data.error).toContain('Delivery not found');
  });

  it('returns 500 when an unexpected error occurs', async () => {
    mockedPrisma.delivery.findUnique.mockRejectedValue(new Error('DB error'));

    const [req, ctx] = createGetRequest('order1');
    const res = await GET(req, ctx);
    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.error).toContain('Failed to fetch delivery');
  });
});
