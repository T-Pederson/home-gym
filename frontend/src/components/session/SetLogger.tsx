import { useState } from 'react'
import { ChevronRight, Info } from 'lucide-react'
import type { ActiveSet, SessionExercise } from '../../types/workout'

interface Props {
  exercise: SessionExercise
  setNumber: number
  totalSets: number
  previousSet: ActiveSet | null
  isTimeBased: boolean
  isCircuit: boolean
  onCompleteSet: (set: ActiveSet) => void
  onSkipSet: () => void
  onViewInfo: () => void
}

export default function SetLogger({
  exercise,
  setNumber,
  totalSets,
  previousSet,
  isTimeBased,
  isCircuit,
  onCompleteSet,
  onSkipSet,
  onViewInfo,
}: Props) {
  const [reps, setReps] = useState(
    previousSet?.reps ?? exercise.target_reps ?? 10
  )
  const [weight, setWeight] = useState(
    previousSet?.weight ?? exercise.target_weight ?? 0
  )
  const [weightUnit, setWeightUnit] = useState(
    previousSet?.weight_unit ?? exercise.weight_unit ?? 'lbs'
  )
  const [duration, setDuration] = useState(
    previousSet?.duration_seconds ?? exercise.target_duration_seconds ?? 30
  )

  function handleComplete() {
    const set: ActiveSet = {
      set_number: setNumber,
      reps: isTimeBased ? null : reps,
      target_reps: exercise.target_reps,
      duration_seconds: isTimeBased ? duration : null,
      target_duration_seconds: exercise.target_duration_seconds,
      weight: isTimeBased ? null : weight,
      weight_unit: weightUnit,
      completed: true,
    }
    onCompleteSet(set)
    // Reset to same values for next set (user can adjust)
  }

  const setLabel = isCircuit ? 'Round' : 'Set'
  const hasWeight = !isTimeBased && weight !== null

  return (
    <div className="flex flex-col gap-5">
      {/* Exercise name */}
      <div>
        <button
          type="button"
          onClick={onViewInfo}
          className="flex items-center gap-2 text-left"
        >
          <h2 className="text-2xl font-bold text-white">{exercise.exercise_name}</h2>
          <Info className="h-5 w-5 shrink-0 text-gray-500" />
        </button>
        <p className="mt-1 text-sm text-gray-400 capitalize">
          {exercise.exercise.primary_muscles.slice(0, 2).join(', ')}
          {exercise.exercise.equipment ? ` · ${exercise.exercise.equipment}` : ''}
        </p>
      </div>

      {/* Set counter */}
      <div className="flex items-center gap-2">
        <span className="rounded-full bg-blue-600 px-3 py-1 text-sm font-bold text-white">
          {setLabel} {setNumber} / {totalSets}
        </span>
      </div>

      {/* Previous set reference */}
      {previousSet && (
        <div className="rounded-xl bg-gray-800/60 px-4 py-2.5 text-sm text-gray-400">
          Last set:{' '}
          {isTimeBased
            ? `${previousSet.duration_seconds ?? '?'}s`
            : `${previousSet.reps ?? '?'} reps${previousSet.weight ? ` @ ${previousSet.weight} ${previousSet.weight_unit}` : ''}`}
        </div>
      )}

      {/* Inputs */}
      <div className="space-y-3">
        {isTimeBased ? (
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-400">
              Duration (seconds)
            </label>
            <input
              type="number"
              inputMode="numeric"
              value={duration}
              onChange={(e) => setDuration(Math.max(1, parseInt(e.target.value) || 0))}
              className="w-full rounded-xl bg-gray-800 px-4 py-3 text-center text-3xl font-bold text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-400">
                Reps
              </label>
              <input
                type="number"
                inputMode="numeric"
                value={reps}
                onChange={(e) => setReps(Math.max(1, parseInt(e.target.value) || 0))}
                className="w-full rounded-xl bg-gray-800 px-4 py-3 text-center text-3xl font-bold text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <div className="mb-1 flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Weight
                </label>
                <button
                  type="button"
                  onClick={() => setWeightUnit((u) => (u === 'lbs' ? 'kg' : 'lbs'))}
                  className="rounded-md bg-gray-800 px-2 py-0.5 text-xs text-gray-400 hover:text-white"
                >
                  {weightUnit}
                </button>
              </div>
              <input
                type="number"
                inputMode="decimal"
                value={weight ?? ''}
                onChange={(e) => setWeight(parseFloat(e.target.value) || 0)}
                className="w-full rounded-xl bg-gray-800 px-4 py-3 text-center text-3xl font-bold text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* Target hint */}
      {(exercise.target_reps || exercise.target_duration_seconds || exercise.target_weight) && (
        <p className="text-center text-xs text-gray-500">
          Target:{' '}
          {isTimeBased
            ? `${exercise.target_duration_seconds}s`
            : `${exercise.target_reps} reps`}
          {!isTimeBased && exercise.target_weight
            ? ` @ ${exercise.target_weight} ${exercise.weight_unit}`
            : ''}
        </p>
      )}

      {/* Complete button */}
      <button
        type="button"
        onClick={handleComplete}
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-green-600 py-4 text-base font-bold text-white shadow-lg hover:bg-green-700 active:scale-[0.98]"
      >
        Complete Set
        <ChevronRight className="h-5 w-5" />
      </button>

      {/* Skip */}
      <button
        type="button"
        onClick={onSkipSet}
        className="mx-auto text-sm text-gray-500 hover:text-gray-300"
      >
        Skip this set
      </button>
    </div>
  )
}
