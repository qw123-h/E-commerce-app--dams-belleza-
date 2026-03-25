import {requireActiveSession} from "@/lib/auth";
import {sessionHasAnyRole, sessionHasPermission} from "@/lib/rbac";

export async function requirePermission(permissionKey: string) {
  const session = await requireActiveSession();

  if (!session || !sessionHasPermission(session, permissionKey)) {
    return null;
  }

  return session;
}

export async function requireAnyRole(roleSlugs: string[]) {
  const session = await requireActiveSession();

  if (!session || !sessionHasAnyRole(session, roleSlugs)) {
    return null;
  }

  return session;
}
