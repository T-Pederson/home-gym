import { X, Clock, Dumbbell } from 'lucide-react'
import type { WorkoutDetail } from '../../types/workout'

const STYLE_LABELS: Record<string, string> = {
  strength: 'Strength',
  hypertrophy: 'Hypertrophy',
  endurance: 'Endurance',
  hiit: 'HIIT',
}

const STYLE_COLORS: Record<string, string> = {
  strength: 'bg-red-100 text-red-700',
  hypertrophy: 'bg-blue-100 text-blue-700',
  endurance: 'bg-green-100 text-green-700',
  hiit: 'bg-amber-100 text-amber-700',
}

interface Props {
  workout: WorkoutDetail
  onClose: () => void
}

export default function WorkoutDetailModal({ workout, onClose }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center">
      <div className="flex max-h-[85vh] w-full max-w-md flex-col rounded-t-2xl bg-white shadow-xl sm:rounded-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <div>
            <h2 className="font-semibold text-gray-900">{workout.name}</h2>
            {workout.description && (
              <p className="mt-0.5 text-xs text-gray-500">{workout.description}</p>
            )}
          </div>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Meta */}
        <div className="flex items-center gap-3 px-5 py-3 border-b border-gray-100">
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STYLE_COLORS[workout.workout_style] ?? 'bg-gray-100 text-gray-700'}`}>
            {STYLE_LABELS[workout.workout_style] ?? workout.workout_style}
          </span>
          <span className="flex items-center gap-1 text-xs text-gray-500">
            <Clock className="h-3.5 w-3.5" />
            {workout.estimated_duration_minutes} min
          </span>
          <span className="flex items-center gap-1 text-xs text-gray-500">
            <Dumbbell className="h-3.5 w-3.5" />
            {workout.exercises.length} exercises
          </span>
          {workout.is_circuit && workout.circuit_rounds && (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
              {workout.circuit_rounds} rounds
            </span>
          )}
        </div>

        {/* Exercise list */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          <div className="space-y-3">
            {workout.exercises.map((ex, i) => {
              const name = ex.exercise?.name ?? `Exercise ${i + 1}`
              const equipment = ex.exercise?.equipment
              const isTimeBased = ex.exercise?.is_time_based

              return (
                <div key={i} className="flex items-start gap-3 rounded-lg bg-gray-50 p-3">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900">{name}</p>
                    <div className="mt-1 flex flex-wrap gap-2 text-xs text-gray-500">
                      <span>
                        {ex.sets} sets ×{' '}
                        {isTimeBased
                          ? `${ex.duration_seconds ?? '?'}s`
                          : `${ex.reps ?? '?'} reps`}
                      </span>
                      {ex.target_weight && (
                        <span>@ {ex.target_weight} {ex.weight_unit}</span>
                      )}
                      {!workout.is_circuit && (
                        <span>{ex.rest_seconds}s rest</span>
                      )}
                      {equipment && <span>{equipment}</span>}
                    </div>
                    {ex.notes && (
                      <p className="mt-1 text-xs text-gray-400 italic">{ex.notes}</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
