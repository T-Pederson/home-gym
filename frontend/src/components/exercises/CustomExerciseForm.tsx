import { X, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import * as exercisesApi from "../../api/exercises";
import type { ExerciseCreate } from "../../types/exercise";

const MUSCLE_OPTIONS = [
  "abdominals",
  "abductors",
  "adductors",
  "biceps",
  "calves",
  "chest",
  "forearms",
  "glutes",
  "hamstrings",
  "lats",
  "lower back",
  "middle back",
  "neck",
  "quadriceps",
  "shoulders",
  "traps",
  "triceps",
];

const CATEGORY_OPTIONS = [
  "cardio",
  "olympic weightlifting",
  "plyometrics",
  "powerlifting",
  "strength",
  "stretching",
  "strongman",
];

const EQUIPMENT_OPTIONS = [
  "bands",
  "barbell",
  "body only",
  "cable",
  "dumbbell",
  "e-z curl bar",
  "exercise ball",
  "foam roll",
  "kettlebells",
  "machine",
  "medicine ball",
  "other",
];

interface Props {
  onClose: () => void;
  onCreated: (id: string) => void;
}

export default function CustomExerciseForm({ onClose, onCreated }: Props) {
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [category, setCategory] = useState("strength");
  const [level, setLevel] = useState("");
  const [equipment, setEquipment] = useState("");
  const [mechanic, setMechanic] = useState("");
  const [force, setForce] = useState("");
  const [isTimeBased, setIsTimeBased] = useState(false);
  const [primaryMuscles, setPrimaryMuscles] = useState<string[]>([]);
  const [secondaryMuscles, setSecondaryMuscles] = useState<string[]>([]);
  const [instructions, setInstructions] = useState<string[]>([""]);

  const createMutation = useMutation({
    mutationFn: (payload: ExerciseCreate) => exercisesApi.createExercise(payload),
    onSuccess: (exercise) => {
      queryClient.invalidateQueries({ queryKey: ["exercises"] });
      toast.success("Custom exercise created!");
      onCreated(exercise.id);
    },
    onError: () => toast.error("Failed to create exercise"),
  });

  const toggleMuscle = (
    muscle: string,
    list: string[],
    setList: (v: string[]) => void
  ) => {
    setList(
      list.includes(muscle) ? list.filter((m) => m !== muscle) : [...list, muscle]
    );
  };

  const updateInstruction = (index: number, value: string) => {
    const updated = [...instructions];
    updated[index] = value;
    setInstructions(updated);
  };

  const removeInstruction = (index: number) => {
    setInstructions(instructions.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Exercise name is required");
      return;
    }
    if (primaryMuscles.length === 0) {
      toast.error("Select at least one primary muscle");
      return;
    }

    createMutation.mutate({
      name: name.trim(),
      category,
      level: level || undefined,
      equipment: equipment || undefined,
      mechanic: mechanic || undefined,
      force: force || undefined,
      primary_muscles: primaryMuscles,
      secondary_muscles: secondaryMuscles,
      instructions: instructions.filter((i) => i.trim()),
      is_time_based: isTimeBased,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg max-h-[90dvh] overflow-y-auto rounded-2xl bg-white shadow-xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white px-4 py-3">
          <h2 className="font-semibold text-gray-900">Create Custom Exercise</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-4 py-4">
          {/* Name */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Exercise Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Landmine Press"
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {/* Category + Level row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-400"
              >
                {CATEGORY_OPTIONS.map((c) => (
                  <option key={c} value={c}>
                    {c.charAt(0).toUpperCase() + c.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Level
              </label>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-400"
              >
                <option value="">—</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="expert">Expert</option>
              </select>
            </div>
          </div>

          {/* Equipment + Force row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Equipment
              </label>
              <select
                value={equipment}
                onChange={(e) => setEquipment(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-400"
              >
                <option value="">—</option>
                {EQUIPMENT_OPTIONS.map((eq) => (
                  <option key={eq} value={eq}>
                    {eq.charAt(0).toUpperCase() + eq.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Force
              </label>
              <select
                value={force}
                onChange={(e) => setForce(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-400"
              >
                <option value="">—</option>
                <option value="push">Push</option>
                <option value="pull">Pull</option>
                <option value="static">Static</option>
              </select>
            </div>
          </div>

          {/* Time based */}
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={isTimeBased}
              onChange={(e) => setIsTimeBased(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-blue-600"
            />
            <span className="text-sm text-gray-700">
              Time-based (plank, hold, cardio interval)
            </span>
          </label>

          {/* Primary muscles */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Primary Muscles *
            </label>
            <div className="flex flex-wrap gap-1.5">
              {MUSCLE_OPTIONS.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => toggleMuscle(m, primaryMuscles, setPrimaryMuscles)}
                  className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                    primaryMuscles.includes(m)
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Secondary muscles */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Secondary Muscles
            </label>
            <div className="flex flex-wrap gap-1.5">
              {MUSCLE_OPTIONS.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() =>
                    toggleMuscle(m, secondaryMuscles, setSecondaryMuscles)
                  }
                  className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                    secondaryMuscles.includes(m)
                      ? "bg-violet-600 text-white"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Instructions */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Instructions
            </label>
            <div className="space-y-2">
              {instructions.map((step, i) => (
                <div key={i} className="flex gap-2">
                  <span className="mt-2 flex-shrink-0 text-xs font-bold text-gray-400">
                    {i + 1}.
                  </span>
                  <textarea
                    value={step}
                    onChange={(e) => updateInstruction(i, e.target.value)}
                    placeholder={`Step ${i + 1}`}
                    rows={2}
                    className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-400 resize-none"
                  />
                  {instructions.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeInstruction(i)}
                      className="mt-1.5 flex-shrink-0 text-gray-400 hover:text-red-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setInstructions([...instructions, ""])}
              className="mt-2 flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700"
            >
              <Plus className="h-3.5 w-3.5" />
              Add step
            </button>
          </div>

          {/* Submit */}
          <div className="flex gap-3 pt-2 pb-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="flex-1 rounded-xl bg-blue-600 py-2.5 text-sm font-medium text-white disabled:opacity-60 hover:bg-blue-700"
            >
              {createMutation.isPending ? "Creating..." : "Create Exercise"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
