'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

interface SetupData {
  // Step 1: Basic Info
  name: string
  adminEmails: string
  // Step 2: Branding
  primaryColor: string
  secondaryColor: string
  homepageTitle: string
  homepageMessage: string
  // Step 3: Email
  smtpHost: string
  smtpPort: number
  smtpUser: string
  smtpPassword: string
  smtpSecure: boolean
  emailFrom: string
  emailFromName: string
  hrEmail: string
}

export default function SetupWizard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)

  const [formData, setFormData] = useState<SetupData>({
    name: '',
    adminEmails: '',
    primaryColor: '#165B33',
    secondaryColor: '#C41E3A',
    homepageTitle: 'Secret Santa',
    homepageMessage: 'Sign in to discover who you\'ll be gifting this holiday season!',
    smtpHost: 'smtp.gmail.com',
    smtpPort: 587,
    smtpUser: '',
    smtpPassword: '',
    smtpSecure: false,
    emailFrom: '',
    emailFromName: 'Secret Santa',
    hrEmail: '',
  })

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/')
    }
  }, [status, router])

  useEffect(() => {
    // Pre-fill admin email with current user's email
    if (session?.user?.email && !formData.adminEmails) {
      setFormData(prev => ({ ...prev, adminEmails: session.user?.email || '' }))
    }
  }, [session, formData.adminEmails])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }))
  }

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setLogoFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setLogoPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError(null)

    try {
      // Upload logo if selected
      if (logoFile) {
        const logoFormData = new FormData()
        logoFormData.append('logo', logoFile)

        const logoRes = await fetch('/api/organization/logo', {
          method: 'POST',
          body: logoFormData,
        })

        if (!logoRes.ok) {
          const data = await logoRes.json()
          throw new Error(data.error || 'Failed to upload logo')
        }
      }

      // Save organization settings
      const res = await fetch('/api/organization', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          setupComplete: true,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to save settings')
      }

      // Redirect to dashboard
      router.push('/dashboard')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-800 to-red-900">
        <div className="text-xl text-white">Loading...</div>
      </div>
    )
  }

  if (!session?.user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-800 to-red-900 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-green-700 to-green-600 text-white p-8 text-center">
            <h1 className="text-3xl font-bold mb-2">Welcome to Secret Santa!</h1>
            <p className="opacity-90">Let's set up your organization in a few simple steps</p>
          </div>

          {/* Progress Steps */}
          <div className="flex border-b">
            {[1, 2, 3].map((s) => (
              <button
                key={s}
                onClick={() => setStep(s)}
                className={`flex-1 py-4 text-center font-medium transition-colors ${
                  step === s
                    ? 'bg-green-50 text-green-700 border-b-2 border-green-600'
                    : step > s
                    ? 'bg-green-100 text-green-600'
                    : 'text-gray-400'
                }`}
              >
                {s === 1 && 'Organization'}
                {s === 2 && 'Branding'}
                {s === 3 && 'Email Settings'}
              </button>
            ))}
          </div>

          {/* Form Content */}
          <div className="p-8">
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
                {error}
              </div>
            )}

            {/* Step 1: Organization */}
            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Organization Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g., Acme Corporation"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Admin Email(s) *
                  </label>
                  <input
                    type="text"
                    name="adminEmails"
                    value={formData.adminEmails}
                    onChange={handleChange}
                    placeholder="admin@company.com, hr@company.com"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                  <p className="mt-2 text-sm text-gray-500">
                    Comma-separated list of admin emails. These users can upload team members and view assignments.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    HR/Notification Email
                  </label>
                  <input
                    type="email"
                    name="hrEmail"
                    value={formData.hrEmail}
                    onChange={handleChange}
                    placeholder="hr@company.com"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                  <p className="mt-2 text-sm text-gray-500">
                    This email will receive notifications when assignments are made.
                  </p>
                </div>
              </div>
            )}

            {/* Step 2: Branding */}
            {step === 2 && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Organization Logo
                  </label>
                  <div className="flex items-center gap-4">
                    {logoPreview && (
                      <img
                        src={logoPreview}
                        alt="Logo preview"
                        className="w-20 h-20 object-contain border rounded"
                      />
                    )}
                    <label className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg cursor-pointer hover:bg-gray-200 transition">
                      {logoPreview ? 'Change Logo' : 'Upload Logo'}
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/svg+xml,image/webp"
                        onChange={handleLogoChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                  <p className="mt-2 text-sm text-gray-500">
                    PNG, JPEG, SVG or WebP. Max 2MB.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Primary Color
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        name="primaryColor"
                        value={formData.primaryColor}
                        onChange={handleChange}
                        className="w-12 h-12 rounded cursor-pointer"
                      />
                      <input
                        type="text"
                        name="primaryColor"
                        value={formData.primaryColor}
                        onChange={handleChange}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Secondary Color
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        name="secondaryColor"
                        value={formData.secondaryColor}
                        onChange={handleChange}
                        className="w-12 h-12 rounded cursor-pointer"
                      />
                      <input
                        type="text"
                        name="secondaryColor"
                        value={formData.secondaryColor}
                        onChange={handleChange}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Homepage Title
                  </label>
                  <input
                    type="text"
                    name="homepageTitle"
                    value={formData.homepageTitle}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Homepage Message
                  </label>
                  <textarea
                    name="homepageMessage"
                    value={formData.homepageMessage}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>
            )}

            {/* Step 3: Email Settings */}
            {step === 3 && (
              <div className="space-y-6">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                  <p className="text-yellow-800 text-sm">
                    <strong>Note:</strong> For Gmail, use an App Password instead of your regular password.
                    For Microsoft 365, you may need to enable SMTP AUTH in your admin settings.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      SMTP Host *
                    </label>
                    <input
                      type="text"
                      name="smtpHost"
                      value={formData.smtpHost}
                      onChange={handleChange}
                      placeholder="smtp.gmail.com"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      SMTP Port *
                    </label>
                    <input
                      type="number"
                      name="smtpPort"
                      value={formData.smtpPort}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      SMTP Username *
                    </label>
                    <input
                      type="text"
                      name="smtpUser"
                      value={formData.smtpUser}
                      onChange={handleChange}
                      placeholder="your-email@gmail.com"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      SMTP Password *
                    </label>
                    <input
                      type="password"
                      name="smtpPassword"
                      value={formData.smtpPassword}
                      onChange={handleChange}
                      placeholder="App password"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="smtpSecure"
                    checked={formData.smtpSecure}
                    onChange={handleChange}
                    id="smtpSecure"
                    className="w-4 h-4 text-green-600 rounded"
                  />
                  <label htmlFor="smtpSecure" className="text-sm text-gray-700">
                    Use SSL/TLS (port 465)
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      From Email *
                    </label>
                    <input
                      type="email"
                      name="emailFrom"
                      value={formData.emailFrom}
                      onChange={handleChange}
                      placeholder="santa@company.com"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      From Name
                    </label>
                    <input
                      type="text"
                      name="emailFromName"
                      value={formData.emailFromName}
                      onChange={handleChange}
                      placeholder="Secret Santa"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between mt-8 pt-6 border-t">
              {step > 1 ? (
                <button
                  onClick={() => setStep(step - 1)}
                  className="px-6 py-3 text-gray-600 hover:text-gray-800 transition"
                >
                  Back
                </button>
              ) : (
                <div />
              )}

              {step < 3 ? (
                <button
                  onClick={() => setStep(step + 1)}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                >
                  Next
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Complete Setup'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
