import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  ThumbsDown,
  ThumbsUp,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import * as exercisesApi from "../api/exercises";
import * as profileApi from "../api/profile";
import { useAuthStore } from "../stores/authStore";
import { IMAGE_BASE_URL } from "../types/exercise";
import ConfirmDialog from "../components/common/ConfirmDialog";

const levelColor: Record<string, string> = {
  beginner: "bg-emerald-100 text-emerald-700",
  intermediate: "bg-amber-100 text-amber-700",
  expert: "bg-red-100 text-red-700",
};

export function ExerciseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const [imageIndex, setImageIndex] = useState(0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const { data: exercise, isLoading } = useQuery({
    queryKey: ["exercise", id],
    queryFn: () => exercisesApi.getExercise(id!),
    enabled: !!id,
  });

  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: profileApi.getProfile,
  });

  const isLiked = profile?.liked_exercises.includes(id ?? "") ?? false;
  const isDisliked = profile?.disliked_exercises.includes(id ?? "") ?? false;
  const isOwner = exercise?.is_custom && exercise.created_by === user?.id;

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["profile"] });

  const likeMutation = useMutation({
    mutationFn: () =>
      isLiked
        ? exercisesApi.removeLike(id!)
        : exercisesApi.likeExercise(id!),
    onSuccess: invalidate,
    onError: () => toast.error("Failed to update preference"),
  });

  const dislikeMutation = useMutation({
    mutationFn: () =>
      isDisliked
        ? exercisesApi.removeDislike(id!)
        : exercisesApi.dislikeExercise(id!),
    onSuccess: invalidate,
    onError: () => toast.error("Failed to update preference"),
  });

  const deleteMutation = useMutation({
    mutationFn: () => exercisesApi.deleteExercise(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exercises"] });
      toast.success("Exercise deleted");
      navigate("/exercises");
    },
    onError: () => toast.error("Failed to delete exercise"),
  });

  const handleDelete = () => setShowDeleteConfirm(true);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-8 w-8 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin" />
      </div>
    );
  }

  if (!exercise) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center px-4">
        <span className="text-4xl mb-3">😕</span>
        <p className="font-semibold text-gray-800">Exercise not found</p>
        <button
          type="button"
          onClick={() => navigate("/exercises")}
          className="mt-4 text-sm text-blue-600 hover:underline"
        >
          Back to library
        </button>
      </div>
    );
  }

  const images = exercise.images.map((img) => `${IMAGE_BASE_URL}${img}`);
  const hasImages = images.length > 0;

  return (
    <div className="min-h-full bg-white">
      {/* Back nav */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        {/* Actions for custom exercises */}
        {isOwner && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            className="flex items-center gap-1 text-sm text-red-500 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </button>
        )}
      </div>

      {/* Image carousel */}
      {hasImages && (
        <div className="relative bg-gray-100 overflow-hidden" style={{ height: 240 }}>
          <img
            src={images[imageIndex]}
            alt={exercise.name}
            className="h-full w-full object-contain"
            onError={(e) => {
              (e.target as HTMLElement).parentElement!.style.display = "none";
            }}
          />
          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={() =>
                  setImageIndex((i) => (i - 1 + images.length) % images.length)
                }
                className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-1.5 shadow"
              >
                <ChevronLeft className="h-5 w-5 text-gray-700" />
              </button>
              <button
                type="button"
                onClick={() =>
                  setImageIndex((i) => (i + 1) % images.length)
                }
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-1.5 shadow"
              >
                <ChevronRight className="h-5 w-5 text-gray-700" />
              </button>
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
                {images.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setImageIndex(i)}
                    className={`h-1.5 w-1.5 rounded-full transition-colors ${
                      i === imageIndex ? "bg-blue-600" : "bg-white/60"
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      <div className="px-4 py-4 space-y-5">
        {/* Title + like/dislike */}
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 leading-tight">
              {exercise.name}
            </h1>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {exercise.category && (
                <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-600">
                  {exercise.category}
                </span>
              )}
              {exercise.level && (
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${levelColor[exercise.level] ?? "bg-gray-100 text-gray-600"}`}
                >
                  {exercise.level}
                </span>
              )}
              {exercise.is_custom && (
                <span className="rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-medium text-violet-700">
                  custom
                </span>
              )}
            </div>
          </div>

          {/* Like / dislike */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => likeMutation.mutate()}
              disabled={likeMutation.isPending || dislikeMutation.isPending}
              className={`rounded-xl p-3 transition-colors ${
                isLiked
                  ? "bg-emerald-100 text-emerald-600"
                  : "bg-gray-100 text-gray-500 hover:text-emerald-500"
              }`}
              title={isLiked ? "Remove like" : "Like"}
            >
              <ThumbsUp className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => dislikeMutation.mutate()}
              disabled={likeMutation.isPending || dislikeMutation.isPending}
              className={`rounded-xl p-3 transition-colors ${
                isDisliked
                  ? "bg-red-100 text-red-500"
                  : "bg-gray-100 text-gray-500 hover:text-red-400"
              }`}
              title={isDisliked ? "Remove dislike" : "Dislike"}
            >
              <ThumbsDown className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Details grid */}
        <div className="grid grid-cols-2 gap-2">
          {exercise.equipment && (
            <Detail label="Equipment" value={exercise.equipment} />
          )}
          {exercise.mechanic && (
            <Detail label="Mechanic" value={exercise.mechanic} />
          )}
          {exercise.force && <Detail label="Force" value={exercise.force} />}
          {exercise.is_time_based && (
            <Detail label="Type" value="Time-based" />
          )}
        </div>

        {/* Muscles */}
        {exercise.primary_muscles.length > 0 && (
          <div>
            <h2 className="mb-2 text-sm font-semibold text-gray-700 uppercase tracking-wide">
              Primary Muscles
            </h2>
            <div className="flex flex-wrap gap-1.5">
              {exercise.primary_muscles.map((m) => (
                <span
                  key={m}
                  className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700"
                >
                  {m}
                </span>
              ))}
            </div>
          </div>
        )}

        {exercise.secondary_muscles.length > 0 && (
          <div>
            <h2 className="mb-2 text-sm font-semibold text-gray-700 uppercase tracking-wide">
              Secondary Muscles
            </h2>
            <div className="flex flex-wrap gap-1.5">
              {exercise.secondary_muscles.map((m) => (
                <span
                  key={m}
                  className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600"
                >
                  {m}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Instructions */}
        {exercise.instructions.length > 0 && (
          <div>
            <h2 className="mb-3 text-sm font-semibold text-gray-700 uppercase tracking-wide">
              Instructions
            </h2>
            <ol className="space-y-3">
              {exercise.instructions.map((step, i) => (
                <li key={i} className="flex gap-3">
                  <span className="flex-shrink-0 flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                    {i + 1}
                  </span>
                  <p className="text-sm text-gray-700 leading-relaxed pt-0.5">
                    {step}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>

      {showDeleteConfirm && (
        <ConfirmDialog
          title="Delete exercise?"
          message="This custom exercise will be permanently deleted and cannot be recovered."
          confirmLabel="Delete"
          isLoading={deleteMutation.isPending}
          onConfirm={() => deleteMutation.mutate()}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-gray-50 px-3 py-2.5">
      <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
      <p className="mt-0.5 text-sm font-medium text-gray-800 capitalize">
        {value}
      </p>
    </div>
  );
}
