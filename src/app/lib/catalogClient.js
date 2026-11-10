export function parentIdOf(category) {
  if (!category?.parent) return null;
  if (typeof category.parent === "object") return category.parent._id || null;
  return category.parent;
}

export function isMainCategory(category) {
  return !parentIdOf(category);
}

export function productCategoryId(product) {
  if (!product?.category) return "";
  if (typeof product.category === "object") return product.category._id || "";
  return product.category;
}

export function categoryName(category) {
  return category?.nameAr || category?.name || "";
}

export function categoryEnglishName(category) {
  return category?.nameEn || "";
}

export function visibleCategories(categories) {
  const active = categories.filter((category) => category.isActive !== false);
  const byId = new Map(active.map((category) => [category._id, category]));
  return active.filter((category) => {
    let parentId = parentIdOf(category);
    const seen = new Set();
    while (parentId) {
      if (seen.has(parentId)) return false;
      seen.add(parentId);
      const parent = byId.get(parentId);
      if (!parent) return false;
      parentId = parentIdOf(parent);
    }
    return true;
  });
}

export function categoryMatchIds(categoryId, categories) {
  if (!categoryId || categoryId === "all") return null;
  const category = categories.find((item) => item._id === categoryId);
  if (!category) return new Set([categoryId]);

  const ids = new Set([categoryId]);
  const queue = [categoryId];
  while (queue.length) {
    const current = queue.shift();
    categories.forEach((item) => {
      if (parentIdOf(item) === current && !ids.has(item._id)) {
        ids.add(item._id);
        queue.push(item._id);
      }
    });
  }
  return ids;
}

export function productInCategory(product, categoryId, categories) {
  const ids = categoryMatchIds(categoryId, categories);
  if (!ids) return true;
  return ids.has(productCategoryId(product));
}

export function countProductsInCategory(products, categoryId, categories) {
  return products.filter((product) =>
    productInCategory(product, categoryId, categories),
  ).length;
}

export function productHasVariants(product) {
  return Boolean(product?.colors?.length || product?.sizes?.length || product?.variants?.length);
}

export function optionLabel(option) {
  if (!option) return "";
  const arabic = option.nameAr || option.name || "";
  const english = option.nameEn && option.nameEn !== arabic ? option.nameEn : "";
  return english ? `${arabic} / ${english}` : arabic;
}

export function findVariant(product, sizeId, colorId) {
  return (product?.variants || []).find((variant) => {
    const variantSize = variant.size?._id || variant.size || "";
    const variantColor = variant.color?._id || variant.color || "";
    return String(variantSize || "") === String(sizeId || "") &&
      String(variantColor || "") === String(colorId || "");
  });
}

export function buildCartItem({
  productId,
  name,
  image,
  price,
  quantity = 1,
  size,
  color,
}) {
  const sizeId = size?._id || "";
  const colorId = color?._id || "";
  const hasVariant = Boolean(sizeId || colorId);
  const variantText = [optionLabel(size), optionLabel(color)].filter(Boolean).join(" / ");

  return {
    id: hasVariant ? `${productId}__${sizeId || "none"}__${colorId || "none"}` : productId,
    productId,
    title: variantText ? `${name} — ${variantText}` : name,
    image,
    price: Number(price),
    quantity,
    sizeId,
    colorId,
    sizeName: optionLabel(size),
    colorName: optionLabel(color),
  };
}
