import { useCallback, useEffect, useState } from 'react'

interface UseTimerReturn {
  elapsedSeconds: number
  isPaused: boolean
  pause: () => void
  resume: () => void
  isResting: boolean
  restSecondsLeft: number | null
  startRest: (seconds: number) => void
  skipRest: () => void
  isWorking: boolean
  workSecondsLeft: number | null
  startWork: (seconds: number) => void
  skipWork: () => void
  isCountingDown: boolean
  countdownSecondsLeft: number | null
  startCountdown: (seconds: number) => void
  skipCountdown: () => void
}

export function useTimer(initialElapsedSeconds = 0): UseTimerReturn {
  const [elapsedSeconds, setElapsedSeconds] = useState(initialElapsedSeconds)
  const [isPaused, setIsPaused] = useState(false)
  const [restSecondsLeft, setRestSecondsLeft] = useState<number | null>(null)
  const [workSecondsLeft, setWorkSecondsLeft] = useState<number | null>(null)
  const [countdownSecondsLeft, setCountdownSecondsLeft] = useState<number | null>(null)

  // Stopwatch — ticks unless paused
  useEffect(() => {
    if (isPaused) return
    const id = setInterval(() => setElapsedSeconds((s) => s + 1), 1000)
    return () => clearInterval(id)
  }, [isPaused])

  // Rest countdown
  useEffect(() => {
    if (isPaused) return
    if (restSecondsLeft === null || restSecondsLeft <= 0) {
      if (restSecondsLeft !== null && restSecondsLeft <= 0) setRestSecondsLeft(null)
      return
    }
    const id = setInterval(() => {
      setRestSecondsLeft((s) => {
        if (s === null || s <= 1) return null
        return s - 1
      })
    }, 1000)
    return () => clearInterval(id)
  }, [restSecondsLeft, isPaused])

  // Work countdown
  useEffect(() => {
    if (isPaused) return
    if (workSecondsLeft === null || workSecondsLeft <= 0) {
      if (workSecondsLeft !== null && workSecondsLeft <= 0) setWorkSecondsLeft(null)
      return
    }
    const id = setInterval(() => {
      setWorkSecondsLeft((s) => {
        if (s === null || s <= 1) return null
        return s - 1
      })
    }, 1000)
    return () => clearInterval(id)
  }, [workSecondsLeft, isPaused])

  // Get-ready countdown
  useEffect(() => {
    if (isPaused) return
    if (countdownSecondsLeft === null || countdownSecondsLeft <= 0) {
      if (countdownSecondsLeft !== null && countdownSecondsLeft <= 0) setCountdownSecondsLeft(null)
      return
    }
    const id = setInterval(() => {
      setCountdownSecondsLeft((s) => {
        if (s === null || s <= 1) return null
        return s - 1
      })
    }, 1000)
    return () => clearInterval(id)
  }, [countdownSecondsLeft, isPaused])

  const pause = useCallback(() => setIsPaused(true), [])
  const resume = useCallback(() => setIsPaused(false), [])
  const startRest = useCallback((seconds: number) => setRestSecondsLeft(seconds), [])
  const skipRest = useCallback(() => setRestSecondsLeft(null), [])
  const startWork = useCallback((seconds: number) => setWorkSecondsLeft(seconds), [])
  const skipWork = useCallback(() => setWorkSecondsLeft(null), [])
  const startCountdown = useCallback((seconds: number) => setCountdownSecondsLeft(seconds), [])
  const skipCountdown = useCallback(() => setCountdownSecondsLeft(null), [])

  return {
    elapsedSeconds,
    isPaused,
    pause,
    resume,
    isResting: restSecondsLeft !== null && restSecondsLeft > 0,
    restSecondsLeft,
    startRest,
    skipRest,
    isWorking: workSecondsLeft !== null && workSecondsLeft > 0,
    workSecondsLeft,
    startWork,
    skipWork,
    isCountingDown: countdownSecondsLeft !== null && countdownSecondsLeft > 0,
    countdownSecondsLeft,
    startCountdown,
    skipCountdown,
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
