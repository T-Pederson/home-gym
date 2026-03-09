import { ChevronDown, ChevronUp } from 'lucide-react'

interface Props {
  isCircuit: boolean
  rounds: number
  setDurationSeconds: number
  restSeconds: number
  roundRestSeconds: number
  onIsCircuitChange: (v: boolean) => void
  onRoundsChange: (v: number) => void
  onSetDurationChange: (v: number) => void
  onRestChange: (v: number) => void
  onRoundRestChange: (v: number) => void
}

export default function HIITConfigPanel({
  isCircuit,
  rounds,
  setDurationSeconds,
  restSeconds,
  roundRestSeconds,
  onIsCircuitChange,
  onRoundsChange,
  onSetDurationChange,
  onRestChange,
  onRoundRestChange,
}: Props) {
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
      <p className="mb-3 text-sm font-semibold text-amber-900">HIIT Configuration</p>

      {/* Circuit vs Straight Set toggle */}
      <div className="mb-3">
        <p className="mb-1.5 text-xs font-medium text-amber-800">Format</p>
        <div className="flex gap-2">
          {[
            { value: true, label: 'Circuit' },
            { value: false, label: 'Straight Sets' },
          ].map(({ value, label }) => (
            <button
              key={label}
              type="button"
              onClick={() => onIsCircuitChange(value)}
              className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                isCircuit === value
                  ? 'border-amber-500 bg-amber-500 text-white'
                  : 'border-amber-300 bg-white text-amber-800 hover:bg-amber-100'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Rounds */}
      <div className="mb-3">
        <p className="mb-1.5 text-xs font-medium text-amber-800">
          {isCircuit ? 'Rounds' : 'Sets per exercise'}
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onRoundsChange(Math.max(1, rounds - 1))}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-amber-300 bg-white text-amber-800 hover:bg-amber-100"
          >
            <ChevronDown className="h-4 w-4" />
          </button>
          <span className="w-8 text-center text-sm font-semibold text-amber-900">{rounds}</span>
          <button
            type="button"
            onClick={() => onRoundsChange(rounds + 1)}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-amber-300 bg-white text-amber-800 hover:bg-amber-100"
          >
            <ChevronUp className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Set duration, rest, round rest */}
      <div className="grid grid-cols-3 gap-2">
        <div>
          <p className="mb-1 text-xs font-medium text-amber-800">Work (s)</p>
          <input
            type="number"
            min={5}
            step={5}
            value={setDurationSeconds}
            onChange={(e) => onSetDurationChange(parseInt(e.target.value) || 30)}
            className="w-full rounded-lg border border-amber-300 bg-white px-2 py-1.5 text-sm text-center text-amber-900 focus:border-amber-500 focus:outline-none"
          />
        </div>
        <div>
          <p className="mb-1 text-xs font-medium text-amber-800">Rest (s)</p>
          <input
            type="number"
            min={0}
            step={5}
            value={restSeconds}
            onChange={(e) => onRestChange(parseInt(e.target.value) || 0)}
            className="w-full rounded-lg border border-amber-300 bg-white px-2 py-1.5 text-sm text-center text-amber-900 focus:border-amber-500 focus:outline-none"
          />
        </div>
        {isCircuit && (
          <div>
            <p className="mb-1 text-xs font-medium text-amber-800">Round rest (s)</p>
            <input
              type="number"
              min={0}
              step={15}
              value={roundRestSeconds}
              onChange={(e) => onRoundRestChange(parseInt(e.target.value) || 0)}
              className="w-full rounded-lg border border-amber-300 bg-white px-2 py-1.5 text-sm text-center text-amber-900 focus:border-amber-500 focus:outline-none"
            />
          </div>
        )}
      </div>
    </div>
  )
}
