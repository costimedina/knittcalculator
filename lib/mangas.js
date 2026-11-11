// Mangas de hombro caído para el sweater (spec §3.4).
import { vueltas, holguraCm } from "./base.js";
import { redondearMontaje, fraseMontaje, NOMBRE_PUNTO } from "./montaje.js";

/** Pieza de mangas (cantidad 2). Devuelve { pieza, avisos, errores };
 *  con errores, pieza es null. */
export function piezaMangas(diseno, muestra) {
  const { medidas: m, opciones, tecnica } = diseno;
  const esCrochet = tecnica === "crochet";
  const u = esCrochet ? "hileras" : "vueltas";
  const avisos = [];

  const A = (m.pecho + holguraCm(opciones)) / 2;
  const caida = Math.max(0, (A - m.hombros) / 2);
  const largoManga = Math.max(0, m.largoBrazo - caida);
  const anchoSuperiorCm = 2 * m.sisa;
  const anchoPunoCm = m.muneca + 4;

  let puntosSuperiores = redondearMontaje(anchoSuperiorCm, muestra, tecnica);
  const montar = redondearMontaje(anchoPunoCm, muestra, tecnica);
  // La diferencia debe ser par para repartir los aumentos entre los dos lados.
  if ((puntosSuperiores - montar) % 2 !== 0) puntosSuperiores += 1;
  const vueltasElastico = vueltas(5, muestra.V);
  const vueltasTotales = vueltas(largoManga, muestra.V);

  let aumentosPorLado = Math.max(0, (puntosSuperiores - montar) / 2);
  let cadaVueltas = 0;
  if (aumentosPorLado > 0) {
    const zona = vueltas(largoManga - 5 - 5, muestra.V);
    if (zona < aumentosPorLado) {
      return { pieza: null, avisos, errores: [
        "El largo de la manga no alcanza para los aumentos que necesita: revisa el largo de brazo, la muñeca o la profundidad de sisa.",
      ] };
    }
    const paso = Math.floor(zona / aumentosPorLado);
    if (paso < 2) {
      cadaVueltas = 1;
      avisos.push(`La manga va justa: los aumentos van en cada ${u.slice(0, -1)} (cada vuelta).`);
    } else {
      cadaVueltas = Math.max(2, paso - (paso % 2));
    }
  }

  if (anchoSuperiorCm < m.brazo + 4) {
    avisos.push("La manga puede quedar apretada en el brazo: el ancho superior es menor que el contorno de brazo + 4 cm.");
  }

  const pasosAumentos = aumentosPorLado > 0
    ? [`Aumentar 1 punto a cada lado cada ${cadaVueltas} ${cadaVueltas === 1 ? u.slice(0, -1) : u}, ${aumentosPorLado} veces, hasta tener ${puntosSuperiores} puntos.`]
    : [`Tejer recto, sin aumentos (el puño ya tiene el ancho superior).`];

  const pasoPuno = esCrochet
    ? `Tejer ${vueltasElastico} ${u} en ${NOMBRE_PUNTO[opciones.puntoCrochet]} para el puño (5 cm).`
    : `Tejer ${vueltasElastico} ${u} de elástico 2×2 (5 cm de puño).`;

  const pieza = {
    id: "mangas", nombre: "Mangas", cantidad: 2,
    areaCm2: ((anchoSuperiorCm + anchoPunoCm) / 2) * largoManga,
    datos: { montar, puntosSuperiores, aumentosPorLado, cadaVueltas, vueltasElastico, vueltasTotales },
    pasos: [
      fraseMontaje(montar, diseno, muestra, "el puño"),
      pasoPuno,
      ...pasosAumentos,
      `Seguir recto hasta completar ${vueltasTotales} ${u} (${Math.round(largoManga * 10) / 10} cm; el hombro caído descuenta ${Math.round(caida * 10) / 10} cm del largo de brazo).`,
      `Cerrar los ${puntosSuperiores} puntos y coser la manga a la pieza, centrada en el hombro.`,
    ],
  };
  return { pieza, avisos, errores: [] };
}
