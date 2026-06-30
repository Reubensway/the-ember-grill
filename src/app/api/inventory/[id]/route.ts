import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const body = await request.json();
    const { currentStock, lowThreshold } = body;

    // Validate that at least one field is provided
    if (currentStock === undefined && lowThreshold === undefined) {
      return NextResponse.json(
        { error: 'At least one of currentStock or lowThreshold must be provided' },
        { status: 400 }
      );
    }

    // Validate field types
    if (currentStock !== undefined && (typeof currentStock !== 'number' || currentStock < 0)) {
      return NextResponse.json(
        { error: 'currentStock must be a non-negative number' },
        { status: 400 }
      );
    }

    if (lowThreshold !== undefined && (typeof lowThreshold !== 'number' || lowThreshold < 0)) {
      return NextResponse.json(
        { error: 'lowThreshold must be a non-negative number' },
        { status: 400 }
      );
    }

    // Check if inventory item exists
    const existingItem = await prisma.inventory.findUnique({
      where: { id },
      include: { menuItem: true },
    });

    if (!existingItem) {
      return NextResponse.json(
        { error: 'Inventory item not found' },
        { status: 404 }
      );
    }

    // Build update data
    const updateData: { currentStock?: number; lowThreshold?: number } = {};
    if (currentStock !== undefined) updateData.currentStock = currentStock;
    if (lowThreshold !== undefined) updateData.lowThreshold = lowThreshold;

    // Update the inventory item
    const updatedItem = await prisma.inventory.update({
      where: { id },
      data: updateData,
      include: { menuItem: true },
    });

    // Handle menu item availability based on stock level
    const newStock = currentStock !== undefined ? currentStock : existingItem.currentStock;

    if (newStock === 0 && existingItem.menuItem.available) {
      // Stock reached zero — mark menu item as unavailable
      await prisma.menuItem.update({
        where: { id: existingItem.menuItemId },
        data: { available: false },
      });
    } else if (newStock > 0 && !existingItem.menuItem.available) {
      // Stock is above zero and menu item was unavailable — mark as available
      await prisma.menuItem.update({
        where: { id: existingItem.menuItemId },
        data: { available: true },
      });
    }

    return NextResponse.json({ item: updatedItem }, { status: 200 });
  } catch (error) {
    console.error('Failed to update inventory item:', error);
    return NextResponse.json(
      { error: 'Failed to update inventory item' },
      { status: 500 }
    );
  }
}
