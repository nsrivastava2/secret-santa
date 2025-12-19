'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Snowfall from '@/components/Snowfall'

interface Assignment {
  id: string
  giver: {
    name: string
    email: string
  }
  receiver: {
    name: string
    email: string
  }
  assignedAt: string
  emailSent: boolean
}

interface ParticipationStats {
  total: number
  completed: number
  pending: number
  percentage: number
}

interface PendingMember {
  id: string
  name: string
  email: string
}

export default function AdminPanel() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [adminChecked, setAdminChecked] = useState(false)
  const [message, setMessage] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)

  // Participation tracking
  const [stats, setStats] = useState<ParticipationStats | null>(null)
  const [pendingMembers, setPendingMembers] = useState<PendingMember[]>([])
  const [showPendingList, setShowPendingList] = useState(false)
  const [sendingReminders, setSendingReminders] = useState(false)
  const [reminderMessage, setReminderMessage] = useState('')
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/')
    }
  }, [status, router])

  useEffect(() => {
    if (session?.user?.email) {
      fetch('/api/organization')
        .then(res => res.json())
        .then(data => {
          const adminEmails = (data.adminEmails || '').split(',').map((e: string) => e.trim().toLowerCase()).filter((e: string) => e.length > 0)
          const userIsAdmin = adminEmails.length === 0 || adminEmails.includes(session.user?.email?.toLowerCase() || '')
          setIsAdmin(userIsAdmin)
          setAdminChecked(true)
          if (!userIsAdmin) {
            router.push('/dashboard')
          } else {
            fetchAssignments()
            fetchParticipation()
          }
        })
        .catch(() => {
          setAdminChecked(true)
          router.push('/dashboard')
        })
    }
  }, [session, router])

  const fetchAssignments = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/assignments')
      const data = await response.json()
      if (response.ok) {
        setAssignments(data.assignments)
      }
    } catch (error) {
      console.error('Error fetching assignments:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchParticipation = async () => {
    try {
      const response = await fetch('/api/admin/reminders')
      const data = await response.json()
      if (response.ok) {
        setStats(data.stats)
        setPendingMembers(data.pendingMembers)
      }
    } catch (error) {
      console.error('Error fetching participation:', error)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setMessage(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (response.ok) {
        setMessage({
          type: 'success',
          text: `Successfully uploaded ${data.count} team members!`,
        })
        fetchParticipation()
      } else {
        setMessage({ type: 'error', text: data.error })
      }
    } catch (error: unknown) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Upload failed' })
    } finally {
      setUploading(false)
    }
  }

  const handleDownload = () => {
    window.open('/api/admin/assignments?format=excel', '_blank')
  }

  const handleSendReminders = async (sendToAll: boolean) => {
    setSendingReminders(true)
    setMessage(null)

    try {
      const response = await fetch('/api/admin/reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberIds: sendToAll ? [] : Array.from(selectedMembers),
          customMessage: reminderMessage || undefined,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setMessage({ type: 'success', text: data.message })
        setSelectedMembers(new Set())
        setReminderMessage('')
      } else {
        setMessage({ type: 'error', text: data.error })
      }
    } catch (error: unknown) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Failed to send reminders' })
    } finally {
      setSendingReminders(false)
    }
  }

  const toggleMemberSelection = (id: string) => {
    const newSelected = new Set(selectedMembers)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedMembers(newSelected)
  }

  const selectAllPending = () => {
    setSelectedMembers(new Set(pendingMembers.map(m => m.id)))
  }

  const clearSelection = () => {
    setSelectedMembers(new Set())
  }

  if (status === 'loading' || !adminChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl text-christmas-green">Loading...</div>
      </div>
    )
  }

  if (!session?.user || !isAdmin) {
    return null
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      <Snowfall />

      {/* Header */}
      <nav className="bg-christmas-green text-white p-4 shadow-lg relative z-10">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🎅</span>
            <h1 className="text-2xl font-bold">Admin Panel</h1>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/settings')}
              className="bg-white/20 px-4 py-2 rounded-lg hover:bg-white/30 transition"
            >
              Settings
            </button>
            <button
              onClick={() => router.push('/dashboard')}
              className="bg-christmas-gold text-christmas-green px-4 py-2 rounded-lg font-semibold hover:bg-yellow-400 transition"
            >
              Dashboard
            </button>
            <span className="text-sm hidden md:inline">{session.user.email}</span>
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
        {/* Message Display */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
            {message.text}
          </div>
        )}

        {/* Participation Stats */}
        {stats && stats.total > 0 && (
          <div className="christmas-card rounded-2xl p-6 mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span>📊</span>
              Participation Status
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div className="bg-blue-50 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-blue-600">{stats.total}</div>
                <div className="text-sm text-gray-600">Total Members</div>
              </div>
              <div className="bg-green-50 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-green-600">{stats.completed}</div>
                <div className="text-sm text-gray-600">Picked</div>
              </div>
              <div className="bg-yellow-50 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-yellow-600">{stats.pending}</div>
                <div className="text-sm text-gray-600">Pending</div>
              </div>
              <div className="bg-purple-50 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-purple-600">{stats.percentage}%</div>
                <div className="text-sm text-gray-600">Complete</div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-4 mb-4">
              <div
                className="bg-christmas-green h-4 rounded-full transition-all duration-500"
                style={{ width: `${stats.percentage}%` }}
              />
            </div>

            {/* Reminder Section */}
            {stats.pending > 0 && (
              <div className="border-t pt-4 mt-4">
                <div className="flex flex-wrap items-center gap-4 mb-4">
                  <button
                    onClick={() => setShowPendingList(!showPendingList)}
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    {showPendingList ? 'Hide' : 'Show'} pending members ({stats.pending})
                  </button>
                  <button
                    onClick={() => handleSendReminders(true)}
                    disabled={sendingReminders}
                    className="bg-christmas-red hover:bg-red-700 text-white px-4 py-2 rounded-lg transition disabled:opacity-50 flex items-center gap-2"
                  >
                    <span>📧</span>
                    {sendingReminders ? 'Sending...' : `Send Reminder to All (${stats.pending})`}
                  </button>
                </div>

                {showPendingList && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-3">
                      <span className="font-medium">Select members to remind:</span>
                      <div className="flex gap-2">
                        <button
                          onClick={selectAllPending}
                          className="text-sm text-blue-600 hover:text-blue-800"
                        >
                          Select All
                        </button>
                        <button
                          onClick={clearSelection}
                          className="text-sm text-gray-600 hover:text-gray-800"
                        >
                          Clear
                        </button>
                      </div>
                    </div>

                    <div className="max-h-48 overflow-y-auto mb-4">
                      {pendingMembers.map(member => (
                        <label
                          key={member.id}
                          className="flex items-center gap-3 p-2 hover:bg-white rounded cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={selectedMembers.has(member.id)}
                            onChange={() => toggleMemberSelection(member.id)}
                            className="w-4 h-4 text-christmas-green rounded"
                          />
                          <span className="font-medium">{member.name}</span>
                          <span className="text-gray-500 text-sm">{member.email}</span>
                        </label>
                      ))}
                    </div>

                    <div className="mb-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Custom message (optional):
                      </label>
                      <textarea
                        value={reminderMessage}
                        onChange={(e) => setReminderMessage(e.target.value)}
                        placeholder="Add a personal note to the reminder email..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        rows={2}
                      />
                    </div>

                    {selectedMembers.size > 0 && (
                      <button
                        onClick={() => handleSendReminders(false)}
                        disabled={sendingReminders}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition disabled:opacity-50"
                      >
                        {sendingReminders ? 'Sending...' : `Send to Selected (${selectedMembers.size})`}
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Upload Section */}
        <div className="christmas-card rounded-2xl p-8 mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span>📤</span>
            Upload Team Members
          </h2>

          <p className="text-gray-600 mb-4">
            Upload an Excel file with columns: <strong>name</strong> and{' '}
            <strong>email</strong>
          </p>

          <div className="flex items-center gap-4">
            <label className="bg-christmas-red hover:bg-red-700 text-white px-6 py-3 rounded-lg cursor-pointer transition flex items-center gap-2">
              <span>📁</span>
              <span>{uploading ? 'Uploading...' : 'Choose Excel File'}</span>
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileUpload}
                disabled={uploading}
                className="hidden"
              />
            </label>
          </div>

          <p className="text-sm text-gray-500 mt-3">
            Note: Uploading a new file will deactivate all previous members and use the new list.
          </p>
        </div>

        {/* Assignments Section */}
        <div className="christmas-card rounded-2xl p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
              <span>🎁</span>
              Secret Santa Assignments ({assignments.length})
            </h2>

            <button
              onClick={handleDownload}
              disabled={assignments.length === 0}
              className="bg-christmas-green hover:bg-green-700 text-white px-6 py-3 rounded-lg transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>📥</span>
              Download Excel
            </button>
          </div>

          {loading ? (
            <div className="text-center py-8 text-gray-600">
              Loading assignments...
            </div>
          ) : assignments.length === 0 ? (
            <div className="text-center py-8 text-gray-600">
              No assignments yet. Team members haven't picked their Secret Santa recipients.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-christmas-green text-white">
                    <th className="px-4 py-3 text-left">Giver</th>
                    <th className="px-4 py-3 text-left">Giver Email</th>
                    <th className="px-4 py-3 text-left">Receiver</th>
                    <th className="px-4 py-3 text-left">Receiver Email</th>
                    <th className="px-4 py-3 text-left">Assigned At</th>
                    <th className="px-4 py-3 text-left">Email Sent</th>
                  </tr>
                </thead>
                <tbody>
                  {assignments.map((assignment, index) => (
                    <tr
                      key={assignment.id}
                      className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}
                    >
                      <td className="px-4 py-3">{assignment.giver.name}</td>
                      <td className="px-4 py-3">{assignment.giver.email}</td>
                      <td className="px-4 py-3 font-semibold text-christmas-red">
                        {assignment.receiver.name}
                      </td>
                      <td className="px-4 py-3">{assignment.receiver.email}</td>
                      <td className="px-4 py-3">
                        {new Date(assignment.assignedAt).toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        {assignment.emailSent ? (
                          <span className="text-green-600">✓ Sent</span>
                        ) : (
                          <span className="text-red-600">✗ Failed</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
