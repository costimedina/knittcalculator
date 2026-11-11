import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizarDiseno } from "../lib/diseno.js";
import { resolverMuestra } from "../lib/hilados.js";
import { piezaMangas } from "../lib/mangas.js";

const base = {
  prenda: "sweater", tecnica: "palillo",
  opciones: { holgura: "normal" }, hilado: { grosor: "dk" },
  medidas: { pecho: 92, largo: 55, sisa: 22, hombros: 40, brazo: 30, muneca: 15, largoBrazo: 58 },
};
const muestra = resolverMuestra("palillo", { grosor: "dk" }); // P 22, V 30

test("manga DK según la spec", () => {
  const { pieza, avisos } = piezaMangas(normalizarDiseno(base), muestra);
  assert.equal(pieza.cantidad, 2);
  assert.equal(pieza.datos.montar, 42);
  assert.equal(pieza.datos.puntosSuperiores, 98);
  assert.equal(pieza.datos.aumentosPorLado, 28);
  assert.equal(pieza.datos.cadaVueltas, 4);
  assert.deepEqual(avisos, []);
  assert.ok(Number.isFinite(pieza.areaCm2) && pieza.areaCm2 > 0);
});

test("brazo grueso: aviso de manga apretada", () => {
  const d = normalizarDiseno({ ...base, medidas: { ...base.medidas, brazo: 45 } });
  const { avisos } = piezaMangas(d, muestra);
  assert.ok(avisos.some((a) => a.includes("apretada")), JSON.stringify(avisos));
});

test("puño igual o mayor que el ancho superior: sin aumentos ni cifras inválidas", () => {
  const d = normalizarDiseno({ ...base, medidas: { ...base.medidas, muneca: 40 } });
  const { pieza } = piezaMangas(d, muestra);
  assert.equal(pieza.datos.aumentosPorLado, 0);
  assert.equal(pieza.datos.cadaVueltas, 0);
  for (const v of Object.values(pieza.datos)) assert.ok(Number.isFinite(v) && v >= 0, JSON.stringify(pieza.datos));
  assert.ok(pieza.pasos.some((p) => p.includes("sin aumentos")));
});

test("crochet: aumentos enteros y arranque con cadeneta, no «Montar»", () => {
  const d = normalizarDiseno({ ...base, tecnica: "crochet" });
  const { pieza, errores } = piezaMangas(d, resolverMuestra("crochet", { grosor: "worsted" }, "pb"));
  assert.deepEqual(errores, []);
  assert.ok(Number.isInteger(pieza.datos.aumentosPorLado), `aumentos = ${pieza.datos.aumentosPorLado}`);
  assert.ok(pieza.pasos[0].includes("cadeneta"), pieza.pasos[0]);
  assert.ok(!pieza.pasos.some((p) => p.includes("Montar")), pieza.pasos.join("\n"));
});

test("manga demasiado corta para los aumentos: error, no una receta imposible", () => {
  const d = normalizarDiseno({ ...base, hilado: { grosor: "fingering" },
    medidas: { ...base.medidas, largoBrazo: 20 } });
  const { pieza, errores } = piezaMangas(d, resolverMuestra("palillo", { grosor: "fingering" }));
  assert.equal(pieza, null);
  assert.ok(errores.some((e) => e.includes("manga")), JSON.stringify(errores));
});

test("espacio justo: aumentos en cada vuelta, con aviso", () => {
  const d = normalizarDiseno({ ...base, hilado: { grosor: "fingering" },
    medidas: { ...base.medidas, largoBrazo: 27 } });
  const { pieza, avisos, errores } = piezaMangas(d, resolverMuestra("palillo", { grosor: "fingering" }));
  assert.deepEqual(errores, []);
  assert.equal(pieza.datos.cadaVueltas, 1);
  assert.ok(avisos.some((a) => a.includes("cada vuelta")), JSON.stringify(avisos));
});
