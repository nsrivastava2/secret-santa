import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getSettings, updateSettings, isUserAdmin, getPublicSettings } from "@/lib/organization"

// GET - Get settings (public settings for unauthenticated, full for admins)
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)

  // Check if requesting public settings only
  const { searchParams } = new URL(request.url)
  const publicOnly = searchParams.get("public") === "true"

  if (publicOnly || !session?.user) {
    const publicSettings = await getPublicSettings()
    return NextResponse.json(publicSettings)
  }

  // For authenticated users, check if admin
  const admin = await isUserAdmin(session.user.email)

  if (!admin) {
    const publicSettings = await getPublicSettings()
    return NextResponse.json(publicSettings)
  }

  // Admin gets full settings
  const settings = await getSettings()

  // Don't expose SMTP password in response
  return NextResponse.json({
    ...settings,
    name: settings.organizationName, // Alias for frontend compatibility
    smtpPassword: settings.smtpPassword ? "********" : null,
  })
}

// PUT - Update settings (admin only)
export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const admin = await isUserAdmin(session.user.email)

  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const data = await request.json()

    // Validate and sanitize input
    const updateData: Record<string, unknown> = {}

    // Basic Info
    if (data.name !== undefined) updateData.organizationName = String(data.name).slice(0, 100)
    if (data.organizationName !== undefined) updateData.organizationName = String(data.organizationName).slice(0, 100)

    // Branding
    if (data.logoUrl !== undefined) updateData.logoUrl = data.logoUrl ? String(data.logoUrl).slice(0, 500) : null
    if (data.primaryColor !== undefined) updateData.primaryColor = String(data.primaryColor).slice(0, 20)
    if (data.secondaryColor !== undefined) updateData.secondaryColor = String(data.secondaryColor).slice(0, 20)
    if (data.homepageTitle !== undefined) updateData.homepageTitle = String(data.homepageTitle).slice(0, 100)
    if (data.homepageMessage !== undefined) updateData.homepageMessage = String(data.homepageMessage).slice(0, 500)

    // Email Settings
    if (data.smtpHost !== undefined) updateData.smtpHost = String(data.smtpHost).slice(0, 100)
    if (data.smtpPort !== undefined) updateData.smtpPort = Math.min(65535, Math.max(1, parseInt(data.smtpPort) || 587))
    if (data.smtpUser !== undefined) updateData.smtpUser = data.smtpUser ? String(data.smtpUser).slice(0, 200) : null
    if (data.smtpPassword !== undefined && data.smtpPassword !== "********") {
      updateData.smtpPassword = data.smtpPassword ? String(data.smtpPassword).slice(0, 200) : null
    }
    if (data.smtpSecure !== undefined) updateData.smtpSecure = Boolean(data.smtpSecure)
    if (data.emailFrom !== undefined) updateData.emailFrom = data.emailFrom ? String(data.emailFrom).slice(0, 200) : null
    if (data.emailFromName !== undefined) updateData.emailFromName = String(data.emailFromName).slice(0, 100)

    // Notification Settings
    if (data.hrEmail !== undefined) updateData.hrEmail = data.hrEmail ? String(data.hrEmail).slice(0, 200) : null

    // Email Template Customization
    if (data.emailSubject !== undefined) updateData.emailSubject = String(data.emailSubject).slice(0, 200)
    if (data.emailFooter !== undefined) updateData.emailFooter = String(data.emailFooter).slice(0, 500)

    // Admin Settings
    if (data.adminEmails !== undefined) updateData.adminEmails = String(data.adminEmails).slice(0, 1000)

    // Auth Settings
    if (data.googleEnabled !== undefined) updateData.googleEnabled = Boolean(data.googleEnabled)
    if (data.microsoftEnabled !== undefined) updateData.microsoftEnabled = Boolean(data.microsoftEnabled)

    // Setup Status
    if (data.setupComplete !== undefined) updateData.setupComplete = Boolean(data.setupComplete)

    const settings = await updateSettings(updateData as Parameters<typeof updateSettings>[0])

    return NextResponse.json({
      success: true,
      organization: {
        ...settings,
        name: settings.organizationName,
        smtpPassword: settings.smtpPassword ? "********" : null,
      },
    })
  } catch (error: unknown) {
    console.error("Error updating settings:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update settings" },
      { status: 500 }
    )
  }
}
