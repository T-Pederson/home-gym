export interface HeightWeight {
  value: number
  unit: string
}

export interface UserProfile {
  name: string
  height: HeightWeight | null
  weight: HeightWeight | null
  preferred_units: string
}

export interface WorkoutPreferences {
  default_duration_minutes: number
  preferred_style: string
  preferred_muscle_groups: string[]
  experience_level: string
}

export interface User {
  id: string
  username: string
  onboarding_completed: boolean
}

export interface FullUser extends User {
  profile: UserProfile
  equipment_owned: string[]
  workout_preferences: WorkoutPreferences
  liked_exercises: string[]
  disliked_exercises: string[]
}
