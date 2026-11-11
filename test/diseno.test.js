import { test } from "node:test";
import assert from "node:assert/strict";
import { MEDIDAS_POR_PRENDA, ETIQUETAS_MEDIDAS, normalizarDiseno, validar } from "../lib/diseno.js";

test("medidas por prenda", () => {
  assert.deepEqual(MEDIDAS_POR_PRENDA.gorro, ["cabeza", "alto"]);
  assert.deepEqual(MEDIDAS_POR_PRENDA.chaleco, ["pecho", "largo", "sisa"]);
  assert.deepEqual(MEDIDAS_POR_PRENDA.sweater, ["pecho", "largo", "sisa", "hombros", "brazo", "muneca", "largoBrazo"]);
  for (const prenda of Object.keys(MEDIDAS_POR_PRENDA)) {
    for (const m of MEDIDAS_POR_PRENDA[prenda]) {
      assert.ok(ETIQUETAS_MEDIDAS[m]?.nombre, `falta etiqueta de ${m}`);
      assert.ok(ETIQUETAS_MEDIDAS[m]?.guia, `falta guía de ${m}`);
    }
  }
});

test("normalizarDiseno completa un diseño parcial (desde foto) sin lanzar", () => {
  const d = normalizarDiseno({ prenda: "chaleco", origen: "foto" });
  assert.equal(d.opciones.escote, "redondo");
  assert.equal(d.hilado.grosor, "dk");
  assert.deepEqual(d.medidas, {});
  assert.equal(d.tecnica, "palillo");
  assert.equal(d.opciones.altoElastico, 5);
});

test("normalizarDiseno: crop usa elástico 3 y convierte strings", () => {
  const d = normalizarDiseno({ prenda: "crop", medidas: { pecho: "92,5" } });
  assert.equal(d.opciones.altoElastico, 3);
  assert.equal(d.medidas.pecho, 92.5);
});

test("validar: falta una medida", () => {
  const d = normalizarDiseno({ prenda: "chaleco", medidas: { largo: 55, sisa: 20 } });
  const { errores } = validar(d);
  assert.ok(errores.includes("Falta la medida: contorno de pecho"), JSON.stringify(errores));
});

test("validar: sisa demasiado profunda", () => {
  const d = normalizarDiseno({ prenda: "chaleco", medidas: { pecho: 92, largo: 30, sisa: 20 } });
  const { errores } = validar(d);
  assert.ok(errores.some((e) => e.includes("profundidad de sisa")), JSON.stringify(errores));
});

test("validar: hombros más anchos que la pieza (sweater)", () => {
  const d = normalizarDiseno({
    prenda: "sweater", opciones: { holgura: "normal" },
    medidas: { pecho: 92, largo: 55, sisa: 20, hombros: 60, brazo: 30, muneca: 15, largoBrazo: 58 },
  });
  const { errores } = validar(d);
  assert.ok(errores.some((e) => e.includes("ancho de hombros")), JSON.stringify(errores));
});

test("validar: aviso fuera de rango sin error", () => {
  const d = normalizarDiseno({ prenda: "gorro", medidas: { cabeza: 80, alto: 21 } });
  const { errores, avisos } = validar(d);
  assert.equal(errores.length, 0);
  assert.equal(avisos.length, 1);
});
