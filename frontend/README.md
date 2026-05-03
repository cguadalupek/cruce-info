# Frontend

Aplicacion React + Vite para cargar dos archivos Excel, procesarlos contra la API FastAPI y exportar el reporte final.

## Ejecutar localmente

```bash
cd frontend
npm install
npm run dev
```

## Configuracion

Por defecto la app consume la API en `http://127.0.0.1:8000`.

Puedes cambiarlo creando un archivo `.env` con:

```bash
VITE_API_BASE_URL=http://127.0.0.1:8000
```
