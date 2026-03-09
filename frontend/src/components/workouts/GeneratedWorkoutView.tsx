import { useState } from 'react'
import { Clock, Dumbbell, RefreshCw, Save } from 'lucide-react'
import type { EditableExercise, GeneratedWorkout } from '../../types/workout'
import WorkoutExerciseRow from './WorkoutExerciseRow'
import HIITConfigPanel from './HIITConfigPanel'
import SaveWorkoutModal from './SaveWorkoutModal'

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
  workout: GeneratedWorkout
  isSaving: boolean
  onSave: (name: string, exercises: EditableExercise[], isCircuit: boolean, rounds: number) => void
  onRegenerate: () => void
}

function initEditableExercises(workout: GeneratedWorkout): EditableExercise[] {
  return workout.exercises.map((ex) => {
    const suggestion = ex.weight_suggestion
    const weight = suggestion.suggested_weight ?? null
    return {
      ...ex,
      weight,
      weight_unit: suggestion.weight_unit || 'lbs',
      use_previous_weight: false,
    }
  })
}

export default function GeneratedWorkoutView({ workout, isSaving, onSave, onRegenerate }: Props) {
  const [exercises, setExercises] = useState<EditableExercise[]>(() => initEditableExercises(workout))
  const [showSaveModal, setShowSaveModal] = useState(false)

  // HIIT config state
  const [isCircuit, setIsCircuit] = useState(workout.is_circuit)
  const [rounds, setRounds] = useState(workout.circuit_rounds ?? 3)
  const [setDuration, setSetDuration] = useState(workout.circuit_set_duration_seconds ?? 45)
  const [restSec, setRestSec] = useState(workout.circuit_rest_seconds ?? 15)
  const [roundRest, setRoundRest] = useState(workout.circuit_round_rest_seconds ?? 60)

  function handleExerciseChange(index: number, updated: EditableExercise) {
    setExercises((prev) => prev.map((e, i) => (i === index ? updated : e)))
  }

  function handleSave(name: string) {
    onSave(name, exercises, isCircuit, rounds)
    setShowSaveModal(false)
  }

  const isHIIT = workout.style === 'hiit'

  return (
    <>
      <div className="space-y-4">
        {/* Summary header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`rounded-full px-3 py-1 text-sm font-semibold ${STYLE_COLORS[workout.style] ?? 'bg-gray-100 text-gray-700'}`}>
              {STYLE_LABELS[workout.style] ?? workout.style}
            </span>
            <span className="flex items-center gap-1 text-sm text-gray-600">
              <Clock className="h-4 w-4" />
              {workout.estimated_duration_minutes} min
            </span>
            <span className="flex items-center gap-1 text-sm text-gray-600">
              <Dumbbell className="h-4 w-4" />
              {exercises.length} exercises
            </span>
          </div>
        </div>

        {/* HIIT config */}
        {isHIIT && (
          <HIITConfigPanel
            isCircuit={isCircuit}
            rounds={rounds}
            setDurationSeconds={setDuration}
            restSeconds={restSec}
            roundRestSeconds={roundRest}
            onIsCircuitChange={setIsCircuit}
            onRoundsChange={setRounds}
            onSetDurationChange={setSetDuration}
            onRestChange={setRestSec}
            onRoundRestChange={setRoundRest}
          />
        )}

        {/* Exercise list */}
        <div className="space-y-3">
          {exercises.map((ex, i) => (
            <WorkoutExerciseRow
              key={ex.exercise.id}
              ex={ex}
              index={i}
              isHIIT={isHIIT}
              onChange={(updated) => handleExerciseChange(i, updated)}
            />
          ))}
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onRegenerate}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-gray-300 px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            <RefreshCw className="h-4 w-4" />
            Regenerate
          </button>
          <button
            type="button"
            onClick={() => setShowSaveModal(true)}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700"
          >
            <Save className="h-4 w-4" />
            Save Workout
          </button>
        </div>
      </div>

      {showSaveModal && (
        <SaveWorkoutModal
          isSaving={isSaving}
          onSave={handleSave}
          onCancel={() => setShowSaveModal(false)}
        />
      )}
    </>
  )
}
