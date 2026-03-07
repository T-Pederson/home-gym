import { useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { useAuthStore } from './stores/authStore'
import { refreshToken } from './api/auth'
import { ProtectedRoute, OnboardingRoute } from './components/common/ProtectedRoute'
import { AppShell } from './components/layout/AppShell'
import { LandingPage } from './pages/LandingPage'
import { OnboardingPage } from './pages/OnboardingPage'
import { HomePage } from './pages/HomePage'
import { PlannerPage } from './pages/PlannerPage'
import { ExerciseLibraryPage } from './pages/ExerciseLibraryPage'
import { ProgressPage } from './pages/ProgressPage'
import { ProfilePage } from './pages/ProfilePage'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000,
    },
  },
})

function AuthInitializer({ children }: { children: React.ReactNode }) {
  const { setAuth, clearAuth } = useAuthStore()

  useEffect(() => {
    refreshToken()
      .then((res) => setAuth(res.user, res.access_token))
      .catch(() => clearAuth())
  }, [setAuth, clearAuth])

  return <>{children}</>
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthInitializer>
          <Routes>
            <Route path="/" element={<LandingPage />} />

            <Route element={<OnboardingRoute />}>
              <Route path="/onboarding" element={<OnboardingPage />} />
            </Route>

            <Route element={<ProtectedRoute />}>
              <Route element={<AppShell />}>
                <Route path="/home" element={<HomePage />} />
                <Route path="/planner" element={<PlannerPage />} />
                <Route path="/exercises" element={<ExerciseLibraryPage />} />
                <Route path="/progress" element={<ProgressPage />} />
                <Route path="/profile" element={<ProfilePage />} />
              </Route>
            </Route>
          </Routes>
          <Toaster position="top-center" />
        </AuthInitializer>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
