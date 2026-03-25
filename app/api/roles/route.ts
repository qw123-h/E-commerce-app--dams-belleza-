import {RoleScope} from "@prisma/client";
import {NextResponse} from "next/server";
import {createRole, listRbacData} from "@/lib/admin-rbac";

export const dynamic = "force-dynamic";

export async function GET() {
  const data = await listRbacData();
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as
    | {
        name?: string;
        slug?: string;
        description?: string;
        permissionKeys?: string[];
      }
    | null;

  if (!body?.name?.trim() || !body.slug?.trim()) {
    return NextResponse.json({message: "name and slug are required"}, {status: 400});
  }

  try {
    const role = await createRole({
      name: body.name.trim(),
      slug: body.slug.trim().toLowerCase(),
      description: body.description?.trim() || undefined,
      permissionKeys: body.permissionKeys ?? [],
      scope: RoleScope.CUSTOM,
    });

    return NextResponse.json({role}, {status: 201});
  } catch {
    return NextResponse.json({message: "Could not create role"}, {status: 400});
  }
}
