'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Minus, Plus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatPrice } from '@/lib/utils';
import type { MenuItem } from '@/types';

interface MenuItemDetailProps {
  item: MenuItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddToCart?: (item: MenuItem, quantity: number) => void;
}

export function MenuItemDetail({
  item,
  open,
  onOpenChange,
  onAddToCart,
}: MenuItemDetailProps) {
  const [quantity, setQuantity] = useState(1);

  // Reset quantity when dialog opens with a new item
  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen) {
      setQuantity(1);
    }
    onOpenChange(nextOpen);
  }

  function handleDecrement() {
    setQuantity((q) => Math.max(1, q - 1));
  }

  function handleIncrement() {
    setQuantity((q) => q + 1);
  }

  function handleAddToCart() {
    if (item && onAddToCart) {
      onAddToCart(item, quantity);
      onOpenChange(false);
    }
  }

  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        {/* Food image */}
        <div className="relative -mx-4 -mt-4 h-56 w-[calc(100%+2rem)] overflow-hidden rounded-t-xl">
          {item.image ? (
            <Image
              src={item.image}
              alt={item.name}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 448px"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-cream">
              <span className="text-sm text-charcoal-light">No image</span>
            </div>
          )}
        </div>

        <DialogHeader className="mt-2">
          <div className="flex items-center gap-2">
            <DialogTitle className="font-heading text-xl font-bold text-charcoal">
              {item.name}
            </DialogTitle>
            <Badge variant="secondary" className="bg-cream-dark text-charcoal-light">
              {item.category}
            </Badge>
          </div>
          <DialogDescription className="text-sm text-charcoal-light">
            {item.description}
          </DialogDescription>
        </DialogHeader>

        {/* Price */}
        <p className="text-lg font-semibold text-amber">
          {formatPrice(item.price)}
        </p>

        {/* Quantity selector */}
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-charcoal">Quantity</span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon-sm"
              onClick={handleDecrement}
              disabled={quantity <= 1}
              aria-label="Decrease quantity"
            >
              <Minus className="h-4 w-4" />
            </Button>
            <span className="w-8 text-center text-base font-semibold text-charcoal">
              {quantity}
            </span>
            <Button
              variant="outline"
              size="icon-sm"
              onClick={handleIncrement}
              aria-label="Increase quantity"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Add to Cart button */}
        <Button
          className="w-full bg-amber text-white hover:bg-amber-light"
          onClick={handleAddToCart}
          disabled={!item.available}
        >
          {item.available
            ? `Add to Cart — ${formatPrice(item.price * quantity)}`
            : 'Unavailable'}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
