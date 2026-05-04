import { startTransition, useDeferredValue, useState } from "react";
import ExportButton from "./components/ExportButton.jsx";
import FileUploadBox from "./components/FileUploadBox.jsx";
import ResultsGrid from "./components/ResultsGrid.jsx";
import SummaryCards from "./components/SummaryCards.jsx";
import { exportResults } from "./services/excelExporter.js";
import { detectExcelSource, ExcelProcessingError } from "./services/excelReader.js";
import { buildProcessedData } from "./services/matcher.js";
import {
  debugError,
  debugGroup,
  debugInfo,
  debugWarn,
  errorToDebugPayload,
} from "./utils/debug.js";

function App() {
  const [semana, setSemana] = useState("");
  const [sapFile, setSapFile] = useState(null);
  const [programaFile, setProgramaFile] = useState(null);
  const [error, setError] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [result, setResult] = useState(null);
  const [inputResetKey, setInputResetKey] = useState(0);

  function handleSapFileChange(file) {
    setSapFile(file);
    setError("");
    debugInfo("Archivo SAP seleccionado.", {
      name: file?.name ?? null,
      size: file?.size ?? null,
      type: file?.type ?? null,
    });
  }

  function handleProgramaFileChange(file) {
    setProgramaFile(file);
    setError("");
    debugInfo("Archivo Programa seleccionado.", {
      name: file?.name ?? null,
      size: file?.size ?? null,
      type: file?.type ?? null,
    });
  }

  async function handleProcess(event) {
    event.preventDefault();
    debugInfo("Click en Procesar archivos.", {
      semana,
      sapLoaded: Boolean(sapFile),
      programaLoaded: Boolean(programaFile),
    });

    if (!semana.trim()) {
      setError("Debe ingresar la semana.");
      debugWarn("Procesamiento detenido: semana vacia.");
      return;
    }
    if (!sapFile) {
      setError("Debe cargar el archivo SAP.");
      debugWarn("Procesamiento detenido: falta archivo SAP.");
      return;
    }
    if (!programaFile) {
      setError("Debe cargar el archivo Programa de Mantenimiento.");
      debugWarn("Procesamiento detenido: falta archivo Programa.");
      return;
    }

    setError("");
    setIsProcessing(true);

    try {
      debugInfo("Iniciando deteccion de archivo SAP.");
      const firstSource = await detectExcelSource(sapFile);
      debugInfo("Deteccion completada para primer archivo.", {
        fileName: firstSource.fileName,
        sourceName: firstSource.sourceName,
        sheetName: firstSource.sheetName,
        rowCount: firstSource.rows.length,
      });

      debugInfo("Iniciando deteccion de archivo Programa.");
      const secondSource = await detectExcelSource(programaFile);
      debugInfo("Deteccion completada para segundo archivo.", {
        fileName: secondSource.fileName,
        sourceName: secondSource.sourceName,
        sheetName: secondSource.sheetName,
        rowCount: secondSource.rows.length,
      });

      if (firstSource.sourceName === secondSource.sourceName) {
        throw new ExcelProcessingError(
          "Los dos archivos parecen ser del mismo tipo. Carga un archivo SAP y un archivo Programa.",
        );
      }

      const response = buildProcessedData({
        semana,
        sapSource: firstSource.sourceName === "SAP" ? firstSource : secondSource,
        programaSource: firstSource.sourceName === "Programa" ? firstSource : secondSource,
      });

      debugGroup("Resultado de procesamiento", () => {
        debugInfo("Resumen generado.", response.resumen);
        debugInfo("Filas generadas.", response.data.length);
        debugInfo("Primeras filas.", response.data.slice(0, 5));
      });

      startTransition(() => {
        setResult(response);
        setSearch("");
      });
    } catch (requestError) {
      setResult(null);
      debugError("Fallo al procesar archivos.", errorToDebugPayload(requestError));
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Ocurrio un error inesperado al procesar los archivos.",
      );
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleExport() {
    if (!result?.data?.length) {
      debugWarn("Exportacion cancelada: no hay resultados.");
      return;
    }

    setIsExporting(true);
    setError("");
    debugInfo("Iniciando exportacion.", {
      semana: result.semana,
      rows: result.data.length,
    });

    try {
      await exportResults({
        semana: result.semana,
        data: result.data,
      });
      debugInfo("Exportacion completada.");
    } catch (requestError) {
      debugError("Fallo al exportar resultados.", errorToDebugPayload(requestError));
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Ocurrio un error inesperado al exportar.",
      );
    } finally {
      setIsExporting(false);
    }
  }

  function handleClear() {
    debugInfo("Limpiando estado de la aplicacion.");
    setSemana("");
    setSapFile(null);
    setProgramaFile(null);
    setError("");
    setSearch("");
    setResult(null);
    setInputResetKey((currentValue) => currentValue + 1);
  }

  function handleFileError(message) {
    debugWarn("Validacion de archivo.", { message });
    setError(message);
  }

  return (
    <div className="page-shell">
      <main className="app-card">
        <section className="hero">
          <p className="eyebrow">Cruce SAP vs Programa</p>
          <h1>Cruce de Ordenes de Mantenimiento</h1>
          <p className="hero-copy">
            Carga ambos Excel, procesa el cruce directamente en tu navegador y
            exporta el resultado final sin enviar archivos a ningun servidor.
          </p>
        </section>

        <form className="panel stack-lg" onSubmit={handleProcess}>
          <div className="field-group">
            <label htmlFor="semana">Semana</label>
            <input
              id="semana"
              className="text-input"
              type="text"
              inputMode="numeric"
              placeholder="Ejemplo: 18"
              value={semana}
              onChange={(event) => setSemana(event.target.value)}
            />
          </div>

          <div className="upload-grid">
            <FileUploadBox
              label="Subir Excel SAP"
              helperText="Archivo .xlsx exportado de SAP."
              file={sapFile}
              onFileChange={handleSapFileChange}
              onValidationError={handleFileError}
              inputId="sap-file"
              resetKey={inputResetKey}
            />
            <FileUploadBox
              label="Subir Excel Programa de Mantenimiento"
              helperText="Archivo .xlsx del programa semanal."
              file={programaFile}
              onFileChange={handleProgramaFileChange}
              onValidationError={handleFileError}
              inputId="programa-file"
              resetKey={inputResetKey}
            />
          </div>

          {error ? <div className="alert-error">{error}</div> : null}

          <p className="inline-note">
            Los archivos se leen y procesan localmente. Solo se admiten
            archivos <strong>.xlsx</strong>.
          </p>

          <div className="actions-row">
            <button className="primary-button" type="submit" disabled={isProcessing}>
              {isProcessing ? "Procesando archivos..." : "Procesar archivos"}
            </button>
            <ExportButton
              disabled={!result?.data?.length || isExporting}
              isLoading={isExporting}
              onClick={handleExport}
            />
            <button className="ghost-button" type="button" onClick={handleClear}>
              Limpiar archivos
            </button>
          </div>
        </form>

        <section className="stack-lg">
          <SummaryCards summary={result?.resumen} />
          <ResultsGrid
            rows={result?.data ?? []}
            search={search}
            deferredSearch={deferredSearch}
            onSearchChange={setSearch}
          />
        </section>
      </main>
    </div>
  );
}

export default App;
