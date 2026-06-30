'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
} from 'react';
import type { CartItem, MenuItem } from '@/types';

// --- State & Actions ---

interface CartState {
  items: CartItem[];
}

type CartAction =
  | { type: 'ADD_ITEM'; menuItem: MenuItem; quantity: number }
  | { type: 'REMOVE_ITEM'; menuItemId: string }
  | { type: 'UPDATE_QUANTITY'; menuItemId: string; quantity: number }
  | { type: 'CLEAR' }
  | { type: 'HYDRATE'; items: CartItem[] };

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existing = state.items.find(
        (i) => i.menuItem.id === action.menuItem.id
      );
      if (existing) {
        return {
          items: state.items.map((i) =>
            i.menuItem.id === action.menuItem.id
              ? { ...i, quantity: i.quantity + action.quantity }
              : i
          ),
        };
      }
      return {
        items: [...state.items, { menuItem: action.menuItem, quantity: action.quantity }],
      };
    }
    case 'REMOVE_ITEM':
      return {
        items: state.items.filter((i) => i.menuItem.id !== action.menuItemId),
      };
    case 'UPDATE_QUANTITY': {
      if (action.quantity <= 0) {
        return {
          items: state.items.filter((i) => i.menuItem.id !== action.menuItemId),
        };
      }
      return {
        items: state.items.map((i) =>
          i.menuItem.id === action.menuItemId
            ? { ...i, quantity: action.quantity }
            : i
        ),
      };
    }
    case 'CLEAR':
      return { items: [] };
    case 'HYDRATE':
      return { items: action.items };
    default:
      return state;
  }
}

// --- Context ---

interface CartContextValue {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
  addItem: (menuItem: MenuItem, quantity?: number) => void;
  removeItem: (menuItemId: string) => void;
  updateQuantity: (menuItemId: string, quantity: number) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

const STORAGE_KEY = 'ember-grill-cart';

// --- Provider ---

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, { items: [] });

  // Hydrate from sessionStorage on mount (client only)
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (stored) {
        const items: CartItem[] = JSON.parse(stored);
        dispatch({ type: 'HYDRATE', items });
      }
    } catch {
      // sessionStorage unavailable or corrupted — start with empty cart
    }
  }, []);

  // Persist to sessionStorage on every change
  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state.items));
    } catch {
      // sessionStorage unavailable — silently ignore
    }
  }, [state.items]);

  const addItem = useCallback((menuItem: MenuItem, quantity: number = 1) => {
    dispatch({ type: 'ADD_ITEM', menuItem, quantity });
  }, []);

  const removeItem = useCallback((menuItemId: string) => {
    dispatch({ type: 'REMOVE_ITEM', menuItemId });
  }, []);

  const updateQuantity = useCallback((menuItemId: string, quantity: number) => {
    dispatch({ type: 'UPDATE_QUANTITY', menuItemId, quantity });
  }, []);

  const clearCart = useCallback(() => {
    dispatch({ type: 'CLEAR' });
  }, []);

  const totalItems = useMemo(
    () => state.items.reduce((sum, item) => sum + item.quantity, 0),
    [state.items]
  );

  const totalPrice = useMemo(
    () =>
      state.items.reduce(
        (sum, item) => sum + item.menuItem.price * item.quantity,
        0
      ),
    [state.items]
  );

  const value: CartContextValue = useMemo(
    () => ({
      items: state.items,
      totalItems,
      totalPrice,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
    }),
    [state.items, totalItems, totalPrice, addItem, removeItem, updateQuantity, clearCart]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

// --- Hook ---

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
