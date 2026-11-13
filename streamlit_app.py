# Knitmetry — calculadora de tejido en Streamlit.
# De las medidas del cuerpo en cm a puntos, vueltas y ovillos, a palillo o crochet.
import json
from datetime import datetime, timezone

import streamlit as st

from calculos import (
    GROSORES, MEDIDAS_POR_PRENDA, ETIQUETAS_MEDIDAS,
    calcular_receta, normalizar_diseno, resolver_muestra,
)

st.set_page_config(page_title="Knitmetry", page_icon="🧶", layout="wide")

PRENDAS = {"gorro": "Gorro", "crop": "Crop top", "chaleco": "Chaleco", "sweater": "Sweater"}
PUNTOS_CROCHET = {"pb": "Punto bajo", "mp": "Medio punto", "vareta": "Vareta"}
HOLGURAS = {"ajustada": "Ajustada (+3 cm)", "normal": "Normal (+8 cm)", "holgada": "Holgada (+15 cm)"}

if "disenos" not in st.session_state:
    st.session_state.disenos = []

# ---- Barra lateral: los 4 pasos ----

with st.sidebar:
    st.header("1 · Técnica")
    tecnica = st.radio("Técnica", ["palillo", "crochet"], horizontal=True,
                       format_func=str.capitalize, label_visibility="collapsed")

    st.header("2 · Prenda")
    prenda = st.radio("Prenda", list(PRENDAS), format_func=PRENDAS.get,
                      index=2, horizontal=True, label_visibility="collapsed")

    opciones = {}
    if prenda != "gorro":
        opciones["escote"] = st.radio("Escote", ["redondo", "v"], horizontal=True,
                                      format_func=lambda e: "Redondo" if e == "redondo" else "En V")
        opciones["holgura"] = st.radio("Holgura", list(HOLGURAS), index=1, format_func=HOLGURAS.get)
    if tecnica == "crochet":
        opciones["puntoCrochet"] = st.radio("Punto base", list(PUNTOS_CROCHET),
                                            format_func=PUNTOS_CROCHET.get, horizontal=True)

    st.header("3 · Hilado y muestra")
    grosor = st.selectbox("Grosor del hilado", [g["id"] for g in GROSORES],
                          index=2, format_func=lambda i: next(g["nombre"] for g in GROSORES if g["id"] == i))
    fila = next(g for g in GROSORES if g["id"] == grosor)
    tipica = resolver_muestra(tecnica, {"grosor": grosor}, opciones.get("puntoCrochet", "pb"))
    herramienta = "Crochet" if tecnica == "crochet" else "Palillo"
    st.caption(f"{herramienta} sugerido: {tipica['herramientaMm']:g} mm · "
               f"muestra típica {tipica['P']:g} pts × {tipica['V']:g} en 10 cm")

    hilado = {"grosor": grosor}
    with st.expander("Tengo mi propia muestra de 10 × 10 cm (más exacto)"):
        hilado["P"] = st.text_input("Puntos en 10 cm", placeholder=f"{tipica['P']:g}")
        hilado["V"] = st.text_input("Hileras en 10 cm" if tecnica == "crochet" else "Vueltas en 10 cm",
                                    placeholder=f"{tipica['V']:g}")
        hilado["gramosMuestra"] = st.text_input("Peso de la muestra (g)", placeholder="ej. 3,5")
    col_go, col_mo = st.columns(2)
    hilado["gramosOvillo"] = col_go.text_input("Gramos por ovillo", placeholder=str(fila["ovillo"]["gramos"]))
    hilado["metrosOvillo"] = col_mo.text_input("Metros por ovillo", placeholder=str(fila["ovillo"]["metros"]))

    st.header("4 · Medidas en centímetros")
    medidas = {}
    for clave in MEDIDAS_POR_PRENDA[prenda]:
        etiqueta = ETIQUETAS_MEDIDAS[clave]
        medidas[clave] = st.text_input(etiqueta["nombre"].capitalize(), key=f"m_{prenda}_{clave}",
                                       placeholder="cm", help=etiqueta["guia"])

diseno = {"tecnica": tecnica, "prenda": prenda, "opciones": opciones,
          "hilado": hilado, "medidas": medidas}

# ---- Centro: la receta ----

