import nodemailer from 'nodemailer'
import { getSettings } from './organization'

interface SendAssignmentEmailParams {
  giverName: string
  giverEmail: string
  receiverName: string
}

export async function sendAssignmentEmail({
  giverName,
  giverEmail,
  receiverName,
}: SendAssignmentEmailParams) {
  const settings = await getSettings()

  // Create transporter with SMTP settings
  const transporter = nodemailer.createTransport({
    host: settings.smtpHost || process.env.EMAIL_SERVER,
    port: settings.smtpPort || parseInt(process.env.EMAIL_PORT || '587'),
    secure: settings.smtpSecure,
    auth: {
      user: settings.smtpUser || process.env.EMAIL_USER,
      pass: settings.smtpPassword || process.env.EMAIL_PASSWORD,
    },
  })

  const fromEmail = settings.emailFrom || process.env.EMAIL_FROM
  const fromName = settings.emailFromName || 'Secret Santa'
  const hrEmail = settings.hrEmail || process.env.HR_EMAIL

  const userEmailHtml = `
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
          .gift-box {
            text-align: center;
            font-size: 48px;
            margin: 20px 0;
          }
          .receiver-name {
            color: ${settings.secondaryColor};
            font-size: 24px;
            font-weight: bold;
            text-align: center;
            margin: 20px 0;
            padding: 15px;
            background-color: #FFFAFA;
            border-radius: 5px;
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
          <div class="header">Psst... The Elves Have Chosen You!</div>
          <div class="content">
            <p>Ho Ho Ho, ${giverName}!</p>
            <p>The Christmas magic has spoken! You've been selected to be a Secret Santa for:</p>
            <div class="gift-box">🎁</div>
            <div class="receiver-name">${receiverName}</div>
            <p>Remember to keep it a secret!</p>
            <p>May your gift bring joy and Christmas cheer to your colleague!</p>
            <p>Happy Holidays!</p>
          </div>
          <div class="footer">
            <p>${settings.emailFooter}</p>
            ${hrEmail ? `<p>Questions? Contact ${hrEmail}</p>` : ''}
          </div>
        </div>
      </body>
    </html>
  `

  const hrEmailHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            padding: 20px;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
          }
          table {
            width: 100%;
            border-collapse: collapse;
          }
          th, td {
            padding: 12px;
            text-align: left;
            border: 1px solid #ddd;
          }
          th {
            background-color: ${settings.primaryColor};
            color: white;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h2>Secret Santa Assignment Notification</h2>
          <table>
            <tr>
              <th>Giver</th>
              <td>${giverName}</td>
            </tr>
            <tr>
              <th>Giver Email</th>
              <td>${giverEmail}</td>
            </tr>
            <tr>
              <th>Receiver</th>
              <td>${receiverName}</td>
            </tr>
            <tr>
              <th>Assigned At</th>
              <td>${new Date().toLocaleString()}</td>
            </tr>
          </table>
        </div>
      </body>
    </html>
  `

  // Send email to the giver
  await transporter.sendMail({
    from: `"${fromName}" <${fromEmail}>`,
    to: giverEmail,
    subject: settings.emailSubject || 'Your Secret Santa Assignment!',
    html: userEmailHtml,
  })

  // Send notification to HR if configured
  if (hrEmail) {
    await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to: hrEmail,
      subject: `Secret Santa Assignment: ${giverName} → ${receiverName}`,
      html: hrEmailHtml,
    })
  }
}
