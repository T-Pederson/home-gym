"""
Seed exercises from free-exercise-db into MongoDB.

Downloads exercises.json from GitHub if not found locally, then upserts
all exercises by source_id (idempotent — safe to run multiple times).

Usage:
    cd backend
    .venv/Scripts/python scripts/seed_exercises.py
"""
import asyncio
import json
import sys
from pathlib import Path

import httpx
from beanie import init_beanie
from motor.motor_asyncio import AsyncIOMotorClient

# Allow imports from app/
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.config import settings
from app.models.exercise import Exercise

EXERCISES_URL = (
    "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json"
)
DATA_FILE = Path(__file__).parent.parent / "data" / "exercises.json"

# Cardio-like categories that benefit from is_time_based = True
TIME_BASED_CATEGORIES = {"cardio"}
TIME_BASED_EQUIPMENT = {"machine"}  # treadmill etc. handled by category


def _is_time_based(entry: dict) -> bool:
    category = (entry.get("category") or "").lower()
    name = (entry.get("name") or "").lower()
    # Planks, holds, cardio intervals
    return (
        category in TIME_BASED_CATEGORIES
        or "plank" in name
        or "hold" in name
        or "isometric" in name
    )


async def load_data() -> list[dict]:
    if DATA_FILE.exists():
        print(f"Loading from local file: {DATA_FILE}")
        with open(DATA_FILE, encoding="utf-8") as f:
            return json.load(f)

    print(f"Downloading exercises from {EXERCISES_URL} ...")
    DATA_FILE.parent.mkdir(parents=True, exist_ok=True)
    async with httpx.AsyncClient(timeout=30) as client:
        response = await client.get(EXERCISES_URL)
        response.raise_for_status()
        data = response.json()

    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)
    print(f"Saved {len(data)} exercises to {DATA_FILE}")
    return data


async def seed():
    client = AsyncIOMotorClient(settings.mongodb_url)
    await init_beanie(
        database=client[settings.database_name],
        document_models=[Exercise],
    )

    raw_exercises = await load_data()
    print(f"Seeding {len(raw_exercises)} exercises...")

    inserted = 0
    updated = 0

    for entry in raw_exercises:
        source_id: str = entry.get("id", "")
        if not source_id:
            continue

        existing = await Exercise.find_one(Exercise.source_id == source_id)

        exercise_data = dict(
            source_id=source_id,
            name=entry.get("name", ""),
            aliases=entry.get("aliases", []),
            force=entry.get("force") or None,
            level=entry.get("level") or None,
            mechanic=entry.get("mechanic") or None,
            equipment=entry.get("equipment") or None,
            primary_muscles=entry.get("primaryMuscles", []),
            secondary_muscles=entry.get("secondaryMuscles", []),
            instructions=entry.get("instructions", []),
            images=entry.get("images", []),
            category=entry.get("category", "strength"),
            is_custom=False,
            created_by=None,
            is_time_based=_is_time_based(entry),
        )

        if existing:
            for field, value in exercise_data.items():
                setattr(existing, field, value)
            await existing.save()
            updated += 1
        else:
            await Exercise(**exercise_data).insert()
            inserted += 1

    print(f"Done — {inserted} inserted, {updated} updated.")


if __name__ == "__main__":
    asyncio.run(seed())
