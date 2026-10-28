import { readBeonWebhook } from "@/lib/beon";
import { ok } from "@/lib/http";
import { BeonEvent } from "@/lib/models";
import { applyWhatsappReply } from "@/lib/orders";
import { handle } from "@/lib/route";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const GET = handle(async () => {
  return ok(
    { url: "https://dar-alatba-back.vercel.app/beonWebhook" },
    "مسار إشعارات BeOn جاهز",
  );
});

export const POST = handle(async (request) => {
  const raw = await request.text();
  let payload = {};
  if (raw) {
    try {
      payload = JSON.parse(raw);
    } catch {
      payload = { raw: raw.slice(0, 20000) };
    }
  }

  const parsed = readBeonWebhook(payload);
  const matchedOrder = await applyWhatsappReply(parsed.phones, parsed.reply);
  await BeonEvent.create({
    event: parsed.event,
    payload,
    matchedOrder,
    reply: parsed.reply,
  });

  return ok(
    { event: parsed.event, reply: parsed.reply, matchedOrder },
    "تم استلام إشعار BeOn",
  );
});
