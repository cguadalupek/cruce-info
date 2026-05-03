function isNil(value) {
  return value === null || value === undefined;
}

function isDateInstance(value) {
  return value instanceof Date && !Number.isNaN(value.getTime());
}

export function normalizeHeader(value) {
  const text = isNil(value) ? "" : String(value);
  return text
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[°º]/g, "o")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeOrder(value) {
  if (isNil(value)) {
    return "";
  }

  if (typeof value === "number") {
    if (Number.isNaN(value)) {
      return "";
    }
    return String(value).replace(/\.0+$/, "").trim().toUpperCase();
  }

  if (isDateInstance(value)) {
    return formatDate(value).toUpperCase();
  }

  const text = String(value).trim();
  if (!text || ["nan", "none", "null"].includes(text.toLowerCase())) {
    return "";
  }

  return text.replace(/\.0+$/, "").trim().toUpperCase();
}

export function formatText(value) {
  if (isNil(value)) {
    return "";
  }

  if (typeof value === "number" && Number.isNaN(value)) {
    return "";
  }

  if (isDateInstance(value)) {
    return formatDate(value);
  }

  return String(value).trim();
}

export function formatDate(value) {
  if (isNil(value)) {
    return "";
  }

  if (typeof value === "number" && Number.isNaN(value)) {
    return "";
  }

  if (isDateInstance(value)) {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, "0");
    const day = String(value.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  return String(value).trim();
}

export function isBlankValue(value) {
  return formatText(value) === "";
}
