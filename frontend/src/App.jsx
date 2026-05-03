import { startTransition, useDeferredValue, useState } from "react";
import ExportButton from "./components/ExportButton";
import FileUploadBox from "./components/FileUploadBox";
import ResultsGrid from "./components/ResultsGrid";
import SummaryCards from "./components/SummaryCards";
import { exportResults, processFiles } from "./services/api";

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

  async function handleProcess(event) {
    event.preventDefault();

    if (!semana.trim()) {
      setError("Debe ingresar la semana.");
      return;
    }
    if (!sapFile) {
      setError("Debe cargar el archivo SAP.");
      return;
    }
    if (!programaFile) {
      setError("Debe cargar el archivo Programa de Mantenimiento.");
      return;
    }

    setError("");
    setIsProcessing(true);

    try {
      const response = await processFiles({ semana, sapFile, programaFile });
      startTransition(() => {
        setResult(response);
      });
    } catch (requestError) {
      setResult(null);
      setError(requestError.message);
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleExport() {
    if (!result?.data?.length) {
      return;
    }

    setIsExporting(true);
    setError("");

    try {
      await exportResults({
        semana: result.semana,
        data: result.data,
      });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <div className="page-shell">
      <main className="app-card">
        <section className="hero">
          <p className="eyebrow">Cruce SAP vs Programa</p>
          <h1>Cruce de Ordenes de Mantenimiento</h1>
          <p className="hero-copy">
            Carga los archivos SAP y Programa de Mantenimiento para generar el
            reporte final automaticamente.
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
              onFileChange={setSapFile}
              inputId="sap-file"
            />
            <FileUploadBox
              label="Subir Excel Programa de Mantenimiento"
              helperText="Archivo .xlsx del programa semanal."
              file={programaFile}
              onFileChange={setProgramaFile}
              inputId="programa-file"
            />
          </div>

          {error ? <div className="alert-error">{error}</div> : null}

          <div className="actions-row">
            <button className="primary-button" type="submit" disabled={isProcessing}>
              {isProcessing ? "Procesando archivos..." : "Procesar archivos"}
            </button>
            <ExportButton
              disabled={!result?.data?.length || isExporting}
              isLoading={isExporting}
              onClick={handleExport}
            />
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
