# Calculadora de tejido — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Objetivo:** Página web personal que, desde técnica (palillo/crochet), prenda, hilado/muestra y medidas en cm, entrega una receta por pieza y el material necesario, con diseños guardados.

**Arquitectura:** Módulos ES puros en `lib/` (cálculos sin DOM ni almacenamiento) probados con `node --test`; una página `index.html` con JS sin framework que importa esos módulos; un módulo de almacenamiento que usa la capacidad `db` del artifact y cae a `localStorage` si no está. Se publica como artifact privado de claude.ai con `lib/*.js` como archivos de apoyo.

**Tecnología:** HTML + CSS + JavaScript (módulos ES), Node 22 (`node:test`, `node:assert/strict`), Playwright preinstalado para la revisión visual.

**Spec:** `docs/specs/2026-11-11-calculadora-tejido-design.md` (leerlo junto con este plan).

**Carpeta del proyecto:** `/tmp/claude-0/-home-user-METACDC/54c2cd28-94ff-5543-88b1-6cff89c4493b/scratchpad/calculadora-tejido` (repositorio git propio; **no** es el repo del panel Meta CDC). Todas las rutas del plan son relativas a ella.

## Restricciones globales

- Unidades: solo centímetros. Se acepta coma decimal en las entradas («92,5»).
- Textos de la interfaz y de la receta en español de Chile; «vueltas» a palillo, «hileras» a crochet (en gorro a crochet: «vueltas», porque es circular).
- Sin dependencias de npm en tiempo de ejecución; sin bundler.
- Holgura por defecto: ajustada 3 cm, normal 8 cm, holgada 15 cm. Gorro: contorno × 0,90.
- Margen de material: 10 % palillo, 20 % crochet. Peso inicial crochet = peso palillo × 1,3.
- Redondeo de puntos al múltiplo válido más cercano; en empate, hacia arriba. Vueltas: `2 × Math.round(cm × V / 20)`.
- Elástico a palillo: múltiplo de 4 + 2 en piezas planas, múltiplo de 4 en circular, múltiplo de 8 en gorro. Crochet: múltiplo 1.
- Ningún número de la receta puede ser negativo, `NaN` ni `Infinity`: si no se puede calcular, va a `errores`.
- Tabla de grosores: exactamente la de la spec §3.3 (6 grosores).
- La receta no se guarda; se recalcula desde el diseño.
- Antes de cualquier `Math.ceil`/`Math.floor` sobre un resultado con decimales, redondear a 6 decimales (`+x.toFixed(6)`) para que `197,99999999` no se convierta en 198 ni `198,0000001` en 199.

## Desviaciones acordadas respecto de la spec

- `calculos.js` se divide en módulos pequeños dentro de `lib/` (mismo contenido, más fácil de probar).
- Gorro a crochet: las vueltas de aumento se calculan por **cantidad de puntos** (hasta alcanzar `puntos(objetivo)`), no por diámetro; el diámetro se informa. Es más exacto porque no depende de que el círculo quede plano.

## Puntos de revisión (no cubiertos por casos «felices»)

1. **Medidas vacías, 0 o texto** → `calcularReceta` devuelve `errores` («Falta la medida: contorno de pecho») y `piezas: []`, nunca `NaN`. Prueba en Tarea 7.
2. **Coma decimal** («92,5», « 56 ») → se interpreta como número. Prueba en Tarea 1.
3. **Prenda muy chica con sisa grande** (ej. pecho 50, holgura ajustada, escote que se come los hombros) → error «Los hombros quedan sin puntos», no números negativos. Prueba en Tarea 4.
4. **Diseño escrito por Claude desde foto con campos faltantes** → `normalizarDiseno` completa valores por defecto y la página lo abre sin romperse. Prueba en Tarea 3.
5. **Sin capacidad `db`** (página abierta fuera de claude.ai, o `use("db")` → `null`) → la página funciona igual con `localStorage` y muestra «Guardado solo en este navegador». Verificación en Tarea 9.

