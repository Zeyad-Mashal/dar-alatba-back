import { ok } from "@/lib/http";
import { deleteOrder } from "@/lib/orders";
import { handle } from "@/lib/route";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const DELETE = handle(async (_request, context) => {
  const { id } = await context.params;
  return ok(await deleteOrder(id), "تم حذف الطلب");
});
