from typing import Optional
from beanie import Document, Indexed
from pymongo import IndexModel, TEXT, ASCENDING


class Exercise(Document):
    source_id: Optional[str] = None  # from free-exercise-db, None for custom
    name: str
    aliases: list[str] = []
    force: Optional[str] = None        # push, pull, static
    level: Optional[str] = None        # beginner, intermediate, expert
    mechanic: Optional[str] = None     # compound, isolation
    equipment: Optional[str] = None    # barbell, cable, body only, etc.
    primary_muscles: list[str] = []
    secondary_muscles: list[str] = []
    instructions: list[str] = []
    images: list[str] = []             # relative paths (e.g. "Barbell_Curl/0.jpg")
    category: str = "strength"         # strength, stretching, plyometrics, cardio, etc.
    is_custom: bool = False
    created_by: Optional[str] = None   # user ID for custom exercises, None for seeded
    is_time_based: bool = False        # True for planks, holds, cardio intervals

    class Settings:
        name = "exercises"
        indexes = [
            IndexModel([("name", TEXT)], name="name_text_index"),
            IndexModel([("source_id", ASCENDING)], name="source_id_index", sparse=True),
            IndexModel([("primary_muscles", ASCENDING)], name="primary_muscles_index"),
            IndexModel([("equipment", ASCENDING)], name="equipment_index"),
            IndexModel([("category", ASCENDING)], name="category_index"),
        ]
