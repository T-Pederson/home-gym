import { Outlet } from 'react-router'
import { BottomNav } from './BottomNav'

export function AppShell() {
  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <main className="flex-1 pb-20">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  )
}
