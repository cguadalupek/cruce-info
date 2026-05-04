import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Fragment, useEffect, useMemo, useRef, useState } from "react";

import {
  RESULT_DUPLICADO,
  RESULT_ENCONTRADO,
  RESULT_NO_ENCONTRADO,
  RESULT_PENDIENTE_CREAR,
  RESULT_REVISAR_ESTADO,
  RESULT_SIN_OT,
} from "../services/matcher.js";

const RESULT_FILTER_LABELS = {
  [RESULT_ENCONTRADO]: "Encontrados en SAP",
  [RESULT_NO_ENCONTRADO]: "No encontrados",
  [RESULT_PENDIENTE_CREAR]: "Pendientes de crear OT",
  [RESULT_DUPLICADO]: "Duplicados",
  [RESULT_SIN_OT]: "Sin numero de OT",
  [RESULT_REVISAR_ESTADO]: "Revisar estado",
};

const columns = [
  {
    accessorKey: "orden",
    header: "Orden",
    filterFn: "checklist",
    meta: { filterType: "checklist" },
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
    cell: ({ getValue }) => <span className="motivo-cell">{getValue()}</span>,
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
    cell: ({ getValue }) => <span className="fecha-cell">{getValue()}</span>,
  },
];

function buildChecklistOptions(rows, accessorKey) {
  const values = new Set();

  for (const row of rows) {
    const value = String(row[accessorKey] ?? "").trim();
    values.add(value);
  }

  const sortedValues = [...values].sort((firstValue, secondValue) => {
    if (!firstValue && secondValue) {
      return -1;
    }
    if (firstValue && !secondValue) {
      return 1;
    }
    return firstValue.localeCompare(secondValue);
  });

  return sortedValues.map((value) => ({
    value,
    label: value || "(Vacio)",
  }));
}

