import { getFavorites } from "@/lib/accounts";
import { readBody } from "@/lib/body";
import { ok } from "@/lib/http";
import { handle } from "@/lib/route";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const POST = handle(async (request) => {
  const { fields } = await readBody(request);
  return ok(await getFavorites(fields), "المفضلة");
});