---

## Formas de datos compartidas

```js
// Diseño (lo que se guarda) — ver spec §4
{ id, nombre, origen: "manual"|"foto", notaFoto, tecnica: "palillo"|"crochet",
  prenda: "gorro"|"crop"|"chaleco"|"sweater",
  opciones: { escote: "redondo"|"v", holgura: "ajustada"|"normal"|"holgada", holguraCm: number,
              altoElastico: number, puntoCrochet: "pb"|"mp"|"vareta" },
  hilado: { grosor, P: number|null, V: number|null, gramosMuestra: number|null,
            gramosOvillo: number|null, metrosOvillo: number|null },
  medidas: { cabeza, alto, pecho, largo, sisa, hombros, brazo, muneca, largoBrazo },
  avance: { [piezaId]: number[] }, creado, actualizado }

// Muestra resuelta
{ P, V, g100, gramosOvillo, metrosOvillo, herramientaMm, usaInicial: boolean }

// Pieza
{ id: string, nombre: string, cantidad: number, datos: Record<string, number>,
  pasos: string[], areaCm2: number }   // areaCm2 es por unidad; el total usa × cantidad

// Receta
{ piezas: Pieza[], material: { gramos, metros, ovillos } | null,
  muestra: MuestraResuelta | null, avisos: string[], errores: string[] }
```

---

### Tarea 1: Proyecto y funciones base

**Archivos:**
- Crear: `package.json` (`{"name":"calculadora-tejido","private":true,"type":"module","scripts":{"test":"node --test test/"}}`)
- Crear: `lib/base.js`
- Prueba: `test/base.test.js`

**Interfaces:**
- Produce:
  - `parseCm(valor: string|number|null): number|null` — acepta coma o punto y espacios; vacío, texto o ≤ 0 → `null`.
  - `puntos(cm: number, P: number): number` — sin redondear (`cm × P / 10`).
  - `vueltas(cm: number, V: number): number` — `2 × Math.round(cm × V / 20)`.
  - `redondearMultiplo(n: number, multiplo: number, resto = 0): number` — múltiplo `k × multiplo + resto` más cercano a `n`, empate hacia arriba, mínimo `multiplo + resto`.
  - `cmReales(puntos: number, P: number): number` — `puntos × 10 / P`, redondeado a 0,5 cm.
  - `holguraCm(opciones): number` — `opciones.holguraCm` si es número válido; si no, 3/8/15 según `opciones.holgura` (por defecto «normal»).

- [ ] **Paso 1: Escribir pruebas que fallan** en `test/base.test.js`:
  - `parseCm("92,5") === 92.5`, `parseCm(" 56 ") === 56`, `parseCm("") === null`, `parseCm("abc") === null`, `parseCm(0) === null`, `parseCm(-3) === null`.
  - `puntos(50, 22) === 110`; `vueltas(7, 30) === 22`; `vueltas(35, 30) === 106`.
  - `redondearMultiplo(90.72, 8) === 88`; `redondearMultiplo(96.8, 4, 2) === 98`; `redondearMultiplo(44, 4, 2) === 46` (empate 42/46 → arriba); `redondearMultiplo(3, 4, 2) === 6` (mínimo).
  - `cmReales(88, 18) === 49` (48,9 → 49,0).
  - `holguraCm({holgura:"ajustada"}) === 3`, `holguraCm({}) === 8`, `holguraCm({holgura:"holgada", holguraCm: 12}) === 12`.
- [ ] **Paso 2:** `npm test` → FALLA (módulo no existe).
- [ ] **Paso 3:** Implementar `lib/base.js` con esas firmas.
- [ ] **Paso 4:** `npm test` → PASA.
- [ ] **Paso 5:** Commit `feat: funciones base de medidas y redondeo`.

### Tarea 2: Tabla de hilados y muestra

**Archivos:**
- Crear: `lib/hilados.js`
- Prueba: `test/hilados.test.js`

