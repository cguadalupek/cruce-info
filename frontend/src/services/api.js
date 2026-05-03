const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000";

async function parseError(response) {
  try {
    const payload = await response.json();
    return payload.error || "Ocurrio un error inesperado.";
  } catch {
    return "Ocurrio un error inesperado.";
  }
}

export async function processFiles({ semana, sapFile, programaFile }) {
  const formData = new FormData();
  formData.append("semana", semana.trim());
  formData.append("sap_file", sapFile);
  formData.append("programa_file", programaFile);

  const response = await fetch(`${API_BASE_URL}/api/procesar`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  return response.json();
}

export async function exportResults(payload) {
  const response = await fetch(`${API_BASE_URL}/api/exportar`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  const blob = await response.blob();
  const contentDisposition = response.headers.get("Content-Disposition") || "";
  const filenameMatch = contentDisposition.match(/filename="(.+)"/);
  const filename = filenameMatch?.[1] || "reporte_cruce.xlsx";

  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.URL.revokeObjectURL(url);
}
