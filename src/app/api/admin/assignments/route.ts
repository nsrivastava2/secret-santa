import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { isUserAdmin } from '@/lib/organization'
import * as XLSX from 'xlsx'

export async function GET(req: NextRequest) {
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

    const { searchParams } = new URL(req.url)
    const format = searchParams.get('format')

    // Fetch all assignments with giver and receiver details
    const assignments = await prisma.assignment.findMany({
      include: {
        giver: true,
        receiver: true,
      },
      orderBy: {
        assignedAt: 'desc',
      },
    })

    // If Excel download requested
    if (format === 'excel') {
      const data = assignments.map((assignment) => ({
        'Giver Name': assignment.giver.name,
        'Giver Email': assignment.giver.email,
        'Receiver Name': assignment.receiver.name,
        'Receiver Email': assignment.receiver.email,
        'Assigned At': new Date(assignment.assignedAt).toLocaleString(),
        'Email Sent': assignment.emailSent ? 'Yes' : 'No',
      }))

      const worksheet = XLSX.utils.json_to_sheet(data)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Assignments')

      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })

      return new NextResponse(buffer, {
        headers: {
          'Content-Type':
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="secret-santa-assignments-${new Date().toISOString().split('T')[0]}.xlsx"`,
        },
      })
    }

    // Return JSON for web display
    return NextResponse.json({
      success: true,
      count: assignments.length,
      assignments: assignments.map((assignment) => ({
        id: assignment.id,
        giver: {
          name: assignment.giver.name,
          email: assignment.giver.email,
        },
        receiver: {
          name: assignment.receiver.name,
          email: assignment.receiver.email,
        },
        assignedAt: assignment.assignedAt,
        emailSent: assignment.emailSent,
      })),
    })
  } catch (error) {
    console.error('Error fetching assignments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch assignments' },
      { status: 500 }
    )
  }
}
