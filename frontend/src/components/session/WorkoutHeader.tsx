import { X } from 'lucide-react'
import { formatDuration } from '../../hooks/useTimer'

interface Props {
  workoutName: string
  elapsedSeconds: number
  exerciseNumber: number
  totalExercises: number
  onEnd: () => void
}

export default function WorkoutHeader({
  workoutName,
  elapsedSeconds,
  exerciseNumber,
  totalExercises,
  onEnd,
}: Props) {
  return (
    <div className="flex items-center justify-between border-b border-gray-800 bg-gray-950 px-4 py-3">
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-white">{workoutName}</p>
        <p className="text-xs text-gray-400">
          Exercise {exerciseNumber} / {totalExercises}
        </p>
      </div>

      <div className="flex items-center gap-4">
        <span className="font-mono text-lg font-bold tabular-nums text-green-400">
          {formatDuration(elapsedSeconds)}
        </span>
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
