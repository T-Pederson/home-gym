import { Link, X } from 'lucide-react'

interface Props {
  linked: boolean
  onToggle: () => void
}

export default function SupersetLink({ linked, onToggle }: Props) {
  if (linked) {
    return (
      <div className="flex items-center justify-center py-0.5">
        <button
          type="button"
          onClick={onToggle}
          className="flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-200"
        >
          <Link className="h-3 w-3" />
          Superset
          <X className="h-3 w-3 opacity-60" />
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 py-0.5">
      <div className="h-px flex-1 border-t border-dashed border-gray-200" />
      <button
        type="button"
        onClick={onToggle}
        className="flex items-center gap-1 rounded-full border border-dashed border-gray-300 px-2.5 py-0.5 text-xs text-gray-400 hover:border-blue-400 hover:text-blue-500"
      >
        <Link className="h-3 w-3" />
        Superset
      </button>
      <div className="h-px flex-1 border-t border-dashed border-gray-200" />
    </div>
  )
}
