import { readBody, textValue } from "@/lib/body";
import { ok } from "@/lib/http";
import { markOrderReceived } from "@/lib/orders";
import { handle } from "@/lib/route";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function phoneFrom(fields, request) {
  const queryPhone = new URL(request.url).searchParams.get("phone");
  return textValue(fields.phone || fields.phoneNumber || fields.customerPhone || queryPhone);
}

export const GET = handle(async (request) => {
  return ok(await markOrderReceived(phoneFrom({}, request)), "تم تحديث حالة الطلب");
});

export const POST = handle(async (request) => {
  const type = request.headers.get("content-type") || "";
  let fields = {};
  if (type.includes("application/x-www-form-urlencoded")) {
    const params = new URLSearchParams(await request.text());
    fields = Object.fromEntries(params.entries());
  } else {
    ({ fields } = await readBody(request));
  }
  return ok(await markOrderReceived(phoneFrom(fields, request)), "تم تحديث حالة الطلب");
});
