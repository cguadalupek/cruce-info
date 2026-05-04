# Cruce Info

Aplicacion web 100% frontend construida con React + Vite + JavaScript para cruzar un Excel SAP con un Excel de Programa de Mantenimiento.

Todo el procesamiento ocurre localmente en el navegador:
- no usa backend;
- no usa Python, FastAPI ni Docker;
- no usa base de datos;
- no consume endpoints;
- no sube archivos a ningun servidor.

## Objetivo

El aplicativo permite comparar ordenes de trabajo entre:
- un archivo Excel exportado desde SAP;
- un archivo Excel del Programa de Mantenimiento.

Con esa comparacion, genera:
- un resumen por categoria de cruce;
- una tabla filtrable de resultados;
- un archivo Excel final exportable.

## Stack Tecnologico

- React 19
- Vite 6
- JavaScript
- TanStack Table
- `xlsx`
- `xlsx-js-style`
- `gh-pages`

## Funcionalidades Principales

- Carga de dos archivos `.xlsx`:
  - Excel SAP
  - Excel Programa de Mantenimiento
- Deteccion automatica del tipo de archivo segun hojas y encabezados.
- Procesamiento local en navegador.
- Cruce por orden normalizada.
- Resumen de resultados.
- Tabla con:
  - busqueda rapida;
  - filtros por columna;
  - filtros checklist tipo Excel en columnas seleccionadas.
- Filtro por tarjetas del resumen.
- Coloreado visual de filas segun resultado.
- Exportacion de Excel con formato.
- Limpieza total de archivos.
- Limpieza solo del resultado procesado.

## Estructura del Proyecto

```text
cruce-info/
├─ public/
├─ src/
│  ├─ components/
│  │  ├─ ExportButton.jsx
│  │  ├─ FileUploadBox.jsx
│  │  ├─ ResultsGrid.jsx
│  │  └─ SummaryCards.jsx
│  ├─ services/
│  │  ├─ excelExporter.js
│  │  ├─ excelReader.js
│  │  └─ matcher.js
│  ├─ utils/
│  │  ├─ debug.js
│  │  └─ normalize.js
│  ├─ App.jsx
│  ├─ main.jsx
│  └─ styles.css
├─ index.html
├─ package.json
├─ vite.config.js
└─ README.md
```

## Componentes del Aplicativo

### `App.jsx`

Es el orquestador principal de la aplicacion.

Responsabilidades:
- manejar el estado general;
- recibir archivos;
- ejecutar el procesamiento;
- manejar exportacion;
- limpiar archivos o resultados;
- coordinar resumen y tabla.

Estados importantes:
- `semana`
- `sapFile`
- `programaFile`
- `error`
- `isProcessing`
- `isExporting`
- `search`
- `result`
- `activeSummaryKey`
- `activeSummaryResult`

### `FileUploadBox.jsx`

Componente reutilizable para cargar archivos Excel.

Responsabilidades:
- seleccionar archivo;
- validar extension `.xlsx`;
- mostrar nombre del archivo cargado;
- enviar archivo al estado principal.

### `SummaryCards.jsx`

Renderiza el bloque de resumen.

Comportamiento:
- muestra cada categoria del resumen;
- cada tarjeta funciona como boton de filtro;
- si no hay resultados procesados, muestra el resumen en `0`;
- si una tarjeta esta activa, queda resaltada visualmente.

### `ResultsGrid.jsx`

Renderiza la tabla de resultados usando TanStack Table.

Incluye:
- busqueda rapida;
- boton `Limpiar resultados`;
- filtros de texto;
- filtros checklist;
- estado vacio;
- filas coloreadas;
- filtro adicional por seleccion de tarjeta del resumen.

### `ExportButton.jsx`

Dispara la exportacion del reporte procesado.

### `styles.css`

Contiene todos los estilos visuales del aplicativo:
- layout general;
- tarjetas del resumen;
- tabla;
- filtros;
- botones;
- colores por tipo de resultado.

## Servicios

### `excelReader.js`

Se encarga de leer y clasificar los Excel cargados.

