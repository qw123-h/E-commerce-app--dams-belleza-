import nodemailer from "nodemailer";

type PasswordResetEmailInput = {
  to: string;
  resetUrl: string;
  locale: "en" | "fr";
};

function getSmtpTransport() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || "587");
  const user = process.env.SMTP_USER;
  const password = process.env.SMTP_PASSWORD;

  if (!host || !user || !password) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: String(process.env.SMTP_SECURE || "false").toLowerCase() === "true",
    auth: {
      user,
      pass: password,
    },
  });
}

export async function sendPasswordResetEmail({to, resetUrl, locale}: PasswordResetEmailInput) {
  const transport = getSmtpTransport();

  if (!transport) {
    throw new Error("SMTP is not configured");
  }

  const from = process.env.SMTP_FROM || process.env.SMTP_USER;
  if (!from) {
    throw new Error("SMTP_FROM is not configured");
  }

  const subject = locale === "fr" ? "Reinitialisation de mot de passe" : "Password reset";
  const greeting = locale === "fr" ? "Bonjour" : "Hello";
  const intro =
    locale === "fr"
      ? "Vous avez demande la reinitialisation de votre mot de passe. Cliquez sur le bouton ci-dessous pour continuer."
      : "You requested a password reset. Click the button below to continue.";
  const buttonLabel = locale === "fr" ? "Reinitialiser le mot de passe" : "Reset password";
  const fallbackText = locale === "fr" ? "Copiez ce lien dans votre navigateur" : "Copy this link into your browser";

  await transport.sendMail({
    from,
    to,
    subject,
    text: `${greeting},\n\n${intro}\n\n${fallbackText}: ${resetUrl}\n\nDam's belleza`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f1714;">
        <p>${greeting},</p>
        <p>${intro}</p>
        <p>
          <a href="${resetUrl}" style="display:inline-block;background:#1f1714;color:#fff;padding:12px 20px;border-radius:999px;text-decoration:none;font-weight:600;">
            ${buttonLabel}
          </a>
        </p>
        <p style="word-break:break-all;">${resetUrl}</p>
        <p>Dam's belleza</p>
      </div>
    `,
  });
}