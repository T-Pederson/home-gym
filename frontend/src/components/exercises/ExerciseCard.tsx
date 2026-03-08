import { ThumbsDown, ThumbsUp } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import toast from "react-hot-toast";
import * as exercisesApi from "../../api/exercises";
import type { Exercise } from "../../types/exercise";
import { IMAGE_BASE_URL } from "../../types/exercise";

interface Props {
  exercise: Exercise;
  likedIds: Set<string>;
  dislikedIds: Set<string>;
}

export default function ExerciseCard({ exercise, likedIds, dislikedIds }: Props) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isLiked = likedIds.has(exercise.id);
  const isDisliked = dislikedIds.has(exercise.id);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["profile"] });
  };

  const likeMutation = useMutation({
    mutationFn: () =>
      isLiked
        ? exercisesApi.removeLike(exercise.id)
        : exercisesApi.likeExercise(exercise.id),
    onSuccess: invalidate,
    onError: () => toast.error("Failed to update preference"),
  });

  const dislikeMutation = useMutation({
    mutationFn: () =>
      isDisliked
        ? exercisesApi.removeDislike(exercise.id)
        : exercisesApi.dislikeExercise(exercise.id),
    onSuccess: invalidate,
    onError: () => toast.error("Failed to update preference"),
  });

  const thumbnailUrl =
    exercise.images.length > 0
      ? `${IMAGE_BASE_URL}${exercise.images[0]}`
      : null;

  const levelColor: Record<string, string> = {
    beginner: "bg-emerald-100 text-emerald-700",
    intermediate: "bg-amber-100 text-amber-700",
    expert: "bg-red-100 text-red-700",
  };

  return (
    <div
      className="flex cursor-pointer gap-3 rounded-xl border border-gray-200 bg-white p-3 shadow-sm active:bg-gray-50"
      onClick={() => navigate(`/exercises/${exercise.id}`)}
    >
      {/* Thumbnail */}
      {thumbnailUrl ? (
        <img
          src={thumbnailUrl}
          alt={exercise.name}
          className="h-16 w-16 flex-shrink-0 rounded-lg object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
      ) : (
        <div className="h-16 w-16 flex-shrink-0 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 text-xl">
          💪
        </div>
      )}

      {/* Info */}
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-gray-900 text-sm leading-tight">
          {exercise.name}
        </p>

        {/* Tags row */}
        <div className="mt-1 flex flex-wrap gap-1">
          {exercise.level && (
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${levelColor[exercise.level] ?? "bg-gray-100 text-gray-600"}`}
            >
              {exercise.level}
            </span>
          )}
          {exercise.equipment && (
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
              {exercise.equipment}
            </span>
          )}
          {exercise.is_custom && (
            <span className="rounded-full bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-700">
              custom
            </span>
          )}
        </div>

        {/* Muscles */}
        {exercise.primary_muscles.length > 0 && (
          <p className="mt-1 truncate text-xs text-gray-500">
            {exercise.primary_muscles.slice(0, 3).join(", ")}
          </p>
        )}
      </div>

      {/* Like / dislike buttons */}
      <div className="flex flex-col gap-1 items-center justify-center">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            likeMutation.mutate();
          }}
          disabled={likeMutation.isPending || dislikeMutation.isPending}
          className={`rounded-lg p-1.5 transition-colors ${
            isLiked
              ? "bg-emerald-100 text-emerald-600"
              : "text-gray-400 hover:text-emerald-500"
          }`}
          title={isLiked ? "Remove like" : "Like"}
        >
          <ThumbsUp className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            dislikeMutation.mutate();
          }}
          disabled={likeMutation.isPending || dislikeMutation.isPending}
          className={`rounded-lg p-1.5 transition-colors ${
            isDisliked
              ? "bg-red-100 text-red-500"
              : "text-gray-400 hover:text-red-400"
          }`}
          title={isDisliked ? "Remove dislike" : "Dislike"}
        >
          <ThumbsDown className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
