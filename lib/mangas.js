// Mangas de hombro caído para el sweater (spec §3.4).
import { puntos, vueltas, redondearMultiplo, holguraCm } from "./base.js";

function redondearMontaje(cm, muestra, tecnica) {
  const brutos = puntos(cm, muestra.P);
  return tecnica === "crochet" ? Math.max(1, Math.round(brutos)) : redondearMultiplo(brutos, 4, 2);
}

/** Pieza de mangas (cantidad 2). Devuelve { pieza, avisos }. */
export function piezaMangas(diseno, muestra) {
  const { medidas: m, opciones, tecnica } = diseno;
  const u = tecnica === "crochet" ? "hileras" : "vueltas";
  const avisos = [];

  const A = (m.pecho + holguraCm(opciones)) / 2;
  const caida = Math.max(0, (A - m.hombros) / 2);
  const largoManga = Math.max(0, m.largoBrazo - caida);
  const anchoSuperiorCm = 2 * m.sisa;
  const anchoPunoCm = m.muneca + 4;

  const puntosSuperiores = redondearMontaje(anchoSuperiorCm, muestra, tecnica);
  const montar = redondearMontaje(anchoPunoCm, muestra, tecnica);
  const vueltasElastico = vueltas(5, muestra.V);
  const vueltasTotales = vueltas(largoManga, muestra.V);

  let aumentosPorLado = Math.max(0, (puntosSuperiores - montar) / 2);
  let cadaVueltas = 0;
  if (aumentosPorLado > 0) {
    const zona = vueltas(largoManga - 5 - 5, muestra.V);
    const paso = Math.floor(zona / aumentosPorLado);
    cadaVueltas = Math.max(2, paso - (paso % 2));
  }

  if (anchoSuperiorCm < m.brazo + 4) {
    avisos.push("La manga puede quedar apretada en el brazo: el ancho superior es menor que el contorno de brazo + 4 cm.");
  }

  const pasosAumentos = aumentosPorLado > 0
    ? [`Aumentar 1 punto a cada lado cada ${cadaVueltas} ${u}, ${aumentosPorLado} veces, hasta tener ${puntosSuperiores} puntos.`]
    : [`Tejer recto, sin aumentos (el puño ya tiene el ancho superior).`];

  const pieza = {
    id: "mangas", nombre: "Mangas", cantidad: 2,
    areaCm2: ((anchoSuperiorCm + anchoPunoCm) / 2) * largoManga,
    datos: { montar, puntosSuperiores, aumentosPorLado, cadaVueltas, vueltasElastico, vueltasTotales },
    pasos: [
      `Montar ${montar} puntos y tejer ${vueltasElastico} ${u} de elástico 2×2 (5 cm de puño).`,
      ...pasosAumentos,
      `Seguir recto hasta completar ${vueltasTotales} ${u} (${Math.round(largoManga * 10) / 10} cm; el hombro caído descuenta ${Math.round(caida * 10) / 10} cm del largo de brazo).`,
      `Cerrar los ${puntosSuperiores} puntos y coser la manga a la pieza, centrada en el hombro.`,
    ],
  };
  return { pieza, avisos };
}
