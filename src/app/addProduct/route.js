import { readBody } from "@/lib/body";
import { addProduct } from "@/lib/catalogService";
import { ok } from "@/lib/http";
import { handle } from "@/lib/route";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const POST = handle(async (request) => {
  const { fields, files } = await readBody(request);
  return ok(await addProduct(fields, files), "تمت إضافة المنتج", 201);
});
