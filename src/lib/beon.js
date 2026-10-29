const DEFAULT_BASE_URL = "https://v3.api.beon.chat/api";
const DEFAULT_TEMPLATE_ID = "136348";

const REPLY_LABELS = [
  ["تأكيد الطلب", "confirmed"],
  ["إلغاء الطلب", "cancelled"],
  ["تواصل معنا", "contact"],
];

function baseUrl() {
  return (process.env.BEON_BASE_URL || DEFAULT_BASE_URL).replace(/\/$/, "");
}

function templateId() {
  return String(process.env.BEON_TEMPLATE_ID || DEFAULT_TEMPLATE_ID);
}

export function toWhatsappPhone(value) {
  const digits = String(value || "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("20")) return `+${digits}`;
  if (digits.startsWith("0")) return `+2${digits}`;
  return `+${digits}`;
}

function paymentLabel(method) {
  if (method === "cod") return "الدفع عند الاستلام";
  if (method === "instapay") return "إنستاباي";
  if (method === "vodafone") return "فودافون كاش";
  return "فودافون كاش أو إنستا باي";
}

function templateValue(value) {
  const text = String(value ?? "")
    .replace(/[\r\n\t]+/g, " ")
    .replace(/ {2,}/g, " ")
    .trim();
  return (text || "غير متوفر").slice(0, 900);
}

async function beonFetch(path, { method = "GET", body } = {}) {
  const token = process.env.BEON_TOKEN;
  if (!token) {
    throw new Error("BEON_TOKEN missing");
  }

  const response = await fetch(`${baseUrl()}${path}`, {
    method,
    headers: {
      "beon-token": token,
      Accept: "application/json",
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const json = await response.json().catch(() => ({}));
  const status = Number(json.status || response.status);
  if (!response.ok || status >= 400) {
    const errors = json.errors ? JSON.stringify(json.errors) : "";
    const message = json.message || json.error || "تعذر الاتصال بـ BeOn";
    throw new Error([message, errors].filter(Boolean).join(" "));
  }
  return json;
}

export async function verifyBeonConnection() {
  const json = await beonFetch("/partner/account");
  const account = json.data || {};
  return {
    id: account.id,
    name: account.account_name || "",
    status: account.status || "",
  };
}

export async function sendOrderWhatsapp(order) {
  const phoneNumber = toWhatsappPhone(order.customerPhone);
  const shipping = 100;
  const productsTotal = Number(order.totalPrice || 0);
  const total = productsTotal + shipping;
  const lines = (order.items || []).map((item) => {
    const variant = [item.sizeName, item.colorName].filter(Boolean).join(" / ");
    return `${item.name} × ${item.quantity}${variant ? ` (${variant})` : ""}`;
  });

  const json = await beonFetch("/partner/messages/whatsapp/template", {
    method: "POST",
    body: {
      phoneNumber,
      name: templateValue(order.customerName),
      template_id: Number(templateId()),
      template_vars: [
        order.customerName,
        order.customerPhone,
        order.governorate,
        "غير محددة",
        order.detailedAddress,
        paymentLabel(order.paymentMethod),
        order.transferImage?.url
          ? "تم رفع الصورة بنجاح"
          : order.paymentMethod === "cod"
            ? "غير مطلوبة"
            : "بدون صورة",
        lines.join("، "),
        `${total} جنيه`,
      ].map(templateValue),
    },
  });

  return {
    status: "sent",
    messageId: String(json.data?.whatsapp_id || ""),
    error: "",
    sentAt: new Date(),
  };
}

function walk(value, acc, depth = 0) {
  if (value == null || depth > 6) return;
  if (Array.isArray(value)) {
    value.forEach((item) => walk(item, acc, depth + 1));
    return;
  }
  if (typeof value !== "object") return;

  for (const [key, item] of Object.entries(value)) {
    const name = key.toLowerCase();
    if (typeof item === "string" || typeof item === "number") {
      const text = String(item).trim();
      if (!text) continue;
      if (["phone", "phonenumber", "from", "wa_id", "sender", "customer_phone"].includes(name)) {
        acc.phones.push(text);
      }
      if (["body", "text", "title", "button", "payload", "button_text", "content"].includes(name)) {
        acc.texts.push(text);
      }
      if (["event", "event_type", "type"].includes(name)) {
        acc.events.push(text);
      }
    } else {
      walk(item, acc, depth + 1);
    }
  }
}

export function readBeonWebhook(payload) {
  const acc = { phones: [], texts: [], events: [] };
  walk(payload, acc);
  const reply = REPLY_LABELS.find(([label]) => acc.texts.some((text) => text === label));
  return {
    event: acc.events[0] || "",
    phones: [...new Set(acc.phones)],
    reply: reply ? reply[1] : "",
  };
}
