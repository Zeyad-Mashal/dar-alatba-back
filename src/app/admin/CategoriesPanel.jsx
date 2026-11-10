"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { parentIdOf } from "../lib/catalogClient";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "";

const EMPTY_CATEGORY = {
  nameAr: "",
  nameEn: "",
  descriptionAr: "",
  descriptionEn: "",
  parent: "",
  isActive: true,
  image: null,
  sizeChart: null,
  clearSizeChart: false,
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

function countDescendants(categoryId, categories) {
  let count = 0;
  const queue = [categoryId];
  while (queue.length) {
    const current = queue.shift();
    categories.forEach((item) => {
      if (parentIdOf(item) === current) {
        count += 1;
        queue.push(item._id);
      }
    });
  }
  return count;
}

function nestableParentOptions(categories, editingId) {
  const forbidden = new Set();
  if (editingId) {
    forbidden.add(editingId);
    const queue = [editingId];
    while (queue.length) {
      const current = queue.shift();
      categories.forEach((item) => {
        if (parentIdOf(item) === current && !forbidden.has(item._id)) {
          forbidden.add(item._id);
          queue.push(item._id);
        }
      });
    }
  }
  return [...categories]
    .filter((item) => !forbidden.has(item._id) && Number(item.depth || (parentIdOf(item) ? 2 : 1)) < 4)
    .sort((a, b) => String(a.path || a.nameAr || "").localeCompare(String(b.path || b.nameAr || ""), "ar"));
}

function CategoryTree({ parentId, categories, products, onAdd, onEdit, onDelete }) {
  const children = categories.filter((item) => parentIdOf(item) === parentId);
  if (!children.length) return null;
  return (
    <div className="category-tree-list">
      {children.map((sub) => {
        const depth = Number(sub.depth || 2);
        const subCount = products.filter((product) => {
          const productCategoryId =
            typeof product.category === "object" ? product.category?._id : product.category;
          return productCategoryId === sub._id;
        }).length;
        return (
          <div key={sub._id} className="category-sub-row" style={{ marginInlineStart: `${Math.max(0, depth - 2) * 12}px` }}>
            <div>
              <strong>{sub.nameAr || sub.name}</strong>
              <small>
                {sub.nameEn} · طبقة {depth}/4 · {subCount} منتج · {sub.isActive ? "نشط" : "غير نشط"}
              </small>
            </div>
            <div className="category-sub-actions">
              {depth < 4 ? (
                <button type="button" onClick={() => onAdd(sub._id)}>
                  فرعي
                </button>
              ) : null}
              <button type="button" onClick={() => onEdit(sub)}>
                تعديل
              </button>
              <button type="button" onClick={() => onDelete(sub)}>
                حذف
              </button>
            </div>
            <CategoryTree
              parentId={sub._id}
              categories={categories}
              products={products}
              onAdd={onAdd}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          </div>
        );
      })}
    </div>
  );
}

function categoryProducts(products, categoryId, categories) {
  const childIds = new Set(
    categories
      .filter((category) => parentIdOf(category) === categoryId)
      .map((category) => category._id),
  );
  childIds.add(categoryId);
  return products.filter((product) => {
    const productCategoryId =
      typeof product.category === "object" ? product.category?._id : product.category;
    return childIds.has(productCategoryId);
  });
}

export default function CategoriesPanel() {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryForm, setCategoryForm] = useState(EMPTY_CATEGORY);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const [categoriesResponse, productsResponse] = await Promise.all([
        apiRequest("/getAllCategories"),
        apiRequest("/getAllProducts"),
      ]);
      setCategories(categoriesResponse.data || []);
      setProducts(productsResponse.data || []);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(loadData);
  }, [loadData]);

  const mainCategories = useMemo(
    () => categories.filter((category) => !parentIdOf(category)),
    [categories],
  );

  const showNotice = (message) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 3500);
  };

  const openAddCategory = (parentId = "") => {
    setError("");
    setCategoryForm({ ...EMPTY_CATEGORY, parent: parentId });
    setEditingCategory("new");
  };

  const openEditCategory = (category) => {
    setError("");
    setCategoryForm({
      nameAr: category.nameAr || category.name || "",
      nameEn: category.nameEn || "",
      descriptionAr: category.descriptionAr || category.description || "",
      descriptionEn: category.descriptionEn || "",
      parent: parentIdOf(category) || "",
      isActive: category.isActive !== false,
      image: null,
      sizeChart: null,
      clearSizeChart: false,
    });
    setEditingCategory(category);
  };

  const handleCategorySubmit = async (event) => {
    event.preventDefault();
    if (
      !categoryForm.nameAr.trim() ||
      !categoryForm.nameEn.trim() ||
      !categoryForm.descriptionAr.trim() ||
      !categoryForm.descriptionEn.trim()
    ) {
      setError("الاسم والوصف بالعربية والإنجليزية مطلوبة");
      return;
    }
    if (editingCategory === "new" && !categoryForm.image) {
      setError("صورة القسم مطلوبة عند إضافة قسم جديد");
      return;
    }

    const formData = new FormData();
    formData.append("nameAr", categoryForm.nameAr.trim());
    formData.append("nameEn", categoryForm.nameEn.trim());
    formData.append("descriptionAr", categoryForm.descriptionAr.trim());
    formData.append("descriptionEn", categoryForm.descriptionEn.trim());
    formData.append("parent", categoryForm.parent);
    formData.append("isActive", String(categoryForm.isActive));
    formData.append("clearSizeChart", String(Boolean(categoryForm.clearSizeChart)));
    if (categoryForm.image) formData.append("image", categoryForm.image);
    if (categoryForm.sizeChart) formData.append("sizeChart", categoryForm.sizeChart);

    setIsSaving(true);
    setError("");
    try {
      const isNew = editingCategory === "new";
      await apiRequest(isNew ? "/addCategory" : `/updateCategory/${editingCategory._id}`, {
        method: isNew ? "POST" : "PUT",
        body: formData,
      });
      setEditingCategory(null);
      await loadData();
      showNotice(isNew ? "تمت إضافة القسم بنجاح" : "تم تعديل القسم بنجاح");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteCategory = async (category) => {
    const descendantCount = countDescendants(category._id, categories);
    const related = categoryProducts(products, category._id, categories);
    const warning = [
      `حذف "${category.nameAr || category.name}" نهائي.`,
      descendantCount ? `سيتم حذف ${descendantCount} قسم تحته.` : "",
      related.length ? `وسيتم حذف ${related.length} منتج مرتبط.` : "",
      "هل تريد المتابعة؟",
    ]
      .filter(Boolean)
      .join(" ");

    if (!window.confirm(warning)) return;

    setError("");
    try {
      await apiRequest(`/deleteCategory/${category._id}`, { method: "DELETE" });
      await loadData();
      showNotice("تم حذف القسم وما يتبعه");
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  return (
    <section className="categories-management-panel">
      <div className="panel-header categories-panel-header">
        <div>
          <h2 className="font-serif text-2xl font-bold text-[#0f3b2e] m-0">إدارة الأقسام</h2>
          <p className="categories-subtitle">
            الشجرة لحد ٤ طبقات. تقدر توقف عند ٢ أو ٣ أو توصل ٤ حسب القسم. المنتجات تتربط بأي مستوى.
          </p>
        </div>
        <button type="button" onClick={() => openAddCategory("")} className="add-new-prod-btn font-sans">
          إضافة قسم رئيسي
        </button>
      </div>

      {notice && <div className="admin-success-message">{notice}</div>}
      {error && !editingCategory && (
        <div className="admin-error-message">
          <span>{error}</span>
          <button type="button" onClick={loadData}>
            إعادة المحاولة
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="categories-loading">
          <div className="spinner-loader" />
          <span>جاري تحميل الأقسام...</span>
        </div>
      ) : mainCategories.length === 0 ? (
        <div className="categories-empty">
          <span className="categories-empty-icon">🗂️</span>
          <h3>لا توجد أقسام حتى الآن</h3>
          <p>ابدأ بقسم رئيسي، ثم أضف الأقسام الفرعية داخله.</p>
        </div>
      ) : (
        <div className="categories-grid">
          {mainCategories.map((category) => {
            const subs = categories.filter((item) => parentIdOf(item) === category._id);
            const related = categoryProducts(products, category._id, categories);
            return (
              <article key={category._id} className="category-admin-card">
                <div className="category-card-image">
                  <img src={category.image?.url || "/images/logo.jpeg"} alt={category.nameAr || category.name} />
                  <span className={`category-status ${category.isActive ? "active" : "inactive"}`}>
                    {category.isActive ? "نشط" : "غير نشط"}
                  </span>
                </div>
                <div className="category-card-content">
                  <div className="category-title-row">
                    <h3>{category.nameAr || category.name}</h3>
                    <span>{related.length} منتج</span>
                  </div>
                  <p className="category-english-name">{category.nameEn}</p>
                  <p>{category.descriptionAr || category.description}</p>

                  <div className="category-sub-list">
                    <div className="category-sub-head">
                      <strong>الأقسام الفرعية ({subs.length})</strong>
                      {(category.depth || 1) < 4 ? (
                        <button type="button" onClick={() => openAddCategory(category._id)}>
                          إضافة فرعي
                        </button>
                      ) : null}
                    </div>
                    {subs.length === 0 ? (
                      <p className="category-sub-empty">لا توجد أقسام فرعية بعد.</p>
                    ) : (
                      <CategoryTree
                        parentId={category._id}
                        categories={categories}
                        products={products}
                        onAdd={openAddCategory}
                        onEdit={openEditCategory}
                        onDelete={handleDeleteCategory}
                      />
                    )}
                  </div>

                  <div className="category-card-actions">
                    <button type="button" onClick={() => openEditCategory(category)} className="prod-action-btn edit-btn">
                      تعديل
                    </button>
                    <button type="button" onClick={() => handleDeleteCategory(category)} className="prod-action-btn delete-btn">
                      حذف
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {editingCategory && (
        <div
          className="admin-login-modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !isSaving) setEditingCategory(null);
          }}
        >
          <div className="admin-login-modal-card glass-modal category-modal-card">
            <div className="modal-header-row">
              <h3 className="font-serif text-xl font-bold text-[#ebdcb9] m-0">
                {editingCategory === "new"
                  ? categoryForm.parent
                    ? "إضافة قسم فرعي"
                    : "إضافة قسم رئيسي"
                  : "تعديل القسم"}
              </h3>
              <button type="button" onClick={() => setEditingCategory(null)} className="close-modal-x-btn" disabled={isSaving}>
                ✕
              </button>
            </div>

            <form onSubmit={handleCategorySubmit} className="category-admin-form">
              {error && <div className="modal-form-error">{error}</div>}
              <div className="category-form-grid">
                <label className="modal-input-group">
                  <span className="modal-label">الاسم بالعربية *</span>
                  <input
                    type="text"
                    value={categoryForm.nameAr}
                    onChange={(event) => setCategoryForm((current) => ({ ...current, nameAr: event.target.value }))}
                    className="modal-text-input text-right"
                    required
                  />
                </label>
                <label className="modal-input-group">
                  <span className="modal-label">الاسم بالإنجليزية *</span>
                  <input
                    type="text"
                    dir="ltr"
                    value={categoryForm.nameEn}
                    onChange={(event) => setCategoryForm((current) => ({ ...current, nameEn: event.target.value }))}
                    className="modal-text-input"
                    required
                  />
                </label>
              </div>

              <label className="modal-input-group">
                <span className="modal-label">الوصف بالعربية *</span>
                <textarea
                  value={categoryForm.descriptionAr}
                  onChange={(event) =>
                    setCategoryForm((current) => ({ ...current, descriptionAr: event.target.value }))
                  }
                  rows={3}
                  className="modal-text-input text-right"
                  required
                />
              </label>
              <label className="modal-input-group">
                <span className="modal-label">الوصف بالإنجليزية *</span>
                <textarea
                  dir="ltr"
                  value={categoryForm.descriptionEn}
                  onChange={(event) =>
                    setCategoryForm((current) => ({ ...current, descriptionEn: event.target.value }))
                  }
                  rows={3}
                  className="modal-text-input"
                  required
                />
              </label>

              <label className="modal-input-group">
                <span className="modal-label">المستوى</span>
                <select
                  value={categoryForm.parent}
                  onChange={(event) => setCategoryForm((current) => ({ ...current, parent: event.target.value }))}
                  className="modal-text-input text-right"
                >
                  <option value="">قسم رئيسي</option>
                  {nestableParentOptions(
                    categories,
                    editingCategory !== "new" ? editingCategory._id : null,
                  ).map((category) => (
                    <option key={category._id} value={category._id}>
                      تحت: {category.path || category.nameAr || category.name} — {category.depth || 1}/4
                    </option>
                  ))}
                </select>
                <small className="product-images-hint">أقصى عمق ٤ طبقات. تقدر تختار أب من أي مستوى أقل من ٤.</small>
              </label>

              <label className="modal-input-group">
                <span className="modal-label">
                  صورة القسم {editingCategory === "new" ? "*" : "(اختياري عند التعديل)"}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) =>
                    setCategoryForm((current) => ({ ...current, image: event.target.files?.[0] || null }))
                  }
                  className="modal-file-input"
                  required={editingCategory === "new"}
                />
              </label>

              {categoryForm.parent ? (
                <label className="modal-input-group">
                  <span className="modal-label">جدول المقاسات (اختياري)</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(event) =>
                      setCategoryForm((current) => ({
                        ...current,
                        sizeChart: event.target.files?.[0] || null,
                        clearSizeChart: false,
                      }))
                    }
                    className="modal-file-input"
                  />
                  <small className="product-images-hint">
                    الصورة هتظهر في كل منتجات القسم الفرعي ده فقط.
                  </small>
                  {editingCategory !== "new" && editingCategory?.sizeChart?.url ? (
                    <>
                      <img
                        src={editingCategory.sizeChart.url}
                        alt=""
                        style={{ marginTop: 8, maxHeight: 160, objectFit: "contain" }}
                      />
                      <label className="admin-checkbox-row" style={{ marginTop: 8 }}>
                        <input
                          type="checkbox"
                          checked={categoryForm.clearSizeChart}
                          onChange={(event) =>
                            setCategoryForm((current) => ({
                              ...current,
                              clearSizeChart: event.target.checked,
                              sizeChart: event.target.checked ? null : current.sizeChart,
                            }))
                          }
                        />
                        <span>مسح جدول المقاسات</span>
                      </label>
                    </>
                  ) : null}
                </label>
              ) : null}

              <label className="admin-checkbox-row">
                <input
                  type="checkbox"
                  checked={categoryForm.isActive}
                  onChange={(event) =>
                    setCategoryForm((current) => ({ ...current, isActive: event.target.checked }))
                  }
                />
                <span>القسم نشط ويظهر للعملاء</span>
              </label>

              <div className="modal-actions">
                <button type="submit" className="modal-submit-login-btn" disabled={isSaving}>
                  {isSaving ? "جاري الحفظ..." : editingCategory === "new" ? "إضافة القسم" : "حفظ التعديلات"}
                </button>
                <button type="button" onClick={() => setEditingCategory(null)} className="modal-cancel-btn" disabled={isSaving}>
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
