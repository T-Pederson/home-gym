import math
from typing import Optional
from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Query
from pymongo import TEXT

from app.dependencies.auth import get_current_user
from app.models.exercise import Exercise
from app.models.user import User
from app.schemas.exercises import (
    ExerciseCreate,
    ExerciseListResponse,
    ExerciseMetadataResponse,
    ExerciseResponse,
    ExerciseUpdate,
)

router = APIRouter(prefix="/exercises", tags=["exercises"])

# Muscle group user-facing label → database values mapping
MUSCLE_GROUP_MAP: dict[str, list[str]] = {
    "back": ["lats", "lower back", "middle back", "traps"],
    "biceps": ["biceps", "forearms"],
    "chest": ["chest"],
    "triceps": ["triceps"],
    "shoulders": ["shoulders", "neck"],
    "core": ["abdominals"],
    "legs": ["quadriceps", "hamstrings", "calves", "glutes", "abductors", "adductors"],
}


def _exercise_to_response(exercise: Exercise) -> ExerciseResponse:
    return ExerciseResponse(
        id=str(exercise.id),
        source_id=exercise.source_id,
        name=exercise.name,
        aliases=exercise.aliases,
        force=exercise.force,
        level=exercise.level,
        mechanic=exercise.mechanic,
        equipment=exercise.equipment,
        primary_muscles=exercise.primary_muscles,
        secondary_muscles=exercise.secondary_muscles,
        instructions=exercise.instructions,
        images=exercise.images,
        category=exercise.category,
        is_custom=exercise.is_custom,
        created_by=exercise.created_by,
        is_time_based=exercise.is_time_based,
    )


@router.get("/metadata", response_model=ExerciseMetadataResponse)
async def get_exercise_metadata() -> ExerciseMetadataResponse:
    """Return distinct values for filter dropdowns."""
    muscles_raw = await Exercise.distinct("primary_muscles")
    equipment_raw = await Exercise.distinct("equipment")
    categories_raw = await Exercise.distinct("category")
    levels_raw = await Exercise.distinct("level")

    muscles = sorted([m for m in muscles_raw if m])
    equipment = sorted([e for e in equipment_raw if e])
    categories = sorted([c for c in categories_raw if c])
    levels = sorted([lvl for lvl in levels_raw if lvl])

    return ExerciseMetadataResponse(
        muscles=muscles,
        equipment=equipment,
        categories=categories,
        levels=levels,
    )


@router.get("", response_model=ExerciseListResponse)
async def list_exercises(
    q: Optional[str] = Query(None, description="Text search on name"),
    muscle_group: Optional[str] = Query(None, description="User-facing muscle group label (back, legs, etc.)"),
    muscles: Optional[str] = Query(None, description="Comma-separated raw muscle names"),
    equipment: Optional[str] = Query(None, description="Equipment filter"),
    category: Optional[str] = Query(None, description="Category filter"),
    level: Optional[str] = Query(None, description="Level filter"),
    custom_only: bool = Query(False, description="Show only custom exercises"),
    liked_only: bool = Query(False, description="Show only liked exercises"),
    disliked_only: bool = Query(False, description="Show only disliked exercises"),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
) -> ExerciseListResponse:
    """Search and filter exercises with pagination."""
    query: dict = {}

    # liked_only / disliked_only: filter to the user's preference lists
    if liked_only:
        ids = [ObjectId(eid) for eid in (current_user.liked_exercises or []) if ObjectId.is_valid(eid)]
        if not ids:
            return ExerciseListResponse(exercises=[], total=0, page=page, per_page=per_page, total_pages=1)
        query["_id"] = {"$in": ids}
    elif disliked_only:
        ids = [ObjectId(eid) for eid in (current_user.disliked_exercises or []) if ObjectId.is_valid(eid)]
        if not ids:
            return ExerciseListResponse(exercises=[], total=0, page=page, per_page=per_page, total_pages=1)
        query["_id"] = {"$in": ids}

    if custom_only:
        query["is_custom"] = True
        query["created_by"] = str(current_user.id)

    if q and q.strip():
        query["$text"] = {"$search": q.strip()}

    if muscle_group:
        db_muscles = MUSCLE_GROUP_MAP.get(muscle_group.lower())
        if muscle_group.lower() == "cardio":
            query["category"] = "cardio"
        elif db_muscles:
            query["primary_muscles"] = {"$in": db_muscles}

    if muscles:
        raw_muscles = [m.strip() for m in muscles.split(",") if m.strip()]
        if raw_muscles:
            query["primary_muscles"] = {"$in": raw_muscles}

    if equipment:
        query["equipment"] = equipment

    if category:
        query["category"] = category

    if level:
        query["level"] = level

    skip = (page - 1) * per_page

    total = await Exercise.find(query).count()
    exercises = await Exercise.find(query).skip(skip).limit(per_page).to_list()

    total_pages = max(1, math.ceil(total / per_page))

    return ExerciseListResponse(
        exercises=[_exercise_to_response(e) for e in exercises],
        total=total,
        page=page,
        per_page=per_page,
        total_pages=total_pages,
    )


