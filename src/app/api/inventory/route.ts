import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const inventoryItems = await prisma.inventory.findMany({
      include: {
        menuItem: true,
      },
    });

    const items = inventoryItems.map((item) => ({
      id: item.id,
      menuItemId: item.menuItemId,
      menuItem: {
        name: item.menuItem.name,
        category: item.menuItem.category,
        price: item.menuItem.price,
      },
      currentStock: item.currentStock,
      unit: item.unit,
      lowThreshold: item.lowThreshold,
      isLowStock: item.currentStock <= item.lowThreshold,
    }));

    return NextResponse.json({ items }, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch inventory:', error);
    return NextResponse.json(
      { error: 'Failed to fetch inventory' },
      { status: 500 }
    );
  }
}
