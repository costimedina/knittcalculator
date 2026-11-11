import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizarDiseno } from "../lib/diseno.js";
import { resolverMuestra } from "../lib/hilados.js";
import { piezaGorro } from "../lib/gorro.js";

const medidas = { cabeza: 56, alto: 21 };

test("gorro a palillo, worsted", () => {
  const d = normalizarDiseno({ prenda: "gorro", tecnica: "palillo", medidas, opciones: { altoElastico: 5 } });
  const pieza = piezaGorro(d, resolverMuestra("palillo", { grosor: "worsted" })); // P 18, V 24
  assert.equal(pieza.datos.montar, 88);
  assert.equal(pieza.datos.vueltasCoronilla, 20);
  assert.equal(pieza.datos.puntosFinales, 8);
  assert.equal(pieza.datos.vueltasRecto, 18);
  assert.ok(Number.isFinite(pieza.areaCm2) && pieza.areaCm2 > 0);
});

test("gorro a crochet punto bajo, worsted", () => {
  const d = normalizarDiseno({ prenda: "gorro", tecnica: "crochet", medidas });
  const pieza = piezaGorro(d, resolverMuestra("crochet", { grosor: "worsted" }, "pb")); // P 14, V 16
  assert.equal(pieza.datos.base, 6);
  assert.equal(pieza.datos.vueltasAumento, 12);
  assert.equal(pieza.datos.puntosFinales, 72);
  assert.equal(pieza.datos.diametroCm, 16);
});

test("gorro a crochet en vareta parte de 12", () => {
  const d = normalizarDiseno({ prenda: "gorro", tecnica: "crochet", opciones: { puntoCrochet: "vareta" }, medidas });
  const pieza = piezaGorro(d, resolverMuestra("crochet", { grosor: "worsted" }, "vareta"));
  assert.equal(pieza.datos.base, 12);
});
