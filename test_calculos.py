# Pruebas del port a Python: los mismos casos y cifras que test/*.test.js.
import pytest
from calculos import (
    parse_cm, puntos, vueltas, redondear_multiplo, cm_reales, holgura_cm,
    GROSORES, resolver_muestra,
    MEDIDAS_POR_PRENDA, ETIQUETAS_MEDIDAS, normalizar_diseno, validar,
    piezas_cuerpo, pieza_mangas, pieza_gorro,
    calcular_material, calcular_receta,
)

# ---- base ----

def test_parse_cm_acepta_coma_punto_espacios():
    assert parse_cm("92,5") == 92.5
    assert parse_cm(" 56 ") == 56
    assert parse_cm(21.5) == 21.5

def test_parse_cm_invalidos():
    for v in ["", "abc", 0, -3, None]:
        assert parse_cm(v) is None

def test_puntos_y_vueltas():
    assert puntos(50, 22) == 110
    assert vueltas(7, 30) == 22
    assert vueltas(35, 30) == 106

def test_redondear_multiplo():
    assert redondear_multiplo(90.72, 8) == 88
    assert redondear_multiplo(96.8, 4, 2) == 98
    assert redondear_multiplo(44, 4, 2) == 46   # empate hacia arriba
    assert redondear_multiplo(3, 4, 2) == 6     # mínimo

def test_cm_reales():
    assert cm_reales(88, 18) == 49

def test_holgura_cm():
    assert holgura_cm({"holgura": "ajustada"}) == 3
    assert holgura_cm({}) == 8
    assert holgura_cm({"holgura": "holgada", "holguraCm": 12}) == 12

# ---- hilados ----

def test_grosores():
    assert len(GROSORES) == 6
    dk = next(g for g in GROSORES if g["id"] == "dk")
    assert dk["palillo"] == {"P": 22, "V": 30}
    assert dk["palilloMm"] == 4
    assert dk["ovillo"] == {"gramos": 50, "metros": 120}

def test_muestra_inicial_palillo_worsted():
    m = resolver_muestra("palillo", {"grosor": "worsted"})
    assert (m["P"], m["V"], m["g100"]) == (18, 24, 4)
    assert (m["gramosOvillo"], m["metrosOvillo"], m["herramientaMm"]) == (100, 200, 5)
    assert m["usaInicial"] is True

def test_muestra_inicial_crochet_pb_worsted():
    m = resolver_muestra("crochet", {"grosor": "worsted"}, "pb")
    assert (m["P"], m["V"], m["g100"], m["herramientaMm"]) == (14, 16, 5.2, 5.5)

def test_muestra_propia_reemplaza():
    m = resolver_muestra("palillo", {"grosor": "dk", "P": "21", "V": "28,5", "gramosMuestra": "3,4"})
    assert (m["P"], m["V"], m["g100"], m["usaInicial"]) == (21, 28.5, 3.4, False)

def test_grosor_desconocido_usa_dk():
    assert resolver_muestra("palillo", {"grosor": "inventado"})["P"] == 22

# ---- diseño ----

def test_medidas_por_prenda():
    assert MEDIDAS_POR_PRENDA["gorro"] == ["cabeza", "alto"]
    assert MEDIDAS_POR_PRENDA["chaleco"] == ["pecho", "largo", "sisa"]
    assert MEDIDAS_POR_PRENDA["sweater"] == ["pecho", "largo", "sisa", "hombros", "brazo", "muneca", "largoBrazo"]
    for prenda, claves in MEDIDAS_POR_PRENDA.items():
        for c in claves:
            assert ETIQUETAS_MEDIDAS[c]["nombre"] and ETIQUETAS_MEDIDAS[c]["guia"]

def test_normalizar_parcial_desde_foto():
    d = normalizar_diseno({"prenda": "chaleco", "origen": "foto"})
    assert d["opciones"]["escote"] == "redondo"
    assert d["hilado"]["grosor"] == "dk"
    assert d["medidas"] == {}
    assert d["tecnica"] == "palillo"
    assert d["opciones"]["altoElastico"] == 5

