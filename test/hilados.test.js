import { test } from "node:test";
import assert from "node:assert/strict";
import { GROSORES, resolverMuestra } from "../lib/hilados.js";

test("GROSORES tiene los 6 de la spec, con DK correcto", () => {
  assert.equal(GROSORES.length, 6);
  const dk = GROSORES.find((g) => g.id === "dk");
  assert.deepEqual(dk.palillo, { P: 22, V: 30 });
  assert.equal(dk.palilloMm, 4);
  assert.deepEqual(dk.ovillo, { gramos: 50, metros: 120 });
});

test("muestra inicial a palillo, worsted", () => {
  const m = resolverMuestra("palillo", { grosor: "worsted" });
  assert.equal(m.P, 18);
  assert.equal(m.V, 24);
  assert.equal(m.g100, 4);
  assert.equal(m.gramosOvillo, 100);
  assert.equal(m.metrosOvillo, 200);
  assert.equal(m.herramientaMm, 5);
  assert.equal(m.usaInicial, true);
});

test("muestra inicial a crochet punto bajo, worsted", () => {
  const m = resolverMuestra("crochet", { grosor: "worsted" }, "pb");
  assert.equal(m.P, 14);
  assert.equal(m.V, 16);
  assert.equal(m.g100, 5.2);
  assert.equal(m.herramientaMm, 5.5);
});

test("la muestra propia reemplaza la inicial", () => {
  const m = resolverMuestra("palillo", { grosor: "dk", P: "21", V: "28,5", gramosMuestra: "3,4" });
  assert.equal(m.P, 21);
  assert.equal(m.V, 28.5);
  assert.equal(m.g100, 3.4);
  assert.equal(m.usaInicial, false);
});

test("grosor desconocido usa dk", () => {
  assert.equal(resolverMuestra("palillo", { grosor: "inventado" }).P, 22);
});
