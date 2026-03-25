import {NextResponse} from "next/server";
import {requireActiveSession} from "@/lib/auth";
import {getUnreadNotificationCount, listUserNotifications, markAllNotificationsRead} from "@/lib/notifications";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await requireActiveSession();

  if (!session?.user?.id) {
    return NextResponse.json({message: "Unauthorized"}, {status: 401});
  }

  const url = new URL(request.url);
  const limit = Number(url.searchParams.get("limit") ?? 50);

  const [notifications, unread] = await Promise.all([
    listUserNotifications(session.user.id, Number.isFinite(limit) ? Math.min(Math.max(limit, 1), 100) : 50),
    getUnreadNotificationCount(session.user.id),
  ]);

  return NextResponse.json({notifications, unread});
}

export async function PATCH() {
  const session = await requireActiveSession();

  if (!session?.user?.id) {
    return NextResponse.json({message: "Unauthorized"}, {status: 401});
  }

  const result = await markAllNotificationsRead(session.user.id);

  return NextResponse.json({updatedCount: result.count});
}