st.title("🧶 Knitmetry")
st.caption("Del cuerpo al ovillo: tus medidas en centímetros convertidas en puntos, vueltas y ovillos.")

receta = calcular_receta(diseno)
hay_medidas = any(str(v or "").strip() for v in medidas.values())

if receta["errores"]:
    if hay_medidas or not all(e.startswith("Falta la medida") for e in receta["errores"]):
        for e in receta["errores"]:
            st.error(e)
    else:
        st.info("Ingresa tus medidas en el paso 4 (barra lateral) y la receta aparecerá aquí.")
for a in receta["avisos"]:
    st.warning(a)

if receta["material"]:
    c1, c2, c3 = st.columns(3)
    c1.metric("Gramos", receta["material"]["gramos"])
    c2.metric("Metros", receta["material"]["metros"])
    c3.metric("Ovillos", receta["material"]["ovillos"])
    mu = receta["muestra"]
    st.caption(f"Calculado con {mu['P']:g} pts × {mu['V']:g} en 10 cm · {mu['herramientaMm']:g} mm · "
               "margen de seguridad incluido.")

def receta_como_texto(r):
    lineas = ["Knitmetry — receta", ""]
    for pieza in r["piezas"]:
        extra = f" (×{pieza['cantidad']})" if pieza["cantidad"] > 1 else ""
        lineas.append(f"{pieza['nombre']}{extra}:")
        lineas += [f"  {i + 1}. {paso}" for i, paso in enumerate(pieza["pasos"])]
        lineas.append("")
    if r["material"]:
        m = r["material"]
        lineas.append(f"Material: {m['gramos']} g · {m['metros']} m · {m['ovillos']} ovillo(s).")
    return "\n".join(lineas)

for pieza in receta["piezas"]:
    extra = f" ×{pieza['cantidad']}" if pieza["cantidad"] > 1 else ""
    with st.container(border=True):
        st.subheader(pieza["nombre"] + extra)
        for i, paso in enumerate(pieza["pasos"]):
            st.checkbox(paso, key=f"av_{prenda}_{tecnica}_{pieza['id']}_{i}")

if receta["piezas"]:
    st.download_button("Descargar receta (texto)", receta_como_texto(receta),
                       file_name="receta-knitmetry.txt", mime="text/plain")

# ---- Mis diseños (duran mientras la pestaña esté abierta; exportables a archivo) ----

st.divider()
st.subheader("Mis diseños")
st.caption("En esta versión web los diseños duran mientras la pestaña esté abierta: "
           "descárgalos como archivo para guardarlos y vuelve a importarlos cuando quieras.")

col_nombre, col_boton = st.columns([3, 1], vertical_alignment="bottom")
nombre = col_nombre.text_input("Nombre del diseño", placeholder="ej. Chaleco verde DK")
if col_boton.button("Guardar diseño", use_container_width=True):
    guardado = dict(diseno, nombre=nombre or "Sin nombre",
                    actualizado=datetime.now(timezone.utc).isoformat())
    st.session_state.disenos = [d for d in st.session_state.disenos
                                if d.get("nombre") != guardado["nombre"]] + [guardado]

if st.session_state.disenos:
    for d in reversed(st.session_state.disenos):
        detalle = f"{PRENDAS.get(d.get('prenda'), d.get('prenda'))} · {d.get('tecnica', '')}"
        st.write(f"**{d.get('nombre', 'Sin nombre')}** — {detalle}")
    st.download_button("Descargar mis diseños (JSON)",
                       json.dumps(st.session_state.disenos, ensure_ascii=False, indent=2),
                       file_name="disenos-knitmetry.json", mime="application/json")

archivo = st.file_uploader("Importar diseños desde un archivo JSON", type="json")
if archivo is not None:
    try:
        importados = json.load(archivo)
        if isinstance(importados, dict):
            importados = [importados]
        nuevos = [normalizar_diseno(d) for d in importados if isinstance(d, dict)]
        existentes = {d.get("nombre") for d in st.session_state.disenos}
        st.session_state.disenos += [d for d in nuevos if d["nombre"] not in existentes]
        st.success(f"Importados {len(nuevos)} diseño(s). Elige sus opciones en la barra lateral "
                   "según lo que diga cada uno.")
    except (json.JSONDecodeError, UnicodeDecodeError):
        st.error("El archivo no se pudo leer como JSON de diseños.")
