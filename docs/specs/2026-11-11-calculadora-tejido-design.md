# Calculadora de tejido — Documento de diseño

Fecha: 2026-11-11 · Estado: para revisión

## 1. Propósito

Herramienta web personal (una sola usuaria) para **armar prendas completas** a palillo o a crochet:
a partir de las **medidas del cuerpo en centímetros**, el **hilado** y la **muestra**, entrega una
**receta por pieza** (puntos a montar, vueltas, aumentos y disminuciones) y la **cantidad de material**
(gramos, metros y ovillos).

### Criterios de éxito

- Con medidas y muestra reales, la receta produce una prenda del tamaño esperado (±2 cm de ancho).
- La estimación de material no se queda corta (margen incluido) en los casos de prueba.
- Se usa cómodamente en el celular y en el computador, y los diseños están en ambos.
- Un diseño que Claude crea desde una foto aparece en la herramienta sin pasos manuales.

### Fuera de alcance (por ahora)

- Subir la foto dentro de la página para que la herramienta la interprete (opción B). Se podrá agregar después.
- Mangas montadas (con copa), raglán, canesú, cuellos tejidos aparte, patrones de color o calados.
- Otras unidades distintas de cm.
- Uso por otras personas o compartir diseños.

## 2. Flujo de uso

1. **Técnica:** palillo o crochet (obligatorio elegir).
2. **Prenda y opciones:**

   | Prenda | Opciones |
   |---|---|
   | Gorro | Alto (normal / holgado con doblez), alto del elástico |
   | Crop top | Escote redondo o en V · holgura · alto del elástico |
   | Chaleco | Escote redondo o en V · holgura · alto del elástico |
   | Sweater | Escote redondo o en V · holgura · alto del elástico · mangas de hombro caído |

   En crochet, además, el **punto base**: punto bajo, medio punto o vareta.
3. **Hilado y muestra:** se elige el grosor y se cargan valores iniciales (tabla §3.3).
   Si la usuaria tiene muestra propia de 10×10 cm, ingresa puntos, vueltas y peso de la muestra,
   que reemplazan los valores iniciales. Siempre se piden **gramos por ovillo** y **metros por ovillo**
   (de la etiqueta; con valores iniciales sugeridos).
4. **Medidas (cm):** solo las que la prenda necesita, cada una con una guía breve de cómo tomarla:

   | Prenda | Medidas |
   |---|---|
   | Gorro | Contorno de cabeza, alto deseado |
   | Crop top / Chaleco | Contorno de pecho, largo total (hombro a borde inferior), profundidad de sisa |
   | Sweater | Lo anterior + ancho de hombros, contorno de brazo, contorno de muñeca, largo de brazo (hombro a muñeca) |

5. **Resultado:** receta por pieza con casillas de avance, y resumen de material. Botón para imprimir / PDF.

## 3. Cálculos

Todos los cálculos viven en un módulo puro (`calculos.js`), sin acceso a la pantalla ni a datos guardados.

### 3.1 Base

- `P` = puntos en 10 cm, `V` = vueltas (o hileras) en 10 cm.
- `puntos(cm) = cm × P / 10`, `vueltas(cm) = cm × V / 10`.
- **Redondeo:** al múltiplo válido **más cercano** para el punto de la pieza
  (elástico 2×2 a palillo: múltiplo de 4 + 2 en piezas planas, múltiplo de 4 en circular;
  gorro a palillo: múltiplo de 8; crochet: sin restricción salvo la que imponga el punto).
  Las vueltas se redondean al entero par más cercano (las disminuciones van cada 2 vueltas).
- La receta muestra la **medida real** que resulta del redondeo (ej. «quedará 46,5 cm»).
- **Crochet:** el montaje es una cadena de `N + giro` cadenetas (punto bajo +1, medio punto +2, vareta +3),
  y se dice «hileras» en vez de «vueltas».

### 3.2 Holgura

| Holgura | Se suma al contorno |
|---|---|
| Ajustada | 3 cm |
| Normal | 8 cm |
| Holgada | 15 cm |

El valor se puede editar. El **gorro** usa holgura negativa: contorno × 0,90.

### 3.3 Valores iniciales por grosor

Valores típicos de referencia; la muestra propia los reemplaza.

