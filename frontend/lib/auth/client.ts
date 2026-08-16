import type { LoginResponse, User } from '@/lib/types/auth'

const TOKEN_KEY = 'token'
const USER_KEY = 'user'

export const authClient = {
  login(response: LoginResponse): void {
    if (typeof window === 'undefined') return

    localStorage.setItem(TOKEN_KEY, response.accessToken)
    localStorage.setItem(
      USER_KEY,
      JSON.stringify({
        userId: response.userId,
        email: response.email,
      })
    )
  },

  getToken(): string | null {
    if (typeof window === 'undefined') return null
    return localStorage.getItem(TOKEN_KEY)
  },

  getUser(): User | null {
    if (typeof window === 'undefined') return null
    const userData = localStorage.getItem(USER_KEY)
    if (!userData) return null

    try {
      return JSON.parse(userData) as User
    } catch {
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(USER_KEY)
      return null
    }
  },

  isAuthenticated(): boolean {
    return this.getToken() !== null
  },

  logout(): void {
    if (typeof window === 'undefined') return
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
  },
}
