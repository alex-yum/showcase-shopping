import { API_CONFIG } from './config'

export class ApiError extends Error {
  constructor(
    public status: number,
    public data: unknown,
    message?: string
  ) {
    super(message || 'API Error')
    this.name = 'ApiError'
  }
}

export class ApiClient {
  private baseURL: string

  constructor(baseURL: string = API_CONFIG.baseURL) {
    this.baseURL = baseURL
  }

  async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${this.baseURL}${endpoint}`

    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    })

    const data = await this.parseResponse(response)

    if (!response.ok) {
      const message =
        data &&
        typeof data === 'object' &&
        'message' in data &&
        typeof data.message === 'string'
          ? data.message
          : undefined
      throw new ApiError(response.status, data, message)
    }

    return data as T
  }

  private async parseResponse(response: Response): Promise<unknown> {
    const text = await response.text()

    if (!text) {
      return null
    }

    try {
      return JSON.parse(text)
    } catch {
      return text
    }
  }

  async get<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'GET',
    })
  }

  async post<T>(endpoint: string, body?: unknown, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      ...(body !== undefined && { body: JSON.stringify(body) }),
    })
  }
}

export const apiClient = new ApiClient()
