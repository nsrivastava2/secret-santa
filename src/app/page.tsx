'use client'

import { useSession, signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Image from 'next/image'
import Snowfall from '@/components/Snowfall'

interface OrgSettings {
  name: string
  logoUrl: string | null
  primaryColor: string
  secondaryColor: string
  homepageTitle: string
  homepageMessage: string
  googleEnabled: boolean
  microsoftEnabled: boolean
  setupComplete: boolean
}

export default function Home() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [orgSettings, setOrgSettings] = useState<OrgSettings | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Fetch organization settings
    fetch('/api/organization?public=true')
      .then(res => res.json())
      .then(data => {
        setOrgSettings(data)
        setLoading(false)
      })
      .catch(() => {
        setLoading(false)
      })
  }, [])

  useEffect(() => {
    if (session?.user) {
      // Check if setup is complete
      if (orgSettings && !orgSettings.setupComplete) {
        router.push('/setup')
      } else {
        router.push('/dashboard')
      }
    }
  }, [session, orgSettings, router])

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-[#f5f1e8] tracking-widest">Loading...</div>
      </div>
    )
  }

  // Apply custom colors if available
  const primaryColor = orgSettings?.primaryColor || '#165B33'
  const secondaryColor = orgSettings?.secondaryColor || '#C41E3A'

  return (
    <div className="min-h-screen relative flex items-center justify-center p-6 overflow-hidden">
      <Snowfall />

      {/* Custom CSS variables for branding */}
      <style jsx global>{`
        :root {
          --org-primary: ${primaryColor};
          --org-secondary: ${secondaryColor};
        }
      `}</style>

      {/* Top ribbon header with lights */}
      <div className="fixed top-0 left-0 right-0 z-20">
        <div className="retro-header p-3" style={{ backgroundColor: primaryColor }}>
          <div className="flex justify-center items-center gap-4">
            <span className="retro-star text-xl">★</span>
            <span className="retro-star text-lg">★</span>
            {orgSettings?.logoUrl ? (
              <img
                src={orgSettings.logoUrl}
                alt={orgSettings.name}
                className="h-12 w-auto object-contain"
              />
            ) : (
              <span className="text-white text-xl font-bold">{orgSettings?.name || 'Secret Santa'}</span>
            )}
            <span className="retro-star text-lg">★</span>
            <span className="retro-star text-xl">★</span>
          </div>
        </div>
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

      <div className="w-full max-w-md relative z-10 mt-28">
        {/* Starburst decoration */}
        <div className="absolute -top-8 -right-8 z-20">
          <div className="retro-starburst" style={{ backgroundColor: secondaryColor }}>
            <span>HO HO<br/>HO!</span>
          </div>
        </div>

        {/* Second starburst */}
        <div className="absolute -bottom-4 -left-6 z-20">
          <div className="retro-starburst" style={{ width: '70px', height: '70px', fontSize: '0.7rem', animationDirection: 'reverse', backgroundColor: primaryColor }}>
            <span>MERRY<br/>XMAS</span>
          </div>
        </div>

        {/* Main Card */}
        <div className="retro-card p-10 text-center">
          {/* Corner decorations */}
          <div className="retro-corner retro-corner-tl" style={{ borderColor: primaryColor }}></div>
          <div className="retro-corner retro-corner-tr" style={{ borderColor: primaryColor }}></div>
          <div className="retro-corner retro-corner-bl" style={{ borderColor: primaryColor }}></div>
          <div className="retro-corner retro-corner-br" style={{ borderColor: primaryColor }}></div>

          {/* Badge */}
          <div className="flex justify-center mb-6">
            <div className="retro-badge pulse-ring" style={{ backgroundColor: secondaryColor }}>
              <span>CHRISTMAS<br/>2025</span>
            </div>
          </div>

          {/* Title */}
          <h1 className="retro-script text-5xl mb-1">
            Secret
          </h1>
          <h2 className="retro-title text-7xl mb-3" style={{ color: primaryColor }}>
            SANTA
          </h2>

          {/* Ribbon */}
          <div className="mb-8">
            <span className="retro-ribbon" style={{ backgroundColor: secondaryColor }}>
              {orgSettings?.homepageTitle || 'GIFT EXCHANGE'}
            </span>
          </div>

          {/* Divider */}
          <div className="retro-divider mb-6">
            <span className="retro-star text-2xl" style={{ color: primaryColor }}>★</span>
          </div>

          {/* Description */}
          <p className="retro-body mb-8 relative z-10">
            {orgSettings?.homepageMessage || 'Sign in to discover who you\'ll be gifting this holiday season!'}
          </p>

          {/* Sign In Buttons */}
          <div className="space-y-3">
            {/* Google Sign In */}
            {(orgSettings?.googleEnabled ?? true) && (
              <button
                onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
                className="retro-button flex items-center justify-center gap-3 mx-auto relative z-10 w-full"
                style={{ backgroundColor: primaryColor }}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Sign In with Google
              </button>
            )}

            {/* Microsoft Sign In */}
            {orgSettings?.microsoftEnabled && (
              <button
                onClick={() => signIn('azure-ad', { callbackUrl: '/dashboard' })}
                className="retro-button flex items-center justify-center gap-3 mx-auto relative z-10 w-full"
                style={{ backgroundColor: '#0078d4' }}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M11.4 24H0V12.6h11.4V24zM24 24H12.6V12.6H24V24zM11.4 11.4H0V0h11.4v11.4zM24 11.4H12.6V0H24v11.4z"/>
                </svg>
                Sign In with Microsoft
              </button>
            )}
          </div>

          {/* Footer note */}
          <p className="text-sm text-[#4a3728]/70 mt-6 relative z-10">
            {orgSettings?.name ? `${orgSettings.name} Secret Santa` : 'Secure sign-in required'}
          </p>
        </div>

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
  )
}