@router.get("/{exercise_id}", response_model=ExerciseResponse)
async def get_exercise(
    exercise_id: str,
    current_user: User = Depends(get_current_user),
) -> ExerciseResponse:
    """Get a single exercise by ID."""
    try:
        oid = ObjectId(exercise_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid exercise ID")

    exercise = await Exercise.get(oid)
    if not exercise:
        raise HTTPException(status_code=404, detail="Exercise not found")

    return _exercise_to_response(exercise)


@router.post("", response_model=ExerciseResponse, status_code=201)
async def create_exercise(
    payload: ExerciseCreate,
    current_user: User = Depends(get_current_user),
) -> ExerciseResponse:
    """Create a custom exercise for the current user."""
    exercise = Exercise(
        name=payload.name,
        force=payload.force,
        level=payload.level,
        mechanic=payload.mechanic,
        equipment=payload.equipment,
        primary_muscles=payload.primary_muscles,
        secondary_muscles=payload.secondary_muscles,
        instructions=payload.instructions,
        category=payload.category,
        is_custom=True,
        created_by=str(current_user.id),
        is_time_based=payload.is_time_based,
    )
    await exercise.insert()
    return _exercise_to_response(exercise)


@router.put("/{exercise_id}", response_model=ExerciseResponse)
async def update_exercise(
    exercise_id: str,
    payload: ExerciseUpdate,
    current_user: User = Depends(get_current_user),
) -> ExerciseResponse:
    """Update a custom exercise. Only the creator can update it."""
    try:
        oid = ObjectId(exercise_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid exercise ID")

    exercise = await Exercise.get(oid)
    if not exercise:
        raise HTTPException(status_code=404, detail="Exercise not found")

    if not exercise.is_custom or exercise.created_by != str(current_user.id):
        raise HTTPException(status_code=403, detail="You can only edit your own custom exercises")

    update_data = payload.model_dump(exclude_none=True)
    for field, value in update_data.items():
        setattr(exercise, field, value)

    await exercise.save()
    return _exercise_to_response(exercise)


@router.delete("/{exercise_id}", status_code=204)
async def delete_exercise(
    exercise_id: str,
    current_user: User = Depends(get_current_user),
) -> None:
    """Delete a custom exercise. Only the creator can delete it."""
    try:
        oid = ObjectId(exercise_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid exercise ID")

    exercise = await Exercise.get(oid)
    if not exercise:
        raise HTTPException(status_code=404, detail="Exercise not found")

    if not exercise.is_custom or exercise.created_by != str(current_user.id):
        raise HTTPException(status_code=403, detail="You can only delete your own custom exercises")

    await exercise.delete()
