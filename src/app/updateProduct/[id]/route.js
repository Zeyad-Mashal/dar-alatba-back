import { readBody } from "@/lib/body";
import { updateProduct } from "@/lib/catalogService";
import { ok } from "@/lib/http";
import { handle } from "@/lib/route";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const PUT = handle(async (request, context) => {
  const { id } = await context.params;
  const { fields, files } = await readBody(request);
  return ok(await updateProduct(id, fields, files), "تم تعديل المنتج");
});
