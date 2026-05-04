import * as XLSX from "xlsx";
import { isBlankValue, normalizeHeader } from "../utils/normalize.js";
import {
  debugError,
  debugGroup,
  debugInfo,
  errorToDebugPayload,
} from "../utils/debug.js";

export class ExcelProcessingError extends Error {
  constructor(message) {
    super(message);
    this.name = "ExcelProcessingError";
  }
}

export const SAP_COLUMN_ALIASES = {
  orden: ["orden"],
  texto_breve: ["texto breve"],
  descripcion_estado_orden: [
    "descripcion de estado de orden",
    "descripcion estado orden",
    "desc estado orden",
    "desc. estado orden",
  ],
  estado_orden: [
    "estado de ord",
    "estado de orden",
    "estado orden",
    "estado de ord.",
    "estado de orden sap",
    "estado del sistema",
  ],
  responsable: [
    "responsable",
    "informacion de contacto autor",
    "autor",
  ],
  fecha_inicio_extrema: [
    "fecha de inicio extrema",
    "fecha inicio extrema",
    "fecha de inicio extrema america lima",
  ],
};

export const PROGRAM_COLUMN_ALIASES = {
  orden: [
    "noot",
    "no ot",
    "n ot",
    "ot",
    "nro ot",
    "numero ot",
  ],
  responsable: [
    "responsable",
    "responsable ejecucion",
  ],
  fecha: ["fecha"],
};

const SOURCE_DEFINITIONS = {
  SAP: {
    aliasMap: SAP_COLUMN_ALIASES,
    requiredFields: new Set(["orden"]),
  },
  Programa: {
    aliasMap: PROGRAM_COLUMN_ALIASES,
    requiredFields: new Set(["orden"]),
  },
};

function ensureXlsxFile(file, missingMessage) {
  if (!file) {
    throw new ExcelProcessingError(missingMessage);
  }

  if (!file.name?.toLowerCase().endsWith(".xlsx")) {
    throw new ExcelProcessingError("Solo se permiten archivos .xlsx.");
  }
}

function makeUniqueHeaders(headers) {
  const seen = new Map();

  return headers.map((header, index) => {
    const baseHeader = String(header ?? `Unnamed: ${index}`).trim() || `Unnamed: ${index}`;
    const count = seen.get(baseHeader) ?? 0;
    seen.set(baseHeader, count + 1);
    return count === 0 ? baseHeader : `${baseHeader}.${count}`;
  });
}

function rowHasValues(row = []) {
  return row.some((cell) => !isBlankValue(cell));
}

function buildCandidate(rows, headerRowIndex, sheetName) {
  const headerRow = rows[headerRowIndex] ?? [];
  const headers = makeUniqueHeaders(headerRow);

  const records = rows
    .slice(headerRowIndex + 1)
    .filter((row) => rowHasValues(row))
    .map((row) =>
      headers.reduce((record, header, columnIndex) => {
        record[header] = row[columnIndex] ?? null;
        return record;
      }, {}),
    );

  return {
    sheetName,
    headers,
    rows: records,
  };
}

function getWorkbookCandidates(workbook) {
  const candidates = [];

  for (const sheetName of workbook.SheetNames) {
    const worksheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      raw: true,
      defval: null,
      blankrows: false,
    });

    if (!rows.some((row) => rowHasValues(row))) {
      continue;
    }

    const maxHeaderScan = Math.min(rows.length, 15);
    for (let headerRowIndex = 0; headerRowIndex < maxHeaderScan; headerRowIndex += 1) {
      const candidate = buildCandidate(rows, headerRowIndex, sheetName);
      if (candidate.rows.length > 0) {
        candidates.push(candidate);
      }
    }
  }

  return candidates;
}

function resolveColumns(candidate, aliasMap, requiredFields, sourceName) {
  const normalizedColumns = new Map(
    candidate.headers.map((columnName) => [normalizeHeader(columnName), columnName]),
  );

  const resolved = {};
  for (const [canonicalName, aliases] of Object.entries(aliasMap)) {
    for (const alias of aliases) {
      const actualName = normalizedColumns.get(normalizeHeader(alias));
      if (actualName) {
        resolved[canonicalName] = actualName;
        break;
      }
    }
  }

  const missingFields = [...requiredFields].filter((field) => !resolved[field]);
  if (missingFields.length > 0) {
    const [field] = missingFields;
    if (sourceName === "SAP" && field === "orden") {
      throw new ExcelProcessingError("El archivo SAP no contiene la columna Orden.");
    }
    if (sourceName === "Programa" && field === "orden") {
      throw new ExcelProcessingError("El archivo Programa no contiene la columna Nro OT.");
    }
    throw new ExcelProcessingError(
      `El archivo ${sourceName} no contiene la columna requerida: ${field}.`,
    );
  }

  return resolved;
}

export async function detectExcelSource(file) {
  ensureXlsxFile(file, "Debe cargar un archivo Excel.");
  debugInfo("Leyendo archivo Excel.", {
    fileName: file.name,
    size: file.size,
    type: file.type,
  });

  try {
    const buffer = await file.arrayBuffer();
    debugInfo("ArrayBuffer leido.", {
      fileName: file.name,
      byteLength: buffer.byteLength,
    });

    const workbook = XLSX.read(buffer, {
      type: "array",
      cellDates: true,
    });
    debugInfo("Workbook cargado.", {
      fileName: file.name,
      sheetNames: workbook.SheetNames,
    });

    const candidates = getWorkbookCandidates(workbook);
    debugInfo("Candidatos detectados.", {
      fileName: file.name,
      count: candidates.length,
    });

    debugGroup(`Candidatos para ${file.name}`, () => {
      candidates.forEach((candidate, index) => {
        debugInfo(`Candidato ${index + 1}`, {
          sheetName: candidate.sheetName,
          headers: candidate.headers,
          rowCount: candidate.rows.length,
        });
      });
    });

    if (candidates.length === 0) {
      throw new ExcelProcessingError(
        `No se pudo identificar la estructura del archivo ${file.name}.`,
      );
    }

    for (const candidate of candidates) {
      const matches = [];

      for (const [sourceName, sourceConfig] of Object.entries(SOURCE_DEFINITIONS)) {
        try {
          const columns = resolveColumns(
            candidate,
            sourceConfig.aliasMap,
            sourceConfig.requiredFields,
            sourceName,
          );
          matches.push({
            sourceName,
            columns,
          });
        } catch {
          continue;
        }
      }

      if (matches.length === 1) {
        const [match] = matches;
        debugInfo("Tipo de archivo identificado.", {
          fileName: file.name,
          sourceName: match.sourceName,
          sheetName: candidate.sheetName,
          columns: match.columns,
          rowCount: candidate.rows.length,
        });
        return {
          fileName: file.name,
          sourceName: match.sourceName,
          sheetName: candidate.sheetName,
          columns: match.columns,
          rows: candidate.rows,
        };
      }
    }
  } catch (error) {
    if (error instanceof ExcelProcessingError) {
      debugError("Error controlado al leer Excel.", errorToDebugPayload(error));
      throw error;
    }
    debugError("Error inesperado al leer Excel.", errorToDebugPayload(error));
    throw new ExcelProcessingError("No se pudo leer el archivo Excel.");
  }

  debugInfo("No se pudo determinar el tipo del archivo.", {
    fileName: file.name,
  });
  throw new ExcelProcessingError(
    `No se pudo identificar el tipo del archivo ${file.name}. Revisa las hojas y columnas requeridas.`,
  );
}
