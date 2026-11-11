// Almacenamiento de diseños: base de datos del artifact (nube) o localStorage (local).
const CLAVE = "calculadora-tejido:disenos";

function idNuevo() {
  return "d" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function ordenar(disenos) {
  return [...disenos].sort((a, b) => String(b.actualizado ?? "").localeCompare(String(a.actualizado ?? "")));
}

function almacenLocal(storage) {
  const leer = () => {
    try { return JSON.parse(storage.getItem(CLAVE) ?? "[]") ?? []; } catch { return []; }
  };
  const escribir = (lista) => {
    try { storage.setItem(CLAVE, JSON.stringify(lista)); } catch { /* sin almacenamiento */ }
  };
  let avisar = null;
  return {
    modo: "local",
    async listar() { return ordenar(leer()); },
    async guardar(diseno) {
      const guardado = { ...diseno, id: diseno.id ?? idNuevo(), actualizado: new Date().toISOString(),
        creado: diseno.creado ?? new Date().toISOString() };
      const lista = leer().filter((d) => d.id !== guardado.id);
      lista.push(guardado);
      escribir(lista);
      avisar?.(ordenar(lista));
      return guardado;
    },
    async borrar(id) {
      const lista = leer().filter((d) => d.id !== id);
      escribir(lista);
      avisar?.(ordenar(lista));
    },
    escuchar(fn) {
      avisar = fn;
      this.listar().then(fn);
      return () => { if (avisar === fn) avisar = null; };
    },
  };
}

function almacenNube(db) {
  const coleccion = () => db.collection("disenos");
  return {
    modo: "nube",
    async listar() {
      const snap = await coleccion().orderBy("actualizado", "desc").get();
      return snap.docs.map((d) => d.data());
    },
    async guardar(diseno) {
      const id = diseno.id ?? coleccion().doc().id;
      const guardado = { ...diseno, id, actualizado: new Date().toISOString(),
        creado: diseno.creado ?? new Date().toISOString() };
      await coleccion().doc(id).set(guardado);
      return guardado;
    },
    async borrar(id) { await coleccion().doc(id).delete(); },
    escuchar(fn) {
      return coleccion().orderBy("actualizado", "desc").onSnapshot(
        (snap) => fn(snap.docs.map((d) => d.data())),
        () => fn([]),
      );
    },
  };
}

/** Crea el almacén según lo disponible: `db` (namespace de claude.use("db")) o `storage`. */
export function crearAlmacen({ db, storage }) {
  return db ? almacenNube(db) : almacenLocal(storage ?? { getItem: () => null, setItem: () => {} });
}
