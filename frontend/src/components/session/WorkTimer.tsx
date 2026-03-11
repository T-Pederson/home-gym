import { useEffect, useRef, useState } from 'react'
import { SkipForward } from 'lucide-react'

interface Props {
  secondsLeft: number
  totalSeconds: number
  isPaused: boolean
  exerciseName: string
  primaryMuscle: string
  equipment: string
  roundNumber: number
  totalRounds: number
  weightUnit: string
  defaultWeight: number
  onFinishEarly: (weight: number, weightUnit: string) => void
  onAutoComplete: (weight: number, weightUnit: string) => void
}

export default function WorkTimer({
  secondsLeft,
  totalSeconds,
  isPaused,
  exerciseName,
  primaryMuscle,
  equipment,
  roundNumber,
  totalRounds,
  weightUnit: initialWeightUnit,
  defaultWeight,
  onFinishEarly,
  onAutoComplete,
}: Props) {
  const [weight, setWeight] = useState(defaultWeight)
  const [weightUnit, setWeightUnit] = useState(initialWeightUnit)

  // Refs to capture latest values at auto-complete fire time (avoids stale closure)
  const weightRef = useRef(weight)
  const unitRef = useRef(weightUnit)
  useEffect(() => { weightRef.current = weight }, [weight])
  useEffect(() => { unitRef.current = weightUnit }, [weightUnit])

  // Guard: only auto-complete when secondsLeft transitions from >0 → 0 (not on initial mount with 0)
  const hasBeenPositiveRef = useRef(false)
  useEffect(() => {
    if (secondsLeft > 0) {
      hasBeenPositiveRef.current = true
    } else if (secondsLeft === 0 && hasBeenPositiveRef.current) {
      onAutoComplete(weightRef.current, unitRef.current)
    }
  }, [secondsLeft]) // eslint-disable-line react-hooks/exhaustive-deps

  const radius = 56
  const circumference = 2 * Math.PI * radius
  const progress = totalSeconds > 0 ? secondsLeft / totalSeconds : 0
  const dashOffset = circumference * (1 - progress)

  const minutes = Math.floor(secondsLeft / 60)
  const seconds = secondsLeft % 60

  const subtitle = [primaryMuscle, equipment].filter(Boolean).join(' · ')

  return (
    <div className="flex flex-col items-center justify-center gap-6 py-8">
      {/* Exercise info */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white">{exerciseName}</h2>
        {subtitle && (
          <p className="mt-1 text-sm capitalize text-gray-400">{subtitle}</p>
        )}
      </div>

      {/* Round badge */}
      <span className="rounded-full bg-orange-600 px-3 py-1 text-sm font-bold text-white">
        Round {roundNumber} / {totalRounds}
      </span>

      {/* Circular countdown — orange for work (vs green for rest) */}
      <div className="relative flex items-center justify-center">
        <svg width="140" height="140" className="-rotate-90">
          <circle cx="70" cy="70" r={radius} fill="none" stroke="#374151" strokeWidth="8" />
          <circle
            cx="70"
            cy="70"
            r={radius}
            fill="none"
            stroke="#f97316"
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
          <p className="text-xs text-gray-400">{isPaused ? 'paused' : 'work'}</p>
        </div>
      </div>

      {/* Weight input */}
      <div className="w-full max-w-xs">
        <div className="mb-1 flex items-center justify-between">
          <label className="text-xs font-semibold uppercase tracking-wide text-gray-400">
            Weight
          </label>
          <button
            type="button"
            onClick={() => setWeightUnit((u) => (u === 'lbs' ? 'kg' : 'lbs'))}
            className="rounded-md bg-gray-800 px-2 py-0.5 text-xs text-gray-400 hover:text-white"
          >
            {weightUnit}
          </button>
        </div>
        <input
          type="number"
          inputMode="decimal"
          value={weight || ''}
          placeholder="0"
          onChange={(e) => setWeight(parseFloat(e.target.value) || 0)}
          className="w-full rounded-xl bg-gray-800 px-4 py-3 text-center text-3xl font-bold text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
        />
      </div>

      {/* Finish Early */}
      <button
        type="button"
        onClick={() => onFinishEarly(weight, weightUnit)}
        className="flex items-center gap-2 rounded-full border border-gray-700 px-5 py-2.5 text-sm font-semibold text-gray-300 hover:border-gray-500 hover:text-white"
      >
        <SkipForward className="h-4 w-4" />
        Finish Early
      </button>
    </div>
  )
}
