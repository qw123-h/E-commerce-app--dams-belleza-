import nodemailer from "nodemailer";

type PasswordResetEmailInput = {
  to: string;
  resetUrl: string;
  locale: "en" | "fr";
};

type PasswordResetTemplate = {
  subject: string;
  text: string;
  html: string;
};

function buildPasswordResetTemplate({resetUrl, locale}: Pick<PasswordResetEmailInput, "resetUrl" | "locale">): PasswordResetTemplate {
  const subject = locale === "fr" ? "Reinitialisation de mot de passe" : "Password reset";
  const greeting = locale === "fr" ? "Bonjour" : "Hello";
  const intro =
    locale === "fr"
      ? "Vous avez demande la reinitialisation de votre mot de passe. Cliquez sur le bouton ci-dessous pour continuer."
      : "You requested a password reset. Click the button below to continue.";
  const buttonLabel = locale === "fr" ? "Reinitialiser le mot de passe" : "Reset password";
  const fallbackText = locale === "fr" ? "Copiez ce lien dans votre navigateur" : "Copy this link into your browser";

  return {
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
  };
}

async function sendViaResend({to, resetUrl, locale}: PasswordResetEmailInput) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM || process.env.SMTP_FROM || process.env.SMTP_USER;

  if (!apiKey) {
    return false;
  }

  if (!from) {
    throw new Error("RESEND_FROM is not configured");
  }

  const template = buildPasswordResetTemplate({resetUrl, locale});

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to,
      subject: template.subject,
      html: template.html,
      text: template.text,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "");
    throw new Error(`Resend API request failed (${response.status}): ${errorBody}`);
  }

  return true;
}

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
  const sentViaResend = await sendViaResend({to, resetUrl, locale});
  if (sentViaResend) {
    return;
  }

  const transport = getSmtpTransport();

  if (!transport) {
    throw new Error("Neither RESEND_API_KEY nor SMTP settings are configured");
  }

  const from = process.env.SMTP_FROM || process.env.SMTP_USER;
  if (!from) {
    throw new Error("SMTP_FROM is not configured");
  }

  const template = buildPasswordResetTemplate({resetUrl, locale});

  await transport.sendMail({
    from,
    to,
    subject: template.subject,
    text: template.text,
    html: template.html,
  });
}