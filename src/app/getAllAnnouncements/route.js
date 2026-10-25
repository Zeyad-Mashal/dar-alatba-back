import { listAnnouncements } from "@/lib/announcements";
import { ok } from "@/lib/http";
import { handle } from "@/lib/route";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const GET = handle(async () => ok(await listAnnouncements(false), "تم جلب عبارات الشريط"));
