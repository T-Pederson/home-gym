import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { ChevronRight, LogOut, Save, Scale, User, Wrench, Dumbbell } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import * as profileApi from '../api/profile'
import type { FullUser, HeightWeight } from '../types/user'

const EQUIPMENT_OPTIONS = [
  'Barbell', 'Dumbbells', 'Kettlebell', 'Pull-up Bar', 'Bench', 'Squat Rack',
  'Cable Machine', 'Resistance Bands', 'Medicine Ball', 'Jump Rope', 'Foam Roller', 'Body Only',
]

const STYLE_OPTIONS = [
  { value: 'strength', label: 'Strength' },
  { value: 'hypertrophy', label: 'Muscle Building' },
  { value: 'endurance', label: 'Endurance' },
  { value: 'hiit', label: 'HIIT' },
  { value: 'mixed', label: 'Mixed' },
]

const EXPERIENCE_OPTIONS = ['beginner', 'intermediate', 'advanced']

// ---- Section wrapper ----
function Section({ title, icon, children, defaultOpen = false }: {
  title: string
  icon: React.ReactNode
  children: React.ReactNode
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-3 px-4 py-3.5"
      >
        {icon}
        <span className="flex-1 text-left font-semibold text-gray-900">{title}</span>
        <ChevronRight className={`h-5 w-5 text-gray-400 transition-transform ${open ? 'rotate-90' : ''}`} />
      </button>
      {open && <div className="border-t border-gray-100 px-4 pb-4 pt-3">{children}</div>}
    </div>
  )
}

// ---- Personal Info Section ----
function PersonalInfoSection({ profile }: { profile: FullUser }) {
  const queryClient = useQueryClient()
  const [name, setName] = useState(profile.profile.name)
  const [units, setUnits] = useState(profile.profile.preferred_units)

  const isImperial = units === 'imperial'
  const heightVal = profile.profile.height
  const [heightFeet, setHeightFeet] = useState(
    isImperial && heightVal ? String(Math.floor(heightVal.value / 12)) : ''
  )
  const [heightInches, setHeightInches] = useState(
    isImperial && heightVal ? String(heightVal.value % 12) : ''
  )
  const [heightCm, setHeightCm] = useState(
    !isImperial && heightVal ? String(heightVal.value) : ''
  )
  const [weight, setWeight] = useState(
    profile.profile.weight ? String(profile.profile.weight.value) : ''
  )

  const mutation = useMutation({
    mutationFn: profileApi.updateProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] })
      toast.success('Profile updated')
    },
    onError: () => toast.error('Failed to update profile'),
  })

  const handleSave = () => {
    const heightValue = isImperial
      ? (parseInt(heightFeet) || 0) * 12 + (parseInt(heightInches) || 0)
      : parseInt(heightCm) || 0

    const height: HeightWeight = { value: heightValue, unit: isImperial ? 'in' : 'cm' }
    const weightObj: HeightWeight = { value: parseFloat(weight) || 0, unit: isImperial ? 'lbs' : 'kg' }

    mutation.mutate({
      name,
      height,
      weight: weightObj,
      preferred_units: units,
    })
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="text-sm font-medium text-gray-700">Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
        />
      </div>

      <div>
        <label className="text-sm font-medium text-gray-700">Units</label>
        <div className="mt-1 flex gap-2">
          {['imperial', 'metric'].map((u) => (
            <button
              key={u}
              type="button"
              onClick={() => setUnits(u)}
              className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium capitalize ${
                units === u ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-300 text-gray-700'
              }`}
            >
              {u}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-gray-700">
          Height {isImperial ? '(ft / in)' : '(cm)'}
        </label>
        <div className="mt-1 flex gap-2">
          {isImperial ? (
            <>
              <input type="number" value={heightFeet} onChange={(e) => setHeightFeet(e.target.value)}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                placeholder="ft" />
              <input type="number" value={heightInches} onChange={(e) => setHeightInches(e.target.value)}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                placeholder="in" />
            </>
          ) : (
            <input type="number" value={heightCm} onChange={(e) => setHeightCm(e.target.value)}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
              placeholder="cm" />
          )}
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-gray-700">
          Weight ({isImperial ? 'lbs' : 'kg'})
        </label>
        <input type="number" value={weight} onChange={(e) => setWeight(e.target.value)}
          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none" />
      </div>

      <button onClick={handleSave} disabled={mutation.isPending}
        className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
        <Save className="h-4 w-4" />
        {mutation.isPending ? 'Saving...' : 'Save Changes'}
      </button>
    </div>
  )
}

// ---- Equipment Section ----
function EquipmentSection({ profile }: { profile: FullUser }) {
  const queryClient = useQueryClient()
  const [equipment, setEquipment] = useState<string[]>(profile.equipment_owned)

  const mutation = useMutation({
    mutationFn: profileApi.updateEquipment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] })
      toast.success('Equipment updated')
    },
    onError: () => toast.error('Failed to update equipment'),
  })

  const toggle = (item: string) => {
    setEquipment((prev) =>
      prev.includes(item.toLowerCase())
        ? prev.filter((e) => e !== item.toLowerCase())
        : [...prev, item.toLowerCase()]
    )
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        {EQUIPMENT_OPTIONS.map((item) => (
          <button key={item} type="button" onClick={() => toggle(item)}
            className={`rounded-lg border px-3 py-2 text-sm font-medium ${
              equipment.includes(item.toLowerCase())
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-300 text-gray-700 hover:border-gray-400'
            }`}>
            {item}
          </button>
        ))}
      </div>
      <button onClick={() => mutation.mutate(equipment)} disabled={mutation.isPending}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
        <Save className="h-4 w-4" />
        {mutation.isPending ? 'Saving...' : 'Save Equipment'}
      </button>
    </div>
  )
}

// ---- Preferences Section ----
function PreferencesSection({ profile }: { profile: FullUser }) {
  const queryClient = useQueryClient()
  const prefs = profile.workout_preferences
  const [style, setStyle] = useState(prefs.preferred_style)
  const [duration, setDuration] = useState(prefs.default_duration_minutes)
  const [experience, setExperience] = useState(prefs.experience_level)

  const mutation = useMutation({
    mutationFn: profileApi.updatePreferences,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] })
      toast.success('Preferences updated')
    },
    onError: () => toast.error('Failed to update preferences'),
  })

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium text-gray-700">Workout Style</label>
        <div className="mt-1 grid grid-cols-2 gap-2">
          {STYLE_OPTIONS.map(({ value, label }) => (
            <button key={value} type="button" onClick={() => setStyle(value)}
              className={`rounded-lg border px-3 py-2 text-sm font-medium ${
                style === value ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-300 text-gray-700'
              }`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-gray-700">
          Default Duration: {duration} min
        </label>
        <input type="range" min={15} max={120} step={15} value={duration}
          onChange={(e) => setDuration(parseInt(e.target.value))}
          className="mt-2 w-full" />
        <div className="flex justify-between text-xs text-gray-400">
          <span>15 min</span><span>120 min</span>
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-gray-700">Experience Level</label>
        <div className="mt-1 flex gap-2">
          {EXPERIENCE_OPTIONS.map((lvl) => (
            <button key={lvl} type="button" onClick={() => setExperience(lvl)}
              className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium capitalize ${
                experience === lvl ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-300 text-gray-700'
              }`}>
              {lvl}
            </button>
          ))}
        </div>
      </div>

      <button onClick={() => mutation.mutate({ preferred_style: style, default_duration_minutes: duration, experience_level: experience })}
        disabled={mutation.isPending}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
        <Save className="h-4 w-4" />
        {mutation.isPending ? 'Saving...' : 'Save Preferences'}
      </button>
    </div>
  )
}

