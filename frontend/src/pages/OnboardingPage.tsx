import { useState } from 'react'
import { useNavigate } from 'react-router'
import { useAuthStore } from '../stores/authStore'
import client from '../api/client'

const EQUIPMENT_OPTIONS = [
  'Barbell',
  'Dumbbells',
  'Kettlebell',
  'Pull-up Bar',
  'Bench',
  'Squat Rack',
  'Cable Machine',
  'Resistance Bands',
  'Medicine Ball',
  'Jump Rope',
  'Foam Roller',
  'Body Weight',
  'Misc/Other',
]

const STYLE_OPTIONS = [
  { value: 'strength', label: 'Strength', desc: 'Heavy weights, low reps' },
  { value: 'hypertrophy', label: 'Muscle Building', desc: 'Moderate weights, 8-12 reps' },
  { value: 'endurance', label: 'Endurance', desc: 'Lighter weights, high reps' },
  { value: 'hiit', label: 'HIIT', desc: 'High intensity circuits' },
  { value: 'mixed', label: 'Mixed', desc: 'A bit of everything' },
]

export function OnboardingPage() {
  const navigate = useNavigate()
  const { user, setAuth, accessToken } = useAuthStore()
  const [step, setStep] = useState(0)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const [name, setName] = useState('')
  const [heightFeet, setHeightFeet] = useState('')
  const [heightInches, setHeightInches] = useState('')
  const [weight, setWeight] = useState('')
  const [units, setUnits] = useState('imperial')
  const [equipment, setEquipment] = useState<string[]>([])
  const [style, setStyle] = useState('hypertrophy')
  const [experience, setExperience] = useState('beginner')
  const [duration, setDuration] = useState(45)

  const toggleEquipment = (item: string) => {
    setEquipment((prev) =>
      prev.includes(item) ? prev.filter((e) => e !== item) : [...prev, item]
    )
  }

  const handleSubmit = async () => {
    setError('')

    // Validation
    const weightVal = parseFloat(weight)
    if (!weight || isNaN(weightVal) || weightVal <= 0) {
      setError('Please enter a valid weight greater than 0')
      return
    }
    if (units === 'imperial') {
      const feet = parseInt(heightFeet) || 0
      const inches = parseInt(heightInches) || 0
      if (feet < 0 || inches < 0) {
        setError('Height cannot be negative')
        return
      }
      if (inches >= 12) {
        setError('Inches must be less than 12')
        return
      }
    } else {
      const cm = parseInt(heightFeet) || 0
      if (cm < 0) {
        setError('Height cannot be negative')
        return
      }
    }

    setSubmitting(true)
    try {
      const heightValue =
        units === 'imperial'
          ? (parseInt(heightFeet) || 0) * 12 + (parseInt(heightInches) || 0)
          : parseInt(heightFeet) || 0

      const res = await client.post('/users/me/onboarding', {
        name,
        height: { value: heightValue, unit: units === 'imperial' ? 'in' : 'cm' },
        weight: { value: parseFloat(weight) || 0, unit: units === 'imperial' ? 'lbs' : 'kg' },
        preferred_units: units,
        equipment_owned: equipment.map((e) => e.toLowerCase()),
        default_duration_minutes: duration,
        preferred_style: style,
        experience_level: experience,
      })

      if (user && accessToken) {
        setAuth({ ...user, onboarding_completed: true }, accessToken)
      }
      navigate('/home', { replace: true })
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  const steps = [
    // Step 0: Personal Info
    <div key="personal" className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-900">About You</h2>
      <div>
        <label className="block text-sm font-medium text-gray-700">Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
          placeholder="Your name"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Units</label>
        <div className="mt-1 flex gap-2">
          {['imperial', 'metric'].map((u) => (
            <button
              key={u}
              type="button"
              onClick={() => setUnits(u)}
              className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium capitalize ${
                units === u
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-300 text-gray-700'
              }`}
            >
              {u}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Height {units === 'imperial' ? '(ft / in)' : '(cm)'}
        </label>
        <div className="mt-1 flex gap-2">
          <input
            type="number"
            value={heightFeet}
            onChange={(e) => setHeightFeet(e.target.value)}
            min={0}
            className="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
            placeholder={units === 'imperial' ? 'Feet' : 'cm'}
          />
          {units === 'imperial' && (
            <input
              type="number"
              value={heightInches}
              onChange={(e) => setHeightInches(e.target.value)}
              min={0}
              max={11}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
              placeholder="Inches"
            />
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Weight ({units === 'imperial' ? 'lbs' : 'kg'})
        </label>
        <input
          type="number"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          min={0}
          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
          placeholder={units === 'imperial' ? 'lbs' : 'kg'}
        />
      </div>
    </div>,

    // Step 1: Equipment
    <div key="equipment" className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-900">Your Equipment</h2>
      <p className="text-sm text-gray-600">Select all the equipment you have access to.</p>
      <div className="grid grid-cols-2 gap-2">
        {EQUIPMENT_OPTIONS.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => toggleEquipment(item)}
            className={`rounded-lg border px-3 py-2.5 text-sm font-medium ${
              equipment.includes(item)
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-300 text-gray-700 hover:border-gray-400'
            }`}
          >
            {item}
          </button>
        ))}
      </div>
    </div>,

    // Step 2: Preferences
    <div key="preferences" className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-900">Workout Preferences</h2>

      <div>
        <label className="block text-sm font-medium text-gray-700">Preferred Workout Style</label>
        <div className="mt-2 space-y-2">
          {STYLE_OPTIONS.map(({ value, label, desc }) => (
            <button
              key={value}
              type="button"
              onClick={() => setStyle(value)}
              className={`w-full rounded-lg border px-4 py-3 text-left ${
                style === value
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <p className="text-sm font-medium text-gray-900">{label}</p>
              <p className="text-xs text-gray-500">{desc}</p>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Default Workout Duration: {duration} min
        </label>
        <input
          type="range"
          min={15}
          max={120}
          step={15}
          value={duration}
          onChange={(e) => setDuration(parseInt(e.target.value))}
          className="mt-2 w-full"
        />
        <div className="flex justify-between text-xs text-gray-400">
          <span>15 min</span>
          <span>120 min</span>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Experience Level</label>
        <div className="mt-1 flex gap-2">
          {['beginner', 'intermediate', 'advanced'].map((lvl) => (
            <button
              key={lvl}
              type="button"
              onClick={() => setExperience(lvl)}
              className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium capitalize ${
                experience === lvl
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-300 text-gray-700'
              }`}
            >
              {lvl}
            </button>
          ))}
        </div>
      </div>
    </div>,
  ]

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="mb-6 flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Step {step + 1} of {steps.length}
          </p>
          <div className="flex gap-1.5">
            {steps.map((_, i) => (
              <div
                key={i}
                className={`h-2 w-8 rounded-full ${
                  i <= step ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-lg">
          {steps[step]}

          {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

          <div className="mt-6 flex gap-3">
            {step > 0 && (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                Back
              </button>
            )}
            {step < steps.length - 1 ? (
              <button
                type="button"
                onClick={() => {
                  if (step === 1 && equipment.length === 0) {
                    setError('Please select at least one equipment option.')
                    return
                  }
                  setError('')
                  setStep(step + 1)
                }}
                className="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
              >
                Next
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"
              >
                {submitting ? 'Saving...' : 'Get Started'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
