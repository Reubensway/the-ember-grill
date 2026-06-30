import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { generateOrderNumber } from '@/lib/utils';
import { DELIVERY_ADDRESSES } from '@/lib/constants';
import { OrderType } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const orderType = searchParams.get('orderType');
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    // Build where clause based on filters
    const where: Record<string, unknown> = {};

    if (status) {
      where.status = status;
    }

    if (orderType) {
      where.orderType = orderType;
    }

    if (from || to) {
      const createdAt: Record<string, Date> = {};
      if (from) {
        createdAt.gte = new Date(from);
      }
      if (to) {
        createdAt.lte = new Date(to);
      }
      where.createdAt = createdAt;
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        items: {
          include: {
            menuItem: true,
          },
        },
        delivery: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ orders }, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}

interface OrderItemInput {
  menuItemId: string;
  quantity: number;
}

interface CreateOrderBody {
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  orderType: OrderType;
  tableNumber?: number;
  deliveryAddress?: string;
  items: OrderItemInput[];
  specialInstructions?: string;
  discountCode?: string;
  discountAmount?: number;
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateOrderBody = await request.json();

    // Validate required fields
    if (!body.customerName || typeof body.customerName !== 'string') {
      return NextResponse.json(
        { error: 'customerName is required' },
        { status: 400 }
      );
    }

    if (!body.orderType || !['dine-in', 'pickup', 'delivery'].includes(body.orderType)) {
      return NextResponse.json(
        { error: 'orderType must be one of: dine-in, pickup, delivery' },
        { status: 400 }
      );
    }

    if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json(
        { error: 'items must be a non-empty array' },
        { status: 400 }
      );
    }

    // Validate conditional required fields
    if (body.orderType === 'dine-in' && (body.tableNumber === undefined || body.tableNumber === null)) {
      return NextResponse.json(
        { error: 'tableNumber is required for dine-in orders' },
        { status: 400 }
      );
    }

    if (body.orderType === 'delivery' && (!body.deliveryAddress || typeof body.deliveryAddress !== 'string')) {
      return NextResponse.json(
        { error: 'deliveryAddress is required for delivery orders' },
        { status: 400 }
      );
    }

    // Validate delivery address is one of the accepted addresses
    if (body.orderType === 'delivery' && body.deliveryAddress) {
      const validPostcodes = DELIVERY_ADDRESSES.map((a) => a.postcode.toLowerCase().replace(/\s/g, ''));
      const inputAddress = body.deliveryAddress.trim().toLowerCase().replace(/\s/g, '');
      const matchesValid = validPostcodes.some((pc) => inputAddress.includes(pc));
      if (!matchesValid) {
        return NextResponse.json(
          { error: 'Delivery address not in our delivery zone. Please use a valid address.' },
          { status: 400 }
        );
      }
    }

    // Validate each item has menuItemId and quantity
    for (const item of body.items) {
      if (!item.menuItemId || typeof item.menuItemId !== 'string') {
        return NextResponse.json(
          { error: 'Each item must have a valid menuItemId' },
          { status: 400 }
        );
      }
      if (!item.quantity || typeof item.quantity !== 'number' || item.quantity < 1) {
        return NextResponse.json(
          { error: 'Each item must have a quantity of at least 1' },
          { status: 400 }
        );
      }
    }

    // Look up menu item prices
    const menuItemIds = body.items.map((item) => item.menuItemId);
    const menuItems = await prisma.menuItem.findMany({
      where: { id: { in: menuItemIds } },
    });

    if (menuItems.length !== menuItemIds.length) {
      return NextResponse.json(
        { error: 'One or more menu items not found' },
        { status: 400 }
      );
    }

    // Build a price lookup map
    const priceMap = new Map(menuItems.map((mi) => [mi.id, mi.price]));

    // Calculate total amount
    let totalAmount = 0;
    for (const item of body.items) {
      const price = priceMap.get(item.menuItemId)!;
      totalAmount += price * item.quantity;
    }

    // Apply discount
    const discountAmount = body.discountAmount ?? 0;
    totalAmount = Math.max(0, totalAmount - discountAmount);

    // Find or create customer if email is provided
    let customerId: string | null = null;
    // Only earn loyalty points on delivery and pickup orders (not dine-in)
    const loyaltyPointsEarned = body.orderType !== 'dine-in' ? Math.floor(totalAmount) : 0;
    if (body.customerEmail) {
      const customer = await prisma.customer.upsert({
        where: { email: body.customerEmail },
        update: {
          name: body.customerName,
          phone: body.customerPhone ?? undefined,
          totalOrders: { increment: 1 },
          totalSpend: { increment: totalAmount },
          ...(loyaltyPointsEarned > 0 ? { loyaltyPoints: { increment: loyaltyPointsEarned } } : {}),
        },
        create: {
          name: body.customerName,
          email: body.customerEmail,
          phone: body.customerPhone ?? null,
          totalOrders: 1,
          totalSpend: totalAmount,
          loyaltyPoints: loyaltyPointsEarned,
        },
      });
      customerId = customer.id;
    }

    // Create the order with items
    const order = await prisma.order.create({
      data: {
        orderNumber: generateOrderNumber(),
        customerName: body.customerName,
        customerEmail: body.customerEmail ?? null,
        customerPhone: body.customerPhone ?? null,
        orderType: body.orderType,
        tableNumber: body.tableNumber ?? null,
        deliveryAddress: body.deliveryAddress ?? null,
        status: 'received',
        totalAmount,
        discountCode: body.discountCode ?? null,
        discountAmount,
        specialInstructions: body.specialInstructions ?? null,
        customerId,
        items: {
          create: body.items.map((item) => ({
            menuItemId: item.menuItemId,
            quantity: item.quantity,
            unitPrice: priceMap.get(item.menuItemId)!,
          })),
        },
      },
      include: {
        items: {
          include: {
            menuItem: true,
          },
        },
      },
    });

    return NextResponse.json({ order }, { status: 201 });
  } catch (error) {
    console.error('Failed to create order:', error);
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    );
  }
}
