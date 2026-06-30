import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    const menuItems = await prisma.menuItem.findMany({
      where: category ? { category } : undefined,
      include: {
        inventory: true,
      },
      orderBy: { category: 'asc' },
    });

    const items = menuItems.map((item) => ({
      id: item.id,
      name: item.name,
      description: item.description,
      price: item.price,
      image: item.image,
      category: item.category,
      available: item.inventory ? item.inventory.currentStock > 0 : item.available,
    }));

    return NextResponse.json({ items }, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch menu items:', error);
    return NextResponse.json(
      { error: 'Failed to fetch menu items' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, price, category, image } = body;

    if (!name || !description || !price || !category) {
      return NextResponse.json(
        { error: 'name, description, price, and category are required' },
        { status: 400 }
      );
    }

    // Create the menu item
    const menuItem = await prisma.menuItem.create({
      data: {
        name,
        description,
        price: parseFloat(price),
        category,
        image: image || '',
        available: true,
      },
    });

    // Create an inventory entry for it
    await prisma.inventory.create({
      data: {
        menuItemId: menuItem.id,
        currentStock: 50,
        unit: 'portions',
        lowThreshold: 10,
      },
    });

    return NextResponse.json({ menuItem }, { status: 201 });
  } catch (error) {
    console.error('Failed to create menu item:', error);
    return NextResponse.json(
      { error: 'Failed to create menu item' },
      { status: 500 }
    );
  }
}
