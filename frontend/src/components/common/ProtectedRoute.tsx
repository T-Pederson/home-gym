import { Navigate, Outlet } from 'react-router'
import { useAuthStore } from '../../stores/authStore'

export function ProtectedRoute() {
  const { user, isLoading } = useAuthStore()

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/" replace />
  }

  if (!user.onboarding_completed) {
    return <Navigate to="/onboarding" replace />
  }

  return <Outlet />
}

export function OnboardingRoute() {
  const { user, isLoading } = useAuthStore()

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/" replace />
  }

  if (user.onboarding_completed) {
    return <Navigate to="/home" replace />
  }

  return <Outlet />
}
