// @vitest-environment jsdom
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CartProvider, useCart } from './use-cart';
import type { MenuItem } from '@/types';

// Mock sessionStorage
const mockStorage: Record<string, string> = {};
const sessionStorageMock = {
  getItem: vi.fn((key: string) => mockStorage[key] ?? null),
  setItem: vi.fn((key: string, value: string) => {
    mockStorage[key] = value;
  }),
  removeItem: vi.fn((key: string) => {
    delete mockStorage[key];
  }),
  clear: vi.fn(() => {
    Object.keys(mockStorage).forEach((key) => delete mockStorage[key]);
  }),
  length: 0,
  key: vi.fn(() => null),
};

Object.defineProperty(globalThis, 'sessionStorage', {
  value: sessionStorageMock,
  writable: true,
});

function createMenuItem(overrides: Partial<MenuItem> = {}): MenuItem {
  return {
    id: 'item-1',
    name: 'Grilled Steak',
    description: 'A fine steak',
    price: 24.99,
    image: '/images/steak.jpg',
    category: 'Mains',
    available: true,
    createdAt: '2024-01-01T00:00:00.000Z',
    ...overrides,
  };
}

function wrapper({ children }: { children: React.ReactNode }) {
  return <CartProvider>{children}</CartProvider>;
}

describe('useCart', () => {
  beforeEach(() => {
    Object.keys(mockStorage).forEach((key) => delete mockStorage[key]);
    vi.clearAllMocks();
  });

  it('throws when used outside CartProvider', () => {
    expect(() => {
      renderHook(() => useCart());
    }).toThrow('useCart must be used within a CartProvider');
  });

  it('starts with an empty cart', () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    expect(result.current.items).toEqual([]);
    expect(result.current.totalItems).toBe(0);
    expect(result.current.totalPrice).toBe(0);
  });

  describe('addItem', () => {
    it('adds a new item to the cart', () => {
      const { result } = renderHook(() => useCart(), { wrapper });
      const item = createMenuItem();

      act(() => {
        result.current.addItem(item);
      });

      expect(result.current.items).toHaveLength(1);
      expect(result.current.items[0].menuItem).toEqual(item);
      expect(result.current.items[0].quantity).toBe(1);
    });

    it('adds item with specified quantity', () => {
      const { result } = renderHook(() => useCart(), { wrapper });
      const item = createMenuItem();

      act(() => {
        result.current.addItem(item, 3);
      });

      expect(result.current.items[0].quantity).toBe(3);
    });

    it('increases quantity when adding an existing item', () => {
      const { result } = renderHook(() => useCart(), { wrapper });
      const item = createMenuItem();

      act(() => {
        result.current.addItem(item, 2);
      });
      act(() => {
        result.current.addItem(item, 3);
      });

      expect(result.current.items).toHaveLength(1);
      expect(result.current.items[0].quantity).toBe(5);
    });

    it('adds different items separately', () => {
      const { result } = renderHook(() => useCart(), { wrapper });
      const item1 = createMenuItem({ id: 'item-1', name: 'Steak', price: 25 });
      const item2 = createMenuItem({ id: 'item-2', name: 'Salad', price: 12 });

      act(() => {
        result.current.addItem(item1);
        result.current.addItem(item2);
      });

      expect(result.current.items).toHaveLength(2);
    });
  });

  describe('removeItem', () => {
    it('removes an item from the cart', () => {
      const { result } = renderHook(() => useCart(), { wrapper });
      const item = createMenuItem();

      act(() => {
        result.current.addItem(item, 3);
      });
      act(() => {
        result.current.removeItem('item-1');
      });

      expect(result.current.items).toHaveLength(0);
    });

    it('does nothing when removing a non-existent item', () => {
      const { result } = renderHook(() => useCart(), { wrapper });
      const item = createMenuItem();

      act(() => {
        result.current.addItem(item);
      });
      act(() => {
        result.current.removeItem('non-existent');
      });

      expect(result.current.items).toHaveLength(1);
    });
  });

  describe('updateQuantity', () => {
    it('updates the quantity of an item', () => {
      const { result } = renderHook(() => useCart(), { wrapper });
      const item = createMenuItem();

      act(() => {
        result.current.addItem(item, 1);
      });
      act(() => {
        result.current.updateQuantity('item-1', 5);
      });

      expect(result.current.items[0].quantity).toBe(5);
    });

    it('removes item when quantity is set to 0', () => {
      const { result } = renderHook(() => useCart(), { wrapper });
      const item = createMenuItem();

      act(() => {
        result.current.addItem(item, 3);
      });
      act(() => {
        result.current.updateQuantity('item-1', 0);
      });

      expect(result.current.items).toHaveLength(0);
    });

    it('removes item when quantity is negative', () => {
      const { result } = renderHook(() => useCart(), { wrapper });
      const item = createMenuItem();

      act(() => {
        result.current.addItem(item, 2);
      });
      act(() => {
        result.current.updateQuantity('item-1', -1);
      });

      expect(result.current.items).toHaveLength(0);
    });
  });

  describe('clearCart', () => {
    it('removes all items from the cart', () => {
      const { result } = renderHook(() => useCart(), { wrapper });
      const item1 = createMenuItem({ id: 'item-1' });
      const item2 = createMenuItem({ id: 'item-2' });

      act(() => {
        result.current.addItem(item1, 2);
        result.current.addItem(item2, 3);
      });
      act(() => {
        result.current.clearCart();
      });

      expect(result.current.items).toHaveLength(0);
      expect(result.current.totalItems).toBe(0);
      expect(result.current.totalPrice).toBe(0);
    });
  });

  describe('totals', () => {
    it('calculates totalItems as sum of all quantities', () => {
      const { result } = renderHook(() => useCart(), { wrapper });
      const item1 = createMenuItem({ id: 'item-1', price: 10 });
      const item2 = createMenuItem({ id: 'item-2', price: 20 });

      act(() => {
        result.current.addItem(item1, 2);
        result.current.addItem(item2, 3);
      });

      expect(result.current.totalItems).toBe(5);
    });

    it('calculates totalPrice as sum of quantity × price', () => {
      const { result } = renderHook(() => useCart(), { wrapper });
      const item1 = createMenuItem({ id: 'item-1', price: 10 });
      const item2 = createMenuItem({ id: 'item-2', price: 20 });

      act(() => {
        result.current.addItem(item1, 2);
        result.current.addItem(item2, 3);
      });

      // 2×10 + 3×20 = 80
      expect(result.current.totalPrice).toBe(80);
    });

    it('recalculates totals after quantity update', () => {
      const { result } = renderHook(() => useCart(), { wrapper });
      const item = createMenuItem({ price: 15 });

      act(() => {
        result.current.addItem(item, 2);
      });
      expect(result.current.totalPrice).toBe(30);

      act(() => {
        result.current.updateQuantity('item-1', 4);
      });
      expect(result.current.totalPrice).toBe(60);
      expect(result.current.totalItems).toBe(4);
    });
  });

  describe('session persistence', () => {
    it('saves cart to sessionStorage on change', () => {
      const { result } = renderHook(() => useCart(), { wrapper });
      const item = createMenuItem();

      act(() => {
        result.current.addItem(item, 2);
      });

      expect(sessionStorageMock.setItem).toHaveBeenCalledWith(
        'ember-grill-cart',
        expect.any(String)
      );
      const stored = JSON.parse(
        sessionStorageMock.setItem.mock.calls.at(-1)![1]
      );
      expect(stored).toHaveLength(1);
      expect(stored[0].menuItem.id).toBe('item-1');
      expect(stored[0].quantity).toBe(2);
    });

    it('loads cart from sessionStorage on mount', () => {
      const storedItems = [
        { menuItem: createMenuItem({ id: 'item-1', price: 10 }), quantity: 3 },
      ];
      mockStorage['ember-grill-cart'] = JSON.stringify(storedItems);

      const { result } = renderHook(() => useCart(), { wrapper });

      expect(result.current.items).toHaveLength(1);
      expect(result.current.items[0].quantity).toBe(3);
      expect(result.current.totalPrice).toBe(30);
    });

    it('handles corrupted sessionStorage gracefully', () => {
      mockStorage['ember-grill-cart'] = 'not-valid-json{{{';

      const { result } = renderHook(() => useCart(), { wrapper });

      expect(result.current.items).toEqual([]);
    });
  });
});
