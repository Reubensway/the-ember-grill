import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST, GET } from './route';

// Mock prisma
vi.mock('@/lib/db', () => ({
  prisma: {
    reservation: {
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
    },
  },
}));

// Mock generateReference
vi.mock('@/lib/utils', () => ({
  generateReference: vi.fn(() => 'RES-123'),
}));

// Mock constants
vi.mock('@/lib/constants', () => ({
  TOTAL_TABLES: 12,
}));

import { prisma } from '@/lib/db';

const mockedPrisma = vi.mocked(prisma);

function createPostRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost:3000/api/reservations', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

function createGetRequest(params?: Record<string, string>): NextRequest {
  const url = new URL('http://localhost:3000/api/reservations');
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
  }
  return new NextRequest(url.toString(), { method: 'GET' });
}

describe('POST /api/reservations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 400 when customerName is missing', async () => {
    const req = createPostRequest({ phone: '07700900000', date: '2025-06-01', time: '19:00', partySize: 4 });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain('customerName');
  });

  it('returns 400 when phone is missing', async () => {
    const req = createPostRequest({ customerName: 'John', date: '2025-06-01', time: '19:00', partySize: 4 });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain('phone');
  });

  it('returns 400 when date is missing', async () => {
    const req = createPostRequest({ customerName: 'John', phone: '07700900000', time: '19:00', partySize: 4 });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain('date');
  });

  it('returns 400 when time is missing', async () => {
    const req = createPostRequest({ customerName: 'John', phone: '07700900000', date: '2025-06-01', partySize: 4 });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain('time');
  });

  it('returns 400 when partySize is missing or invalid', async () => {
    const req = createPostRequest({ customerName: 'John', phone: '07700900000', date: '2025-06-01', time: '19:00' });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain('partySize');
  });

  it('returns 400 with suggested times when no tables are available', async () => {
    // All 12 tables taken for the requested time
    mockedPrisma.reservation.count.mockResolvedValueOnce(12);
    // Alternative time checks - first has availability
    mockedPrisma.reservation.count.mockResolvedValueOnce(5);
    mockedPrisma.reservation.count.mockResolvedValueOnce(3);
    mockedPrisma.reservation.count.mockResolvedValueOnce(8);

    const req = createPostRequest({
      customerName: 'John',
      phone: '07700900000',
      date: '2025-06-01',
      time: '19:00',
      partySize: 4,
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain('No tables available');
    expect(data.suggestedTimes).toBeDefined();
    expect(Array.isArray(data.suggestedTimes)).toBe(true);
  });

  it('creates a reservation successfully and returns 201', async () => {
    // Tables available
    mockedPrisma.reservation.count.mockResolvedValue(3);
    // Taken tables query
    mockedPrisma.reservation.findMany.mockResolvedValue([
      { tableNumber: 1 },
      { tableNumber: 2 },
      { tableNumber: 3 },
    ] as any);

    const mockReservation = {
      id: 'res1',
      reference: 'RES-123',
      customerName: 'John',
      phone: '07700900000',
      date: new Date('2025-06-01'),
      time: '19:00',
      partySize: 4,
      tableNumber: 4,
      status: 'confirmed',
      createdAt: new Date(),
    };
    mockedPrisma.reservation.create.mockResolvedValue(mockReservation as any);

    const req = createPostRequest({
      customerName: 'John',
      phone: '07700900000',
      date: '2025-06-01',
      time: '19:00',
      partySize: 4,
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.reservation.reference).toBe('RES-123');
    expect(data.reservation.status).toBe('confirmed');
  });

  it('assigns the next available table number', async () => {
    mockedPrisma.reservation.count.mockResolvedValue(2);
    mockedPrisma.reservation.findMany.mockResolvedValue([
      { tableNumber: 1 },
      { tableNumber: 2 },
    ] as any);

    const mockReservation = {
      id: 'res2',
      reference: 'RES-123',
      customerName: 'Jane',
      phone: '07700900001',
      date: new Date('2025-06-01'),
      time: '20:00',
      partySize: 2,
      tableNumber: 3,
      status: 'confirmed',
      createdAt: new Date(),
    };
    mockedPrisma.reservation.create.mockResolvedValue(mockReservation as any);

    const req = createPostRequest({
      customerName: 'Jane',
      phone: '07700900001',
      date: '2025-06-01',
      time: '20:00',
      partySize: 2,
    });
    const res = await POST(req);
    expect(res.status).toBe(201);

    const createCall = mockedPrisma.reservation.create.mock.calls[0][0];
    expect(createCall.data.tableNumber).toBe(3);
  });

  it('returns 500 when an unexpected error occurs', async () => {
    mockedPrisma.reservation.count.mockRejectedValue(new Error('DB connection failed'));

    const req = createPostRequest({
      customerName: 'John',
      phone: '07700900000',
      date: '2025-06-01',
      time: '19:00',
      partySize: 4,
    });
    const res = await POST(req);
    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.error).toContain('Failed to create reservation');
  });
});

describe('GET /api/reservations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns all reservations with 200 when no date filter is provided', async () => {
    const mockReservations = [
      { id: 'res1', reference: 'RES-001', customerName: 'John', date: '2025-06-01', time: '19:00', status: 'confirmed' },
      { id: 'res2', reference: 'RES-002', customerName: 'Jane', date: '2025-06-02', time: '20:00', status: 'confirmed' },
    ];
    mockedPrisma.reservation.findMany.mockResolvedValue(mockReservations as any);

    const req = createGetRequest();
    const res = await GET(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.reservations).toHaveLength(2);
  });

  it('filters reservations by date when date param is provided', async () => {
    mockedPrisma.reservation.findMany.mockResolvedValue([] as any);

    const req = createGetRequest({ date: '2025-06-01' });
    const res = await GET(req);
    expect(res.status).toBe(200);

    const findManyCall = mockedPrisma.reservation.findMany.mock.calls[0][0];
    expect(findManyCall?.where?.date).toBeDefined();
    expect(findManyCall?.where?.date.gte).toBeDefined();
    expect(findManyCall?.where?.date.lte).toBeDefined();
  });

  it('orders results by date ascending', async () => {
    mockedPrisma.reservation.findMany.mockResolvedValue([] as any);

    const req = createGetRequest();
    await GET(req);

    const findManyCall = mockedPrisma.reservation.findMany.mock.calls[0][0];
    expect(findManyCall?.orderBy).toEqual({ date: 'asc' });
  });

  it('returns 500 when an unexpected error occurs', async () => {
    mockedPrisma.reservation.findMany.mockRejectedValue(new Error('DB connection failed'));

    const req = createGetRequest();
    const res = await GET(req);
    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.error).toContain('Failed to fetch reservations');
  });
});
