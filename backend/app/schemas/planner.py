from typing import Optional

from pydantic import BaseModel, field_validator

from app.schemas.exercises import ExerciseResponse


class GenerateWorkoutRequest(BaseModel):
    muscle_groups: list[str]        # user-facing labels: chest, back, legs, etc.
    duration_minutes: int
    style: str                      # strength | hypertrophy | endurance | hiit
    muscle_weights: dict[str, float] = {}  # optional custom allocation weights

    @field_validator("muscle_groups")
    @classmethod
    def at_least_one_group(cls, v: list[str]) -> list[str]:
        if not v:
            raise ValueError("Select at least one muscle group")
        return v

    @field_validator("duration_minutes")
    @classmethod
    def valid_duration(cls, v: int) -> int:
        if v < 10:
            raise ValueError("Duration must be at least 10 minutes")
        if v > 180:
            raise ValueError("Duration must be at most 180 minutes")
        return v

    @field_validator("style")
    @classmethod
    def valid_style(cls, v: str) -> str:
        valid = {"strength", "hypertrophy", "endurance", "hiit"}
        if v not in valid:
            raise ValueError(f"Style must be one of: {', '.join(valid)}")
        return v


class WeightSuggestion(BaseModel):
    suggested_weight: Optional[float] = None
    previous_weight: Optional[float] = None   # user can revert to this
    weight_unit: str = "lbs"
    note: str = "first_time"  # first_time | increase | maintain | endurance


class GeneratedExercise(BaseModel):
    exercise: ExerciseResponse
    sets: int
    reps: Optional[int] = None
    duration_seconds: Optional[int] = None
    rest_seconds: int
    weight_suggestion: WeightSuggestion


class GeneratedWorkout(BaseModel):
    style: str
    estimated_duration_minutes: int
    effective_duration_minutes: int     # after warm-up buffer deducted
    exercises: list[GeneratedExercise]
    is_circuit: bool = False
    circuit_rounds: Optional[int] = None
    circuit_set_duration_seconds: Optional[int] = None
    circuit_rest_seconds: Optional[int] = None
    circuit_round_rest_seconds: Optional[int] = None
