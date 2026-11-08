import { ApiError } from "./http";
import { Policy } from "./models";

const KEYS = {
  privacy: {
    label: "سياسة الخصوصية",
    defaults: {
      titleAr: "سياسة الخصوصية",
      titleEn: "Privacy Policy",
      contentAr:
        "بيانات الطلب زي الاسم والموبايل والعنوان بنستخدمها عشان نتواصل ونوصّل الطلب، ومش بنبيعها.\n\nحساب المتجر والمفضلة في النسخة الحالية متسجلين على جهازك في المتصفح، ومش بيتبعتوا كحساب على سيرفر.\n\nلو عايز تمسح الحساب من الجهاز، امسح بيانات الموقع من المتصفح أو سجّل الخروج.",
      contentEn:
        "Order details such as your name, phone, and address are used to contact you and deliver the order. We do not sell them.\n\nIn the current version, the shop account and favorites stay in your browser on this device. They are not sent as an account to a server.\n\nTo remove that account from the device, clear this site's data in the browser or log out.",
    },
  },
  returns: {
    label: "سياسة الاسترجاع",
    defaults: {
      titleAr: "سياسة الاسترجاع",
      titleEn: "Returns Policy",
      contentAr:
        "تقدر تطلب إرجاع خلال ١٤ يوم من استلام الطلب، لو القطعة لسه بحالتها الأصلية ومش مستخدمة.\n\nالإرجاع بيتم بعد التواصل على واتساب أو على 01007743765، وبنأكد حالة القطعة قبل استلامها.\n\nلو القطعة فيها عيب من عندنا، قول لنا وأرسل صورة عشان نبدّلها أو نرجّع قيمتها.",
      contentEn:
        "You can ask for a return within 14 days of receiving the order if the piece is still in its original condition and unused.\n\nReturns start on WhatsApp or at 01007743765. We confirm the piece before collecting it.\n\nIf a piece arrives with a fault, send us a photo so we can exchange it or refund it.",
    },
  },
};

function assertKey(key) {
  if (!KEYS[key]) throw new ApiError("نوع السياسة غير صالح");
  return key;
}

function exactContent(value, label) {
  if (typeof value !== "string") throw new ApiError(`${label} مطلوب`);
  if (value.length === 0) throw new ApiError(`${label} مطلوب`);
  if (value.length > 50000) throw new ApiError(`${label} طويل جداً`);
  return value;
}

function exactTitle(value, label) {
  if (typeof value !== "string") throw new ApiError(`${label} مطلوب`);
  if (value.length === 0) throw new ApiError(`${label} مطلوب`);
  if (value.length > 200) throw new ApiError(`${label} طويل جداً`);
  return value;
}

function serialize(item) {
  return {
    _id: String(item._id),
    key: item.key,
    titleAr: item.titleAr || "",
    titleEn: item.titleEn || "",
    contentAr: item.contentAr || "",
    contentEn: item.contentEn || "",
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

async function ensurePolicy(key) {
  assertKey(key);
  let item = await Policy.findOne({ key });
  if (item) return item;
  item = await Policy.create({ key, ...KEYS[key].defaults });
  return item;
}

export async function getPolicy(key) {
  const item = await ensurePolicy(key);
  return serialize(item);
}

export async function updatePolicy(key, fields) {
  assertKey(key);
  const item = await ensurePolicy(key);

  const titleAr = exactTitle(
    fields.titleAr !== undefined ? fields.titleAr : item.titleAr,
    "العنوان بالعربي",
  );
  const titleEn = exactTitle(
    fields.titleEn !== undefined ? fields.titleEn : item.titleEn,
    "العنوان بالإنجليزي",
  );
  const contentAr = exactContent(
    fields.contentAr !== undefined ? fields.contentAr : item.contentAr,
    "المحتوى بالعربي",
  );
  const contentEn = exactContent(
    fields.contentEn !== undefined ? fields.contentEn : item.contentEn,
    "المحتوى بالإنجليزي",
  );

  item.set({ titleAr, titleEn, contentAr, contentEn });
  await item.save();
  return serialize(item);
}

export function policyLabel(key) {
  return KEYS[assertKey(key)].label;
}