**Interfaces:**
- Produce:
  - `GROSORES: Array<{ id, nombre, palilloMm, crochetMm, palillo: {P,V}, pb: {P,V}, mp: {P,V}, vareta: {P,V}, g100: number, ovillo: {gramos, metros} }>` — los 6 de la spec §3.3, ids `fingering|sport|dk|worsted|aran|bulky`.
  - `resolverMuestra(tecnica, hilado, puntoCrochet = "pb"): MuestraResuelta` — parte de la fila del grosor (palillo, o el punto de crochet); reemplaza `P`, `V` por los de `hilado` si son válidos; `g100` = `gramosMuestra` si es válido, si no el de la tabla (× 1,3 en crochet); `gramosOvillo`/`metrosOvillo` de `hilado` o del ovillo sugerido. `usaInicial` = true si alguno de P, V o g100 vino de la tabla. Grosor desconocido → usa `dk`.

- [ ] **Paso 1: Pruebas que fallan:**
  - `GROSORES.length === 6`; DK palillo `{P:22,V:30}`, `palilloMm === 4`, ovillo `{gramos:50, metros:120}`.
  - `resolverMuestra("palillo", {grosor:"worsted"})` → `P 18, V 24, g100 4, gramosOvillo 100, metrosOvillo 200, herramientaMm 5, usaInicial true`.
  - `resolverMuestra("crochet", {grosor:"worsted"}, "pb")` → `P 14, V 16, g100 5.2, herramientaMm 5.5`.
  - `resolverMuestra("palillo", {grosor:"dk", P:"21", V:"28,5", gramosMuestra:"3,4"})` → `P 21, V 28.5, g100 3.4, usaInicial false`.
  - `resolverMuestra("palillo", {grosor:"inventado"}).P === 22`.
- [ ] **Paso 2:** `npm test` → FALLA.
- [ ] **Paso 3:** Implementar `lib/hilados.js` (usa `parseCm` de Tarea 1 para leer números).
- [ ] **Paso 4:** `npm test` → PASA.
- [ ] **Paso 5:** Commit `feat: tabla de hilados y muestra resuelta`.

### Tarea 3: Diseño normalizado y validaciones

**Archivos:**
- Crear: `lib/diseno.js`
- Prueba: `test/diseno.test.js`

**Interfaces:**
- Consume: `parseCm`, `holguraCm` (Tarea 1).
- Produce:
  - `MEDIDAS_POR_PRENDA: Record<prenda, string[]>` — gorro `["cabeza","alto"]`; crop y chaleco `["pecho","largo","sisa"]`; sweater esas + `["hombros","brazo","muneca","largoBrazo"]`.
  - `ETIQUETAS_MEDIDAS: Record<string, {nombre, guia}>` — nombre visible y guía de cómo medir (una frase cada una).
  - `normalizarDiseno(parcial): Diseno` — completa lo faltante: `nombre "Sin nombre"`, `origen "manual"`, `tecnica "palillo"`, `prenda "chaleco"`, `opciones {escote:"redondo", holgura:"normal", altoElastico: 5 (crop: 3), puntoCrochet:"pb"}`, `hilado {grosor:"dk"}`, `medidas {}`, `avance {}`; números como string se convierten con `parseCm`. Nunca lanza.
  - `validar(diseno): { errores: string[], avisos: string[] }` — reglas de la spec §3.6:
    - Falta cada medida requerida → error `Falta la medida: <nombre>`.
    - `sisa > largo / 2` → error `La profundidad de sisa no puede ser más de la mitad del largo total.`
    - Sweater: `hombros > (pecho + holgura) / 2` → error `El ancho de hombros es mayor que el ancho de la pieza.`
    - Aviso fuera de rango: cabeza < 30 o > 70; pecho < 50 o > 180.

