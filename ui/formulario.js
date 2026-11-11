// Formulario por pasos: técnica, prenda y opciones, hilado y muestra, medidas.
import { GROSORES } from "../lib/hilados.js";
import { MEDIDAS_POR_PRENDA, ETIQUETAS_MEDIDAS } from "../lib/diseno.js";

const PRENDAS = [
  ["gorro", "Gorro"], ["crop", "Crop top"], ["chaleco", "Chaleco"], ["sweater", "Sweater"],
];
const PUNTOS_CROCHET = [["pb", "Punto bajo"], ["mp", "Medio punto"], ["vareta", "Vareta"]];
const HOLGURAS = [
  ["ajustada", "Ajustada (+3 cm)"], ["normal", "Normal (+8 cm)"], ["holgada", "Holgada (+15 cm)"],
];

function el(tag, attrs = {}, hijos = []) {
  const nodo = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === "texto") nodo.textContent = v;
    else if (k.startsWith("on")) nodo.addEventListener(k.slice(2), v);
    else if (v !== undefined && v !== null) nodo.setAttribute(k, v);
  }
  for (const h of hijos) nodo.append(h);
  return nodo;
}

function grupoBotones(nombre, opciones, activo, alElegir) {
  return el("div", { class: "chips", role: "group", "aria-label": nombre }, opciones.map(([valor, etiqueta]) =>
    el("button", {
      type: "button", class: "chip" + (valor === activo ? " activo" : ""),
      id: `op-${nombre}-${valor}`, "aria-pressed": String(valor === activo),
      texto: etiqueta, onclick: () => alElegir(valor),
    })));
}

function campoNumero({ id, etiqueta, valor, placeholder, guia, sufijo }, alEscribir) {
  const input = el("input", {
    type: "text", inputmode: "decimal", id, autocomplete: "off",
    value: valor ?? "", placeholder: placeholder ?? "",
    oninput: (e) => alEscribir(e.target.value),
  });
  const fila = el("label", { class: "campo", for: id }, [
    el("span", { class: "campo-nombre", texto: etiqueta }),
    el("span", { class: "campo-control" }, sufijo ? [input, el("span", { class: "sufijo", texto: sufijo })] : [input]),
  ]);
  if (guia) fila.append(el("span", { class: "guia", texto: guia }));
  return fila;
}

/** Dibuja el formulario completo. Vuelve a dibujarse solo en cambios de estructura;
 *  escribir en un campo solo actualiza el estado (no se pierde el foco). */
