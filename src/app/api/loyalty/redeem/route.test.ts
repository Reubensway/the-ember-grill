import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from './route';

// Mock prisma
vi.mock('@/lib/db', () => ({
  prisma: {
    customer: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    loyaltyReward: {
      findUnique: vi.fn(),
    },
  },
}));

import { prisma } from '@/lib/db';

const mockedPrisma = vi.mocked(prisma);

function createRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost:3000/api/loyalty/redeem', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('POST /api/loyalty/redeem', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 400 when customerId is missing', async () => {
    const req = createRequest({ rewardId: 'reward-1' });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain('customerId is required');
  });

  it('returns 400 when rewardId is missing', async () => {
    const req = createRequest({ customerId: 'cust-1' });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain('rewardId is required');
  });

  it('returns 404 when customer is not found', async () => {
    mockedPrisma.customer.findUnique.mockResolvedValue(null);

    const req = createRequest({ customerId: 'nonexistent', rewardId: 'reward-1' });
    const res = await POST(req);
    expect(res.status).toBe(404);
    const data = await res.json();
    expect(data.error).toBe('Customer not found');
  });

  it('returns 404 when reward is not found', async () => {
    mockedPrisma.customer.findUnique.mockResolvedValue({
      id: 'cust-1',
      name: 'John',
      email: 'john@test.com',
      phone: null,
      totalOrders: 5,
      totalSpend: 200,
      loyaltyPoints: 150,
      createdAt: new Date(),
    });
    mockedPrisma.loyaltyReward.findUnique.mockResolvedValue(null);

    const req = createRequest({ customerId: 'cust-1', rewardId: 'nonexistent' });
    const res = await POST(req);
    expect(res.status).toBe(404);
    const data = await res.json();
    expect(data.error).toBe('Reward not found');
  });

  it('returns 400 when reward is inactive', async () => {
    mockedPrisma.customer.findUnique.mockResolvedValue({
      id: 'cust-1',
      name: 'John',
      email: 'john@test.com',
      phone: null,
      totalOrders: 5,
      totalSpend: 200,
      loyaltyPoints: 150,
      createdAt: new Date(),
    });
    mockedPrisma.loyaltyReward.findUnique.mockResolvedValue({
      id: 'reward-1',
      name: 'Free Drink',
      description: 'A free drink',
      pointsRequired: 50,
      discountValue: 5,
      active: false,
      createdAt: new Date(),
    });

    const req = createRequest({ customerId: 'cust-1', rewardId: 'reward-1' });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe('Reward is no longer available');
  });

  it('returns 400 when customer has insufficient points', async () => {
    mockedPrisma.customer.findUnique.mockResolvedValue({
      id: 'cust-1',
      name: 'John',
      email: 'john@test.com',
      phone: null,
      totalOrders: 5,
      totalSpend: 200,
      loyaltyPoints: 30,
      createdAt: new Date(),
    });
    mockedPrisma.loyaltyReward.findUnique.mockResolvedValue({
      id: 'reward-1',
      name: 'Free Drink',
      description: 'A free drink',
      pointsRequired: 50,
      discountValue: 5,
      active: true,
      createdAt: new Date(),
    });

    const req = createRequest({ customerId: 'cust-1', rewardId: 'reward-1' });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe('Insufficient loyalty points');
  });

  it('returns 200 with reward details and new balance on successful redemption', async () => {
    mockedPrisma.customer.findUnique.mockResolvedValue({
      id: 'cust-1',
      name: 'John',
      email: 'john@test.com',
      phone: null,
      totalOrders: 5,
      totalSpend: 200,
      loyaltyPoints: 150,
      createdAt: new Date(),
    });
    mockedPrisma.loyaltyReward.findUnique.mockResolvedValue({
      id: 'reward-1',
      name: 'Free Drink',
      description: 'A free drink',
      pointsRequired: 50,
      discountValue: 5,
      active: true,
      createdAt: new Date(),
    });
    mockedPrisma.customer.update.mockResolvedValue({
      id: 'cust-1',
      name: 'John',
      email: 'john@test.com',
      phone: null,
      totalOrders: 5,
      totalSpend: 200,
      loyaltyPoints: 100,
      createdAt: new Date(),
    });

    const req = createRequest({ customerId: 'cust-1', rewardId: 'reward-1' });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.reward.id).toBe('reward-1');
    expect(data.reward.name).toBe('Free Drink');
    expect(data.reward.discountValue).toBe(5);
    expect(data.newPointsBalance).toBe(100);
  });

  it('deducts the correct number of points', async () => {
    mockedPrisma.customer.findUnique.mockResolvedValue({
      id: 'cust-1',
      name: 'John',
      email: 'john@test.com',
      phone: null,
      totalOrders: 5,
      totalSpend: 200,
      loyaltyPoints: 200,
      createdAt: new Date(),
    });
    mockedPrisma.loyaltyReward.findUnique.mockResolvedValue({
      id: 'reward-2',
      name: 'Free Main',
      description: 'A free main course',
      pointsRequired: 200,
      discountValue: 20,
      active: true,
      createdAt: new Date(),
    });
    mockedPrisma.customer.update.mockResolvedValue({
      id: 'cust-1',
      name: 'John',
      email: 'john@test.com',
      phone: null,
      totalOrders: 5,
      totalSpend: 200,
      loyaltyPoints: 0,
      createdAt: new Date(),
    });

    const req = createRequest({ customerId: 'cust-1', rewardId: 'reward-2' });
    await POST(req);

    expect(mockedPrisma.customer.update).toHaveBeenCalledWith({
      where: { id: 'cust-1' },
      data: { loyaltyPoints: 0 },
    });
  });

  it('returns 500 when an unexpected error occurs', async () => {
    mockedPrisma.customer.findUnique.mockRejectedValue(new Error('DB error'));

    const req = createRequest({ customerId: 'cust-1', rewardId: 'reward-1' });
    const res = await POST(req);
    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.error).toContain('Failed to redeem reward');
  });
});
