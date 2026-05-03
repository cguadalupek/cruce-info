import { formatDate, formatText, normalizeOrder } from "../utils/normalize.js";

export const RESULT_ENCONTRADO = "ENCONTRADO";
export const RESULT_NO_ENCONTRADO = "NO_ENCONTRADO";
export const RESULT_PENDIENTE_CREAR = "PENDIENTE_CREAR";
export const RESULT_DUPLICADO = "DUPLICADO";
export const RESULT_SIN_OT = "SIN_OT";
export const RESULT_REVISAR_ESTADO = "REVISAR_ESTADO";

export const RESULT_LABELS = {
  [RESULT_ENCONTRADO]: "Orden encontrada en SAP",
  [RESULT_NO_ENCONTRADO]: "Orden no encontrada en SAP",
  [RESULT_PENDIENTE_CREAR]: "Pendiente de crear orden de trabajo",
  [RESULT_DUPLICADO]: "Orden duplicada en programa de mantenimiento",
  [RESULT_SIN_OT]: "Registro sin numero de OT",
  [RESULT_REVISAR_ESTADO]: "Orden encontrada, revisar estado",
};

export const RESULT_COLORS = {
  [RESULT_ENCONTRADO]: "D9EAD3",
  [RESULT_NO_ENCONTRADO]: "F4CCCC",
  [RESULT_PENDIENTE_CREAR]: "FFF2CC",
  [RESULT_DUPLICADO]: "D0E0E3",
  [RESULT_SIN_OT]: "E3E3E3",
  [RESULT_REVISAR_ESTADO]: "FCE5CD",
};

export const OUTPUT_COLUMNS = [
  "orden",
  "texto_breve",
  "descripcion_estado_orden",
  "estado_orden",
  "motivo",
  "responsable",
  "fecha",
  "resultado_cruce",
];

export const VISIBLE_EXPORT_COLUMNS = [
  ["orden", "Orden"],
  ["texto_breve", "Texto breve"],
  ["descripcion_estado_orden", "Descripcion de estado de orden"],
  ["estado_orden", "Estado de Ord"],
  ["motivo", "Motivo"],
  ["responsable", "Responsable"],
  ["fecha", "Fecha"],
];

export const REVIEW_STATUS_ENABLED = false;
export const REVIEW_STATUS_VALUES = [];

function isPendingCreate(order) {
  return normalizeOrder(order) === "CREAR OT";
}

function shouldReviewStatus(statusValue) {
  if (!REVIEW_STATUS_ENABLED) {
    return false;
  }

  const normalizedStatus = normalizeOrder(statusValue);
  return REVIEW_STATUS_VALUES.some((value) => normalizeOrder(value) === normalizedStatus);
}

function buildSummary(rows) {
  const summary = {
    total_registros: rows.length,
    ordenes_encontradas: 0,
    ordenes_no_encontradas: 0,
    ordenes_pendientes_crear: 0,
    ordenes_duplicadas: 0,
    ordenes_sin_ot: 0,
    ordenes_revisar_estado: 0,
  };

  for (const row of rows) {
    if (row.resultado_cruce === RESULT_ENCONTRADO) {
      summary.ordenes_encontradas += 1;
    } else if (row.resultado_cruce === RESULT_NO_ENCONTRADO) {
      summary.ordenes_no_encontradas += 1;
    } else if (row.resultado_cruce === RESULT_PENDIENTE_CREAR) {
      summary.ordenes_pendientes_crear += 1;
    } else if (row.resultado_cruce === RESULT_DUPLICADO) {
      summary.ordenes_duplicadas += 1;
    } else if (row.resultado_cruce === RESULT_SIN_OT) {
      summary.ordenes_sin_ot += 1;
    } else if (row.resultado_cruce === RESULT_REVISAR_ESTADO) {
      summary.ordenes_revisar_estado += 1;
    }
  }

  return summary;
}

function deduplicateProcessedRows(rows) {
  const uniqueRows = [];
  const seenSignatures = new Set();

  for (const row of rows) {
    const signature = OUTPUT_COLUMNS.map((columnName) => row[columnName] ?? "").join("||");
    if (seenSignatures.has(signature)) {
      continue;
    }

    seenSignatures.add(signature);
    uniqueRows.push(row);
  }

  return uniqueRows;
}

export function buildProcessedData({ semana, sapSource, programaSource }) {
  const sapIndex = new Map();
  for (const row of sapSource.rows) {
    const normalizedOrder = normalizeOrder(row[sapSource.columns.orden]);
    if (normalizedOrder && !sapIndex.has(normalizedOrder)) {
      sapIndex.set(normalizedOrder, row);
    }
  }

  const orderCounts = new Map();
  for (const row of programaSource.rows) {
    const normalizedOrder = normalizeOrder(row[programaSource.columns.orden]);
    if (normalizedOrder && !isPendingCreate(normalizedOrder)) {
      orderCounts.set(normalizedOrder, (orderCounts.get(normalizedOrder) ?? 0) + 1);
    }
  }

  const data = programaSource.rows.map((row) => {
    const normalizedOrder = normalizeOrder(row[programaSource.columns.orden]);
    const sapMatch = normalizedOrder ? sapIndex.get(normalizedOrder) : null;
    const sapStatus =
      sapMatch && sapSource.columns.estado_orden
        ? formatText(sapMatch[sapSource.columns.estado_orden])
        : "";

    let result = RESULT_ENCONTRADO;
    if (!normalizedOrder) {
      result = RESULT_SIN_OT;
    } else if (isPendingCreate(normalizedOrder)) {
      result = RESULT_PENDIENTE_CREAR;
    } else if ((orderCounts.get(normalizedOrder) ?? 0) > 1) {
      result = RESULT_DUPLICADO;
    } else if (!sapMatch) {
      result = RESULT_NO_ENCONTRADO;
    } else if (shouldReviewStatus(sapStatus)) {
      result = RESULT_REVISAR_ESTADO;
    }

    let responsable = programaSource.columns.responsable
      ? formatText(row[programaSource.columns.responsable])
      : "";
    if (!responsable && sapMatch && sapSource.columns.responsable) {
      responsable = formatText(sapMatch[sapSource.columns.responsable]);
    }

    let fecha = programaSource.columns.fecha
      ? formatDate(row[programaSource.columns.fecha])
      : "";
    if (!fecha && sapMatch && sapSource.columns.fecha_inicio_extrema) {
      fecha = formatDate(sapMatch[sapSource.columns.fecha_inicio_extrema]);
    }

    return {
      orden: normalizedOrder,
      texto_breve:
        sapMatch && sapSource.columns.texto_breve
          ? formatText(sapMatch[sapSource.columns.texto_breve])
          : "",
      descripcion_estado_orden:
        sapMatch && sapSource.columns.descripcion_estado_orden
          ? formatText(sapMatch[sapSource.columns.descripcion_estado_orden])
          : "",
      estado_orden: sapStatus,
      motivo: RESULT_LABELS[result],
      responsable,
      fecha,
      resultado_cruce: result,
    };
  });

  const deduplicatedData = deduplicateProcessedRows(data);

  return {
    semana: semana.trim(),
    resumen: buildSummary(deduplicatedData),
    columnas: OUTPUT_COLUMNS,
    data: deduplicatedData,
  };
}