Responsabilidades:
- validar que el archivo exista;
- validar extension `.xlsx`;
- leer workbook con `xlsx`;
- recorrer hojas;
- probar distintas filas de encabezado;
- detectar si el archivo corresponde a SAP o Programa;
- resolver aliases de columnas.

Detecciones clave:
- `Orden` para SAP
- `Nro OT` o equivalentes para Programa
- columnas complementarias como:
  - texto breve
  - descripcion de estado
  - estado de orden
  - motivo
  - responsable
  - fecha

### `matcher.js`

Contiene la logica del cruce.

Responsabilidades:
- normalizar ordenes;
- indexar SAP por orden;
- detectar repetidos en Programa;
- clasificar cada fila;
- construir resumen;
- deduplicar filas exactamente iguales;
- exponer columnas visibles y colores de exportacion.

Resultados soportados:
- `ENCONTRADO`
- `NO_ENCONTRADO`
- `PENDIENTE_CREAR`
- `DUPLICADO`
- `SIN_OT`
- `REVISAR_ESTADO`

### `excelExporter.js`

Construye el Excel de salida con formato.

Incluye:
- hoja `Resultado`;
- titulo `SEMANA <n>`;
- encabezados en negrita;
- color por fila segun `resultado_cruce`;
- ancho automatico aproximado por columna.

## Utilidades

### `normalize.js`

Funciones auxiliares para:
- normalizar encabezados;
- normalizar ordenes;
- formatear fechas;
- formatear texto;
- conservar texto multilinea en `Motivo`.

### `debug.js`

Centraliza logs de depuracion con prefijo del proyecto.

## Flujo Funcional del Usuario

1. Ingresar la semana.
2. Cargar el archivo SAP.
3. Cargar el archivo Programa de Mantenimiento.
4. Presionar `Procesar archivos`.
5. Revisar:
   - resumen;
   - tabla;
   - filtros;
   - colores de resultado.
6. Opcionalmente:
   - filtrar desde las tarjetas del resumen;
   - usar busqueda rapida;
   - usar filtros por columna;
   - exportar a Excel.
7. Limpiar:
   - `Limpiar resultados` para vaciar solo el procesamiento actual;
   - `Limpiar archivos` para reiniciar completamente la carga.

## Reglas de Cruce

La aplicacion compara principalmente la orden del Programa con la orden SAP normalizada.

### Clasificacion de resultados

#### `SIN_OT`

Se asigna cuando el registro del Programa no tiene OT o el valor es vacio.

#### `PENDIENTE_CREAR`

Se asigna cuando la OT del Programa corresponde a `CREAR OT`.

#### `DUPLICADO`

Se asigna cuando una misma OT aparece mas de una vez en el Programa de Mantenimiento.

#### `NO_ENCONTRADO`

Se asigna cuando la OT existe en Programa pero no se encuentra en SAP.

#### `REVISAR_ESTADO`

La logica esta preparada pero desactivada por defecto.

Configuracion actual:
- `REVIEW_STATUS_ENABLED = false`
- `REVIEW_STATUS_VALUES = []`

#### `ENCONTRADO`

Se asigna cuando la OT fue encontrada correctamente en SAP y no cae en ninguno de los casos anteriores.

## Resumen

El resumen muestra:
- total de registros;
- encontrados en SAP;
- no encontrados;
- pendientes de crear OT;
- duplicados;
- sin numero de OT;
- revisar estado.

Cada tarjeta:
- actua como filtro visual sobre la tabla;
- puede activarse y desactivarse;
- se resalta cuando esta seleccionada.

## Tabla de Resultados

Columnas visibles actuales:
- `Orden`
- `Texto breve`
- `Descripcion de estado de orden`
- `Estado de Ord`
- `Motivo`
- `Responsable`
- `Fecha`

### Filtros disponibles

#### Busqueda rapida

Busca sobre la tabla completa.

#### Filtros de texto

Disponibles en columnas de texto libre.

#### Filtros checklist tipo Excel

Disponibles en:
- `Orden`
- `Descripcion de estado de orden`
- `Responsable`
- `Fecha`

