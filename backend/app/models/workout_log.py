from datetime import datetime
from typing import Optional

from beanie import Document, Indexed
from pydantic import BaseModel, Field
from pymongo import IndexModel, ASCENDING


class LoggedSet(BaseModel):
    set_number: int
    reps: Optional[int] = None
    target_reps: Optional[int] = None              # for progression comparison
    duration_seconds: Optional[int] = None
    target_duration_seconds: Optional[int] = None  # for progression comparison
    weight: Optional[float] = None
    weight_unit: str = "lbs"
    completed: bool = True


class LoggedExercise(BaseModel):
    exercise_id: str
    exercise_name: str                  # denormalized snapshot
    order: int
    sets: list[LoggedSet] = []


class WorkoutLog(Document):
    user_id: Indexed(str)
    workout_id: Optional[str] = None    # reference to template (nullable)
    name: str                           # denormalized name snapshot
    exercises_performed: list[LoggedExercise] = []
    started_at: datetime
    completed_at: Optional[datetime] = None
    total_duration_seconds: Optional[int] = None
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "workout_logs"
        indexes = [
            IndexModel([("user_id", ASCENDING)], name="log_user_id_index"),
            IndexModel(
                [("user_id", ASCENDING), ("started_at", ASCENDING)],
                name="log_user_started_index",
            ),
        ]
