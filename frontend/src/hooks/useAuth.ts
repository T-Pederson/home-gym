import { useCallback } from 'react'
import { useNavigate } from 'react-router'
import { useQueryClient } from '@tanstack/react-query'
import * as authApi from '../api/auth'
import { useAuthStore } from '../stores/authStore'
import type { LoginRequest, SignupRequest } from '../types/api'

export function useAuth() {
  const { user, isLoading, setAuth, clearAuth } = useAuthStore()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const handleSignup = useCallback(
    async (data: SignupRequest) => {
      const response = await authApi.signup(data)
      setAuth(response.user, response.access_token)
      navigate(response.user.onboarding_completed ? '/home' : '/onboarding')
    },
    [setAuth, navigate]
  )

  const handleLogin = useCallback(
    async (data: LoginRequest) => {
      const response = await authApi.login(data)
      setAuth(response.user, response.access_token)
      navigate(response.user.onboarding_completed ? '/home' : '/onboarding')
    },
    [setAuth, navigate]
  )

  const handleLogout = useCallback(async () => {
    await authApi.logout()
    queryClient.clear()
    clearAuth()
    navigate('/')
  }, [clearAuth, navigate, queryClient])

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    signup: handleSignup,
    login: handleLogin,
    logout: handleLogout,
  }
}
