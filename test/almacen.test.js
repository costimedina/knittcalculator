import { test } from "node:test";
import assert from "node:assert/strict";
import { crearAlmacen } from "../lib/almacen.js";

function storageEnMemoria() {
  const datos = new Map();
  return {
    getItem: (k) => datos.get(k) ?? null,
    setItem: (k, v) => datos.set(k, String(v)),
    removeItem: (k) => datos.delete(k),
  };
}

test("sin db: modo local, guardar asigna id y actualizado, listar ordena", async () => {
  const a = crearAlmacen({ db: null, storage: storageEnMemoria() });
  assert.equal(a.modo, "local");
  const uno = await a.guardar({ nombre: "Gorro azul", prenda: "gorro" });
  assert.ok(uno.id);
  assert.ok(uno.actualizado);
  await new Promise((r) => setTimeout(r, 10));
  const dos = await a.guardar({ nombre: "Chaleco", prenda: "chaleco" });
  const lista = await a.listar();
  assert.deepEqual(lista.map((d) => d.nombre), ["Chaleco", "Gorro azul"]);
  assert.notEqual(uno.id, dos.id);
});

test("guardar con id existente actualiza en vez de duplicar", async () => {
  const a = crearAlmacen({ db: null, storage: storageEnMemoria() });
  const uno = await a.guardar({ nombre: "Gorro" });
  await a.guardar({ ...uno, nombre: "Gorro con pompón" });
  const lista = await a.listar();
  assert.equal(lista.length, 1);
  assert.equal(lista[0].nombre, "Gorro con pompón");
});

test("borrar quita el diseño", async () => {
  const a = crearAlmacen({ db: null, storage: storageEnMemoria() });
  const uno = await a.guardar({ nombre: "Gorro" });
  await a.borrar(uno.id);
  assert.deepEqual(await a.listar(), []);
});

test("storage que lanza: listar devuelve [] sin lanzar", async () => {
  const roto = { getItem() { throw new Error("bloqueado"); }, setItem() { throw new Error("bloqueado"); } };
  const a = crearAlmacen({ db: null, storage: roto });
  assert.deepEqual(await a.listar(), []);
  await a.guardar({ nombre: "x" }); // tampoco lanza
});
