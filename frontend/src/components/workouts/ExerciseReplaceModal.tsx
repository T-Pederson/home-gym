import { useState, useEffect } from 'react'
import { X, ChevronLeft, ChevronRight, Search, ArrowLeft } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import type { Exercise } from '../../types/exercise'
import { IMAGE_BASE_URL } from '../../types/exercise'
import type { EditableExercise } from '../../types/workout'
import * as exercisesApi from '../../api/exercises'

// Reverse map: primary muscle name → muscle_group query param
const MUSCLE_TO_GROUP: Record<string, string> = {
  lats: 'back',
  'lower back': 'back',
  'middle back': 'back',
  traps: 'back',
  biceps: 'biceps',
  forearms: 'biceps',
  chest: 'chest',
  triceps: 'triceps',
  shoulders: 'shoulders',
  neck: 'shoulders',
  abdominals: 'core',
  quadriceps: 'legs',
  hamstrings: 'legs',
  calves: 'legs',
  glutes: 'legs',
  abductors: 'legs',
  adductors: 'legs',
}

const levelColor: Record<string, string> = {
  beginner: 'bg-emerald-100 text-emerald-700',
  intermediate: 'bg-amber-100 text-amber-700',
  expert: 'bg-red-100 text-red-700',
}

interface Props {
  target?: EditableExercise
  onReplace: (exercise: Exercise) => void
  onClose: () => void
}

