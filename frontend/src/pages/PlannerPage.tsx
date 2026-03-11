import { useState } from 'react'
import { useNavigate } from 'react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { ChevronDown, ChevronUp, Heart, Loader2 } from 'lucide-react'
import { generateWorkout } from '../api/planner'
import { createWorkout, deleteWorkout, getWorkout, getWorkouts, toggleFavorite } from '../api/workouts'
import * as profileApi from '../api/profile'
import type { EditableExercise, GeneratedWorkout, Workout, WorkoutDetail, WorkoutSession, ActiveExercise, SessionExercise } from '../types/workout'
import { useWorkoutSessionStore } from '../stores/workoutSessionStore'
import GeneratedWorkoutView from '../components/workouts/GeneratedWorkoutView'
import SavedWorkoutCard from '../components/workouts/SavedWorkoutCard'
import WorkoutDetailModal from '../components/workouts/WorkoutDetailModal'
import ConfirmDialog from '../components/common/ConfirmDialog'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MUSCLE_GROUPS = ['Back', 'Chest', 'Shoulders', 'Biceps', 'Triceps', 'Core', 'Legs', 'Cardio']

const STYLES = [
  { value: 'strength', label: 'Strength', desc: 'Heavy, low reps' },
  { value: 'hypertrophy', label: 'Hypertrophy', desc: 'Moderate, 8–12 reps' },
  { value: 'endurance', label: 'Endurance', desc: 'Light, high reps' },
  { value: 'hiit', label: 'HIIT', desc: 'High intensity circuits' },
]

const STYLE_FILTER_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'strength', label: 'Strength' },
  { value: 'hypertrophy', label: 'Hypertrophy' },
  { value: 'endurance', label: 'Endurance' },
  { value: 'hiit', label: 'HIIT' },
]

// ---------------------------------------------------------------------------
// Generate Tab
// ---------------------------------------------------------------------------

interface GenerateTabProps {
  onGenerated: (workout: GeneratedWorkout) => void
}

