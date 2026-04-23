import {NextResponse} from "next/server";
import {requirePermission} from "@/lib/guards";
import {assignRoleToUser} from "@/lib/admin-rbac";

export const dynamic = "force-dynamic";

export async function POST(request: Request, context: {params: {userId: string}}) {
  const session = await requirePermission("roles.manage");
  const body = (await request.json().catch(() => null)) as {roleId?: string} | null;

  if (!body?.roleId) {
    return NextResponse.json({message: "roleId is required"}, {status: 400});
  }

  if (!session) {
    return NextResponse.json({message: "Forbidden"}, {status: 403});
  }

  try {
    const assignment = await assignRoleToUser(context.params.userId, body.roleId, session?.user?.id);
    return NextResponse.json({assignment}, {status: 201});
  } catch {
    return NextResponse.json({message: "Could not assign role"}, {status: 400});
  }
}