- [ ] **Paso 1: Pruebas que fallan:**
  - `normalizarDiseno({prenda:"chaleco", origen:"foto"})` → tiene `opciones.escote "redondo"`, `hilado.grosor "dk"`, `medidas {}` y no lanza (Punto de revisión 4).
  - `normalizarDiseno({medidas:{pecho:"92,5"}}).medidas.pecho === 92.5`.
  - `validar(chaleco sin pecho).errores` incluye `"Falta la medida: contorno de pecho"`.
  - `validar(chaleco pecho 92, largo 30, sisa 20).errores` incluye el error de sisa.
  - `validar(sweater pecho 92 normal, hombros 60).errores` incluye el error de hombros.
  - `validar(gorro cabeza 80, alto 21).avisos.length === 1` y `errores.length === 0`.
- [ ] **Paso 2:** `npm test` → FALLA.
- [ ] **Paso 3:** Implementar `lib/diseno.js`.
- [ ] **Paso 4:** `npm test` → PASA.
- [ ] **Paso 5:** Commit `feat: diseño normalizado y validaciones`.

### Tarea 4: Cuerpo (espalda, delantero y terminaciones)

**Archivos:**
- Crear: `lib/cuerpo.js`
- Prueba: `test/cuerpo.test.js`

**Interfaces:**
- Consume: Tarea 1, `MuestraResuelta` (Tarea 2), `Diseno` normalizado y validado (Tarea 3).
- Produce: `piezasCuerpo(diseno, muestra): { piezas: Pieza[], errores: string[] }` para `crop`, `chaleco`, `sweater`. Piezas: `espalda`, `delantero` (cantidad 1 cada una) y, en crop/chaleco, `terminaciones` (elástico de sisas y escote).

`datos` de espalda/delantero (todos en puntos o vueltas):
`montar, vueltasHastaSisa, sisaCierre, sisaDisminuciones, puntosTrasSisa, escoteCentral, escoteLado, hombro, vueltasEscote`.
Reglas (spec §3.4): `A = (pecho + holgura) / 2`; `montar = redondearMultiplo(puntos(A, P), 4, 2)` palillo (crochet: `max(1, Math.round(...))`); `vueltasHastaSisa = vueltas(largo − sisa, V)`; reducción por lado `r = Math.round(puntos(0.06 × C, P))`, `sisaCierre = Math.ceil(r / 2)`, `sisaDisminuciones = r − sisaCierre` (1 por lado cada 2 vueltas); en sweater `r = 0`. `puntosTrasSisa = montar − 2r`. `anchoEscote = 2 × Math.round(puntosTrasSisa / 6)`, y si `puntosTrasSisa − anchoEscote` es impar se le suma 1 (así `hombro` siempre es entero). Escote redondo: `escoteLado = floor(anchoEscote / 4)`, `escoteCentral = anchoEscote − 2 × escoteLado`; delantero `vueltasEscote = vueltas(7, V)`, espalda `vueltas(2, V)` y cierra todo de una vez. Escote en V: `escoteLado = floor(anchoEscote / 2)` repartidos desde el inicio de la sisa; `escoteCentral = anchoEscote − 2 × escoteLado` (0 o 1 punto central que se cierra al dividir). `hombro = (puntosTrasSisa − anchoEscote) / 2`. Si `hombro < 1` → error `Los hombros quedan sin puntos: revisa holgura o medidas.` y sin piezas.
Terminaciones: perímetro de sisas ≈ `2 × 2 × sisa` y escote ≈ `anchoEscote cm × 2 + 2 × 7`; puntos a recoger = `redondearMultiplo(puntos(perímetro, P) × 0.9, 4)`; alto 2,5 cm.
`pasos`: frases en el orden de tejido, con los números de `datos` y la medida real (`cmReales`). Crochet: «Tejer una cadeneta de N + giro» (giro pb 1, mp 2, vareta 3) e «hileras».
`areaCm2`: `A × largo` por pieza; terminaciones `perímetro × 2.5`.

