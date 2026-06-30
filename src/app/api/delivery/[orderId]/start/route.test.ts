import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from './route';

vi.mock('@/lib/db', () => ({
  prisma: {
    order: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    delivery: {
      upsert: vi.fn(),
    },
  },
}));

vi.mock('@/lib/mock-stuart', () => ({
  startDeliverySimulation: vi.fn(),
}));

vi.mock('@/lib/events', () => ({
  broadcastEvent: vi.fn(),
}));

import { prisma } from '@/lib/db';

const mockedPrisma = vi.mocked(prisma);

function createPostRequest(orderId: string): [NextRequest, { params: Promise<{ orderId: string }> }] {
  const req = new NextRequest(`http://localhost:3000/api/delivery/${orderId}/start`, {
    method: 'POST',
  });
  const context = { params: Promise.resolve({ orderId }) };
  return [req, context];
}

describe('POST /api/delivery/[orderId]/start', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 404 when order is not found', async () => {
    mockedPrisma.order.findUnique.mockResolvedValue(null);

    const [req, ctx] = createPostRequest('nonexistent');
    const res = await POST(req, ctx);
    expect(res.status).toBe(404);
    const data = await res.json();
    expect(data.error).toContain('Order not found');
  });

  it('returns 400 when order is not a delivery type', async () => {
    mockedPrisma.order.findUnique.mockResolvedValue({
      id: 'order1',
      orderType: 'dine-in',
      status: 'ready',
    } as any);

    const [req, ctx] = createPostRequest('order1');
    const res = await POST(req, ctx);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain('not a delivery order');
  });

  it('returns 400 when order status is not ready', async () => {
    mockedPrisma.order.findUnique.mockResolvedValue({
      id: 'order1',
      orderType: 'delivery',
      status: 'preparing',
    } as any);

    const [req, ctx] = createPostRequest('order1');
    const res = await POST(req, ctx);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain('must have status "ready"');
  });

  it('creates delivery record and updates order status on success', async () => {
    mockedPrisma.order.findUnique.mockResolvedValue({
      id: 'order1',
      orderType: 'delivery',
      status: 'ready',
    } as any);

    const mockDelivery = {
      id: 'del1',
      orderId: 'order1',
      status: 'rider-assigned',
      riderName: 'David Chen',
      assignedAt: new Date(),
      deliveredAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    mockedPrisma.delivery.upsert.mockResolvedValue(mockDelivery as any);
    mockedPrisma.order.update.mockResolvedValue({
      id: 'order1',
      status: 'out-for-delivery',
      items: [],
      delivery: mockDelivery,
    } as any);

    const [req, ctx] = createPostRequest('order1');
    const res = await POST(req, ctx);
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.delivery.status).toBe('rider-assigned');
    expect(data.delivery.riderName).toBeDefined();
  });

  it('updates order status to out-for-delivery', async () => {
    mockedPrisma.order.findUnique.mockResolvedValue({
      id: 'order1',
      orderType: 'delivery',
      status: 'ready',
    } as any);

    mockedPrisma.delivery.upsert.mockResolvedValue({
      id: 'del1',
      orderId: 'order1',
      status: 'rider-assigned',
      riderName: 'Emma Thompson',
      assignedAt: new Date(),
    } as any);
    mockedPrisma.order.update.mockResolvedValue({
      id: 'order1',
      status: 'out-for-delivery',
      items: [],
      delivery: null,
    } as any);

    const [req, ctx] = createPostRequest('order1');
    await POST(req, ctx);

    expect(mockedPrisma.order.update).toHaveBeenCalledWith({
      where: { id: 'order1' },
      data: { status: 'out-for-delivery' },
      include: { items: { include: { menuItem: true } }, delivery: true },
    });
  });

  it('assigns a rider name from the mock list', async () => {
    mockedPrisma.order.findUnique.mockResolvedValue({
      id: 'order1',
      orderType: 'delivery',
      status: 'ready',
    } as any);

    mockedPrisma.delivery.upsert.mockImplementation(async (args: any) => {
      return {
        id: 'del1',
        orderId: 'order1',
        ...args.create,
      };
    });
    mockedPrisma.order.update.mockResolvedValue({
      id: 'order1',
      status: 'out-for-delivery',
      items: [],
      delivery: null,
    } as any);

    const [req, ctx] = createPostRequest('order1');
    const res = await POST(req, ctx);
    const data = await res.json();

    const validRiders = ['Mike Johnson', 'Sarah Williams', 'David Chen', 'Emma Thompson', "James O'Brien"];
    expect(validRiders).toContain(data.delivery.riderName);
  });

  it('returns 500 when an unexpected error occurs', async () => {
    mockedPrisma.order.findUnique.mockRejectedValue(new Error('DB error'));

    const [req, ctx] = createPostRequest('order1');
    const res = await POST(req, ctx);
    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.error).toContain('Failed to start delivery');
  });
});
