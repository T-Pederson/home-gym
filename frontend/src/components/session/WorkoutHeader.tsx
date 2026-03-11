import { Pause, Play, X } from 'lucide-react'
import { formatDuration } from '../../hooks/useTimer'

interface Props {
  workoutName: string
  elapsedSeconds: number
  exerciseNumber: number
  totalExercises: number
  onEnd: () => void
  isPaused?: boolean
  onPause?: () => void
  onResume?: () => void
}

export default function WorkoutHeader({
  workoutName,
  elapsedSeconds,
  exerciseNumber,
  totalExercises,
  onEnd,
  isPaused,
  onPause,
  onResume,
}: Props) {
  const showPause = onPause !== undefined && onResume !== undefined

  return (
    <div className="flex items-center justify-between border-b border-gray-800 bg-gray-950 px-4 py-3">
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-white">{workoutName}</p>
        <p className="text-xs text-gray-400">
          Exercise {exerciseNumber} / {totalExercises}
        </p>
      </div>

      <div className="flex items-center gap-3">
        <span className="font-mono text-lg font-bold tabular-nums text-green-400">
          {formatDuration(elapsedSeconds)}
        </span>

        {showPause && (
          <button
            type="button"
            onClick={isPaused ? onResume : onPause}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white"
            aria-label={isPaused ? 'Resume workout' : 'Pause workout'}
          >
            {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
          </button>
        )}

        <button
          type="button"
          onClick={onEnd}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-red-900/40 text-red-400 hover:bg-red-900/70"
          aria-label="End workout"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
