import mongoose from "mongoose";
import { firstFile, requiredText, textValue } from "./body";
import { sendOrderWhatsapp } from "./beon";
import { deleteImage, uploadImage } from "./cloudinary";
import { ApiError } from "./http";
import { Order, Product } from "./models";

function assertObjectId(value, label) {
  const id = textValue(value);
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(`${label} غير صالح`);
  }
  return id;
}

function sameOption(left, right) {
  return (left ? String(left) : "") === (right ? String(right) : "");
}

async function takeStock(productId, sizeId, colorId, quantity) {
  const product = await Product.findById(productId);
  if (!product || product.isActive === false) {
    throw new ApiError("أحد المنتجات لم يعد متاحاً", 404);
  }

  if (product.variants?.length) {
    const variant = product.variants.find(
      (item) => sameOption(item.size, sizeId) && sameOption(item.color, colorId),
    );
    if (!variant) throw new ApiError("هذا المقاس أو اللون غير متوفر", 400);

    const updated = await Product.updateOne(
      {
        _id: product._id,
        "variants._id": variant._id,
        "variants.stock": { $gte: quantity },
      },
      { $inc: { "variants.$.stock": -quantity, stock: -quantity } },
    );
    if (!updated.modifiedCount) throw new ApiError("الكمية المطلوبة غير متوفرة", 400);
    return { productId: product._id, variantId: variant._id, quantity };
  }

  const updated = await Product.updateOne(
    { _id: product._id, stock: { $gte: quantity } },
    { $inc: { stock: -quantity } },
  );
  if (!updated.modifiedCount) throw new ApiError("الكمية المطلوبة غير متوفرة", 400);
  return { productId: product._id, variantId: null, quantity };
}

async function restoreStock(holds) {
  for (const hold of holds) {
    if (hold.variantId) {
      await Product.updateOne(
        { _id: hold.productId, "variants._id": hold.variantId },
        { $inc: { "variants.$.stock": hold.quantity, stock: hold.quantity } },
      );
    } else {
      await Product.updateOne(
        { _id: hold.productId },
        { $inc: { stock: hold.quantity } },
      );
    }
  }
}

function readItems(value) {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  try {
    const parsed = JSON.parse(textValue(value) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    throw new ApiError("بيانات المنتجات غير صالحة");
  }
}

function serialize(order) {
  const item = order.toObject ? order.toObject() : order;
  return {
    ...item,
    _id: String(item._id),
    items: (item.items || []).map((line) => ({
      ...line,
      product: line.product ? String(line.product) : null,
    })),
  };
}

export async function createOrder(fields, files) {
  const customerName = requiredText(fields.customerName, "اسم العميل", 120);
  const customerPhone = requiredText(fields.customerPhone, "هاتف العميل", 30);
  const governorate = requiredText(fields.governorate, "المحافظة", 80);
  const detailedAddress = requiredText(fields.detailedAddress, "العنوان", 500);
  const transferPhone = textValue(fields.transferPhone).slice(0, 40);
  const notes = textValue(fields.notes).slice(0, 4000);
  const rawItems = readItems(fields.items);

  if (!Array.isArray(rawItems) || rawItems.length === 0) {
    throw new ApiError("السلة فارغة");
  }

  const receipt = firstFile(files, "transferImage");
  if (!receipt) throw new ApiError("صورة إيصال التحويل مطلوبة");

  const lines = [];
  for (const raw of rawItems) {
    const productId = assertObjectId(raw.productId || raw.product, "المنتج");
    const quantity = Number(raw.quantity);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
      throw new ApiError("كمية المنتج غير صالحة");
    }
    const product = await Product.findById(productId);
    if (!product) throw new ApiError("أحد المنتجات غير موجود", 404);

    const variant = [textValue(raw.sizeName), textValue(raw.colorName)].filter(Boolean).join(" / ");
    lines.push({
      product: product._id,
      name: variant ? `${product.nameAr} (${variant})` : product.nameAr,
      price: product.price,
      quantity,
      image: product.images?.[0]?.url || "",
      sizeId: textValue(raw.sizeId),
      colorId: textValue(raw.colorId),
      sizeName: textValue(raw.sizeName),
      colorName: textValue(raw.colorName),
    });
  }

  const holds = [];
  try {
    for (const line of lines) {
      holds.push(await takeStock(line.product, line.sizeId, line.colorId, line.quantity));
    }
  } catch (error) {
    await restoreStock(holds);
    throw error;
  }

  let transferImage = null;
  let order = null;
  try {
    transferImage = await uploadImage(receipt, "dar-alatba/orders");
    const totalPrice = lines.reduce((sum, line) => sum + line.price * line.quantity, 0);
    order = await Order.create({
      customerName,
      customerPhone,
      governorate,
      detailedAddress,
      transferPhone,
      notes,
      items: lines,
      totalPrice,
      transferImage,
      status: "pending",
      whatsapp: { status: "pending" },
    });

    try {
      order.whatsapp = await sendOrderWhatsapp(order);
    } catch (error) {
      order.whatsapp = {
        status: "failed",
        messageId: "",
        error: String(error.message || "تعذر إرسال رسالة واتساب").slice(0, 500),
        sentAt: null,
      };
    }
    await order.save();
    return serialize(order);
  } catch (error) {
    await restoreStock(holds);
    if (order?._id) await Order.deleteOne({ _id: order._id });
    if (transferImage?.public_id) await deleteImage(transferImage.public_id);
    throw error;
  }
}

