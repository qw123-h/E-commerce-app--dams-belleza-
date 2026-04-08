import {NextResponse} from "next/server";
import {z} from "zod";
import {prisma} from "@/lib/prisma";
import {createPasswordResetToken} from "@/lib/password-reset";
import {sendPasswordResetEmail} from "@/lib/mailer";

const forgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = forgotPasswordSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({message: "Invalid email"}, {status: 400});
  }

  const email = parsed.data.email;
  const user = await prisma.user.findUnique({
    where: {email},
    select: {id: true},
  });

  if (!user) {
    return NextResponse.json({message: "If the account exists, a reset link has been generated"});
  }

  const {token} = await createPasswordResetToken(email);

  const locale = request.headers.get("x-user-locale") === "en" ? "en" : "fr";
  const origin = process.env.NEXTAUTH_URL?.replace(/\/$/, "") ?? new URL(request.url).origin;
  const resetUrl = `${origin}/${locale}/auth/reset-password?token=${encodeURIComponent(token)}`;

  try {
    await sendPasswordResetEmail({to: email, resetUrl, locale});
  } catch (error) {
    if (process.env.NODE_ENV !== "development") {
      const message = error instanceof Error ? error.message : "Failed to send reset email";
      return NextResponse.json({message}, {status: 500});
    }
  }

  return NextResponse.json({
    message: "If the account exists, a reset link has been generated",
    resetUrl: process.env.NODE_ENV === "development" ? resetUrl : undefined,
  });
}
