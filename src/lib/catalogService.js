import mongoose from "mongoose";
import { deleteImage, uploadImage } from "./cloudinary";
import {
  fileList,
  firstFile,
  parseBoolean,
  parseJsonField,
  requiredText,
  textValue,
} from "./body";
import { ApiError } from "./http";
import { Category, Color, Product, Size } from "./models";

const productPopulate = [
  {
    path: "category",
    select: "nameAr nameEn descriptionAr descriptionEn parent isActive image",
    populate: { path: "parent", select: "nameAr nameEn isActive" },
  },
  { path: "colors", select: "nameAr nameEn hex isActive" },
  { path: "sizes", select: "nameAr nameEn sortOrder isActive" },
  { path: "variants.color", select: "nameAr nameEn hex isActive" },
  { path: "variants.size", select: "nameAr nameEn sortOrder isActive" },
];

function idOf(value) {
  if (!value) return null;
  if (typeof value === "object" && value._id) return String(value._id);
  return String(value);
}

function assertObjectId(value, label) {
  const id = textValue(value);
  if (!mongoose.isValidObjectId(id)) throw new ApiError(`${label} غير صالح`);
  return id;
}

function serializeImage(image) {
  if (!image?.url) return null;
  return { url: image.url, public_id: image.public_id };
}

function serializeCategory(category) {
  if (!category) return null;
  const parentDoc =
    category.parent && typeof category.parent === "object" && category.parent.nameAr
      ? category.parent
      : null;

  return {
    _id: String(category._id),
    name: category.nameAr,
    nameAr: category.nameAr,
    nameEn: category.nameEn,
    description: category.descriptionAr,
    descriptionAr: category.descriptionAr,
    descriptionEn: category.descriptionEn,
    parent: parentDoc
      ? {
          _id: String(parentDoc._id),
          name: parentDoc.nameAr,
          nameAr: parentDoc.nameAr,
          nameEn: parentDoc.nameEn,
          isActive: parentDoc.isActive !== false,
        }
      : category.parent
        ? String(category.parent)
        : null,
    isMain: !category.parent,
    isActive: category.isActive !== false,
    image: serializeImage(category.image),
    createdAt: category.createdAt,
    updatedAt: category.updatedAt,
  };
}

function serializeOption(option) {
  return {
    _id: String(option._id),
    nameAr: option.nameAr,
    nameEn: option.nameEn,
    name: option.nameAr,
    hex: option.hex,
    sortOrder: option.sortOrder ?? 0,
    isActive: option.isActive !== false,
  };
}

function categoryPath(category) {
  if (!category) return "";
  const own = category.nameAr || category.name || "";
  const parentName = category.parent?.nameAr || category.parent?.name;
  return parentName ? `${parentName} / ${own}` : own;
}

function serializeProduct(product) {
  const category =
    product.category && typeof product.category === "object" && product.category.nameAr
      ? serializeCategory(product.category)
      : product.category
        ? String(product.category)
        : null;

  const colors = (product.colors || [])
    .filter((color) => color && typeof color === "object" && color.nameAr)
    .map(serializeOption);
  const sizes = (product.sizes || [])
    .filter((size) => size && typeof size === "object" && size.nameAr)
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
    .map(serializeOption);

  const variants = (product.variants || []).map((variant) => ({
    _id: String(variant._id),
    stock: variant.stock ?? 0,
    size:
      variant.size && typeof variant.size === "object" && variant.size.nameAr
        ? serializeOption(variant.size)
        : variant.size
          ? String(variant.size)
          : null,
    color:
      variant.color && typeof variant.color === "object" && variant.color.nameAr
        ? serializeOption(variant.color)
        : variant.color
          ? String(variant.color)
          : null,
  }));

  return {
    _id: String(product._id),
    name: product.nameAr,
    nameAr: product.nameAr,
    nameEn: product.nameEn,
    description: product.descriptionAr,
    descriptionAr: product.descriptionAr,
    descriptionEn: product.descriptionEn,
    price: product.price,
    stock: product.stock ?? 0,
    isActive: product.isActive !== false,
    category,
    categoryPath: typeof category === "object" ? categoryPath(product.category) : "",
    images: (product.images || []).map(serializeImage).filter(Boolean),
    colors,
    sizes,
    variants,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  };
}

