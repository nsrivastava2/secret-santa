import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { isUserAdmin, getSettings } from '@/lib/organization'
import nodemailer from 'nodemailer'

// GET - Get list of team members who haven't picked yet
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user || !session.user.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const admin = await isUserAdmin(session.user.email)
    if (!admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get all active team members
    const allMembers = await prisma.teamMember.findMany({
      where: { isActive: true },
      select: { id: true, name: true, email: true },
    })

    // Get all assignments (givers)
    const assignments = await prisma.assignment.findMany({
      select: { giverId: true },
    })

    const assignedIds = new Set(assignments.map(a => a.giverId))

    // Filter to those who haven't picked
    const pending = allMembers.filter(m => !assignedIds.has(m.id))
    const completed = allMembers.filter(m => assignedIds.has(m.id))

    return NextResponse.json({
      success: true,
      stats: {
        total: allMembers.length,
        completed: completed.length,
        pending: pending.length,
        percentage: allMembers.length > 0
          ? Math.round((completed.length / allMembers.length) * 100)
          : 0,
      },
      pendingMembers: pending,
      completedMembers: completed,
    })
  } catch (error) {
    console.error('Error fetching pending members:', error)
    return NextResponse.json(
      { error: 'Failed to fetch pending members' },
      { status: 500 }
    )
  }
}

// POST - Send reminder emails to pending members
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user || !session.user.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const admin = await isUserAdmin(session.user.email)
    if (!admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const settings = await getSettings()

    if (!settings.smtpHost || !settings.smtpUser || !settings.smtpPassword) {
      return NextResponse.json(
        { error: 'SMTP settings not configured. Please configure email settings first.' },
        { status: 400 }
      )
    }

    const body = await req.json()
    const { memberIds, customMessage } = body

    // Get members to send reminders to
    let membersToRemind
    if (memberIds && memberIds.length > 0) {
      // Specific members selected
      membersToRemind = await prisma.teamMember.findMany({
        where: {
          id: { in: memberIds },
          isActive: true,
        },
      })
    } else {
      // All pending members
      const allMembers = await prisma.teamMember.findMany({
        where: { isActive: true },
      })
      const assignments = await prisma.assignment.findMany({
        select: { giverId: true },
      })
      const assignedIds = new Set(assignments.map(a => a.giverId))
      membersToRemind = allMembers.filter(m => !assignedIds.has(m.id))
    }

    if (membersToRemind.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No pending members to remind',
        sent: 0,
      })
    }

    const transporter = nodemailer.createTransport({
      host: settings.smtpHost,
      port: settings.smtpPort,
      secure: settings.smtpSecure,
      auth: {
        user: settings.smtpUser,
        pass: settings.smtpPassword,
      },
    })

    const fromEmail = settings.emailFrom || settings.smtpUser
    const fromName = settings.emailFromName || 'Secret Santa'

    const results = await Promise.allSettled(
      membersToRemind.map(async (member) => {
        const html = `
          <!DOCTYPE html>
          <html>
            <head>
              <style>
                body {
                  font-family: Arial, sans-serif;
                  background-color: #f4f4f4;
                  padding: 20px;
                }
                .container {
                  background-color: #ffffff;
                  border-radius: 10px;
                  padding: 30px;
                  max-width: 600px;
                  margin: 0 auto;
                  border: 3px solid ${settings.secondaryColor};
                }
                .header {
                  text-align: center;
                  color: ${settings.primaryColor};
                  font-size: 28px;
                  font-weight: bold;
                  margin-bottom: 20px;
                }
                .content {
                  color: #333;
                  font-size: 16px;
                  line-height: 1.6;
                }
                .cta {
                  text-align: center;
                  margin: 30px 0;
                }
                .button {
                  display: inline-block;
                  background-color: ${settings.primaryColor};
                  color: white;
                  padding: 15px 30px;
                  text-decoration: none;
                  border-radius: 5px;
                  font-weight: bold;
                }
                .custom-message {
                  background-color: #f9f9f9;
                  padding: 15px;
                  border-left: 4px solid ${settings.primaryColor};
                  margin: 20px 0;
                  font-style: italic;
                }
                .footer {
                  text-align: center;
                  color: #666;
                  font-size: 14px;
                  margin-top: 30px;
                  padding-top: 20px;
                  border-top: 1px solid #ddd;
                }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">Reminder: Pick Your Secret Santa!</div>
                <div class="content">
                  <p>Hi ${member.name},</p>
                  <p>This is a friendly reminder that you haven't picked your Secret Santa recipient yet!</p>
                  ${customMessage ? `<div class="custom-message">${customMessage}</div>` : ''}
                  <p>Don't miss out on the holiday fun - click the button below to find out who you'll be gifting this season.</p>
                  <div class="cta">
                    <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}" class="button">Pick My Secret Santa</a>
                  </div>
                  <p>Happy Holidays!</p>
                </div>
                <div class="footer">
                  <p>${settings.emailFooter}</p>
                </div>
              </div>
            </body>
          </html>
        `

        await transporter.sendMail({
          from: `"${fromName}" <${fromEmail}>`,
          to: member.email,
          subject: `Reminder: Pick Your Secret Santa! - ${settings.organizationName}`,
          html,
        })

        return member.email
      })
    )

    const successful = results.filter(r => r.status === 'fulfilled').length
    const failed = results.filter(r => r.status === 'rejected').length

    return NextResponse.json({
      success: true,
      message: `Sent ${successful} reminder${successful !== 1 ? 's' : ''}${failed > 0 ? `, ${failed} failed` : ''}`,
      sent: successful,
      failed,
    })
  } catch (error) {
    console.error('Error sending reminders:', error)
    return NextResponse.json(
      { error: 'Failed to send reminders' },
      { status: 500 }
    )
  }
}