- [ ] **Paso 1: Pruebas que fallan** (chaleco palillo DK P 22 V 30, pecho 92, holgura normal, largo 55, sisa 20, escote redondo):
  - espalda: `montar 110, vueltasHastaSisa 106, sisaCierre 7, sisaDisminuciones 6, puntosTrasSisa 84`.
  - delantero: `escoteCentral + 2 × escoteLado === 28`, `hombro === 28`, `vueltasEscote === 22`.
  - Escote en V: `escoteCentral === 0`, `hombro === 28`.
  - Sweater con mismas medidas + hombros 40: `sisaCierre 0`, `puntosTrasSisa 110`, sin pieza `terminaciones`.
  - Crochet pb (P 14): `montar === Math.round(50 × 1.4) === 70` y algún paso contiene `"cadeneta de 71"`.
  - Punto de revisión 3: crochet, pecho 5, holgura ajustada, largo 10, sisa 4, muestra `{P:2, V:2}` (montar 1, ancho de escote 1, hombro 0) → `errores` con «Los hombros quedan sin puntos» y `piezas.length === 0`.
  - Todo `hombro` es entero: chaleco crochet pb DK (P 18) con pecho 93 → `Number.isInteger(delantero.datos.hombro)`.
  - Ninguna cifra de `datos` es negativa ni `NaN` en los casos válidos.
- [ ] **Paso 2:** `npm test` → FALLA.
- [ ] **Paso 3:** Implementar `lib/cuerpo.js`.
- [ ] **Paso 4:** `npm test` → PASA.
- [ ] **Paso 5:** Commit `feat: cálculo de espalda, delantero y terminaciones`.

### Tarea 5: Mangas de hombro caído

**Archivos:**
- Crear: `lib/mangas.js`
- Prueba: `test/mangas.test.js`

**Interfaces:**
- Consume: Tarea 1, `MuestraResuelta`, `Diseno`.
- Produce: `piezaMangas(diseno, muestra): { pieza: Pieza|null, avisos: string[] }` — `id "mangas"`, `cantidad 2`, `datos: { montar, puntosSuperiores, aumentosPorLado, cadaVueltas, vueltasElastico, vueltasTotales }`.

Reglas: `A` como en Tarea 4; `caida = (A − hombros) / 2`; `largoManga = largoBrazo − caida`; `puntosSuperiores = redondearMultiplo(puntos(2 × sisa, P), 4, 2)`; `montar = redondearMultiplo(puntos(muneca + 4, P), 4, 2)`; `aumentosPorLado = (puntosSuperiores − montar) / 2`; zona = `vueltas(largoManga − 5 − 5, V)`; `cadaVueltas = max(2, mayor par ≤ floor(zona / aumentosPorLado))`; si `aumentosPorLado ≤ 0` → `aumentosPorLado 0`, `cadaVueltas 0` y paso «Tejer recto, sin aumentos». Aviso si `2 × sisa < brazo + 4`: `La manga puede quedar apretada en el brazo.` `areaCm2 = (2·sisa + muneca + 4) / 2 × largoManga`.

- [ ] **Paso 1: Pruebas que fallan** (DK P 22 V 30, pecho 92 normal, hombros 40, sisa 22, muñeca 15, brazo 30, largoBrazo 58):
  - `montar 42, puntosSuperiores 98, aumentosPorLado 28, cadaVueltas 4`, `cantidad 2`, sin avisos.
  - Brazo 45 → aviso de manga apretada.
  - Muñeca 40 (puño ≥ superior) → `aumentosPorLado 0`, `cadaVueltas 0`, sin `NaN`/`Infinity`.
- [ ] **Paso 2:** `npm test` → FALLA.
- [ ] **Paso 3:** Implementar `lib/mangas.js`.
- [ ] **Paso 4:** `npm test` → PASA.
- [ ] **Paso 5:** Commit `feat: mangas de hombro caído`.

### Tarea 6: Gorro (palillo y crochet)

**Archivos:**
- Crear: `lib/gorro.js`
- Prueba: `test/gorro.test.js`

