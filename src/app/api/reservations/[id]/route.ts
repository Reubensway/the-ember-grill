import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { broadcastEvent } from '@/lib/events';
import type { ReservationStatus } from '@/types';

export const dynamic = 'force-dynamic';

const ALLOWED_STATUSES: ReservationStatus[] = [
  'confirmed',
  'seated',
  'completed',
  'cancelled',
];

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const status = body.status as ReservationStatus | undefined;

    if (!status || !ALLOWED_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: 'status must be one of: confirmed, seated, completed, cancelled' },
        { status: 400 }
      );
    }

    const reservation = await prisma.reservation.update({
      where: { id },
      data: { status },
    });

    broadcastEvent('new-reservation', reservation);

    return NextResponse.json({ reservation }, { status: 200 });
  } catch (error) {
    console.error('Failed to update reservation:', error);
    return NextResponse.json(
      { error: 'Failed to update reservation' },
      { status: 500 }
    );
  }
}
