import { ApiError } from "./http";

export async function readBody(request) {
  const type = request.headers.get("content-type") || "";

  if (type.includes("multipart/form-data")) {
    const form = await request.formData();
    const fields = {};
    const files = {};

    for (const [key, value] of form.entries()) {
      if (typeof value === "string") {
        if (fields[key] === undefined) fields[key] = value;
        else if (Array.isArray(fields[key])) fields[key].push(value);
        else fields[key] = [fields[key], value];
      } else if (value && typeof value.arrayBuffer === "function" && value.size > 0) {
        if (!files[key]) files[key] = [];
        files[key].push(value);
      }
    }

    return { fields, files };
  }

  const fields = await request.json().catch(() => ({}));
  return { fields, files: {} };
}

export function textValue(value) {
  if (Array.isArray(value)) return String(value[0] ?? "").trim();
  return String(value ?? "").trim();
}

export function requiredText(value, label, max = 120) {
  const text = textValue(value);
  if (!text) throw new ApiError(`${label} مطلوب`);
  if (text.length > max) throw new ApiError(`${label} طويل جداً`);
  return text;
}

export function parseBoolean(value, fallback = true) {
  if (value === undefined || value === null || value === "") return fallback;
  if (typeof value === "boolean") return value;
  return String(Array.isArray(value) ? value[0] : value).toLowerCase() !== "false";
}

export function parseJsonField(value, fallback) {
  if (value === undefined || value === null || value === "") return fallback;
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch {
    throw new ApiError("صيغة الألوان أو المقاسات غير صالحة");
  }
}

export function firstFile(files, key) {
  const list = files?.[key];
  if (!list) return null;
  return Array.isArray(list) ? list[0] : list;
}

export function fileList(files, key) {
  const list = files?.[key];
  if (!list) return [];
  return Array.isArray(list) ? list : [list];
}
