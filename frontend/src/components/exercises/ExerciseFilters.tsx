import { Search, SlidersHorizontal, X } from "lucide-react";
import { useState } from "react";
import type { ExerciseFilters, ExerciseMetadata } from "../../types/exercise";
import { MUSCLE_GROUP_LABELS } from "../../types/exercise";

interface Props {
  filters: ExerciseFilters;
  metadata: ExerciseMetadata | undefined;
  onChange: (filters: ExerciseFilters) => void;
}

export default function ExerciseFiltersBar({ filters, metadata, onChange }: Props) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const update = (patch: Partial<ExerciseFilters>) =>
    onChange({ ...filters, ...patch });

  const hasActiveFilters =
    filters.muscle_group ||
    filters.equipment ||
    filters.category ||
    filters.level ||
    filters.custom_only;

  return (
    <div className="space-y-2">
      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="search"
          placeholder="Search exercises..."
          value={filters.q}
          onChange={(e) => update({ q: e.target.value })}
          className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-9 pr-4 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
        />
      </div>

      {/* Muscle group pills (always visible) */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        <button
          type="button"
          onClick={() => update({ muscle_group: "" })}
          className={`flex-shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
            !filters.muscle_group
              ? "bg-blue-600 text-white"
              : "bg-gray-100 text-gray-600"
          }`}
        >
          All
        </button>
        {MUSCLE_GROUP_LABELS.map(({ label, value }) => (
          <button
            key={value}
            type="button"
            onClick={() =>
              update({ muscle_group: filters.muscle_group === value ? "" : value })
            }
            className={`flex-shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              filters.muscle_group === value
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Advanced filters toggle */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700"
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          {showAdvanced ? "Hide filters" : "More filters"}
          {hasActiveFilters && (
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-[10px] text-white font-bold">
              !
            </span>
          )}
        </button>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={() =>
              onChange({
                q: filters.q,
                muscle_group: "",
                equipment: "",
                category: "",
                level: "",
                custom_only: false,
              })
            }
            className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700"
          >
            <X className="h-3.5 w-3.5" />
            Clear
          </button>
        )}
      </div>

      {/* Advanced filter rows */}
      {showAdvanced && (
        <div className="grid grid-cols-2 gap-2 rounded-xl border border-gray-100 bg-gray-50 p-3">
          {/* Equipment */}
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">
              Equipment
            </label>
            <select
              value={filters.equipment}
              onChange={(e) => update({ equipment: e.target.value })}
              className="w-full rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs outline-none focus:border-blue-400"
            >
              <option value="">Any</option>
              {metadata?.equipment.map((eq) => (
                <option key={eq} value={eq}>
                  {eq}
                </option>
              ))}
            </select>
          </div>

          {/* Level */}
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">
              Level
            </label>
            <select
              value={filters.level}
              onChange={(e) => update({ level: e.target.value })}
              className="w-full rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs outline-none focus:border-blue-400"
            >
              <option value="">Any</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="expert">Expert</option>
            </select>
          </div>

          {/* Category */}
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">
              Category
            </label>
            <select
              value={filters.category}
              onChange={(e) => update({ category: e.target.value })}
              className="w-full rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs outline-none focus:border-blue-400"
            >
              <option value="">Any</option>
              {metadata?.categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Custom only */}
          <div className="flex items-end pb-1.5">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.custom_only}
                onChange={(e) => update({ custom_only: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300 text-blue-600"
              />
              <span className="text-xs font-medium text-gray-700">
                My custom only
              </span>
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
