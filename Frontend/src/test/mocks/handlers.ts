import { http, HttpResponse } from 'msw'

const API_BASE_URL = 'http://localhost:3000/api'

export const handlers = [
  // Auth endpoints
  http.post(`${API_BASE_URL}/auth/login`, async ({ request }) => {
    const { email, password } = await request.json() as any

    if (email === 'test@example.com' && password === 'password123') {
      return HttpResponse.json({
        access_token: 'mock-access-token',
        refresh_token: 'mock-refresh-token',
      })
    }

    return HttpResponse.json(
      { message: 'Invalid credentials' },
      { status: 401 }
    )
  }),

  http.post(`${API_BASE_URL}/auth/register`, async ({ request }) => {
    const userData = await request.json() as any

    return HttpResponse.json({
      access_token: 'mock-access-token',
      refresh_token: 'mock-refresh-token',
      user: {
        id: '1',
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        roles: ['ROLE_READER'],
      },
    })
  }),

  http.post(`${API_BASE_URL}/auth/refresh`, async ({ request }) => {
    const { refresh_token } = await request.json() as any

    if (refresh_token === 'mock-refresh-token') {
      return HttpResponse.json({
        access_token: 'new-mock-access-token',
        refresh_token: 'new-mock-refresh-token',
      })
    }

    return HttpResponse.json(
      { message: 'Invalid refresh token' },
      { status: 401 }
    )
  }),

  http.get(`${API_BASE_URL}/auth/profile`, ({ request }) => {
    const authHeader = request.headers.get('Authorization')

    if (authHeader?.includes('mock-access-token')) {
      return HttpResponse.json({
        id: '1',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        roles: ['ROLE_READER'],
        affiliation: 'Test University',
      })
    }

    return HttpResponse.json(
      { message: 'Unauthorized' },
      { status: 401 }
    )
  }),

  http.post(`${API_BASE_URL}/auth/logout`, () => {
    return HttpResponse.json({ message: 'Logged out successfully' })
  }),

  // Publications endpoints
  http.get(`${API_BASE_URL}/publications`, () => {
    return HttpResponse.json([
      {
        id: '1',
        title: 'Test Publication',
        abstract: 'Test abstract',
        status: 'PUBLISHED',
        type: 'ARTICLE',
        createdAt: '2024-01-01T00:00:00Z',
      },
    ])
  }),

  http.post(`${API_BASE_URL}/publications`, () => {
    return HttpResponse.json({
      id: '2',
      title: 'New Publication',
      abstract: 'New abstract',
      status: 'DRAFT',
      type: 'ARTICLE',
      createdAt: new Date().toISOString(),
    })
  }),

  // Catalog endpoints
  http.get(`${API_BASE_URL}/catalog/search`, ({ request }) => {
    const url = new URL(request.url)
    const query = url.searchParams.get('q')

    return HttpResponse.json({
      publications: [
        {
          id: '1',
          title: `Search result for: ${query}`,
          abstract: 'Test search result',
          status: 'PUBLISHED',
          type: 'ARTICLE',
        },
      ],
      total: 1,
      page: 1,
      limit: 10,
    })
  }),

  // Notifications endpoints
  http.get(`${API_BASE_URL}/notifications`, ({ request }) => {
    const authHeader = request.headers.get('Authorization')

    if (authHeader?.includes('mock-access-token')) {
      return HttpResponse.json([
        {
          id: '1',
          type: 'INFO',
          title: 'Test Notification',
          message: 'This is a test notification',
          read: false,
          createdAt: '2024-01-01T00:00:00Z',
        },
      ])
    }

    return HttpResponse.json(
      { message: 'Unauthorized' },
      { status: 401 }
    )
  }),
]