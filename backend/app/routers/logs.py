import math
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.dependencies.auth import get_current_user
from app.models.user import User
from app.models.workout_log import LoggedExercise, LoggedSet, WorkoutLog
from app.schemas.logs import (
    CreateWorkoutLogRequest,
    LoggedExerciseResponse,
    LoggedSetResponse,
    WorkoutLogListResponse,
    WorkoutLogResponse,
)

router = APIRouter(prefix="/api/v1/logs", tags=["logs"])


def _to_response(log: WorkoutLog) -> WorkoutLogResponse:
    return WorkoutLogResponse(
        id=str(log.id),
        user_id=log.user_id,
        workout_id=log.workout_id,
        name=log.name,
        exercises_performed=[
            LoggedExerciseResponse(
                exercise_id=ex.exercise_id,
                exercise_name=ex.exercise_name,
                order=ex.order,
                sets=[LoggedSetResponse(**s.model_dump()) for s in ex.sets],
            )
            for ex in log.exercises_performed
        ],
        started_at=log.started_at,
        completed_at=log.completed_at,
        total_duration_seconds=log.total_duration_seconds,
        notes=log.notes,
        created_at=log.created_at,
        updated_at=log.updated_at,
    )


@router.post("", response_model=WorkoutLogResponse, status_code=status.HTTP_201_CREATED)
async def create_log(
    body: CreateWorkoutLogRequest,
    user: User = Depends(get_current_user),
):
    log = WorkoutLog(
        user_id=str(user.id),
        workout_id=body.workout_id,
        name=body.name,
        exercises_performed=[
            LoggedExercise(
                exercise_id=ex.exercise_id,
                exercise_name=ex.exercise_name,
                order=ex.order,
                sets=[LoggedSet(**s.model_dump()) for s in ex.sets],
            )
            for ex in body.exercises_performed
        ],
        started_at=body.started_at,
        completed_at=body.completed_at,
        total_duration_seconds=body.total_duration_seconds,
        notes=body.notes,
    )
    await log.insert()
    return _to_response(log)


@router.get("", response_model=WorkoutLogListResponse)
async def list_logs(
    user: User = Depends(get_current_user),
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=20, ge=1, le=50),
):
    query = {"user_id": str(user.id)}
    total = await WorkoutLog.find(query).count()
    logs = (
        await WorkoutLog.find(query)
        .sort([("started_at", -1)])
        .skip((page - 1) * per_page)
        .limit(per_page)
        .to_list()
    )
    return WorkoutLogListResponse(
        logs=[_to_response(log) for log in logs],
        total=total,
        page=page,
        per_page=per_page,
        total_pages=math.ceil(total / per_page) if total else 0,
    )


@router.get("/{log_id}", response_model=WorkoutLogResponse)
async def get_log(
    log_id: str,
    user: User = Depends(get_current_user),
):
    try:
        log = await WorkoutLog.get(log_id)
    except Exception:
        raise HTTPException(status_code=404, detail="Log not found")

    if not log or log.user_id != str(user.id):
        raise HTTPException(status_code=404, detail="Log not found")

    return _to_response(log)


@router.delete("/{log_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_log(
    log_id: str,
    user: User = Depends(get_current_user),
):
    try:
        log = await WorkoutLog.get(log_id)
    except Exception:
        raise HTTPException(status_code=404, detail="Log not found")

    if not log or log.user_id != str(user.id):
        raise HTTPException(status_code=404, detail="Log not found")

    await log.delete()
