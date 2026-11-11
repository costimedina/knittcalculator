// Tabla de grosores de hilado (spec §3.3) y muestra resuelta.
import { parseCm } from "./base.js";

export const GROSORES = [
  { id: "fingering", nombre: "Fingering (fino)", palilloMm: 3, crochetMm: 3.5,
    palillo: { P: 28, V: 36 }, pb: { P: 24, V: 28 }, mp: { P: 22, V: 18 }, vareta: { P: 22, V: 11 },
    g100: 2.2, ovillo: { gramos: 50, metros: 200 } },
  { id: "sport", nombre: "Sport", palilloMm: 3.5, crochetMm: 4,
    palillo: { P: 24, V: 32 }, pb: { P: 20, V: 24 }, mp: { P: 19, V: 15 }, vareta: { P: 19, V: 10 },
    g100: 2.6, ovillo: { gramos: 50, metros: 150 } },
  { id: "dk", nombre: "DK", palilloMm: 4, crochetMm: 4.5,
    palillo: { P: 22, V: 30 }, pb: { P: 18, V: 20 }, mp: { P: 16, V: 13 }, vareta: { P: 16, V: 8 },
    g100: 3, ovillo: { gramos: 50, metros: 120 } },
  { id: "worsted", nombre: "Worsted", palilloMm: 5, crochetMm: 5.5,
    palillo: { P: 18, V: 24 }, pb: { P: 14, V: 16 }, mp: { P: 13, V: 10 }, vareta: { P: 13, V: 7 },
    g100: 4, ovillo: { gramos: 100, metros: 200 } },
  { id: "aran", nombre: "Aran", palilloMm: 5.5, crochetMm: 6,
    palillo: { P: 16, V: 22 }, pb: { P: 12, V: 14 }, mp: { P: 11, V: 9 }, vareta: { P: 11, V: 6 },
    g100: 4.6, ovillo: { gramos: 100, metros: 170 } },
  { id: "bulky", nombre: "Bulky (grueso)", palilloMm: 7, crochetMm: 8,
    palillo: { P: 13, V: 18 }, pb: { P: 10, V: 11 }, mp: { P: 9, V: 7 }, vareta: { P: 9, V: 5 },
    g100: 6, ovillo: { gramos: 100, metros: 100 } },
];

/** Muestra resuelta: la fila del grosor, reemplazada por la muestra propia donde exista. */
export function resolverMuestra(tecnica, hilado = {}, puntoCrochet = "pb") {
  const fila = GROSORES.find((g) => g.id === hilado.grosor) ?? GROSORES.find((g) => g.id === "dk");
  const esCrochet = tecnica === "crochet";
  const inicial = esCrochet ? (fila[puntoCrochet] ?? fila.pb) : fila.palillo;
  const g100Inicial = Math.round(fila.g100 * (esCrochet ? 1.3 : 1) * 10) / 10;

  const P = parseCm(hilado.P);
  const V = parseCm(hilado.V);
  const g100 = parseCm(hilado.gramosMuestra);

  return {
    P: P ?? inicial.P,
    V: V ?? inicial.V,
    g100: g100 ?? g100Inicial,
    gramosOvillo: parseCm(hilado.gramosOvillo) ?? fila.ovillo.gramos,
    metrosOvillo: parseCm(hilado.metrosOvillo) ?? fila.ovillo.metros,
    herramientaMm: esCrochet ? fila.crochetMm : fila.palilloMm,
    usaInicial: P === null || V === null || g100 === null,
  };
}
