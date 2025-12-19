import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { sendAssignmentEmail } from '@/lib/email'

export async function POST(req: NextRequest) {
  try {
    // Check if user is authenticated
    const session = await getServerSession(authOptions)

    if (!session || !session.user || !session.user.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const userEmail = session.user.email

    // Check if user is in the team members list
    const teamMember = await prisma.teamMember.findUnique({
      where: { email: userEmail },
    })

    if (!teamMember || !teamMember.isActive) {
      return NextResponse.json(
        { error: 'You are not authorized to participate in Secret Santa' },
        { status: 403 }
      )
    }

    // Check if user already has an assignment
    const existingAssignment = await prisma.assignment.findUnique({
      where: { giverId: teamMember.id },
      include: { receiver: true },
    })

    if (existingAssignment) {
      return NextResponse.json({
        success: true,
        alreadyAssigned: true,
        receiver: existingAssignment.receiver.name,
      })
    }

    // Get all team members who are not already assigned
    const allMembers = await prisma.teamMember.findMany({
      where: { isActive: true },
    })

    const assignments = await prisma.assignment.findMany({
      select: { receiverId: true },
    })

    const assignedReceiverIds = new Set(assignments.map(a => a.receiverId))

    // Filter out members who are already receivers or the current user
    const availableMembers = allMembers.filter(
      (member) =>
        !assignedReceiverIds.has(member.id) &&
        member.id !== teamMember.id
    )

    if (availableMembers.length === 0) {
      return NextResponse.json(
        { error: 'No available team members to assign' },
        { status: 400 }
      )
    }

    // Randomly select a receiver
    const randomIndex = Math.floor(Math.random() * availableMembers.length)
    const receiver = availableMembers[randomIndex]

    // Create assignment in database
    const assignment = await prisma.assignment.create({
      data: {
        giverId: teamMember.id,
        receiverId: receiver.id,
        emailSent: false,
      },
      include: {
        receiver: true,
      },
    })

    // Send emails
    try {
      await sendAssignmentEmail({
        giverName: teamMember.name,
        giverEmail: teamMember.email,
        receiverName: receiver.name,
      })

      // Update assignment to mark email as sent
      await prisma.assignment.update({
        where: { id: assignment.id },
        data: { emailSent: true },
      })
    } catch (emailError) {
      console.error('Failed to send email:', emailError)
      // Assignment is still created, just email failed
    }

    return NextResponse.json({
      success: true,
      receiver: receiver.name,
    })
  } catch (error) {
    console.error('Error assigning Secret Santa:', error)
    return NextResponse.json(
      { error: 'An error occurred while assigning Secret Santa' },
      { status: 500 }
    )
  }
}