def test_normalizar_crop_y_strings():
    d = normalizar_diseno({"prenda": "crop", "medidas": {"pecho": "92,5"}})
    assert d["opciones"]["altoElastico"] == 3
    assert d["medidas"]["pecho"] == 92.5

def test_validar_falta_medida():
    d = normalizar_diseno({"prenda": "chaleco", "medidas": {"largo": 55, "sisa": 20}})
    assert "Falta la medida: contorno de pecho" in validar(d)["errores"]

def test_validar_sisa_profunda():
    d = normalizar_diseno({"prenda": "chaleco", "medidas": {"pecho": 92, "largo": 30, "sisa": 20}})
    assert any("profundidad de sisa" in e for e in validar(d)["errores"])

def test_validar_hombros_anchos():
    d = normalizar_diseno({"prenda": "sweater", "opciones": {"holgura": "normal"},
        "medidas": {"pecho": 92, "largo": 55, "sisa": 20, "hombros": 60, "brazo": 30, "muneca": 15, "largoBrazo": 58}})
    assert any("ancho de hombros" in e for e in validar(d)["errores"])

def test_validar_aviso_fuera_de_rango():
    d = normalizar_diseno({"prenda": "gorro", "medidas": {"cabeza": 80, "alto": 21}})
    r = validar(d)
    assert r["errores"] == [] and len(r["avisos"]) == 1

# ---- cuerpo ----

CHALECO = {"prenda": "chaleco", "tecnica": "palillo",
    "opciones": {"escote": "redondo", "holgura": "normal"}, "hilado": {"grosor": "dk"},
    "medidas": {"pecho": 92, "largo": 55, "sisa": 20}}

def _sin_cifras_invalidas(piezas):
    for p in piezas:
        for k, v in p["datos"].items():
            assert isinstance(v, (int, float)) and v >= 0, f"{p['id']}.{k}={v}"
        assert p["areaCm2"] > 0 and p["pasos"]

def test_chaleco_espalda():
    r = piezas_cuerpo(normalizar_diseno(CHALECO), resolver_muestra("palillo", {"grosor": "dk"}))
    assert r["errores"] == []
    e = next(p for p in r["piezas"] if p["id"] == "espalda")
    assert (e["datos"]["montar"], e["datos"]["vueltasHastaSisa"]) == (110, 106)
    assert (e["datos"]["sisaCierre"], e["datos"]["sisaDisminuciones"], e["datos"]["puntosTrasSisa"]) == (7, 6, 84)
    _sin_cifras_invalidas(r["piezas"])

def test_chaleco_delantero_y_terminaciones():
    r = piezas_cuerpo(normalizar_diseno(CHALECO), resolver_muestra("palillo", {"grosor": "dk"}))
    d = next(p for p in r["piezas"] if p["id"] == "delantero")
    assert d["datos"]["escoteCentral"] + 2 * d["datos"]["escoteLado"] == 28
    assert d["datos"]["hombro"] == 28 and d["datos"]["vueltasEscote"] == 22
    assert any(p["id"] == "terminaciones" for p in r["piezas"])

def test_escote_en_v():
    v = normalizar_diseno({**CHALECO, "opciones": {**CHALECO["opciones"], "escote": "v"}})
    d = next(p for p in piezas_cuerpo(v, resolver_muestra("palillo", {"grosor": "dk"}))["piezas"] if p["id"] == "delantero")
    assert d["datos"]["escoteCentral"] == 0 and d["datos"]["hombro"] == 28

def test_sweater_sin_sisa_ni_terminaciones():
    s = normalizar_diseno({**CHALECO, "prenda": "sweater",
        "medidas": {"pecho": 92, "largo": 55, "sisa": 20, "hombros": 40, "brazo": 30, "muneca": 15, "largoBrazo": 58}})
    r = piezas_cuerpo(s, resolver_muestra("palillo", {"grosor": "dk"}))
    e = next(p for p in r["piezas"] if p["id"] == "espalda")
    assert e["datos"]["sisaCierre"] == 0 and e["datos"]["puntosTrasSisa"] == 110
    assert not any(p["id"] == "terminaciones" for p in r["piezas"])
    _sin_cifras_invalidas(r["piezas"])

