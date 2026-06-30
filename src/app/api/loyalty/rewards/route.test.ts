import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from './route';

// Mock prisma
vi.mock('@/lib/db', () => ({
  prisma: {
    loyaltyReward: {
      findMany: vi.fn(),
    },
  },
}));

import { prisma } from '@/lib/db';

const mockedPrisma = vi.mocked(prisma);

describe('GET /api/loyalty/rewards', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 200 with active rewards sorted by pointsRequired', async () => {
    const mockRewards = [
      {
        id: '1',
        name: 'Free Drink',
        description: 'Any soft drink on the house',
        pointsRequired: 50,
        discountValue: 5,
        active: true,
        createdAt: new Date(),
      },
      {
        id: '2',
        name: 'Free Starter',
        description: 'Any starter from the menu',
        pointsRequired: 100,
        discountValue: 10,
        active: true,
        createdAt: new Date(),
      },
    ];

    mockedPrisma.loyaltyReward.findMany.mockResolvedValue(mockRewards);

    const res = await GET();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.rewards).toHaveLength(2);
    expect(data.rewards[0].name).toBe('Free Drink');
    expect(data.rewards[1].name).toBe('Free Starter');
  });

  it('returns empty array when no active rewards exist', async () => {
    mockedPrisma.loyaltyReward.findMany.mockResolvedValue([]);

    const res = await GET();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.rewards).toHaveLength(0);
  });

  it('only queries for active rewards', async () => {
    mockedPrisma.loyaltyReward.findMany.mockResolvedValue([]);

    await GET();

    expect(mockedPrisma.loyaltyReward.findMany).toHaveBeenCalledWith({
      where: { active: true },
      orderBy: { pointsRequired: 'asc' },
    });
  });

  it('returns 500 when an unexpected error occurs', async () => {
    mockedPrisma.loyaltyReward.findMany.mockRejectedValue(new Error('DB error'));

    const res = await GET();
    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.error).toContain('Failed to fetch loyalty rewards');
  });
});
