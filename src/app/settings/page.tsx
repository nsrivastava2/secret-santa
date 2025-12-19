'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Snowfall from '@/components/Snowfall'

interface OrganizationSettings {
  id: string
  name: string
  logoUrl: string | null
  primaryColor: string
  secondaryColor: string
  homepageTitle: string
  homepageMessage: string
  smtpHost: string
  smtpPort: number
  smtpUser: string | null
  smtpPassword: string | null
  smtpSecure: boolean
  emailFrom: string | null
  emailFromName: string
  hrEmail: string | null
  emailSubject: string
  emailFooter: string
  adminEmails: string
  googleEnabled: boolean
  microsoftEnabled: boolean
  setupComplete: boolean
}

export default function SettingsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [settings, setSettings] = useState<OrganizationSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [activeTab, setActiveTab] = useState<'general' | 'branding' | 'email' | 'auth'>('general')
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/')
    } else if (session?.user) {
      fetchSettings()
    }
  }, [status, session, router])

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/organization')
      if (res.ok) {
        const data = await res.json()
        setSettings(data)
        if (data.logoUrl) {
          setLogoPreview(data.logoUrl)
        }
      } else if (res.status === 403) {
        router.push('/dashboard')
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    if (!settings) return
    const { name, value, type } = e.target
    setSettings({
      ...settings,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked :
              type === 'number' ? parseInt(value) || 0 : value
    })
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

  const handleRemoveLogo = async () => {
    try {
      const res = await fetch('/api/organization/logo', { method: 'DELETE' })
      if (res.ok) {
        setLogoPreview(null)
        setLogoFile(null)
        if (settings) {
          setSettings({ ...settings, logoUrl: null })
        }
        setMessage({ type: 'success', text: 'Logo removed successfully' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to remove logo' })
    }
  }

  const handleSave = async () => {
    if (!settings) return
    setSaving(true)
    setMessage(null)

    try {
      // Upload logo if changed
      if (logoFile) {
        const logoFormData = new FormData()
        logoFormData.append('logo', logoFile)
        const logoRes = await fetch('/api/organization/logo', {
          method: 'POST',
          body: logoFormData,
        })
        if (!logoRes.ok) {
          throw new Error('Failed to upload logo')
        }
        setLogoFile(null)
      }

      // Save settings
      const res = await fetch('/api/organization', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })

      if (res.ok) {
        const data = await res.json()
        setSettings(data.organization)
        setMessage({ type: 'success', text: 'Settings saved successfully!' })
      } else {
        const data = await res.json()
        throw new Error(data.error || 'Failed to save settings')
      }
    } catch (error: unknown) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'An error occurred' })
    } finally {
      setSaving(false)
    }
  }

  const handleTestEmail = async () => {
    if (!session?.user?.email) return
    setMessage(null)

    try {
      const res = await fetch('/api/organization/test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: session.user.email }),
      })

      if (res.ok) {
        setMessage({ type: 'success', text: `Test email sent to ${session.user.email}` })
      } else {
        const data = await res.json()
        throw new Error(data.error || 'Failed to send test email')
      }
    } catch (error: unknown) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Failed to send test email' })
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-[#f5f1e8] tracking-widest">Loading...</div>
      </div>
    )
  }

  if (!session?.user || !settings) {
    return null
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      <Snowfall />

      {/* Header */}
      <nav className="bg-christmas-green text-white p-4 shadow-lg relative z-10">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className="text-3xl">Settings</span>
            <h1 className="text-2xl font-bold">Organization Settings</h1>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/admin')}
              className="bg-christmas-gold text-christmas-green px-4 py-2 rounded-lg font-semibold hover:bg-yellow-400 transition"
            >
              Admin Panel
            </button>
            <button
              onClick={() => router.push('/dashboard')}
              className="bg-white/20 px-4 py-2 rounded-lg hover:bg-white/30 transition"
            >
              Dashboard
            </button>
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="bg-christmas-red px-4 py-2 rounded-lg hover:bg-red-700 transition"
            >
              Sign Out
            </button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8 relative z-10">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b">
            {(['general', 'branding', 'email', 'auth'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-4 text-center font-medium transition-colors capitalize ${
                  activeTab === tab
                    ? 'bg-green-50 text-green-700 border-b-2 border-green-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab === 'auth' ? 'Authentication' : tab}
              </button>
            ))}
          </div>

          <div className="p-8">
            {message && (
              <div className={`mb-6 p-4 rounded-lg ${
                message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
              }`}>
                {message.text}
              </div>
            )}

            {/* General Tab */}
            {activeTab === 'general' && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Organization Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={settings.name}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Admin Emails
                  </label>
                  <input
                    type="text"
                    name="adminEmails"
                    value={settings.adminEmails}
                    onChange={handleChange}
                    placeholder="admin@company.com, hr@company.com"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                  <p className="mt-2 text-sm text-gray-500">
                    Comma-separated list of admin emails
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    HR/Notification Email
                  </label>
                  <input
                    type="email"
                    name="hrEmail"
                    value={settings.hrEmail || ''}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                  <p className="mt-2 text-sm text-gray-500">
                    Receives notifications when assignments are made
                  </p>
                </div>
              </div>
            )}

            {/* Branding Tab */}
            {activeTab === 'branding' && (
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
                        className="w-24 h-24 object-contain border rounded bg-gray-50"
                      />
                    )}
                    <div className="flex flex-col gap-2">
                      <label className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg cursor-pointer hover:bg-gray-200 transition inline-block">
                        {logoPreview ? 'Change Logo' : 'Upload Logo'}
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/svg+xml,image/webp"
                          onChange={handleLogoChange}
                          className="hidden"
                        />
                      </label>
                      {logoPreview && (
                        <button
                          onClick={handleRemoveLogo}
                          className="px-4 py-2 text-red-600 hover:text-red-700 text-sm"
                        >
                          Remove Logo
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Primary Color
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        name="primaryColor"
                        value={settings.primaryColor}
                        onChange={handleChange}
                        className="w-12 h-12 rounded cursor-pointer border-0"
                      />
                      <input
                        type="text"
                        name="primaryColor"
                        value={settings.primaryColor}
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
                        value={settings.secondaryColor}
                        onChange={handleChange}
                        className="w-12 h-12 rounded cursor-pointer border-0"
                      />
                      <input
                        type="text"
                        name="secondaryColor"
                        value={settings.secondaryColor}
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
                    value={settings.homepageTitle}
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
                    value={settings.homepageMessage}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>
            )}

            {/* Email Tab */}
            {activeTab === 'email' && (
              <div className="space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-blue-800 text-sm">
                    <strong>Common SMTP Settings:</strong><br />
                    Gmail: smtp.gmail.com, port 587 (use App Password)<br />
                    Outlook/Microsoft 365: smtp.office365.com, port 587<br />
                    Custom Exchange: Your mail server hostname
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      SMTP Host
                    </label>
                    <input
                      type="text"
                      name="smtpHost"
                      value={settings.smtpHost}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      SMTP Port
                    </label>
                    <input
                      type="number"
                      name="smtpPort"
                      value={settings.smtpPort}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      SMTP Username
                    </label>
                    <input
                      type="text"
                      name="smtpUser"
                      value={settings.smtpUser || ''}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      SMTP Password
                    </label>
                    <input
                      type="password"
                      name="smtpPassword"
                      value={settings.smtpPassword || ''}
                      onChange={handleChange}
                      placeholder={settings.smtpPassword ? '********' : ''}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="smtpSecure"
                    checked={settings.smtpSecure}
                    onChange={handleChange}
                    id="smtpSecure"
                    className="w-4 h-4 text-green-600 rounded"
                  />
                  <label htmlFor="smtpSecure" className="text-sm text-gray-700">
                    Use SSL/TLS (typically for port 465)
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      From Email
                    </label>
                    <input
                      type="email"
                      name="emailFrom"
                      value={settings.emailFrom || ''}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      From Name
                    </label>
                    <input
                      type="text"
                      name="emailFromName"
                      value={settings.emailFromName}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Subject
                  </label>
                  <input
                    type="text"
                    name="emailSubject"
                    value={settings.emailSubject}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Footer Text
                  </label>
                  <textarea
                    name="emailFooter"
                    value={settings.emailFooter}
                    onChange={handleChange}
                    rows={2}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                <div className="pt-4 border-t">
                  <button
                    onClick={handleTestEmail}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                  >
                    Send Test Email
                  </button>
                  <p className="mt-2 text-sm text-gray-500">
                    Sends a test email to {session.user.email}
                  </p>
                </div>
              </div>
            )}

            {/* Auth Tab */}
            {activeTab === 'auth' && (
              <div className="space-y-6">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-yellow-800 text-sm">
                    <strong>Note:</strong> OAuth providers are configured via environment variables.
                    These toggles control which login buttons appear on the homepage.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h3 className="font-medium text-gray-900">Google Sign-In</h3>
                      <p className="text-sm text-gray-500">Allow users to sign in with Google accounts</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        name="googleEnabled"
                        checked={settings.googleEnabled}
                        onChange={handleChange}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h3 className="font-medium text-gray-900">Microsoft Sign-In</h3>
                      <p className="text-sm text-gray-500">Allow users to sign in with Microsoft/Outlook accounts</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        name="microsoftEnabled"
                        checked={settings.microsoftEnabled}
                        onChange={handleChange}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Save Button */}
            <div className="mt-8 pt-6 border-t flex justify-end">
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
