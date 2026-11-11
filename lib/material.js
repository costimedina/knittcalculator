// Estimación de material (spec §3.5).

const techo = (x) => Math.ceil(+x.toFixed(6));

/** Gramos, metros y ovillos para un área total en cm². */
export function calcularMaterial(areaTotalCm2, muestra, tecnica) {
  const margen = tecnica === "crochet" ? 0.2 : 0.1;
  const gramos = techo((areaTotalCm2 / 100) * muestra.g100 * (1 + margen));
  return {
    gramos,
    metros: techo((gramos * muestra.metrosOvillo) / muestra.gramosOvillo),
    ovillos: techo(gramos / muestra.gramosOvillo),
  };
}
