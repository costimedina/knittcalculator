// Lista «Mis diseños»: abrir, duplicar y borrar (con confirmación en la propia tarjeta).

function el(tag, attrs = {}, hijos = []) {
  const nodo = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === "texto") nodo.textContent = v;
    else if (k.startsWith("on")) nodo.addEventListener(k.slice(2), v);
    else if (v !== undefined && v !== null) nodo.setAttribute(k, v);
  }
  for (const h of hijos) nodo.append(h);
  return nodo;
}

const NOMBRE_PRENDA = { gorro: "Gorro", crop: "Crop top", chaleco: "Chaleco", sweater: "Sweater" };

export function montarListaDisenos(contenedor, disenos, acciones) {
  if (!disenos.length) {
    contenedor.replaceChildren(el("p", { class: "nota", texto: "Aún no guardas diseños. Calcula una prenda y tócale «Guardar diseño»." }));
    return;
  }
  contenedor.replaceChildren(...disenos.map((d) => {
    const detalle = [NOMBRE_PRENDA[d.prenda] ?? d.prenda, d.tecnica === "crochet" ? "crochet" : "palillo"]
      .filter(Boolean).join(" · ");
    const botonBorrar = el("button", { type: "button", class: "mini", texto: "Borrar" });
    botonBorrar.addEventListener("click", () => {
      if (botonBorrar.dataset.confirmando) acciones.borrar(d);
      else {
        botonBorrar.dataset.confirmando = "1";
        botonBorrar.textContent = "¿Borrar de verdad?";
        setTimeout(() => { delete botonBorrar.dataset.confirmando; botonBorrar.textContent = "Borrar"; }, 4000);
      }
    });
    return el("article", { class: "diseno-tarjeta" }, [
      el("div", { class: "diseno-datos" }, [
        el("strong", { texto: d.nombre || "Sin nombre" }),
        el("span", { class: "nota", texto: detalle }),
        ...(d.origen === "foto" ? [el("span", { class: "etiqueta-foto", texto: "desde foto" })] : []),
        ...(d.origen === "foto" && d.notaFoto ? [el("span", { class: "nota", texto: d.notaFoto })] : []),
      ]),
      el("div", { class: "diseno-acciones" }, [
        el("button", { type: "button", class: "mini", texto: "Abrir", onclick: () => acciones.abrir(d) }),
        el("button", { type: "button", class: "mini", texto: "Duplicar", onclick: () => acciones.duplicar(d) }),
        botonBorrar,
      ]),
    ]);
  }));
}
