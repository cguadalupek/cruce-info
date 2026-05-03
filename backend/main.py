from __future__ import annotations

from typing import Literal

from fastapi import FastAPI, File, Form, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from pydantic import BaseModel, Field

from services import (
    ExcelProcessingError,
    build_export_file,
    build_processed_data,
    detect_excel_source,
    ensure_xlsx_file,
)
from services.constants import PROGRAM_COLUMN_ALIASES, SAP_COLUMN_ALIASES

app = FastAPI(title="Cruce Excel Mantenimiento API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ProcessedRow(BaseModel):
    orden: str = ""
    texto_breve: str = ""
    descripcion_estado_orden: str = ""
    estado_orden: str = ""
    motivo: str = ""
    responsable: str = ""
    fecha: str = ""
    resultado_cruce: Literal[
        "ENCONTRADO",
        "NO_ENCONTRADO",
        "PENDIENTE_CREAR",
        "DUPLICADO",
        "REVISAR_ESTADO",
    ]


class ExportRequest(BaseModel):
    semana: str = Field(min_length=1)
    data: list[ProcessedRow]


@app.get("/api/health")
async def healthcheck() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/api/procesar")
async def procesar_archivos(
    semana: str = Form(""),
    sap_file: UploadFile | None = File(None),
    programa_file: UploadFile | None = File(None),
):
    try:
        if not semana.strip():
            raise ExcelProcessingError("Debe ingresar la semana.")

        ensure_xlsx_file(sap_file, "Debe cargar el archivo SAP.")
        ensure_xlsx_file(programa_file, "Debe cargar el archivo Programa de Mantenimiento.")

        source_definitions = {
            "SAP": (SAP_COLUMN_ALIASES, {"orden"}),
            "Programa": (PROGRAM_COLUMN_ALIASES, {"orden"}),
        }

        first_source_name, first_dataframe = await detect_excel_source(
            sap_file,
            source_definitions,
        )
        second_source_name, second_dataframe = await detect_excel_source(
            programa_file,
            source_definitions,
        )

        if first_source_name == second_source_name:
            raise ExcelProcessingError(
                "Los dos archivos parecen ser del mismo tipo. Carga un archivo SAP y un archivo Programa."
            )

        detected_dataframes = {
            first_source_name: first_dataframe,
            second_source_name: second_dataframe,
        }

        sap_dataframe = detected_dataframes["SAP"]
        programa_dataframe = detected_dataframes["Programa"]
        result = build_processed_data(sap_dataframe, programa_dataframe)

        return {
            "semana": semana.strip(),
            "resumen": result["resumen"],
            "columnas": result["columnas"],
            "data": result["data"],
        }
    except ExcelProcessingError as exc:
        return JSONResponse(status_code=400, content={"error": str(exc)})


@app.post("/api/exportar")
async def exportar_reporte(payload: ExportRequest):
    if not payload.semana.strip():
        return JSONResponse(status_code=400, content={"error": "Debe ingresar la semana."})

    export_stream = build_export_file(payload.semana.strip(), [row.model_dump() for row in payload.data])
    filename = f"reporte_cruce_semana_{payload.semana.strip()}.xlsx"

    return StreamingResponse(
        export_stream,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
