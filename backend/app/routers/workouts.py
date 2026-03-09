import math
from datetime import datetime
from typing import Optional

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.dependencies.auth import get_current_user
from app.models.exercise import Exercise
from app.models.user import User
from app.models.workout import Workout, WorkoutExerciseItem
from app.schemas.exercises import ExerciseResponse
from app.schemas.workouts import (
    CreateWorkoutRequest,
    UpdateWorkoutRequest,
    WorkoutDetailResponse,
    WorkoutExerciseDetail,
    WorkoutExerciseItemSchema,
    WorkoutListResponse,
    WorkoutResponse,
)

router = APIRouter(prefix="/api/v1/workouts", tags=["workouts"])


def _to_response(workout: Workout) -> WorkoutResponse:
    return WorkoutResponse(
        id=str(workout.id),
        user_id=workout.user_id,
        name=workout.name,
        description=workout.description,
        workout_style=workout.workout_style,
        estimated_duration_minutes=workout.estimated_duration_minutes,
        target_muscle_groups=workout.target_muscle_groups,
        is_favorited=workout.is_favorited,
        exercises=[
            WorkoutExerciseItemSchema(**ex.model_dump()) for ex in workout.exercises
        ],
        is_circuit=workout.is_circuit,
        circuit_rounds=workout.circuit_rounds,
        created_at=workout.created_at,
        updated_at=workout.updated_at,
    )


async def _to_detail_response(workout: Workout) -> WorkoutDetailResponse:
    """Embed full exercise data by fetching each exercise from DB."""
    exercise_ids = [ex.exercise_id for ex in workout.exercises]
    exercise_map: dict[str, ExerciseResponse] = {}

    for ex_id in exercise_ids:
        try:
            ex = await Exercise.get(ex_id)
            if ex:
                exercise_map[ex_id] = ExerciseResponse(
                    id=str(ex.id),
                    source_id=ex.source_id,
                    name=ex.name,
                    aliases=ex.aliases,
                    force=ex.force,
                    level=ex.level,
                    mechanic=ex.mechanic,
                    equipment=ex.equipment,
                    primary_muscles=ex.primary_muscles,
                    secondary_muscles=ex.secondary_muscles,
                    instructions=ex.instructions,
                    images=ex.images,
                    category=ex.category,
                    is_custom=ex.is_custom,
                    created_by=ex.created_by,
                    is_time_based=ex.is_time_based,
                )
        except Exception:
            pass

    detailed_exercises = [
        WorkoutExerciseDetail(
            **ex.model_dump(),
            exercise=exercise_map.get(ex.exercise_id),
        )
        for ex in workout.exercises
    ]

    return WorkoutDetailResponse(
        id=str(workout.id),
        user_id=workout.user_id,
        name=workout.name,
        description=workout.description,
        workout_style=workout.workout_style,
        estimated_duration_minutes=workout.estimated_duration_minutes,
        target_muscle_groups=workout.target_muscle_groups,
        is_favorited=workout.is_favorited,
        exercises=detailed_exercises,
        is_circuit=workout.is_circuit,
        circuit_rounds=workout.circuit_rounds,
        created_at=workout.created_at,
        updated_at=workout.updated_at,
    )


@router.get("", response_model=WorkoutListResponse)
async def list_workouts(
    user: User = Depends(get_current_user),
    style: Optional[str] = Query(default=None),
    favorites_only: bool = Query(default=False),
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=20, ge=1, le=50),
):
    query: dict = {"user_id": str(user.id)}
    if style:
        query["workout_style"] = style
    if favorites_only:
        query["is_favorited"] = True

    total = await Workout.find(query).count()
    workouts = (
        await Workout.find(query)
        .sort([("created_at", -1)])
        .skip((page - 1) * per_page)
        .limit(per_page)
        .to_list()
    )

    return WorkoutListResponse(
        workouts=[_to_response(w) for w in workouts],
        total=total,
        page=page,
        per_page=per_page,
        total_pages=math.ceil(total / per_page) if total else 0,
    )


@router.post("", response_model=WorkoutResponse, status_code=status.HTTP_201_CREATED)
async def create_workout(
    body: CreateWorkoutRequest,
    user: User = Depends(get_current_user),
):
    workout = Workout(
        user_id=str(user.id),
        name=body.name,
        description=body.description,
        workout_style=body.workout_style,
        estimated_duration_minutes=body.estimated_duration_minutes,
        target_muscle_groups=body.target_muscle_groups,
        exercises=[WorkoutExerciseItem(**ex.model_dump()) for ex in body.exercises],
        is_circuit=body.is_circuit,
        circuit_rounds=body.circuit_rounds,
    )
    await workout.insert()
    return _to_response(workout)


@router.get("/{workout_id}", response_model=WorkoutDetailResponse)
async def get_workout(
    workout_id: str,
    user: User = Depends(get_current_user),
):
    try:
        workout = await Workout.get(workout_id)
    except Exception:
        raise HTTPException(status_code=404, detail="Workout not found")

    if not workout or workout.user_id != str(user.id):
        raise HTTPException(status_code=404, detail="Workout not found")

    return await _to_detail_response(workout)


@router.put("/{workout_id}", response_model=WorkoutResponse)
async def update_workout(
    workout_id: str,
    body: UpdateWorkoutRequest,
    user: User = Depends(get_current_user),
):
    try:
        workout = await Workout.get(workout_id)
    except Exception:
        raise HTTPException(status_code=404, detail="Workout not found")

    if not workout or workout.user_id != str(user.id):
        raise HTTPException(status_code=404, detail="Workout not found")

    if body.name is not None:
        workout.name = body.name.strip()
    if body.description is not None:
        workout.description = body.description
    if body.workout_style is not None:
        workout.workout_style = body.workout_style
    if body.estimated_duration_minutes is not None:
        workout.estimated_duration_minutes = body.estimated_duration_minutes
    if body.target_muscle_groups is not None:
        workout.target_muscle_groups = body.target_muscle_groups
    if body.exercises is not None:
        workout.exercises = [WorkoutExerciseItem(**ex.model_dump()) for ex in body.exercises]
    if body.is_circuit is not None:
        workout.is_circuit = body.is_circuit
    if body.circuit_rounds is not None:
        workout.circuit_rounds = body.circuit_rounds
    if body.is_favorited is not None:
        workout.is_favorited = body.is_favorited

    workout.updated_at = datetime.utcnow()
    await workout.save()
    return _to_response(workout)


@router.delete("/{workout_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_workout(
    workout_id: str,
    user: User = Depends(get_current_user),
):
    try:
        workout = await Workout.get(workout_id)
    except Exception:
        raise HTTPException(status_code=404, detail="Workout not found")

    if not workout or workout.user_id != str(user.id):
        raise HTTPException(status_code=404, detail="Workout not found")

    await workout.delete()


@router.post("/{workout_id}/favorite", response_model=WorkoutResponse)
async def toggle_favorite(
    workout_id: str,
    user: User = Depends(get_current_user),
):
    try:
        workout = await Workout.get(workout_id)
    except Exception:
        raise HTTPException(status_code=404, detail="Workout not found")

    if not workout or workout.user_id != str(user.id):
        raise HTTPException(status_code=404, detail="Workout not found")

    workout.is_favorited = not workout.is_favorited
    workout.updated_at = datetime.utcnow()
    await workout.save()
    return _to_response(workout)
