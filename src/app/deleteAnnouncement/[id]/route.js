import { removeAnnouncement } from "@/lib/announcements";
import { ok } from "@/lib/http";
import { handle } from "@/lib/route";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const DELETE = handle(async (_request, context) => {
  const { id } = await context.params;
  return ok(await removeAnnouncement(id), "تم حذف العبارة");
});