// ---- Body Weight Section ----
function BodyWeightSection({ profile }: { profile: FullUser }) {
  const queryClient = useQueryClient()
  const isImperial = profile.profile.preferred_units === 'imperial'
  const unit = isImperial ? 'lbs' : 'kg'

  const [newWeight, setNewWeight] = useState('')

  const { data: history = [] } = useQuery({
    queryKey: ['bodyWeight'],
    queryFn: () => profileApi.getBodyWeightHistory(10),
  })

  const logMutation = useMutation({
    mutationFn: profileApi.logBodyWeight,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bodyWeight'] })
      setNewWeight('')
      toast.success('Weight logged')
    },
    onError: () => toast.error('Failed to log weight'),
  })

  const deleteMutation = useMutation({
    mutationFn: profileApi.deleteBodyWeightEntry,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bodyWeight'] })
      toast.success('Entry deleted')
    },
  })

  const handleLog = () => {
    const val = parseFloat(newWeight)
    if (!val || val <= 0) return
    logMutation.mutate({ weight: val, unit })
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input
          type="number"
          value={newWeight}
          onChange={(e) => setNewWeight(e.target.value)}
          placeholder={`Weight (${unit})`}
          className="block flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
          onKeyDown={(e) => e.key === 'Enter' && handleLog()}
        />
        <button onClick={handleLog} disabled={logMutation.isPending}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
          Log
        </button>
      </div>

      {history.length > 0 ? (
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-gray-500 uppercase">Recent entries</p>
          {history.map((entry) => (
            <div key={entry.id} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
              <div>
                <span className="text-sm font-semibold text-gray-900">{entry.weight} {entry.unit}</span>
                <span className="ml-2 text-xs text-gray-500">
                  {new Date(entry.recorded_at).toLocaleDateString()}
                </span>
              </div>
              <button onClick={() => deleteMutation.mutate(entry.id)}
                className="text-xs text-red-500 hover:text-red-700">
                Remove
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-500">No weight entries yet. Log your first one above.</p>
      )}
    </div>
  )
}

// ---- Main Profile Page ----
export function ProfilePage() {
  const { user, logout } = useAuth()

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: profileApi.getProfile,
  })

  if (isLoading || !profile) {
    return (
      <div className="flex items-center justify-center pt-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-lg px-4 pt-6 pb-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
        <p className="text-sm text-gray-500">@{user?.username}</p>
      </div>

      <div className="space-y-3">
        <Section title="Personal Info" icon={<User className="h-5 w-5 text-blue-600" />} defaultOpen>
          <PersonalInfoSection profile={profile} />
        </Section>

        <Section title="Equipment" icon={<Wrench className="h-5 w-5 text-orange-600" />}>
          <EquipmentSection profile={profile} />
        </Section>

        <Section title="Workout Preferences" icon={<Dumbbell className="h-5 w-5 text-purple-600" />}>
          <PreferencesSection profile={profile} />
        </Section>

        <Section title="Body Weight" icon={<Scale className="h-5 w-5 text-green-600" />}>
          <BodyWeightSection profile={profile} />
        </Section>
      </div>

      <button onClick={logout}
        className="mt-8 flex w-full items-center justify-center gap-2 rounded-lg border border-red-300 px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50">
        <LogOut className="h-4 w-4" />
        Log out
      </button>
    </div>
  )
}
