import type {Session} from "next-auth";
import {prisma} from "@/lib/prisma";

export type AccessProfile = {
  roles: string[];
  permissions: string[];
};

export async function resolveUserAccess(userId: string): Promise<AccessProfile> {
  const userWithRoles = await prisma.user.findUnique({
    where: {id: userId},
    select: {
      userRoles: {
        select: {
          role: {
            select: {
              slug: true,
              isActive: true,
              rolePermissions: {
                select: {
                  permission: {
                    select: {key: true},
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!userWithRoles) {
    return {roles: [], permissions: []};
  }

  const roleSet = new Set<string>();
  const permissionSet = new Set<string>();

  for (const assignment of userWithRoles.userRoles) {
    if (!assignment.role.isActive) {
      continue;
    }

    roleSet.add(assignment.role.slug);

    for (const rolePermission of assignment.role.rolePermissions) {
      permissionSet.add(rolePermission.permission.key);
    }
  }

  return {
    roles: [...roleSet],
    permissions: [...permissionSet],
  };
}

export async function userHasPermission(userId: string, permissionKey: string): Promise<boolean> {
  const access = await resolveUserAccess(userId);
  return access.permissions.includes(permissionKey);
}

export async function userHasAnyRole(userId: string, roleSlugs: string[]): Promise<boolean> {
  const access = await resolveUserAccess(userId);
  return roleSlugs.some((slug) => access.roles.includes(slug));
}

export function sessionHasPermission(session: Session | null, permissionKey: string): boolean {
  if (!session?.user) {
    return false;
  }

  return session.user.permissions?.includes(permissionKey) ?? false;
}

export function sessionHasAnyRole(session: Session | null, roleSlugs: string[]): boolean {
  if (!session?.user) {
    return false;
  }

  return roleSlugs.some((slug) => session.user.roles?.includes(slug));
}
