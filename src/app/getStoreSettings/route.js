import { ok } from "@/lib/http";
import { handle } from "@/lib/route";
import { STORE } from "@/lib/store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const GET = handle(async () => {
  return ok(STORE, "إعدادات المتجر");
});
