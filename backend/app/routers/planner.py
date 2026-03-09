from fastapi import APIRouter, Depends, HTTPException

from app.dependencies.auth import get_current_user
from app.models.user import User
from app.schemas.planner import GenerateWorkoutRequest, GeneratedWorkout
from app.services import planner_service

router = APIRouter(prefix="/api/v1/planner", tags=["planner"])


@router.post("/generate", response_model=GeneratedWorkout)
async def generate_workout(
    body: GenerateWorkoutRequest,
    user: User = Depends(get_current_user),
):
    if not user.equipment_owned:
        raise HTTPException(
            status_code=422,
            detail="No equipment configured. Please update your equipment in your profile.",
        )

    result = await planner_service.generate_workout(
        user=user,
        muscle_groups=body.muscle_groups,
        duration_minutes=body.duration_minutes,
        style=body.style,
        muscle_weights=body.muscle_weights,
    )

    if not result.exercises:
        raise HTTPException(
            status_code=422,
            detail="No exercises found for the selected muscle groups and equipment. "
                   "Try adjusting your selections or updating your equipment in your profile.",
        )

    return result