| Grosor | Palillo | P × V palillo | Aguja crochet | P × V punto bajo | P × V medio punto | P × V vareta | g/100 cm² palillo | Ovillo sugerido |
|---|---|---|---|---|---|---|---|---|
| Fingering | 3 mm | 28 × 36 | 3,5 mm | 24 × 28 | 22 × 18 | 22 × 11 | 2,2 | 50 g / 200 m |
| Sport | 3,5 mm | 24 × 32 | 4 mm | 20 × 24 | 19 × 15 | 19 × 10 | 2,6 | 50 g / 150 m |
| DK | 4 mm | 22 × 30 | 4,5 mm | 18 × 20 | 16 × 13 | 16 × 8 | 3,0 | 50 g / 120 m |
| Worsted | 5 mm | 18 × 24 | 5,5 mm | 14 × 16 | 13 × 10 | 13 × 7 | 4,0 | 100 g / 200 m |
| Aran | 5,5 mm | 16 × 22 | 6 mm | 12 × 14 | 11 × 9 | 11 × 6 | 4,6 | 100 g / 170 m |
| Bulky | 7 mm | 13 × 18 | 8 mm | 10 × 11 | 9 × 7 | 9 × 5 | 6,0 | 100 g / 100 m |

En crochet, el peso inicial por 100 cm² es el de palillo × 1,3 (el tejido es más denso).

### 3.4 Piezas

Notación: `C = pecho + holgura`, `A = C / 2` (ancho de espalda y de delantero).

**Cuerpo (crop top, chaleco, sweater) — espalda y delantero**
- Montar `puntos(A)`. Elástico del alto elegido (por defecto 5 cm; crop top 3 cm).
- Tejer recto hasta `largo total − profundidad de sisa`.
- **Sisa (crop top y chaleco):** reducción total por lado = `0,06 × C` cm. La mitad se cierra
  de una vez al inicio de la sisa; el resto, 1 punto por lado cada 2 vueltas. Luego recto hasta el hombro.
- **Sisa (sweater, hombro caído):** sin reducciones; la pieza sigue recta.
- **Escote redondo:** ancho = ⅓ del ancho después de la sisa. Delantero: empieza 7 cm bajo el hombro;
  se cierra de una vez la mitad central del ancho y el resto en disminuciones de 1 punto a cada lado
  cada vuelta (2 primeras) y luego cada 2 vueltas. Espalda: empieza 2 cm bajo el hombro, se cierra
  el ancho completo de una vez.
- **Escote en V (delantero):** se divide en dos al inicio de la sisa; en cada lado se disminuyen
  `puntos(ancho escote / 2)` repartidos en partes iguales hasta el hombro.
- **Hombros:** se cierran los puntos restantes de cada lado.
- **Chaleco:** elástico de terminación en sisas y escote: recoger `puntos(perímetro) × 0,9`,
  redondeado al múltiplo del elástico; alto 2,5 cm.
- **Crop top:** igual que el chaleco (sin mangas, con terminación en sisas y escote).

**Mangas (sweater, hombro caído)**
- Ancho superior = `2 × profundidad de sisa`.
- Ancho del puño = `muñeca + 4 cm`; elástico de 5 cm.
- Largo de la manga = `largo de brazo − caída`, con `caída = (A − ancho de hombros) / 2`.
- Aumentos: `(puntos superiores − puntos del puño) / 2` aumentos por lado, repartidos en partes iguales
  entre el fin del elástico y 5 cm antes del final («aumentar 1 pt a cada lado cada 8 vueltas, 9 veces»).
- Aviso si el ancho superior es menor que `contorno de brazo + 4 cm` (la manga quedaría apretada).

**Gorro a palillo** (circular)
- Contorno objetivo = cabeza × 0,90. Montar `puntos(objetivo)` redondeado a múltiplo de 8.
- Elástico, luego recto hasta `alto − alto de coronilla`.
- **Coronilla:** 8 secciones; disminuir 1 punto por sección en vueltas alternas hasta 8 puntos;
  pasar la hebra y cerrar. El alto de coronilla se calcula con `V` y el número de vueltas que resulta.

**Gorro a crochet** (desde arriba)
- Diámetro objetivo = `contorno objetivo / π`.
- Anillo mágico con la base del punto (punto bajo 6, medio punto 8, vareta 12).
  Cada vuelta aumenta la base hasta que el diámetro alcanza el objetivo
  (cada vuelta suma `2 × 10 / V` cm al diámetro).
- Luego vueltas rectas hasta el alto; terminar con 3 cm de punto bajo o relieve.

### 3.5 Material

- `área = Σ ancho × largo` de cada pieza en cm² (trapecios para mangas; círculo + cilindro para el gorro
  a crochet; cilindro para el gorro a palillo), incluyendo las terminaciones.
