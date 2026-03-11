import { Fragment, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { ArrowLeft, Plus, Play, Save } from 'lucide-react'
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
import { getWorkout, updateWorkout } from '../api/workouts'
import { useWorkoutSessionStore } from '../stores/workoutSessionStore'
import type {
  EditableExercise,
  WorkoutDetail,
  WorkoutExerciseItem,
  WeightSuggestion,
  SessionExercise,
  ActiveExercise,
  WorkoutSession,
} from '../types/workout'
import type { Exercise } from '../types/exercise'
import WorkoutExerciseRow from '../components/workouts/WorkoutExerciseRow'
import HIITConfigPanel from '../components/workouts/HIITConfigPanel'
import ExerciseInfoModal from '../components/workouts/ExerciseInfoModal'
import ExerciseReplaceModal from '../components/workouts/ExerciseReplaceModal'
import SupersetLink from '../components/session/SupersetLink'
import { areSupersetted, toggleSupersetLink } from '../utils/superset'

const STYLE_COLORS: Record<string, string> = {
  strength: 'bg-red-100 text-red-700',
  hypertrophy: 'bg-blue-100 text-blue-700',
  endurance: 'bg-green-100 text-green-700',
  hiit: 'bg-amber-100 text-amber-700',
}

const STYLE_LABELS: Record<string, string> = {
  strength: 'Strength',
  hypertrophy: 'Hypertrophy',
  endurance: 'Endurance',
  hiit: 'HIIT',
}

function toEditableExercises(workout: WorkoutDetail): EditableExercise[] {
  return workout.exercises
    .filter((ex) => ex.exercise !== null)
    .map((ex) => ({
      exercise: ex.exercise!,
      sets: ex.sets,
      reps: ex.reps,
      duration_seconds: ex.duration_seconds,
      rest_seconds: ex.rest_seconds,
      weight_suggestion: {
        suggested_weight: ex.target_weight,
        previous_weight: ex.target_weight,
        weight_unit: ex.weight_unit,
        note: 'maintain' as const,
      },
      weight: ex.target_weight,
      weight_unit: ex.weight_unit,
      use_previous_weight: false,
      superset_group: ex.superset_group,
    }))
}

export function EditWorkoutPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { startSession } = useWorkoutSessionStore()

  const { data: workout, isLoading } = useQuery({
    queryKey: ['workout', id],
    queryFn: () => getWorkout(id!),
    enabled: !!id,
  })

  const [workoutName, setWorkoutName] = useState('')
  const [exercises, setExercises] = useState<EditableExercise[]>([])
  const [isCircuit, setIsCircuit] = useState(false)
  const [rounds, setRounds] = useState(3)
  const [setDuration, setSetDuration] = useState(45)
  const [restSec, setRestSec] = useState(15)
  const [roundRest, setRoundRest] = useState(60)

  const [infoTarget, setInfoTarget] = useState<EditableExercise | null>(null)
  const [replaceTarget, setReplaceTarget] = useState<{ index: number; ex: EditableExercise } | null>(null)
  const [addingExercise, setAddingExercise] = useState(false)

  // Seed local state once workout loads (keyed on id to avoid clobbering edits on re-fetch)
  useEffect(() => {
    if (!workout) return
    setWorkoutName(workout.name)
    setExercises(toEditableExercises(workout))
    setIsCircuit(workout.is_circuit)
    setRounds(workout.circuit_rounds ?? 3)
  }, [workout?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } })
  )

  const saveMutation = useMutation({
    mutationFn: (payload: Parameters<typeof updateWorkout>[1]) => updateWorkout(id!, payload),
    onError: () => toast.error('Failed to save workout'),
  })

  function buildPayload(): Parameters<typeof updateWorkout>[1] {
    return {
      name: workoutName.trim(),
      is_circuit: isCircuit,
      circuit_rounds: isCircuit ? rounds : null,
      exercises: exercises.map((ex, i): WorkoutExerciseItem => ({
        exercise_id: ex.exercise.id,
        order: i,
        sets: ex.sets,
        reps: ex.reps,
        duration_seconds: ex.duration_seconds,
        target_weight: ex.weight,
        weight_unit: ex.weight_unit,
        rest_seconds: ex.rest_seconds,
        notes: null,
        superset_group: ex.superset_group,
      })),
    }
  }

  function handleSave() {
    if (!workoutName.trim()) { toast.error('Workout name is required'); return }
    if (exercises.length === 0) { toast.error('Add at least one exercise'); return }
    saveMutation.mutate(buildPayload(), {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['workouts'] })
        queryClient.invalidateQueries({ queryKey: ['workout', id] })
        toast.success('Workout saved!')
        navigate(-1)
      },
    })
  }

  function handleSaveAndStart() {
    if (!workoutName.trim()) { toast.error('Workout name is required'); return }
    if (exercises.length === 0) { toast.error('Add at least one exercise'); return }
    saveMutation.mutate(buildPayload(), {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['workouts'] })
        queryClient.invalidateQueries({ queryKey: ['workout', id] })
        const sessionExercises: SessionExercise[] = exercises.map((ex, i) => ({
          exercise_id: ex.exercise.id,
          exercise_name: ex.exercise.name,
          exercise: ex.exercise,
          order: i,
          target_sets: ex.sets,
          target_reps: ex.reps,
          target_duration_seconds: ex.duration_seconds,
          target_weight: ex.weight,
          weight_unit: ex.weight_unit,
          rest_seconds: ex.rest_seconds,
          superset_group: ex.superset_group,
        }))
        const activeExercises: ActiveExercise[] = exercises.map((ex, i) => ({
          exercise_id: ex.exercise.id,
          exercise_name: ex.exercise.name,
          order: i,
          sets: [],
        }))
        const session: WorkoutSession = {
          workoutId: id!,
          workoutName: workoutName.trim(),
          style: workout!.workout_style,
          isCircuit,
          circuitRounds: rounds,
          circuitSetDurationSeconds: setDuration,
          circuitRestSeconds: restSec,
          circuitRoundRestSeconds: roundRest,
          exercises: sessionExercises,
          startedAt: new Date().toISOString(),
          activeExercises,
          currentExerciseIndex: 0,
          currentSetIndex: 0,
          currentRoundIndex: 0,
          currentCircuitExerciseIndex: 0,
        }
        startSession(session)
        navigate('/workout/active', { replace: true })
      },
    })
  }

  function handleExerciseChange(index: number, updated: EditableExercise) {
    setExercises((prev) => prev.map((e, i) => (i === index ? updated : e)))
  }

  function handleRemove(index: number) {
    setExercises((prev) => {
      const next = prev.filter((_, i) => i !== index)
      // Clear superset_group for any exercises now alone in their group
      const groupCounts: Record<string, number> = {}
      next.forEach((ex) => {
        if (ex.superset_group) groupCounts[ex.superset_group] = (groupCounts[ex.superset_group] ?? 0) + 1
      })
      return next.map((ex) =>
        ex.superset_group && groupCounts[ex.superset_group] < 2
          ? { ...ex, superset_group: null }
          : ex
      )
    })
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
          duration_seconds: newExercise.is_time_based ? (sameType ? ex.duration_seconds : 45) : null,
          weight: null,
          weight_suggestion: firstTimeSuggestion,
          use_previous_weight: false,
          superset_group: e.superset_group,
        }
      })
    )
    setReplaceTarget(null)
  }

  function handleAddExercise(newExercise: Exercise) {
    const newRow: EditableExercise = {
      exercise: newExercise,
      sets: 3,
      reps: newExercise.is_time_based ? null : 10,
      duration_seconds: newExercise.is_time_based ? 45 : null,
      rest_seconds: 60,
      weight: null,
      weight_unit: 'lbs',
      use_previous_weight: false,
      superset_group: null,
      weight_suggestion: {
        suggested_weight: null,
        previous_weight: null,
        weight_unit: 'lbs',
        note: 'first_time',
      },
    }
    setExercises((prev) => [...prev, newRow])
    setAddingExercise(false)
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

  const isHIIT = workout?.workout_style === 'hiit'

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
      </div>
    )
  }

  if (!workout) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <p className="text-gray-500">Workout not found.</p>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* Sticky header */}
      <div className="sticky top-0 z-10 border-b border-gray-100 bg-white px-4 py-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="shrink-0 rounded-lg p-1 text-gray-500 hover:bg-gray-100"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <input
            type="text"
            value={workoutName}
            onChange={(e) => setWorkoutName(e.target.value)}
            className="flex-1 rounded-lg border border-transparent px-2 py-1 text-base font-semibold text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="Workout name"
          />
          <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${STYLE_COLORS[workout.workout_style] ?? 'bg-gray-100 text-gray-700'}`}>
            {STYLE_LABELS[workout.workout_style] ?? workout.workout_style}
          </span>
        </div>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto px-4 py-4 pb-2">
        {isHIIT && (
          <div className="mb-4">
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
          </div>
        )}

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={exercises.map((e) => e.exercise.id)} strategy={verticalListSortingStrategy}>
            <div>
              {exercises.map((ex, i) => (
                <Fragment key={ex.exercise.id}>
                  <WorkoutExerciseRow
                    ex={ex}
                    index={i}
                    isHIIT={isHIIT ?? false}
                    onChange={(updated) => handleExerciseChange(i, updated)}
                    onInfo={() => setInfoTarget(ex)}
                    onReplace={() => setReplaceTarget({ index: i, ex })}
                    onRemove={() => handleRemove(i)}
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

        {/* Add exercise */}
        <button
          type="button"
          onClick={() => setAddingExercise(true)}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-300 py-3 text-sm font-medium text-gray-500 hover:border-blue-400 hover:text-blue-600"
        >
          <Plus className="h-4 w-4" />
          Add Exercise
        </button>
      </div>

      {/* Sticky footer */}
      <div className="sticky bottom-0 border-t border-gray-100 bg-white px-4 py-4">
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={handleSave}
            disabled={saveMutation.isPending}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-gray-300 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {saveMutation.isPending ? 'Saving…' : 'Save Changes'}
          </button>
          <button
            type="button"
            onClick={handleSaveAndStart}
            disabled={saveMutation.isPending}
            className="flex items-center justify-center gap-1.5 rounded-xl bg-green-600 py-3 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
          >
            <Play className="h-4 w-4" />
            Save & Start
          </button>
        </div>
      </div>

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

      {addingExercise && (
        <ExerciseReplaceModal
          onReplace={handleAddExercise}
          onClose={() => setAddingExercise(false)}
        />
      )}
    </div>
  )
}
