# Cruce Excel Mantenimiento

Proyecto full stack para cruzar un consolidado SAP con un Programa de Mantenimiento, visualizar resultados y exportar un Excel final con formato.

## Requisitos

- Docker Desktop instalado

## Estructura

```text
backend/
frontend/
docker-compose.yml
README.md
```

## Ejecucion

```bash
docker compose up --build
```

## Abrir aplicacion

```text
http://localhost:3000
```

El backend quedara disponible en:

```text
http://localhost:8000
http://localhost:8000/docs
```

## Detener aplicacion

```bash
docker compose down
```

## Uso del sistema

1. Ingresar la semana.
2. Cargar el Excel SAP.
3. Cargar el Excel Programa de Mantenimiento.
4. Procesar archivos.
5. Revisar el resumen y la grilla filtrable.
6. Exportar el reporte final a Excel.

## Notas tecnicas

- El frontend corre en `http://localhost:3000`.
- El backend corre en `http://localhost:8000`.
- El frontend usa la variable `VITE_API_URL=http://localhost:8000`.
- No se agrego login, base de datos, roles ni historial.
