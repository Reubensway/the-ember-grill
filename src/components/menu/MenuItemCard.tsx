'use client';

import Image from 'next/image';
import { Plus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatPrice } from '@/lib/utils';
import type { MenuItem } from '@/types';

interface MenuItemCardProps {
  item: MenuItem;
  onAddToCart?: (item: MenuItem) => void;
  onItemClick?: (item: MenuItem) => void;
}

export function MenuItemCard({ item, onAddToCart, onItemClick }: MenuItemCardProps) {
  const isUnavailable = !item.available;

  return (
    <Card
      className={`relative cursor-pointer overflow-hidden rounded-3xl border border-charcoal/5 bg-white/80 backdrop-blur-sm transition-all hover:border-amber/20 hover:shadow-sm ${
        isUnavailable ? 'opacity-60 grayscale' : ''
      }`}
      onClick={() => onItemClick?.(item)}
    >
      {/* Unavailable badge overlay */}
      {isUnavailable && (
        <div className="absolute top-3 right-3 z-10 rounded-full bg-charcoal/80 px-3 py-1 text-xs font-medium text-white">
          Unavailable
        </div>
      )}

      {/* Food image */}
      <div className="relative h-44 w-full overflow-hidden rounded-t-3xl">
        {item.image ? (
          <Image
            src={item.image}
            alt={item.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-cream">
            <span className="text-sm text-charcoal-light/60">No image</span>
          </div>
        )}
      </div>

      <CardContent className="flex flex-1 flex-col gap-3 p-5">
        {/* Item name */}
        <h3 className="font-heading text-base font-semibold text-charcoal">
          {item.name}
        </h3>

        {/* Description truncated to 2 lines */}
        <p className="line-clamp-2 text-sm text-charcoal-light/70">
          {item.description}
        </p>

        {/* Price and Add to Cart */}
        <div className="mt-auto flex items-center justify-between pt-3">
          <span className="text-base font-semibold text-amber">
            {formatPrice(item.price)}
          </span>

          <Button
            size="sm"
            disabled={isUnavailable}
            className="rounded-2xl bg-amber text-white shadow-none hover:bg-amber-light disabled:opacity-50"
            onClick={(e) => {
              e.stopPropagation();
              onAddToCart?.(item);
            }}
          >
            <Plus className="mr-1 h-4 w-4" />
            Add
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
