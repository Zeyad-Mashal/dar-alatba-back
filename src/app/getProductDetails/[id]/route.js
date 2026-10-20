import { getProduct } from "@/lib/catalogService";
import { ok } from "@/lib/http";
import { handle } from "@/lib/route";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const GET = handle(async (_request, context) => {
  const { id } = await context.params;
  return ok(await getProduct(id), "تم جلب تفاصيل المنتج");
});
