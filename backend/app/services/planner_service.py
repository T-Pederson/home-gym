import math
import random
from typing import Optional

from bson import ObjectId

from app.models.exercise import Exercise
from app.models.user import User
from app.schemas.exercises import ExerciseResponse
from app.schemas.planner import GeneratedExercise, GeneratedWorkout, WeightSuggestion
from app.services import progression_service

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

MUSCLE_GROUP_MAP: dict[str, list[str]] = {
    "back": ["lats", "lower back", "middle back", "traps"],
    "biceps": ["biceps", "forearms"],
    "chest": ["chest"],
    "triceps": ["triceps"],
    "shoulders": ["shoulders", "neck"],
    "core": ["abdominals"],
    "legs": ["quadriceps", "hamstrings", "calves", "glutes", "abductors", "adductors"],
}

# Maps user-facing equipment labels (stored in equipment_owned) → exercise DB values
EQUIPMENT_MAP: dict[str, str] = {
    "body weight": "body only",
    "body only": "body only",  # backward compat for existing users
    "misc/other": "other",
}

# Style parameters: (avg_sets, rest_seconds, compound_ratio, minutes_per_exercise)
STYLE_PARAMS: dict[str, dict] = {
    "strength": {
        "sets": 4,
        "rest_seconds": 180,
        "compound_ratio": 0.6,
        "minutes_per_exercise": 13,
    },
    "hypertrophy": {
        "sets": 4,
        "rest_seconds": 90,
        "compound_ratio": 0.6,
        "minutes_per_exercise": 8,
    },
    "endurance": {
        "sets": 3,
        "rest_seconds": 30,
        "compound_ratio": 0.6,
        "minutes_per_exercise": 4,
    },
    "hiit": {
        "sets": 3,           # default circuit rounds
        "rest_seconds": 15,  # intra-exercise rest
        "compound_ratio": 0.5,
        "minutes_per_exercise": 1,  # placeholder — calculated separately
    },
}

HIIT_SET_DURATION_SECONDS = 45
HIIT_REST_SECONDS = 15
HIIT_ROUND_REST_SECONDS = 60
HIIT_ROUNDS = 3
WARMUP_BUFFER_MINUTES = 5

LIKED_WEIGHT = 2.0
NORMAL_WEIGHT = 1.0


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------


async def generate_workout(
    user: User,
    muscle_groups: list[str],
    duration_minutes: int,
    style: str,
    muscle_weights: dict[str, float],
) -> GeneratedWorkout:
    effective_minutes = duration_minutes - WARMUP_BUFFER_MINUTES

    params = STYLE_PARAMS[style]
    equipment_filter = _build_equipment_filter(user.equipment_owned)
    disliked_ids = set(user.disliked_exercises)
    liked_ids = set(user.liked_exercises)

    # Separate "cardio" from muscle-based groups
    muscle_groups_filtered = [g for g in muscle_groups if g != "cardio"]
    include_cardio = "cardio" in muscle_groups

    # Build exercise pool per group (muscle-based)
    pool_by_group = await _build_pool_by_group(
        muscle_groups_filtered, equipment_filter, disliked_ids
    )

    # If cardio requested, also fetch cardio-category exercises
    cardio_pool: list[Exercise] = []
    if include_cardio:
        cardio_pool = await _fetch_cardio_exercises(equipment_filter, disliked_ids)

    # Determine exercise counts
    if style == "hiit":
        is_circuit = True
        n_exercises = _calc_hiit_exercise_count(effective_minutes)
        circuit_rounds = HIIT_ROUNDS
    else:
        is_circuit = False
        n_exercises = max(1, int(effective_minutes / params["minutes_per_exercise"]))
        circuit_rounds = None

    # Allocate exercises per muscle group
    allocation = _allocate_by_group(muscle_groups_filtered, n_exercises, muscle_weights, include_cardio)

    selected: list[Exercise] = []

    for group, count in allocation.items():
        if group == "_cardio":
            pool = cardio_pool
        else:
            pool = pool_by_group.get(group, [])

        # Remove already-selected exercises from pool
        already_selected_ids = {str(e.id) for e in selected}
        pool = [e for e in pool if str(e.id) not in already_selected_ids]

        group_exercises = _select_for_group(pool, count, liked_ids, params["compound_ratio"])
        selected.extend(group_exercises)

    # If pool was too small, pad with anything available from all groups
    if len(selected) < n_exercises:
        all_pool = [e for group_pool in pool_by_group.values() for e in group_pool]
        if include_cardio:
            all_pool.extend(cardio_pool)
        already_selected_ids = {str(e.id) for e in selected}
        remaining_pool = [e for e in all_pool if str(e.id) not in already_selected_ids]
        extras = _weighted_sample(remaining_pool, n_exercises - len(selected), liked_ids)
        selected.extend(extras)

    # Get weight suggestions for all selected exercises
    exercise_ids_and_equipment = [(str(e.id), e.equipment) for e in selected]
    suggestions = await progression_service.suggest_weights_bulk(
        user_id=str(user.id),
        exercises=exercise_ids_and_equipment,
        style=style,
    )

    # Build response
    generated_exercises = _build_generated_exercises(selected, params, suggestions, style)

    return GeneratedWorkout(
        style=style,
        estimated_duration_minutes=duration_minutes,
        effective_duration_minutes=effective_minutes,
        exercises=generated_exercises,
        is_circuit=is_circuit,
        circuit_rounds=circuit_rounds if is_circuit else None,
        circuit_set_duration_seconds=HIIT_SET_DURATION_SECONDS if is_circuit else None,
        circuit_rest_seconds=HIIT_REST_SECONDS if is_circuit else None,
        circuit_round_rest_seconds=HIIT_ROUND_REST_SECONDS if is_circuit else None,
    )


