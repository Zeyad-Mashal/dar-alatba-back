"use client";

import { useCallback, useEffect, useState } from "react";
import AnnouncementBar from "../Components/AnnouncementBar/AnnouncementBar";

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

export default function AnnouncementsPanel() {
  const [items, setItems] = useState([]);
  const [textAr, setTextAr] = useState("");
  const [textEn, setTextEn] = useState("");
  const [editingId, setEditingId] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const response = await apiRequest("/getAllAnnouncements");
      setItems(response.data || []);
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
    window.setTimeout(() => setNotice(""), 3000);
  };

  const resetForm = () => {
    setTextAr("");
    setTextEn("");
    setEditingId("");
    setIsActive(true);
  };

  const itemTexts = (item) => ({
    textAr: item.textAr || item.text || "",
    textEn: item.textEn || "",
  });

  const saveItem = async (payload, id) => {
    await apiRequest(id ? `/updateAnnouncement/${id}` : "/addAnnouncement", {
      method: id ? "PUT" : "POST",
      body: JSON.stringify(payload),
    });
    await loadData();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (textAr.length === 0 || textEn.length === 0) {
      setError("اكتب النص العربي والإنجليزي");
      return;
    }
    setIsSaving(true);
    setError("");
    try {
      await saveItem({ textAr, textEn, isActive }, editingId);
      resetForm();
      showNotice(editingId ? "تم تعديل العبارة" : "تمت إضافة العبارة");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsSaving(false);
    }
  };

  const toggleVisibility = async (item) => {
    setError("");
    try {
      await saveItem({ ...itemTexts(item), isActive: !item.isActive }, item._id);
      showNotice(item.isActive ? "تم إخفاء العبارة" : "تم إظهار العبارة");
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const moveItem = async (index, direction) => {
    const target = index + direction;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    const [moved] = next.splice(index, 1);
    next.splice(target, 0, moved);
    setError("");
    try {
      await Promise.all(
        next.map((item, order) =>
          apiRequest(`/updateAnnouncement/${item._id}`, {
            method: "PUT",
            body: JSON.stringify({
              ...itemTexts(item),
              isActive: item.isActive,
              sortOrder: order + 1,
            }),
          }),
        ),
      );
      await loadData();
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const removeItem = async (item) => {
    if (!window.confirm("حذف هذه العبارة من الشريط؟")) return;
    setError("");
    try {
      await apiRequest(`/deleteAnnouncement/${item._id}`, { method: "DELETE" });
      if (editingId === item._id) resetForm();
      await loadData();
      showNotice("تم حذف العبارة");
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const visibleItems = items.filter((item) => item.isActive);

  return (
    <section>
      <div className="panel-header categories-panel-header">
        <div>
          <h2 className="font-serif text-2xl font-bold text-[#0f3b2e] m-0">شريط العروض</h2>
          <p className="categories-subtitle">
            كل عبارة تُكتب مرة بالعربي ومرة بالإنجليزي. المسافات والنقط تبقى كما تكتبها، والموقع يعرض لغة الصفحة فقط في سطر واحد.
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

      <div className="announcement-admin-preview">
        <span>المعاينة</span>
        {visibleItems.length === 0 ? (
          <p>الشريط مخفي حالياً لأن لا توجد عبارة ظاهرة.</p>
        ) : (
          <div className="announcement-preview-pair">
            <AnnouncementBar items={visibleItems} preview language="ar" />
            <AnnouncementBar items={visibleItems} preview language="en" />
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="announcement-admin-form">
        <label>
          <span>النص بالعربي</span>
          <input
            value={textAr}
            onChange={(event) => setTextAr(event.target.value)}
            placeholder="خصم ١٥٪ على الأطقم  ·  "
            dir="rtl"
          />
        </label>
        <label>
          <span>النص بالإنجليزي</span>
          <input
            value={textEn}
            onChange={(event) => setTextEn(event.target.value)}
            placeholder="15% off sets  ·  "
            dir="ltr"
          />
        </label>
        <label className="admin-checkbox-row announcement-show-check">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(event) => setIsActive(event.target.checked)}
          />
          <span>تظهر في الموقع</span>
        </label>
        <div className="options-form-actions">
          <button type="submit" disabled={isSaving}>
            {isSaving ? "جاري الحفظ..." : editingId ? "حفظ التعديل" : "إضافة"}
          </button>
          {editingId && (
            <button type="button" onClick={resetForm}>
              إلغاء
            </button>
          )}
        </div>
      </form>

      {isLoading ? (
        <div className="categories-loading">
          <div className="spinner-loader" />
          <span>جاري تحميل الشريط...</span>
        </div>
      ) : items.length === 0 ? (
        <div className="categories-empty">
          <h3>لا توجد عبارات</h3>
          <p>أضف العبارة بالعربي والإنجليزي، ومعها المسافات أو النقط التي تريد ظهورها.</p>
        </div>
      ) : (
        <ul className="announcement-admin-list">
          {items.map((item, index) => (
            <li key={item._id}>
              <div className="announcement-admin-texts">
                <pre>{item.textAr || item.text}</pre>
                <pre dir="ltr">{item.textEn}</pre>
              </div>
              <span className={`product-active-badge ${item.isActive ? "active" : "inactive"}`}>
                {item.isActive ? "ظاهر" : "مخفي"}
              </span>
              <div className="category-sub-actions">
                <button type="button" onClick={() => moveItem(index, -1)} disabled={index === 0}>
                  أعلى
                </button>
                <button type="button" onClick={() => moveItem(index, 1)} disabled={index === items.length - 1}>
                  أسفل
                </button>
                <button type="button" onClick={() => toggleVisibility(item)}>
                  {item.isActive ? "إخفاء" : "إظهار"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(item._id);
                    setTextAr(item.textAr || item.text || "");
                    setTextEn(item.textEn || "");
                    setIsActive(item.isActive);
                    setError("");
                  }}
                >
                  تعديل
                </button>
                <button type="button" onClick={() => removeItem(item)}>
                  حذف
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
