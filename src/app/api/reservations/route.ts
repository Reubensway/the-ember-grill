import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { TOTAL_TABLES } from '@/lib/constants';
import { generateReference } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');

    const where: Record<string, unknown> = {};

    if (date) {
      // Filter reservations for a specific date
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      where.date = {
        gte: startOfDay,
        lte: endOfDay,
      };
    }

    const reservations = await prisma.reservation.findMany({
      where,
      orderBy: {
        date: 'asc',
      },
    });

    return NextResponse.json({ reservations }, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch reservations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reservations' },
      { status: 500 }
    );
  }
}

interface CreateReservationBody {
  customerName: string;
  phone: string;
  date: string;
  time: string;
  partySize: number;
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateReservationBody = await request.json();

    // Validate required fields
    if (!body.customerName || typeof body.customerName !== 'string') {
      return NextResponse.json(
        { error: 'customerName is required' },
        { status: 400 }
      );
    }

    if (!body.phone || typeof body.phone !== 'string') {
      return NextResponse.json(
        { error: 'phone is required' },
        { status: 400 }
      );
    }

    if (!body.date || typeof body.date !== 'string') {
      return NextResponse.json(
        { error: 'date is required' },
        { status: 400 }
      );
    }

    if (!body.time || typeof body.time !== 'string') {
      return NextResponse.json(
        { error: 'time is required' },
        { status: 400 }
      );
    }

    if (!body.partySize || typeof body.partySize !== 'number' || body.partySize < 1) {
      return NextResponse.json(
        { error: 'partySize must be a number greater than 0' },
        { status: 400 }
      );
    }

    // Parse the reservation date
    const reservationDate = new Date(body.date);
    reservationDate.setHours(0, 0, 0, 0);

    const startOfDay = new Date(reservationDate);
    const endOfDay = new Date(reservationDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Check availability: count confirmed reservations for the same date and time slot
    const existingReservations = await prisma.reservation.count({
      where: {
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
        time: body.time,
        status: 'confirmed',
      },
    });

    if (existingReservations >= TOTAL_TABLES) {
      // Suggest alternative times
      const allTimes = ['12:00', '12:30', '13:00', '13:30', '14:00', '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00'];
      const alternativeTimes: string[] = [];

      for (const time of allTimes) {
        if (time === body.time) continue;
        const count = await prisma.reservation.count({
          where: {
            date: {
              gte: startOfDay,
              lte: endOfDay,
            },
            time,
            status: 'confirmed',
          },
        });
        if (count < TOTAL_TABLES) {
          alternativeTimes.push(time);
        }
        if (alternativeTimes.length >= 3) break;
      }

      return NextResponse.json(
        {
          error: `No tables available for ${body.time} on this date`,
          suggestedTimes: alternativeTimes,
        },
        { status: 400 }
      );
    }

    // Assign next available table number
    const takenTables = await prisma.reservation.findMany({
      where: {
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
        time: body.time,
        status: 'confirmed',
      },
      select: { tableNumber: true },
    });

    const takenTableNumbers = new Set(
      takenTables.map((r) => r.tableNumber).filter((n): n is number => n !== null)
    );

    let assignedTable = 1;
    while (takenTableNumbers.has(assignedTable) && assignedTable <= TOTAL_TABLES) {
      assignedTable++;
    }

    // Create the reservation
    const reservation = await prisma.reservation.create({
      data: {
        reference: generateReference(),
        customerName: body.customerName,
        phone: body.phone,
        date: reservationDate,
        time: body.time,
        partySize: body.partySize,
        tableNumber: assignedTable,
        status: 'confirmed',
      },
    });

    return NextResponse.json({ reservation }, { status: 201 });
  } catch (error) {
    console.error('Failed to create reservation:', error);
    return NextResponse.json(
      { error: 'Failed to create reservation' },
      { status: 500 }
    );
  }
}
