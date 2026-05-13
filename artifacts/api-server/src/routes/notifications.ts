import { Router, type IRouter } from "express";
import { db, notificationsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  MarkNotificationReadParams,
  ListNotificationsResponse,
  MarkNotificationReadResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

function mapNotification(n: typeof notificationsTable.$inferSelect) {
  return {
    id: n.id,
    title: n.title,
    message: n.message,
    type: n.type,
    read: n.read,
    createdAt: n.createdAt.toISOString(),
  };
}

router.get("/notifications", async (_req, res): Promise<void> => {
  const notifications = await db.select().from(notificationsTable).orderBy(notificationsTable.createdAt);
  res.json(ListNotificationsResponse.parse(notifications.map(mapNotification)));
});

router.patch("/notifications/:id/read", async (req, res): Promise<void> => {
  const params = MarkNotificationReadParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [notification] = await db.update(notificationsTable).set({ read: true }).where(eq(notificationsTable.id, params.data.id)).returning();
  if (!notification) {
    res.status(404).json({ error: "Notification not found" });
    return;
  }
  res.json(MarkNotificationReadResponse.parse(mapNotification(notification)));
});

router.patch("/notifications/read-all", async (_req, res): Promise<void> => {
  await db.update(notificationsTable).set({ read: true });
  res.json({ success: true });
});

export default router;
