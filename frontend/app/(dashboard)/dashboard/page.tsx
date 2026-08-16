'use client'

import React, { useEffect, useState } from 'react'
import { useProtectedRoute } from '@/lib/hooks/useProtectedRoute'
import { useAuth } from '@/lib/hooks/useAuth'
import { useMSWReady } from '@/app/msw-provider'
import OrderCard from './OrderCard'
import QuickActions from './QuickActions'
import StatsCard from './StatsCard'
import ProductCard from './ProductCard'
import type { Order } from '@/lib/types/order'
import type { Product, UserStats } from '@/lib/types/product'

const mockOrders: Order[] = [
  {
    orderId: '1234',
    userId: 1,
    status: 'shipped',
    items: [
      { productId: 1, name: 'Premium Cotton T-Shirt', quantity: 1, price: 44.99 },
      { productId: 2, name: 'Leather Wallet', quantity: 1, price: 45.00 },
    ],
    total: 89.99,
    createdAt: '2026-05-15T10:30:00Z',
    updatedAt: '2026-05-16T14:20:00Z',
  },
  {
    orderId: '1233',
    userId: 1,
    status: 'delivered',
    items: [{ productId: 3, name: 'Sunglasses', quantity: 1, price: 45.50 }],
    total: 45.50,
    createdAt: '2026-05-10T08:15:00Z',
    updatedAt: '2026-05-12T16:45:00Z',
  },
  {
    orderId: '1232',
    userId: 1,
    status: 'pending',
    items: [
      { productId: 4, name: 'Smart Watch', quantity: 1, price: 99.99 },
      { productId: 5, name: 'Phone Case', quantity: 1, price: 18.00 },
      { productId: 6, name: 'Screen Protector', quantity: 1, price: 10.00 },
    ],
    total: 127.99,
    createdAt: '2026-05-18T12:00:00Z',
    updatedAt: '2026-05-18T12:00:00Z',
  },
]

const mockProducts: Product[] = [
  {
    productId: 10,
    name: 'Premium Cotton T-Shirt',
    description: 'Luxuriously soft everyday essential',
    price: 24.99,
    rating: 4.5,
    reviewCount: 234,
    inStock: true,
  },
  {
    productId: 11,
    name: 'Wireless Headphones',
    description: 'Studio-quality sound, premium comfort',
    price: 89.99,
    rating: 4.8,
    reviewCount: 567,
    inStock: true,
  },
]

const mockStats: UserStats = {
  ordersThisMonth: 5,
  totalSpent: 237.50,
  loyaltyPoints: 2450,
}

export default function DashboardPage() {
  useProtectedRoute()

  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const mocksReady = useMSWReady()
  const [orders, setOrders] = useState<Order[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [stats, setStats] = useState<UserStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Don't fetch if not authenticated or still loading auth
    if (!isAuthenticated || authLoading || !mocksReady) {
      return
    }

    async function fetchDashboardData() {
      try {
        setError(null)
        const token = localStorage.getItem('token')

        // Guard against null token
        if (!token) {
          setError('Authentication required')
          setLoading(false)
          return
        }

        const [ordersRes, productsRes, statsRes] = await Promise.all([
          fetch('/api/v1/orders', {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch('/api/v1/products/recommendations', {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch('/api/v1/users/stats', {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ])

        // Check HTTP status before parsing
        if (!ordersRes.ok || !productsRes.ok || !statsRes.ok) {
          throw new Error('Failed to fetch dashboard data. Please try again.')
        }

        const ordersData = await ordersRes.json()
        const productsData = await productsRes.json()
        const statsData = await statsRes.json()

        setOrders(ordersData.orders || [])
        setProducts(productsData.products || [])
        // Validate stats shape before setting
        if (
          statsData &&
          typeof statsData.ordersThisMonth === 'number' &&
          typeof statsData.totalSpent === 'number' &&
          typeof statsData.loyaltyPoints === 'number'
        ) {
          setStats(statsData)
        } else {
          throw new Error('Invalid dashboard stats response')
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error)
        if (process.env.NODE_ENV === 'development') {
          setOrders(mockOrders)
          setProducts(mockProducts)
          setStats(mockStats)
          return
        }
        setError(error instanceof Error ? error.message : 'Failed to load dashboard data')
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [isAuthenticated, authLoading, mocksReady])

  if (loading || authLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="text-center">Loading...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-600 font-semibold mb-2">Error Loading Dashboard</p>
          <p className="text-red-500 text-sm mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  const userName = user?.email?.split('@')[0] || 'there'

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Welcome Section */}
      <div className="mb-12 animate-fade-in-up">
        <div className="flex items-end justify-between">
          <div>
            <h1 className="font-display text-5xl font-bold mb-3 bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
              Welcome back, {userName}
            </h1>
            <p className="text-lg text-gray-600">Your personalized luxury shopping experience</p>
          </div>
          <div className="hidden lg:block">
            <div className="text-right">
              <div className="text-sm text-gray-500">Member since</div>
              <div className="font-display text-2xl font-bold text-gray-900">Jan 2026</div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mb-12">
        <QuickActions />
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-10">
        {/* Left Column (Main Content) */}
        <div className="lg:col-span-2 space-y-10">
          {/* Recent Orders */}
          <section className="animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <div className="flex items-center justify-between mb-8">
              <h2 className="font-display text-3xl font-bold text-gray-900">Recent Orders</h2>
              <a
                href="/orders"
                className="text-sm font-bold text-gray-700 hover:text-accent transition-colors flex items-center gap-2"
              >
                View All
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </a>
            </div>
            <div className="space-y-6">
              {orders.map((order) => (
                <OrderCard key={order.orderId} order={order} />
              ))}
            </div>
          </section>

          {/* Recommended Products */}
          <section className="animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
            <div className="flex items-center justify-between mb-8">
              <h2 className="font-display text-3xl font-bold text-gray-900">Curated for You</h2>
              <a
                href="/products"
                className="text-sm font-bold text-gray-700 hover:text-accent transition-colors flex items-center gap-2"
              >
                Browse More
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </a>
            </div>
            <div className="grid sm:grid-cols-2 gap-8">
              {products.map((product) => (
                <ProductCard key={product.productId} product={product} />
              ))}
            </div>
          </section>
        </div>

        {/* Right Sidebar */}
        <aside className="space-y-8 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
          {stats && <StatsCard stats={stats} />}
        </aside>
      </div>
    </div>
  )
}
