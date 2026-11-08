import { ok } from "@/lib/http";
import { getPolicy } from "@/lib/policies";
import { handle } from "@/lib/route";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const GET = handle(async () => {
  return ok(await getPolicy("returns"), "تم جلب سياسة الاسترجاع");
});
