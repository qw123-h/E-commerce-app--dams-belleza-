import {requireActiveSession} from "@/lib/auth";
import {userHasAnyRole, userHasPermission} from "@/lib/rbac";

export async function requirePermission(permissionKey: string) {
  const session = await requireActiveSession();

  if (!session?.user?.id) {
    return null;
  }

  const hasPermission = await userHasPermission(session.user.id, permissionKey);

  if (!hasPermission) {
    return null;
  }

  return session;
}

export async function requireAnyRole(roleSlugs: string[]) {
  const session = await requireActiveSession();

  if (!session?.user?.id) {
    return null;
  }

  const hasRole = await userHasAnyRole(session.user.id, roleSlugs);

  if (!hasRole) {
    return null;
  }

  return session;
}
