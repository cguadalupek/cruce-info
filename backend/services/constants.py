from __future__ import annotations

RESULT_ENCONTRADO = "ENCONTRADO"
RESULT_NO_ENCONTRADO = "NO_ENCONTRADO"
RESULT_PENDIENTE_CREAR = "PENDIENTE_CREAR"
RESULT_DUPLICADO = "DUPLICADO"
RESULT_REVISAR_ESTADO = "REVISAR_ESTADO"

RESULT_LABELS = {
    RESULT_ENCONTRADO: "Orden encontrada en SAP",
    RESULT_NO_ENCONTRADO: "Orden no encontrada en SAP",
    RESULT_PENDIENTE_CREAR: "Pendiente de crear orden de trabajo",
    RESULT_DUPLICADO: "Orden duplicada en programa de mantenimiento",
    RESULT_REVISAR_ESTADO: "Orden encontrada, revisar estado",
}

RESULT_COLORS = {
    RESULT_ENCONTRADO: "D9EAD3",
    RESULT_NO_ENCONTRADO: "F4CCCC",
    RESULT_PENDIENTE_CREAR: "FFF2CC",
    RESULT_DUPLICADO: "D0E0E3",
    RESULT_REVISAR_ESTADO: "FCE5CD",
}

VISIBLE_EXPORT_COLUMNS = [
    ("orden", "Orden"),
    ("texto_breve", "Texto breve"),
    ("descripcion_estado_orden", "Descripcion de estado de orden"),
    ("estado_orden", "Estado de Ord"),
    ("motivo", "Motivo"),
    ("responsable", "Responsable"),
    ("fecha", "Fecha"),
]

OUTPUT_COLUMNS = [
    "orden",
    "texto_breve",
    "descripcion_estado_orden",
    "estado_orden",
    "motivo",
    "responsable",
    "fecha",
    "resultado_cruce",
]

SAP_COLUMN_ALIASES = {
    "orden": [
        "orden",
    ],
    "texto_breve": [
        "texto breve",
    ],
    "descripcion_estado_orden": [
        "descripcion de estado de orden",
        "descripción de estado de orden",
        "desc estado orden",
        "desc. estado orden",
    ],
    "estado_orden": [
        "estado de ord",
        "estado de orden",
        "estado orden",
        "estado de ord.",
        "estado de orden sap",
        "estado del sistema",
    ],
    "responsable": [
        "responsable",
        "informacion de contacto autor",
        "información de contacto autor",
        "autor",
    ],
    "fecha_inicio_extrema": [
        "fecha de inicio extrema",
        "fecha inicio extrema",
        "fecha de inicio extrema america lima",
    ],
}

PROGRAM_COLUMN_ALIASES = {
    "orden": [
        "n°ot",
        "nºot",
        "n ot",
        "ot",
        "nro ot",
        "numero ot",
        "n° ot",
        "nº ot",
        "no ot",
    ],
    "responsable": [
        "responsable",
        "responsable ejecucion",
        "responsable ejecución",
    ],
    "fecha": [
        "fecha",
    ],
}

REVIEW_STATUS_ENABLED = False
REVIEW_STATUS_VALUES: set[str] = set()
