import type { FullUser, HeightWeight } from '../types/user'
import client from './client'

// --- Profile ---

export async function getProfile(): Promise<FullUser> {
  const { data } = await client.get<FullUser>('/users/me')
  return data
}

export async function updateProfile(body: {
  name?: string
  height?: HeightWeight
  weight?: HeightWeight
  preferred_units?: string
}): Promise<FullUser> {
  const { data } = await client.put<FullUser>('/users/me', body)
  return data
}

export async function updateEquipment(equipment_owned: string[]): Promise<FullUser> {
  const { data } = await client.put<FullUser>('/users/me/equipment', { equipment_owned })
  return data
}

export async function updatePreferences(body: {
  default_duration_minutes?: number
  preferred_style?: string
  preferred_muscle_groups?: string[]
  experience_level?: string
}): Promise<FullUser> {
  const { data } = await client.put<FullUser>('/users/me/preferences', body)
  return data
}

// --- Body Weight ---

export interface BodyWeightEntry {
  id: string
  weight: number
  unit: string
  recorded_at: string
}

export async function logBodyWeight(body: {
  weight: number
  unit: string
}): Promise<BodyWeightEntry> {
  const { data } = await client.post<BodyWeightEntry>('/users/me/weight', body)
  return data
}

export async function getBodyWeightHistory(limit = 30): Promise<BodyWeightEntry[]> {
  const { data } = await client.get<BodyWeightEntry[]>('/users/me/weight', {
    params: { limit },
  })
  return data
}

export async function deleteBodyWeightEntry(id: string): Promise<void> {
  await client.delete(`/users/me/weight/${id}`)
}