**Interfaces:**
- Consume: Tarea 1, `MuestraResuelta`, `Diseno`.
- Produce: `piezaGorro(diseno, muestra): Pieza` — `id "gorro"`, `cantidad 1`.
  - Palillo, `datos: { montar, vueltasElastico, vueltasRecto, vueltasCoronilla, puntosFinales }`: `objetivo = cabeza × 0.9`; `montar = redondearMultiplo(puntos(objetivo, P), 8)`; coronilla en 8 secciones, una vuelta de disminución (−8) y una normal hasta 8 puntos → `vueltasCoronilla = 2 × (montar − 8) / 8`; `vueltasRecto = max(0, vueltas(alto − altoElastico, V) − vueltasCoronilla)`; `puntosFinales 8`. `areaCm2 = objetivo × alto`.
  - Crochet, `datos: { base, vueltasAumento, puntosFinales, vueltasRecto, vueltasBorde, diametroCm }`: `base` pb 6, mp 8, vareta 12; `vueltasAumento = ceil(puntos(objetivo, P) / base)`; `puntosFinales = base × vueltasAumento`; `vueltasBorde = Math.round(3 × V / 10)`; `vueltasRecto = max(0, Math.round((alto − 3) × V / 10) − vueltasAumento)`; `diametroCm = objetivo / π` a 1 decimal. Vueltas circulares: sin forzar pares. `areaCm2 = π (d/2)² + objetivo × (alto − d/2)`.

- [ ] **Paso 1: Pruebas que fallan** (cabeza 56, alto 21, elástico 5):
  - Palillo worsted (P 18, V 24): `montar 88, vueltasCoronilla 20, puntosFinales 8, vueltasRecto === vueltas(16, 24) − 20 === 18`.
  - Crochet worsted pb (P 14, V 16): `base 6, vueltasAumento 12, puntosFinales 72, diametroCm 16`.
  - Crochet vareta: `base 12`.
- [ ] **Paso 2:** `npm test` → FALLA.
- [ ] **Paso 3:** Implementar `lib/gorro.js`.
- [ ] **Paso 4:** `npm test` → PASA.
- [ ] **Paso 5:** Commit `feat: gorro a palillo y a crochet`.

### Tarea 7: Material y receta completa

**Archivos:**
- Crear: `lib/material.js`, `lib/receta.js`
- Prueba: `test/material.test.js`, `test/receta.test.js`

**Interfaces:**
- Consume: Tareas 1–6.
- Produce:
  - `calcularMaterial(areaTotalCm2, muestra, tecnica): { gramos, metros, ovillos }` — `gramos = ceil(area / 100 × g100 × (1 + margen))` (margen 0,10 palillo, 0,20 crochet); `metros = ceil(gramos × metrosOvillo / gramosOvillo)`; `ovillos = ceil(gramos / gramosOvillo)`.
  - `calcularReceta(parcial): Receta` — **única función que usa la página**: `normalizarDiseno` → `validar` → si hay errores, `{piezas: [], material: null, errores, avisos}`; si no, `resolverMuestra` → piezas según prenda (gorro: `piezaGorro`; crop/chaleco: `piezasCuerpo`; sweater: `piezasCuerpo` + `piezaMangas`) → `calcularMaterial(Σ areaCm2 × cantidad)`. Si `muestra.usaInicial`, agrega aviso `Se usó la muestra típica del hilado; con tu propia muestra el cálculo es más exacto.` Nunca lanza: cualquier excepción inesperada se convierte en error `No se pudo calcular: <mensaje>`.