# ---------------------------------------------------------------------------
# Private helpers
# ---------------------------------------------------------------------------


def _build_equipment_filter(equipment_owned: list[str]) -> list[str]:
    """Map user's equipment labels to exercise DB values."""
    db_values: list[str] = []
    for item in equipment_owned:
        mapped = EQUIPMENT_MAP.get(item.lower())
        if mapped:
            db_values.append(mapped)
        else:
            db_values.append(item.lower())
    return list(set(db_values))


async def _build_pool_by_group(
    muscle_groups: list[str],
    equipment_filter: list[str],
    disliked_ids: set[str],
) -> dict[str, list[Exercise]]:
    pool_by_group: dict[str, list[Exercise]] = {}

    for group in muscle_groups:
        db_muscles = MUSCLE_GROUP_MAP.get(group, [])
        if not db_muscles:
            pool_by_group[group] = []
            continue

        query: dict = {
            "primary_muscles": {"$in": db_muscles},
            "equipment": {"$in": equipment_filter},
        }
        if disliked_ids:
            query["_id"] = {"$nin": [ObjectId(eid) for eid in disliked_ids if _valid_oid(eid)]}

        exercises = await Exercise.find(query).to_list()
        pool_by_group[group] = exercises

    return pool_by_group


async def _fetch_cardio_exercises(
    equipment_filter: list[str],
    disliked_ids: set[str],
) -> list[Exercise]:
    query: dict = {
        "category": "cardio",
        "equipment": {"$in": equipment_filter},
    }
    if disliked_ids:
        query["_id"] = {"$nin": [ObjectId(eid) for eid in disliked_ids if _valid_oid(eid)]}
    return await Exercise.find(query).to_list()


def _calc_hiit_exercise_count(effective_minutes: int) -> int:
    """N = (effective_seconds - 2 * round_rest) / (set_duration + intra_rest) / rounds"""
    effective_seconds = effective_minutes * 60
    round_rest_total = (HIIT_ROUNDS - 1) * HIIT_ROUND_REST_SECONDS
    slot_seconds = (HIIT_SET_DURATION_SECONDS + HIIT_REST_SECONDS) * HIIT_ROUNDS
    n = (effective_seconds - round_rest_total) / slot_seconds
    return max(3, round(n))


