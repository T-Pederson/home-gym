import client from './client'
import type { GeneratedWorkout, GenerateWorkoutRequest } from '../types/workout'

export async function generateWorkout(
  payload: GenerateWorkoutRequest
): Promise<GeneratedWorkout> {
  const { data } = await client.post<GeneratedWorkout>('/planner/generate', payload)
  return data
}
