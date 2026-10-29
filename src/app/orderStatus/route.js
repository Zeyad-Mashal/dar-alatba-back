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

function statusFrom(fields, request) {
  const queryStatus = new URL(request.url).searchParams.get("status");
  return textValue(fields.status || queryStatus || "received");
}

export const GET = handle(async (request) => {
  const order = await markOrderReceived(phoneFrom({}, request), statusFrom({}, request));
  const message = order.status === "cancelled" ? "تم إلغاء الطلب" : "تم تحديث حالة الطلب";
  return ok(order, message);
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
  const order = await markOrderReceived(phoneFrom(fields, request), statusFrom(fields, request));
  const message = order.status === "cancelled" ? "تم إلغاء الطلب" : "تم تحديث حالة الطلب";
  return ok(order, message);
});
