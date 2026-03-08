from datetime import datetime

from beanie import Document, Indexed
from pydantic import Field


class BodyWeightEntry(Document):
    user_id: Indexed(str)  # type: ignore[valid-type]
    weight: float
    unit: str = "lbs"  # lbs or kg
    recorded_at: datetime = Field(default_factory=datetime.utcnow)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "body_weight_entries"