async function loadProducts(filter = {}) {
  const products = await Product.find(filter)
    .populate(productPopulate)
    .sort({ createdAt: -1 });
  return products.map(serializeProduct);
}

function bilingualNames(fields, arabicLabel, englishLabel, max = 160) {
  const nameAr = requiredText(
    fields.nameAr ?? fields.name,
    arabicLabel,
    max,
  );
  const nameEn = requiredText(fields.nameEn ?? fields.name, englishLabel, max);
  return { nameAr, nameEn };
}

function bilingualDescriptions(fields) {
  const descriptionAr = requiredText(
    fields.descriptionAr ?? fields.description,
    "الوصف العربي",
    4000,
  );
  const descriptionEn = requiredText(
    fields.descriptionEn ?? fields.description,
    "الوصف الإنجليزي",
    4000,
  );
  return { descriptionAr, descriptionEn };
}

function parsePrice(value) {
  const price = Number(textValue(value));
  if (!Number.isFinite(price) || price < 0) throw new ApiError("السعر غير صالح");
  return Math.round(price * 100) / 100;
}

function parseStock(value, label) {
  if (value === undefined || value === null || textValue(value) === "") {
    throw new ApiError(`${label} مطلوبة`);
  }
  const stock = Number(textValue(value));
  if (!Number.isInteger(stock) || stock < 0) {
    throw new ApiError(`${label} يجب أن تكون عدداً صحيحاً يبدأ من صفر`);
  }
  return stock;
}

function parseHex(value) {
  const hex = textValue(value) || "#1e201e";
  if (!/^#[0-9a-fA-F]{6}$/.test(hex)) {
    throw new ApiError("كود اللون يجب أن يكون بصيغة #RRGGBB");
  }
  return hex.toLowerCase();
}

function idList(value) {
  const parsed = parseJsonField(value, []);
  if (!Array.isArray(parsed)) throw new ApiError("قائمة الألوان أو المقاسات غير صالحة");
  return [...new Set(parsed.filter(Boolean).map((id) => assertObjectId(id, "المعرف")))];
}

async function resolveParent(parentValue, currentId) {
  const parentText = textValue(parentValue);
  if (!parentText) return null;

  const parentId = assertObjectId(parentText, "القسم الرئيسي");
  if (currentId && parentId === String(currentId)) {
    throw new ApiError("لا يمكن جعل القسم أباً لنفسه");
  }

  const parent = await Category.findById(parentId);
  if (!parent) throw new ApiError("القسم الرئيسي غير موجود", 404);
  if (parent.parent) {
    throw new ApiError("يمكن إضافة الأقسام الفرعية تحت قسم رئيسي فقط");
  }

  if (currentId) {
    const childCount = await Category.countDocuments({ parent: currentId });
    if (childCount > 0) {
      throw new ApiError("لا يمكن تحويل قسم يحتوي أقساماً فرعية إلى قسم فرعي");
    }
  }

  return parent._id;
}

async function assertUniqueCategory(nameAr, nameEn, parent, excludeId) {
  const existing = await Category.findOne({
    parent: parent || null,
    $or: [{ nameAr }, { nameEn }],
    ...(excludeId ? { _id: { $ne: excludeId } } : {}),
  });
  if (existing) {
    throw new ApiError("يوجد قسم بنفس الاسم العربي أو الإنجليزي في هذا المستوى");
  }
}

async function categoryIdsFor(categoryId) {
  const id = assertObjectId(categoryId, "القسم");
  const category = await Category.findById(id);
  if (!category) throw new ApiError("القسم غير موجود", 404);

  if (category.parent) return [category._id];

  const children = await Category.find({ parent: category._id }).select("_id");
  return [category._id, ...children.map((child) => child._id)];
}

