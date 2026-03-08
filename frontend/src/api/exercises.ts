import client from "./client";
import type {
  Exercise,
  ExerciseCreate,
  ExerciseFilters,
  ExerciseListResponse,
  ExerciseMetadata,
} from "../types/exercise";

export async function getExercises(
  filters: Partial<ExerciseFilters> & { page?: number; per_page?: number }
): Promise<ExerciseListResponse> {
  const params: Record<string, string | number | boolean> = {};
  if (filters.q) params.q = filters.q;
  if (filters.muscle_group) params.muscle_group = filters.muscle_group;
  if (filters.equipment) params.equipment = filters.equipment;
  if (filters.category) params.category = filters.category;
  if (filters.level) params.level = filters.level;
  if (filters.custom_only) params.custom_only = true;
  if (filters.page) params.page = filters.page;
  if (filters.per_page) params.per_page = filters.per_page;

  const { data } = await client.get<ExerciseListResponse>("/exercises", {
    params,
  });
  return data;
}

export async function getExercise(id: string): Promise<Exercise> {
  const { data } = await client.get<Exercise>(`/exercises/${id}`);
  return data;
}

export async function getExerciseMetadata(): Promise<ExerciseMetadata> {
  const { data } = await client.get<ExerciseMetadata>("/exercises/metadata");
  return data;
}

export async function createExercise(payload: ExerciseCreate): Promise<Exercise> {
  const { data } = await client.post<Exercise>("/exercises", payload);
  return data;
}

export async function updateExercise(
  id: string,
  payload: Partial<ExerciseCreate>
): Promise<Exercise> {
  const { data } = await client.put<Exercise>(`/exercises/${id}`, payload);
  return data;
}

export async function deleteExercise(id: string): Promise<void> {
  await client.delete(`/exercises/${id}`);
}

export interface LikeDislikeResponse {
  liked_exercises: string[];
  disliked_exercises: string[];
}

export async function likeExercise(id: string): Promise<LikeDislikeResponse> {
  const { data } = await client.post<LikeDislikeResponse>(
    `/users/me/exercises/${id}/like`
  );
  return data;
}

export async function removeLike(id: string): Promise<LikeDislikeResponse> {
  const { data } = await client.delete<LikeDislikeResponse>(
    `/users/me/exercises/${id}/like`
  );
  return data;
}

export async function dislikeExercise(id: string): Promise<LikeDislikeResponse> {
  const { data } = await client.post<LikeDislikeResponse>(
    `/users/me/exercises/${id}/dislike`
  );
  return data;
}

export async function removeDislike(id: string): Promise<LikeDislikeResponse> {
  const { data } = await client.delete<LikeDislikeResponse>(
    `/users/me/exercises/${id}/dislike`
  );
  return data;
}
