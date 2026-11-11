// Vista de la receta: errores, avisos, material y una tarjeta por pieza con casillas de avance.

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

function recetaComoTexto(receta) {
  const lineas = [];
  for (const pieza of receta.piezas) {
    lineas.push(`${pieza.nombre}${pieza.cantidad > 1 ? ` (×${pieza.cantidad})` : ""}:`);
    pieza.pasos.forEach((p, i) => lineas.push(`  ${i + 1}. ${p}`));
    lineas.push("");
  }
  if (receta.material) {
    lineas.push(`Material: ${receta.material.gramos} g · ${receta.material.metros} m · ${receta.material.ovillos} ovillo(s).`);
  }
  return lineas.join("\n");
}

/** Dibuja la receta. `avance` es { [piezaId]: number[] } con los pasos marcados. */
export function mostrarReceta(contenedor, receta, avance, alMarcar) {
  const partes = [];

  for (const e of receta.errores) partes.push(el("p", { class: "mensaje error", texto: e }));
  for (const a of receta.avisos) partes.push(el("p", { class: "mensaje aviso", texto: a }));

  if (receta.material) {
    const m = receta.material;
    partes.push(el("div", { class: "material" }, [
      el("div", { class: "cifra" }, [el("strong", { texto: String(m.gramos) }), el("span", { texto: "gramos" })]),
      el("div", { class: "cifra" }, [el("strong", { texto: String(m.metros) }), el("span", { texto: "metros" })]),
      el("div", { class: "cifra" }, [el("strong", { texto: String(m.ovillos) }), el("span", { texto: m.ovillos === 1 ? "ovillo" : "ovillos" })]),
    ]));
    if (receta.muestra) {
      partes.push(el("p", { class: "nota", texto:
        `Calculado con ${receta.muestra.P} pts × ${receta.muestra.V} en 10 cm · ${receta.muestra.herramientaMm} mm · margen de seguridad incluido.` }));
    }
  }

  for (const pieza of receta.piezas) {
    const marcados = new Set(avance?.[pieza.id] ?? []);
    partes.push(el("article", { class: "pieza" }, [
      el("h3", { texto: pieza.cantidad > 1 ? `${pieza.nombre} ×${pieza.cantidad}` : pieza.nombre }),
      el("ol", { class: "pasos" }, pieza.pasos.map((paso, i) => {
        const id = `av-${pieza.id}-${i}`;
        return el("li", {}, [el("label", { class: "paso-item", for: id }, [
          el("input", {
            type: "checkbox", id, ...(marcados.has(i) ? { checked: "" } : {}),
            onchange: (e) => alMarcar(pieza.id, i, e.target.checked),
          }),
          el("span", { texto: paso }),
        ])]);
      })),
    ]));
  }

  if (receta.piezas.length) {
    const boton = el("button", { type: "button", class: "secundario", id: "copiar-receta", texto: "Copiar receta" });
    boton.addEventListener("click", async () => {
      const texto = recetaComoTexto(receta);
      try {
        await navigator.clipboard.writeText(texto);
        boton.textContent = "Receta copiada";
      } catch {
        const area = el("textarea", { class: "copia-manual", readonly: "" });
        area.value = texto;
        boton.after(area);
        area.select();
        boton.textContent = "Selecciona y copia el texto";
      }
      setTimeout(() => { boton.textContent = "Copiar receta"; }, 2500);
    });
    partes.push(boton);
  }

  contenedor.replaceChildren(...partes);
}
