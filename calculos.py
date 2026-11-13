# Calculos de Knithmetic: port fiel de lib/*.js (misma matemática, mismos redondeos).
# La fuente de verdad del diseño es docs/specs/2026-11-11-calculadora-tejido-design.md.
import math

# JavaScript Math.round redondea los .5 hacia arriba; round() de Python no.
def _redondeo(x):
    return math.floor(x + 0.5)

def _techo(x):
    return math.ceil(round(x, 6))

# ---- base ----

def parse_cm(valor):
    """Lee un valor en cm. Coma o punto decimal y espacios. Inválido o <= 0 -> None."""
    if valor is None:
        return None
    if isinstance(valor, bool):
        return None
    if isinstance(valor, (int, float)):
        return float(valor) if math.isfinite(valor) and valor > 0 else None
    texto = str(valor).strip().replace(",", ".")
    if texto == "":
        return None
    try:
        n = float(texto)
    except ValueError:
        return None
    return n if math.isfinite(n) and n > 0 else None

def puntos(cm, P):
    return cm * P / 10

def vueltas(cm, V):
    return 2 * _redondeo(cm * V / 20)

def redondear_multiplo(n, multiplo, resto=0):
    """Múltiplo k*multiplo+resto más cercano a n; empate hacia arriba; mínimo multiplo+resto."""
    k = math.floor((n - resto) / multiplo)
    abajo = k * multiplo + resto
    arriba = abajo + multiplo
    elegido = abajo if n - abajo < arriba - n else arriba
    return max(elegido, multiplo + resto)

def cm_reales(pts, P):
    return _redondeo(pts * 10 / P * 2) / 2

def holgura_cm(opciones=None):
    opciones = opciones or {}
    propia = parse_cm(opciones.get("holguraCm"))
    if propia is not None:
        return propia
    return {"ajustada": 3, "normal": 8, "holgada": 15}.get(opciones.get("holgura"), 8)

# ---- hilados (spec §3.3) ----

GROSORES = [
    {"id": "fingering", "nombre": "Fingering (fino)", "palilloMm": 3, "crochetMm": 3.5,
     "palillo": {"P": 28, "V": 36}, "pb": {"P": 24, "V": 28}, "mp": {"P": 22, "V": 18}, "vareta": {"P": 22, "V": 11},
     "g100": 2.2, "ovillo": {"gramos": 50, "metros": 200}},
    {"id": "sport", "nombre": "Sport", "palilloMm": 3.5, "crochetMm": 4,
     "palillo": {"P": 24, "V": 32}, "pb": {"P": 20, "V": 24}, "mp": {"P": 19, "V": 15}, "vareta": {"P": 19, "V": 10},
     "g100": 2.6, "ovillo": {"gramos": 50, "metros": 150}},
    {"id": "dk", "nombre": "DK", "palilloMm": 4, "crochetMm": 4.5,
     "palillo": {"P": 22, "V": 30}, "pb": {"P": 18, "V": 20}, "mp": {"P": 16, "V": 13}, "vareta": {"P": 16, "V": 8},
     "g100": 3, "ovillo": {"gramos": 50, "metros": 120}},
    {"id": "worsted", "nombre": "Worsted", "palilloMm": 5, "crochetMm": 5.5,
     "palillo": {"P": 18, "V": 24}, "pb": {"P": 14, "V": 16}, "mp": {"P": 13, "V": 10}, "vareta": {"P": 13, "V": 7},
     "g100": 4, "ovillo": {"gramos": 100, "metros": 200}},
    {"id": "aran", "nombre": "Aran", "palilloMm": 5.5, "crochetMm": 6,
     "palillo": {"P": 16, "V": 22}, "pb": {"P": 12, "V": 14}, "mp": {"P": 11, "V": 9}, "vareta": {"P": 11, "V": 6},
     "g100": 4.6, "ovillo": {"gramos": 100, "metros": 170}},
    {"id": "bulky", "nombre": "Bulky (grueso)", "palilloMm": 7, "crochetMm": 8,
     "palillo": {"P": 13, "V": 18}, "pb": {"P": 10, "V": 11}, "mp": {"P": 9, "V": 7}, "vareta": {"P": 9, "V": 5},
     "g100": 6, "ovillo": {"gramos": 100, "metros": 100}},
]

