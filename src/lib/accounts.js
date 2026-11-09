import { createHash, randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { ApiError } from "./http";
import { Customer } from "./models";
import { requiredText, textValue } from "./body";

const TOKEN_BYTES = 32;
const SCRYPT_KEYLEN = 64;

function normalizeEmail(value) {
  return textValue(value).toLowerCase();
}

function normalizePhone(value) {
  return String(value ?? "").replace(/[^\d+]/g, "");
}

function hashPassword(password, salt = randomBytes(16).toString("hex")) {
  const hash = scryptSync(password, salt, SCRYPT_KEYLEN).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password, stored) {
  const [salt, hash] = String(stored || "").split(":");
  if (!salt || !hash) return false;
  const next = scryptSync(password, salt, SCRYPT_KEYLEN);
  const prev = Buffer.from(hash, "hex");
  if (prev.length !== next.length) return false;
  return timingSafeEqual(prev, next);
}

function hashToken(token) {
  return createHash("sha256").update(token).digest("hex");
}

function publicCustomer(customer, token) {
  return {
    name: customer.name,
    email: customer.email,
    phone: customer.phone || "",
    favorites: Array.isArray(customer.favorites) ? customer.favorites : [],
    token,
  };
}

async function findByToken(token) {
  const clean = textValue(token);
  if (!clean) throw new ApiError("يجب تسجيل الدخول", 401);
  const customer = await Customer.findOne({ sessionTokenHash: hashToken(clean) });
  if (!customer) throw new ApiError("انتهت الجلسة، سجّل الدخول مرة أخرى", 401);
  return customer;
}

function issueToken(customer) {
  const token = randomBytes(TOKEN_BYTES).toString("hex");
  customer.sessionTokenHash = hashToken(token);
  return token;
}

export async function registerAccount(fields) {
  const email = normalizeEmail(requiredText(fields.email, "البريد", 160));
  const name = requiredText(fields.name, "الاسم", 80);
  const password = textValue(fields.password);
  const phone = normalizePhone(fields.phone);
  if (phone.replace(/\D/g, "").length < 10) throw new ApiError("رقم الموبايل غير صالح");
  if (password.length < 6) throw new ApiError("كلمة المرور قصيرة");

  const existing = await Customer.findOne({ email }).select("_id").lean();
  if (existing) throw new ApiError("الحساب موجود مسبقاً", 409);

  const customer = new Customer({
    email,
    name,
    phone,
    passwordHash: hashPassword(password),
    favorites: [],
  });
  const token = issueToken(customer);
  await customer.save();
  return publicCustomer(customer, token);
}

export async function loginAccount(fields) {
  const email = normalizeEmail(requiredText(fields.email, "البريد", 160));
  const password = textValue(fields.password);
  const customer = await Customer.findOne({ email });
  if (!customer || !verifyPassword(password, customer.passwordHash)) {
    throw new ApiError("بيانات الدخول غير صحيحة", 401);
  }
  const token = issueToken(customer);
  await customer.save();
  return publicCustomer(customer, token);
}

export async function logoutAccount(fields) {
  const token = textValue(fields.token);
  if (!token) return { ok: true };
  await Customer.updateOne({ sessionTokenHash: hashToken(token) }, { $unset: { sessionTokenHash: 1 } });
  return { ok: true };
}

export async function getAccount(fields) {
  const customer = await findByToken(fields.token);
  return publicCustomer(customer, textValue(fields.token));
}

export async function getFavorites(fields) {
  const customer = await findByToken(fields.token);
  return { favorites: Array.isArray(customer.favorites) ? customer.favorites : [] };
}

export async function setFavorites(fields) {
  const customer = await findByToken(fields.token);
  const list = Array.isArray(fields.favorites)
    ? fields.favorites
    : typeof fields.favorites === "string"
      ? (() => {
          try {
            return JSON.parse(fields.favorites);
          } catch {
            return [];
          }
        })()
      : [];
  const favorites = [...new Set(list.map((id) => String(id || "").trim()).filter(Boolean))];
  customer.favorites = favorites;
  await customer.save();
  return { favorites };
}

export async function toggleFavorite(fields) {
  const customer = await findByToken(fields.token);
  const productId = textValue(fields.productId || fields.id);
  if (!productId) throw new ApiError("المنتج مطلوب");
  const current = Array.isArray(customer.favorites) ? customer.favorites : [];
  const exists = current.includes(productId);
  customer.favorites = exists ? current.filter((id) => id !== productId) : [...current, productId];
  await customer.save();
  return { favorites: customer.favorites, saved: !exists };
}

export async function requestPasswordReset(fields) {
  const email = normalizeEmail(requiredText(fields.email, "البريد", 160));
  const customer = await Customer.findOne({ email });
  if (!customer) throw new ApiError("الحساب غير موجود", 404);
  const code = String(Math.floor(100000 + Math.random() * 900000));
  customer.resetCodeHash = hashToken(code);
  customer.resetExpires = new Date(Date.now() + 10 * 60 * 1000);
  await customer.save();
  return { email, code };
}

export async function resetPassword(fields) {
  const email = normalizeEmail(requiredText(fields.email, "البريد", 160));
  const code = textValue(fields.code);
  const password = textValue(fields.password);
  if (password.length < 6) throw new ApiError("كلمة المرور قصيرة");
  const customer = await Customer.findOne({ email });
  if (!customer) throw new ApiError("الحساب غير موجود", 404);
  if (!customer.resetCodeHash || !customer.resetExpires || customer.resetExpires.getTime() < Date.now()) {
    throw new ApiError("انتهت صلاحية الرمز", 400);
  }
  if (customer.resetCodeHash !== hashToken(code)) throw new ApiError("الرمز غير صحيح", 400);
  customer.passwordHash = hashPassword(password);
  customer.resetCodeHash = undefined;
  customer.resetExpires = undefined;
  const token = issueToken(customer);
  await customer.save();
  return publicCustomer(customer, token);
}

export async function listCustomers() {
  const rows = await Customer.find({})
    .select("name email phone favorites createdAt updatedAt")
    .sort({ createdAt: -1 })
    .lean();

  return rows.map((customer) => {
    const favorites = Array.isArray(customer.favorites) ? customer.favorites : [];
    return {
      _id: String(customer._id),
      name: customer.name,
      email: customer.email,
      phone: customer.phone || "",
      favorites,
      favoritesCount: favorites.length,
      createdAt: customer.createdAt,
      updatedAt: customer.updatedAt,
    };
  });
}
