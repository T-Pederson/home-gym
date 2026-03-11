import { SkipForward } from 'lucide-react'

interface Props {
  workoutName: string
  secondsLeft: number
  onSkip: () => void
}

export default function CountdownTimer({ workoutName, secondsLeft, onSkip }: Props) {
  return (
    <div className="flex flex-col items-center justify-center gap-6 py-16">
      <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">
        Get Ready!
      </p>

      <p className="px-6 text-center text-base font-semibold text-gray-300">
        {workoutName}
      </p>

      <span className="font-mono text-[8rem] font-black leading-none tabular-nums text-white">
        {secondsLeft}
      </span>

      <button
        type="button"
        onClick={onSkip}
        className="flex items-center gap-2 rounded-full border border-gray-700 px-5 py-2.5 text-sm font-semibold text-gray-300 hover:border-gray-500 hover:text-white"
      >
        <SkipForward className="h-4 w-4" />
        Skip
      </button>
    </div>
  )
}
