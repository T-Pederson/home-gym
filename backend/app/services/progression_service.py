from typing import Optional

from app.models.workout_log import WorkoutLog
from app.schemas.planner import WeightSuggestion

# Equipment types that get dumbbell-sized increments
DUMBBELL_EQUIPMENT = {"dumbbell", "e-z curl bar", "kettlebell"}

# Barbell increment in lbs and kg
BARBELL_INCREMENT_LBS = 5.0
BARBELL_INCREMENT_KG = 2.0

# Dumbbell increment in lbs and kg
DUMBBELL_INCREMENT_LBS = 2.5
DUMBBELL_INCREMENT_KG = 1.0


async def suggest_weight(
    user_id: str,
    exercise_id: str,
    equipment: Optional[str],
    style: str,
) -> WeightSuggestion:
    """Return a weight suggestion for a single exercise based on workout history."""

    # Query last 4 logs that include this exercise
    logs = (
        await WorkoutLog.find(
            {
                "user_id": user_id,
                "exercises_performed.exercise_id": exercise_id,
            }
        )
        .sort(-WorkoutLog.started_at)
        .limit(4)
        .to_list()
    )

    if not logs:
        return WeightSuggestion(note="first_time")

    # Most recent session data for this exercise
    last_log = logs[0]
    last_exercise = next(
        (e for e in last_log.exercises_performed if e.exercise_id == exercise_id),
        None,
    )
    if not last_exercise or not last_exercise.sets:
        return WeightSuggestion(note="first_time")

    last_sets = last_exercise.sets
    last_weight = max((s.weight or 0.0) for s in last_sets)
    last_unit = last_sets[-1].weight_unit if last_sets else "lbs"

    if last_weight == 0:
        return WeightSuggestion(note="first_time")

    # Check if any set was failed (actual reps < target reps)
    any_failed = any(
        s.target_reps is not None
        and s.reps is not None
        and s.reps < s.target_reps
        for s in last_sets
    )

    if style == "strength" and not any_failed:
        increment = _get_increment(equipment, last_unit)
        return WeightSuggestion(
            suggested_weight=round(last_weight + increment, 2),
            previous_weight=last_weight,
            weight_unit=last_unit,
            note="increase",
        )

    if style == "endurance":
        # 70% of max weight across last 4 sessions
        all_weights = [
            s.weight or 0.0
            for log in logs
            for ex in log.exercises_performed
            if ex.exercise_id == exercise_id
            for s in ex.sets
        ]
        max_weight = max(all_weights) if all_weights else last_weight
        suggested = round(max_weight * 0.7, 2)
        return WeightSuggestion(
            suggested_weight=suggested,
            previous_weight=last_weight,
            weight_unit=last_unit,
            note="endurance",
        )

    # hypertrophy, hiit, failed strength — maintain
    return WeightSuggestion(
        suggested_weight=last_weight,
        previous_weight=last_weight,
        weight_unit=last_unit,
        note="maintain",
    )


async def suggest_weights_bulk(
    user_id: str,
    exercises: list[tuple[str, Optional[str]]],  # (exercise_id, equipment)
    style: str,
) -> dict[str, WeightSuggestion]:
    """Return weight suggestions for multiple exercises at once."""
    results: dict[str, WeightSuggestion] = {}
    for exercise_id, equipment in exercises:
        results[exercise_id] = await suggest_weight(user_id, exercise_id, equipment, style)
    return results


def _get_increment(equipment: Optional[str], unit: str) -> float:
    eq = (equipment or "").lower()
    if eq in DUMBBELL_EQUIPMENT:
        return DUMBBELL_INCREMENT_KG if unit == "kg" else DUMBBELL_INCREMENT_LBS
    # default to barbell increments for barbell, cable, machine, etc.
    return BARBELL_INCREMENT_KG if unit == "kg" else BARBELL_INCREMENT_LBS
