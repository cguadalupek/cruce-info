# Cruce Info

Aplicacion 100% frontend construida con React + Vite + JavaScript para cruzar un Excel SAP con un Excel de Programa de Mantenimiento. Todo el procesamiento ocurre localmente en el navegador: no usa backend, Python, FastAPI, Docker, base de datos ni endpoints.

## Que hace

- Carga un archivo Excel SAP y un archivo Excel de Programa de Mantenimiento.
- Normaliza `Orden` y `Nro OT` antes de comparar.
- Cruza la informacion localmente en el navegador.
- Muestra resumen, filtros por columna y colorea filas por resultado.
- Exporta un Excel final con el reporte procesado.

## Tecnologias

- React
- Vite
- JavaScript
- `xlsx` para lectura de Excel
- `xlsx-js-style` para exportacion con formato basico
- TanStack Table para la grilla filtrable

## Requisitos

- Node.js 18+ recomendado
- npm

## Ejecutar en local

```bash
npm install
npm run dev
```

La app quedara disponible en `http://localhost:3000`.

## Generar build

```bash
npm run build
```

## Probar el build

```bash
npm run preview
```

## Desplegar en GitHub Pages

La configuracion actual usa `base: "/cruce-info/"`, pensada para publicar el repositorio `cruce-info`.

```bash
npm run deploy
```

Esto publica la carpeta `dist/` usando `gh-pages`.

## Uso paso a paso

1. Abrir la aplicacion.
2. Ingresar la semana.
3. Cargar el Excel SAP.
4. Cargar el Excel Programa de Mantenimiento.
5. Presionar `Procesar archivos`.
6. Revisar el resumen y la grilla con filtros.
7. Exportar el reporte con `Exportar Excel`.
8. Usar `Limpiar archivos` para reiniciar y volver a procesar.

## Validaciones incluidas

- El archivo SAP es obligatorio.
- El archivo Programa es obligatorio.
- Solo se admiten archivos `.xlsx`.
- SAP debe contener la columna `Orden`.
- Programa debe contener la columna `Nro OT`.
- Si no se reconoce la estructura o se cargan dos archivos del mismo tipo, la app muestra un mensaje claro.
- No se puede exportar si aun no hay resultados procesados.

## Privacidad

Los Excel se procesan localmente en el navegador. Los archivos no se suben a ningun servidor.
