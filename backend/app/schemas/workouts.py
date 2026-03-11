from datetime import datetime
from typing import Optional

from pydantic import BaseModel, field_validator

from app.schemas.exercises import ExerciseResponse


class WorkoutExerciseItemSchema(BaseModel):
    exercise_id: str
    order: int
    sets: int
    reps: Optional[int] = None
    duration_seconds: Optional[int] = None
    target_weight: Optional[float] = None
    weight_unit: str = "lbs"
    rest_seconds: int = 60
    notes: Optional[str] = None
    superset_group: Optional[str] = None


class WorkoutExerciseDetail(WorkoutExerciseItemSchema):
    """Exercise item with full exercise details embedded (for GET responses)."""
    exercise: Optional[ExerciseResponse] = None


class CreateWorkoutRequest(BaseModel):
    name: str
    description: Optional[str] = None
    workout_style: str
    estimated_duration_minutes: int
    target_muscle_groups: list[str] = []
    exercises: list[WorkoutExerciseItemSchema]
    is_circuit: bool = False
    circuit_rounds: Optional[int] = None

    @field_validator("name")
    @classmethod
    def name_not_empty(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Name cannot be empty")
        return v

    @field_validator("exercises")
    @classmethod
    def at_least_one_exercise(cls, v: list) -> list:
        if not v:
            raise ValueError("Workout must have at least one exercise")
        return v


class UpdateWorkoutRequest(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    workout_style: Optional[str] = None
    estimated_duration_minutes: Optional[int] = None
    target_muscle_groups: Optional[list[str]] = None
    exercises: Optional[list[WorkoutExerciseItemSchema]] = None
    is_circuit: Optional[bool] = None
    circuit_rounds: Optional[int] = None
    is_favorited: Optional[bool] = None


class WorkoutResponse(BaseModel):
    id: str
    user_id: str
    name: str
    description: Optional[str] = None
    workout_style: str
    estimated_duration_minutes: int
    target_muscle_groups: list[str]
    is_favorited: bool
    exercises: list[WorkoutExerciseItemSchema]
    is_circuit: bool
    circuit_rounds: Optional[int]
    created_at: datetime
    updated_at: datetime


class WorkoutDetailResponse(WorkoutResponse):
    """Workout with full exercise details embedded."""
    exercises: list[WorkoutExerciseDetail]  # type: ignore[assignment]


class WorkoutListResponse(BaseModel):
    workouts: list[WorkoutResponse]
    total: int
    page: int
    per_page: int
    total_pages: int
