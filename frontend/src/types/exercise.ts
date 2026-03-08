export interface Exercise {
  id: string;
  source_id: string | null;
  name: string;
  aliases: string[];
  force: string | null;
  level: string | null;
  mechanic: string | null;
  equipment: string | null;
  primary_muscles: string[];
  secondary_muscles: string[];
  instructions: string[];
  images: string[];
  category: string;
  is_custom: boolean;
  created_by: string | null;
  is_time_based: boolean;
}

export interface ExerciseListResponse {
  exercises: Exercise[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export interface ExerciseMetadata {
  muscles: string[];
  equipment: string[];
  categories: string[];
  levels: string[];
}

export interface ExerciseFilters {
  q: string;
  muscle_group: string;
  equipment: string;
  category: string;
  level: string;
  custom_only: boolean;
}

export interface ExerciseCreate {
  name: string;
  force?: string;
  level?: string;
  mechanic?: string;
  equipment?: string;
  primary_muscles: string[];
  secondary_muscles?: string[];
  instructions?: string[];
  category: string;
  is_time_based: boolean;
}

// User-facing muscle group labels → displayed in filter UI
export const MUSCLE_GROUP_LABELS = [
  { label: "Back", value: "back" },
  { label: "Biceps", value: "biceps" },
  { label: "Chest", value: "chest" },
  { label: "Core", value: "core" },
  { label: "Legs", value: "legs" },
  { label: "Shoulders", value: "shoulders" },
  { label: "Triceps", value: "triceps" },
  { label: "Cardio", value: "cardio" },
] as const;

export const IMAGE_BASE_URL =
  "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/";
