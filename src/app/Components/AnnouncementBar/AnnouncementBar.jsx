import "./AnnouncementBar.css";

export function announcementLine(items, language = "ar") {
  const english = String(language).toLowerCase().startsWith("en");
  return (items || [])
    .map((item) => (english ? item.textEn : item.textAr || item.text) ?? "")
    .join("");
}

export default function AnnouncementBar({ items, preview = false, language = "ar" }) {
  const english = String(language).toLowerCase().startsWith("en");
  const line = announcementLine(items, language);
  if (!line) return null;

  return (
    <div
      className={`announcement-bar${preview ? " is-preview" : ""}`}
      role="region"
      aria-label={english ? "Store offers" : "عروض الموقع"}
    >
      <div className="announcement-track">
        <span dir={english ? "ltr" : "rtl"}>{line}</span>
        <span dir={english ? "ltr" : "rtl"} aria-hidden="true">
          {line}
        </span>
      </div>
    </div>
  );
}