function GenerateTab({ onGenerated }: GenerateTabProps) {
  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: profileApi.getProfile,
  })

  const defaultDuration = profile?.workout_preferences.default_duration_minutes ?? 45
  const rawDefaultStyle = profile?.workout_preferences.preferred_style ?? 'hypertrophy'
  const defaultStyle = rawDefaultStyle === 'mixed' ? 'hypertrophy' : rawDefaultStyle

  const [muscleGroups, setMuscleGroups] = useState<string[]>([])
  const [duration, setDuration] = useState(defaultDuration)
  const [style, setStyle] = useState(defaultStyle)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [muscleWeights, setMuscleWeights] = useState<Record<string, number>>({})

  const { mutate, isPending } = useMutation({
    mutationFn: generateWorkout,
    onSuccess: onGenerated,
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || 'Failed to generate workout')
    },
  })

  function toggleMuscle(group: string) {
    const lower = group.toLowerCase()
    setMuscleGroups((prev) =>
      prev.includes(lower) ? prev.filter((g) => g !== lower) : [...prev, lower]
    )
  }

  function handleGenerate() {
    if (muscleGroups.length === 0) {
      toast.error('Select at least one muscle group')
      return
    }
    mutate({
      muscle_groups: muscleGroups,
      duration_minutes: duration,
      style,
      muscle_weights: Object.keys(muscleWeights).length > 0 ? muscleWeights : undefined,
    })
  }

  const multiMuscle = muscleGroups.length > 1

  return (
    <div className="space-y-5">
      {/* Muscle groups */}
      <div>
        <p className="mb-2 text-sm font-semibold text-gray-700">Muscle Groups</p>
        <div className="grid grid-cols-2 gap-2">
          {MUSCLE_GROUPS.map((group) => {
            const lower = group.toLowerCase()
            const selected = muscleGroups.includes(lower)
            return (
              <button
                key={group}
                type="button"
                onClick={() => toggleMuscle(group)}
                className={`rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors ${
                  selected
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-300 text-gray-700 hover:border-gray-400'
                }`}
              >
                {group}
              </button>
            )
          })}
        </div>
      </div>

      {/* Duration */}
      <div>
        <label className="mb-1 block text-sm font-semibold text-gray-700">
          Duration: {duration} min
        </label>
        <input
          type="range"
          min={15}
          max={120}
          step={5}
          value={duration}
          onChange={(e) => setDuration(parseInt(e.target.value))}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-gray-400">
          <span>15 min</span>
          <span>120 min</span>
        </div>
      </div>

      {/* Style */}
      <div>
        <p className="mb-2 text-sm font-semibold text-gray-700">Workout Style</p>
        <div className="grid grid-cols-2 gap-2">
          {STYLES.map(({ value, label, desc }) => (
            <button
              key={value}
              type="button"
              onClick={() => setStyle(value)}
              className={`rounded-lg border px-3 py-2.5 text-left transition-colors ${
                style === value
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <p className="text-sm font-semibold text-gray-900">{label}</p>
              <p className="text-xs text-gray-500">{desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Advanced — muscle weight sliders */}
      {multiMuscle && (
        <div>
          <button
            type="button"
            onClick={() => setShowAdvanced((v) => !v)}
            className="flex items-center gap-1 text-sm font-medium text-blue-600"
          >
            {showAdvanced ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            Advanced: muscle focus
          </button>
          {showAdvanced && (
            <div className="mt-3 space-y-3 rounded-xl border border-gray-200 bg-gray-50 p-4">
              <p className="text-xs text-gray-500">
                Adjust how many exercises are allocated per muscle group.
              </p>
              {muscleGroups.map((group) => {
                const weight = muscleWeights[group] ?? 1.0
                return (
                  <div key={group}>
                    <div className="flex justify-between text-xs font-medium text-gray-700 mb-1">
                      <span className="capitalize">{group}</span>
                      <span>{weight.toFixed(1)}×</span>
                    </div>
                    <input
                      type="range"
                      min={0.5}
                      max={3}
                      step={0.5}
                      value={weight}
                      onChange={(e) =>
                        setMuscleWeights((prev) => ({
                          ...prev,
                          [group]: parseFloat(e.target.value),
                        }))
                      }
                      className="w-full"
                    />
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={handleGenerate}
        disabled={isPending || muscleGroups.length === 0}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"
      >
        {isPending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Generating…
          </>
        ) : (
          'Generate Workout'
        )}
      </button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// My Workouts Tab
// ---------------------------------------------------------------------------

function MyWorkoutsTab() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { startSession } = useWorkoutSessionStore()
  const [styleFilter, setStyleFilter] = useState('')
  const [favoritesOnly, setFavoritesOnly] = useState(false)
  const [viewingWorkout, setViewingWorkout] = useState<WorkoutDetail | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['workouts', styleFilter, favoritesOnly],
    queryFn: () => getWorkouts({ style: styleFilter || undefined, favorites_only: favoritesOnly }),
  })

  const favoriteMutation = useMutation({
    mutationFn: toggleFavorite,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['workouts'] }),
    onError: () => toast.error('Failed to update favorite'),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteWorkout,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workouts'] })
      toast.success('Workout deleted')
    },
    onError: () => toast.error('Failed to delete workout'),
  })

  async function handleView(workout: Workout) {
    try {
      const detail = await getWorkout(workout.id)
      setViewingWorkout(detail)
    } catch {
      toast.error('Failed to load workout details')
    }
  }

  function handleEdit(id: string) {
    navigate(`/workout/edit/${id}`)
  }

  function handleStartSaved(workout: WorkoutDetail) {
    const validExercises = workout.exercises.filter((ex) => ex.exercise !== null)
    if (validExercises.length === 0) {
      toast.error('No valid exercises found in this workout')
      return
    }
    const sessionExercises: SessionExercise[] = validExercises.map((ex, i) => ({
      exercise_id: ex.exercise_id,
      exercise_name: ex.exercise!.name,
      exercise: ex.exercise!,
      order: i,
      target_sets: ex.sets,
      target_reps: ex.reps,
      target_duration_seconds: ex.duration_seconds,
      target_weight: ex.target_weight,
      weight_unit: ex.weight_unit,
      rest_seconds: ex.rest_seconds,
      superset_group: ex.superset_group,
    }))
    const activeExercises: ActiveExercise[] = validExercises.map((ex, i) => ({
      exercise_id: ex.exercise_id,
      exercise_name: ex.exercise!.name,
      order: i,
      sets: [],
    }))
    const session: WorkoutSession = {
      workoutId: workout.id,
      workoutName: workout.name,
      style: workout.workout_style,
      isCircuit: workout.is_circuit,
      circuitRounds: workout.circuit_rounds ?? 3,
      circuitSetDurationSeconds: 45,
      circuitRestSeconds: 15,
      circuitRoundRestSeconds: 60,
      exercises: sessionExercises,
      startedAt: new Date().toISOString(),
      activeExercises,
      currentExerciseIndex: 0,
      currentSetIndex: 0,
      currentRoundIndex: 0,
      currentCircuitExerciseIndex: 0,
    }
    startSession(session)
    navigate('/workout/active')
  }

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="space-y-2">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {STYLE_FILTER_OPTIONS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => setStyleFilter(value)}
              className={`shrink-0 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                styleFilter === value
                  ? 'border-blue-500 bg-blue-500 text-white'
                  : 'border-gray-300 text-gray-600 hover:border-gray-400'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setFavoritesOnly((v) => !v)}
          className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
            favoritesOnly
              ? 'border-red-400 bg-red-50 text-red-600'
              : 'border-gray-300 text-gray-600 hover:border-gray-400'
          }`}
        >
          <Heart className={`h-3.5 w-3.5 ${favoritesOnly ? 'fill-red-500 text-red-500' : ''}`} />
          Favorites
        </button>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
        </div>
      ) : !data?.workouts.length ? (
        <div className="py-12 text-center">
          <p className="text-gray-500">No saved workouts yet.</p>
          <p className="mt-1 text-sm text-gray-400">Generate a workout and save it to see it here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {data.workouts.map((workout) => (
            <SavedWorkoutCard
              key={workout.id}
              workout={workout}
              onView={handleView}
              onFavorite={(id) => favoriteMutation.mutate(id)}
              onDelete={(id) => setDeleteId(id)}
              onEdit={handleEdit}
            />
          ))}
        </div>
      )}

      {viewingWorkout && (
        <WorkoutDetailModal
          workout={viewingWorkout}
          onClose={() => setViewingWorkout(null)}
          onStart={() => handleStartSaved(viewingWorkout)}
          onEdit={() => { setViewingWorkout(null); handleEdit(viewingWorkout.id) }}
        />
      )}

      {deleteId && (
        <ConfirmDialog
          title="Delete workout?"
          message="This saved workout will be permanently removed."
          confirmLabel="Delete"
          isLoading={deleteMutation.isPending}
          onConfirm={() => {
            deleteMutation.mutate(deleteId, {
              onSettled: () => setDeleteId(null),
            })
          }}
          onCancel={() => setDeleteId(null)}
        />
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

type Tab = 'generate' | 'my-workouts'

export function PlannerPage() {
  const navigate = useNavigate()
  const { startSession } = useWorkoutSessionStore()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<Tab>('generate')
  const [generatedWorkout, setGeneratedWorkout] = useState<GeneratedWorkout | null>(null)

  function handleStart(exercises: EditableExercise[]) {
    if (!generatedWorkout) return
    const style = generatedWorkout.style
    const workoutName = style.charAt(0).toUpperCase() + style.slice(1) + ' Workout'
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
      workoutId: null,
      workoutName,
      style,
      isCircuit: generatedWorkout.is_circuit,
      circuitRounds: generatedWorkout.circuit_rounds ?? 3,
      circuitSetDurationSeconds: generatedWorkout.circuit_set_duration_seconds ?? 45,
      circuitRestSeconds: generatedWorkout.circuit_rest_seconds ?? 15,
      circuitRoundRestSeconds: generatedWorkout.circuit_round_rest_seconds ?? 60,
      exercises: sessionExercises,
      startedAt: new Date().toISOString(),
      activeExercises,
      currentExerciseIndex: 0,
      currentSetIndex: 0,
      currentRoundIndex: 0,
      currentCircuitExerciseIndex: 0,
    }
    startSession(session)
    navigate('/workout/active')
  }

  const saveMutation = useMutation({
    mutationFn: createWorkout,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workouts'] })
      toast.success('Workout saved!')
      setGeneratedWorkout(null)
      setActiveTab('my-workouts')
    },
    onError: () => toast.error('Failed to save workout'),
  })

  function handleSave(
    name: string,
    exercises: EditableExercise[],
    isCircuit: boolean,
    rounds: number,
  ) {
    if (!generatedWorkout) return

    saveMutation.mutate({
      name,
      workout_style: generatedWorkout.style,
      estimated_duration_minutes: generatedWorkout.estimated_duration_minutes,
      target_muscle_groups: [],
      is_circuit: isCircuit,
      circuit_rounds: isCircuit ? rounds : null,
      exercises: exercises.map((ex, i) => ({
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
    })
  }

  return (
    <div className="mx-auto max-w-lg px-4 pt-6 pb-24">
      <h1 className="mb-4 text-2xl font-bold text-gray-900">Workout Planner</h1>

      {/* Tab bar */}
      <div className="mb-5 flex rounded-xl border border-gray-200 bg-gray-100 p-1">
        {([
          { key: 'generate', label: 'Generate' },
          { key: 'my-workouts', label: 'My Workouts' },
        ] as const).map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => {
              setActiveTab(key)
              if (key !== 'generate') setGeneratedWorkout(null)
            }}
            className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-colors ${
              activeTab === key
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === 'generate' ? (
        generatedWorkout ? (
          <GeneratedWorkoutView
            workout={generatedWorkout}
            isSaving={saveMutation.isPending}
            onSave={handleSave}
            onRegenerate={() => setGeneratedWorkout(null)}
            onStart={handleStart}
          />
        ) : (
          <GenerateTab onGenerated={setGeneratedWorkout} />
        )
      ) : (
        <MyWorkoutsTab />
      )}
    </div>
  )
}
