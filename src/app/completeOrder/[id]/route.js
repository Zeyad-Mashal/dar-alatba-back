import { ok } from "@/lib/http";
import { completeOrder } from "@/lib/orders";
import { handle } from "@/lib/route";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const PUT = handle(async (_request, context) => {
  const { id } = await context.params;
  return ok(await completeOrder(id), "تم إكمال الطلب");
});
