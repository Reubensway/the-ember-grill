import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from './route';

// Mock prisma
vi.mock('@/lib/db', () => ({
  prisma: {
    discountCode: {
      findUnique: vi.fn(),
    },
  },
}));

import { prisma } from '@/lib/db';

const mockedPrisma = vi.mocked(prisma);

function createRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost:3000/api/discount-codes/validate', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('POST /api/discount-codes/validate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 400 when code is missing', async () => {
    const req = createRequest({ orderTotal: 50 });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.valid).toBe(false);
    expect(data.error).toContain('code is required');
  });

  it('returns 400 when orderTotal is missing', async () => {
    const req = createRequest({ code: 'EMBER10' });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.valid).toBe(false);
    expect(data.error).toContain('orderTotal');
  });

  it('returns 400 when orderTotal is negative', async () => {
    const req = createRequest({ code: 'EMBER10', orderTotal: -5 });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.valid).toBe(false);
  });

  it('returns 400 when discount code is not found', async () => {
    mockedPrisma.discountCode.findUnique.mockResolvedValue(null);

    const req = createRequest({ code: 'INVALID', orderTotal: 50 });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.valid).toBe(false);
    expect(data.error).toBe('Discount code not found');
  });

  it('returns 400 when discount code is inactive', async () => {
    mockedPrisma.discountCode.findUnique.mockResolvedValue({
      id: '1',
      code: 'INACTIVE',
      type: 'percentage',
      value: 10,
      expiryDate: new Date('2099-12-31'),
      usageLimit: 100,
      usageCount: 0,
      active: false,
      createdAt: new Date(),
    });

    const req = createRequest({ code: 'INACTIVE', orderTotal: 50 });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.valid).toBe(false);
    expect(data.error).toBe('Discount code is inactive');
  });

  it('returns 400 when discount code has expired', async () => {
    mockedPrisma.discountCode.findUnique.mockResolvedValue({
      id: '1',
      code: 'EXPIRED',
      type: 'percentage',
      value: 10,
      expiryDate: new Date('2020-01-01'),
      usageLimit: 100,
      usageCount: 0,
      active: true,
      createdAt: new Date(),
    });

    const req = createRequest({ code: 'EXPIRED', orderTotal: 50 });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.valid).toBe(false);
    expect(data.error).toBe('Discount code has expired');
  });

  it('returns 400 when discount code usage limit is reached', async () => {
    mockedPrisma.discountCode.findUnique.mockResolvedValue({
      id: '1',
      code: 'MAXED',
      type: 'percentage',
      value: 10,
      expiryDate: new Date('2099-12-31'),
      usageLimit: 5,
      usageCount: 5,
      active: true,
      createdAt: new Date(),
    });

    const req = createRequest({ code: 'MAXED', orderTotal: 50 });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.valid).toBe(false);
    expect(data.error).toBe('Discount code usage limit reached');
  });

  it('returns 200 with correct discount for percentage type', async () => {
    mockedPrisma.discountCode.findUnique.mockResolvedValue({
      id: '1',
      code: 'EMBER10',
      type: 'percentage',
      value: 10,
      expiryDate: new Date('2099-12-31'),
      usageLimit: 100,
      usageCount: 5,
      active: true,
      createdAt: new Date(),
    });

    const req = createRequest({ code: 'EMBER10', orderTotal: 50 });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.valid).toBe(true);
    expect(data.discountAmount).toBe(5);
    expect(data.type).toBe('percentage');
    expect(data.value).toBe(10);
    expect(data.code).toBe('EMBER10');
  });

  it('returns 200 with correct discount for fixed type (value less than total)', async () => {
    mockedPrisma.discountCode.findUnique.mockResolvedValue({
      id: '2',
      code: 'FIXED5',
      type: 'fixed',
      value: 5,
      expiryDate: new Date('2099-12-31'),
      usageLimit: 50,
      usageCount: 10,
      active: true,
      createdAt: new Date(),
    });

    const req = createRequest({ code: 'FIXED5', orderTotal: 30 });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.valid).toBe(true);
    expect(data.discountAmount).toBe(5);
    expect(data.type).toBe('fixed');
    expect(data.value).toBe(5);
    expect(data.code).toBe('FIXED5');
  });

  it('caps fixed discount at orderTotal when value exceeds total', async () => {
    mockedPrisma.discountCode.findUnique.mockResolvedValue({
      id: '3',
      code: 'BIGFIXED',
      type: 'fixed',
      value: 50,
      expiryDate: new Date('2099-12-31'),
      usageLimit: 50,
      usageCount: 0,
      active: true,
      createdAt: new Date(),
    });

    const req = createRequest({ code: 'BIGFIXED', orderTotal: 20 });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.valid).toBe(true);
    expect(data.discountAmount).toBe(20);
  });

  it('returns 500 when an unexpected error occurs', async () => {
    mockedPrisma.discountCode.findUnique.mockRejectedValue(new Error('DB connection failed'));

    const req = createRequest({ code: 'EMBER10', orderTotal: 50 });
    const res = await POST(req);
    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.valid).toBe(false);
    expect(data.error).toContain('Failed to validate discount code');
  });
});
