import bcrypt from "bcryptjs";
import {RoleScope, UserStatus} from "@prisma/client";
import {prisma} from "@/lib/prisma";

type BootstrapSuperAdminInput = {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  phone?: string;
  whatsappNumber?: string;
};

export async function bootstrapSuperAdmin(input: BootstrapSuperAdminInput) {
  return prisma.$transaction(async (tx) => {
    const superAdminRole = await tx.role.upsert({
      where: {slug: "super-admin"},
      update: {isActive: true},
      create: {
        name: "Super Admin",
        slug: "super-admin",
        description: "Full system control",
        scope: RoleScope.SYSTEM,
        isActive: true,
      },
    });

    const passwordHash = await bcrypt.hash(input.password, 12);

    const user = await tx.user.upsert({
      where: {email: input.email.toLowerCase()},
      update: {
        firstName: input.firstName,
        lastName: input.lastName,
        phone: input.phone,
        whatsappNumber: input.whatsappNumber,
        status: UserStatus.ACTIVE,
        deletedAt: null,
      },
      create: {
        email: input.email.toLowerCase(),
        firstName: input.firstName,
        lastName: input.lastName,
        phone: input.phone,
        whatsappNumber: input.whatsappNumber,
        passwordHash,
        status: UserStatus.ACTIVE,
      },
    });

    await tx.userRole.upsert({
      where: {
        userId_roleId: {
          userId: user.id,
          roleId: superAdminRole.id,
        },
      },
      update: {},
      create: {
        userId: user.id,
        roleId: superAdminRole.id,
      },
    });

    return {userId: user.id, roleId: superAdminRole.id};
  });
}

type CreateCustomRoleInput = {
  name: string;
  slug: string;
  description?: string;
  permissionKeys?: string[];
};

export async function createCustomRole(input: CreateCustomRoleInput) {
  return prisma.$transaction(async (tx) => {
    const role = await tx.role.create({
      data: {
        name: input.name,
        slug: input.slug,
        description: input.description,
        scope: RoleScope.CUSTOM,
        isActive: true,
      },
    });

    if (!input.permissionKeys?.length) {
      return role;
    }

    const permissions = await tx.permission.findMany({
      where: {key: {in: input.permissionKeys}},
      select: {id: true},
    });

    await tx.rolePermission.createMany({
      data: permissions.map((permission) => ({
        roleId: role.id,
        permissionId: permission.id,
      })),
      skipDuplicates: true,
    });

    return role;
  });
}

export async function assignRoleToUser(userId: string, roleSlug: string, assignedById?: string) {
  return prisma.$transaction(async (tx) => {
    const role = await tx.role.findUnique({
      where: {slug: roleSlug},
      select: {id: true, isActive: true},
    });

    if (!role || !role.isActive) {
      throw new Error("Role is missing or inactive");
    }

    return tx.userRole.upsert({
      where: {
        userId_roleId: {
          userId,
          roleId: role.id,
        },
      },
      update: {
        assignedById,
      },
      create: {
        userId,
        roleId: role.id,
        assignedById,
      },
    });
  });
}