def resolver_muestra(tecnica, hilado=None, punto_crochet="pb"):
    hilado = hilado or {}
    fila = next((g for g in GROSORES if g["id"] == hilado.get("grosor")),
                next(g for g in GROSORES if g["id"] == "dk"))
    es_crochet = tecnica == "crochet"
    inicial = fila.get(punto_crochet, fila["pb"]) if es_crochet else fila["palillo"]
    g100_inicial = _redondeo(fila["g100"] * (1.3 if es_crochet else 1) * 10) / 10

    P = parse_cm(hilado.get("P"))
    V = parse_cm(hilado.get("V"))
    g100 = parse_cm(hilado.get("gramosMuestra"))
    return {
        "P": P if P is not None else inicial["P"],
        "V": V if V is not None else inicial["V"],
        "g100": g100 if g100 is not None else g100_inicial,
        "gramosOvillo": parse_cm(hilado.get("gramosOvillo")) or fila["ovillo"]["gramos"],
        "metrosOvillo": parse_cm(hilado.get("metrosOvillo")) or fila["ovillo"]["metros"],
        "herramientaMm": fila["crochetMm"] if es_crochet else fila["palilloMm"],
        "usaInicial": P is None or V is None or g100 is None,
    }

# ---- diseño (spec §3.6 y §4) ----

MEDIDAS_POR_PRENDA = {
    "gorro": ["cabeza", "alto"],
    "crop": ["pecho", "largo", "sisa"],
    "chaleco": ["pecho", "largo", "sisa"],
    "sweater": ["pecho", "largo", "sisa", "hombros", "brazo", "muneca", "largoBrazo"],
}

ETIQUETAS_MEDIDAS = {
    "cabeza": {"nombre": "contorno de cabeza", "guia": "Mide alrededor de la cabeza, pasando por la frente y la parte más saliente de atrás."},
    "alto": {"nombre": "alto del gorro", "guia": "Desde el borde (sobre las orejas) hasta la coronilla; 21 cm es un adulto típico."},
    "pecho": {"nombre": "contorno de pecho", "guia": "Mide alrededor del pecho por la parte más ancha, con la huincha horizontal."},
    "largo": {"nombre": "largo total", "guia": "Desde el punto más alto del hombro hasta donde quieres el borde inferior."},
    "sisa": {"nombre": "profundidad de sisa", "guia": "Desde el punto más alto del hombro hasta unos 2 cm bajo la axila."},
    "hombros": {"nombre": "ancho de hombros", "guia": "Por la espalda, de un hueso del hombro al otro."},
    "brazo": {"nombre": "contorno de brazo", "guia": "Alrededor de la parte más ancha del brazo."},
    "muneca": {"nombre": "contorno de muñeca", "guia": "Alrededor de la muñeca, donde va el puño."},
    "largoBrazo": {"nombre": "largo de brazo", "guia": "Desde el hombro hasta la muñeca, con el brazo relajado."},
}

