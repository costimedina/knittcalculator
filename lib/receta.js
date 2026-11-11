// Receta completa: la única función que usa la página.
import { normalizarDiseno, validar } from "./diseno.js";
import { resolverMuestra } from "./hilados.js";
import { piezasCuerpo } from "./cuerpo.js";
import { piezaMangas } from "./mangas.js";
import { piezaGorro } from "./gorro.js";
import { calcularMaterial } from "./material.js";

/** Calcula la receta de un diseño (parcial o completo). Nunca lanza. */
export function calcularReceta(parcial) {
  try {
    const diseno = normalizarDiseno(parcial);
    const { errores, avisos } = validar(diseno);
    if (errores.length) return { piezas: [], material: null, muestra: null, avisos, errores };

    const muestra = resolverMuestra(diseno.tecnica, diseno.hilado, diseno.opciones.puntoCrochet);
    let piezas = [];

    if (diseno.prenda === "gorro") {
      piezas = [piezaGorro(diseno, muestra)];
    } else {
      const cuerpo = piezasCuerpo(diseno, muestra);
      if (cuerpo.errores.length) {
        return { piezas: [], material: null, muestra, avisos, errores: cuerpo.errores };
      }
      piezas = cuerpo.piezas;
      if (diseno.prenda === "sweater") {
        const mangas = piezaMangas(diseno, muestra);
        if (mangas.errores.length) {
          return { piezas: [], material: null, muestra, avisos, errores: mangas.errores };
        }
        piezas.push(mangas.pieza);
        avisos.push(...mangas.avisos);
      }
    }

    if (muestra.usaInicial) {
      avisos.push("Se usó la muestra típica del hilado; con tu propia muestra el cálculo es más exacto.");
    }

    const area = piezas.reduce((suma, p) => suma + p.areaCm2 * p.cantidad, 0);
    return { piezas, material: calcularMaterial(area, muestra, diseno.tecnica), muestra, avisos, errores: [] };
  } catch (e) {
    return { piezas: [], material: null, muestra: null, avisos: [], errores: [`No se pudo calcular: ${e?.message ?? e}`] };
  }
}
