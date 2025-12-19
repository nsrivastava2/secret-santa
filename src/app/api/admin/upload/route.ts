import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { isUserAdmin } from '@/lib/organization'
import * as XLSX from 'xlsx'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user || !session.user.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin using organization settings
    const admin = await isUserAdmin(session.user.email)
    if (!admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const formData = await req.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    // Read Excel file
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const workbook = XLSX.read(buffer, { type: 'buffer' })
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]
    const data = XLSX.utils.sheet_to_json(worksheet) as Array<{
      name: string
      email: string
    }>

    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: 'No data found in Excel file' },
        { status: 400 }
      )
    }

    // Validate data - accept any valid email format
    const validData = data.filter((row) => {
      return (
        row.name &&
        row.email &&
        typeof row.name === 'string' &&
        typeof row.email === 'string' &&
        row.email.includes('@') // Basic email validation
      )
    })

    if (validData.length === 0) {
      return NextResponse.json(
        { error: 'No valid data found. Ensure columns are named "name" and "email"' },
        { status: 400 }
      )
    }

    // Deactivate all existing members
    await prisma.teamMember.updateMany({
      data: { isActive: false },
    })

    // Insert or update team members
    const results = await Promise.all(
      validData.map(async (member) => {
        return prisma.teamMember.upsert({
          where: { email: member.email },
          update: {
            name: member.name,
            isActive: true,
          },
          create: {
            name: member.name,
            email: member.email,
            isActive: true,
          },
        })
      })
    )

    return NextResponse.json({
      success: true,
      count: results.length,
      members: results,
    })
  } catch (error) {
    console.error('Error uploading team members:', error)
    return NextResponse.json(
      { error: 'Failed to process Excel file' },
      { status: 500 }
    )
  }
}
