"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { isMainCategory, optionLabel, parentIdOf, productCategoryId } from "../lib/catalogClient";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "";

const EMPTY_FORM = {
  nameAr: "",
  nameEn: "",
  descriptionAr: "",
  descriptionEn: "",
  price: "",
  stock: "",
  category: "",
  isActive: true,
  colorIds: [],
  sizeIds: [],
  variantStock: {},
  images: [],
  imagesChanged: false,
};

async function apiRequest(path, options) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      Accept: "application/json",
      ...options?.headers,
    },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.message || "تعذر إتمام الطلب، حاول مرة أخرى");
  }
  return payload;
}

function variantKey(sizeId, colorId) {
  return `${sizeId || ""}|${colorId || ""}`;
}

function imageItemFromFile(file) {
  return {
    id: `${file.name}-${file.lastModified}-${Math.random()}`,
    url: URL.createObjectURL(file),
    file,
    isExisting: false,
  };
}

async function existingImageToFile(image, index) {
  const response = await fetch(image.url);
  if (!response.ok) throw new Error("تعذر تجهيز إحدى الصور الحالية. حاول مرة أخرى.");
  const blob = await response.blob();
  const extension = blob.type.split("/")[1]?.split("+")[0] || "jpg";
  return new File([blob], `product-image-${index + 1}.${extension}`, {
    type: blob.type || "image/jpeg",
  });
}

function categoryPath(product) {
  if (product.categoryPath) return product.categoryPath;
  if (typeof product.category === "object") {
    const parent = product.category.parent?.nameAr || product.category.parent?.name;
    const name = product.category.nameAr || product.category.name;
    return parent ? `${parent} / ${name}` : name || "";
  }
  return "";
}

