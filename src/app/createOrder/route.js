import { readBody } from "@/lib/body";
import { ok } from "@/lib/http";
import { createOrder } from "@/lib/orders";
import { handle } from "@/lib/route";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const POST = handle(async (request) => {
  const { fields, files } = await readBody(request);
  return ok(await createOrder(fields, files), "تم تسجيل الطلب", 201);
});
