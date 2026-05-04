import {
  RESULT_DUPLICADO,
  RESULT_ENCONTRADO,
  RESULT_NO_ENCONTRADO,
  RESULT_PENDIENTE_CREAR,
  RESULT_REVISAR_ESTADO,
  RESULT_SIN_OT,
} from "../services/matcher.js";

const SUMMARY_ITEMS = [
  ["total_registros", "Total de registros", null],
  ["ordenes_encontradas", "Encontrados en SAP", RESULT_ENCONTRADO],
  ["ordenes_no_encontradas", "No encontrados", RESULT_NO_ENCONTRADO],
  ["ordenes_pendientes_crear", "Pendientes de crear OT", RESULT_PENDIENTE_CREAR],
  ["ordenes_duplicadas", "Duplicados", RESULT_DUPLICADO],
  ["ordenes_sin_ot", "Sin numero de OT", RESULT_SIN_OT],
  ["ordenes_revisar_estado", "Revisar estado", RESULT_REVISAR_ESTADO],
];

function SummaryCards({ summary, activeSummaryKey, onSelectSummary }) {
  const resolvedSummary = summary ?? Object.fromEntries(
    SUMMARY_ITEMS.map(([key]) => [key, 0]),
  );
  const hasSummary = Boolean(summary);

  return (
    <section className="panel stack-md">
      <div className="section-heading">
        <h2>Resumen</h2>
      </div>
      <div className="summary-grid">
        {SUMMARY_ITEMS.map(([key, label, resultValue]) => (
          <button
            className={`summary-card${activeSummaryKey === key ? " is-active" : ""}`}
            key={key}
            type="button"
            disabled={!hasSummary}
            onClick={() => onSelectSummary?.(key, resultValue)}
          >
            <span className="summary-value">{resolvedSummary[key] ?? 0}</span>
            <span className="summary-label">{label}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

export default SummaryCards;
