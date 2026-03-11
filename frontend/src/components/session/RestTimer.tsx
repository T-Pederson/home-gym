import { SkipForward } from 'lucide-react'

interface Props {
  secondsLeft: number
  totalSeconds: number
  nextExerciseName: string | null
  onSkip: () => void
}

export default function RestTimer({ secondsLeft, totalSeconds, nextExerciseName, onSkip }: Props) {
  const radius = 56
  const circumference = 2 * Math.PI * radius
  const progress = totalSeconds > 0 ? secondsLeft / totalSeconds : 0
  const dashOffset = circumference * (1 - progress)

  const minutes = Math.floor(secondsLeft / 60)
  const seconds = secondsLeft % 60

  return (
    <div className="flex flex-col items-center justify-center gap-8 py-8">
      <p className="text-lg font-semibold text-gray-300">Rest</p>

      {/* Circular progress */}
      <div className="relative flex items-center justify-center">
        <svg width="140" height="140" className="-rotate-90">
          {/* Background ring */}
          <circle
            cx="70"
            cy="70"
            r={radius}
            fill="none"
            stroke="#374151"
            strokeWidth="8"
          />
          {/* Progress ring */}
          <circle
            cx="70"
            cy="70"
            r={radius}
            fill="none"
            stroke="#22c55e"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            style={{ transition: 'stroke-dashoffset 0.9s linear' }}
          />
        </svg>
        <div className="absolute text-center">
          <span className="font-mono text-4xl font-bold tabular-nums text-white">
            {minutes > 0 ? `${minutes}:${String(seconds).padStart(2, '0')}` : secondsLeft}
          </span>
          <p className="text-xs text-gray-400">seconds</p>
        </div>
      </div>

      {/* Next exercise hint */}
      {nextExerciseName && (
        <div className="rounded-xl bg-gray-800/60 px-5 py-3 text-center">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Next up</p>
          <p className="mt-0.5 text-base font-semibold text-white">{nextExerciseName}</p>
        </div>
      )}

      <button
        type="button"
        onClick={onSkip}
        className="flex items-center gap-2 rounded-full border border-gray-700 px-5 py-2.5 text-sm font-semibold text-gray-300 hover:border-gray-500 hover:text-white"
      >
        <SkipForward className="h-4 w-4" />
        Skip Rest
      </button>
    </div>
  )
}