- [ ] **Paso 1: Pruebas que fallan:**
  - `calcularMaterial(5500, {g100:3, gramosOvillo:50, metrosOvillo:120}, "palillo")` → `{gramos:182, metros:437, ovillos:4}`.
  - Mismo con `"crochet"` → `gramos === 198`.
  - `calcularReceta` chaleco del caso de Tarea 4 → piezas `["espalda","delantero","terminaciones"]`, `material.ovillos ≥ 1`, aviso de muestra típica.
  - Sweater → incluye `"mangas"` con `cantidad 2`.
  - Gorro palillo → una pieza `"gorro"`.
  - Punto de revisión 1: `calcularReceta({prenda:"chaleco", medidas:{pecho:"", largo:"abc"}})` → `piezas.length === 0`, `material === null`, `errores.length ≥ 1`, y `JSON.stringify(receta)` no contiene `NaN` ni `null` dentro de `piezas`.
- [ ] **Paso 2:** `npm test` → FALLA.
- [ ] **Paso 3:** Implementar `lib/material.js` y `lib/receta.js`.
- [ ] **Paso 4:** `npm test` → PASA (todas las pruebas del proyecto).
- [ ] **Paso 5:** Commit `feat: material y receta completa`.

### Tarea 8: Página — formulario por pasos y receta

**Archivos:**
- Crear: `index.html` (estructura, estilos, guion principal como `<script type="module">`)
- Crear: `ui/formulario.js`, `ui/receta-vista.js`

**Interfaces:**
- Consume: `calcularReceta`, `GROSORES`, `MEDIDAS_POR_PRENDA`, `ETIQUETAS_MEDIDAS`, `normalizarDiseno`.
- Produce:
  - `montarFormulario(contenedor, diseno, alCambiar: (diseno) => void): void`
  - `mostrarReceta(contenedor, receta, avance, alMarcar: (piezaId, paso, marcado) => void): void`

Comportamiento (spec §2):
- Antes de escribir la página: cargar la skill `artifact-design` y seguir su contrato (título de 2–4 palabras, tokens de color en `:root` con tema oscuro, `body` con fondo explícito, ancho de celular con margen de 16 px y sin scroll horizontal).
- Cuatro pasos visibles en una sola página (técnica → prenda y opciones → hilado y muestra → medidas), luego la receta. Técnica obligatoria (dos botones grandes). En crochet aparece «punto base».
- Al elegir grosor se muestran palillo/aguja y la muestra típica como *placeholder*; los campos de muestra propia son opcionales.
- Solo se muestran las medidas de `MEDIDAS_POR_PRENDA[prenda]`, cada una con su guía.
- Recalcular en cada cambio (con espera de 300 ms). Errores en rojo arriba de la receta; avisos en ámbar.
- Receta: una tarjeta por pieza («×2» si `cantidad > 1`), pasos con casillas; resumen de material destacado (gramos, metros, ovillos) con la muestra usada.
- Botón «Imprimir / PDF» → `window.print()`; CSS `@media print` oculta formulario y botones.
- Los textos visibles se asignan con `textContent` (nunca `innerHTML` con datos).

- [ ] **Paso 1:** Cargar `artifact-design`; escribir `index.html`, `ui/formulario.js`, `ui/receta-vista.js` (sin almacenamiento aún: el diseño vive en memoria).
- [ ] **Paso 2:** Verificar con Playwright (servidor estático local `npx -y http-server -p 8080` o `python3 -m http.server 8080`), viewport 390×844: elegir palillo → chaleco → DK → pecho 92, largo 55, sisa 20; la receta muestra «110» en la espalda y un total de ovillos; sin errores en la consola; `document.documentElement.scrollWidth <= 390`. Repetir con crochet y gorro. Captura a `deviceScaleFactor: 1` para revisión propia.
- [ ] **Paso 3:** Commit `feat: página con formulario por pasos y receta`.

### Tarea 9: Mis diseños, avance y almacenamiento

**Archivos:**
- Crear: `lib/almacen.js`, `ui/disenos-vista.js`
- Modificar: `index.html` (lista «Mis diseños», nombre del diseño, botones guardar/duplicar/borrar)
- Prueba: `test/almacen.test.js`