export default function ProductsPanel({ onCountChange }) {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [colors, setColors] = useState([]);
  const [sizes, setSizes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [editingProduct, setEditingProduct] = useState(null);
  const [viewingProduct, setViewingProduct] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSuggestOpen, setIsSuggestOpen] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState(-1);
  const searchWrapRef = useRef(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const [productsResponse, categoriesResponse, colorsResponse, sizesResponse] = await Promise.all([
        apiRequest("/getAllProducts"),
        apiRequest("/getAllCategories"),
        apiRequest("/getAllColors"),
        apiRequest("/getAllSizes"),
      ]);
      const loadedProducts = productsResponse.data || [];
      setProducts(loadedProducts);
      setCategories(categoriesResponse.data || []);
      setColors(colorsResponse.data || []);
      setSizes(sizesResponse.data || []);
      onCountChange?.(loadedProducts.length);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsLoading(false);
    }
  }, [onCountChange]);

  useEffect(() => {
    void Promise.resolve().then(loadData);
  }, [loadData]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchWrapRef.current && !searchWrapRef.current.contains(event.target)) {
        setIsSuggestOpen(false);
        setActiveSuggestion(-1);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const normalizedSearch = searchQuery.trim().toLowerCase();
  const filteredProducts = useMemo(() => {
    if (!normalizedSearch) return products;
    return products.filter((product) => {
      const haystack = [
        product.nameAr,
        product.nameEn,
        product.name,
        product.descriptionAr,
        product.descriptionEn,
        product.description,
        categoryPath(product),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(normalizedSearch);
    });
  }, [products, normalizedSearch]);

  const autocompleteSuggestions = useMemo(() => {
    if (!normalizedSearch) return [];
    return products
      .filter((product) =>
        `${product.nameAr || ""} ${product.nameEn || ""} ${product.name || ""}`
          .toLowerCase()
          .includes(normalizedSearch),
      )
      .slice(0, 8);
  }, [products, normalizedSearch]);

  const mainCategories = categories.filter(isMainCategory);
  const selectedSizes = sizes.filter((size) => form.sizeIds.includes(size._id));
  const selectedColors = colors.filter((color) => form.colorIds.includes(color._id));
  const usesMatrix = selectedSizes.length > 0 || selectedColors.length > 0;
  const matrixRows = selectedSizes.length ? selectedSizes : [{ _id: "", nameAr: "الكمية" }];
  const matrixColumns = selectedColors.length ? selectedColors : [{ _id: "", nameAr: "الكمية" }];

  const showNotice = (message) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 3500);
  };

  const openAddProduct = () => {
    const firstCategory = categories.find((category) => category.isActive !== false) || categories[0];
    setError("");
    setViewingProduct(null);
    setForm({ ...EMPTY_FORM, category: firstCategory?._id || "" });
    setEditingProduct("new");
  };

  const formFromProduct = (product) => ({
    nameAr: product.nameAr || product.name || "",
    nameEn: product.nameEn || "",
    descriptionAr: product.descriptionAr || product.description || "",
    descriptionEn: product.descriptionEn || "",
    price: product.price ?? "",
    stock: product.variants?.length ? "" : (product.stock ?? ""),
    category: productCategoryId(product),
    isActive: product.isActive !== false,
    colorIds: (product.colors || []).map((color) => color._id).filter(Boolean),
    sizeIds: (product.sizes || []).map((size) => size._id).filter(Boolean),
    variantStock: Object.fromEntries(
      (product.variants || []).map((variant) => [
        variantKey(variant.size?._id || "", variant.color?._id || ""),
        String(variant.stock ?? 0),
      ]),
    ),
    images: (product.images || []).map((image, index) => ({
      id: image.public_id || image.url || `existing-${index}`,
      url: image.url,
      publicId: image.public_id,
      file: null,
      isExisting: true,
    })),
    imagesChanged: false,
  });

  const openEditProduct = (product) => {
    setError("");
    setIsSuggestOpen(false);
    setViewingProduct(null);
    setForm(formFromProduct(product));
    setEditingProduct(product);
  };

  const closeModal = () => {
    if (!isSaving) {
      setEditingProduct(null);
      setError("");
    }
  };

  const toggleOption = (field, id) => {
    setForm((current) => {
      const exists = current[field].includes(id);
      return {
        ...current,
        [field]: exists ? current[field].filter((item) => item !== id) : [...current[field], id],
      };
    });
  };

  const setVariantStock = (sizeId, colorId, value) => {
    setForm((current) => ({
      ...current,
      variantStock: { ...current.variantStock, [variantKey(sizeId, colorId)]: value },
    }));
  };

  const handleImagesChange = (event) => {
    const selectedImages = Array.from(event.target.files || []);
    setError("");
    setForm((current) => ({
      ...current,
      images: [...current.images, ...selectedImages.map(imageItemFromFile)],
      imagesChanged: true,
    }));
    event.target.value = "";
  };

  const removeImage = (imageId) => {
    setForm((current) => {
      const image = current.images.find((item) => item.id === imageId);
      if (image && !image.isExisting) URL.revokeObjectURL(image.url);
      return {
        ...current,
        images: current.images.filter((item) => item.id !== imageId),
        imagesChanged: true,
      };
    });
  };

  const replaceImage = (imageId, file) => {
    if (!file) return;
    setForm((current) => ({
      ...current,
      images: current.images.map((image) => {
        if (image.id !== imageId) return image;
        if (!image.isExisting) URL.revokeObjectURL(image.url);
        return imageItemFromFile(file);
      }),
      imagesChanged: true,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const isNew = editingProduct === "new";
    if (
      !form.nameAr.trim() ||
      !form.nameEn.trim() ||
      !form.descriptionAr.trim() ||
      !form.descriptionEn.trim() ||
      form.price === "" ||
      !form.category
    ) {
      setError("الاسم والوصف باللغتين والسعر والقسم مطلوبة");
      return;
    }
    if (form.images.length === 0) {
      setError("يجب رفع صورة واحدة على الأقل للمنتج");
      return;
    }

    const rowIds = form.sizeIds.length ? form.sizeIds : [""];
    const columnIds = form.colorIds.length ? form.colorIds : [""];
    const variants = [];
    if (form.sizeIds.length || form.colorIds.length) {
      for (const sizeId of rowIds) {
        for (const colorId of columnIds) {
          const raw = form.variantStock[variantKey(sizeId, colorId)];
          if (raw === undefined || raw === "" || !Number.isInteger(Number(raw)) || Number(raw) < 0) {
            setError("أدخل كمية صحيحة لكل مقاس مع كل لون");
            return;
          }
          variants.push({
            sizeId: sizeId || null,
            colorId: colorId || null,
            stock: Number(raw),
          });
        }
      }
    } else if (form.stock !== "" && (!Number.isInteger(Number(form.stock)) || Number(form.stock) < 0)) {
      setError("كمية المخزون يجب أن تكون عدداً صحيحاً");
      return;
    }

    const formData = new FormData();
    formData.append("nameAr", form.nameAr.trim());
    formData.append("nameEn", form.nameEn.trim());
    formData.append("descriptionAr", form.descriptionAr.trim());
    formData.append("descriptionEn", form.descriptionEn.trim());
    formData.append("price", form.price);
    formData.append("category", form.category);
    formData.append("isActive", String(form.isActive));
    formData.append("colorIds", JSON.stringify(form.colorIds));
    formData.append("sizeIds", JSON.stringify(form.sizeIds));
    formData.append("variants", JSON.stringify(variants));
    if (!form.sizeIds.length && !form.colorIds.length) {
      formData.append("stock", form.stock === "" ? "0" : form.stock);
    }

    setIsSaving(true);
    setError("");
    try {
      if (isNew || form.imagesChanged) {
        const finalImages = await Promise.all(
          form.images.map((image, index) => (image.file ? image.file : existingImageToFile(image, index))),
        );
        finalImages.forEach((image) => formData.append("images", image));
      }
      await apiRequest(isNew ? "/addProduct" : `/updateProduct/${editingProduct._id}`, {
        method: isNew ? "POST" : "PUT",
        body: formData,
      });
      setEditingProduct(null);
      await loadData();
      showNotice(isNew ? "تمت إضافة المنتج وربطه بالقسم" : "تم تعديل المنتج بنجاح");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (product) => {
    const name = product.nameAr || product.name;
    if (!window.confirm(`هل أنت متأكد من حذف المنتج "${name}" نهائياً؟`)) return;
    setError("");
    try {
      await apiRequest(`/deleteProduct/${product._id}`, { method: "DELETE" });
      if (viewingProduct?._id === product._id) setViewingProduct(null);
      await loadData();
      showNotice("تم حذف المنتج وصوره بنجاح");
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const handleSearchKeyDown = (event) => {
    if (!isSuggestOpen || autocompleteSuggestions.length === 0) {
      if (event.key === "Escape") setIsSuggestOpen(false);
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveSuggestion((current) => (current < autocompleteSuggestions.length - 1 ? current + 1 : 0));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveSuggestion((current) => (current > 0 ? current - 1 : autocompleteSuggestions.length - 1));
    } else if (event.key === "Enter" && activeSuggestion >= 0) {
      event.preventDefault();
      openEditProduct(autocompleteSuggestions[activeSuggestion]);
    } else if (event.key === "Escape") {
      setIsSuggestOpen(false);
      setActiveSuggestion(-1);
    }
  };

  const selectableColors = colors.filter((color) => color.isActive !== false || form.colorIds.includes(color._id));
  const selectableSizes = sizes.filter((size) => size.isActive !== false || form.sizeIds.includes(size._id));

  return (
    <section className="backend-products-panel">
      <div className="panel-header products-panel-header">
        <div>
          <h2 className="font-serif text-2xl font-bold text-[#0f3b2e] m-0">إدارة منتجات المتجر</h2>
          <p className="categories-subtitle">
            إضافة وتعديل وحذف وعرض التفاصيل، مع الاسم والوصف بالعربي والإنجليزي وكمية كل لون داخل كل مقاس.
          </p>
        </div>
        <button
          type="button"
          onClick={openAddProduct}
          className="add-new-prod-btn font-sans"
          disabled={categories.length === 0}
          title={categories.length === 0 ? "أضف قسماً أولاً" : undefined}
        >
          إضافة منتج جديد
        </button>
      </div>

      {!isLoading && products.length > 0 && (
        <div className="admin-products-search-bar" ref={searchWrapRef}>
          <div className="admin-products-search-field-wrap">
            <div className="admin-products-search-field">
              <input
                type="search"
                value={searchQuery}
                onChange={(event) => {
                  setSearchQuery(event.target.value);
                  setIsSuggestOpen(true);
                  setActiveSuggestion(-1);
                }}
                onFocus={() => setIsSuggestOpen(true)}
                onKeyDown={handleSearchKeyDown}
                placeholder="ابحث بالاسم العربي أو الإنجليزي..."
                className="admin-products-search-input"
                autoComplete="off"
              />
              {searchQuery && (
                <button
                  type="button"
                  className="admin-products-search-clear"
                  onClick={() => {
                    setSearchQuery("");
                    setIsSuggestOpen(false);
                  }}
                >
                  مسح
                </button>
              )}
            </div>
            {isSuggestOpen && normalizedSearch && autocompleteSuggestions.length > 0 && (
              <ul className="admin-products-autocomplete" role="listbox">
                {autocompleteSuggestions.map((product, index) => (
                  <li key={product._id}>
                    <button
                      type="button"
                      className={`admin-products-suggestion ${index === activeSuggestion ? "is-active" : ""}`}
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => openEditProduct(product)}
                    >
                      <img src={product.images?.[0]?.url || "/images/logo.jpeg"} alt="" />
                      <span className="admin-products-suggestion-text">
                        <strong>{product.nameAr || product.name}</strong>
                        <small>
                          {product.nameEn} · {categoryPath(product) || "بدون قسم"} · {product.price} ج.م
                        </small>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <p className="admin-products-search-meta">
            {normalizedSearch
              ? `نتائج البحث: ${filteredProducts.length} من ${products.length}`
              : `إجمالي المنتجات: ${products.length}`}
          </p>
        </div>
      )}

      {notice && <div className="admin-success-message">{notice}</div>}
      {error && !editingProduct && (
        <div className="admin-error-message">
          <span>{error}</span>
          <button type="button" onClick={loadData}>إعادة المحاولة</button>
        </div>
      )}
      {!isLoading && categories.length === 0 && (
        <div className="products-category-warning">أضف قسماً رئيسياً قبل إضافة المنتجات.</div>
      )}

      {isLoading ? (
        <div className="categories-loading">
          <div className="spinner-loader" />
          <span>جاري تحميل المنتجات...</span>
        </div>
      ) : products.length === 0 ? (
        <div className="categories-empty">
          <span className="categories-empty-icon">📦</span>
          <h3>لا توجد منتجات</h3>
          <p>أضف الألوان والمقاسات إن كان المنتج يحتاجها، ثم أضف المنتج واربطه بقسم.</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="categories-empty">
          <h3>لا توجد نتائج للبحث</h3>
        </div>
      ) : (
        <div className="table-responsive products-table-wrap">
          <table className="admin-products-table backend-products-table">
            <thead>
              <tr>
                <th>المنتج</th>
                <th>القسم</th>
                <th>السعر</th>
                <th>المخزون</th>
                <th>الحالة</th>
                <th>العمليات</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => (
                <tr key={product._id}>
                  <td>
                    <div className="backend-product-cell">
                      <img src={product.images?.[0]?.url || "/images/logo.jpeg"} alt={product.nameAr || product.name} />
                      <div>
                        <strong>{product.nameAr || product.name}</strong>
                        <span>{product.nameEn}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="product-category-badge">{categoryPath(product) || "قسم غير متاح"}</span>
                  </td>
                  <td className="product-price-cell">{product.price} ج.م</td>
                  <td>{product.stock ?? 0}</td>
                  <td>
                    <span className={`product-active-badge ${product.isActive ? "active" : "inactive"}`}>
                      {product.isActive ? "نشط" : "غير نشط"}
                    </span>
                  </td>
                  <td>
                    <div className="product-actions-cell">
                      <button type="button" onClick={() => setViewingProduct(product)} className="prod-action-btn edit-btn">
                        تفاصيل
                      </button>
                      <button type="button" onClick={() => openEditProduct(product)} className="prod-action-btn edit-btn">
                        تعديل
                      </button>
                      <button type="button" onClick={() => handleDelete(product)} className="prod-action-btn delete-btn">
                        حذف
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {viewingProduct && (
        <div
          className="admin-login-modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setViewingProduct(null);
          }}
        >
          <div className="admin-login-modal-card glass-modal product-api-modal product-details-modal">
            <div className="modal-header-row">
              <h3 className="font-serif text-xl font-bold text-[#ebdcb9] m-0">تفاصيل المنتج</h3>
              <button type="button" onClick={() => setViewingProduct(null)} className="close-modal-x-btn">
                ✕
              </button>
            </div>
            <div className="product-details-view">
              <div className="product-details-images">
                {(viewingProduct.images || []).map((image) => (
                  <img key={image.public_id || image.url} src={image.url} alt="" />
                ))}
              </div>
              <p><strong>العربي:</strong> {viewingProduct.nameAr || viewingProduct.name}</p>
              <p dir="ltr"><strong>English:</strong> {viewingProduct.nameEn}</p>
              <p><strong>الوصف:</strong> {viewingProduct.descriptionAr || viewingProduct.description}</p>
              <p dir="ltr"><strong>Description:</strong> {viewingProduct.descriptionEn}</p>
              <p><strong>السعر:</strong> {viewingProduct.price} ج.م</p>
              <p><strong>القسم:</strong> {categoryPath(viewingProduct)}</p>
              <p><strong>إجمالي القطع:</strong> {viewingProduct.stock ?? 0}</p>
              {viewingProduct.variants?.length > 0 && (
                <table className="variant-details-table">
                  <thead>
                    <tr>
                      <th>المقاس</th>
                      <th>اللون</th>
                      <th>الكمية</th>
                    </tr>
                  </thead>
                  <tbody>
                    {viewingProduct.variants.map((variant) => (
                      <tr key={variant._id}>
                        <td>{variant.size ? optionLabel(variant.size) : "—"}</td>
                        <td>{variant.color ? optionLabel(variant.color) : "—"}</td>
                        <td>{variant.stock}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              <div className="modal-actions">
                <button type="button" className="modal-submit-login-btn" onClick={() => openEditProduct(viewingProduct)}>
                  تعديل المنتج
                </button>
                <button type="button" className="modal-cancel-btn" onClick={() => setViewingProduct(null)}>
                  إغلاق
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {editingProduct && (
        <div
          className="admin-login-modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeModal();
          }}
        >
          <div className="admin-login-modal-card glass-modal product-api-modal">
            <div className="modal-header-row">
              <h3 className="font-serif text-xl font-bold text-[#ebdcb9] m-0">
                {editingProduct === "new" ? "إضافة منتج جديد" : "تعديل المنتج"}
              </h3>
              <button type="button" onClick={closeModal} className="close-modal-x-btn" disabled={isSaving}>
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmit} className="category-admin-form">
              {error && <div className="modal-form-error">{error}</div>}
              <div className="category-form-grid">
                <label className="modal-input-group">
                  <span className="modal-label">الاسم بالعربية *</span>
                  <input
                    type="text"
                    value={form.nameAr}
                    onChange={(event) => setForm((current) => ({ ...current, nameAr: event.target.value }))}
                    className="modal-text-input text-right"
                    required
                  />
                </label>
                <label className="modal-input-group">
                  <span className="modal-label">الاسم بالإنجليزية *</span>
                  <input
                    type="text"
                    dir="ltr"
                    value={form.nameEn}
                    onChange={(event) => setForm((current) => ({ ...current, nameEn: event.target.value }))}
                    className="modal-text-input"
                    required
                  />
                </label>
              </div>
              <label className="modal-input-group">
                <span className="modal-label">الوصف بالعربية *</span>
                <textarea
                  value={form.descriptionAr}
                  onChange={(event) => setForm((current) => ({ ...current, descriptionAr: event.target.value }))}
                  rows={3}
                  className="modal-text-input text-right"
                  required
                />
              </label>
              <label className="modal-input-group">
                <span className="modal-label">الوصف بالإنجليزية *</span>
                <textarea
                  dir="ltr"
                  value={form.descriptionEn}
                  onChange={(event) => setForm((current) => ({ ...current, descriptionEn: event.target.value }))}
                  rows={3}
                  className="modal-text-input"
                  required
                />
              </label>

              <div className="product-form-grid">
                <label className="modal-input-group">
                  <span className="modal-label">السعر *</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.price}
                    onChange={(event) => setForm((current) => ({ ...current, price: event.target.value }))}
                    className="modal-text-input text-right"
                    required
                  />
                </label>
                <label className="modal-input-group">
                  <span className="modal-label">القسم *</span>
                  <select
                    value={form.category}
                    onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))}
                    className="modal-text-input text-right"
                    required
                  >
                    <option value="">اختر القسم</option>
                    {mainCategories.map((main) => {
                      const subs = categories.filter((category) => parentIdOf(category) === main._id);
                      return (
                        <optgroup key={main._id} label={main.nameAr || main.name}>
                          <option value={main._id}>{main.nameAr || main.name} — رئيسي</option>
                          {subs.map((sub) => (
                            <option key={sub._id} value={sub._id}>
                              {sub.nameAr || sub.name} — فرعي
                            </option>
                          ))}
                        </optgroup>
                      );
                    })}
                  </select>
                </label>
                {!usesMatrix && (
                  <label className="modal-input-group">
                    <span className="modal-label">المخزون بدون مقاس أو لون</span>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={form.stock}
                      onChange={(event) => setForm((current) => ({ ...current, stock: event.target.value }))}
                      className="modal-text-input text-right"
                    />
                  </label>
                )}
              </div>

              <div className="modal-input-group">
                <span className="modal-label">المقاسات المتاحة لهذا المنتج</span>
                {selectableSizes.length === 0 ? (
                  <small className="product-images-hint">أضف المقاسات من تبويب الألوان والمقاسات أولاً.</small>
                ) : (
                  <div className="option-chip-list">
                    {selectableSizes.map((size) => (
                      <label key={size._id} className={form.sizeIds.includes(size._id) ? "is-selected" : ""}>
                        <input
                          type="checkbox"
                          checked={form.sizeIds.includes(size._id)}
                          onChange={() => toggleOption("sizeIds", size._id)}
                        />
                        {optionLabel(size)}
                      </label>
                    ))}
                  </div>
                )}
              </div>

              <div className="modal-input-group">
                <span className="modal-label">الألوان المتاحة لهذا المنتج</span>
                {selectableColors.length === 0 ? (
                  <small className="product-images-hint">أضف الألوان من تبويب الألوان والمقاسات أولاً.</small>
                ) : (
                  <div className="option-chip-list">
                    {selectableColors.map((color) => (
                      <label key={color._id} className={form.colorIds.includes(color._id) ? "is-selected" : ""}>
                        <input
                          type="checkbox"
                          checked={form.colorIds.includes(color._id)}
                          onChange={() => toggleOption("colorIds", color._id)}
                        />
                        <span className="options-swatch" style={{ background: color.hex || "#111" }} />
                        {optionLabel(color)}
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {usesMatrix && (
                <div className="variant-matrix-wrap">
                  <span className="modal-label">كمية كل مقاس مع كل لون *</span>
                  <table className="variant-matrix">
                    <thead>
                      <tr>
                        <th>المقاس</th>
                        {matrixColumns.map((color) => (
                          <th key={color._id || "plain"}>{color._id ? optionLabel(color) : "الكمية"}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {matrixRows.map((size) => (
                        <tr key={size._id || "plain"}>
                          <th>{size._id ? optionLabel(size) : "الكمية"}</th>
                          {matrixColumns.map((color) => (
                            <td key={`${size._id}|${color._id}`}>
                              <input
                                type="number"
                                min="0"
                                step="1"
                                value={form.variantStock[variantKey(size._id, color._id)] ?? ""}
                                onChange={(event) => setVariantStock(size._id, color._id, event.target.value)}
                                placeholder="0"
                                required
                              />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <label className="modal-input-group">
                <span className="modal-label">صور المنتج * ({form.images.length})</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImagesChange}
                  className="modal-file-input"
                />
              </label>
              {form.images.length > 0 && (
                <div className="editable-product-images">
                  {form.images.map((image, index) => (
                    <div key={image.id} className="editable-product-image">
                      <img src={image.url} alt={`صورة المنتج ${index + 1}`} />
                      <div className="editable-image-actions">
                        <label>
                          تغيير
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(event) => {
                              replaceImage(image.id, event.target.files?.[0]);
                              event.target.value = "";
                            }}
                          />
                        </label>
                        <button type="button" onClick={() => removeImage(image.id)}>
                          حذف
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <label className="admin-checkbox-row">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(event) => setForm((current) => ({ ...current, isActive: event.target.checked }))}
                />
                <span>المنتج نشط ويظهر للعملاء</span>
              </label>
              <div className="modal-actions">
                <button type="submit" className="modal-submit-login-btn" disabled={isSaving}>
                  {isSaving ? "جاري الحفظ..." : editingProduct === "new" ? "إضافة المنتج" : "حفظ التعديلات"}
                </button>
                <button type="button" onClick={closeModal} className="modal-cancel-btn" disabled={isSaving}>
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
