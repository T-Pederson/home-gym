import client from './client'
import type { CreateLogPayload, WorkoutLogListResponse, WorkoutLogResponse } from '../types/workout'

export async function createLog(payload: CreateLogPayload): Promise<WorkoutLogResponse> {
  const { data } = await client.post<WorkoutLogResponse>('/logs', payload)
  return data
}

export async function getLogs(params: { page?: number; per_page?: number } = {}): Promise<WorkoutLogListResponse> {
  const { data } = await client.get<WorkoutLogListResponse>('/logs', { params })
  return data
}

export async function getLog(id: string): Promise<WorkoutLogResponse> {
  const { data } = await client.get<WorkoutLogResponse>(`/logs/${id}`)
  return data
}

export async function deleteLog(id: string): Promise<void> {
  await client.delete(`/logs/${id}`)
}
