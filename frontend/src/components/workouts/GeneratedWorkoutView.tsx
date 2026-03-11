import { Fragment, useState } from 'react'
import { Clock, Dumbbell, Play, RefreshCw, Save } from 'lucide-react'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import type { EditableExercise, GeneratedWorkout, WeightSuggestion } from '../../types/workout'
import type { Exercise } from '../../types/exercise'
import WorkoutExerciseRow from './WorkoutExerciseRow'
import HIITConfigPanel from './HIITConfigPanel'
import SaveWorkoutModal from './SaveWorkoutModal'
import ExerciseInfoModal from './ExerciseInfoModal'
import ExerciseReplaceModal from './ExerciseReplaceModal'
import SupersetLink from '../session/SupersetLink'
import { areSupersetted, toggleSupersetLink } from '../../utils/superset'

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
  onStart: (exercises: EditableExercise[]) => void
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
      superset_group: null,
    }
  })
}

export default function GeneratedWorkoutView({ workout, isSaving, onSave, onRegenerate, onStart }: Props) {
  const [exercises, setExercises] = useState<EditableExercise[]>(() => initEditableExercises(workout))
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [infoTarget, setInfoTarget] = useState<EditableExercise | null>(null)
  const [replaceTarget, setReplaceTarget] = useState<{ index: number; ex: EditableExercise } | null>(null)

  const sensors = useSensors(
    // Desktop: start drag after 8px of mouse movement (prevents misclicks on buttons)
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    // Mobile: require a 200ms hold on the grip handle before drag starts,
    // allowing up to 5px of finger drift during the hold without cancelling
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } })
  )

  // HIIT config state
  const [isCircuit, setIsCircuit] = useState(workout.is_circuit)
  const [rounds, setRounds] = useState(workout.circuit_rounds ?? 3)
  const [setDuration, setSetDuration] = useState(workout.circuit_set_duration_seconds ?? 45)
  const [restSec, setRestSec] = useState(workout.circuit_rest_seconds ?? 15)
  const [roundRest, setRoundRest] = useState(workout.circuit_round_rest_seconds ?? 60)

  function handleExerciseChange(index: number, updated: EditableExercise) {
    setExercises((prev) => prev.map((e, i) => (i === index ? updated : e)))
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (over && active.id !== over.id) {
      setExercises((prev) => {
        const oldIndex = prev.findIndex((e) => e.exercise.id === active.id)
        const newIndex = prev.findIndex((e) => e.exercise.id === over.id)
        return arrayMove(prev, oldIndex, newIndex)
      })
    }
  }

  function handleReplace(newExercise: Exercise) {
    if (!replaceTarget) return
    const { index, ex } = replaceTarget
    const sameType = newExercise.is_time_based === ex.exercise.is_time_based
    const firstTimeSuggestion: WeightSuggestion = {
      suggested_weight: null,
      previous_weight: null,
      weight_unit: ex.weight_unit,
      note: 'first_time',
    }
    setExercises((prev) =>
      prev.map((e, i) => {
        if (i !== index) return e
        return {
          ...e,
          exercise: newExercise,
          reps: newExercise.is_time_based ? null : (sameType ? ex.reps : 10),
          duration_seconds: newExercise.is_time_based
            ? (sameType ? ex.duration_seconds : 45)
            : null,
          weight: null,
          weight_suggestion: firstTimeSuggestion,
          use_previous_weight: false,
          superset_group: e.superset_group,
        }
      })
    )
    setReplaceTarget(null)
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
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={exercises.map((e) => e.exercise.id)} strategy={verticalListSortingStrategy}>
            <div>
              {exercises.map((ex, i) => (
                <Fragment key={ex.exercise.id}>
                  <WorkoutExerciseRow
                    ex={ex}
                    index={i}
                    isHIIT={isHIIT}
                    onChange={(updated) => handleExerciseChange(i, updated)}
                    onInfo={() => setInfoTarget(ex)}
                    onReplace={() => setReplaceTarget({ index: i, ex })}
                  />
                  {i < exercises.length - 1 && (
                    <SupersetLink
                      linked={areSupersetted(exercises, i)}
                      onToggle={() => setExercises((prev) => toggleSupersetLink(prev, i))}
                    />
                  )}
                </Fragment>
              ))}
            </div>
          </SortableContext>
        </DndContext>

        {/* Action buttons */}
        <div className="grid grid-cols-3 gap-2 pt-2">
          <button
            type="button"
            onClick={onRegenerate}
            className="flex items-center justify-center gap-1.5 rounded-lg border border-gray-300 px-3 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            <RefreshCw className="h-4 w-4" />
            Redo
          </button>
          <button
            type="button"
            onClick={() => setShowSaveModal(true)}
            className="flex items-center justify-center gap-1.5 rounded-lg border border-gray-300 px-3 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            <Save className="h-4 w-4" />
            Save
          </button>
          <button
            type="button"
            onClick={() => onStart(exercises)}
            className="flex items-center justify-center gap-1.5 rounded-lg bg-green-600 px-3 py-3 text-sm font-semibold text-white hover:bg-green-700"
          >
            <Play className="h-4 w-4" />
            Start
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

      {infoTarget && (
        <ExerciseInfoModal
          exercise={infoTarget.exercise}
          onClose={() => setInfoTarget(null)}
        />
      )}

      {replaceTarget && (
        <ExerciseReplaceModal
          target={replaceTarget.ex}
          onReplace={handleReplace}
          onClose={() => setReplaceTarget(null)}
        />
      )}
    </>
  )
}
