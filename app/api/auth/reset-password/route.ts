import {NextResponse} from "next/server";
import bcrypt from "bcryptjs";
import {z} from "zod";
import {prisma} from "@/lib/prisma";
import {consumePasswordResetToken} from "@/lib/password-reset";

const resetPasswordSchema = z.object({
  token: z.string().min(20),
  password: z.string().trim().min(8).max(128),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = resetPasswordSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({message: "Invalid reset request"}, {status: 400});
  }

  const tokenData = await consumePasswordResetToken(parsed.data.token);

  if (!tokenData) {
    return NextResponse.json({message: "Reset token is invalid or expired"}, {status: 400});
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);

  await prisma.user.update({
    where: {email: tokenData.email},
    data: {passwordHash},
  });

  return NextResponse.json({message: "Password updated successfully"});
}