- `gramos = área / 100 × g por 100 cm² × (1 + margen)`, con margen 10 % palillo y 20 % crochet.
  - Con muestra propia: `g por 100 cm²` = peso de la muestra de 10×10 cm.
- `metros = gramos × metros por ovillo / gramos por ovillo`.
- `ovillos = ⌈gramos / gramos por ovillo⌉`.

### 3.6 Validaciones

- Medidas fuera de rango razonable (ej. cabeza < 30 o > 70 cm; pecho < 50 o > 180 cm): aviso, no bloqueo.
- Profundidad de sisa mayor que la mitad del largo total: error, no se calcula.
- Ancho de hombros mayor que `A`: error en el sweater (la caída sería negativa).
- Muestra con valores en 0 o vacíos: se usan los valores iniciales y se indica.

## 4. Datos y diseños guardados

Los diseños se guardan en la **base de datos compartida del artifact** (capacidad `db`), para que estén en el
celular y en el computador y para que Claude pueda escribir diseños desde fotos con `ArtifactData`.

Colección `disenos`, un documento por diseño:

```json
{
  "nombre": "Chaleco verde DK, cuello V",
  "origen": "manual | foto",
  "notaFoto": "texto breve de lo que Claude interpretó (solo si origen = foto)",
  "tecnica": "palillo | crochet",
  "prenda": "gorro | crop | chaleco | sweater",
  "opciones": { "escote": "redondo | v", "holgura": "ajustada | normal | holgada", "holguraCm": 8,
                "altoElastico": 5, "puntoCrochet": "pb | mp | vareta" },
  "hilado": { "grosor": "dk", "P": 22, "V": 30, "gramosMuestra": null,
              "gramosOvillo": 50, "metrosOvillo": 120 },
  "medidas": { "pecho": 92, "largo": 55, "sisa": 20 },
  "avance": { "espalda": [0, 1, 2], "delantero": [] },
  "creado": "2026-11-11T12:00:00Z",
  "actualizado": "2026-11-11T12:00:00Z"
}
```

- La receta **no se guarda**: se recalcula desde los datos (así un ajuste de fórmula corrige los diseños viejos).
- `avance` guarda por pieza los índices de los pasos marcados.
- Acciones: crear, abrir, duplicar (otra talla), editar, borrar (con confirmación).
- **Si la capacidad `db` no está disponible** en la cuenta, se usa el almacenamiento del navegador y se ofrece
  exportar e importar diseños como archivo JSON. Se verifica al implementar.

### Flujo «desde foto»

1. La usuaria manda una foto en el chat con Claude.
2. Claude interpreta prenda, escote, holgura, largo aparente y punto, y lo resume en `notaFoto`.
3. Claude escribe el documento en `disenos` con `origen: "foto"` y medidas en blanco o estimadas.
4. En la herramienta aparece con la marca «desde foto»; la usuaria completa sus medidas y calcula.

## 5. Estructura

```
calculadora-tejido/
  index.html          pantalla: pasos, formulario, receta, lista de diseños, impresión
  calculos.js         módulo puro: tabla de hilados, holgura, piezas, material, validaciones
  test/calculos.test.js  pruebas con node:test
  docs/specs/         este documento
```

- Se publica como **artifact privado** de claude.ai (`index.html` + `calculos.js` como archivo de apoyo).
- No toca el repositorio del panel Meta CDC.
- Diseño para celular primero, con tema claro y oscuro; vista de impresión limpia para la receta.

## 6. Pruebas

Pruebas automáticas de `calculos.js` (`node --test`), entre otras:

- Gorro a palillo, cabeza 56 cm, worsted (18 pts): objetivo 50,4 cm → 90,7 → **88 puntos** (múltiplo de 8).
- Chaleco DK, pecho 92, holgura normal: `C = 100`, `A = 50` → 110 puntos; reducción de sisa 6 cm por lado → 13 puntos por lado.
- Redondeo a múltiplo de 4 + 2 y medida real informada.
- Reparto de aumentos de manga (sin restos mal ubicados).
- Gorro a crochet: número de vueltas de aumento coherente con el diámetro.
- Material: área conocida × peso → gramos, metros y ovillos; margen distinto palillo / crochet.
- Validaciones: sisa demasiado profunda, hombros más anchos que la pieza, muestra vacía.

Además, revisión visual de la página en tamaño celular antes de entregar.
