import { RESULT_COLORS, VISIBLE_EXPORT_COLUMNS } from "./matcher.js";

function createCellStyle({ fillColor = "FFFFFF", bold = false, center = false } = {}) {
  return {
    font: { bold },
    fill: {
      patternType: "solid",
      fgColor: { rgb: fillColor },
    },
    alignment: {
      vertical: "center",
      horizontal: center ? "center" : "left",
      wrapText: true,
    },
    border: {
      top: { style: "thin", color: { rgb: "000000" } },
      bottom: { style: "thin", color: { rgb: "000000" } },
      left: { style: "thin", color: { rgb: "000000" } },
      right: { style: "thin", color: { rgb: "000000" } },
    },
  };
}

export async function exportResults({ semana, data }) {
  if (!data?.length) {
    throw new Error("No hay resultados para exportar.");
  }

  const xlsxModule = await import("xlsx-js-style");
  const XLSX = xlsxModule.default ?? xlsxModule;
  const cleanWeek = semana.trim();
  const title = `SEMANA ${cleanWeek}`;
  const headers = VISIBLE_EXPORT_COLUMNS.map(([, label]) => label);
  const rows = data.map((row) =>
    VISIBLE_EXPORT_COLUMNS.map(([fieldName]) => row[fieldName] ?? ""),
  );

  const worksheet = XLSX.utils.aoa_to_sheet([[title], headers, ...rows]);
  worksheet["!merges"] = [
    {
      s: { r: 0, c: 0 },
      e: { r: 0, c: VISIBLE_EXPORT_COLUMNS.length - 1 },
    },
  ];
  worksheet["!cols"] = VISIBLE_EXPORT_COLUMNS.map(([fieldName], index) => {
    const headerLength = headers[index].length;
    const maxValueLength = data.reduce((maxLength, row) => {
      const currentLength = String(row[fieldName] ?? "").length;
      return Math.max(maxLength, currentLength);
    }, headerLength);

    return { wch: Math.min(Math.max(maxValueLength + 2, 14), 45) };
  });

  const titleAddress = XLSX.utils.encode_cell({ r: 0, c: 0 });
  worksheet[titleAddress].s = {
    font: { bold: true, sz: 14 },
    alignment: { horizontal: "center", vertical: "center" },
  };

  headers.forEach((_, columnIndex) => {
    const headerAddress = XLSX.utils.encode_cell({ r: 1, c: columnIndex });
    worksheet[headerAddress].s = createCellStyle({
      fillColor: "D9EAD3",
      bold: true,
      center: true,
    });
  });

  data.forEach((row, rowIndex) => {
    const fillColor = RESULT_COLORS[row.resultado_cruce] ?? "FFFFFF";
    VISIBLE_EXPORT_COLUMNS.forEach((_, columnIndex) => {
      const cellAddress = XLSX.utils.encode_cell({ r: rowIndex + 2, c: columnIndex });
      if (worksheet[cellAddress]) {
        worksheet[cellAddress].s = createCellStyle({ fillColor });
      }
    });
  });

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Resultado");
  XLSX.writeFile(workbook, `reporte_cruce_semana_${cleanWeek}.xlsx`);
}