export default function ExerciseReplaceModal({ target, onReplace, onClose }: Props) {
  const [view, setView] = useState<'list' | 'preview'>('list')
  const [previewExercise, setPreviewExercise] = useState<Exercise | null>(null)
  const [imageIndex, setImageIndex] = useState(0)

  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')

  // Pre-fill filters from the current exercise (if replacing); blank if adding
  const initialMuscleGroup =
    MUSCLE_TO_GROUP[target?.exercise.primary_muscles[0] ?? ''] ?? ''
  const [muscleGroup, setMuscleGroup] = useState(initialMuscleGroup)
  const [equipment, setEquipment] = useState(target?.exercise.equipment ?? '')

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 300)
    return () => clearTimeout(t)
  }, [query])

  const { data, isLoading } = useQuery({
    queryKey: ['exercises-replace', debouncedQuery, muscleGroup, equipment],
    queryFn: () =>
      exercisesApi.getExercises({
        q: debouncedQuery || undefined,
        muscle_group: muscleGroup || undefined,
        equipment: equipment || undefined,
        per_page: 20,
      }),
  })

  function handleSelectForPreview(exercise: Exercise) {
    setPreviewExercise(exercise)
    setImageIndex(0)
    setView('preview')
  }

  // ── Preview view ──────────────────────────────────────────────────────────
  if (view === 'preview' && previewExercise) {
    const images = previewExercise.images.map((img) => `${IMAGE_BASE_URL}${img}`)
    const hasImages = images.length > 0

    return (
      <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 sm:items-center">
        <div className="flex max-h-[90vh] w-full max-w-md flex-col rounded-t-2xl bg-white shadow-xl sm:rounded-2xl">
          {/* Header */}
          <div className="flex items-center gap-3 border-b border-gray-100 px-5 py-4">
            <button
              type="button"
              onClick={() => setView('list')}
              className="text-gray-400 hover:text-gray-600"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h2 className="flex-1 truncate font-semibold text-gray-900">
              {previewExercise.name}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto">
            {/* Image carousel */}
            {hasImages && (
              <div
                className="relative overflow-hidden bg-gray-100"
                style={{ height: 200 }}
              >
                <img
                  src={images[imageIndex]}
                  alt={previewExercise.name}
                  className="h-full w-full object-contain"
                  onError={(e) => {
                    ;(e.target as HTMLElement).parentElement!.style.display = 'none'
                  }}
                />
                {images.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={() =>
                        setImageIndex((i) => (i - 1 + images.length) % images.length)
                      }
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
              {/* Chips */}
              <div className="flex flex-wrap gap-1.5">
                {previewExercise.level && (
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${levelColor[previewExercise.level] ?? 'bg-gray-100 text-gray-600'}`}
                  >
                    {previewExercise.level}
                  </span>
                )}
                {previewExercise.equipment && (
                  <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-600">
                    {previewExercise.equipment}
                  </span>
                )}
                {previewExercise.mechanic && (
                  <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs capitalize text-gray-600">
                    {previewExercise.mechanic}
                  </span>
                )}
                {previewExercise.is_time_based && (
                  <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs text-amber-700">
                    timed
                  </span>
                )}
              </div>

              {/* Primary muscles */}
              {previewExercise.primary_muscles.length > 0 && (
                <div>
                  <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Primary Muscles
                  </h2>
                  <div className="flex flex-wrap gap-1.5">
                    {previewExercise.primary_muscles.map((m) => (
                      <span
                        key={m}
                        className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700"
                      >
                        {m}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Secondary muscles */}
              {previewExercise.secondary_muscles.length > 0 && (
                <div>
                  <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Secondary Muscles
                  </h2>
                  <div className="flex flex-wrap gap-1.5">
                    {previewExercise.secondary_muscles.map((m) => (
                      <span
                        key={m}
                        className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600"
                      >
                        {m}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Instructions */}
              {previewExercise.instructions.length > 0 && (
                <div>
                  <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Instructions
                  </h2>
                  <ol className="space-y-3">
                    {previewExercise.instructions.map((step, i) => (
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

              {/* Bottom padding for sticky button */}
              <div className="h-2" />
            </div>
          </div>

          {/* Sticky Replace button */}
          <div className="border-t border-gray-100 px-5 py-4">
            <button
              type="button"
              onClick={() => onReplace(previewExercise)}
              className="w-full rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-700"
            >
              {target ? 'Replace Exercise' : 'Add Exercise'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── List view ─────────────────────────────────────────────────────────────
  const exercises = data?.exercises ?? []

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center">
      <div className="flex max-h-[90vh] w-full max-w-md flex-col rounded-t-2xl bg-white shadow-xl sm:rounded-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <div>
            <h2 className="font-semibold text-gray-900">
              {target ? 'Replace Exercise' : 'Add Exercise'}
            </h2>
            {target && (
              <p className="mt-0.5 max-w-[220px] truncate text-xs text-gray-500">
                Currently: {target.exercise.name}
              </p>
            )}
          </div>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search + active filter chips */}
        <div className="space-y-2 border-b border-gray-100 px-4 py-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search exercises..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {(muscleGroup || equipment) && (
            <div className="flex flex-wrap gap-2">
              {muscleGroup && (
                <button
                  type="button"
                  onClick={() => setMuscleGroup('')}
                  className="flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700"
                >
                  {muscleGroup}
                  <X className="h-3 w-3" />
                </button>
              )}
              {equipment && (
                <button
                  type="button"
                  onClick={() => setEquipment('')}
                  className="flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600"
                >
                  {equipment}
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-6 w-6 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
            </div>
          ) : exercises.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
              <p className="text-sm text-gray-500">No exercises found</p>
              <button
                type="button"
                onClick={() => {
                  setQuery('')
                  setMuscleGroup('')
                  setEquipment('')
                }}
                className="mt-2 text-xs text-blue-600 hover:underline"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {exercises.map((ex) => (
                <button
                  key={ex.id}
                  type="button"
                  onClick={() => handleSelectForPreview(ex)}
                  className="w-full px-4 py-3 text-left transition-colors hover:bg-gray-50"
                >
                  <p className="text-sm font-medium text-gray-900">{ex.name}</p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {ex.primary_muscles.slice(0, 3).map((m) => (
                      <span
                        key={m}
                        className="rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-600"
                      >
                        {m}
                      </span>
                    ))}
                    {ex.equipment && (
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                        {ex.equipment}
                      </span>
                    )}
                    {ex.is_time_based && (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-600">
                        timed
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
