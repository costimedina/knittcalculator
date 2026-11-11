// Espalda, delantero y terminaciones de crop, chaleco y sweater (spec §3.4).
import { puntos, vueltas, redondearMultiplo, cmReales, holguraCm } from "./base.js";

const GIRO = { pb: 1, mp: 2, vareta: 3 };
const NOMBRE_PUNTO = { pb: "punto bajo", mp: "medio punto", vareta: "vareta" };

function montarPieza(cm, muestra, tecnica) {
  const brutos = puntos(cm, muestra.P);
  return tecnica === "crochet" ? Math.max(1, Math.round(brutos)) : redondearMultiplo(brutos, 4, 2);
}

function pasosMontaje(montar, diseno, muestra, anchoCm) {
  const { tecnica, opciones } = diseno;
  const real = cmReales(montar, muestra.P);
  if (tecnica === "crochet") {
    const giro = GIRO[opciones.puntoCrochet];
    return [
      `Tejer una cadeneta de ${montar + giro} cadenetas (${montar} puntos + ${giro} de giro); quedará de ${real} cm de ancho (pediste ${anchoCm} cm).`,
      `Trabajar en ${NOMBRE_PUNTO[opciones.puntoCrochet]} sobre ${montar} puntos.`,
    ];
  }
  return [
    `Montar ${montar} puntos; la pieza quedará de ${real} cm de ancho (pediste ${anchoCm} cm).`,
    `Tejer ${vueltas(opciones.altoElastico, muestra.V)} vueltas de elástico 2×2 (${opciones.altoElastico} cm).`,
  ];
}

function unidadVueltas(tecnica) {
  return tecnica === "crochet" ? "hileras" : "vueltas";
}

/** Piezas del cuerpo. Devuelve { piezas, errores }. */
export function piezasCuerpo(diseno, muestra) {
  const { medidas: m, opciones, tecnica, prenda } = diseno;
  const u = unidadVueltas(tecnica);
  const C = m.pecho + holguraCm(opciones);
  const A = C / 2;

  const montar = montarPieza(A, muestra, tecnica);
  const vueltasHastaSisa = vueltas(m.largo - m.sisa, muestra.V);

  const conSisa = prenda !== "sweater";
  const r = conSisa ? Math.round(puntos(0.06 * C, muestra.P)) : 0;
  const sisaCierre = Math.ceil(r / 2);
  const sisaDisminuciones = r - sisaCierre;
  const puntosTrasSisa = montar - 2 * r;

  let anchoEscote = 2 * Math.round(puntosTrasSisa / 6);
  if ((puntosTrasSisa - anchoEscote) % 2 !== 0) anchoEscote += 1;
  const hombro = (puntosTrasSisa - anchoEscote) / 2;
  if (hombro < 1) {
    return { piezas: [], errores: ["Los hombros quedan sin puntos: revisa holgura o medidas."] };
  }

  const enV = opciones.escote === "v";
  const escoteLado = enV ? Math.floor(anchoEscote / 2) : Math.floor(anchoEscote / 4);
  const escoteCentral = anchoEscote - 2 * escoteLado;
  const vueltasEscoteDelantero = enV ? vueltas(m.sisa, muestra.V) : vueltas(7, muestra.V);
  const vueltasEscoteEspalda = vueltas(2, muestra.V);
  const areaPieza = A * m.largo;

  const pasosComunes = [
    ...pasosMontaje(montar, diseno, muestra, Math.round(A * 10) / 10),
    `Seguir recto hasta la sisa: ${vueltasHastaSisa} ${u} en total (${m.largo - m.sisa} cm desde el borde).`,
  ];
  const pasosSisa = conSisa
    ? [
        `Sisa: cerrar ${sisaCierre} puntos al inicio de las 2 ${u} siguientes.`,
        `Luego disminuir 1 punto a cada lado cada 2 ${u}, ${sisaDisminuciones} veces; quedan ${puntosTrasSisa} puntos.`,
      ]
    : [`Hombro caído: seguir recto, sin disminuciones de sisa (quedan ${puntosTrasSisa} puntos).`];

  const espalda = {
    id: "espalda", nombre: "Espalda", cantidad: 1, areaCm2: areaPieza,
    datos: { montar, vueltasHastaSisa, sisaCierre, sisaDisminuciones, puntosTrasSisa,
             escoteCentral: anchoEscote, escoteLado: 0, hombro, vueltasEscote: vueltasEscoteEspalda },
    pasos: [
      ...pasosComunes, ...pasosSisa,
      `Seguir hasta ${vueltas(2, muestra.V)} ${u} antes del hombro; cerrar los ${anchoEscote} puntos centrales del escote de una vez.`,
      `Terminar cada lado y cerrar los ${hombro} puntos de cada hombro.`,
    ],
  };

  const pasosEscoteDelantero = enV
    ? [
        `Escote en V: al llegar a la sisa, dividir la pieza en dos${escoteCentral ? ` (cerrar ${escoteCentral} punto central)` : ""}.`,
        `En cada lado, disminuir 1 punto al borde del escote ${escoteLado} veces, repartidas en las ${vueltasEscoteDelantero} ${u} hasta el hombro.`,
      ]
    : [
        `Escote redondo: a ${vueltasEscoteDelantero} ${u} del hombro (7 cm), cerrar los ${escoteCentral} puntos centrales.`,
        `En cada lado, disminuir 1 punto al borde del escote cada 2 ${u}, ${escoteLado} veces.`,
      ];

  const delantero = {
    id: "delantero", nombre: "Delantero", cantidad: 1, areaCm2: areaPieza,
    datos: { montar, vueltasHastaSisa, sisaCierre, sisaDisminuciones, puntosTrasSisa,
             escoteCentral, escoteLado, hombro, vueltasEscote: vueltasEscoteDelantero },
    pasos: [
      ...pasosComunes, ...pasosSisa, ...pasosEscoteDelantero,
      `Cerrar los ${hombro} puntos de cada hombro.`,
    ],
  };

  const piezas = [espalda, delantero];

  if (conSisa) {
    const perimetroSisas = 2 * 2 * m.sisa;
    const anchoEscoteCm = (anchoEscote * 10) / muestra.P;
    const perimetroEscote = anchoEscoteCm * 2 + 2 * 7;
    const recogerSisas = redondearMultiplo(puntos(perimetroSisas, muestra.P) * 0.9, 4);
    const recogerEscote = redondearMultiplo(puntos(perimetroEscote, muestra.P) * 0.9, 4);
    piezas.push({
      id: "terminaciones", nombre: "Terminaciones", cantidad: 1,
      areaCm2: (perimetroSisas + perimetroEscote) * 2.5,
      datos: { recogerSisas, recogerEscote },
      pasos: [
        `Coser hombros y costados.`,
        `Sisas: recoger ${recogerSisas} puntos en total entre las dos (${recogerSisas / 2} por sisa) y tejer 2,5 cm de elástico.`,
        `Escote: recoger ${recogerEscote} puntos alrededor y tejer 2,5 cm de elástico.`,
      ],
    });
  }

  return { piezas, errores: [] };
}