## Limpieza de Estado

### `Limpiar resultados`

Limpia solo el resultado procesado:
- borra la tabla;
- resetea el resumen a `0`;
- limpia filtros;
- limpia busqueda rapida;
- mantiene archivos y semana cargados.

Uso esperado:
- volver a procesar sin recargar archivos.

### `Limpiar archivos`

Reinicia completamente la aplicacion:
- semana;
- archivos cargados;
- errores;
- resultado;
- resumen;
- filtros;
- tabla.

## Manejo de Texto en `Motivo`

La columna `Motivo`:
- prioriza la fuente Programa;
- si no existe, toma SAP;
- si tampoco existe, usa una descripcion fallback por resultado.

Adicionalmente:
- conserva saltos de linea detectados en el Excel;
- renderiza esos saltos en la tabla con `white-space: pre-line`.

## Colores por Resultado

La app colorea las filas segun el resultado del cruce.

Mapa actual:
- `ENCONTRADO`: verde claro
- `NO_ENCONTRADO`: rojo claro
- `PENDIENTE_CREAR`: amarillo claro
- `DUPLICADO`: azul claro
- `SIN_OT`: gris claro
- `REVISAR_ESTADO`: naranja claro

## Validaciones Incluidas

- La semana es obligatoria.
- El archivo SAP es obligatorio.
- El archivo Programa es obligatorio.
- Solo se admiten archivos `.xlsx`.
- SAP debe contener la columna `Orden`.
- Programa debe contener la columna `Nro OT` o equivalente detectado.
- Si los dos archivos parecen ser del mismo tipo, se bloquea el procesamiento.
- Si no se reconoce la estructura del workbook, se muestra error claro.
- No se permite exportar si no hay resultados procesados.

## Formato de Archivos Esperados

### Archivo SAP

Debe contener al menos:
- `Orden`

Y puede contener, segun disponibilidad:
- `Texto breve`
- `Descripcion de estado de orden`
- `Estado de Ord`
- `Responsable`
- `Fecha de inicio extrema`
- columnas equivalentes a `Motivo`

### Archivo Programa de Mantenimiento

Debe contener al menos:
- `Nro OT` o equivalente

Y puede contener:
- `Motivo`
- `Responsable`
- `Fecha`

## Scripts Disponibles

### Instalar dependencias

```bash
npm install
```

### Ejecutar en desarrollo

```bash
npm run dev
```

URL local:

```text
http://localhost:3000
```

### Generar build

```bash
npm run build
```

### Probar build local

```bash
npm run preview
```

### Desplegar en GitHub Pages

```bash
npm run deploy
```

## GitHub Pages

La configuracion actual de [vite.config.js](C:/proyectos/cruce-info/vite.config.js) usa:

```js
base: "/cruce-info/"
```

Eso significa que el repositorio debe publicarse bajo el nombre:

```text
cruce-info
```

Si el nombre del repositorio cambia, debe actualizarse `base`.

El despliegue publica la carpeta `dist/` usando `gh-pages`.

## Dependencias del Proyecto

Dependencias principales declaradas en [package.json](C:/proyectos/cruce-info/package.json):

- `react`
- `react-dom`
- `@tanstack/react-table`
- `xlsx`
- `xlsx-js-style`

Dependencias de desarrollo:

- `vite`
- `@vitejs/plugin-react`
- `gh-pages`

## Notas de Desarrollo

- El procesamiento es local y no genera trafico de red funcional al presionar `Procesar archivos`.
- Existen logs de depuracion en consola con prefijo del proyecto.
- El bundle final es grande por el uso de librerias Excel; Vite puede advertir por tamano de chunk, pero eso no bloquea el funcionamiento.

## Privacidad

Los archivos Excel:
- se leen en el navegador;
- se procesan localmente;
- no se envian a servidores externos.

## Estado Actual del Proyecto

La app esta preparada para:
- ejecutarse localmente;
- procesar archivos reales sin backend;
- exportar reporte;
- desplegarse en GitHub Pages.
