import { Clock, Dumbbell, Heart, MoreVertical, Trash2 } from 'lucide-react'
import { useState } from 'react'
import type { Workout } from '../../types/workout'

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
  workout: Workout
  onView: (workout: Workout) => void
  onFavorite: (id: string) => void
  onDelete: (id: string) => void
}

export default function SavedWorkoutCard({ workout, onView, onFavorite, onDelete }: Props) {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div
      className="relative rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
      onClick={() => onView(workout)}
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-gray-900">{workout.name}</p>
          {workout.description && (
            <p className="mt-0.5 truncate text-xs text-gray-500">{workout.description}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onFavorite(workout.id) }}
            className="p-1.5 text-gray-400 hover:text-red-500"
          >
            <Heart
              className={`h-4 w-4 ${workout.is_favorited ? 'fill-red-500 text-red-500' : ''}`}
            />
          </button>
          <div className="relative">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setMenuOpen((o) => !o) }}
              className="p-1.5 text-gray-400 hover:text-gray-600"
            >
              <MoreVertical className="h-4 w-4" />
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={(e) => { e.stopPropagation(); setMenuOpen(false) }} />
                <div className="absolute right-0 z-20 mt-1 w-36 rounded-lg border border-gray-200 bg-white shadow-lg">
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onDelete(workout.id) }}
                    className="flex w-full items-center gap-2 px-3 py-2.5 text-sm text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Meta row */}
      <div className="mt-2.5 flex flex-wrap items-center gap-2">
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STYLE_COLORS[workout.workout_style] ?? 'bg-gray-100 text-gray-600'}`}>
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
        {workout.is_circuit && (
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
            Circuit
          </span>
        )}
      </div>
    </div>
  )
}
