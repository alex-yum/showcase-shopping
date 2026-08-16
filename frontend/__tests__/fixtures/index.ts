import type { Order, OrderItem } from '@/lib/types/order'
import type { Product, UserStats } from '@/lib/types/product'
import type { User } from '@/lib/types/auth'

export function makeOrderItem(overrides: Partial<OrderItem> = {}): OrderItem {
  return {
    productId: 1,
    name: 'T-Shirt',
    quantity: 1,
    price: 44.99,
    ...overrides,
  }
}

export function makeOrder(overrides: Partial<Order> = {}): Order {
  return {
    orderId: '1234',
    userId: 1,
    status: 'shipped',
    items: [makeOrderItem()],
    total: 89.99,
    createdAt: '2026-05-15T10:30:00Z',
    updatedAt: '2026-05-16T14:20:00Z',
    ...overrides,
  }
}

export function makeProduct(overrides: Partial<Product> = {}): Product {
  return {
    productId: 10,
    name: 'Premium Cotton T-Shirt',
    description: 'Luxuriously soft everyday essential',
    price: 24.99,
    rating: 4.5,
    reviewCount: 234,
    inStock: true,
    ...overrides,
  }
}

export function makeUser(overrides: Partial<User> = {}): User {
  return {
    userId: 1,
    email: 'test@example.com',
    ...overrides,
  }
}

export function makeStats(overrides: Partial<UserStats> = {}): UserStats {
  return {
    ordersThisMonth: 5,
    totalSpent: 237.5,
    loyaltyPoints: 2450,
    ...overrides,
  }
}