function buildVariants(fields) {
  const colorIds = idList(fields.colorIds);
  const sizeIds = idList(fields.sizeIds);
  const usesMatrix = colorIds.length > 0 || sizeIds.length > 0;

  if (!usesMatrix) {
    const stock =
      fields.stock === undefined || textValue(fields.stock) === ""
        ? 0
        : parseStock(fields.stock, "كمية المخزون");
    return { colorIds, sizeIds, variants: [], stock };
  }

  const rawVariants = parseJsonField(fields.variants, []);
  if (!Array.isArray(rawVariants)) throw new ApiError("جدول الكميات غير صالح");

  const sizes = sizeIds.length ? sizeIds : [null];
  const colors = colorIds.length ? colorIds : [null];
  const expected = [];

  for (const sizeId of sizes) {
    for (const colorId of colors) {
      const match = rawVariants.find((variant) => {
        const variantSize = variant.sizeId || variant.size || null;
        const variantColor = variant.colorId || variant.color || null;
        return (
          (variantSize ? String(variantSize) : null) === (sizeId || null) &&
          (variantColor ? String(variantColor) : null) === (colorId || null)
        );
      });
      if (!match) {
        throw new ApiError("أدخل كمية كل مقاس مع كل لون قبل الحفظ");
      }
      expected.push({
        size: sizeId,
        color: colorId,
        stock: parseStock(match.stock, "كمية القطعة"),
      });
    }
  }

  if (rawVariants.length !== expected.length) {
    throw new ApiError("جدول الكميات يحتوي خانات زيادة أو نقص");
  }

  return {
    colorIds,
    sizeIds,
    variants: expected,
    stock: expected.reduce((total, variant) => total + variant.stock, 0),
  };
}

async function assertOptionsExist(colorIds, sizeIds) {
  if (colorIds.length) {
    const count = await Color.countDocuments({ _id: { $in: colorIds } });
    if (count !== colorIds.length) throw new ApiError("أحد الألوان المختارة غير موجود");
  }
  if (sizeIds.length) {
    const count = await Size.countDocuments({ _id: { $in: sizeIds } });
    if (count !== sizeIds.length) throw new ApiError("أحد المقاسات المختارة غير موجود");
  }
}

export async function listCategories() {
  const categories = await Category.find()
    .populate("parent", "nameAr nameEn isActive")
    .sort({ createdAt: 1 });
  return categories.map(serializeCategory);
}

export async function addCategory(fields, files) {
  const names = bilingualNames(fields, "اسم القسم بالعربية", "اسم القسم بالإنجليزية");
  const descriptions = bilingualDescriptions(fields);
  const parent = await resolveParent(fields.parent);
  await assertUniqueCategory(names.nameAr, names.nameEn, parent);

  const imageFile = firstFile(files, "image");
  if (!imageFile) throw new ApiError("صورة القسم مطلوبة");

  const image = await uploadImage(imageFile, "dar-alatba/categories");
  const category = await Category.create({
    ...names,
    ...descriptions,
    parent,
    isActive: parseBoolean(fields.isActive, true),
    image,
  });
  await category.populate("parent", "nameAr nameEn isActive");
  return serializeCategory(category);
}

export async function updateCategory(id, fields, files) {
  const categoryId = assertObjectId(id, "القسم");
  const category = await Category.findById(categoryId);
  if (!category) throw new ApiError("القسم غير موجود", 404);

  const names = bilingualNames(fields, "اسم القسم بالعربية", "اسم القسم بالإنجليزية");
  const descriptions = bilingualDescriptions(fields);
  const parent = await resolveParent(fields.parent, categoryId);
  await assertUniqueCategory(names.nameAr, names.nameEn, parent, categoryId);

  const imageFile = firstFile(files, "image");
  let image = category.image;
  if (imageFile) {
    const uploaded = await uploadImage(imageFile, "dar-alatba/categories");
    await deleteImage(category.image?.public_id);
    image = uploaded;
  }
  if (!image?.url) throw new ApiError("صورة القسم مطلوبة");

  category.set({
    ...names,
    ...descriptions,
    parent,
    isActive: parseBoolean(fields.isActive, category.isActive),
    image,
  });
  await category.save();
  await category.populate("parent", "nameAr nameEn isActive");
  return serializeCategory(category);
}

