from typing import Optional
from pydantic import BaseModel, field_validator


class ExerciseResponse(BaseModel):
    id: str
    source_id: Optional[str] = None
    name: str
    aliases: list[str] = []
    force: Optional[str] = None
    level: Optional[str] = None
    mechanic: Optional[str] = None
    equipment: Optional[str] = None
    primary_muscles: list[str] = []
    secondary_muscles: list[str] = []
    instructions: list[str] = []
    images: list[str] = []
    category: str
    is_custom: bool
    created_by: Optional[str] = None
    is_time_based: bool


class ExerciseCreate(BaseModel):
    name: str
    force: Optional[str] = None
    level: Optional[str] = None
    mechanic: Optional[str] = None
    equipment: Optional[str] = None
    primary_muscles: list[str] = []
    secondary_muscles: list[str] = []
    instructions: list[str] = []
    category: str = "strength"
    is_time_based: bool = False

    @field_validator("name")
    @classmethod
    def name_not_empty(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Name cannot be empty")
        return v

    @field_validator("primary_muscles")
    @classmethod
    def at_least_one_muscle(cls, v: list[str]) -> list[str]:
        if not v:
            raise ValueError("At least one primary muscle is required")
        return v


class ExerciseUpdate(BaseModel):
    name: Optional[str] = None
    force: Optional[str] = None
    level: Optional[str] = None
    mechanic: Optional[str] = None
    equipment: Optional[str] = None
    primary_muscles: Optional[list[str]] = None
    secondary_muscles: Optional[list[str]] = None
    instructions: Optional[list[str]] = None
    category: Optional[str] = None
    is_time_based: Optional[bool] = None


class ExerciseListResponse(BaseModel):
    exercises: list[ExerciseResponse]
    total: int
    page: int
    per_page: int
    total_pages: int


class ExerciseMetadataResponse(BaseModel):
    muscles: list[str]
    equipment: list[str]
    categories: list[str]
    levels: list[str]
