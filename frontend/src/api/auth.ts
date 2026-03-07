import type { AuthResponse, LoginRequest, SignupRequest } from '../types/api'
import client from './client'

export async function signup(data: SignupRequest): Promise<AuthResponse> {
  const response = await client.post<AuthResponse>('/auth/signup', data)
  return response.data
}

export async function login(data: LoginRequest): Promise<AuthResponse> {
  const response = await client.post<AuthResponse>('/auth/login', data)
  return response.data
}

export async function refreshToken(): Promise<AuthResponse> {
  const response = await client.post<AuthResponse>('/auth/refresh')
  return response.data
}

export async function logout(): Promise<void> {
  await client.post('/auth/logout')
}