export async function removeCategory(id) {
  const categoryId = assertObjectId(id, "القسم");
  const category = await Category.findById(categoryId);
  if (!category) throw new ApiError("القسم غير موجود", 404);

  const children = await Category.find({ parent: category._id });
  const ids = [category._id, ...children.map((child) => child._id)];
  const products = await Product.find({ category: { $in: ids } });

  await Promise.all(
    products.flatMap((product) =>
      (product.images || []).map((image) => deleteImage(image.public_id)),
    ),
  );
  await Product.deleteMany({ category: { $in: ids } });
  await Promise.all(
    [category, ...children].map((item) => deleteImage(item.image?.public_id)),
  );
  await Category.deleteMany({ _id: { $in: ids } });
  return { deletedProducts: products.length, deletedCategories: ids.length };
}

export async function listProducts(categoryId) {
  if (!categoryId) return loadProducts();
  const ids = await categoryIdsFor(categoryId);
  return loadProducts({ category: { $in: ids } });
}

export async function getProduct(id) {
  const productId = assertObjectId(id, "المنتج");
  const product = await Product.findById(productId).populate(productPopulate);
  if (!product) throw new ApiError("المنتج غير موجود", 404);
  return serializeProduct(product);
}

async function productPayload(fields, files, current) {
  const names = bilingualNames(fields, "اسم المنتج بالعربية", "اسم المنتج بالإنجليزية");
  const descriptions = bilingualDescriptions(fields);
  const categoryId = assertObjectId(fields.category, "القسم");
  const category = await Category.findById(categoryId);
  if (!category) throw new ApiError("القسم المختار غير موجود", 404);

  const matrix = buildVariants(fields);
  await assertOptionsExist(matrix.colorIds, matrix.sizeIds);

  const incomingImages = fileList(files, "images");
  if (incomingImages.length > 5) throw new ApiError("يمكنك رفع 5 صور كحد أقصى");

  let images = current?.images || [];
  if (!current || incomingImages.length > 0) {
    if (incomingImages.length === 0) throw new ApiError("يجب رفع صورة واحدة على الأقل للمنتج");
    const uploaded = [];
    for (const file of incomingImages) {
      uploaded.push(await uploadImage(file, "dar-alatba/products"));
    }
    if (current) {
      await Promise.all((current.images || []).map((image) => deleteImage(image.public_id)));
    }
    images = uploaded;
  }
  if (!images.length) throw new ApiError("يجب رفع صورة واحدة على الأقل للمنتج");

  return {
    ...names,
    ...descriptions,
    price: parsePrice(fields.price),
    stock: matrix.stock,
    category: category._id,
    isActive: parseBoolean(fields.isActive, true),
    images,
    colors: matrix.colorIds,
    sizes: matrix.sizeIds,
    variants: matrix.variants,
  };
}

export async function addProduct(fields, files) {
  const payload = await productPayload(fields, files);
  const product = await Product.create(payload);
  await product.populate(productPopulate);
  return serializeProduct(product);
}

export async function updateProduct(id, fields, files) {
  const productId = assertObjectId(id, "المنتج");
  const product = await Product.findById(productId);
  if (!product) throw new ApiError("المنتج غير موجود", 404);

  const payload = await productPayload(fields, files, product);
  product.set(payload);
  await product.save();
  await product.populate(productPopulate);
  return serializeProduct(product);
}

export async function removeProduct(id) {
  const productId = assertObjectId(id, "المنتج");
  const product = await Product.findById(productId);
  if (!product) throw new ApiError("المنتج غير موجود", 404);
  await Promise.all((product.images || []).map((image) => deleteImage(image.public_id)));
  await product.deleteOne();
  return { _id: productId };
}

