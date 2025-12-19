import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { isUserAdmin, getSettings } from "@/lib/organization"
import nodemailer from "nodemailer"

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
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: "Email address required" }, { status: 400 })
    }

    const settings = await getSettings()

    if (!settings.smtpHost || !settings.smtpUser || !settings.smtpPassword) {
      return NextResponse.json(
        { error: "SMTP settings not configured. Please save your email settings first." },
        { status: 400 }
      )
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
              font-size: 24px;
              font-weight: bold;
              margin-bottom: 20px;
            }
            .content {
              color: #333;
              font-size: 16px;
              line-height: 1.6;
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
            <div class="header">Test Email from ${settings.organizationName}</div>
            <div class="content">
              <p>Hello!</p>
              <p>This is a test email from your Secret Santa application.</p>
              <p>If you received this email, your SMTP settings are configured correctly!</p>
              <p>Settings used:</p>
              <ul>
                <li>SMTP Host: ${settings.smtpHost}</li>
                <li>SMTP Port: ${settings.smtpPort}</li>
                <li>From: ${settings.emailFromName} &lt;${settings.emailFrom}&gt;</li>
              </ul>
            </div>
            <div class="footer">
              <p>${settings.emailFooter}</p>
            </div>
          </div>
        </body>
      </html>
    `

    await transporter.sendMail({
      from: `"${settings.emailFromName}" <${settings.emailFrom}>`,
      to: email,
      subject: `Test Email - ${settings.organizationName} Secret Santa`,
      html,
    })

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    console.error("Error sending test email:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to send test email" },
      { status: 500 }
    )
  }
}
