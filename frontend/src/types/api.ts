import type { User } from './user'

export interface AuthResponse {
  access_token: string
  token_type: string
  user: User
}

export interface SignupRequest {
  username: string
  password: string
}

export interface LoginRequest {
  username: string
  password: string
}
