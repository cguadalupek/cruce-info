import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useMemo, useState } from "react";

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
    filterFn: "checklist",
    meta: { filterType: "checklist" },
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
    filterFn: "checklist",
    meta: { filterType: "checklist" },
  },
  {
    accessorKey: "fecha",
    header: "Fecha",
    filterFn: "checklist",
    meta: { filterType: "checklist" },
  },
];

function buildChecklistOptions(rows, accessorKey) {
  const values = new Set();

  for (const row of rows) {
    const value = String(row[accessorKey] ?? "").trim();
    values.add(value);
  }

  return [...values]
    .sort((firstValue, secondValue) => firstValue.localeCompare(secondValue))
    .map((value) => ({
      value,
      label: value || "(Vacio)",
    }));
}

function ChecklistFilter({ column, options }) {
  const selectedValues = column.getFilterValue() ?? [];

  function handleToggle(optionValue) {
    const nextValues = selectedValues.includes(optionValue)
      ? selectedValues.filter((value) => value !== optionValue)
      : [...selectedValues, optionValue];

    column.setFilterValue(nextValues.length ? nextValues : undefined);
  }

  return (
    <details className="checklist-filter">
      <summary className="checklist-summary">
        {selectedValues.length ? `${selectedValues.length} seleccionado(s)` : "Filtrar"}
      </summary>
      <div className="checklist-panel">
        {options.length ? (
          options.map((option) => (
            <label className="checklist-option" key={`${column.id}-${option.label}`}>
              <input
                type="checkbox"
                checked={selectedValues.includes(option.value)}
                onChange={() => handleToggle(option.value)}
              />
              <span>{option.label}</span>
            </label>
          ))
        ) : (
          <span className="checklist-empty">Sin opciones</span>
        )}
      </div>
    </details>
  );
}

function ColumnFilter({ column, rows }) {
  if (column.columnDef.meta?.filterType === "checklist") {
    const options = buildChecklistOptions(rows, column.id);
    return <ChecklistFilter column={column} options={options} />;
  }

  return (
    <input
      className="column-filter"
      type="text"
      placeholder="Filtrar"
      value={column.getFilterValue() ?? ""}
      onChange={(event) => column.setFilterValue(event.target.value)}
    />
  );
}

function ResultsGrid({ rows, search, deferredSearch, onSearchChange }) {
  const [columnFilters, setColumnFilters] = useState([]);

  const filterFns = useMemo(
    () => ({
      checklist: (row, columnId, filterValue) => {
        if (!Array.isArray(filterValue) || filterValue.length === 0) {
          return true;
        }

        const cellValue = String(row.getValue(columnId) ?? "").trim();
        return filterValue.includes(cellValue);
      },
    }),
    [],
  );

  const table = useReactTable({
    data: rows,
    columns,
    filterFns,
    state: {
      columnFilters,
      globalFilter: deferredSearch,
    },
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: onSearchChange,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    globalFilterFn: "includesString",
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
                    {header.isPlaceholder ? null : (
                      <div className="header-cell">
                        <button
                          className="sort-button"
                          type="button"
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          <span className="header-label">
                            {flexRender(header.column.columnDef.header, header.getContext())}
                            <span className="sort-indicator">
                              {header.column.getIsSorted() === "asc"
                                ? "^"
                                : header.column.getIsSorted() === "desc"
                                  ? "v"
                                  : ""}
                            </span>
                          </span>
                        </button>
                        <ColumnFilter column={header.column} rows={rows} />
                      </div>
                    )}
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
