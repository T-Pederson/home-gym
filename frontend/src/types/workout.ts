import type { Exercise } from './exercise'

export interface WorkoutExerciseItem {
  exercise_id: string
  order: number
  sets: number
  reps: number | null
  duration_seconds: number | null
  target_weight: number | null
  weight_unit: string
  rest_seconds: number
  notes: string | null
  superset_group: string | null
}

export interface WorkoutExerciseDetail extends WorkoutExerciseItem {
  exercise: Exercise | null
}

export interface Workout {
  id: string
  user_id: string
  name: string
  description: string | null
  workout_style: string
  estimated_duration_minutes: number
  target_muscle_groups: string[]
  is_favorited: boolean
  exercises: WorkoutExerciseItem[]
  is_circuit: boolean
  circuit_rounds: number | null
  created_at: string
  updated_at: string
}

export interface WorkoutDetail extends Workout {
  exercises: WorkoutExerciseDetail[]
}

export interface WorkoutListResponse {
  workouts: Workout[]
  total: number
  page: number
  per_page: number
  total_pages: number
}

export interface CreateWorkoutPayload {
  name: string
  description?: string
  workout_style: string
  estimated_duration_minutes: number
  target_muscle_groups: string[]
  exercises: WorkoutExerciseItem[]
  is_circuit: boolean
  circuit_rounds?: number | null
}

// ----- Planner / Generation -----

export interface WeightSuggestion {
  suggested_weight: number | null
  previous_weight: number | null
  weight_unit: string
  note: 'first_time' | 'increase' | 'maintain' | 'endurance'
}

export interface GeneratedExercise {
  exercise: Exercise
  sets: number
  reps: number | null
  duration_seconds: number | null
  rest_seconds: number
  weight_suggestion: WeightSuggestion
}

export interface GeneratedWorkout {
  style: string
  estimated_duration_minutes: number
  effective_duration_minutes: number
  exercises: GeneratedExercise[]
  is_circuit: boolean
  circuit_rounds: number | null
  circuit_set_duration_seconds: number | null
  circuit_rest_seconds: number | null
  circuit_round_rest_seconds: number | null
}

export interface GenerateWorkoutRequest {
  muscle_groups: string[]
  duration_minutes: number
  style: string
  muscle_weights?: Record<string, number>
}

// Editable version of GeneratedExercise — what the user can modify before saving
export interface EditableExercise extends GeneratedExercise {
  sets: number
  reps: number | null
  duration_seconds: number | null
  rest_seconds: number
  weight: number | null       // resolved from suggestion, editable
  weight_unit: string
  use_previous_weight: boolean
  superset_group: string | null
}

// ----- Active Session -----

export interface SessionExercise {
  exercise_id: string
  exercise_name: string
  exercise: Exercise          // full object for ExerciseInfoModal
  order: number
  target_sets: number
  target_reps: number | null
  target_duration_seconds: number | null
  target_weight: number | null
  weight_unit: string
  rest_seconds: number
  superset_group: string | null
}

export interface ActiveSet {
  set_number: number
  reps: number | null
  target_reps: number | null
  duration_seconds: number | null
  target_duration_seconds: number | null
  weight: number | null
  weight_unit: string
  completed: boolean
}

export interface ActiveExercise {
  exercise_id: string
  exercise_name: string
  order: number
  sets: ActiveSet[]
}

export interface WorkoutSession {
  workoutId: string | null         // null = generated but not saved
  workoutName: string
  style: string
  isCircuit: boolean
  circuitRounds: number
  circuitSetDurationSeconds: number
  circuitRestSeconds: number
  circuitRoundRestSeconds: number
  exercises: SessionExercise[]     // read-only targets
  startedAt: string                // ISO timestamp
  activeExercises: ActiveExercise[]  // mutable logged sets
  currentExerciseIndex: number
  currentSetIndex: number          // straight-set mode
  currentRoundIndex: number        // circuit mode
  currentCircuitExerciseIndex: number  // circuit mode
}

// ----- Log Submission -----

export interface CreateLogPayload {
  workout_id: string | null
  name: string
  exercises_performed: {
    exercise_id: string
    exercise_name: string
    order: number
    sets: ActiveSet[]
  }[]
  started_at: string
  completed_at: string
  total_duration_seconds: number
  notes?: string
}

export interface WorkoutLogResponse {
  id: string
  user_id: string
  workout_id: string | null
  name: string
  exercises_performed: ActiveExercise[]
  started_at: string
  completed_at: string | null
  total_duration_seconds: number | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface WorkoutLogListResponse {
  logs: WorkoutLogResponse[]
  total: number
  page: number
  per_page: number
  total_pages: number
}
