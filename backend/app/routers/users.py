from datetime import datetime
from typing import Optional

from beanie import SortDirection
from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, Field

from app.dependencies.auth import get_current_user
from app.models.body_weight import BodyWeightEntry
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

    # Log the onboarding weight as the first body weight entry
    if body.weight and body.weight.value > 0:
        await BodyWeightEntry(
            user_id=str(user.id),
            weight=body.weight.value,
            unit=body.weight.unit,
            recorded_at=datetime.utcnow(),
        ).insert()

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


# --- Body Weight Logging ---


class BodyWeightRequest(BaseModel):
    weight: float = Field(gt=0)
    unit: str = "lbs"
    recorded_at: Optional[datetime] = None


class BodyWeightResponse(BaseModel):
    id: str
    weight: float
    unit: str
    recorded_at: datetime


@router.post("/me/weight", response_model=BodyWeightResponse, status_code=201)
async def log_body_weight(
    body: BodyWeightRequest, user: User = Depends(get_current_user)
):
    entry = BodyWeightEntry(
        user_id=str(user.id),
        weight=body.weight,
        unit=body.unit,
        recorded_at=body.recorded_at or datetime.utcnow(),
    )
    await entry.insert()

    return BodyWeightResponse(
        id=str(entry.id),
        weight=entry.weight,
        unit=entry.unit,
        recorded_at=entry.recorded_at,
    )


@router.get("/me/weight", response_model=list[BodyWeightResponse])
async def get_body_weight_history(
    user: User = Depends(get_current_user),
    limit: int = Query(default=30, ge=1, le=365),
):
    entries = (
        await BodyWeightEntry.find(BodyWeightEntry.user_id == str(user.id))
        .sort(("recorded_at", SortDirection.DESCENDING))
        .limit(limit)
        .to_list()
    )

    return [
        BodyWeightResponse(
            id=str(e.id),
            weight=e.weight,
            unit=e.unit,
            recorded_at=e.recorded_at,
        )
        for e in entries
    ]


@router.delete("/me/weight/{entry_id}", status_code=204)
async def delete_body_weight_entry(
    entry_id: str, user: User = Depends(get_current_user)
):
    entry = await BodyWeightEntry.get(entry_id)
    if entry and entry.user_id == str(user.id):
        await entry.delete()
