import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { Dumbbell } from 'lucide-react'
import { LoginForm } from '../components/auth/LoginForm'
import { SignupForm } from '../components/auth/SignupForm'
import { useAuthStore } from '../stores/authStore'

export function LandingPage() {
  const [showSignup, setShowSignup] = useState(false)
  const { user, isLoading } = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => {
    if (!isLoading && user) {
      navigate(user.onboarding_completed ? '/home' : '/onboarding', { replace: true })
    }
  }, [user, isLoading, navigate])

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 shadow-lg">
            <Dumbbell className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Home Gym</h1>
          <p className="mt-2 text-gray-600">
            Your personal trainer, right in your pocket.
          </p>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-xl">
          <h2 className="mb-6 text-center text-xl font-semibold text-gray-900">
            {showSignup ? 'Create your account' : 'Welcome back'}
          </h2>

          {showSignup ? (
            <SignupForm onSwitch={() => setShowSignup(false)} />
          ) : (
            <LoginForm onSwitch={() => setShowSignup(true)} />
          )}
        </div>

        <div className="mt-8 space-y-3 text-center text-sm text-gray-500">
          <p>Plan workouts tailored to your equipment and goals</p>
          <p>Track progress with detailed analytics</p>
          <p>Never wonder what to do at the gym again</p>
        </div>
      </div>
    </div>
  )
}
