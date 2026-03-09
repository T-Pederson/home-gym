import { useState } from 'react'
import { X, ChevronLeft, ChevronRight, ThumbsUp, ThumbsDown } from 'lucide-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import type { Exercise } from '../../types/exercise'
import { IMAGE_BASE_URL } from '../../types/exercise'
import * as profileApi from '../../api/profile'
import * as exercisesApi from '../../api/exercises'

const levelColor: Record<string, string> = {
  beginner: 'bg-emerald-100 text-emerald-700',
  intermediate: 'bg-amber-100 text-amber-700',
  expert: 'bg-red-100 text-red-700',
}

interface Props {
  exercise: Exercise
  onClose: () => void
}

export default function ExerciseInfoModal({ exercise, onClose }: Props) {
  const [imageIndex, setImageIndex] = useState(0)
  const images = exercise.images.map((img) => `${IMAGE_BASE_URL}${img}`)
  const hasImages = images.length > 0

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

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 sm:items-center">
      <div className="flex max-h-[90vh] w-full max-w-md flex-col rounded-t-2xl bg-white shadow-xl sm:rounded-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <h2 className="font-semibold text-gray-900">Exercise Details</h2>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => likeMutation.mutate()}
              disabled={likeMutation.isPending || dislikeMutation.isPending}
              className={`flex h-8 w-8 items-center justify-center rounded-lg hover:bg-gray-100 disabled:opacity-50 ${isLiked ? 'text-green-500' : 'text-gray-400 hover:text-gray-600'}`}
              title={isLiked ? 'Unlike exercise' : 'Like exercise'}
            >
              <ThumbsUp className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => dislikeMutation.mutate()}
              disabled={likeMutation.isPending || dislikeMutation.isPending}
              className={`flex h-8 w-8 items-center justify-center rounded-lg hover:bg-gray-100 disabled:opacity-50 ${isDisliked ? 'text-red-500' : 'text-gray-400 hover:text-gray-600'}`}
              title={isDisliked ? 'Remove dislike' : 'Dislike exercise'}
            >
              <ThumbsDown className="h-4 w-4" />
            </button>
            <div className="mx-1 h-4 w-px bg-gray-200" />
            <button type="button" onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">
          {/* Image carousel */}
          {hasImages && (
            <div className="relative overflow-hidden bg-gray-100" style={{ height: 220 }}>
              <img
                src={images[imageIndex]}
                alt={exercise.name}
                className="h-full w-full object-contain"
                onError={(e) => {
                  ;(e.target as HTMLElement).parentElement!.style.display = 'none'
                }}
              />
              {images.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => setImageIndex((i) => (i - 1 + images.length) % images.length)}
                    className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-1.5 shadow"
                  >
                    <ChevronLeft className="h-5 w-5 text-gray-700" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setImageIndex((i) => (i + 1) % images.length)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-1.5 shadow"
                  >
                    <ChevronRight className="h-5 w-5 text-gray-700" />
                  </button>
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {images.map((_, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setImageIndex(i)}
                        className={`h-1.5 w-1.5 rounded-full transition-colors ${
                          i === imageIndex ? 'bg-blue-600' : 'bg-white/60'
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          <div className="space-y-4 px-5 py-4">
            {/* Title + chips */}
            <div>
              <h1 className="text-xl font-bold leading-tight text-gray-900">{exercise.name}</h1>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {exercise.level && (
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${levelColor[exercise.level] ?? 'bg-gray-100 text-gray-600'}`}
                  >
                    {exercise.level}
                  </span>
                )}
                {exercise.category && (
                  <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs capitalize text-gray-600">
                    {exercise.category}
                  </span>
                )}
                {exercise.is_custom && (
                  <span className="rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-medium capitalize text-violet-700">
                    custom
                  </span>
                )}
              </div>
            </div>

            {/* Details grid */}
            <div className="grid grid-cols-2 gap-2">
              {exercise.equipment && <Detail label="Equipment" value={exercise.equipment} />}
              {exercise.mechanic && <Detail label="Mechanic" value={exercise.mechanic} />}
              {exercise.force && <Detail label="Force" value={exercise.force} />}
              {exercise.is_time_based && <Detail label="Type" value="Time-based" />}
            </div>

            {/* Primary muscles */}
            {exercise.primary_muscles.length > 0 && (
              <div>
                <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Primary Muscles
                </h2>
                <div className="flex flex-wrap gap-1.5">
                  {exercise.primary_muscles.map((m) => (
                    <span
                      key={m}
                      className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium capitalize text-blue-700"
                    >
                      {m}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Secondary muscles */}
            {exercise.secondary_muscles.length > 0 && (
              <div>
                <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Secondary Muscles
                </h2>
                <div className="flex flex-wrap gap-1.5">
                  {exercise.secondary_muscles.map((m) => (
                    <span
                      key={m}
                      className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium capitalize text-gray-600"
                    >
                      {m}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Instructions */}
            {exercise.instructions.length > 0 && (
              <div>
                <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Instructions
                </h2>
                <ol className="space-y-3">
                  {exercise.instructions.map((step, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                        {i + 1}
                      </span>
                      <p className="pt-0.5 text-sm leading-relaxed text-gray-700">{step}</p>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-gray-50 px-3 py-2.5">
      <p className="text-xs uppercase tracking-wide text-gray-500">{label}</p>
      <p className="mt-0.5 text-sm font-medium capitalize text-gray-800">{value}</p>
    </div>
  )
}
