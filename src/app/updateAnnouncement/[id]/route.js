import { readBody } from "@/lib/body";
import { updateAnnouncement } from "@/lib/announcements";
import { ok } from "@/lib/http";
import { handle } from "@/lib/route";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const PUT = handle(async (request, context) => {
  const { id } = await context.params;
  const { fields } = await readBody(request);
  return ok(await updateAnnouncement(id, fields), "تم تعديل العبارة");
});
