"use client";

import { useCallback, useEffect, useState } from "react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "";

async function apiRequest(path, options) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.message || "تعذر إتمام الطلب، حاول مرة أخرى");
  }
  return payload;
}

function OptionEditor({
  title,
  subtitle,
  items,
  nameArLabel,
  nameEnLabel,
  withHex,
  onCreate,
  onUpdate,
  onDelete,
}) {
  const [form, setForm] = useState({ nameAr: "", nameEn: "", hex: "#111111", isActive: true });
  const [editingId, setEditingId] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const reset = () => {
    setForm({ nameAr: "", nameEn: "", hex: "#111111", isActive: true });
    setEditingId("");
    setError("");
  };

  const startEdit = (item) => {
    setEditingId(item._id);
    setForm({
      nameAr: item.nameAr || "",
      nameEn: item.nameEn || "",
      hex: item.hex || "#111111",
      isActive: item.isActive !== false,
    });
    setError("");
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!form.nameAr.trim() || !form.nameEn.trim()) {
      setError("الاسم العربي والإنجليزي مطلوبان");
      return;
    }
    setIsSaving(true);
    setError("");
    try {
      const payload = {
        nameAr: form.nameAr.trim(),
        nameEn: form.nameEn.trim(),
        isActive: form.isActive,
        ...(withHex ? { hex: form.hex } : {}),
      };
      if (editingId) await onUpdate(editingId, payload);
      else await onCreate(payload);
      reset();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <article className="options-card">
      <h3>{title}</h3>
      <p>{subtitle}</p>
      <form onSubmit={submit} className="options-form">
        {error && <div className="admin-error-message">{error}</div>}
        <label>
          <span>{nameArLabel}</span>
          <input
            value={form.nameAr}
            onChange={(event) => setForm((current) => ({ ...current, nameAr: event.target.value }))}
            required
          />
        </label>
        <label>
          <span>{nameEnLabel}</span>
          <input
            dir="ltr"
            value={form.nameEn}
            onChange={(event) => setForm((current) => ({ ...current, nameEn: event.target.value }))}
            required
          />
        </label>
        {withHex && (
          <label className="options-color-field">
            <span>درجة اللون</span>
            <input
              type="color"
              value={form.hex}
              onChange={(event) => setForm((current) => ({ ...current, hex: event.target.value }))}
            />
          </label>
        )}
        <label className="admin-checkbox-row options-active-check">
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(event) => setForm((current) => ({ ...current, isActive: event.target.checked }))}
          />
          <span>نشط ويظهر عند إضافة المنتجات</span>
        </label>
        <div className="options-form-actions">
          <button type="submit" disabled={isSaving}>
            {isSaving ? "جاري الحفظ..." : editingId ? "حفظ التعديل" : "إضافة"}
          </button>
          {editingId && (
            <button type="button" onClick={reset}>
              إلغاء
            </button>
          )}
        </div>
      </form>

      <ul className="options-list">
        {items.length === 0 && <li className="options-empty">لا توجد عناصر بعد.</li>}
        {items.map((item) => (
          <li key={item._id}>
            <div className="options-item-name">
              {withHex && <span className="options-swatch" style={{ background: item.hex || "#111" }} />}
              <div>
                <strong>{item.nameAr}</strong>
                <small>{item.nameEn}</small>
              </div>
            </div>
            <span className={`product-active-badge ${item.isActive ? "active" : "inactive"}`}>
              {item.isActive ? "نشط" : "غير نشط"}
            </span>
            <div className="category-sub-actions">
              <button type="button" onClick={() => startEdit(item)}>
                تعديل
              </button>
              <button
                type="button"
                onClick={() => {
                  if (window.confirm(`حذف "${item.nameAr}"؟`)) onDelete(item._id);
                }}
              >
                حذف
              </button>
            </div>
          </li>
        ))}
      </ul>
    </article>
  );
}

export default function OptionsPanel() {
  const [colors, setColors] = useState([]);
  const [sizes, setSizes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const [colorsResponse, sizesResponse] = await Promise.all([
        apiRequest("/getAllColors"),
        apiRequest("/getAllSizes"),
      ]);
      setColors(colorsResponse.data || []);
      setSizes(sizesResponse.data || []);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(loadData);
  }, [loadData]);

  const showNotice = (message) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 3500);
  };

  const save = async (path, method, body, successMessage) => {
    await apiRequest(path, { method, body: JSON.stringify(body) });
    await loadData();
    showNotice(successMessage);
  };

  return (
    <section>
      <div className="panel-header categories-panel-header">
        <div>
          <h2 className="font-serif text-2xl font-bold text-[#0f3b2e] m-0">الألوان والمقاسات</h2>
          <p className="categories-subtitle">
            أضف الألوان والمقاسات مرة واحدة، ثم اختر منها داخل كل منتج وحدد كمية كل خانة.
          </p>
        </div>
      </div>
      {notice && <div className="admin-success-message">{notice}</div>}
      {error && (
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
          <span>جاري تحميل الألوان والمقاسات...</span>
        </div>
      ) : (
        <div className="options-layout">
          <OptionEditor
            title="الألوان"
            subtitle="مثال: أسود / Black، أبيض / White"
            items={colors}
            nameArLabel="اسم اللون بالعربية"
            nameEnLabel="Color name in English"
            withHex
            onCreate={(body) => save("/addColor", "POST", body, "تمت إضافة اللون")}
            onUpdate={(id, body) => save(`/updateColor/${id}`, "PUT", body, "تم تعديل اللون")}
            onDelete={async (id) => {
              try {
                await save(`/deleteColor/${id}`, "DELETE", {}, "تم حذف اللون");
              } catch (requestError) {
                setError(requestError.message);
              }
            }}
          />
          <OptionEditor
            title="المقاسات"
            subtitle="مثال: كبير جداً / XL"
            items={sizes}
            nameArLabel="اسم المقاس بالعربية"
            nameEnLabel="Size name in English"
            onCreate={(body) => save("/addSize", "POST", body, "تمت إضافة المقاس")}
            onUpdate={(id, body) => save(`/updateSize/${id}`, "PUT", body, "تم تعديل المقاس")}
            onDelete={async (id) => {
              try {
                await save(`/deleteSize/${id}`, "DELETE", {}, "تم حذف المقاس");
              } catch (requestError) {
                setError(requestError.message);
              }
            }}
          />
        </div>
      )}
    </section>
  );
}
