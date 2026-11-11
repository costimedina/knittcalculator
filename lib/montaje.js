// Montaje compartido entre piezas: redondeo según técnica y frase inicial.
import { puntos, redondearMultiplo, cmReales } from "./base.js";

export const GIRO = { pb: 1, mp: 2, vareta: 3 };
export const NOMBRE_PUNTO = { pb: "punto bajo", mp: "medio punto", vareta: "vareta" };

/** Puntos de montaje para `cm`: múltiplo de 4 + 2 a palillo, redondeo simple a crochet. */
export function redondearMontaje(cm, muestra, tecnica) {
  const brutos = puntos(cm, muestra.P);
  return tecnica === "crochet" ? Math.max(1, Math.round(brutos)) : redondearMultiplo(brutos, 4, 2);
}

/** Primera frase de una pieza: cadeneta (crochet) o montar puntos (palillo). */
export function fraseMontaje(montar, diseno, muestra, destino) {
  const real = cmReales(montar, muestra.P);
  if (diseno.tecnica === "crochet") {
    const giro = GIRO[diseno.opciones.puntoCrochet];
    return `Tejer una cadeneta de ${montar + giro} cadenetas (${montar} puntos + ${giro} de giro)${destino ? ` para ${destino}` : ""}; quedará de ${real} cm de ancho.`;
  }
  return `Montar ${montar} puntos${destino ? ` para ${destino}` : ""}; quedará de ${real} cm de ancho.`;
}
