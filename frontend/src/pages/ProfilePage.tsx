import { useAuth } from '../hooks/useAuth'

export function ProfilePage() {
  const { user, logout } = useAuth()

  return (
    <div className="mx-auto max-w-lg px-4 pt-6">
      <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
      <p className="mt-2 text-gray-600">Logged in as <strong>{user?.username}</strong></p>

      <button
        onClick={logout}
        className="mt-6 w-full rounded-lg border border-red-300 px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50"
      >
        Log out
      </button>
    </div>
  )
}