**Interfaces:**
- Produce:
  - `crearAlmacen({ db, storage }): Almacen` — `db` es el namespace de `claude.use("db")` o `null`; `storage` es `localStorage` o un objeto en memoria (si `localStorage` lanza).
  - `Almacen = { modo: "nube"|"local", listar(): Promise<Diseno[]>, guardar(diseno): Promise<Diseno>, borrar(id): Promise<void>, escuchar(fn: (disenos) => void): () => void }`.
    - Nube: colección `disenos`; `guardar` hace `set` del documento completo (asigna `id` con `collection("disenos").doc()` si no tiene, y `actualizado` = ahora); `escuchar` = **una** suscripción `onSnapshot` ordenada por `actualizado desc`.
    - Local: clave `calculadora-tejido:disenos` (JSON); toda lectura/escritura dentro de `try/catch`.
  - `montarListaDisenos(contenedor, disenos, acciones: { abrir, duplicar, borrar }): void` — marca «desde foto» si `origen === "foto"` y muestra `notaFoto`.
- Arranque en `index.html`: la página se pinta de inmediato en modo local; `claude.use("db")` se resuelve después (con `window.claude?.use` — si no existe, se queda en local); si devuelve namespace, cambia a nube y recarga la lista. Indicador visible: «Guardado en tu cuenta» / «Guardado solo en este navegador».
- Avance: marcar una casilla actualiza `diseno.avance[piezaId]` y guarda (una escritura por cambio, esperando la anterior). Duplicar = copia con nombre «<nombre> (copia)», sin `id` y con `avance {}`. Borrar pide confirmación.
- Declaración al publicar: `capabilities: { db: { rules: [{ path: "disenos", read: "admin", write: "admin" }] } }` (solo la dueña lee y escribe aunque comparta el link).

- [ ] **Paso 1: Pruebas que fallan** (`almacen.test.js`, con `storage` en memoria y `db: null`): `modo === "local"`; `guardar` asigna `id` y `actualizado`; `listar` devuelve lo guardado ordenado por `actualizado` desc; `borrar` lo quita; un `storage` cuyo `getItem` lanza → `listar()` devuelve `[]` sin lanzar.
- [ ] **Paso 2:** `npm test` → FALLA.
- [ ] **Paso 3:** Implementar `lib/almacen.js`, `ui/disenos-vista.js` y conectar en `index.html`.
- [ ] **Paso 4:** `npm test` → PASA. Playwright (Punto de revisión 5): sin `window.claude`, guardar un diseño, recargar → sigue en la lista; marcar dos pasos, recargar → siguen marcados; el indicador dice «Guardado solo en este navegador».
- [ ] **Paso 5:** Commit `feat: mis diseños, avance y almacenamiento`.

### Tarea 10: Publicar, verificar y diseño de prueba «desde foto»

**Archivos:**
- Crear: `README.md` (cómo correr pruebas, cómo publicar, forma del documento `disenos` para que Claude escriba diseños desde fotos)

- [ ] **Paso 1:** Publicar con la herramienta Artifact: `file_path: index.html`, `files` con cada `lib/*.js` y `ui/*.js` en su misma ruta, `icon: "yarn"`, `capabilities` de la Tarea 9, descripción de una frase.
- [ ] **Paso 2:** Con `ArtifactData` (`set`) escribir en `disenos` un diseño de ejemplo con `origen: "foto"`, `notaFoto` y medidas vacías; `list` de `disenos` → aparece una fila con esos campos.
- [ ] **Paso 3:** `list` de `disenos` con `as_level` de visitante → no devuelve filas (las reglas lo ocultan).
- [ ] **Paso 4:** Borrar el diseño de ejemplo con `ArtifactData` (`delete`) para entregar la base vacía, salvo que la usuaria quiera conservarlo.
- [ ] **Paso 5:** Escribir `README.md`; commit `docs: README y publicación`.
- [ ] **Paso 6:** Entregar el link a la usuaria y decir en una línea qué se verificó y qué no (p. ej., la vista en el celular real la revisa ella).
