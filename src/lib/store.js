function numberEnv(name, fallback) {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value >= 0 ? value : fallback;
}

export const STORE = {
  shippingFee: numberEnv("SHIPPING_FEE", 100),
  freeShippingFrom: numberEnv("FREE_SHIPPING_FROM", 500),
  embroideryPrice: numberEnv("EMBROIDERY_PRICE", 0),
  setDiscountPercent: 15,
};

export function shippingFeeFor(productsTotal) {
  const total = Number(productsTotal) || 0;
  return total >= STORE.freeShippingFrom ? 0 : STORE.shippingFee;
}
