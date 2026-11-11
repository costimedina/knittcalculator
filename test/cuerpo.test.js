import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizarDiseno } from "../lib/diseno.js";
import { resolverMuestra } from "../lib/hilados.js";
import { piezasCuerpo } from "../lib/cuerpo.js";

const chalecoDk = normalizarDiseno({
  prenda: "chaleco", tecnica: "palillo",
  opciones: { escote: "redondo", holgura: "normal" },
  hilado: { grosor: "dk" },
  medidas: { pecho: 92, largo: 55, sisa: 20 },
});
const muestraDk = resolverMuestra("palillo", { grosor: "dk" }); // P 22, V 30

function sinCifrasInvalidas(piezas) {
  for (const pieza of piezas) {
    for (const [k, v] of Object.entries(pieza.datos)) {
      assert.ok(Number.isFinite(v) && v >= 0, `${pieza.id}.${k} = ${v}`);
    }
    assert.ok(Number.isFinite(pieza.areaCm2) && pieza.areaCm2 > 0, `${pieza.id}.areaCm2`);
    assert.ok(pieza.pasos.length > 0);
  }
}

test("chaleco DK: espalda según la spec", () => {
  const { piezas, errores } = piezasCuerpo(chalecoDk, muestraDk);
  assert.deepEqual(errores, []);
  const espalda = piezas.find((p) => p.id === "espalda");
  assert.equal(espalda.datos.montar, 110);
  assert.equal(espalda.datos.vueltasHastaSisa, 106);
  assert.equal(espalda.datos.sisaCierre, 7);
  assert.equal(espalda.datos.sisaDisminuciones, 6);
  assert.equal(espalda.datos.puntosTrasSisa, 84);
  sinCifrasInvalidas(piezas);
});

test("chaleco DK: delantero, escote redondo y terminaciones", () => {
  const { piezas } = piezasCuerpo(chalecoDk, muestraDk);
  const d = piezas.find((p) => p.id === "delantero");
  assert.equal(d.datos.escoteCentral + 2 * d.datos.escoteLado, 28);
  assert.equal(d.datos.hombro, 28);
  assert.equal(d.datos.vueltasEscote, 22);
  assert.ok(piezas.some((p) => p.id === "terminaciones"));
});

test("escote en V", () => {
  const enV = normalizarDiseno({ ...chalecoDk, opciones: { ...chalecoDk.opciones, escote: "v" } });
  const { piezas } = piezasCuerpo(enV, muestraDk);
  const d = piezas.find((p) => p.id === "delantero");
  assert.equal(d.datos.escoteCentral, 0);
  assert.equal(d.datos.hombro, 28);
});

test("sweater: sin sisa ni terminaciones", () => {
  const sweater = normalizarDiseno({ ...chalecoDk, prenda: "sweater",
    medidas: { pecho: 92, largo: 55, sisa: 20, hombros: 40, brazo: 30, muneca: 15, largoBrazo: 58 } });
  const { piezas } = piezasCuerpo(sweater, muestraDk);
  const espalda = piezas.find((p) => p.id === "espalda");
  assert.equal(espalda.datos.sisaCierre, 0);
  assert.equal(espalda.datos.puntosTrasSisa, 110);
  assert.ok(!piezas.some((p) => p.id === "terminaciones"));
  sinCifrasInvalidas(piezas);
});

test("crochet pb: montar redondeado simple y cadeneta con giro", () => {
  const crochet = normalizarDiseno({ ...chalecoDk, tecnica: "crochet" });
  const muestra = resolverMuestra("crochet", { grosor: "worsted" }, "pb"); // P 14
  const { piezas } = piezasCuerpo(crochet, muestra);
  const espalda = piezas.find((p) => p.id === "espalda");
  assert.equal(espalda.datos.montar, 70);
  assert.ok(espalda.pasos.some((paso) => paso.includes("cadeneta de 71")), espalda.pasos.join("\n"));
});

test("hombros sin puntos: error y sin piezas", () => {
  const chico = normalizarDiseno({ prenda: "chaleco", tecnica: "crochet",
    opciones: { holgura: "ajustada" }, hilado: { P: 2, V: 2 },
    medidas: { pecho: 5, largo: 10, sisa: 4 } });
  const { piezas, errores } = piezasCuerpo(chico, resolverMuestra("crochet", { P: 2, V: 2 }, "pb"));
  assert.ok(errores.some((e) => e.includes("hombros quedan sin puntos")), JSON.stringify(errores));
  assert.equal(piezas.length, 0);
});

test("hombro siempre entero", () => {
  const impar = normalizarDiseno({ ...chalecoDk, tecnica: "crochet", medidas: { pecho: 93, largo: 55, sisa: 20 } });
  const muestra = resolverMuestra("crochet", { grosor: "dk" }, "pb"); // P 18
  const { piezas } = piezasCuerpo(impar, muestra);
  const d = piezas.find((p) => p.id === "delantero");
  assert.ok(Number.isInteger(d.datos.hombro), `hombro = ${d.datos.hombro}`);
  assert.ok(Number.isInteger(d.datos.escoteCentral));
});