def normalizar_diseno(parcial):
    p = parcial if isinstance(parcial, dict) else {}
    prenda = p.get("prenda") if p.get("prenda") in MEDIDAS_POR_PRENDA else "chaleco"
    o = p.get("opciones") if isinstance(p.get("opciones"), dict) else {}
    h = p.get("hilado") if isinstance(p.get("hilado"), dict) else {}

    medidas = {}
    for clave, valor in (p.get("medidas") or {}).items() if isinstance(p.get("medidas"), dict) else []:
        n = parse_cm(valor)
        if n is not None:
            medidas[clave] = n

    alto_elastico = parse_cm(o.get("altoElastico"))
    nombre = p.get("nombre")
    return {
        "id": p.get("id") if isinstance(p.get("id"), str) else None,
        "nombre": nombre.strip() if isinstance(nombre, str) and nombre.strip() else "Sin nombre",
        "origen": "foto" if p.get("origen") == "foto" else "manual",
        "notaFoto": p.get("notaFoto") if isinstance(p.get("notaFoto"), str) else "",
        "tecnica": "crochet" if p.get("tecnica") == "crochet" else "palillo",
        "prenda": prenda,
        "opciones": {
            "escote": "v" if o.get("escote") == "v" else "redondo",
            "holgura": o.get("holgura") if o.get("holgura") in ("ajustada", "normal", "holgada") else "normal",
            "holguraCm": parse_cm(o.get("holguraCm")),
            "altoElastico": alto_elastico if alto_elastico is not None else (3 if prenda == "crop" else 5),
            "puntoCrochet": o.get("puntoCrochet") if o.get("puntoCrochet") in ("pb", "mp", "vareta") else "pb",
        },
        "hilado": {
            "grosor": h.get("grosor") if isinstance(h.get("grosor"), str) else "dk",
            "P": parse_cm(h.get("P")), "V": parse_cm(h.get("V")),
            "gramosMuestra": parse_cm(h.get("gramosMuestra")),
            "gramosOvillo": parse_cm(h.get("gramosOvillo")),
            "metrosOvillo": parse_cm(h.get("metrosOvillo")),
        },
        "medidas": medidas,
        "avance": p.get("avance") if isinstance(p.get("avance"), dict) else {},
        "creado": p.get("creado") if isinstance(p.get("creado"), str) else None,
        "actualizado": p.get("actualizado") if isinstance(p.get("actualizado"), str) else None,
    }

def validar(diseno):
    errores, avisos = [], []
    m = diseno["medidas"]
    for clave in MEDIDAS_POR_PRENDA[diseno["prenda"]]:
        if clave not in m:
            errores.append(f"Falta la medida: {ETIQUETAS_MEDIDAS[clave]['nombre']}")
    if errores:
        return {"errores": errores, "avisos": avisos}
    if "sisa" in m and m["sisa"] > m["largo"] / 2:
        errores.append("La profundidad de sisa no puede ser más de la mitad del largo total.")
    if diseno["prenda"] == "sweater" and m["hombros"] > (m["pecho"] + holgura_cm(diseno["opciones"])) / 2:
        errores.append("El ancho de hombros es mayor que el ancho de la pieza.")
    if "cabeza" in m and not 30 <= m["cabeza"] <= 70:
        avisos.append("El contorno de cabeza se ve fuera de lo habitual (30–70 cm); revisa la medida.")
    if "pecho" in m and not 50 <= m["pecho"] <= 180:
        avisos.append("El contorno de pecho se ve fuera de lo habitual (50–180 cm); revisa la medida.")
    return {"errores": errores, "avisos": avisos}

# ---- montaje compartido ----

GIRO = {"pb": 1, "mp": 2, "vareta": 3}
NOMBRE_PUNTO = {"pb": "punto bajo", "mp": "medio punto", "vareta": "vareta"}

def _redondear_montaje(cm, muestra, tecnica):
    brutos = puntos(cm, muestra["P"])
    return max(1, _redondeo(brutos)) if tecnica == "crochet" else redondear_multiplo(brutos, 4, 2)

def _frase_montaje(montar, diseno, muestra, destino=""):
    real = cm_reales(montar, muestra["P"])
    para = f" para {destino}" if destino else ""
    if diseno["tecnica"] == "crochet":
        giro = GIRO[diseno["opciones"]["puntoCrochet"]]
        return (f"Tejer una cadeneta de {montar + giro} cadenetas "
                f"({montar} puntos + {giro} de giro){para}; quedará de {real:g} cm de ancho.")
    return f"Montar {montar} puntos{para}; quedará de {real:g} cm de ancho."

