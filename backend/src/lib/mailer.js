import nodemailer from "nodemailer";

/**
 * Email service for sending moderation notifications
 * Configured via SMTP environment variables
 */

let transporter = null;

function initTransporter() {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    console.warn(
      "⚠️  Email service not configured. Set SMTP_HOST, SMTP_USER, SMTP_PASS in .env"
    );
    return null;
  }

  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // TLS for 465, STARTTLS for 587
    auth: { user, pass },
  });

  return transporter;
}

/**
 * Send moderation removal notification email
 * @param {Object} params
 * @param {string} params.to - User's email address
 * @param {string} params.username - User's username
 * @param {string} params.targetType - "post" or "comment"
 * @param {string} params.reason - Why it was removed (optional)
 */
export async function sendModerationRemovalEmail({
  to,
  username,
  targetType,
  reason = "Community guidelines violation",
}) {
  const transporter = initTransporter();
  if (!transporter) return; // Email not configured, skip silently

  try {
    const mailFrom = process.env.MAIL_FROM || process.env.SMTP_USER || "noreply@spotmies.com";
    const targetLabel = targetType === "post" ? "post" : "comment";

    await transporter.sendMail({
      from: mailFrom,
      to,
      subject: "Content Moderation Notice",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Content Moderation Notice</h2>
          <p>Hello <strong>${username}</strong>,</p>
          <p>
            Your ${targetLabel} on Spotmies has been removed after review by our moderation team.
          </p>
          <p>
            <strong>Reason:</strong> ${reason}
          </p>
          <p>
            We're committed to maintaining a safe and respectful community. 
            If you believe this action was taken in error, please review our 
            <a href="https://spotmies.com/community-guidelines">Community Guidelines</a>.
          </p>
          <p>
            Thank you for being part of our community.<br/>
            <strong>The Spotmies Team</strong>
          </p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="color: #999; font-size: 12px;">
            This is an automated notification. Please don't reply to this email.
          </p>
        </div>
      `,
      text: `
Hello ${username},

Your ${targetLabel} on Spotmies has been removed after review by our moderation team.

Reason: ${reason}

We're committed to maintaining a safe and respectful community. If you believe this action was taken in error, please review our Community Guidelines.

Thank you for being part of our community.
The Spotmies Team
      `.trim(),
    });

    console.log(`✅ Moderation removal email sent to ${to}`);
  } catch (error) {
    console.error(`❌ Failed to send moderation email to ${to}:`, error.message);
    // Don't throw - email failure shouldn't block the removal action
  }
}
