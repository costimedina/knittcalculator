// Diseño normalizado y validaciones (spec §3.6 y §4).
import { parseCm, holguraCm } from "./base.js";

export const MEDIDAS_POR_PRENDA = {
  gorro: ["cabeza", "alto"],
  crop: ["pecho", "largo", "sisa"],
  chaleco: ["pecho", "largo", "sisa"],
  sweater: ["pecho", "largo", "sisa", "hombros", "brazo", "muneca", "largoBrazo"],
};

export const ETIQUETAS_MEDIDAS = {
  cabeza: { nombre: "contorno de cabeza", guia: "Mide alrededor de la cabeza, pasando por la frente y la parte más saliente de atrás." },
  alto: { nombre: "alto del gorro", guia: "Desde el borde (sobre las orejas) hasta la coronilla; 21 cm es un adulto típico." },
  pecho: { nombre: "contorno de pecho", guia: "Mide alrededor del pecho por la parte más ancha, con la huincha horizontal." },
  largo: { nombre: "largo total", guia: "Desde el punto más alto del hombro hasta donde quieres el borde inferior." },
  sisa: { nombre: "profundidad de sisa", guia: "Desde el punto más alto del hombro hasta unos 2 cm bajo la axila." },
  hombros: { nombre: "ancho de hombros", guia: "Por la espalda, de un hueso del hombro al otro." },
  brazo: { nombre: "contorno de brazo", guia: "Alrededor de la parte más ancha del brazo." },
  muneca: { nombre: "contorno de muñeca", guia: "Alrededor de la muñeca, donde va el puño." },
  largoBrazo: { nombre: "largo de brazo", guia: "Desde el hombro hasta la muñeca, con el brazo relajado." },
};

/** Completa un diseño parcial con valores por defecto. Nunca lanza. */
export function normalizarDiseno(parcial) {
  const p = parcial && typeof parcial === "object" ? parcial : {};
  const prenda = MEDIDAS_POR_PRENDA[p.prenda] ? p.prenda : "chaleco";
  const o = p.opciones && typeof p.opciones === "object" ? p.opciones : {};
  const h = p.hilado && typeof p.hilado === "object" ? p.hilado : {};

  const medidas = {};
  const entradas = p.medidas && typeof p.medidas === "object" ? p.medidas : {};
  for (const [clave, valor] of Object.entries(entradas)) {
    const n = parseCm(valor);
    if (n !== null) medidas[clave] = n;
  }

  return {
    id: typeof p.id === "string" ? p.id : null,
    nombre: typeof p.nombre === "string" && p.nombre.trim() ? p.nombre.trim() : "Sin nombre",
    origen: p.origen === "foto" ? "foto" : "manual",
    notaFoto: typeof p.notaFoto === "string" ? p.notaFoto : "",
    tecnica: p.tecnica === "crochet" ? "crochet" : "palillo",
    prenda,
    opciones: {
      escote: o.escote === "v" ? "v" : "redondo",
      holgura: ["ajustada", "normal", "holgada"].includes(o.holgura) ? o.holgura : "normal",
      holguraCm: parseCm(o.holguraCm),
      altoElastico: parseCm(o.altoElastico) ?? (prenda === "crop" ? 3 : 5),
      puntoCrochet: ["pb", "mp", "vareta"].includes(o.puntoCrochet) ? o.puntoCrochet : "pb",
    },
    hilado: {
      grosor: typeof h.grosor === "string" ? h.grosor : "dk",
      P: parseCm(h.P), V: parseCm(h.V),
      gramosMuestra: parseCm(h.gramosMuestra),
      gramosOvillo: parseCm(h.gramosOvillo),
      metrosOvillo: parseCm(h.metrosOvillo),
    },
    medidas,
    avance: p.avance && typeof p.avance === "object" ? p.avance : {},
    creado: typeof p.creado === "string" ? p.creado : null,
    actualizado: typeof p.actualizado === "string" ? p.actualizado : null,
  };
}

/** Reglas de la spec §3.6 sobre un diseño ya normalizado. */
export function validar(diseno) {
  const errores = [];
  const avisos = [];
  const m = diseno.medidas;

  for (const clave of MEDIDAS_POR_PRENDA[diseno.prenda]) {
    if (m[clave] === undefined) errores.push(`Falta la medida: ${ETIQUETAS_MEDIDAS[clave].nombre}`);
  }
  if (errores.length) return { errores, avisos };

  if (m.sisa !== undefined && m.sisa > m.largo / 2) {
    errores.push("La profundidad de sisa no puede ser más de la mitad del largo total.");
  }
  if (diseno.prenda === "sweater" && m.hombros > (m.pecho + holguraCm(diseno.opciones)) / 2) {
    errores.push("El ancho de hombros es mayor que el ancho de la pieza.");
  }
  if (m.cabeza !== undefined && (m.cabeza < 30 || m.cabeza > 70)) {
    avisos.push("El contorno de cabeza se ve fuera de lo habitual (30–70 cm); revisa la medida.");
  }
  if (m.pecho !== undefined && (m.pecho < 50 || m.pecho > 180)) {
    avisos.push("El contorno de pecho se ve fuera de lo habitual (50–180 cm); revisa la medida.");
  }
  return { errores, avisos };
}
