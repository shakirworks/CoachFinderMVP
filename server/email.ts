import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: parseInt(process.env.SMTP_PORT || "587") === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendVerificationCode(
  to: string,
  code: string,
  role: "athlete" | "coach"
): Promise<void> {
  const roleLabel = role === "athlete" ? "Athlete" : "Coach";

  await transporter.sendMail({
    from: `"CoachFinders" <${process.env.SMTP_USER || "support@coachfinders.ca"}>`,
    to,
    subject: "noreply - Your CoachFinders Verification Code",
    html: `
      <div style="font-family: 'Inter', Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #ffffff; border-radius: 8px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #1a1a1a; font-size: 24px; font-weight: 600; margin: 0;">CoachFinders</h1>
          <p style="color: #666; font-size: 14px; margin-top: 4px;">Premium Athletic Coaching Platform</p>
        </div>
        <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
        <p style="color: #333; font-size: 16px; line-height: 1.5;">
          Hello,
        </p>
        <p style="color: #333; font-size: 16px; line-height: 1.5;">
          You're signing in to your <strong>${roleLabel}</strong> account. Please use the verification code below to complete your sign-in:
        </p>
        <div style="text-align: center; margin: 32px 0;">
          <div style="display: inline-block; background: #f5f5f5; padding: 16px 32px; border-radius: 8px; letter-spacing: 8px; font-size: 32px; font-weight: 700; color: #1a1a1a;">
            ${code}
          </div>
        </div>
        <p style="color: #666; font-size: 14px; line-height: 1.5;">
          This code expires in <strong>10 minutes</strong>. If you did not request this code, you can safely ignore this email.
        </p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
        <p style="color: #999; font-size: 12px; text-align: center;">
          &copy; ${new Date().getFullYear()} CoachFinders. All rights reserved.<br />
          support@coachfinders.ca
        </p>
      </div>
    `,
    text: `Your CoachFinders verification code is: ${code}\n\nThis code expires in 10 minutes. If you did not request this code, you can safely ignore this email.\n\n- CoachFinders Team`,
  });
}

export async function sendWelcomeVerification(
  to: string,
  verificationLink: string,
  role: "athlete" | "coach"
): Promise<void> {
  const roleLabel = role === "athlete" ? "Athlete" : "Coach";

  console.log(`[Email] Sending welcome verification to: ${to}, link: ${verificationLink}`);
  console.log(`[Email] SMTP config - host: ${process.env.SMTP_HOST}, port: ${process.env.SMTP_PORT}, user: ${process.env.SMTP_USER}`);

  const result = await transporter.sendMail({
    from: `"CoachFinders" <${process.env.SMTP_USER || "support@coachfinders.ca"}>`,
    to,
    subject: "Welcome to CoachFinders - Verify Your Email",
    html: `
      <div style="font-family: 'Inter', Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #ffffff; border-radius: 8px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #1a1a1a; font-size: 24px; font-weight: 600; margin: 0;">CoachFinders</h1>
          <p style="color: #666; font-size: 14px; margin-top: 4px;">Premium Athletic Coaching Platform</p>
        </div>
        <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
        <p style="color: #333; font-size: 16px; line-height: 1.5;">
          Welcome to CoachFinders!
        </p>
        <p style="color: #333; font-size: 16px; line-height: 1.5;">
          Thank you for signing up as ${role === "athlete" ? "an" : "a"} <strong>${roleLabel}</strong>. To complete your registration, please verify your email address by clicking the button below:
        </p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${verificationLink}" style="display: inline-block; background: #7c2d3c; color: #ffffff; padding: 14px 32px; border-radius: 8px; font-size: 16px; font-weight: 600; text-decoration: none;">
            Verify My Email
          </a>
        </div>
        <p style="color: #666; font-size: 14px; line-height: 1.5;">
          Or copy and paste this link into your browser:
        </p>
        <p style="color: #7c2d3c; font-size: 13px; line-height: 1.5; word-break: break-all;">
          ${verificationLink}
        </p>
        <p style="color: #666; font-size: 14px; line-height: 1.5;">
          This link expires in <strong>24 hours</strong>. If you did not create an account, you can safely ignore this email.
        </p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
        <p style="color: #999; font-size: 12px; text-align: center;">
          &copy; ${new Date().getFullYear()} CoachFinders. All rights reserved.<br />
          support@coachfinders.ca
        </p>
      </div>
    `,
    text: `Welcome to CoachFinders!\n\nThank you for signing up as ${role === "athlete" ? "an" : "a"} ${roleLabel}. Please verify your email by visiting: ${verificationLink}\n\nThis link expires in 24 hours. If you did not create an account, you can safely ignore this email.\n\n- CoachFinders Team`,
  });

  console.log(`[Email] Welcome verification sent successfully to: ${to}, messageId: ${result.messageId}, response: ${result.response}`);
}

export async function sendPasswordResetEmail(
  to: string,
  resetLink: string,
  role: "athlete" | "coach"
): Promise<void> {
  const roleLabel = role === "athlete" ? "Athlete" : "Coach";

  await transporter.sendMail({
    from: `"CoachFinders" <${process.env.SMTP_USER || "support@coachfinders.ca"}>`,
    to,
    subject: "Reset Your CoachFinders Password",
    html: `
      <div style="font-family: 'Inter', Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #ffffff; border-radius: 8px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #1a1a1a; font-size: 24px; font-weight: 600; margin: 0;">CoachFinders</h1>
          <p style="color: #666; font-size: 14px; margin-top: 4px;">Premium Athletic Coaching Platform</p>
        </div>
        <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
        <p style="color: #333; font-size: 16px; line-height: 1.5;">Hello,</p>
        <p style="color: #333; font-size: 16px; line-height: 1.5;">
          We received a request to reset the password for your <strong>${roleLabel}</strong> account. Click the button below to choose a new password:
        </p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${resetLink}" style="display: inline-block; background: #2d6a4f; color: #ffffff; padding: 14px 32px; border-radius: 8px; font-size: 16px; font-weight: 600; text-decoration: none;">
            Reset My Password
          </a>
        </div>
        <p style="color: #666; font-size: 14px; line-height: 1.5;">
          Or copy and paste this link into your browser:
        </p>
        <p style="color: #2d6a4f; font-size: 13px; line-height: 1.5; word-break: break-all;">
          ${resetLink}
        </p>
        <p style="color: #666; font-size: 14px; line-height: 1.5;">
          This link expires in <strong>1 hour</strong>. If you did not request a password reset, you can safely ignore this email — your password will not be changed.
        </p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
        <p style="color: #999; font-size: 12px; text-align: center;">
          &copy; ${new Date().getFullYear()} CoachFinders. All rights reserved.<br />
          support@coachfinders.ca
        </p>
      </div>
    `,
    text: `Reset Your CoachFinders Password\n\nWe received a request to reset your password. Visit the link below to set a new password:\n\n${resetLink}\n\nThis link expires in 1 hour. If you did not request this, you can safely ignore this email.\n\n- CoachFinders Team`,
  });
}
