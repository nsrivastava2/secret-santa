import { prisma } from "./db"
import { Settings } from "@prisma/client"

const SETTINGS_ID = "singleton"

// Get the application settings (creates default if none exists)
export async function getSettings(): Promise<Settings> {
  let settings = await prisma.settings.findUnique({
    where: { id: SETTINGS_ID }
  })

  if (!settings) {
    // Create default settings on first access
    settings = await prisma.settings.create({
      data: {
        id: SETTINGS_ID,
        organizationName: "My Organization",
      },
    })
  }

  return settings
}

// Update application settings
export async function updateSettings(
  data: Partial<Omit<Settings, "id" | "createdAt" | "updatedAt">>
): Promise<Settings> {
  // Ensure settings exist
  await getSettings()

  return prisma.settings.update({
    where: { id: SETTINGS_ID },
    data,
  })
}

// Check if user is an admin based on settings
export async function isUserAdmin(email: string | null | undefined): Promise<boolean> {
  if (!email) return false

  const settings = await getSettings()
  const adminEmails = settings.adminEmails
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter((e) => e.length > 0)

  // First user becomes admin if no admins configured yet
  if (adminEmails.length === 0) {
    return true
  }

  return adminEmails.includes(email.toLowerCase())
}

// Check if setup is complete
export async function isSetupComplete(): Promise<boolean> {
  const settings = await getSettings()
  return settings.setupComplete
}

// Get public settings (safe to expose to frontend)
export async function getPublicSettings() {
  const settings = await getSettings()

  return {
    name: settings.organizationName,
    logoUrl: settings.logoUrl,
    primaryColor: settings.primaryColor,
    secondaryColor: settings.secondaryColor,
    homepageTitle: settings.homepageTitle,
    homepageMessage: settings.homepageMessage,
    googleEnabled: settings.googleEnabled,
    microsoftEnabled: settings.microsoftEnabled,
    setupComplete: settings.setupComplete,
  }
}

// Legacy alias for backward compatibility
export const getOrganization = getSettings
export const updateOrganization = updateSettings