def test_crochet_cadeneta():
    c = normalizar_diseno({**CHALECO, "tecnica": "crochet"})
    r = piezas_cuerpo(c, resolver_muestra("crochet", {"grosor": "worsted"}, "pb"))
    e = next(p for p in r["piezas"] if p["id"] == "espalda")
    assert e["datos"]["montar"] == 70
    assert any("cadeneta de 71" in paso for paso in e["pasos"])

def test_hombros_sin_puntos():
    chico = normalizar_diseno({"prenda": "chaleco", "tecnica": "crochet",
        "opciones": {"holgura": "ajustada"}, "hilado": {"P": 2, "V": 2},
        "medidas": {"pecho": 5, "largo": 10, "sisa": 4}})
    r = piezas_cuerpo(chico, resolver_muestra("crochet", {"P": 2, "V": 2}, "pb"))
    assert any("hombros quedan sin puntos" in e for e in r["errores"]) and r["piezas"] == []

def test_hombro_entero():
    impar = normalizar_diseno({**CHALECO, "tecnica": "crochet", "medidas": {"pecho": 93, "largo": 55, "sisa": 20}})
    d = next(p for p in piezas_cuerpo(impar, resolver_muestra("crochet", {"grosor": "dk"}, "pb"))["piezas"] if p["id"] == "delantero")
    assert float(d["datos"]["hombro"]).is_integer() and float(d["datos"]["escoteCentral"]).is_integer()

# ---- mangas ----

SWEATER = {"prenda": "sweater", "tecnica": "palillo",
    "opciones": {"holgura": "normal"}, "hilado": {"grosor": "dk"},
    "medidas": {"pecho": 92, "largo": 55, "sisa": 22, "hombros": 40, "brazo": 30, "muneca": 15, "largoBrazo": 58}}

def test_manga_dk():
    r = pieza_mangas(normalizar_diseno(SWEATER), resolver_muestra("palillo", {"grosor": "dk"}))
    p = r["pieza"]
    assert p["cantidad"] == 2
    assert (p["datos"]["montar"], p["datos"]["puntosSuperiores"]) == (42, 98)
    assert (p["datos"]["aumentosPorLado"], p["datos"]["cadaVueltas"]) == (28, 4)
    assert r["avisos"] == [] and p["areaCm2"] > 0

def test_manga_apretada():
    d = normalizar_diseno({**SWEATER, "medidas": {**SWEATER["medidas"], "brazo": 45}})
    assert any("apretada" in a for a in pieza_mangas(d, resolver_muestra("palillo", {"grosor": "dk"}))["avisos"])

def test_manga_sin_aumentos():
    d = normalizar_diseno({**SWEATER, "medidas": {**SWEATER["medidas"], "muneca": 40}})
    p = pieza_mangas(d, resolver_muestra("palillo", {"grosor": "dk"}))["pieza"]
    assert p["datos"]["aumentosPorLado"] == 0 and p["datos"]["cadaVueltas"] == 0
    assert all(isinstance(v, (int, float)) and v >= 0 for v in p["datos"].values())
    assert any("sin aumentos" in paso for paso in p["pasos"])

def test_manga_crochet_entera_y_cadeneta():
    d = normalizar_diseno({**SWEATER, "tecnica": "crochet"})
    r = pieza_mangas(d, resolver_muestra("crochet", {"grosor": "worsted"}, "pb"))
    assert r["errores"] == []
    assert float(r["pieza"]["datos"]["aumentosPorLado"]).is_integer()
    assert "cadeneta" in r["pieza"]["pasos"][0]
    assert not any("Montar" in paso for paso in r["pieza"]["pasos"])

def test_manga_demasiado_corta():
    d = normalizar_diseno({**SWEATER, "hilado": {"grosor": "fingering"},
        "medidas": {**SWEATER["medidas"], "largoBrazo": 20}})
    r = pieza_mangas(d, resolver_muestra("palillo", {"grosor": "fingering"}))
    assert r["pieza"] is None and any("manga" in e for e in r["errores"])

