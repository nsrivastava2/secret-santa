import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { isUserAdmin, updateSettings } from "@/lib/organization"
import { writeFile, mkdir } from "fs/promises"
import path from "path"

const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/svg+xml", "image/webp"]
const MAX_SIZE = 2 * 1024 * 1024 // 2MB

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const admin = await isUserAdmin(session.user.email)

  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get("logo") as File | null

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Allowed: PNG, JPEG, SVG, WebP" },
        { status: 400 }
      )
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "File too large. Maximum size: 2MB" },
        { status: 400 }
      )
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), "public", "uploads")
    await mkdir(uploadsDir, { recursive: true })

    // Generate filename with timestamp
    const ext = file.name.split(".").pop() || "png"
    const filename = `logo-${Date.now()}.${ext}`
    const filepath = path.join(uploadsDir, filename)

    // Write file
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filepath, buffer)

    // Update settings with logo URL
    const logoUrl = `/uploads/${filename}`
    await updateSettings({ logoUrl })

    return NextResponse.json({
      success: true,
      logoUrl,
    })
  } catch (error: unknown) {
    console.error("Error uploading logo:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to upload logo" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const admin = await isUserAdmin(session.user.email)

  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    await updateSettings({ logoUrl: null })

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    console.error("Error removing logo:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to remove logo" },
      { status: 500 }
    )
  }
}