def _unidad(tecnica):
    return "hileras" if tecnica == "crochet" else "vueltas"

# ---- cuerpo (spec §3.4) ----

def piezas_cuerpo(diseno, muestra):
    m, opciones, tecnica, prenda = diseno["medidas"], diseno["opciones"], diseno["tecnica"], diseno["prenda"]
    u = _unidad(tecnica)
    C = m["pecho"] + holgura_cm(opciones)
    A = C / 2

    montar = _redondear_montaje(A, muestra, tecnica)
    vueltas_hasta_sisa = vueltas(m["largo"] - m["sisa"], muestra["V"])

    con_sisa = prenda != "sweater"
    r = _redondeo(puntos(0.06 * C, muestra["P"])) if con_sisa else 0
    sisa_cierre = math.ceil(r / 2)
    sisa_disminuciones = r - sisa_cierre
    puntos_tras_sisa = montar - 2 * r

    ancho_escote = 2 * _redondeo(puntos_tras_sisa / 6)
    if (puntos_tras_sisa - ancho_escote) % 2 != 0:
        ancho_escote += 1
    hombro = (puntos_tras_sisa - ancho_escote) // 2
    if hombro < 1:
        return {"piezas": [], "errores": ["Los hombros quedan sin puntos: revisa holgura o medidas."]}

    en_v = opciones["escote"] == "v"
    escote_lado = ancho_escote // 2 if en_v else ancho_escote // 4
    escote_central = ancho_escote - 2 * escote_lado
    vueltas_escote_delantero = vueltas(m["sisa"], muestra["V"]) if en_v else vueltas(7, muestra["V"])
    vueltas_escote_espalda = vueltas(2, muestra["V"])
    area_pieza = A * m["largo"]

    if tecnica == "crochet":
        pasos_comunes = [
            _frase_montaje(montar, diseno, muestra),
            f"Trabajar en {NOMBRE_PUNTO[opciones['puntoCrochet']]} sobre {montar} puntos.",
        ]
    else:
        pasos_comunes = [
            _frase_montaje(montar, diseno, muestra),
            f"Tejer {vueltas(opciones['altoElastico'], muestra['V'])} vueltas de elástico 2×2 ({opciones['altoElastico']:g} cm).",
        ]
    pasos_comunes.append(
        f"Seguir recto hasta la sisa: {vueltas_hasta_sisa} {u} en total ({m['largo'] - m['sisa']:g} cm desde el borde).")

    if con_sisa:
        pasos_sisa = [
            f"Sisa: cerrar {sisa_cierre} puntos al inicio de las 2 {u} siguientes.",
            f"Luego disminuir 1 punto a cada lado cada 2 {u}, {sisa_disminuciones} veces; quedan {puntos_tras_sisa} puntos.",
        ]
    else:
        pasos_sisa = [f"Hombro caído: seguir recto, sin disminuciones de sisa (quedan {puntos_tras_sisa} puntos)."]

    datos_base = {"montar": montar, "vueltasHastaSisa": vueltas_hasta_sisa, "sisaCierre": sisa_cierre,
                  "sisaDisminuciones": sisa_disminuciones, "puntosTrasSisa": puntos_tras_sisa}

    espalda = {
        "id": "espalda", "nombre": "Espalda", "cantidad": 1, "areaCm2": area_pieza,
        "datos": {**datos_base, "escoteCentral": ancho_escote, "escoteLado": 0,
                  "hombro": hombro, "vueltasEscote": vueltas_escote_espalda},
        "pasos": pasos_comunes + pasos_sisa + [
            f"Seguir hasta {vueltas_escote_espalda} {u} antes del hombro; cerrar los {ancho_escote} puntos centrales del escote de una vez.",
            f"Terminar cada lado y cerrar los {hombro} puntos de cada hombro.",
        ],
    }

    if en_v:
        central = f" (cerrar {escote_central} punto central)" if escote_central else ""
        pasos_escote = [
            f"Escote en V: al llegar a la sisa, dividir la pieza en dos{central}.",
            f"En cada lado, disminuir 1 punto al borde del escote {escote_lado} veces, repartidas en las {vueltas_escote_delantero} {u} hasta el hombro.",
        ]
    else:
        pasos_escote = [
            f"Escote redondo: a {vueltas_escote_delantero} {u} del hombro (7 cm), cerrar los {escote_central} puntos centrales.",
            f"En cada lado, disminuir 1 punto al borde del escote cada 2 {u}, {escote_lado} veces.",
        ]

    delantero = {
        "id": "delantero", "nombre": "Delantero", "cantidad": 1, "areaCm2": area_pieza,
        "datos": {**datos_base, "escoteCentral": escote_central, "escoteLado": escote_lado,
                  "hombro": hombro, "vueltasEscote": vueltas_escote_delantero},
        "pasos": pasos_comunes + pasos_sisa + pasos_escote + [f"Cerrar los {hombro} puntos de cada hombro."],
    }

    piezas = [espalda, delantero]
    if con_sisa:
        perimetro_sisas = 2 * 2 * m["sisa"]
        ancho_escote_cm = ancho_escote * 10 / muestra["P"]
        perimetro_escote = ancho_escote_cm * 2 + 2 * 7
        recoger_sisas = redondear_multiplo(puntos(perimetro_sisas, muestra["P"]) * 0.9, 4)
        recoger_escote = redondear_multiplo(puntos(perimetro_escote, muestra["P"]) * 0.9, 4)
        piezas.append({
            "id": "terminaciones", "nombre": "Terminaciones", "cantidad": 1,
            "areaCm2": (perimetro_sisas + perimetro_escote) * 2.5,
            "datos": {"recogerSisas": recoger_sisas, "recogerEscote": recoger_escote},
            "pasos": [
                "Coser hombros y costados.",
                f"Sisas: recoger {recoger_sisas} puntos en total entre las dos ({recoger_sisas // 2} por sisa) y tejer 2,5 cm de elástico.",
                f"Escote: recoger {recoger_escote} puntos alrededor y tejer 2,5 cm de elástico.",
            ],
        })
    return {"piezas": piezas, "errores": []}

