import { ChevronDown, ChevronUp, TrendingUp } from 'lucide-react'
import type { EditableExercise } from '../../types/workout'

interface Props {
  ex: EditableExercise
  index: number
  isHIIT: boolean
  onChange: (updated: EditableExercise) => void
}

export default function WorkoutExerciseRow({ ex, index, isHIIT, onChange }: Props) {
  const { exercise, weight_suggestion } = ex
  const hasIncrease = weight_suggestion.note === 'increase' && weight_suggestion.previous_weight !== null

  function update(patch: Partial<EditableExercise>) {
    onChange({ ...ex, ...patch })
  }

  function handleUsePrevious() {
    update({
      weight: weight_suggestion.previous_weight,
      use_previous_weight: true,
    })
  }

  function handleUseSuggested() {
    update({
      weight: weight_suggestion.suggested_weight,
      use_previous_weight: false,
    })
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      {/* Header */}
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 leading-snug">{exercise.name}</p>
          <div className="mt-0.5 flex flex-wrap gap-1.5">
            {exercise.equipment && (
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                {exercise.equipment}
              </span>
            )}
            {exercise.mechanic && (
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600 capitalize">
                {exercise.mechanic}
              </span>
            )}
            {exercise.is_time_based && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700">
                timed
              </span>
            )}
          </div>
        </div>
        <span className="shrink-0 text-xs font-medium text-gray-400">#{index + 1}</span>
      </div>

      {/* Sets / Reps / Duration row */}
      <div className="flex gap-2">
        {/* Sets */}
        <div className="flex-1">
          <label className="block text-xs font-medium text-gray-500 mb-1">Sets</label>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => update({ sets: Math.max(1, ex.sets - 1) })}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50"
            >
              <ChevronDown className="h-4 w-4" />
            </button>
            <span className="w-6 text-center text-sm font-semibold text-gray-900">{ex.sets}</span>
            <button
              type="button"
              onClick={() => update({ sets: ex.sets + 1 })}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50"
            >
              <ChevronUp className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Reps or Duration */}
        {exercise.is_time_based ? (
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-500 mb-1">Seconds</label>
            <input
              type="number"
              min={5}
              value={ex.duration_seconds ?? ''}
              onChange={(e) => update({ duration_seconds: parseInt(e.target.value) || null })}
              className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm text-center focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        ) : (
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-500 mb-1">Reps</label>
            <input
              type="number"
              min={1}
              value={ex.reps ?? ''}
              onChange={(e) => update({ reps: parseInt(e.target.value) || null })}
              className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm text-center focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        )}

        {/* Rest (non-HIIT only) */}
        {!isHIIT && (
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-500 mb-1">Rest (s)</label>
            <input
              type="number"
              min={0}
              step={15}
              value={ex.rest_seconds}
              onChange={(e) => update({ rest_seconds: parseInt(e.target.value) || 0 })}
              className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm text-center focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        )}
      </div>

      {/* Weight suggestion */}
      <div className="mt-3">
        <label className="block text-xs font-medium text-gray-500 mb-1">Weight</label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={0}
            step={0.5}
            value={ex.weight ?? ''}
            onChange={(e) => update({ weight: parseFloat(e.target.value) || null, use_previous_weight: false })}
            placeholder={weight_suggestion.note === 'first_time' ? 'Add weight' : undefined}
            className="flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <span className="text-xs text-gray-500">{ex.weight_unit}</span>
        </div>

        {/* Progression notes */}
        {weight_suggestion.note === 'increase' && (
          <div className="mt-1.5 flex items-center gap-1.5">
            <TrendingUp className="h-3.5 w-3.5 text-green-600 shrink-0" />
            <span className="text-xs text-green-700">
              ↑ {weight_suggestion.suggested_weight} {ex.weight_unit} suggested
              {hasIncrease && !ex.use_previous_weight && (
                <button
                  type="button"
                  onClick={handleUsePrevious}
                  className="ml-2 text-xs text-blue-600 underline"
                >
                  Use previous ({weight_suggestion.previous_weight} {ex.weight_unit})
                </button>
              )}
              {hasIncrease && ex.use_previous_weight && (
                <button
                  type="button"
                  onClick={handleUseSuggested}
                  className="ml-2 text-xs text-blue-600 underline"
                >
                  Use suggested ({weight_suggestion.suggested_weight} {ex.weight_unit})
                </button>
              )}
            </span>
          </div>
        )}
        {weight_suggestion.note === 'endurance' && weight_suggestion.suggested_weight && (
          <p className="mt-1 text-xs text-gray-500">
            70% of recent max — {weight_suggestion.suggested_weight} {ex.weight_unit}
          </p>
        )}
      </div>
    </div>
  )
}
