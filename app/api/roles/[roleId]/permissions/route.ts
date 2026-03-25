import {NextResponse} from "next/server";
import {setRolePermissions} from "@/lib/admin-rbac";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request, context: {params: {roleId: string}}) {
  const body = (await request.json().catch(() => null)) as {permissionKeys?: string[]} | null;

  if (!body || !Array.isArray(body.permissionKeys)) {
    return NextResponse.json({message: "permissionKeys array is required"}, {status: 400});
  }

  try {
    await setRolePermissions(context.params.roleId, body.permissionKeys);
    return NextResponse.json({ok: true});
  } catch (error) {
    return NextResponse.json(
      {message: error instanceof Error ? error.message : "Could not update role permissions"},
      {status: 400}
    );
  }
}
