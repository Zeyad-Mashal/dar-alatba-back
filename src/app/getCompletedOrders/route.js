import { ok } from "@/lib/http";
import { listOrders } from "@/lib/orders";
import { handle } from "@/lib/route";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const GET = handle(async () => {
  return ok(await listOrders("completed"), "الطلبات المكتملة");
});
