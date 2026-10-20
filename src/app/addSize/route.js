import { readBody } from "@/lib/body";
import { addSize } from "@/lib/catalogService";
import { ok } from "@/lib/http";
import { handle } from "@/lib/route";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const POST = handle(async (request) => {
  const { fields } = await readBody(request);
  return ok(await addSize(fields), "تمت إضافة المقاس", 201);
});
