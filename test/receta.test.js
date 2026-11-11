import { test } from "node:test";
import assert from "node:assert/strict";
import { calcularReceta } from "../lib/receta.js";

const chaleco = {
  prenda: "chaleco", tecnica: "palillo",
  opciones: { escote: "redondo", holgura: "normal" }, hilado: { grosor: "dk" },
  medidas: { pecho: 92, largo: 55, sisa: 20 },
};

test("receta de chaleco: piezas, material y aviso de muestra típica", () => {
  const r = calcularReceta(chaleco);
  assert.deepEqual(r.errores, []);
  assert.deepEqual(r.piezas.map((p) => p.id), ["espalda", "delantero", "terminaciones"]);
  assert.ok(r.material.ovillos >= 1);
  assert.ok(r.avisos.some((a) => a.includes("muestra típica")), JSON.stringify(r.avisos));
});

test("sweater incluye mangas ×2", () => {
  const r = calcularReceta({ ...chaleco, prenda: "sweater",
    medidas: { pecho: 92, largo: 55, sisa: 20, hombros: 40, brazo: 30, muneca: 15, largoBrazo: 58 } });
  const mangas = r.piezas.find((p) => p.id === "mangas");
  assert.equal(mangas.cantidad, 2);
});

test("gorro: una pieza", () => {
  const r = calcularReceta({ prenda: "gorro", tecnica: "palillo", hilado: { grosor: "worsted" },
    medidas: { cabeza: 56, alto: 21 } });
  assert.deepEqual(r.piezas.map((p) => p.id), ["gorro"]);
  assert.ok(r.material.gramos > 0);
});

test("medidas vacías o texto: errores, sin piezas ni NaN", () => {
  const r = calcularReceta({ prenda: "chaleco", medidas: { pecho: "", largo: "abc" } });
  assert.equal(r.piezas.length, 0);
  assert.equal(r.material, null);
  assert.ok(r.errores.length >= 1);
  assert.ok(!JSON.stringify(r).includes("NaN"));
});

test("calcularReceta nunca lanza", () => {
  const r = calcularReceta(null);
  assert.ok(Array.isArray(r.errores));
});

test("sweater con manga imposible: error de receta, sin piezas a medias", () => {
  const r = calcularReceta({ ...chaleco, prenda: "sweater", hilado: { grosor: "fingering" },
    medidas: { pecho: 92, largo: 55, sisa: 22, hombros: 40, brazo: 30, muneca: 15, largoBrazo: 20 } });
  assert.ok(r.errores.some((e) => e.includes("manga")), JSON.stringify(r.errores));
  assert.equal(r.piezas.length, 0);
  assert.equal(r.material, null);
});
