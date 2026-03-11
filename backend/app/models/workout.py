from datetime import datetime
from typing import Optional

from beanie import Document, Indexed
from pydantic import BaseModel, Field
from pymongo import IndexModel, ASCENDING


class WorkoutExerciseItem(BaseModel):
    exercise_id: str
    order: int
    sets: int
    reps: Optional[int] = None              # rep-based exercises
    duration_seconds: Optional[int] = None  # time-based exercises
    target_weight: Optional[float] = None
    weight_unit: str = "lbs"
    rest_seconds: int = 60
    notes: Optional[str] = None
    superset_group: Optional[str] = None


class Workout(Document):
    user_id: Indexed(str)
    name: str
    description: Optional[str] = None
    workout_style: str                          # strength | hypertrophy | endurance | hiit
    estimated_duration_minutes: int
    target_muscle_groups: list[str] = []
    is_favorited: bool = False
    exercises: list[WorkoutExerciseItem] = []
    is_circuit: bool = False                    # HIIT circuit mode
    circuit_rounds: Optional[int] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "workouts"
        indexes = [
            IndexModel([("user_id", ASCENDING)], name="workout_user_id_index"),
            IndexModel(
                [("user_id", ASCENDING), ("created_at", ASCENDING)],
                name="workout_user_created_index",
            ),
        ]
