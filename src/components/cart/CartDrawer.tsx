'use client';

import Link from 'next/link';
import { Minus, Plus, Trash2, ShoppingBag } from 'lucide-react';
import { useCart } from '@/hooks/use-cart';
import { formatPrice } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';

interface CartDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CartDrawer({ open, onOpenChange }: CartDrawerProps) {
  const { items, totalPrice, updateQuantity, removeItem, clearCart } = useCart();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex flex-col bg-white/95 backdrop-blur-lg">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-3">
            <ShoppingBag className="size-5 text-amber" />
            Your Cart
          </SheetTitle>
          <SheetDescription>
            {items.length === 0
              ? 'Your cart is empty'
              : `${items.length} item${items.length > 1 ? 's' : ''} in your cart`}
          </SheetDescription>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-5 p-8 text-center">
            <ShoppingBag className="size-12 text-muted-foreground/30" />
            <div>
              <p className="font-medium text-foreground">Your cart is empty</p>
              <p className="mt-1.5 text-sm text-muted-foreground">
                Add items from the menu to get started.
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-4">
              <ul className="divide-y divide-border/50">
                {items.map((item) => (
                  <li
                    key={item.menuItem.id}
                    className="flex items-start gap-3 py-5"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">
                        {item.menuItem.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {formatPrice(item.menuItem.price)} each
                      </p>
                      <p className="mt-1.5 text-sm font-medium text-amber">
                        {formatPrice(item.menuItem.price * item.quantity)}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Button
                        variant="outline"
                        size="icon-xs"
                        className="rounded-xl"
                        onClick={() =>
                          updateQuantity(item.menuItem.id, item.quantity - 1)
                        }
                        aria-label={`Decrease quantity of ${item.menuItem.name}`}
                      >
                        <Minus className="size-3" />
                      </Button>
                      <span className="w-6 text-center text-sm font-medium">
                        {item.quantity}
                      </span>
                      <Button
                        variant="outline"
                        size="icon-xs"
                        className="rounded-xl"
                        onClick={() =>
                          updateQuantity(item.menuItem.id, item.quantity + 1)
                        }
                        aria-label={`Increase quantity of ${item.menuItem.name}`}
                      >
                        <Plus className="size-3" />
                      </Button>
                    </div>

                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => removeItem(item.menuItem.id)}
                      aria-label={`Remove ${item.menuItem.name} from cart`}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </li>
                ))}
              </ul>
            </div>

            <SheetFooter className="border-t border-border/50">
              <div className="flex items-center justify-between w-full">
                <span className="text-sm font-medium text-muted-foreground">
                  Total
                </span>
                <span className="text-lg font-semibold text-foreground">
                  {formatPrice(totalPrice)}
                </span>
              </div>

              <Link
                href="/checkout"
                onClick={() => onOpenChange(false)}
                className="inline-flex w-full items-center justify-center rounded-2xl bg-amber px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-amber-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber/50"
              >
                Proceed to Checkout
              </Link>

              <Button
                variant="outline"
                className="w-full rounded-2xl"
                onClick={clearCart}
              >
                Clear Cart
              </Button>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
