const SUMMARY_ITEMS = [
  ["total_registros", "Total de registros"],
  ["ordenes_encontradas", "Encontrados en SAP"],
  ["ordenes_no_encontradas", "No encontrados"],
  ["ordenes_pendientes_crear", "Pendientes de crear OT"],
  ["ordenes_duplicadas", "Duplicados"],
  ["ordenes_revisar_estado", "Revisar estado"],
];

function SummaryCards({ summary }) {
  if (!summary) {
    return null;
  }

  return (
    <section className="panel stack-md">
      <div className="section-heading">
        <h2>Resumen</h2>
      </div>
      <div className="summary-grid">
        {SUMMARY_ITEMS.map(([key, label]) => (
          <article className="summary-card" key={key}>
            <span className="summary-value">{summary[key] ?? 0}</span>
            <span className="summary-label">{label}</span>
          </article>
        ))}
      </div>
    </section>
  );
}

export default SummaryCards;
