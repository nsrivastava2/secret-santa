'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Snowfall from '@/components/Snowfall'
import AssignmentButton from '@/components/AssignmentButton'

interface OrgSettings {
  name: string
  logoUrl: string | null
  primaryColor: string
  secondaryColor: string
  adminEmails?: string
}

export default function Dashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [assignment, setAssignment] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [alreadyAssigned, setAlreadyAssigned] = useState(false)
  const [orgSettings, setOrgSettings] = useState<OrgSettings | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/')
    }
  }, [status, router])

  useEffect(() => {
    // Fetch organization settings
    fetch('/api/organization')
      .then(res => res.json())
      .then(data => {
        setOrgSettings(data)
        // Check if current user is admin
        if (session?.user?.email && data.adminEmails) {
          const adminList = data.adminEmails.split(',').map((e: string) => e.trim().toLowerCase())
          setIsAdmin(adminList.includes(session.user.email.toLowerCase()) || adminList.length === 0)
        }
      })
      .catch(console.error)
  }, [session])

  const handleAssignment = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/assign', {
        method: 'POST',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to assign Secret Santa')
      }

      setAssignment(data.receiver)
      setAlreadyAssigned(data.alreadyAssigned || false)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-[#f5f1e8] tracking-widest">Loading...</div>
      </div>
    )
  }

  if (!session?.user) {
    return null
  }

  const primaryColor = orgSettings?.primaryColor || '#165B33'
  const secondaryColor = orgSettings?.secondaryColor || '#C41E3A'

  return (
    <div className="min-h-screen relative overflow-hidden">
      <Snowfall />

      {/* Top ribbon header with lights */}
      <div className="fixed top-0 left-0 right-0 z-20">
        <nav className="retro-nav p-3" style={{ backgroundColor: primaryColor }}>
          <div className="container mx-auto flex justify-between items-center">
            <div className="flex items-center gap-3">
              {orgSettings?.logoUrl ? (
                <img
                  src={orgSettings.logoUrl}
                  alt={orgSettings.name}
                  className="h-10 w-auto object-contain brightness-0 invert"
                />
              ) : (
                <span className="text-white font-bold">{orgSettings?.name || 'Secret Santa'}</span>
              )}
              <div className="h-6 w-px bg-[#f5f1e8]/30"></div>
              <span className="retro-title text-lg text-[#f5f1e8]">Secret Santa</span>
              <span className="retro-star text-sm hidden sm:inline">★</span>
            </div>
            <div className="flex items-center gap-3">
              {isAdmin && (
                <>
                  <button
                    onClick={() => router.push('/settings')}
                    className="retro-button-secondary"
                  >
                    Settings
                  </button>
                  <button
                    onClick={() => router.push('/admin')}
                    className="retro-button-secondary"
                  >
                    Admin Panel
                  </button>
                </>
              )}
              <span className="text-sm text-[#f5f1e8]/80 hidden sm:block">{session.user.email}</span>
              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                className="retro-button-secondary"
              >
                Sign Out
              </button>
            </div>
          </div>
        </nav>
        {/* Christmas lights */}
        <div className="lights-string bg-[#4a3728] py-2">
          <div className="light-bulb"></div>
          <div className="light-bulb"></div>
          <div className="light-bulb"></div>
          <div className="light-bulb"></div>
          <div className="light-bulb"></div>
          <div className="light-bulb"></div>
          <div className="light-bulb"></div>
          <div className="light-bulb"></div>
          <div className="light-bulb"></div>
          <div className="light-bulb"></div>
          <div className="light-bulb"></div>
        </div>
      </div>

      {/* Floating decorations */}
      <div className="deco-snowflake fixed top-40 left-8 hidden lg:block" style={{ fontSize: '4rem' }}>❄</div>
      <div className="deco-snowflake fixed bottom-32 right-8 hidden lg:block" style={{ animationDelay: '2s', fontSize: '5rem' }}>❄</div>
      <div className="deco-snowflake fixed top-1/2 left-4 hidden xl:block" style={{ animationDelay: '4s', fontSize: '3rem' }}>❄</div>
      <div className="deco-snowflake fixed top-1/3 right-4 hidden xl:block" style={{ animationDelay: '3s', fontSize: '3.5rem' }}>❄</div>

      {/* Floating ornaments */}
      <div className="fixed top-48 right-16 text-5xl ornament-swing hidden lg:block" style={{ animationDelay: '0s' }}>🎄</div>
      <div className="fixed bottom-40 left-16 text-4xl ornament-swing hidden lg:block" style={{ animationDelay: '1s' }}>🔔</div>

      <div className="container mx-auto px-4 py-10 relative z-10 mt-24">
        <div className="max-w-lg mx-auto">
          {!assignment ? (
            <div className="relative">
              {/* Starburst decoration */}
              <div className="absolute -top-4 -right-4 z-20">
                <div className="retro-starburst" style={{ width: '70px', height: '70px', fontSize: '0.7rem', backgroundColor: secondaryColor }}>
                  <span>LET'S<br/>GO!</span>
                </div>
              </div>

              <div className="retro-card p-8 text-center">
                {/* Corner decorations */}
                <div className="retro-corner retro-corner-tl" style={{ borderColor: primaryColor }}></div>
                <div className="retro-corner retro-corner-tr" style={{ borderColor: primaryColor }}></div>
                <div className="retro-corner retro-corner-bl" style={{ borderColor: primaryColor }}></div>
                <div className="retro-corner retro-corner-br" style={{ borderColor: primaryColor }}></div>

                {/* Badge */}
                <div className="flex justify-center mb-6">
                  <div className="retro-badge retro-badge-sm" style={{ backgroundColor: secondaryColor }}>
                    <span>GIFT<br/>TIME!</span>
                  </div>
                </div>

                <h2 className="retro-script text-3xl mb-1">Welcome,</h2>
                <h3 className="retro-title text-4xl mb-4" style={{ color: primaryColor }}>{session.user.name?.toUpperCase()}</h3>

                {/* Ribbon */}
                <div className="mb-6">
                  <span className="retro-ribbon text-xs" style={{ backgroundColor: secondaryColor }}>READY TO DISCOVER?</span>
                </div>

                <div className="retro-divider mb-6">
                  <span className="retro-star text-xl" style={{ color: primaryColor }}>★</span>
                </div>

                <p className="retro-body mb-8">
                  Click the button below to reveal who you'll be surprising with a gift this Christmas!
                </p>

                <AssignmentButton
                  onClick={handleAssignment}
                  loading={loading}
                  disabled={loading}
                />

                {error && (
                  <div className="retro-error p-4 mt-6 text-sm">
                    {error}
                  </div>
                )}

                <p className="text-sm text-[#4a3728]/70 mt-6">
                  This is a one-time action
                </p>
              </div>
            </div>
          ) : (
            <div className="relative">
              {/* Starburst decoration */}
              <div className="absolute -top-4 -right-4 z-20">
                <div className="retro-starburst" style={{ backgroundColor: secondaryColor }}>
                  <span>WOW!</span>
                </div>
              </div>

              <div className="retro-card p-8 text-center">
                {/* Corner decorations */}
                <div className="retro-corner retro-corner-tl" style={{ borderColor: primaryColor }}></div>
                <div className="retro-corner retro-corner-tr" style={{ borderColor: primaryColor }}></div>
                <div className="retro-corner retro-corner-bl" style={{ borderColor: primaryColor }}></div>
                <div className="retro-corner retro-corner-br" style={{ borderColor: primaryColor }}></div>

                {/* Badge */}
                <div className="flex justify-center mb-6">
                  <div className="retro-badge" style={{ backgroundColor: primaryColor }}>
                    <span>MATCH<br/>FOUND!</span>
                  </div>
                </div>

                <h2 className="retro-title text-3xl mb-4" style={{ color: primaryColor }}>
                  {alreadyAssigned ? 'YOUR ASSIGNMENT' : 'CONGRATULATIONS!'}
                </h2>

                {!alreadyAssigned && (
                  <p className="retro-body mb-6">
                    Your Secret Santa recipient has been revealed!
                  </p>
                )}

                <div className="retro-result p-6 mb-6 relative z-10" style={{ backgroundColor: secondaryColor }}>
                  <p className="text-sm uppercase tracking-widest mb-2 opacity-80">You are Secret Santa for</p>
                  <p className="retro-title text-4xl text-[#f5f1e8]">
                    {assignment.toUpperCase()}
                  </p>
                </div>

                <div className="retro-info p-4 mb-6">
                  <p className="text-sm flex items-center justify-center gap-2">
                    <span>📧</span>
                    <span>Email confirmation sent to you</span>
                  </p>
                </div>

                <div className="retro-divider mb-6">
                  <span className="retro-star text-xl" style={{ color: primaryColor }}>★</span>
                </div>

                <div className="text-left space-y-3 retro-body text-base">
                  <p className="flex items-start gap-3">
                    <span className="text-xl">🤫</span>
                    <span>Keep this a secret until the gift exchange!</span>
                  </p>
                  <p className="flex items-start gap-3">
                    <span className="text-xl">🎁</span>
                    <span>Choose a thoughtful gift that brings joy.</span>
                  </p>
                  <p className="flex items-start gap-3">
                    <span className="text-xl">🎉</span>
                    <span>Happy holidays and have fun!</span>
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Bottom decoration - Christmas icons */}
          <div className="flex justify-center items-center gap-4 mt-10">
            <span className="retro-star text-2xl" style={{ color: primaryColor }}>★</span>
            <span className="text-4xl gift-bounce">🎁</span>
            <span className="retro-star text-xl" style={{ color: secondaryColor }}>★</span>
            <span className="text-4xl gift-bounce" style={{ animationDelay: '0.15s' }}>🎄</span>
            <span className="retro-star text-2xl" style={{ color: primaryColor }}>★</span>
            <span className="text-4xl gift-bounce" style={{ animationDelay: '0.3s' }}>🎅</span>
            <span className="retro-star text-xl" style={{ color: secondaryColor }}>★</span>
            <span className="text-4xl gift-bounce" style={{ animationDelay: '0.45s' }}>⛄</span>
            <span className="retro-star text-2xl" style={{ color: primaryColor }}>★</span>
          </div>

          {/* Tagline */}
          <p className="text-center text-[#f5f1e8] text-base mt-6 tracking-wider font-semibold"
             style={{ textShadow: '0 0 20px rgba(255,255,255,0.5), 2px 2px 0 rgba(0,0,0,0.3)' }}>
            ✨ Spread the holiday cheer! ✨
          </p>
        </div>
      </div>
    </div>
  )
}
