import React from 'react'
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import OrderCard from '@/app/(dashboard)/dashboard/OrderCard'
import type { Order } from '@/lib/types/order'

describe('OrderCard', () => {
  const mockOrder: Order = {
    orderId: '1234',
    userId: 1,
    status: 'shipped',
    items: [
      { productId: 1, name: 'T-Shirt', quantity: 1, price: 44.99 },
      { productId: 2, name: 'Wallet', quantity: 1, price: 45.00 },
    ],
    total: 89.99,
    createdAt: '2026-05-15T10:30:00Z',
    updatedAt: '2026-05-16T14:20:00Z',
  }

  it('renders order number', () => {
    render(<OrderCard order={mockOrder} />)
    expect(screen.getByText(/Order #1234/i)).toBeInTheDocument()
  })

  it('renders order date', () => {
    render(<OrderCard order={mockOrder} />)
    expect(screen.getByText(/may 15, 2026/i)).toBeInTheDocument()
  })

  it('renders shipped status badge', () => {
    render(<OrderCard order={mockOrder} />)
    expect(screen.getByText('Shipped')).toBeInTheDocument()
  })

  it('renders item count', () => {
    render(<OrderCard order={mockOrder} />)
    expect(screen.getByText('2')).toBeInTheDocument()
  })

  it('renders total price', () => {
    render(<OrderCard order={mockOrder} />)
    expect(screen.getByText('$89.99')).toBeInTheDocument()
  })

  it('renders Track Order button for shipped orders', () => {
    render(<OrderCard order={mockOrder} />)
    expect(screen.getByRole('button', { name: /track order/i })).toBeInTheDocument()
  })

  it('renders Buy Again button for delivered orders', () => {
    const deliveredOrder = { ...mockOrder, status: 'delivered' as const }
    render(<OrderCard order={deliveredOrder} />)
    expect(screen.getByRole('button', { name: /buy again/i })).toBeInTheDocument()
  })

  it('renders Complete Payment button for pending orders', () => {
    const pendingOrder = { ...mockOrder, status: 'pending' as const }
    render(<OrderCard order={pendingOrder} />)
    expect(screen.getByRole('button', { name: /complete payment/i })).toBeInTheDocument()
  })

  it('renders cancelled status without action buttons', () => {
    const cancelledOrder = { ...mockOrder, status: 'cancelled' as const }
    render(<OrderCard order={cancelledOrder} />)

    expect(screen.getByText('Cancelled')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /track order/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /buy again/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /complete payment/i })).not.toBeInTheDocument()
  })

  it('falls back to pending badge for unknown statuses without pending actions', () => {
    const unknownOrder = { ...mockOrder, status: 'returned' as never }
    render(<OrderCard order={unknownOrder} />)

    expect(screen.getByText('Pending')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /complete payment/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /cancel/i })).not.toBeInTheDocument()
  })
})
