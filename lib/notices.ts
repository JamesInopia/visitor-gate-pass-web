import "server-only";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { notices } from "@/db/schema";

export type NoticeDto = {
  id: string;
  kind: "denied";
  hostName: string;
  visitDate: string | null;
  createdAt: string;
};

export async function readNotices(userId: number): Promise<NoticeDto[]> {
  const rows = await db.select().from(notices).where(eq(notices.userId, userId)).orderBy(desc(notices.createdAt));
  return rows.map((n) => ({
    id: String(n.noticeId),
    kind: n.kind,
    hostName: n.hostName,
    visitDate: n.visitDate,
    createdAt: n.createdAt.toISOString(),
  }));
}

export async function dismissNotice(userId: number, noticeId: number): Promise<boolean> {
  const deleted = await db
    .delete(notices)
    .where(and(eq(notices.noticeId, noticeId), eq(notices.userId, userId)))
    .returning({ noticeId: notices.noticeId });
  return deleted.length > 0;
}
