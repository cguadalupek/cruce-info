from __future__ import annotations

from collections import Counter
from datetime import date, datetime
import math
import re
from typing import Any

import pandas as pd

from .constants import (
    OUTPUT_COLUMNS,
    PROGRAM_COLUMN_ALIASES,
    RESULT_DUPLICADO,
    RESULT_ENCONTRADO,
    RESULT_LABELS,
    RESULT_NO_ENCONTRADO,
    RESULT_PENDIENTE_CREAR,
    RESULT_REVISAR_ESTADO,
    REVIEW_STATUS_ENABLED,
    REVIEW_STATUS_VALUES,
    SAP_COLUMN_ALIASES,
)
from .excel_reader import resolve_columns


def normalize_order(value: Any) -> str:
    if value is None:
        return ""
    if isinstance(value, float) and math.isnan(value):
        return ""

    if isinstance(value, (datetime, date, pd.Timestamp)):
        return value.strftime("%Y-%m-%d")

    text = str(value).strip()
    if not text or text.lower() in {"nan", "none", "null"}:
        return ""

    text = re.sub(r"\.0+$", "", text)
    return text.upper()


def format_text(value: Any) -> str:
    if value is None:
        return ""
    if isinstance(value, float) and math.isnan(value):
        return ""
    return str(value).strip()


def format_date(value: Any) -> str:
    if value is None:
        return ""
    if isinstance(value, float) and math.isnan(value):
        return ""
    if isinstance(value, pd.Timestamp):
        return value.strftime("%Y-%m-%d")
    if isinstance(value, datetime):
        return value.strftime("%Y-%m-%d")
    if isinstance(value, date):
        return value.strftime("%Y-%m-%d")
    return str(value).strip()


def is_pending_create(order: str) -> bool:
    return normalize_order(order) == "CREAR OT"


def should_review_status(status_value: str) -> bool:
    if not REVIEW_STATUS_ENABLED:
        return False
    return normalize_order(status_value) in {
        normalize_order(item) for item in REVIEW_STATUS_VALUES
    }


def build_processed_data(
    sap_dataframe: pd.DataFrame,
    programa_dataframe: pd.DataFrame,
) -> dict[str, Any]:
    sap_columns = resolve_columns(
        sap_dataframe,
        SAP_COLUMN_ALIASES,
        required_fields={"orden"},
        source_name="SAP",
    )
    program_columns = resolve_columns(
        programa_dataframe,
        PROGRAM_COLUMN_ALIASES,
        required_fields={"orden"},
        source_name="Programa",
    )

    sap_records = sap_dataframe.to_dict(orient="records")
    program_records = programa_dataframe.to_dict(orient="records")

    sap_index: dict[str, dict[str, Any]] = {}
    for row in sap_records:
        normalized_order = normalize_order(row.get(sap_columns["orden"]))
        if normalized_order and normalized_order not in sap_index:
            sap_index[normalized_order] = row

    order_counts = Counter()
    for row in program_records:
        normalized_order = normalize_order(row.get(program_columns["orden"]))
        if normalized_order:
            order_counts[normalized_order] += 1

    processed_rows: list[dict[str, str]] = []
    summary = {
        "total_registros": 0,
        "ordenes_encontradas": 0,
        "ordenes_no_encontradas": 0,
        "ordenes_pendientes_crear": 0,
        "ordenes_duplicadas": 0,
        "ordenes_revisar_estado": 0,
    }

    for row in program_records:
        normalized_order = normalize_order(row.get(program_columns["orden"]))
        sap_match = sap_index.get(normalized_order)
        sap_estado_column = sap_columns.get("estado_orden")
        sap_estado = (
            format_text(sap_match.get(sap_estado_column, ""))
            if sap_match and sap_estado_column
            else ""
        )

        if is_pending_create(normalized_order):
            result = RESULT_PENDIENTE_CREAR
        elif normalized_order and order_counts[normalized_order] > 1:
            result = RESULT_DUPLICADO
        elif not normalized_order or sap_match is None:
            result = RESULT_NO_ENCONTRADO
        elif should_review_status(sap_estado):
            result = RESULT_REVISAR_ESTADO
        else:
            result = RESULT_ENCONTRADO

        responsible_column = program_columns.get("responsable")
        responsible = format_text(row.get(responsible_column, "")) if responsible_column else ""
        if not responsible and sap_match:
            sap_responsible_column = sap_columns.get("responsable")
            responsible = (
                format_text(sap_match.get(sap_responsible_column, ""))
                if sap_responsible_column
                else ""
            )

        fecha_column = program_columns.get("fecha")
        fecha = format_date(row.get(fecha_column, "")) if fecha_column else ""
        if not fecha and sap_match:
            sap_fecha_column = sap_columns.get("fecha_inicio_extrema")
            fecha = format_date(sap_match.get(sap_fecha_column, "")) if sap_fecha_column else ""

        processed_row = {
            "orden": normalized_order,
            "texto_breve": format_text(
                sap_match.get(sap_columns.get("texto_breve", ""), "") if sap_match else ""
            ),
            "descripcion_estado_orden": format_text(
                sap_match.get(sap_columns.get("descripcion_estado_orden", ""), "")
                if sap_match
                else ""
            ),
            "estado_orden": sap_estado,
            "motivo": RESULT_LABELS[result],
            "responsable": responsible,
            "fecha": fecha,
            "resultado_cruce": result,
        }
        processed_rows.append(processed_row)

        summary["total_registros"] += 1
        if result == RESULT_ENCONTRADO:
            summary["ordenes_encontradas"] += 1
        elif result == RESULT_NO_ENCONTRADO:
            summary["ordenes_no_encontradas"] += 1
        elif result == RESULT_PENDIENTE_CREAR:
            summary["ordenes_pendientes_crear"] += 1
        elif result == RESULT_DUPLICADO:
            summary["ordenes_duplicadas"] += 1
        elif result == RESULT_REVISAR_ESTADO:
            summary["ordenes_revisar_estado"] += 1

    return {
        "columnas": OUTPUT_COLUMNS,
        "data": processed_rows,
        "resumen": summary,
    }
