import { ok } from "@/lib/http";
import { handle } from "@/lib/route";
import { STORE, freeShippingThresholdFromTicker } from "@/lib/store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const GET = handle(async () => {
  const freeShippingFrom = await freeShippingThresholdFromTicker();
  return ok(
    {
      ...STORE,
      freeShippingFrom,
    },
    "إعدادات المتجر",
  );
});
