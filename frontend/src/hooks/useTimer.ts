import { useCallback, useEffect, useState } from 'react'

interface UseTimerReturn {
  elapsedSeconds: number
  isResting: boolean
  restSecondsLeft: number | null
  startRest: (seconds: number) => void
  skipRest: () => void
}

export function useTimer(initialElapsedSeconds = 0): UseTimerReturn {
  const [elapsedSeconds, setElapsedSeconds] = useState(initialElapsedSeconds)
  const [restSecondsLeft, setRestSecondsLeft] = useState<number | null>(null)

  // Stopwatch — always ticks (total wall time)
  useEffect(() => {
    const id = setInterval(() => setElapsedSeconds((s) => s + 1), 1000)
    return () => clearInterval(id)
  }, [])

  // Rest countdown
  useEffect(() => {
    if (restSecondsLeft === null || restSecondsLeft <= 0) {
      if (restSecondsLeft !== null && restSecondsLeft <= 0) {
        setRestSecondsLeft(null)
      }
      return
    }
    const id = setInterval(() => {
      setRestSecondsLeft((s) => {
        if (s === null || s <= 1) return null
        return s - 1
      })
    }, 1000)
    return () => clearInterval(id)
  }, [restSecondsLeft])

  const startRest = useCallback((seconds: number) => {
    setRestSecondsLeft(seconds)
  }, [])

  const skipRest = useCallback(() => {
    setRestSecondsLeft(null)
  }, [])

  return {
    elapsedSeconds,
    isResting: restSecondsLeft !== null && restSecondsLeft > 0,
    restSecondsLeft,
    startRest,
    skipRest,
  }
}

export function formatDuration(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60
  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }
  return `${m}:${String(s).padStart(2, '0')}`
}
