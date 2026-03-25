import {NextResponse} from "next/server";
import {requireActiveSession} from "@/lib/auth";
import {markNotificationRead} from "@/lib/notifications";

export const dynamic = "force-dynamic";

export async function PATCH(_request: Request, context: {params: {notificationId: string}}) {
  const session = await requireActiveSession();

  if (!session?.user?.id) {
    return NextResponse.json({message: "Unauthorized"}, {status: 401});
  }

  const result = await markNotificationRead(session.user.id, context.params.notificationId);
  return NextResponse.json({updatedCount: result.count});
}