async function assertUniqueOption(Model, nameAr, nameEn, excludeId, label) {
  const existing = await Model.findOne({
    $or: [{ nameAr }, { nameEn }],
    ...(excludeId ? { _id: { $ne: excludeId } } : {}),
  });
  if (existing) throw new ApiError(`يوجد ${label} بنفس الاسم العربي أو الإنجليزي`);
}

export async function listColors() {
  const colors = await Color.find().sort({ nameAr: 1 });
  return colors.map(serializeOption);
}

export async function addColor(fields) {
  const names = bilingualNames(fields, "اسم اللون بالعربية", "اسم اللون بالإنجليزية", 60);
  await assertUniqueOption(Color, names.nameAr, names.nameEn, null, "لون");
  const color = await Color.create({
    ...names,
    hex: parseHex(fields.hex),
    isActive: parseBoolean(fields.isActive, true),
  });
  return serializeOption(color);
}

export async function updateColor(id, fields) {
  const colorId = assertObjectId(id, "اللون");
  const color = await Color.findById(colorId);
  if (!color) throw new ApiError("اللون غير موجود", 404);
  const names = bilingualNames(fields, "اسم اللون بالعربية", "اسم اللون بالإنجليزية", 60);
  await assertUniqueOption(Color, names.nameAr, names.nameEn, colorId, "لون");
  color.set({
    ...names,
    hex: parseHex(fields.hex ?? color.hex),
    isActive: parseBoolean(fields.isActive, color.isActive),
  });
  await color.save();
  return serializeOption(color);
}

export async function removeColor(id) {
  const colorId = assertObjectId(id, "اللون");
  const used = await Product.exists({
    $or: [{ colors: colorId }, { "variants.color": colorId }],
  });
  if (used) throw new ApiError("لا يمكن حذف اللون لأنه مستخدم في منتج");
  const color = await Color.findByIdAndDelete(colorId);
  if (!color) throw new ApiError("اللون غير موجود", 404);
  return { _id: colorId };
}

export async function listSizes() {
  const sizes = await Size.find().sort({ sortOrder: 1, nameAr: 1 });
  return sizes.map(serializeOption);
}

export async function addSize(fields) {
  const names = bilingualNames(fields, "اسم المقاس بالعربية", "اسم المقاس بالإنجليزية", 40);
  await assertUniqueOption(Size, names.nameAr, names.nameEn, null, "مقاس");
  const last = await Size.findOne().sort({ sortOrder: -1 }).select("sortOrder");
  const size = await Size.create({
    ...names,
    sortOrder: (last?.sortOrder ?? 0) + 1,
    isActive: parseBoolean(fields.isActive, true),
  });
  return serializeOption(size);
}

export async function updateSize(id, fields) {
  const sizeId = assertObjectId(id, "المقاس");
  const size = await Size.findById(sizeId);
  if (!size) throw new ApiError("المقاس غير موجود", 404);
  const names = bilingualNames(fields, "اسم المقاس بالعربية", "اسم المقاس بالإنجليزية", 40);
  await assertUniqueOption(Size, names.nameAr, names.nameEn, sizeId, "مقاس");
  size.set({
    ...names,
    isActive: parseBoolean(fields.isActive, size.isActive),
  });
  await size.save();
  return serializeOption(size);
}

export async function removeSize(id) {
  const sizeId = assertObjectId(id, "المقاس");
  const used = await Product.exists({
    $or: [{ sizes: sizeId }, { "variants.size": sizeId }],
  });
  if (used) throw new ApiError("لا يمكن حذف المقاس لأنه مستخدم في منتج");
  const size = await Size.findByIdAndDelete(sizeId);
  if (!size) throw new ApiError("المقاس غير موجود", 404);
  return { _id: sizeId };
}

export function variantKey(sizeId, colorId) {
  return `${sizeId || ""}|${colorId || ""}`;
}

export { idOf };