function ChecklistFilter({ column, options }) {
  const wrapperRef = useRef(null);
  const panelRef = useRef(null);
  const rawFilterValue = column.getFilterValue();
  const currentFilterValue = Array.isArray(rawFilterValue) ? rawFilterValue : [];
  const appliedFilterKey = JSON.stringify([...currentFilterValue].sort());
  const [isOpen, setIsOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [draftValues, setDraftValues] = useState(currentFilterValue);

  useEffect(() => {
    if (!isOpen) {
      setDraftValues((currentValues) => {
        const currentValuesKey = JSON.stringify([...currentValues].sort());
        return currentValuesKey === appliedFilterKey ? currentValues : currentFilterValue;
      });
    }
  }, [appliedFilterKey, currentFilterValue, isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    function handlePointerDown(event) {
      const clickedInsideTrigger = wrapperRef.current?.contains(event.target);
      const clickedInsidePanel = panelRef.current?.contains(event.target);

      if (!clickedInsideTrigger && !clickedInsidePanel) {
        setIsOpen(false);
        setSearchValue("");
        setDraftValues(currentFilterValue);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [currentFilterValue, isOpen]);

  const filteredOptions = useMemo(() => {
    const normalizedSearch = searchValue.trim().toLowerCase();
    if (!normalizedSearch) {
      return options;
    }

    return options.filter((option) => option.label.toLowerCase().includes(normalizedSearch));
  }, [options, searchValue]);

  const visibleOptionValues = filteredOptions.map((option) => option.value);
  const allVisibleSelected =
    visibleOptionValues.length > 0 &&
    visibleOptionValues.every((value) => draftValues.includes(value));

  function handleToggleValue(optionValue) {
    setDraftValues((currentValues) =>
      currentValues.includes(optionValue)
        ? currentValues.filter((value) => value !== optionValue)
        : [...currentValues, optionValue],
    );
  }

  function handleToggleAllVisible() {
    if (allVisibleSelected) {
      setDraftValues((currentValues) =>
        currentValues.filter((value) => !visibleOptionValues.includes(value)),
      );
      return;
    }

    setDraftValues((currentValues) => {
      const nextValues = new Set(currentValues);
      for (const value of visibleOptionValues) {
        nextValues.add(value);
      }
      return [...nextValues];
    });
  }

  function handleApply() {
    column.setFilterValue(draftValues.length ? draftValues : undefined);
    setIsOpen(false);
    setSearchValue("");
  }

  function handleCancel() {
    setDraftValues(currentFilterValue);
    setSearchValue("");
    setIsOpen(false);
  }

  function handleClear() {
    setDraftValues([]);
  }

  const summaryLabel =
    currentFilterValue.length > 0 ? `${currentFilterValue.length} seleccionado(s)` : "Filtrar";

  return (
    <div className="excel-filter" ref={wrapperRef}>
      <button
        className={`excel-filter-trigger${isOpen ? " is-open" : ""}`}
        type="button"
        onClick={() => setIsOpen((currentValue) => !currentValue)}
      >
        <span className="excel-filter-trigger-label">{summaryLabel}</span>
        <span className="excel-filter-trigger-icon">▼</span>
      </button>

      {isOpen ? (
        <div
          ref={panelRef}
          className="excel-filter-panel"
          onMouseDown={(event) => event.stopPropagation()}
        >
          <div className="excel-filter-search">
            <input
              className="excel-filter-search-input"
              type="search"
              placeholder="Buscar"
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
            />
          </div>

          <div className="excel-filter-options">
            <label className="excel-filter-option excel-filter-option-all">
              <input
                className="excel-filter-checkbox"
                type="checkbox"
                checked={allVisibleSelected}
                onMouseDown={(event) => event.stopPropagation()}
                onChange={handleToggleAllVisible}
              />
              <span className="excel-filter-option-label">(Seleccionar todo)</span>
            </label>

            {filteredOptions.length ? (
              filteredOptions.map((option) => (
                <label className="excel-filter-option" key={`${column.id}-${option.label}`}>
                  <input
                    className="excel-filter-checkbox"
                    type="checkbox"
                    checked={draftValues.includes(option.value)}
                    onMouseDown={(event) => event.stopPropagation()}
                    onChange={() => handleToggleValue(option.value)}
                  />
                  <span className="excel-filter-option-label">{option.label}</span>
                </label>
              ))
            ) : (
              <span className="excel-filter-empty">Sin coincidencias</span>
            )}
          </div>

          <div className="excel-filter-actions">
            <button className="excel-filter-action" type="button" onClick={handleClear}>
              Limpiar
            </button>
            <button className="excel-filter-action" type="button" onClick={handleCancel}>
              Cancelar
            </button>
            <button
              className="excel-filter-action excel-filter-action-primary"
              type="button"
              onClick={handleApply}
            >
              Aceptar
            </button>
          </div>
        </div>
      ) : null}
    </div>
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

function ResultsGrid({
  rows,
  search,
  deferredSearch,
  onSearchChange,
  activeResultFilter,
  onClearResults,
  resetFiltersKey,
}) {
  const [columnFilters, setColumnFilters] = useState([]);

  useEffect(() => {
    setColumnFilters([]);
  }, [resetFiltersKey]);

  const visibleRows = useMemo(() => {
    if (!activeResultFilter) {
      return rows;
    }

    return rows.filter((row) => row.resultado_cruce === activeResultFilter);
  }, [activeResultFilter, rows]);

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
    data: visibleRows,
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
        <button
          className="ghost-button results-center-action"
          type="button"
          onClick={onClearResults}
        >
          Limpiar resultados
        </button>
        <div className="results-toolbar">
          <input
            className="text-input search-input"
            type="search"
            placeholder="Busqueda rapida"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
          />
        </div>
      </div>

      {activeResultFilter ? (
        <p className="inline-note">
          Filtro activo: <strong>{RESULT_FILTER_LABELS[activeResultFilter]}</strong>
        </p>
      ) : null}

      <div className="table-wrapper">
        <table className="results-table">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <Fragment key={headerGroup.id}>
                <tr className="results-table-header-row">
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
                        </div>
                      )}
                    </th>
                  ))}
                </tr>
                <tr className="results-table-filter-row">
                  {headerGroup.headers.map((header) => (
                    <th key={`${header.id}-filter`} className="results-table-filter-cell">
                      {header.isPlaceholder ? null : (
                        <ColumnFilter column={header.column} rows={rows} />
                      )}
                    </th>
                  ))}
                </tr>
              </Fragment>
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
                    <td
                      key={cell.id}
                      className={cell.column.id === "fecha" ? "fecha-column-cell" : ""}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td className="empty-state" colSpan={columns.length}>
                  {visibleRows.length
                    ? "No hay resultados para los filtros actuales."
                    : rows.length
                      ? "No hay registros para el resumen seleccionado."
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
