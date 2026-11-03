import { getAnalytics } from "@/lib/analytics";
import { ok } from "@/lib/http";
import { handle } from "@/lib/route";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const GET = handle(async (request) => {
  const days = Number(new URL(request.url).searchParams.get("days"));
  return ok(await getAnalytics(days), "تحليلات الطلبات");
});
