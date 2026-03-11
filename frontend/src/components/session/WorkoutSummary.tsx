import { useState } from 'react'
import { CheckCircle, Loader2, Trash2 } from 'lucide-react'
import { formatDuration } from '../../hooks/useTimer'
import type { WorkoutSession } from '../../types/workout'

interface Props {
  session: WorkoutSession
  totalSeconds: number
  isSaving: boolean
  onSave: (notes: string) => void
  onDiscard: () => void
}

export default function WorkoutSummary({ session, totalSeconds, isSaving, onSave, onDiscard }: Props) {
  const [notes, setNotes] = useState('')

  const completedSets = session.activeExercises.reduce(
    (sum, ex) => sum + ex.sets.filter((s) => s.completed).length,
    0
  )

  const totalSets = session.exercises.reduce((sum, ex) => sum + ex.target_sets, 0)

  function calcVolume(exerciseIndex: number): number {
    const sets = session.activeExercises[exerciseIndex]?.sets ?? []
    return sets
      .filter((s) => s.completed && s.reps && s.weight)
      .reduce((sum, s) => sum + (s.reps ?? 0) * (s.weight ?? 0), 0)
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-950 text-white">
      {/* Header */}
      <div className="flex flex-col items-center gap-3 px-5 pt-12 pb-6">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-600/20">
          <CheckCircle className="h-8 w-8 text-green-400" />
        </div>
        <h1 className="text-2xl font-bold">Workout Complete!</h1>
        <p className="text-3xl font-mono font-bold tabular-nums text-green-400">
          {formatDuration(totalSeconds)}
        </p>
        <p className="text-sm text-gray-400">
          {completedSets} / {totalSets} sets completed
        </p>
      </div>

      {/* Exercise breakdown */}
      <div className="flex-1 overflow-y-auto px-4">
        <div className="space-y-2">
          {session.exercises.map((ex, i) => {
            const activeSets = session.activeExercises[i]?.sets ?? []
            const done = activeSets.filter((s) => s.completed).length
            const volume = calcVolume(i)
            return (
              <div key={ex.exercise_id} className="rounded-xl bg-gray-800/60 px-4 py-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold text-white">{ex.exercise_name}</p>
                  <span className="shrink-0 text-xs text-gray-400">
                    {done} / {ex.target_sets} sets
                  </span>
                </div>
                {volume > 0 && (
                  <p className="mt-0.5 text-xs text-gray-500">
                    Volume: {Math.round(volume).toLocaleString()} {activeSets[0]?.weight_unit ?? 'lbs'}
                  </p>
                )}
                {/* Set details */}
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {activeSets.map((s, si) => (
                    <span
                      key={si}
                      className={`rounded-md px-2 py-0.5 text-xs ${
                        s.completed
                          ? 'bg-green-900/40 text-green-400'
                          : 'bg-gray-700 text-gray-500 line-through'
                      }`}
                    >
                      {s.reps != null
                        ? `${s.reps}r${s.weight ? ` × ${s.weight}` : ''}`
                        : `${s.duration_seconds ?? '?'}s`}
                    </span>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        {/* Notes */}
        <div className="mt-4 mb-2">
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-400">
            Notes (optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="How did it go? Any notes..."
            className="w-full resize-none rounded-xl bg-gray-800 px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="px-4 pb-10 pt-4 space-y-3">
        <button
          type="button"
          onClick={() => onSave(notes)}
          disabled={isSaving}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-green-600 py-4 text-base font-bold text-white shadow-lg hover:bg-green-700 disabled:opacity-50"
        >
          {isSaving ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Saving…
            </>
          ) : (
            'Save Workout'
          )}
        </button>
        <button
          type="button"
          onClick={onDiscard}
          disabled={isSaving}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-gray-700 py-3.5 text-sm font-semibold text-gray-400 hover:border-gray-500 hover:text-gray-200 disabled:opacity-50"
        >
          <Trash2 className="h-4 w-4" />
          Discard
        </button>
      </div>
    </div>
  )
}
