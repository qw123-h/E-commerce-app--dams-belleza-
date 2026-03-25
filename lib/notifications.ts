import type {NotificationType, Prisma} from "@prisma/client";
import {prisma} from "@/lib/prisma";

type NotificationPayload = {
  type: NotificationType;
  title: string;
  body: string;
  metadata?: Prisma.InputJsonValue;
};

export async function notifyUsersWithPermission(permissionKey: string, payload: NotificationPayload) {
  const users = await prisma.user.findMany({
    where: {
      status: "ACTIVE",
      deletedAt: null,
      userRoles: {
        some: {
          role: {
            isActive: true,
            rolePermissions: {
              some: {
                permission: {
                  key: permissionKey,
                },
              },
            },
          },
        },
      },
    },
    select: {
      id: true,
    },
  });

  if (!users.length) {
    return;
  }

  await prisma.notification.createMany({
    data: users.map((user) => ({
      userId: user.id,
      type: payload.type,
      title: payload.title,
      body: payload.body,
      metadata: payload.metadata,
    })),
  });
}

export async function listUserNotifications(userId: string, limit = 50) {
  return prisma.notification.findMany({
    where: {
      userId,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: limit,
    select: {
      id: true,
      type: true,
      title: true,
      body: true,
      isRead: true,
      metadata: true,
      createdAt: true,
    },
  });
}

export async function getUnreadNotificationCount(userId: string) {
  return prisma.notification.count({
    where: {
      userId,
      isRead: false,
    },
  });
}

export async function markNotificationRead(userId: string, notificationId: string) {
  return prisma.notification.updateMany({
    where: {
      id: notificationId,
      userId,
    },
    data: {
      isRead: true,
    },
  });
}

export async function markAllNotificationsRead(userId: string) {
  return prisma.notification.updateMany({
    where: {
      userId,
      isRead: false,
    },
    data: {
      isRead: true,
    },
  });
}
