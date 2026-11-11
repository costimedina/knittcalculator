import { test } from "node:test";
import assert from "node:assert/strict";
import { calcularMaterial } from "../lib/material.js";

const muestra = { g100: 3, gramosOvillo: 50, metrosOvillo: 120 };

test("material a palillo: margen 10 %", () => {
  const r = calcularMaterial(5500, muestra, "palillo");
  assert.deepEqual(r, { gramos: 182, metros: 437, ovillos: 4 });
});

test("material a crochet: margen 20 %", () => {
  assert.equal(calcularMaterial(5500, muestra, "crochet").gramos, 198);
});
