import {RoleScope} from "@prisma/client";
import {prisma} from "@/lib/prisma";

export async function listRbacData() {
  const [roles, permissions, users] = await Promise.all([
    prisma.role.findMany({
      orderBy: [{scope: "asc"}, {name: "asc"}],
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        scope: true,
        isActive: true,
        rolePermissions: {
          select: {
            permission: {
              select: {
                id: true,
                key: true,
                label: true,
                module: true,
              },
            },
          },
        },
      },
    }),
    prisma.permission.findMany({
      orderBy: [{module: "asc"}, {key: "asc"}],
      select: {
        id: true,
        key: true,
        label: true,
        module: true,
      },
    }),
    prisma.user.findMany({
      where: {deletedAt: null},
      orderBy: [{firstName: "asc"}, {lastName: "asc"}],
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        status: true,
        userRoles: {
          select: {
            role: {
              select: {
                id: true,
                slug: true,
                name: true,
              },
            },
          },
        },
      },
    }),
  ]);

  return {roles, permissions, users};
}

export async function createRole(input: {
  name: string;
  slug: string;
  description?: string;
  permissionKeys?: string[];
  scope?: RoleScope;
}) {
  return prisma.$transaction(async (tx) => {
    const role = await tx.role.create({
      data: {
        name: input.name,
        slug: input.slug,
        description: input.description,
        scope: input.scope ?? RoleScope.CUSTOM,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        scope: true,
        isActive: true,
      },
    });

    if (input.permissionKeys?.length) {
      const permissionIds = await tx.permission.findMany({
        where: {key: {in: input.permissionKeys}},
        select: {id: true},
      });

      await tx.rolePermission.createMany({
        data: permissionIds.map((permission) => ({
          roleId: role.id,
          permissionId: permission.id,
        })),
        skipDuplicates: true,
      });
    }

    return role;
  });
}

export async function setRolePermissions(roleId: string, permissionKeys: string[]) {
  return prisma.$transaction(async (tx) => {
    const role = await tx.role.findUnique({
      where: {id: roleId},
      select: {id: true, scope: true},
    });

    if (!role) {
      throw new Error("Role not found");
    }

    if (role.scope === RoleScope.SYSTEM) {
      throw new Error("System roles cannot be edited");
    }

    await tx.rolePermission.deleteMany({where: {roleId}});

    if (!permissionKeys.length) {
      return true;
    }

    const permissions = await tx.permission.findMany({
      where: {key: {in: permissionKeys}},
      select: {id: true},
    });

    await tx.rolePermission.createMany({
      data: permissions.map((permission) => ({
        roleId,
        permissionId: permission.id,
      })),
      skipDuplicates: true,
    });

    return true;
  });
}

export async function assignRoleToUser(userId: string, roleId: string, assignedById?: string) {
  const role = await prisma.role.findUnique({
    where: {id: roleId},
    select: {id: true, isActive: true},
  });

  if (!role || !role.isActive) {
    throw new Error("Role missing or inactive");
  }

  return prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId,
        roleId,
      },
    },
    update: {
      assignedById,
    },
    create: {
      userId,
      roleId,
      assignedById,
    },
  });
}