# ---- mangas (spec §3.4) ----

def pieza_mangas(diseno, muestra):
    m, opciones, tecnica = diseno["medidas"], diseno["opciones"], diseno["tecnica"]
    es_crochet = tecnica == "crochet"
    u = _unidad(tecnica)
    avisos = []

    A = (m["pecho"] + holgura_cm(opciones)) / 2
    caida = max(0, (A - m["hombros"]) / 2)
    largo_manga = max(0, m["largoBrazo"] - caida)
    ancho_superior_cm = 2 * m["sisa"]
    ancho_puno_cm = m["muneca"] + 4

    puntos_superiores = _redondear_montaje(ancho_superior_cm, muestra, tecnica)
    montar = _redondear_montaje(ancho_puno_cm, muestra, tecnica)
    if (puntos_superiores - montar) % 2 != 0:
        puntos_superiores += 1
    vueltas_elastico = vueltas(5, muestra["V"])
    vueltas_totales = vueltas(largo_manga, muestra["V"])

    aumentos_por_lado = max(0, (puntos_superiores - montar) // 2)
    cada_vueltas = 0
    if aumentos_por_lado > 0:
        zona = vueltas(largo_manga - 5 - 5, muestra["V"])
        if zona < aumentos_por_lado:
            return {"pieza": None, "avisos": avisos, "errores": [
                "El largo de la manga no alcanza para los aumentos que necesita: "
                "revisa el largo de brazo, la muñeca o la profundidad de sisa."]}
        paso = zona // aumentos_por_lado
        if paso < 2:
            cada_vueltas = 1
            avisos.append(f"La manga va justa: los aumentos van en cada {u[:-1]} (cada vuelta).")
        else:
            cada_vueltas = max(2, paso - (paso % 2))

    if ancho_superior_cm < m["brazo"] + 4:
        avisos.append("La manga puede quedar apretada en el brazo: el ancho superior es menor que el contorno de brazo + 4 cm.")

    if aumentos_por_lado > 0:
        unidad_paso = u[:-1] if cada_vueltas == 1 else u
        pasos_aumentos = [f"Aumentar 1 punto a cada lado cada {cada_vueltas} {unidad_paso}, "
                          f"{aumentos_por_lado} veces, hasta tener {puntos_superiores} puntos."]
    else:
        pasos_aumentos = ["Tejer recto, sin aumentos (el puño ya tiene el ancho superior)."]

    paso_puno = (f"Tejer {vueltas_elastico} {u} en {NOMBRE_PUNTO[opciones['puntoCrochet']]} para el puño (5 cm)."
                 if es_crochet else
                 f"Tejer {vueltas_elastico} {u} de elástico 2×2 (5 cm de puño).")

    pieza = {
        "id": "mangas", "nombre": "Mangas", "cantidad": 2,
        "areaCm2": (ancho_superior_cm + ancho_puno_cm) / 2 * largo_manga,
        "datos": {"montar": montar, "puntosSuperiores": puntos_superiores,
                  "aumentosPorLado": aumentos_por_lado, "cadaVueltas": cada_vueltas,
                  "vueltasElastico": vueltas_elastico, "vueltasTotales": vueltas_totales},
        "pasos": [
            _frase_montaje(montar, diseno, muestra, "el puño"),
            paso_puno,
            *pasos_aumentos,
            f"Seguir recto hasta completar {vueltas_totales} {u} ({_redondeo(largo_manga * 10) / 10:g} cm; "
            f"el hombro caído descuenta {_redondeo(caida * 10) / 10:g} cm del largo de brazo).",
            f"Cerrar los {puntos_superiores} puntos y coser la manga a la pieza, centrada en el hombro.",
        ],
    }
    return {"pieza": pieza, "avisos": avisos, "errores": []}

# ---- gorro (spec §3.4) ----

BASE_CROCHET = {"pb": 6, "mp": 8, "vareta": 12}

def pieza_gorro(diseno, muestra):
    m, opciones, tecnica = diseno["medidas"], diseno["opciones"], diseno["tecnica"]
    objetivo = m["cabeza"] * 0.9

    if tecnica == "palillo":
        montar = redondear_multiplo(puntos(objetivo, muestra["P"]), 8)
        vueltas_elastico = vueltas(opciones["altoElastico"], muestra["V"])
        vueltas_coronilla = 2 * (montar - 8) // 8
        vueltas_recto = max(0, vueltas(m["alto"] - opciones["altoElastico"], muestra["V"]) - vueltas_coronilla)
        return {
            "id": "gorro", "nombre": "Gorro", "cantidad": 1, "areaCm2": objetivo * m["alto"],
            "datos": {"montar": montar, "vueltasElastico": vueltas_elastico, "vueltasRecto": vueltas_recto,
                      "vueltasCoronilla": vueltas_coronilla, "puntosFinales": 8},
            "pasos": [
                f"Montar {montar} puntos y unir en círculo; quedará de {cm_reales(montar, muestra['P']):g} cm "
                f"de contorno (cabeza de {m['cabeza']:g} cm menos el 10 %).",
                f"Tejer {vueltas_elastico} vueltas de elástico 2×2 ({opciones['altoElastico']:g} cm).",
                f"Seguir recto {vueltas_recto} vueltas, hasta {m['alto']:g} cm de alto contando la coronilla.",
                f"Coronilla: marcar 8 secciones de {montar // 8} puntos; disminuir 1 punto por sección "
                f"vuelta por medio ({vueltas_coronilla} vueltas) hasta que queden 8 puntos.",
                "Cortar la hebra, pasarla por los 8 puntos y cerrar.",
            ],
        }

    base = BASE_CROCHET[opciones["puntoCrochet"]]
    vueltas_aumento = math.ceil(round(puntos(objetivo, muestra["P"]) / base, 6))
    puntos_finales = base * vueltas_aumento
    vueltas_borde = _redondeo(3 * muestra["V"] / 10)
    vueltas_recto = max(0, _redondeo((m["alto"] - 3) * muestra["V"] / 10) - vueltas_aumento)
    diametro_cm = _redondeo(objetivo / math.pi * 10) / 10
    radio = diametro_cm / 2
    return {
        "id": "gorro", "nombre": "Gorro", "cantidad": 1,
        "areaCm2": math.pi * radio * radio + objetivo * max(0, m["alto"] - radio),
        "datos": {"base": base, "vueltasAumento": vueltas_aumento, "puntosFinales": puntos_finales,
                  "vueltasRecto": vueltas_recto, "vueltasBorde": vueltas_borde, "diametroCm": diametro_cm},
        "pasos": [
            f"Empezar con un anillo mágico de {base} puntos en {NOMBRE_PUNTO[opciones['puntoCrochet']]}.",
            f"Aumentar {base} puntos por vuelta durante {vueltas_aumento} vueltas (vuelta 2: 2 puntos en cada punto; "
            f"vuelta 3: aumento cada 2 puntos, y así), hasta {puntos_finales} puntos; "
            f"el círculo quedará de unos {diametro_cm:g} cm de diámetro.",
            f"Seguir recto {vueltas_recto} vueltas, sin aumentos.",
            f"Terminar con {vueltas_borde} vueltas de punto bajo o punto relieve como borde (3 cm), "
            f"hasta {m['alto']:g} cm de alto total.",
        ],
    }

# ---- material y receta (spec §3.5) ----

def calcular_material(area_total_cm2, muestra, tecnica):
    margen = 0.2 if tecnica == "crochet" else 0.1
    gramos = _techo(area_total_cm2 / 100 * muestra["g100"] * (1 + margen))
    return {
        "gramos": gramos,
        "metros": _techo(gramos * muestra["metrosOvillo"] / muestra["gramosOvillo"]),
        "ovillos": _techo(gramos / muestra["gramosOvillo"]),
    }

def calcular_receta(parcial):
    """Única función que usa la app. Nunca lanza."""
    try:
        diseno = normalizar_diseno(parcial)
        v = validar(diseno)
        if v["errores"]:
            return {"piezas": [], "material": None, "muestra": None,
                    "avisos": v["avisos"], "errores": v["errores"]}
        avisos = v["avisos"]
        muestra = resolver_muestra(diseno["tecnica"], diseno["hilado"], diseno["opciones"]["puntoCrochet"])

        if diseno["prenda"] == "gorro":
            piezas = [pieza_gorro(diseno, muestra)]
        else:
            cuerpo = piezas_cuerpo(diseno, muestra)
            if cuerpo["errores"]:
                return {"piezas": [], "material": None, "muestra": muestra,
                        "avisos": avisos, "errores": cuerpo["errores"]}
            piezas = cuerpo["piezas"]
            if diseno["prenda"] == "sweater":
                mangas = pieza_mangas(diseno, muestra)
                if mangas["errores"]:
                    return {"piezas": [], "material": None, "muestra": muestra,
                            "avisos": avisos, "errores": mangas["errores"]}
                piezas.append(mangas["pieza"])
                avisos = avisos + mangas["avisos"]

        if muestra["usaInicial"]:
            avisos = avisos + ["Se usó la muestra típica del hilado; con tu propia muestra el cálculo es más exacto."]
        area = sum(p["areaCm2"] * p["cantidad"] for p in piezas)
        return {"piezas": piezas, "material": calcular_material(area, muestra, diseno["tecnica"]),
                "muestra": muestra, "avisos": avisos, "errores": []}
    except Exception as e:  # noqa: BLE001 — la app muestra el error, nunca se cae
        return {"piezas": [], "material": None, "muestra": None, "avisos": [],
                "errores": [f"No se pudo calcular: {e}"]}
