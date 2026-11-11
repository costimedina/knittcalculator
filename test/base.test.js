import { test } from "node:test";
import assert from "node:assert/strict";
import { parseCm, puntos, vueltas, redondearMultiplo, cmReales, holguraCm } from "../lib/base.js";

test("parseCm acepta coma, punto y espacios", () => {
  assert.equal(parseCm("92,5"), 92.5);
  assert.equal(parseCm(" 56 "), 56);
  assert.equal(parseCm(21.5), 21.5);
});

test("parseCm devuelve null para vacío, texto y no positivos", () => {
  assert.equal(parseCm(""), null);
  assert.equal(parseCm("abc"), null);
  assert.equal(parseCm(0), null);
  assert.equal(parseCm(-3), null);
  assert.equal(parseCm(null), null);
  assert.equal(parseCm(undefined), null);
});

test("puntos y vueltas", () => {
  assert.equal(puntos(50, 22), 110);
  assert.equal(vueltas(7, 30), 22);
  assert.equal(vueltas(35, 30), 106);
});

test("redondearMultiplo: más cercano, empate hacia arriba, mínimo", () => {
  assert.equal(redondearMultiplo(90.72, 8), 88);
  assert.equal(redondearMultiplo(96.8, 4, 2), 98);
  assert.equal(redondearMultiplo(44, 4, 2), 46);
  assert.equal(redondearMultiplo(3, 4, 2), 6);
});

test("cmReales redondea a 0,5 cm", () => {
  assert.equal(cmReales(88, 18), 49);
});

test("holguraCm", () => {
  assert.equal(holguraCm({ holgura: "ajustada" }), 3);
  assert.equal(holguraCm({}), 8);
  assert.equal(holguraCm({ holgura: "holgada", holguraCm: 12 }), 12);
});
