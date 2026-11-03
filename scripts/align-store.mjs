import fs from "fs";
import mongoose from "mongoose";

const env = fs.readFileSync(".env.local", "utf8");
const val = (key) => (env.match(new RegExp(`^${key}=(.*)$`, "m")) || [])[1]?.trim() || "";

await mongoose.connect(val("MONGO_URL"));
const categories = mongoose.connection.db.collection("categories");
const products = mongoose.connection.db.collection("products");
const all = await categories.find({}).toArray();
const byAr = new Map(all.map((category) => [category.nameAr, category]));
const imageSource = (byAr.get("الرجال") || byAr.get("رجال") || byAr.get("مستلزمات"))?.image;

function imageFor(slug) {
  return {
    url: imageSource?.url || "",
    public_id: `dar-alatba/categories/placeholder-${slug}`,
  };
}

async function ensureMain(nameAr, nameEn, descriptionAr, descriptionEn, slug) {
  const existing = await categories.findOne({ nameAr });
  if (existing) {
    await categories.updateOne(
      { _id: existing._id },
      { $set: { nameEn, isActive: true, parent: null, updatedAt: new Date() } },
    );
    return existing._id;
  }
  const created = await categories.insertOne({
    nameAr,
    nameEn,
    descriptionAr,
    descriptionEn,
    parent: null,
    isActive: true,
    image: imageFor(slug),
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  return created.insertedId;
}

const menOld = byAr.get("الرجال") || byAr.get("رجال");
const womenOld = byAr.get("النساء") || byAr.get("نساء");
if (menOld) {
  await categories.updateOne(
    { _id: menOld._id },
    { $set: { nameAr: "رجال", nameEn: "Men", isActive: true, parent: null } },
  );
}
if (womenOld) {
  await categories.updateOne(
    { _id: womenOld._id },
    { $set: { nameAr: "نساء", nameEn: "Women", isActive: true, parent: null } },
  );
}
const supplies = byAr.get("مستلزمات");
if (supplies) {
  await categories.updateOne(
    { _id: supplies._id },
    { $set: { nameEn: "Supplies", isActive: true, parent: null } },
  );
}

const menId = menOld?._id || (await ensureMain("رجال", "Men", "سكراب وملابس رجالية", "Men's scrubs", "men"));
const womenId = womenOld?._id || (await ensureMain("نساء", "Women", "سكراب وملابس نسائية", "Women's scrubs", "women"));
const coatsId = await ensureMain("بالطو", "Coats", "بالطو طبية", "Medical coats", "coats");
const shoesId = await ensureMain("أحذية", "Shoes", "أحذية طبية", "Medical shoes", "shoes");
const keep = [menId, womenId, supplies?._id, coatsId, shoesId].filter(Boolean);
await categories.updateMany({ _id: { $nin: keep } }, { $set: { isActive: false } });

function brandFor(name) {
  if (/وندر وينك|wonder/i.test(name)) return ["وندر وينك", "WonderWink"];
  if (/هيلينج|هيلينا هاند|healing/i.test(name)) return ["هيلينج هاندز", "Healing Hands"];
  if (/شروك|cherokee/i.test(name)) return ["شيروكي", "Cherokee"];
  if (/رويال|royal/i.test(name)) return ["رويال", "Royal"];
  return ["", ""];
}

function isWomen(name) {
  return /حريمي|فيميل|هيلين|شروك|female|juliet|monica|helena|cherokee/i.test(name);
}

function sizeStock(stocks) {
  const max = Math.max(...stocks);
  const sold = stocks.reduce((sum, stock) => sum + (max - stock), 0);
  return Math.max(0, max - sold);
}

const list = await products.find({}).toArray();
for (const product of list) {
  const sourceName = `${product.nameAr} ${product.nameEn}`;
  const [brandAr, brandEn] = brandFor(sourceName);
  let nameAr = product.nameAr;
  let nameEn = product.nameEn;
  if (/جوليت|juliet/i.test(sourceName)) {
    nameAr = "طقم هيلينج هاندز جوليت";
    nameEn = "Healing Hands Juliet Set";
  } else if (/مونيكا|monica/i.test(sourceName)) {
    nameAr = "طقم هيلينج هاندز مونيكا";
    nameEn = "Healing Hands Monica Set";
  }

  const update = {
    nameAr,
    nameEn,
    brandAr,
    brandEn,
    isSet: true,
    category: isWomen(sourceName) ? womenId : menId,
    colors: [],
  };

  const hasColorMatrix = (product.variants || []).some((variant) => variant.color);
  if (hasColorMatrix) {
    const bySize = new Map();
    for (const variant of product.variants || []) {
      const key = String(variant.size);
      const stocks = bySize.get(key) || [];
      stocks.push(Number(variant.stock) || 0);
      bySize.set(key, stocks);
    }
    let stock = 0;
    update.variants = [...bySize.entries()].map(([size, stocks]) => {
      const next = sizeStock(stocks);
      stock += next;
      return {
        _id: new mongoose.Types.ObjectId(),
        size: new mongoose.Types.ObjectId(size),
        color: null,
        stock: next,
      };
    });
    update.stock = stock;
  }

  if (!product.compareAtPrice) {
    update.compareAtPrice = product.price;
    update.price = Math.round(product.price * 0.85);
  }

  await products.updateOne({ _id: product._id }, { $set: update });
  console.log(nameAr, update.price ?? product.price, "variants", update.variants?.length ?? "kept");
}

console.log("categories", keep.map(String).join(","));
await mongoose.disconnect();
