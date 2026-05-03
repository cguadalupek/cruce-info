from __future__ import annotations

from io import BytesIO
import re
import unicodedata

import pandas as pd
from fastapi import UploadFile


class ExcelProcessingError(Exception):
    pass


class MissingColumnError(ExcelProcessingError):
    pass


def normalize_header(value: object) -> str:
    text = "" if value is None else str(value)
    text = unicodedata.normalize("NFKD", text)
    text = "".join(char for char in text if not unicodedata.combining(char))
    text = text.lower().strip()
    text = text.replace("°", "o").replace("º", "o")
    text = re.sub(r"[^a-z0-9]+", " ", text)
    return re.sub(r"\s+", " ", text).strip()


def ensure_xlsx_file(upload_file: UploadFile | None, missing_message: str) -> None:
    if upload_file is None:
        raise ExcelProcessingError(missing_message)

    filename = upload_file.filename or ""
    if not filename.lower().endswith(".xlsx"):
        raise ExcelProcessingError("Solo se permiten archivos .xlsx.")


def _read_first_non_empty_sheet(file_bytes: bytes) -> pd.DataFrame:
    excel_file = pd.ExcelFile(BytesIO(file_bytes), engine="openpyxl")

    for sheet_name in excel_file.sheet_names:
        dataframe = pd.read_excel(
            excel_file,
            sheet_name=sheet_name,
            dtype=object,
            engine="openpyxl",
        )
        dataframe = dataframe.dropna(axis=0, how="all").dropna(axis=1, how="all")
        if not dataframe.empty:
            return dataframe

    raise ExcelProcessingError("El archivo Excel no contiene hojas con datos.")


async def read_excel(upload_file: UploadFile) -> pd.DataFrame:
    content = await upload_file.read()
    try:
        return _read_first_non_empty_sheet(content)
    except ExcelProcessingError:
        raise
    except Exception as exc:  # pragma: no cover - fallback defensivo
        raise ExcelProcessingError("No se pudo leer el archivo Excel.") from exc


def resolve_columns(
    dataframe: pd.DataFrame,
    alias_map: dict[str, list[str]],
    required_fields: set[str],
    source_name: str,
) -> dict[str, str]:
    normalized_columns = {
        normalize_header(column_name): str(column_name)
        for column_name in dataframe.columns
    }

    resolved: dict[str, str] = {}
    for canonical_name, aliases in alias_map.items():
        for alias in aliases:
            actual_name = normalized_columns.get(normalize_header(alias))
            if actual_name:
                resolved[canonical_name] = actual_name
                break

    missing_fields = [field for field in required_fields if field not in resolved]
    if missing_fields:
        field = missing_fields[0]
        if source_name == "SAP" and field == "orden":
            raise MissingColumnError("El archivo SAP no contiene la columna Orden.")
        if source_name == "Programa" and field == "orden":
            raise MissingColumnError("El archivo Programa no contiene la columna N°OT.")
        raise MissingColumnError(
            f"El archivo {source_name} no contiene la columna requerida: {field}."
        )

    return resolved
