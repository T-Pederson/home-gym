from datetime import datetime
from typing import Optional

from beanie import Document, Indexed
from pydantic import BaseModel, Field


class HeightWeight(BaseModel):
    value: float
    unit: str = "lbs"  # lbs or kg for weight, in or cm for height


class UserProfile(BaseModel):
    name: str = ""
    height: Optional[HeightWeight] = None
    weight: Optional[HeightWeight] = None
    preferred_units: str = "imperial"  # imperial or metric


class WorkoutPreferences(BaseModel):
    default_duration_minutes: int = 45
    preferred_style: str = "hypertrophy"  # strength, hypertrophy, endurance, hiit, mixed
    preferred_muscle_groups: list[str] = []
    experience_level: str = "beginner"  # beginner, intermediate, advanced


class User(Document):
    username: Indexed(str, unique=True)  # type: ignore[valid-type]
    password_hash: str
    profile: UserProfile = Field(default_factory=UserProfile)
    equipment_owned: list[str] = []
    workout_preferences: WorkoutPreferences = Field(default_factory=WorkoutPreferences)
    onboarding_completed: bool = False
    liked_exercises: list[str] = []
    disliked_exercises: list[str] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "users"
