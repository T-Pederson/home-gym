import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { WorkoutSession, ActiveSet } from '../types/workout'

interface WorkoutSessionState {
  session: WorkoutSession | null
  startSession: (session: WorkoutSession) => void
  clearSession: () => void
  setCurrentExerciseIndex: (i: number) => void
  setCurrentSetIndex: (i: number) => void
  setCurrentRoundIndex: (i: number) => void
  setCurrentCircuitExerciseIndex: (i: number) => void
  logSet: (exerciseIndex: number, set: ActiveSet) => void
}

export const useWorkoutSessionStore = create<WorkoutSessionState>()(
  persist(
    (set) => ({
      session: null,

      startSession: (session) => set({ session }),
      clearSession: () => set({ session: null }),

      setCurrentExerciseIndex: (i) =>
        set((state) => ({
          session: state.session ? { ...state.session, currentExerciseIndex: i } : null,
        })),

      setCurrentSetIndex: (i) =>
        set((state) => ({
          session: state.session ? { ...state.session, currentSetIndex: i } : null,
        })),

      setCurrentRoundIndex: (i) =>
        set((state) => ({
          session: state.session ? { ...state.session, currentRoundIndex: i } : null,
        })),

      setCurrentCircuitExerciseIndex: (i) =>
        set((state) => ({
          session: state.session ? { ...state.session, currentCircuitExerciseIndex: i } : null,
        })),

      logSet: (exerciseIndex, newSet) =>
        set((state) => {
          if (!state.session) return state
          const activeExercises = [...state.session.activeExercises]
          const ex = { ...activeExercises[exerciseIndex] }
          ex.sets = [...ex.sets, newSet]
          activeExercises[exerciseIndex] = ex
          return { session: { ...state.session, activeExercises } }
        }),
    }),
    {
      name: 'workout-session',
      storage: createJSONStorage(() => sessionStorage),
    }
  )
)
