import crypto from "crypto";
import {prisma} from "@/lib/prisma";

const RESET_TOKEN_EXPIRY_MINUTES = 30;

function buildIdentifier(email: string) {
  return `password-reset:${email.toLowerCase()}`;
}

export async function createPasswordResetToken(email: string) {
  const normalizedEmail = email.toLowerCase();
  const identifier = buildIdentifier(normalizedEmail);
  const token = crypto.randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + RESET_TOKEN_EXPIRY_MINUTES * 60 * 1000);

  await prisma.verificationToken.deleteMany({where: {identifier}});
  await prisma.verificationToken.create({
    data: {
      identifier,
      token,
      expires,
    },
  });

  return {
    token,
    expires,
  };
}

export async function consumePasswordResetToken(token: string) {
  const existing = await prisma.verificationToken.findUnique({
    where: {token},
    select: {identifier: true, expires: true},
  });

  if (!existing || !existing.identifier.startsWith("password-reset:")) {
    return null;
  }

  if (existing.expires.getTime() < Date.now()) {
    await prisma.verificationToken.delete({where: {token}}).catch(() => null);
    return null;
  }

  await prisma.verificationToken.delete({where: {token}});

  const email = existing.identifier.replace("password-reset:", "");
  return {email};
}
