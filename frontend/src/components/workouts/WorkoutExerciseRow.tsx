import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { ArrowLeftRight, ChevronDown, ChevronUp, GripVertical, Info, ThumbsDown, ThumbsUp, TrendingUp } from 'lucide-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import type { EditableExercise } from '../../types/workout'
import * as profileApi from '../../api/profile'
import * as exercisesApi from '../../api/exercises'

const levelColor: Record<string, string> = {
  beginner: 'bg-emerald-100 text-emerald-700',
  intermediate: 'bg-amber-100 text-amber-700',
  expert: 'bg-red-100 text-red-700',
}

interface Props {
  ex: EditableExercise
  index: number
  isHIIT: boolean
  onChange: (updated: EditableExercise) => void
  onInfo: () => void
  onReplace: () => void
}

export default function WorkoutExerciseRow({ ex, index, isHIIT, onChange, onInfo, onReplace }: Props) {
  const { exercise, weight_suggestion } = ex
  const hasIncrease = weight_suggestion.note === 'increase' && weight_suggestion.previous_weight !== null

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: exercise.id,
  })

  // Like / dislike
  const queryClient = useQueryClient()
  const { data: profile } = useQuery({ queryKey: ['profile'], queryFn: profileApi.getProfile })
  const isLiked = profile?.liked_exercises.includes(exercise.id) ?? false
  const isDisliked = profile?.disliked_exercises.includes(exercise.id) ?? false
  const invalidateProfile = () => queryClient.invalidateQueries({ queryKey: ['profile'] })

  const likeMutation = useMutation({
    mutationFn: () => isLiked ? exercisesApi.removeLike(exercise.id) : exercisesApi.likeExercise(exercise.id),
    onSuccess: invalidateProfile,
    onError: () => toast.error('Failed to update preference'),
  })
  const dislikeMutation = useMutation({
    mutationFn: () => isDisliked ? exercisesApi.removeDislike(exercise.id) : exercisesApi.dislikeExercise(exercise.id),
    onSuccess: invalidateProfile,
    onError: () => toast.error('Failed to update preference'),
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : undefined,
  }

  function update(patch: Partial<EditableExercise>) {
    onChange({ ...ex, ...patch })
  }

  function handleUsePrevious() {
    update({ weight: weight_suggestion.previous_weight, use_previous_weight: true })
  }

  function handleUseSuggested() {
    update({ weight: weight_suggestion.suggested_weight, use_previous_weight: false })
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="rounded-xl border border-gray-200 bg-white shadow-sm"
    >
      {/* Header */}
      <div className="p-4 pb-3">
        {/* Row 1: drag handle + name + action icons */}
        <div className="flex items-start gap-2">
          {/* Drag handle — touch-action:none lets dnd-kit own the touch event
              so the browser won't intercept it as a scroll gesture */}
          <button
            type="button"
            className="mt-0.5 shrink-0 cursor-grab text-gray-300 hover:text-gray-500 active:cursor-grabbing"
            style={{ touchAction: 'none' }}
            {...listeners}
            {...attributes}
            tabIndex={-1}
            aria-label="Drag to reorder"
          >
            <GripVertical className="h-4 w-4" />
          </button>

          <p className="flex-1 min-w-0 font-semibold text-gray-900 leading-snug">{exercise.name}</p>

          {/* Action icons + index */}
          <div className="flex shrink-0 items-center gap-1.5">
            <button
              type="button"
              onClick={() => likeMutation.mutate()}
              disabled={likeMutation.isPending || dislikeMutation.isPending}
              className={`flex h-7 w-7 items-center justify-center rounded-lg hover:bg-gray-100 disabled:opacity-50 ${isLiked ? 'text-green-500' : 'text-gray-400 hover:text-gray-600'}`}
              title={isLiked ? 'Unlike exercise' : 'Like exercise'}
            >
              <ThumbsUp className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => dislikeMutation.mutate()}
              disabled={likeMutation.isPending || dislikeMutation.isPending}
              className={`flex h-7 w-7 items-center justify-center rounded-lg hover:bg-gray-100 disabled:opacity-50 ${isDisliked ? 'text-red-500' : 'text-gray-400 hover:text-gray-600'}`}
              title={isDisliked ? 'Remove dislike' : 'Dislike exercise'}
            >
              <ThumbsDown className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={onInfo}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              title="Exercise details"
            >
              <Info className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={onReplace}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              title="Replace exercise"
            >
              <ArrowLeftRight className="h-3.5 w-3.5" />
            </button>
            <span className="text-xs font-medium text-gray-400">#{index + 1}</span>
          </div>
        </div>

        {/* Row 2: chips — full card width */}
        <div className="mt-2 flex flex-wrap gap-1.5">
          {exercise.equipment && (
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs capitalize text-gray-600">
              {exercise.equipment}
            </span>
          )}
          {exercise.mechanic && (
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs capitalize text-gray-600">
              {exercise.mechanic}
            </span>
          )}
          {exercise.level && (
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${levelColor[exercise.level] ?? 'bg-gray-100 text-gray-600'}`}>
              {exercise.level}
            </span>
          )}
          {exercise.primary_muscles.slice(0, 2).map((m) => (
            <span key={m} className="rounded-full bg-blue-50 px-2 py-0.5 text-xs capitalize text-blue-600">
              {m}
            </span>
          ))}
          {exercise.is_time_based && (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs capitalize text-amber-700">
              timed
            </span>
          )}
        </div>
      </div>

      <div className="px-4 pb-4 space-y-3">
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

        {/* Weight */}
        <div>
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

          {weight_suggestion.note === 'increase' && (
            <div className="mt-1.5 flex items-center gap-1.5">
              <TrendingUp className="h-3.5 w-3.5 text-green-600 shrink-0" />
              <span className="text-xs text-green-700">
                ↑ {weight_suggestion.suggested_weight} {ex.weight_unit} suggested
                {hasIncrease && !ex.use_previous_weight && (
                  <button type="button" onClick={handleUsePrevious} className="ml-2 text-xs text-blue-600 underline">
                    Use previous ({weight_suggestion.previous_weight} {ex.weight_unit})
                  </button>
                )}
                {hasIncrease && ex.use_previous_weight && (
                  <button type="button" onClick={handleUseSuggested} className="ml-2 text-xs text-blue-600 underline">
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
    </div>
  )
}
