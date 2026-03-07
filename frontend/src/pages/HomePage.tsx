import { Dumbbell, Plus, TrendingUp } from 'lucide-react'
import { Link } from 'react-router'
import { useAuthStore } from '../stores/authStore'

export function HomePage() {
  const user = useAuthStore((s) => s.user)

  return (
    <div className="mx-auto max-w-lg px-4 pt-6">
      <h1 className="text-2xl font-bold text-gray-900">
        Hey{user?.username ? `, ${user.username}` : ''}!
      </h1>
      <p className="mt-1 text-gray-600">Ready to train?</p>

      <div className="mt-6 grid gap-4">
        <Link
          to="/planner"
          className="flex items-center gap-4 rounded-xl bg-blue-600 p-5 text-white shadow-md transition hover:bg-blue-700"
        >
          <Plus className="h-8 w-8" />
          <div>
            <p className="text-lg font-semibold">Start a workout</p>
            <p className="text-sm text-blue-100">Generate a plan or pick a saved workout</p>
          </div>
        </Link>

        <Link
          to="/exercises"
          className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:border-blue-300"
        >
          <Dumbbell className="h-8 w-8 text-blue-600" />
          <div>
            <p className="text-lg font-semibold text-gray-900">Exercise Library</p>
            <p className="text-sm text-gray-500">Browse and discover exercises</p>
          </div>
        </Link>

        <Link
          to="/progress"
          className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:border-blue-300"
        >
          <TrendingUp className="h-8 w-8 text-green-600" />
          <div>
            <p className="text-lg font-semibold text-gray-900">View Progress</p>
            <p className="text-sm text-gray-500">Charts, history, and stats</p>
          </div>
        </Link>
      </div>
    </div>
  )
}
