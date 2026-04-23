import "dotenv/config";
import {bootstrapSuperAdmin} from "@/lib/role-management";

function readRequiredEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

async function main() {
  const email = readRequiredEnv("SUPER_ADMIN_EMAIL");
  const firstName = readRequiredEnv("SUPER_ADMIN_FIRST_NAME");
  const lastName = readRequiredEnv("SUPER_ADMIN_LAST_NAME");
  const password = readRequiredEnv("SUPER_ADMIN_PASSWORD");
  const phone = process.env.SUPER_ADMIN_PHONE?.trim() || undefined;
  const whatsappNumber = process.env.SUPER_ADMIN_WHATSAPP?.trim() || phone;

  const result = await bootstrapSuperAdmin({
    email,
    firstName,
    lastName,
    password,
    phone,
    whatsappNumber,
  });

  console.log(`Super admin bootstrapped: userId=${result.userId}, roleId=${result.roleId}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
