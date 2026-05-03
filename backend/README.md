# Backend

API FastAPI para procesar dos archivos Excel, cruzar ordenes de mantenimiento y exportar el resultado final con formato.

## Ejecutar localmente

```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

## Endpoints

- `POST /api/procesar`
- `POST /api/exportar`
- `GET /api/health`
