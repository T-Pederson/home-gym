import { Plus } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import { useQuery } from "@tanstack/react-query";
import * as exercisesApi from "../api/exercises";
import * as profileApi from "../api/profile";
import ExerciseCard from "../components/exercises/ExerciseCard";
import ExerciseFiltersBar from "../components/exercises/ExerciseFilters";
import CustomExerciseForm from "../components/exercises/CustomExerciseForm";
import type { ExerciseFilters } from "../types/exercise";

const DEFAULT_FILTERS: ExerciseFilters = {
  q: "",
  muscle_group: "",
  equipment: "",
  category: "",
  level: "",
  custom_only: false,
};

const PER_PAGE = 20;

export function ExerciseLibraryPage() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<ExerciseFilters>(DEFAULT_FILTERS);
  const [debouncedQ, setDebouncedQ] = useState("");
  const [page, setPage] = useState(1);
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQ(filters.q);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [filters.q]);

  // Reset to page 1 when non-text filters change
  const handleFiltersChange = useCallback(
    (newFilters: ExerciseFilters) => {
      if (newFilters.q === filters.q) {
        setPage(1);
      }
      setFilters(newFilters);
    },
    [filters.q]
  );

  const queryFilters = { ...filters, q: debouncedQ, page, per_page: PER_PAGE };

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["exercises", queryFilters],
    queryFn: () => exercisesApi.getExercises(queryFilters),
  });

  const { data: metadata } = useQuery({
    queryKey: ["exercise-metadata"],
    queryFn: exercisesApi.getExerciseMetadata,
    staleTime: Infinity,
  });

  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: profileApi.getProfile,
  });

  const likedIds = new Set(profile?.liked_exercises ?? []);
  const dislikedIds = new Set(profile?.disliked_exercises ?? []);

  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 pt-4 pb-3 sticky top-0 z-10 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Exercise Library</h1>
            {data && (
              <p className="text-xs text-gray-500 mt-0.5">
                {data.total.toLocaleString()} exercise
                {data.total !== 1 ? "s" : ""}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => setShowCreateForm(true)}
            className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            Custom
          </button>
        </div>

        <ExerciseFiltersBar
          filters={filters}
          metadata={metadata}
          onChange={handleFiltersChange}
        />
      </div>

      {/* Content */}
      <div className="flex-1 px-4 py-3 space-y-2">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-8 w-8 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin" />
          </div>
        ) : !data?.exercises.length ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <span className="text-4xl mb-3">🔍</span>
            <p className="font-medium text-gray-700">No exercises found</p>
            <p className="text-sm text-gray-500 mt-1">
              Try adjusting your filters or search term
            </p>
            {filters.custom_only && (
              <button
                type="button"
                onClick={() => setShowCreateForm(true)}
                className="mt-4 flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white"
              >
                <Plus className="h-4 w-4" />
                Create your first custom exercise
              </button>
            )}
          </div>
        ) : (
          <>
            {data.exercises.map((exercise) => (
              <ExerciseCard
                key={exercise.id}
                exercise={exercise}
                likedIds={likedIds}
                dislikedIds={dislikedIds}
              />
            ))}

            {/* Pagination */}
            {data.total_pages > 1 && (
              <div className="flex items-center justify-center gap-3 py-4">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1 || isFetching}
                  className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 disabled:opacity-40 hover:bg-gray-50"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-600">
                  {page} / {data.total_pages}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setPage((p) => Math.min(data.total_pages, p + 1))
                  }
                  disabled={page === data.total_pages || isFetching}
                  className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 disabled:opacity-40 hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Custom exercise modal */}
      {showCreateForm && (
        <CustomExerciseForm
          onClose={() => setShowCreateForm(false)}
          onCreated={(id) => {
            setShowCreateForm(false);
            navigate(`/exercises/${id}`);
          }}
        />
      )}
    </div>
  );
}
