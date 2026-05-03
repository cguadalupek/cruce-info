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
    for token in ("°", "º", "Â°", "Âº"):
        text = text.replace(token, "o")
    text = re.sub(r"[^a-z0-9]+", " ", text)
    return re.sub(r"\s+", " ", text).strip()


def ensure_xlsx_file(upload_file: UploadFile | None, missing_message: str) -> None:
    if upload_file is None:
        raise ExcelProcessingError(missing_message)

    filename = upload_file.filename or ""
    if not filename.lower().endswith(".xlsx"):
        raise ExcelProcessingError("Solo se permiten archivos .xlsx.")


def _clean_dataframe(dataframe: pd.DataFrame) -> pd.DataFrame:
    return dataframe.dropna(axis=0, how="all").dropna(axis=1, how="all")


def _make_unique_headers(headers: list[object]) -> list[str]:
    seen: dict[str, int] = {}
    unique_headers: list[str] = []

    for index, header in enumerate(headers):
        base_header = str(header).strip() if header is not None else f"Unnamed: {index}"
        if not base_header:
            base_header = f"Unnamed: {index}"

        if base_header not in seen:
            seen[base_header] = 0
            unique_headers.append(base_header)
            continue

        seen[base_header] += 1
        unique_headers.append(f"{base_header}.{seen[base_header]}")

    return unique_headers


def _prepare_candidate_dataframe(raw_dataframe: pd.DataFrame, header_row_index: int) -> pd.DataFrame:
    candidate = raw_dataframe.iloc[header_row_index:].copy()
    if candidate.empty:
        return candidate

    headers = candidate.iloc[0].tolist()
    candidate = candidate.iloc[1:].copy()
    candidate.columns = _make_unique_headers(headers)
    return _clean_dataframe(candidate)


def _iter_candidate_dataframes(file_bytes: bytes) -> list[pd.DataFrame]:
    excel_file = pd.ExcelFile(BytesIO(file_bytes), engine="openpyxl")
    candidates: list[pd.DataFrame] = []

    for sheet_name in excel_file.sheet_names:
        raw_dataframe = pd.read_excel(
            excel_file,
            sheet_name=sheet_name,
            header=None,
            dtype=object,
            engine="openpyxl",
        )
        raw_dataframe = _clean_dataframe(raw_dataframe)
        if raw_dataframe.empty:
            continue

        max_header_scan = min(len(raw_dataframe), 15)
        for header_row_index in range(max_header_scan):
            candidate = _prepare_candidate_dataframe(raw_dataframe, header_row_index)
            if not candidate.empty:
                candidates.append(candidate)

    return candidates


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


async def read_excel_for_source(
    upload_file: UploadFile,
    alias_map: dict[str, list[str]],
    required_fields: set[str],
    source_name: str,
    alternate_alias_map: dict[str, list[str]] | None = None,
    alternate_required_fields: set[str] | None = None,
    alternate_source_name: str | None = None,
) -> pd.DataFrame:
    content = await upload_file.read()

    try:
        alternate_match_detected = False
        for candidate in _iter_candidate_dataframes(content):
            try:
                resolve_columns(candidate, alias_map, required_fields, source_name)
                return candidate
            except MissingColumnError:
                if alternate_alias_map and alternate_required_fields and alternate_source_name:
                    try:
                        resolve_columns(
                            candidate,
                            alternate_alias_map,
                            alternate_required_fields,
                            alternate_source_name,
                        )
                        alternate_match_detected = True
                    except MissingColumnError:
                        pass

        if alternate_match_detected and alternate_source_name:
            raise ExcelProcessingError(
                f"Parece que cargaste el archivo {alternate_source_name} en el campo {source_name}."
            )

        resolve_columns(pd.DataFrame(), alias_map, required_fields, source_name)
        raise ExcelProcessingError(f"No se pudo identificar la estructura del archivo {source_name}.")
    except ExcelProcessingError:
        raise
    except Exception as exc:  # pragma: no cover - fallback defensivo
        raise ExcelProcessingError("No se pudo leer el archivo Excel.") from exc


async def detect_excel_source(
    upload_file: UploadFile,
    source_definitions: dict[str, tuple[dict[str, list[str]], set[str]]],
) -> tuple[str, pd.DataFrame]:
    content = await upload_file.read()

    try:
        for candidate in _iter_candidate_dataframes(content):
            matches: list[str] = []
            for source_name, (alias_map, required_fields) in source_definitions.items():
                try:
                    resolve_columns(candidate, alias_map, required_fields, source_name)
                    matches.append(source_name)
                except MissingColumnError:
                    continue

            if len(matches) == 1:
                return matches[0], candidate

        raise ExcelProcessingError(
            f"No se pudo identificar el tipo del archivo {upload_file.filename or 'Excel'}."
        )
    except ExcelProcessingError:
        raise
    except Exception as exc:  # pragma: no cover - fallback defensivo
        raise ExcelProcessingError("No se pudo leer el archivo Excel.") from exc
