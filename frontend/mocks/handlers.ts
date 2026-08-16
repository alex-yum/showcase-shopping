import { http, HttpResponse } from 'msw'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || ''

export const handlers = [
  // Auth: Login
  http.post(`${API_BASE}/api/v1/auth/login`, async ({ request }) => {
    const body = await request.json() as Record<string, unknown>
    const email = body.email as string
    const password = body.password as string

    if (email === 'test@example.com' && password === 'Test123!@#') {
      return HttpResponse.json({
        accessToken: 'mock-jwt-token-12345',
        tokenType: 'Bearer',
        expiresIn: 86400000,
        userId: 1,
        email: 'test@example.com',
      })
    }

    if (email === 'locked@example.com' && password === 'Test123!@#') {
      return HttpResponse.json(
        {
          status: 423,
          error: 'Locked',
          message: 'Account is temporarily locked due to too many login attempts',
          lockoutTimeRemaining: 900000,
        },
        { status: 423 }
      )
    }

    return HttpResponse.json(
      {
        status: 401,
        error: 'Unauthorized',
        message: 'Invalid credentials',
      },
      { status: 401 }
    )
  }),

  // Auth: Logout
  http.post(`${API_BASE}/api/v1/auth/logout`, () => {
    return HttpResponse.json({
      message: 'Logged out successfully',
    })
  }),

  // Auth: Validate
  http.get(`${API_BASE}/api/v1/auth/validate`, ({ request }) => {
    const authHeader = request.headers.get('Authorization')

    if (authHeader?.startsWith('Bearer mock-jwt-token')) {
      return HttpResponse.json({
        valid: true,
        userId: 1,
        email: 'test@example.com',
      })
    }

    return HttpResponse.json(
      {
        valid: false,
        error: 'Invalid or expired token',
      },
      { status: 401 }
    )
  }),

  // Orders: Get user orders
  http.get(`${API_BASE}/api/v1/orders`, ({ request }) => {
    const authHeader = request.headers.get('Authorization')

    if (!authHeader?.startsWith('Bearer mock-jwt-token')) {
      return HttpResponse.json(
        { status: 401, error: 'Unauthorized', message: 'Invalid or missing token' },
        { status: 401 }
      )
    }

    return HttpResponse.json({
      orders: [
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
          items: [
            { productId: 3, name: 'Sunglasses', quantity: 1, price: 45.50 },
          ],
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
      ],
    })
  }),

  // Products: Get recommendations
  http.get(`${API_BASE}/api/v1/products/recommendations`, ({ request }) => {
    const authHeader = request.headers.get('Authorization')

    if (!authHeader?.startsWith('Bearer mock-jwt-token')) {
      return HttpResponse.json(
        { status: 401, error: 'Unauthorized', message: 'Invalid or missing token' },
        { status: 401 }
      )
    }

    return HttpResponse.json({
      products: [
        {
          productId: 10,
          name: 'Premium Cotton T-Shirt',
          description: 'Luxuriously soft everyday essential',
          price: 24.99,
          rating: 4.5,
          reviewCount: 234,
          imageUrl: null,
          inStock: true,
        },
        {
          productId: 11,
          name: 'Wireless Headphones',
          description: 'Studio-quality sound, premium comfort',
          price: 89.99,
          rating: 4.8,
          reviewCount: 567,
          imageUrl: null,
          inStock: true,
        },
      ],
    })
  }),

  // User Stats
  http.get(`${API_BASE}/api/v1/users/stats`, ({ request }) => {
    const authHeader = request.headers.get('Authorization')

    if (!authHeader?.startsWith('Bearer mock-jwt-token')) {
      return HttpResponse.json(
        { status: 401, error: 'Unauthorized', message: 'Invalid or missing token' },
        { status: 401 }
      )
    }

    return HttpResponse.json({
      ordersThisMonth: 5,
      totalSpent: 237.50,
      loyaltyPoints: 2450,
    })
  }),
]

// Named failure scenarios for adversarial testing of dashboard fetch error paths.
// Apply with `server.use(errorHandlers.ordersServerError)` etc. in individual tests.
export const errorHandlers = {
  ordersNetworkError: http.get(`${API_BASE}/api/v1/orders`, () => HttpResponse.error()),
  ordersServerError: http.get(`${API_BASE}/api/v1/orders`, () =>
    HttpResponse.json({ status: 500, error: 'Internal Server Error' }, { status: 500 })
  ),
  productsServerError: http.get(`${API_BASE}/api/v1/products/recommendations`, () =>
    HttpResponse.json({ status: 500, error: 'Internal Server Error' }, { status: 500 })
  ),
  statsServerError: http.get(`${API_BASE}/api/v1/users/stats`, () =>
    HttpResponse.json({ status: 500, error: 'Internal Server Error' }, { status: 500 })
  ),
}
