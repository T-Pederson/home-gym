import client from './client'
import type {
  CreateWorkoutPayload,
  Workout,
  WorkoutDetail,
  WorkoutListResponse,
} from '../types/workout'

interface ListWorkoutsParams {
  style?: string
  favorites_only?: boolean
  page?: number
  per_page?: number
}

export async function getWorkouts(params: ListWorkoutsParams = {}): Promise<WorkoutListResponse> {
  const { data } = await client.get<WorkoutListResponse>('/workouts', { params })
  return data
}

export async function getWorkout(id: string): Promise<WorkoutDetail> {
  const { data } = await client.get<WorkoutDetail>(`/workouts/${id}`)
  return data
}

export async function createWorkout(payload: CreateWorkoutPayload): Promise<Workout> {
  const { data } = await client.post<Workout>('/workouts', payload)
  return data
}

export async function updateWorkout(
  id: string,
  payload: Partial<CreateWorkoutPayload> & { is_favorited?: boolean }
): Promise<Workout> {
  const { data } = await client.put<Workout>(`/workouts/${id}`, payload)
  return data
}

export async function deleteWorkout(id: string): Promise<void> {
  await client.delete(`/workouts/${id}`)
}

export async function toggleFavorite(id: string): Promise<Workout> {
  const { data } = await client.post<Workout>(`/workouts/${id}/favorite`)
  return data
}