def test_manga_espacio_justo():
    d = normalizar_diseno({**SWEATER, "hilado": {"grosor": "fingering"},
        "medidas": {**SWEATER["medidas"], "largoBrazo": 27}})
    r = pieza_mangas(d, resolver_muestra("palillo", {"grosor": "fingering"}))
    assert r["errores"] == [] and r["pieza"]["datos"]["cadaVueltas"] == 1
    assert any("cada vuelta" in a for a in r["avisos"])

# ---- gorro ----

def test_gorro_palillo_worsted():
    d = normalizar_diseno({"prenda": "gorro", "tecnica": "palillo",
        "medidas": {"cabeza": 56, "alto": 21}, "opciones": {"altoElastico": 5}})
    p = pieza_gorro(d, resolver_muestra("palillo", {"grosor": "worsted"}))
    assert (p["datos"]["montar"], p["datos"]["vueltasCoronilla"]) == (88, 20)
    assert (p["datos"]["puntosFinales"], p["datos"]["vueltasRecto"]) == (8, 18)
    assert p["areaCm2"] > 0

def test_gorro_crochet_pb():
    d = normalizar_diseno({"prenda": "gorro", "tecnica": "crochet", "medidas": {"cabeza": 56, "alto": 21}})
    p = pieza_gorro(d, resolver_muestra("crochet", {"grosor": "worsted"}, "pb"))
    assert (p["datos"]["base"], p["datos"]["vueltasAumento"]) == (6, 12)
    assert (p["datos"]["puntosFinales"], p["datos"]["diametroCm"]) == (72, 16)

def test_gorro_crochet_vareta():
    d = normalizar_diseno({"prenda": "gorro", "tecnica": "crochet",
        "opciones": {"puntoCrochet": "vareta"}, "medidas": {"cabeza": 56, "alto": 21}})
    assert pieza_gorro(d, resolver_muestra("crochet", {"grosor": "worsted"}, "vareta"))["datos"]["base"] == 12

# ---- material y receta ----

def test_material_palillo():
    m = calcular_material(5500, {"g100": 3, "gramosOvillo": 50, "metrosOvillo": 120}, "palillo")
    assert m == {"gramos": 182, "metros": 437, "ovillos": 4}

def test_material_crochet():
    assert calcular_material(5500, {"g100": 3, "gramosOvillo": 50, "metrosOvillo": 120}, "crochet")["gramos"] == 198

def test_receta_chaleco():
    r = calcular_receta(CHALECO)
    assert r["errores"] == []
    assert [p["id"] for p in r["piezas"]] == ["espalda", "delantero", "terminaciones"]
    assert r["material"]["ovillos"] >= 1
    assert any("muestra típica" in a for a in r["avisos"])

def test_receta_sweater_con_mangas():
    r = calcular_receta(SWEATER)
    assert next(p for p in r["piezas"] if p["id"] == "mangas")["cantidad"] == 2

def test_receta_gorro():
    r = calcular_receta({"prenda": "gorro", "tecnica": "palillo", "hilado": {"grosor": "worsted"},
        "medidas": {"cabeza": 56, "alto": 21}})
    assert [p["id"] for p in r["piezas"]] == ["gorro"] and r["material"]["gramos"] > 0

def test_receta_medidas_invalidas():
    r = calcular_receta({"prenda": "chaleco", "medidas": {"pecho": "", "largo": "abc"}})
    assert r["piezas"] == [] and r["material"] is None and len(r["errores"]) >= 1

def test_receta_nunca_lanza():
    assert isinstance(calcular_receta(None)["errores"], list)

def test_receta_manga_imposible():
    r = calcular_receta({**CHALECO, "prenda": "sweater", "hilado": {"grosor": "fingering"},
        "medidas": {"pecho": 92, "largo": 55, "sisa": 22, "hombros": 40, "brazo": 30, "muneca": 15, "largoBrazo": 20}})
    assert any("manga" in e for e in r["errores"]) and r["piezas"] == [] and r["material"] is None
