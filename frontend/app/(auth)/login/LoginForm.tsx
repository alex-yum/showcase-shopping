'use client'

import React, { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { loginSchema } from '@/lib/utils/validators'
import { authApi } from '@/lib/api/auth'
import { useAuth } from '@/lib/hooks/useAuth'
import type { LoginRequest } from '@/lib/types/auth'

function LoginFormInner() {
  const [showPassword, setShowPassword] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { setSession } = useAuth()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginRequest & { rememberMe: boolean }>({
    resolver: zodResolver(loginSchema),
    mode: 'onBlur',
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  })

  const onSubmit = async (data: LoginRequest & { rememberMe: boolean }) => {
    try {
      setApiError(null)

      // Call auth API
      const response = await authApi.login({
        email: data.email,
        password: data.password,
      })

      // Update auth context (no double API call)
      setSession(response)

      // Validate returnTo is a relative path (prevent open redirect)
      const returnTo = searchParams.get('returnTo') || '/dashboard'
      const safeReturnTo = returnTo.startsWith('/') && !returnTo.startsWith('//') && !returnTo.startsWith('/\\')
        ? returnTo
        : '/dashboard'

      router.push(safeReturnTo)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed. Please try again.'
      setApiError(errorMessage)
    }
  }

  return (
    <div className="bg-surface/40 backdrop-blur-xl border border-accent/10 rounded-2xl p-8 shadow-2xl animate-scale-in">
      <div className="mb-8">
        <h2 className="font-display text-3xl font-bold text-white mb-2">
          Sign In
        </h2>
        <p className="font-body text-sm text-gray-400">
          Enter your credentials to access your account
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* API Error Banner */}
        {apiError && (
          <div
            className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 animate-fade-in-up"
            role="alert"
          >
            <p className="font-body text-sm text-red-400">{apiError}</p>
          </div>
        )}

        {/* Email field */}
        <div>
          <label htmlFor="email" className="block font-body text-sm font-medium text-gray-300 mb-2">
            Email Address
          </label>
          <Input
            type="email"
            id="email"
            {...register('email')}
            placeholder="you@example.com"
            disabled={isSubmitting}
            className="w-full"
          />
          {errors.email && (
            <p className="mt-1 font-body text-sm text-red-400" role="alert" aria-live="polite">
              {errors.email.message}
            </p>
          )}
        </div>

        {/* Password field */}
        <div>
          <label htmlFor="password" className="block font-body text-sm font-medium text-gray-300 mb-2">
            Password
          </label>
          <div className="relative">
            <Input
              type={showPassword ? 'text' : 'password'}
              id="password"
              {...register('password')}
              placeholder="••••••••"
              disabled={isSubmitting}
              className="w-full pr-12"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-accent/50 rounded"
              aria-label="Toggle password visibility"
              disabled={isSubmitting}
            >
              {showPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>
          {errors.password && (
            <p className="mt-1 font-body text-sm text-red-400" role="alert" aria-live="polite">
              {errors.password.message}
            </p>
          )}
        </div>

        {/* Remember me checkbox */}
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="rememberMe"
              {...register('rememberMe')}
              className="w-4 h-4 text-accent bg-surface border-accent/20 rounded focus:ring-accent/50 focus:ring-2 disabled:opacity-50"
              disabled={isSubmitting}
            />
            <label htmlFor="rememberMe" className="ml-2 font-body text-sm text-gray-300">
              Remember me
            </label>
          </div>
          <a
            href="/forgot-password"
            className="font-body text-sm text-accent hover:text-accent-light transition-colors"
          >
            Forgot password?
          </a>
        </div>

        {/* Submit button */}
        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? 'Signing in...' : 'Sign In'}
        </Button>

        {/* Social auth (static, coming soon) */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-accent/10" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 font-body text-gray-400 bg-surface/40">
              Or continue with
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            disabled
            className="flex items-center justify-center px-4 py-2 border border-accent/10 rounded-lg font-body text-sm text-gray-400 bg-surface/20 cursor-not-allowed opacity-50"
          >
            <span className="mr-2">🔒</span> Google (Soon)
          </button>
          <button
            type="button"
            disabled
            className="flex items-center justify-center px-4 py-2 border border-accent/10 rounded-lg font-body text-sm text-gray-400 bg-surface/20 cursor-not-allowed opacity-50"
          >
            <span className="mr-2">🔒</span> Apple (Soon)
          </button>
        </div>

        {/* Sign up link */}
        <p className="text-center font-body text-sm text-gray-400">
          Don&apos;t have an account?{' '}
          <a href="/signup" className="text-accent hover:text-accent-light transition-colors font-medium">
            Sign up
          </a>
        </p>
      </form>
    </div>
  )
}

export default function LoginForm() {
  return (
    <React.Suspense fallback={
      <div className="bg-surface/40 backdrop-blur-xl border border-accent/10 rounded-2xl p-8 shadow-2xl animate-scale-in">
        <div className="mb-8">
          <h2 className="font-display text-3xl font-bold text-white mb-2">
            Sign In
          </h2>
          <p className="font-body text-sm text-gray-400">
            Loading...
          </p>
        </div>
      </div>
    }>
      <LoginFormInner />
    </React.Suspense>
  )
}