export function montarFormulario(contenedor, diseno, alCambiar) {
  // `d` es una referencia viva: cada emisión la actualiza, para que un campo
  // no pise lo escrito en otro entre un dibujo y el siguiente.
  let d = diseno;
  const emitir = (nuevo, soloEstado = false) => { d = nuevo; alCambiar(nuevo, soloEstado); };
  const cambiar = (parche) => emitir({ ...d, ...parche });
  const cambiarOpcion = (parche) => cambiar({ opciones: { ...d.opciones, ...parche } });
  const cambiarHilado = (parche, redibujar = false) =>
    emitir({ ...d, hilado: { ...d.hilado, ...parche } }, !redibujar);
  const cambiarMedida = (clave, valor) =>
    emitir({ ...d, medidas: { ...d.medidas, [clave]: valor } }, true);

  const fila = GROSORES.find((g) => g.id === d.hilado.grosor) ?? GROSORES[1];
  const esCrochet = d.tecnica === "crochet";
  const inicial = esCrochet ? fila[d.opciones.puntoCrochet] : fila.palillo;
  const conEscote = d.prenda !== "gorro";

  contenedor.replaceChildren(
    el("section", { class: "paso" }, [
      el("h2", {}, [el("span", { class: "paso-n", texto: "1" }), "Técnica"]),
      grupoBotones("tecnica", [["palillo", "Palillo"], ["crochet", "Crochet"]], d.tecnica,
        (v) => cambiar({ tecnica: v })),
    ]),

    el("section", { class: "paso" }, [
      el("h2", {}, [el("span", { class: "paso-n", texto: "2" }), "Prenda"]),
      grupoBotones("prenda", PRENDAS, d.prenda, (v) => cambiar({ prenda: v })),
      ...(conEscote ? [
        el("h3", { texto: "Escote" }),
        grupoBotones("escote", [["redondo", "Redondo"], ["v", "En V"]], d.opciones.escote,
          (v) => cambiarOpcion({ escote: v })),
        el("h3", { texto: "Holgura" }),
        grupoBotones("holgura", HOLGURAS, d.opciones.holgura,
          (v) => cambiarOpcion({ holgura: v, holguraCm: null })),
      ] : []),
      ...(esCrochet ? [
        el("h3", { texto: "Punto base" }),
        grupoBotones("punto", PUNTOS_CROCHET, d.opciones.puntoCrochet,
          (v) => cambiarOpcion({ puntoCrochet: v })),
      ] : []),
    ]),

    el("section", { class: "paso" }, [
      el("h2", {}, [el("span", { class: "paso-n", texto: "3" }), "Hilado y muestra"]),
      el("div", { class: "chips" }, GROSORES.map((g) =>
        el("button", {
          type: "button", class: "chip" + (g.id === fila.id ? " activo" : ""),
          id: `op-grosor-${g.id}`, "aria-pressed": String(g.id === fila.id),
          texto: g.nombre, onclick: () => cambiarHilado({ grosor: g.id }, true),
        }))),
      el("p", { class: "nota", id: "nota-herramienta",
        texto: `${esCrochet ? "Crochet sugerido" : "Palillo sugerido"}: ${esCrochet ? fila.crochetMm : fila.palilloMm} mm · muestra típica ${inicial.P} pts × ${inicial.V} ${esCrochet ? "hileras" : "vueltas"} en 10 cm` }),
      el("details", { class: "muestra-propia", ...(d.hilado.P || d.hilado.V ? { open: "" } : {}) }, [
        el("summary", { texto: "Tengo mi propia muestra de 10 × 10 cm (más exacto)" }),
        campoNumero({ id: "h-P", etiqueta: "Puntos en 10 cm", valor: d.hilado.P, placeholder: String(inicial.P) },
          (v) => cambiarHilado({ P: v })),
        campoNumero({ id: "h-V", etiqueta: esCrochet ? "Hileras en 10 cm" : "Vueltas en 10 cm", valor: d.hilado.V, placeholder: String(inicial.V) },
          (v) => cambiarHilado({ V: v })),
        campoNumero({ id: "h-g", etiqueta: "Peso de la muestra", valor: d.hilado.gramosMuestra, placeholder: "ej. 3,5", sufijo: "g" },
          (v) => cambiarHilado({ gramosMuestra: v })),
      ]),
      el("div", { class: "fila-doble" }, [
        campoNumero({ id: "h-go", etiqueta: "Gramos por ovillo", valor: d.hilado.gramosOvillo, placeholder: String(fila.ovillo.gramos), sufijo: "g" },
          (v) => cambiarHilado({ gramosOvillo: v })),
        campoNumero({ id: "h-mo", etiqueta: "Metros por ovillo", valor: d.hilado.metrosOvillo, placeholder: String(fila.ovillo.metros), sufijo: "m" },
          (v) => cambiarHilado({ metrosOvillo: v })),
      ]),
    ]),

    el("section", { class: "paso" }, [
      el("h2", {}, [el("span", { class: "paso-n", texto: "4" }), "Medidas en centímetros"]),
      ...MEDIDAS_POR_PRENDA[d.prenda].map((clave) =>
        campoNumero({
          id: `m-${clave}`,
          etiqueta: ETIQUETAS_MEDIDAS[clave].nombre,
          valor: d.medidas[clave],
          guia: ETIQUETAS_MEDIDAS[clave].guia,
          sufijo: "cm",
        }, (v) => cambiarMedida(clave, v))),
    ]),
  );
}