def _allocate_by_group(
    muscle_groups: list[str],
    total: int,
    muscle_weights: dict[str, float],
    include_cardio: bool,
) -> dict[str, int]:
    """
    Returns a dict of {group: count} allocating `total` exercises.
    muscle_weights can override proportional split (values are relative weights).
    """
    all_groups = list(muscle_groups)
    if include_cardio:
        all_groups.append("_cardio")

    if not all_groups:
        return {}

    # Build weights
    if muscle_weights:
        # Normalise provided weights; default unspecified groups to 1.0
        weights = {g: muscle_weights.get(g, 1.0) for g in all_groups}
    else:
        weights = {g: 1.0 for g in all_groups}

    total_weight = sum(weights.values())
    raw = {g: (weights[g] / total_weight) * total for g in all_groups}

    # Floor all, then distribute remainder
    allocation = {g: math.floor(v) for g, v in raw.items()}
    remainder = total - sum(allocation.values())

    # Give extras to groups with largest fractional parts
    fractions = sorted(all_groups, key=lambda g: -(raw[g] - allocation[g]))
    for i in range(remainder):
        allocation[fractions[i % len(fractions)]] += 1

    return allocation


def _select_for_group(
    pool: list[Exercise],
    count: int,
    liked_ids: set[str],
    compound_ratio: float,
) -> list[Exercise]:
    """Select `count` exercises from pool with 60/40 compound/isolation split."""
    if not pool or count == 0:
        return []

    compounds = [e for e in pool if e.mechanic == "compound"]
    isolations = [e for e in pool if e.mechanic != "compound"]

    n_compounds = round(count * compound_ratio)
    n_isolations = count - n_compounds

    # Soft target — clamp to available
    n_compounds = min(n_compounds, len(compounds))
    n_isolations = min(n_isolations, len(isolations))

    selected_compounds = _weighted_sample(compounds, n_compounds, liked_ids)
    selected_isolations = _weighted_sample(isolations, n_isolations, liked_ids)

    # Compounds first
    return selected_compounds + selected_isolations


def _weighted_sample(
    pool: list[Exercise],
    count: int,
    liked_ids: set[str],
) -> list[Exercise]:
    """Weighted random sampling without replacement. Liked exercises get 2× weight."""
    if not pool or count <= 0:
        return []

    remaining = list(pool)
    selected: list[Exercise] = []

    for _ in range(min(count, len(remaining))):
        weights = [
            LIKED_WEIGHT if str(e.id) in liked_ids else NORMAL_WEIGHT
            for e in remaining
        ]
        choice = random.choices(remaining, weights=weights, k=1)[0]
        selected.append(choice)
        remaining.remove(choice)

    return selected


def _build_generated_exercises(
    exercises: list[Exercise],
    params: dict,
    suggestions: dict[str, WeightSuggestion],
    style: str,
) -> list[GeneratedExercise]:
    result = []
    for ex in exercises:
        ex_id = str(ex.id)
        suggestion = suggestions.get(ex_id, WeightSuggestion(note="first_time"))

        if style == "hiit":
            sets = HIIT_ROUNDS
            reps = None
            duration_seconds = HIIT_SET_DURATION_SECONDS if ex.is_time_based else None
            reps = None if ex.is_time_based else 15  # default rep count for HIIT rep-based
            rest_seconds = HIIT_REST_SECONDS
        elif ex.is_time_based:
            sets = params["sets"]
            reps = None
            duration_seconds = 30  # default 30s for timed exercises (planks etc.)
            rest_seconds = params["rest_seconds"]
        else:
            sets = params["sets"]
            reps = _default_reps(style)
            duration_seconds = None
            rest_seconds = params["rest_seconds"]

        result.append(
            GeneratedExercise(
                exercise=_exercise_to_response(ex),
                sets=sets,
                reps=reps,
                duration_seconds=duration_seconds,
                rest_seconds=rest_seconds,
                weight_suggestion=suggestion,
            )
        )
    return result


def _default_reps(style: str) -> int:
    return {
        "strength": 5,
        "hypertrophy": 10,
        "endurance": 15,
    }.get(style, 10)


def _exercise_to_response(ex: Exercise) -> ExerciseResponse:
    return ExerciseResponse(
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


def _valid_oid(oid_str: str) -> bool:
    try:
        ObjectId(oid_str)
        return True
    except Exception:
        return False
