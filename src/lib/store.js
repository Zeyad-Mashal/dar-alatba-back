import { listAnnouncements } from "./announcements";

function numberEnv(name, fallback) {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value >= 0 ? value : fallback;
}

/** Flat shipping fee when the free-shipping threshold from the ticker is not met. */
export const STORE = {
  // Keep these fixed in code so old Vercel env (100 / 500) cannot zero out shipping.
  shippingFee: 85,
  freeShippingFrom: 3700,
  embroideryPrice: numberEnv("EMBROIDERY_PRICE", 0),
  setDiscountPercent: 15,
};

/** Read the free-shipping amount from ticker / announcement copy (e.g. "فوق 3700"). */
export function parseFreeShippingThreshold(...texts) {
  const joined = texts.filter(Boolean).join(" ");
  if (!joined) return null;
  const western = joined.replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)));
  const hinted = western.match(/(?:فوق|أكثر من|over|above|from)\s*(\d[\d,]*)/i);
  if (hinted) {
    const value = Number(hinted[1].replace(/,/g, ""));
    if (Number.isFinite(value) && value > 0) return value;
  }
  const amounts = [...western.matchAll(/\d[\d,]*/g)]
    .map((match) => Number(match[0].replace(/,/g, "")))
    .filter((value) => Number.isFinite(value) && value >= 200);
  return amounts.length ? Math.max(...amounts) : null;
}

export async function freeShippingThresholdFromTicker() {
  const announcements = await listAnnouncements(true);
  const fromTicker = parseFreeShippingThreshold(
    ...announcements.flatMap((item) => [item.textAr, item.textEn, item.text]),
  );
  if (fromTicker != null) return fromTicker;
  const fallback = Number(STORE.freeShippingFrom);
  return Number.isFinite(fallback) && fallback > 0 ? fallback : null;
}

export async function shippingFeeFor(productsTotal) {
  const total = Number(productsTotal) || 0;
  const threshold = await freeShippingThresholdFromTicker();
  if (threshold != null && total >= threshold) return 0;
  return STORE.shippingFee;
}
