import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { useWorkoutSessionStore } from '../stores/workoutSessionStore'
import { useTimer } from '../hooks/useTimer'
import { createLog } from '../api/logs'
import type { ActiveSet, CreateLogPayload } from '../types/workout'
import WorkoutHeader from '../components/session/WorkoutHeader'
import SetLogger from '../components/session/SetLogger'
import RestTimer from '../components/session/RestTimer'
import WorkoutSummary from '../components/session/WorkoutSummary'
import CountdownTimer from '../components/session/CountdownTimer'
import WorkTimer from '../components/session/WorkTimer'
import ExerciseInfoModal from '../components/workouts/ExerciseInfoModal'
import ConfirmDialog from '../components/common/ConfirmDialog'

type SessionPhase = 'countdown' | 'exercising' | 'resting' | 'complete'

export function ActiveWorkoutPage() {
  const navigate = useNavigate()
  const {
    session,
    clearSession,
    logSet,
    setCurrentExerciseIndex,
    setCurrentSetIndex,
    setCurrentRoundIndex,
    setCurrentCircuitExerciseIndex,
  } = useWorkoutSessionStore()

  const [phase, setPhase] = useState<SessionPhase>('countdown')
  const [showInfo, setShowInfo] = useState(false)
  const [showAbandon, setShowAbandon] = useState(false)
  const completedAtRef = useRef<string | null>(null)
  const finalElapsedRef = useRef(0)

  // Seed timer from stored startedAt so it survives page refresh
  const startedSecondsAgo = session
    ? Math.floor((Date.now() - new Date(session.startedAt).getTime()) / 1000)
    : 0

  const {
    elapsedSeconds,
    isPaused,
    pause,
    resume,
    isResting,
    restSecondsLeft,
    startRest,
    skipRest,
    isWorking,
    workSecondsLeft,
    startWork,
    skipWork,
    isCountingDown,
    countdownSecondsLeft,
    startCountdown,
    skipCountdown,
  } = useTimer(startedSecondsAgo)

  // Kick off the 5-second get-ready countdown on mount
  useEffect(() => {
    startCountdown(5)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Guard: redirect if no active session
  useEffect(() => {
    if (!session && phase !== 'complete') {
      navigate('/planner', { replace: true })
    }
  }, [session, phase, navigate])

  // Transition: countdown ends → exercising (+ start work timer for HIIT)
  const prevIsCountingDownRef = useRef(false)
  useEffect(() => {
    const was = prevIsCountingDownRef.current
    prevIsCountingDownRef.current = isCountingDown
    if (was && !isCountingDown && phase === 'countdown') {
      setPhase('exercising')
      if (session?.isCircuit) {
        startWork(session.circuitSetDurationSeconds)
      }
    }
  }, [isCountingDown]) // eslint-disable-line react-hooks/exhaustive-deps

  // HIIT: after rest ends, restart the work timer for the next exercise
  const prevIsRestingRef = useRef(false)
  useEffect(() => {
    const was = prevIsRestingRef.current
    prevIsRestingRef.current = isResting
    if (was && !isResting && session?.isCircuit && phase === 'exercising') {
      startWork(session.circuitSetDurationSeconds)
    }
  }, [isResting]) // eslint-disable-line react-hooks/exhaustive-deps

  const queryClient = useQueryClient()
  const saveMutation = useMutation({
    mutationFn: createLog,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['logs'] })
      toast.success('Workout saved!')
      clearSession()
      navigate('/progress')
    },
    onError: () => toast.error('Failed to save workout log'),
  })

  if (!session) return null

  const isCircuit = session.isCircuit
  const currentExIdx = session.currentExerciseIndex
  const currentEx = session.exercises[currentExIdx]

  // ----- Helpers -----

  function getSetNumber(): number {
    return isCircuit ? session.currentRoundIndex + 1 : session.currentSetIndex + 1
  }

  function getTotalSets(): number {
    return isCircuit ? session.circuitRounds : currentEx.target_sets
  }

  function getPreviousSet(): ActiveSet | null {
    const active = session.activeExercises[currentExIdx]
    if (!active || active.sets.length === 0) return null
    return active.sets[active.sets.length - 1]
  }

  function getSupersetBounds(idx: number): { start: number; end: number } | null {
    const group = session.exercises[idx]?.superset_group
    if (!group) return null
    let start = idx, end = idx
    while (start > 0 && session.exercises[start - 1].superset_group === group) start--
    while (end < session.exercises.length - 1 && session.exercises[end + 1].superset_group === group) end++
    return { start, end }
  }

  function getNextExerciseName(): string | null {
    if (isCircuit) {
      const nextIdx = session.currentCircuitExerciseIndex + 1
      if (nextIdx < session.exercises.length) {
        return session.exercises[nextIdx].exercise_name
      }
      if (session.currentRoundIndex + 1 < session.circuitRounds) {
        return session.exercises[0].exercise_name
      }
      return null
    }
    if (currentEx.superset_group) {
      return currentEx.exercise_name
    }
    if (session.currentSetIndex === 0) {
      return currentEx.exercise_name
    }
    return null
  }

  function getHiitDefaultWeight(): number {
    return getPreviousSet()?.weight ?? currentEx.target_weight ?? 0
  }

  // ----- Advance logic -----

  function complete() {
    completedAtRef.current = new Date().toISOString()
    finalElapsedRef.current = elapsedSeconds
    setPhase('complete')
  }

  function advanceStraightSet() {
    const bounds = getSupersetBounds(currentExIdx)

    if (bounds) {
      const { start, end } = bounds
      const isLastInGroup = currentExIdx === end
      const nextPassIdx = session.currentSetIndex + 1
      const isLastPass = nextPassIdx >= currentEx.target_sets

      if (isLastInGroup && isLastPass) {
        if (end + 1 >= session.exercises.length) { complete(); return }
        setCurrentExerciseIndex(end + 1)
        setCurrentSetIndex(0)
      } else if (isLastInGroup) {
        setCurrentExerciseIndex(start)
        setCurrentSetIndex(nextPassIdx)
      } else {
        setCurrentExerciseIndex(currentExIdx + 1)
      }
      if (currentEx.rest_seconds > 0) startRest(currentEx.rest_seconds)
      return
    }

    const nextSet = session.currentSetIndex + 1
    const isLastSet = nextSet >= currentEx.target_sets
    const isLastExercise = currentExIdx + 1 >= session.exercises.length

    if (isLastSet && isLastExercise) { complete(); return }

    if (isLastSet) {
      setCurrentExerciseIndex(currentExIdx + 1)
      setCurrentSetIndex(0)
    } else {
      setCurrentSetIndex(nextSet)
    }
    if (currentEx.rest_seconds > 0) startRest(currentEx.rest_seconds)
  }

  function advanceCircuit() {
    const nextExInRound = session.currentCircuitExerciseIndex + 1
    const isLastExInRound = nextExInRound >= session.exercises.length
    const nextRound = session.currentRoundIndex + 1
    const isLastRound = nextRound >= session.circuitRounds

    if (isLastExInRound && isLastRound) {
      complete()
      return
    }

    if (isLastExInRound) {
      setCurrentRoundIndex(nextRound)
      setCurrentCircuitExerciseIndex(0)
      setCurrentExerciseIndex(0)
      const roundRest = session.circuitRoundRestSeconds
      if (roundRest > 0) startRest(roundRest)
    } else {
      setCurrentCircuitExerciseIndex(nextExInRound)
      setCurrentExerciseIndex(nextExInRound)
      const rest = session.circuitRestSeconds
      if (rest > 0) startRest(rest)
    }
  }

  function handleCompleteSet(set: ActiveSet) {
    logSet(currentExIdx, set)
    if (isCircuit) advanceCircuit()
    else advanceStraightSet()
  }

  function handleSkipSet() {
    const skippedSet: ActiveSet = {
      set_number: getSetNumber(),
      reps: null,
      target_reps: currentEx.target_reps,
      duration_seconds: null,
      target_duration_seconds: currentEx.target_duration_seconds,
      weight: null,
      weight_unit: currentEx.weight_unit,
      completed: false,
    }
    logSet(currentExIdx, skippedSet)
    if (isCircuit) advanceCircuit()
    else advanceStraightSet()
  }

  // HIIT: work timer auto-completed (full duration)
  function handleAutoCompleteWork(weight: number, weightUnit: string) {
    handleCompleteSet({
      set_number: getSetNumber(),
      reps: null,
      target_reps: null,
      duration_seconds: session.circuitSetDurationSeconds,
      target_duration_seconds: session.circuitSetDurationSeconds,
      weight,
      weight_unit: weightUnit,
      completed: true,
    })
  }

  // HIIT: user tapped "Finish Early" — log actual elapsed duration
  function handleFinishEarlyWork(weight: number, weightUnit: string) {
    const elapsed = session.circuitSetDurationSeconds - (workSecondsLeft ?? 0)
    skipWork()
    handleCompleteSet({
      set_number: getSetNumber(),
      reps: null,
      target_reps: null,
      duration_seconds: Math.max(elapsed, 1),
      target_duration_seconds: session.circuitSetDurationSeconds,
      weight,
      weight_unit: weightUnit,
      completed: true,
    })
  }

  // ----- Save / Discard -----

  function handleSave(notes: string) {
    const payload: CreateLogPayload = {
      workout_id: session.workoutId,
      name: session.workoutName,
      exercises_performed: session.activeExercises.map((ex) => ({
        exercise_id: ex.exercise_id,
        exercise_name: ex.exercise_name,
        order: ex.order,
        sets: ex.sets,
      })),
      started_at: session.startedAt,
      completed_at: completedAtRef.current!,
      total_duration_seconds: finalElapsedRef.current,
      notes: notes.trim() || undefined,
    }
    saveMutation.mutate(payload)
  }

  function handleDiscard() {
    clearSession()
    navigate('/planner')
  }

  // ----- Render -----

  if (phase === 'complete') {
    return (
      <WorkoutSummary
        session={session}
        totalSeconds={finalElapsedRef.current}
        isSaving={saveMutation.isPending}
        onSave={handleSave}
        onDiscard={handleDiscard}
      />
    )
  }

  const restTotal = isCircuit
    ? (isResting && session.currentCircuitExerciseIndex === 0
        ? session.circuitRoundRestSeconds
        : session.circuitRestSeconds)
    : currentEx.rest_seconds

  return (
    <div className="flex min-h-screen flex-col bg-gray-950 text-white">
      <WorkoutHeader
        workoutName={session.workoutName}
        elapsedSeconds={elapsedSeconds}
        exerciseNumber={currentExIdx + 1}
        totalExercises={session.exercises.length}
        onEnd={() => setShowAbandon(true)}
        isPaused={isPaused}
        onPause={pause}
        onResume={resume}
      />

      <main className="flex-1 overflow-y-auto px-4 py-6">
        {phase === 'countdown' && countdownSecondsLeft !== null ? (
          <CountdownTimer
            workoutName={session.workoutName}
            secondsLeft={countdownSecondsLeft}
            onSkip={skipCountdown}
          />
        ) : isResting && restSecondsLeft !== null && restSecondsLeft > 0 ? (
          <RestTimer
            secondsLeft={restSecondsLeft}
            totalSeconds={restTotal}
            nextExerciseName={getNextExerciseName()}
            onSkip={skipRest}
          />
        ) : isCircuit && phase === 'exercising' ? (
          <WorkTimer
            secondsLeft={workSecondsLeft ?? 0}
            totalSeconds={session.circuitSetDurationSeconds}
            isPaused={isPaused}
            exerciseName={currentEx.exercise_name}
            primaryMuscle={currentEx.exercise.primary_muscles[0] ?? 'body only'}
            equipment={currentEx.exercise.equipment ?? ''}
            roundNumber={session.currentRoundIndex + 1}
            totalRounds={session.circuitRounds}
            weightUnit={currentEx.weight_unit}
            defaultWeight={getHiitDefaultWeight()}
            onFinishEarly={handleFinishEarlyWork}
            onAutoComplete={handleAutoCompleteWork}
          />
        ) : (
          <SetLogger
            exercise={currentEx}
            setNumber={getSetNumber()}
            totalSets={getTotalSets()}
            previousSet={getPreviousSet()}
            isTimeBased={currentEx.exercise.is_time_based}
            isCircuit={isCircuit}
            onCompleteSet={handleCompleteSet}
            onSkipSet={handleSkipSet}
            onViewInfo={() => setShowInfo(true)}
          />
        )}
      </main>

      {showInfo && (
        <ExerciseInfoModal
          exercise={currentEx.exercise}
          onClose={() => setShowInfo(false)}
        />
      )}

      {showAbandon && (
        <ConfirmDialog
          title="End workout?"
          message="Your progress will be lost. Are you sure?"
          confirmLabel="End Workout"
          onConfirm={handleDiscard}
          onCancel={() => setShowAbandon(false)}
        />
      )}
    </div>
  )
}
