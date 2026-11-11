// Funciones base: lectura de centímetros, conversión a puntos/vueltas y redondeos.

/** Lee un valor en cm. Acepta coma o punto decimal y espacios.
 *  Vacío, texto o un valor no positivo → null. */
export function parseCm(valor) {
  if (valor === null || valor === undefined) return null;
  if (typeof valor === "number") {
    return Number.isFinite(valor) && valor > 0 ? valor : null;
  }
  const texto = String(valor).trim().replace(",", ".");
  if (texto === "") return null;
  const n = Number(texto);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/** Puntos (sin redondear) que ocupan `cm` con una muestra de P puntos por 10 cm. */
export function puntos(cm, P) {
  return (cm * P) / 10;
}

/** Vueltas para `cm` con V vueltas por 10 cm, redondeadas al par más cercano. */
export function vueltas(cm, V) {
  return 2 * Math.round((cm * V) / 20);
}

/** Múltiplo `k × multiplo + resto` más cercano a n; en empate, hacia arriba.
 *  Mínimo: multiplo + resto. */
export function redondearMultiplo(n, multiplo, resto = 0) {
  const k = Math.floor((n - resto) / multiplo);
  const abajo = k * multiplo + resto;
  const arriba = abajo + multiplo;
  const elegido = n - abajo < arriba - n ? abajo : arriba;
  return Math.max(elegido, multiplo + resto);
}

/** Centímetros reales que miden `pts` puntos, redondeados a 0,5 cm. */
export function cmReales(pts, P) {
  return Math.round(((pts * 10) / P) * 2) / 2;
}

/** Holgura en cm: la personalizada si es válida; si no, por categoría. */
export function holguraCm(opciones = {}) {
  const propia = parseCm(opciones.holguraCm);
  if (propia !== null) return propia;
  const tabla = { ajustada: 3, normal: 8, holgada: 15 };
  return tabla[opciones.holgura] ?? 8;
}
