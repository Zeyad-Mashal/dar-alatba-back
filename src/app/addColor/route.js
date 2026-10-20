import { readBody } from "@/lib/body";
import { addColor } from "@/lib/catalogService";
import { ok } from "@/lib/http";
import { handle } from "@/lib/route";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const POST = handle(async (request) => {
  const { fields } = await readBody(request);
  return ok(await addColor(fields), "تمت إضافة اللون", 201);
});