export async function listOrders(status) {
  const filter =
    status === "pending"
      ? { status: { $in: ["pending", "received", "cancelled"] } }
      : { status };
  const orders = await Order.find(filter).sort({ createdAt: -1 }).limit(200);
  return orders.map(serialize);
}

function phoneMatches(storedPhone, incomingPhone) {
  const stored = String(storedPhone || "").replace(/\D/g, "");
  const incoming = String(incomingPhone || "").replace(/\D/g, "");
  if (stored.length < 8 || incoming.length < 8) return false;
  return stored.endsWith(incoming.slice(-10)) || incoming.endsWith(stored.slice(-10));
}

export async function markOrderReceived(phone, nextStatus = "received") {
  const digits = String(phone || "").replace(/\D/g, "");
  if (digits.length < 8) throw new ApiError("رقم الهاتف غير صالح");

  const requested = String(nextStatus || "received").trim().toLowerCase();
  const status = requested === "canceled" || requested === "canceld" ? "cancelled" : requested;
  if (status !== "received" && status !== "cancelled") {
    throw new ApiError("الحالة يجب أن تكون received أو cancelled");
  }

  const orders = await Order.find({ status: { $in: ["pending", "received", "cancelled"] } })
    .sort({ createdAt: -1 })
    .limit(100);
  const order = orders.find((item) => phoneMatches(item.customerPhone, digits));
  if (!order) throw new ApiError("لا يوجد طلب معلّق لهذا الرقم", 404);

  order.status = status;
  order.whatsapp = {
    ...(order.whatsapp?.toObject?.() || order.whatsapp || {}),
    reply: status === "cancelled" ? "cancelled" : "confirmed",
    repliedAt: new Date(),
  };
  await order.save();

  return {
    _id: String(order._id),
    status: order.status,
    customerName: order.customerName,
    customerPhone: order.customerPhone,
  };
}

export async function completeOrder(id) {
  const order = await Order.findById(assertObjectId(id, "الطلب"));
  if (!order) throw new ApiError("الطلب غير موجود", 404);
  order.status = "completed";
  order.completedAt = new Date();
  await order.save();
  return serialize(order);
}

export async function deleteOrder(id) {
  const order = await Order.findById(assertObjectId(id, "الطلب"));
  if (!order) throw new ApiError("الطلب غير موجود", 404);
  await deleteImage(order.transferImage?.public_id);
  await order.deleteOne();
  return { _id: String(order._id) };
}

export async function applyWhatsappReply(phones, reply) {
  if (!reply || !phones?.length) return null;
  const needles = phones
    .map((phone) => String(phone).replace(/\D/g, ""))
    .filter((phone) => phone.length >= 8);

  const orders = await Order.find({ status: "pending" }).sort({ createdAt: -1 }).limit(100);
  const order = orders.find((item) => {
    const stored = String(item.customerPhone || "").replace(/\D/g, "");
    return needles.some(
      (phone) => stored.endsWith(phone.slice(-10)) || phone.endsWith(stored.slice(-10)),
    );
  });
  if (!order) return null;

  order.whatsapp = {
    ...(order.whatsapp?.toObject?.() || order.whatsapp || {}),
    reply,
    repliedAt: new Date(),
  };
  await order.save();
  return order._id;
}
