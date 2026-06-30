import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { PATCH } from './route';

// Mock prisma
vi.mock('@/lib/db', () => ({
  prisma: {
    order: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

import { prisma } from '@/lib/db';

const mockedPrisma = vi.mocked(prisma);

function createPatchRequest(id: string, body: unknown): [NextRequest, { params: Promise<{ id: string }> }] {
  const req = new NextRequest(`http://localhost:3000/api/orders/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
  const context = { params: Promise.resolve({ id }) };
  return [req, context];
}

describe('PATCH /api/orders/[id]/status', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 400 when status is missing from body', async () => {
    const [req, ctx] = createPatchRequest('order1', {});
    const res = await PATCH(req, ctx);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain('status is required');
  });

  it('returns 400 when status is not a string', async () => {
    const [req, ctx] = createPatchRequest('order1', { status: 123 });
    const res = await PATCH(req, ctx);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain('status is required');
  });

  it('returns 404 when order is not found', async () => {
    mockedPrisma.order.findUnique.mockResolvedValue(null);

    const [req, ctx] = createPatchRequest('nonexistent', { status: 'preparing' });
    const res = await PATCH(req, ctx);
    expect(res.status).toBe(404);
    const data = await res.json();
    expect(data.error).toContain('Order not found');
  });

  it('returns 400 for invalid status transition', async () => {
    mockedPrisma.order.findUnique.mockResolvedValue({
      id: 'order1',
      status: 'received',
    } as any);

    const [req, ctx] = createPatchRequest('order1', { status: 'delivered' });
    const res = await PATCH(req, ctx);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("Invalid status transition from 'received' to 'delivered'");
  });

  it('returns 400 when current status has no allowed transitions', async () => {
    mockedPrisma.order.findUnique.mockResolvedValue({
      id: 'order1',
      status: 'delivered',
    } as any);

    const [req, ctx] = createPatchRequest('order1', { status: 'preparing' });
    const res = await PATCH(req, ctx);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("Invalid status transition from 'delivered' to 'preparing'");
  });

  it('successfully transitions from received to preparing', async () => {
    mockedPrisma.order.findUnique.mockResolvedValue({
      id: 'order1',
      status: 'received',
    } as any);

    const updatedOrder = {
      id: 'order1',
      orderNumber: 'EMB-001',
      status: 'preparing',
      items: [{ id: 'oi1', menuItemId: 'item1', quantity: 2, unitPrice: 12.5, menuItem: { id: 'item1', name: 'Burger' } }],
      delivery: null,
    };
    mockedPrisma.order.update.mockResolvedValue(updatedOrder as any);

    const [req, ctx] = createPatchRequest('order1', { status: 'preparing' });
    const res = await PATCH(req, ctx);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.order.status).toBe('preparing');
    expect(data.order.items).toHaveLength(1);
  });

  it('successfully transitions from preparing to ready', async () => {
    mockedPrisma.order.findUnique.mockResolvedValue({
      id: 'order1',
      status: 'preparing',
    } as any);

    const updatedOrder = {
      id: 'order1',
      status: 'ready',
      items: [],
      delivery: null,
    };
    mockedPrisma.order.update.mockResolvedValue(updatedOrder as any);

    const [req, ctx] = createPatchRequest('order1', { status: 'ready' });
    const res = await PATCH(req, ctx);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.order.status).toBe('ready');
  });

  it('successfully transitions from ready to out-for-delivery', async () => {
    mockedPrisma.order.findUnique.mockResolvedValue({
      id: 'order1',
      status: 'ready',
    } as any);

    const updatedOrder = {
      id: 'order1',
      status: 'out-for-delivery',
      items: [],
      delivery: { id: 'd1', status: 'pending' },
    };
    mockedPrisma.order.update.mockResolvedValue(updatedOrder as any);

    const [req, ctx] = createPatchRequest('order1', { status: 'out-for-delivery' });
    const res = await PATCH(req, ctx);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.order.status).toBe('out-for-delivery');
    expect(data.order.delivery).toBeDefined();
  });

  it('successfully transitions from out-for-delivery to delivered', async () => {
    mockedPrisma.order.findUnique.mockResolvedValue({
      id: 'order1',
      status: 'out-for-delivery',
    } as any);

    const updatedOrder = {
      id: 'order1',
      status: 'delivered',
      items: [],
      delivery: { id: 'd1', status: 'delivered' },
    };
    mockedPrisma.order.update.mockResolvedValue(updatedOrder as any);

    const [req, ctx] = createPatchRequest('order1', { status: 'delivered' });
    const res = await PATCH(req, ctx);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.order.status).toBe('delivered');
  });

  it('includes items with menuItem and delivery in the response', async () => {
    mockedPrisma.order.findUnique.mockResolvedValue({
      id: 'order1',
      status: 'received',
    } as any);

    mockedPrisma.order.update.mockResolvedValue({
      id: 'order1',
      status: 'preparing',
      items: [],
      delivery: null,
    } as any);

    const [req, ctx] = createPatchRequest('order1', { status: 'preparing' });
    await PATCH(req, ctx);

    const updateCall = mockedPrisma.order.update.mock.calls[0][0];
    expect(updateCall.include?.items).toEqual({ include: { menuItem: true } });
    expect(updateCall.include?.delivery).toBe(true);
  });

  it('returns 500 when an unexpected error occurs', async () => {
    mockedPrisma.order.findUnique.mockRejectedValue(new Error('DB connection failed'));

    const [req, ctx] = createPatchRequest('order1', { status: 'preparing' });
    const res = await PATCH(req, ctx);
    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.error).toContain('Failed to update order status');
  });
});
