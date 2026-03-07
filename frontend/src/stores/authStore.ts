import { create } from 'zustand'
import type { User } from '../types/user'

interface AuthState {
  user: User | null
  accessToken: string | null
  isLoading: boolean
  setAuth: (user: User, accessToken: string) => void
  clearAuth: () => void
  setLoading: (loading: boolean) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  isLoading: true,
  setAuth: (user, accessToken) => set({ user, accessToken, isLoading: false }),
  clearAuth: () => set({ user: null, accessToken: null, isLoading: false }),
  setLoading: (isLoading) => set({ isLoading }),
}))
