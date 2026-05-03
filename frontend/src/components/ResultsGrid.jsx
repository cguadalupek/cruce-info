import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";

const columns = [
  {
    accessorKey: "orden",
    header: "Orden",
  },
  {
    accessorKey: "texto_breve",
    header: "Texto breve",
  },
  {
    accessorKey: "descripcion_estado_orden",
    header: "Descripcion de estado de orden",
  },
  {
    accessorKey: "estado_orden",
    header: "Estado de Ord",
  },
  {
    accessorKey: "motivo",
    header: "Motivo",
  },
  {
    accessorKey: "responsable",
    header: "Responsable",
  },
  {
    accessorKey: "fecha",
    header: "Fecha",
  },
];

function ResultsGrid({ rows, search, deferredSearch, onSearchChange }) {
  const table = useReactTable({
    data: rows,
    columns,
    state: {
      globalFilter: deferredSearch,
    },
    onGlobalFilterChange: onSearchChange,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <section className="panel stack-md">
      <div className="section-heading results-heading">
        <h2>Resultados</h2>
        <input
          className="text-input search-input"
          type="search"
          placeholder="Busqueda rapida"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
        />
      </div>

      <div className="table-wrapper">
        <table className="results-table">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th key={header.id}>
                    <button
                      className="sort-button"
                      type="button"
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      <span className="sort-indicator">
                        {header.column.getIsSorted() === "asc"
                          ? " ↑"
                          : header.column.getIsSorted() === "desc"
                            ? " ↓"
                            : ""}
                      </span>
                    </button>
                    <input
                      className="column-filter"
                      type="text"
                      placeholder="Filtrar"
                      value={header.column.getFilterValue() ?? ""}
                      onChange={(event) => header.column.setFilterValue(event.target.value)}
                    />
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className={`result-row result-${row.original.resultado_cruce.toLowerCase()}`}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td className="empty-state" colSpan={columns.length}>
                  {rows.length
                    ? "No hay resultados para los filtros actuales."
                    : "Aun no hay resultados procesados."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default ResultsGrid;
