import {NextResponse} from "next/server";
import bcrypt from "bcryptjs";
import {UserStatus} from "@prisma/client";
import {z} from "zod";
import {prisma} from "@/lib/prisma";

const registerSchema = z.object({
  firstName: z.string().trim().min(2).max(60),
  lastName: z.string().trim().min(2).max(60),
  email: z.string().trim().toLowerCase().email(),
  password: z.string().trim().min(8).max(128),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = registerSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({message: "Invalid registration payload"}, {status: 400});
  }

  const email = parsed.data.email;

  const existing = await prisma.user.findUnique({
    where: {email},
    select: {id: true},
  });

  if (existing) {
    return NextResponse.json({message: "An account already exists with this email"}, {status: 409});
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);

  await prisma.user.create({
    data: {
      email,
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName,
      passwordHash,
      status: UserStatus.ACTIVE,
    },
  });

  return NextResponse.json({message: "Account created successfully"}, {status: 201});
}
