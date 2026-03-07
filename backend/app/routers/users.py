from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends
from pydantic import BaseModel

from app.dependencies.auth import get_current_user
from app.models.user import (
    HeightWeight,
    User,
    UserProfile,
    WorkoutPreferences,
)

router = APIRouter(prefix="/api/v1/users", tags=["users"])


class ProfileResponse(BaseModel):
    id: str
    username: str
    profile: UserProfile
    equipment_owned: list[str]
    workout_preferences: WorkoutPreferences
    onboarding_completed: bool
    liked_exercises: list[str]
    disliked_exercises: list[str]


class UpdateProfileRequest(BaseModel):
    name: Optional[str] = None
    height: Optional[HeightWeight] = None
    weight: Optional[HeightWeight] = None
    preferred_units: Optional[str] = None


class UpdateEquipmentRequest(BaseModel):
    equipment_owned: list[str]


class UpdatePreferencesRequest(BaseModel):
    default_duration_minutes: Optional[int] = None
    preferred_style: Optional[str] = None
    preferred_muscle_groups: Optional[list[str]] = None
    experience_level: Optional[str] = None


class OnboardingRequest(BaseModel):
    name: str
    height: HeightWeight
    weight: HeightWeight
    preferred_units: str
    equipment_owned: list[str]
    default_duration_minutes: int = 45
    preferred_style: str = "hypertrophy"
    experience_level: str = "beginner"


@router.get("/me", response_model=ProfileResponse)
async def get_profile(user: User = Depends(get_current_user)):
    return ProfileResponse(
        id=str(user.id),
        username=user.username,
        profile=user.profile,
        equipment_owned=user.equipment_owned,
        workout_preferences=user.workout_preferences,
        onboarding_completed=user.onboarding_completed,
        liked_exercises=user.liked_exercises,
        disliked_exercises=user.disliked_exercises,
    )


@router.put("/me", response_model=ProfileResponse)
async def update_profile(
    body: UpdateProfileRequest, user: User = Depends(get_current_user)
):
    if body.name is not None:
        user.profile.name = body.name
    if body.height is not None:
        user.profile.height = body.height
    if body.weight is not None:
        user.profile.weight = body.weight
    if body.preferred_units is not None:
        user.profile.preferred_units = body.preferred_units

    user.updated_at = datetime.utcnow()
    await user.save()

    return ProfileResponse(
        id=str(user.id),
        username=user.username,
        profile=user.profile,
        equipment_owned=user.equipment_owned,
        workout_preferences=user.workout_preferences,
        onboarding_completed=user.onboarding_completed,
        liked_exercises=user.liked_exercises,
        disliked_exercises=user.disliked_exercises,
    )


@router.put("/me/equipment", response_model=ProfileResponse)
async def update_equipment(
    body: UpdateEquipmentRequest, user: User = Depends(get_current_user)
):
    user.equipment_owned = body.equipment_owned
    user.updated_at = datetime.utcnow()
    await user.save()

    return ProfileResponse(
        id=str(user.id),
        username=user.username,
        profile=user.profile,
        equipment_owned=user.equipment_owned,
        workout_preferences=user.workout_preferences,
        onboarding_completed=user.onboarding_completed,
        liked_exercises=user.liked_exercises,
        disliked_exercises=user.disliked_exercises,
    )


@router.put("/me/preferences", response_model=ProfileResponse)
async def update_preferences(
    body: UpdatePreferencesRequest, user: User = Depends(get_current_user)
):
    if body.default_duration_minutes is not None:
        user.workout_preferences.default_duration_minutes = (
            body.default_duration_minutes
        )
    if body.preferred_style is not None:
        user.workout_preferences.preferred_style = body.preferred_style
    if body.preferred_muscle_groups is not None:
        user.workout_preferences.preferred_muscle_groups = (
            body.preferred_muscle_groups
        )
    if body.experience_level is not None:
        user.workout_preferences.experience_level = body.experience_level

    user.updated_at = datetime.utcnow()
    await user.save()

    return ProfileResponse(
        id=str(user.id),
        username=user.username,
        profile=user.profile,
        equipment_owned=user.equipment_owned,
        workout_preferences=user.workout_preferences,
        onboarding_completed=user.onboarding_completed,
        liked_exercises=user.liked_exercises,
        disliked_exercises=user.disliked_exercises,
    )


@router.post("/me/onboarding", response_model=ProfileResponse)
async def complete_onboarding(
    body: OnboardingRequest, user: User = Depends(get_current_user)
):
    user.profile.name = body.name
    user.profile.height = body.height
    user.profile.weight = body.weight
    user.profile.preferred_units = body.preferred_units
    user.equipment_owned = body.equipment_owned
    user.workout_preferences.default_duration_minutes = body.default_duration_minutes
    user.workout_preferences.preferred_style = body.preferred_style
    user.workout_preferences.experience_level = body.experience_level
    user.onboarding_completed = True
    user.updated_at = datetime.utcnow()
    await user.save()

    return ProfileResponse(
        id=str(user.id),
        username=user.username,
        profile=user.profile,
        equipment_owned=user.equipment_owned,
        workout_preferences=user.workout_preferences,
        onboarding_completed=user.onboarding_completed,
        liked_exercises=user.liked_exercises,
        disliked_exercises=user.disliked_exercises,
    )
