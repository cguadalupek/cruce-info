# Cruce Excel Mantenimiento

Proyecto full stack para cruzar un consolidado SAP con un Programa de Mantenimiento, visualizar resultados y exportar un Excel final con formato.

## Estructura

```text
backend/
frontend/
README.md
```

## Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

## Frontend

```bash
cd frontend
npm install
npm run dev
```

## Flujo

1. Ingresar la semana.
2. Cargar el Excel SAP.
3. Cargar el Excel Programa de Mantenimiento.
4. Procesar archivos.
5. Revisar el resumen y la grilla filtrable.
6. Exportar el reporte final a Excel.
