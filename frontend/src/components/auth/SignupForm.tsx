import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '../../hooks/useAuth'
import { useState } from 'react'

const signupSchema = z
  .object({
    username: z
      .string()
      .min(3, 'Username must be at least 3 characters')
      .max(30, 'Username must be 30 characters or less')
      .regex(/^[a-zA-Z0-9_]+$/, 'Only letters, numbers, and underscores'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

type SignupValues = z.infer<typeof signupSchema>

export function SignupForm({ onSwitch }: { onSwitch: () => void }) {
  const { signup } = useAuth()
  const [error, setError] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupValues>({
    resolver: zodResolver(signupSchema),
  })

  const onSubmit = async (data: SignupValues) => {
    setError('')
    try {
      await signup({ username: data.username, password: data.password })
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Signup failed')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label htmlFor="signup-username" className="block text-sm font-medium text-gray-700">
          Username
        </label>
        <input
          id="signup-username"
          type="text"
          autoComplete="username"
          {...register('username')}
          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
        />
        {errors.username && (
          <p className="mt-1 text-sm text-red-600">{errors.username.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="signup-password" className="block text-sm font-medium text-gray-700">
          Password
        </label>
        <input
          id="signup-password"
          type="password"
          autoComplete="new-password"
          {...register('password')}
          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
        />
        {errors.password && (
          <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="signup-confirm" className="block text-sm font-medium text-gray-700">
          Confirm Password
        </label>
        <input
          id="signup-confirm"
          type="password"
          autoComplete="new-password"
          {...register('confirmPassword')}
          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
        />
        {errors.confirmPassword && (
          <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none disabled:opacity-50"
      >
        {isSubmitting ? 'Creating account...' : 'Create account'}
      </button>

      <p className="text-center text-sm text-gray-600">
        Already have an account?{' '}
        <button type="button" onClick={onSwitch} className="font-semibold text-blue-600 hover:text-blue-700">
          Log in
        </button>
      </p>
    </form>
  )
}
