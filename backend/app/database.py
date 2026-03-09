from beanie import init_beanie
from motor.motor_asyncio import AsyncIOMotorClient

from app.config import settings
from app.models.body_weight import BodyWeightEntry
from app.models.exercise import Exercise
from app.models.refresh_token import RefreshToken
from app.models.user import User
from app.models.workout import Workout
from app.models.workout_log import WorkoutLog


async def init_db():
    client = AsyncIOMotorClient(settings.mongodb_url)
    await init_beanie(
        database=client[settings.database_name],
        document_models=[User, RefreshToken, BodyWeightEntry, Exercise, Workout, WorkoutLog],
    )
