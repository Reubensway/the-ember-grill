// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { MenuItemCard } from './MenuItemCard';
import type { MenuItem } from '@/types';

// Mock next/image
vi.mock('next/image', () => ({
  default: (props: Record<string, unknown>) => {
    const { fill, ...rest } = props as Record<string, unknown>;
    return <img data-fill={fill ? 'true' : undefined} {...rest} />;
  },
}));

afterEach(() => {
  cleanup();
});

const mockItem: MenuItem = {
  id: 'item-1',
  name: 'Grilled Ribeye Steak',
  description: 'A perfectly grilled 28-day aged ribeye served with peppercorn sauce and hand-cut chips',
  price: 32.5,
  image: '/images/ribeye.jpg',
  category: 'Grill',
  available: true,
  createdAt: '2024-01-01T00:00:00.000Z',
};

const unavailableItem: MenuItem = {
  ...mockItem,
  id: 'item-2',
  name: 'Lobster Thermidor',
  available: false,
};

const noImageItem: MenuItem = {
  ...mockItem,
  id: 'item-3',
  name: 'Mystery Dish',
  image: '',
};

describe('MenuItemCard', () => {
  it('renders item name, description, and formatted price', () => {
    render(<MenuItemCard item={mockItem} />);

    expect(screen.getByText('Grilled Ribeye Steak')).toBeInTheDocument();
    expect(screen.getByText(/perfectly grilled/)).toBeInTheDocument();
    expect(screen.getByText('£32.50')).toBeInTheDocument();
  });

  it('renders the food image with correct alt text', () => {
    render(<MenuItemCard item={mockItem} />);

    const img = screen.getByAltText('Grilled Ribeye Steak');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', '/images/ribeye.jpg');
  });

  it('renders a fallback when image is empty', () => {
    render(<MenuItemCard item={noImageItem} />);

    expect(screen.getByText('No image')).toBeInTheDocument();
  });

  it('calls onAddToCart when Add button is clicked', () => {
    const onAddToCart = vi.fn();
    render(<MenuItemCard item={mockItem} onAddToCart={onAddToCart} />);

    const addButton = screen.getByRole('button', { name: /add/i });
    fireEvent.click(addButton);

    expect(onAddToCart).toHaveBeenCalledWith(mockItem);
  });

  it('calls onItemClick when card is clicked', () => {
    const onItemClick = vi.fn();
    render(<MenuItemCard item={mockItem} onItemClick={onItemClick} />);

    const card = screen.getByText('Grilled Ribeye Steak').closest('[data-slot="card"]');
    fireEvent.click(card!);

    expect(onItemClick).toHaveBeenCalledWith(mockItem);
  });

  it('does not trigger onItemClick when Add button is clicked', () => {
    const onItemClick = vi.fn();
    const onAddToCart = vi.fn();
    render(<MenuItemCard item={mockItem} onItemClick={onItemClick} onAddToCart={onAddToCart} />);

    const addButton = screen.getByRole('button', { name: /add/i });
    fireEvent.click(addButton);

    expect(onAddToCart).toHaveBeenCalled();
    expect(onItemClick).not.toHaveBeenCalled();
  });

  it('shows Unavailable badge when item is not available', () => {
    render(<MenuItemCard item={unavailableItem} />);

    expect(screen.getByText('Unavailable')).toBeInTheDocument();
  });

  it('disables the Add button when item is unavailable', () => {
    const onAddToCart = vi.fn();
    render(<MenuItemCard item={unavailableItem} onAddToCart={onAddToCart} />);

    const addButton = screen.getByRole('button', { name: /add/i });
    expect(addButton).toBeDisabled();
  });
});
