import { listProducts } from "@/lib/catalogService";
import { ok } from "@/lib/http";
import { handle } from "@/lib/route";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const GET = handle(async (request) => {
  const categoryId = new URL(request.url).searchParams.get("categoryId");
  return ok(await listProducts(categoryId), "تم جلب المنتجات");
});
