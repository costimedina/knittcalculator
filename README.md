# Calculadora de Tejido

Página web personal: de las medidas del cuerpo en centímetros a puntos, vueltas y ovillos,
a palillo o a crochet. Prendas: gorro, crop top, chaleco y sweater (mangas de hombro caído).

- Spec: `docs/specs/2026-11-11-calculadora-tejido-design.md`
- Plan: `docs/plans/2026-11-11-calculadora-tejido.md`

## Pruebas

```bash
npm test          # node --test (lib/ es puro: sin DOM ni almacenamiento)
```

Revisión visual en tamaño celular: `node tools/serve.js` (puerto 8099) sirve `index.html`
envuelto en el esqueleto del visor de artifacts, con `lib/` y `ui/` tal cual.

## Publicación

Se publica como artifact privado de claude.ai con la herramienta Artifact:

- `file_path: index.html`, y en `files` cada `lib/*.js` y `ui/*.js` en su misma ruta.
- `capabilities: { db: { rules: [{ path: "disenos", read: "admin", write: "admin" }] } }`
  (solo la dueña y Claude leen y escriben los diseños).
- Sin la capacidad `db`, la página cae sola a `localStorage` («Guardado solo en este navegador»).

## Diseños «desde foto»

Claude puede crear un diseño interpretando una foto que la usuaria mande al chat:
escribe con `ArtifactData` (`set`) un documento en la colección `disenos` con la forma
de la spec §4. Campos mínimos:

```json
{
  "id": "<id del documento>",
  "nombre": "Chaleco verde, cuello V",
  "origen": "foto",
  "notaFoto": "Qué se interpretó de la foto, en una frase",
  "tecnica": "palillo | crochet",
  "prenda": "gorro | crop | chaleco | sweater",
  "opciones": { "escote": "redondo | v", "holgura": "ajustada | normal | holgada" },
  "hilado": { "grosor": "fingering | sport | dk | worsted | aran | bulky" },
  "medidas": {},
  "avance": {},
  "actualizado": "<ISO 8601>"
}
```

Las medidas pueden ir vacías: la página las pide y `normalizarDiseno` completa
cualquier campo faltante sin romperse. El diseño aparece en «Mis diseños» con la
marca «desde foto».

## Versión Streamlit (Knitmetry)

`streamlit_app.py` es la misma calculadora como app de Streamlit, con los cálculos
portados a Python en `calculos.py` (misma matemática y redondeos que `lib/*.js`,
verificado con los mismos casos en `test_calculos.py`).

```bash
pip install -r requirements.txt
pytest test_calculos.py   # 42 pruebas
streamlit run streamlit_app.py
```

En Streamlit Community Cloud los diseños duran lo que dure la pestaña; se pueden
descargar e importar como JSON (mismo formato que la colección `disenos` del artifact).
