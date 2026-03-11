from datetime import datetime
from typing import Optional

from pydantic import BaseModel, field_validator


class LoggedSetInput(BaseModel):
    set_number: int
    reps: Optional[int] = None
    target_reps: Optional[int] = None
    duration_seconds: Optional[int] = None
    target_duration_seconds: Optional[int] = None
    weight: Optional[float] = None
    weight_unit: str = "lbs"
    completed: bool = True


class LoggedExerciseInput(BaseModel):
    exercise_id: str
    exercise_name: str
    order: int
    sets: list[LoggedSetInput] = []


class CreateWorkoutLogRequest(BaseModel):
    workout_id: Optional[str] = None
    name: str
    exercises_performed: list[LoggedExerciseInput]
    started_at: datetime
    completed_at: datetime
    total_duration_seconds: int
    notes: Optional[str] = None

    @field_validator("name")
    @classmethod
    def name_not_empty(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Name cannot be empty")
        return v


class LoggedSetResponse(BaseModel):
    set_number: int
    reps: Optional[int] = None
    target_reps: Optional[int] = None
    duration_seconds: Optional[int] = None
    target_duration_seconds: Optional[int] = None
    weight: Optional[float] = None
    weight_unit: str
    completed: bool


class LoggedExerciseResponse(BaseModel):
    exercise_id: str
    exercise_name: str
    order: int
    sets: list[LoggedSetResponse]


class WorkoutLogResponse(BaseModel):
    id: str
    user_id: str
    workout_id: Optional[str]
    name: str
    exercises_performed: list[LoggedExerciseResponse]
    started_at: datetime
    completed_at: Optional[datetime]
    total_duration_seconds: Optional[int]
    notes: Optional[str]
    created_at: datetime
    updated_at: datetime


class WorkoutLogListResponse(BaseModel):
    logs: list[WorkoutLogResponse]
    total: int
    page: int
    per_page: int
    total_pages: int
