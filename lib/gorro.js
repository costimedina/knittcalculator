// Gorro a palillo (circular, desde el borde) y a crochet (desde la coronilla). Spec §3.4.
import { puntos, vueltas, redondearMultiplo, cmReales } from "./base.js";

const BASE_CROCHET = { pb: 6, mp: 8, vareta: 12 };
const NOMBRE_PUNTO = { pb: "punto bajo", mp: "medio punto", vareta: "vareta" };

/** Pieza única del gorro. */
export function piezaGorro(diseno, muestra) {
  const { medidas: m, opciones, tecnica } = diseno;
  const objetivo = m.cabeza * 0.9;

  if (tecnica === "palillo") {
    const montar = redondearMultiplo(puntos(objetivo, muestra.P), 8);
    const vueltasElastico = vueltas(opciones.altoElastico, muestra.V);
    const vueltasCoronilla = (2 * (montar - 8)) / 8;
    const vueltasRecto = Math.max(0, vueltas(m.alto - opciones.altoElastico, muestra.V) - vueltasCoronilla);
    return {
      id: "gorro", nombre: "Gorro", cantidad: 1, areaCm2: objetivo * m.alto,
      datos: { montar, vueltasElastico, vueltasRecto, vueltasCoronilla, puntosFinales: 8 },
      pasos: [
        `Montar ${montar} puntos y unir en círculo; quedará de ${cmReales(montar, muestra.P)} cm de contorno (cabeza de ${m.cabeza} cm menos el 10 %).`,
        `Tejer ${vueltasElastico} vueltas de elástico 2×2 (${opciones.altoElastico} cm).`,
        `Seguir recto ${vueltasRecto} vueltas, hasta ${m.alto} cm de alto contando la coronilla.`,
        `Coronilla: marcar 8 secciones de ${montar / 8} puntos; disminuir 1 punto por sección vuelta por medio (${vueltasCoronilla} vueltas) hasta que queden 8 puntos.`,
        `Cortar la hebra, pasarla por los 8 puntos y cerrar.`,
      ],
    };
  }

  const base = BASE_CROCHET[opciones.puntoCrochet];
  const vueltasAumento = Math.ceil(puntos(objetivo, muestra.P) / base);
  const puntosFinales = base * vueltasAumento;
  const vueltasBorde = Math.round((3 * muestra.V) / 10);
  const vueltasRecto = Math.max(0, Math.round(((m.alto - 3) * muestra.V) / 10) - vueltasAumento);
  const diametroCm = Math.round((objetivo / Math.PI) * 10) / 10;
  const radio = diametroCm / 2;
  return {
    id: "gorro", nombre: "Gorro", cantidad: 1,
    areaCm2: Math.PI * radio * radio + objetivo * Math.max(0, m.alto - radio),
    datos: { base, vueltasAumento, puntosFinales, vueltasRecto, vueltasBorde, diametroCm },
    pasos: [
      `Empezar con un anillo mágico de ${base} puntos en ${NOMBRE_PUNTO[opciones.puntoCrochet]}.`,
      `Aumentar ${base} puntos por vuelta durante ${vueltasAumento} vueltas (vuelta 2: 2 puntos en cada punto; vuelta 3: aumento cada 2 puntos, y así), hasta ${puntosFinales} puntos; el círculo quedará de unos ${diametroCm} cm de diámetro.`,
      `Seguir recto ${vueltasRecto} vueltas, sin aumentos.`,
      `Terminar con ${vueltasBorde} vueltas de punto bajo o punto relieve como borde (3 cm), hasta ${m.alto} cm de alto total.`,
    ],
  };
}
