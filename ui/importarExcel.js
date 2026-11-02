"use strict";

/* Importa un Excel exportado por la app y editado a mano. Todo se calcula sobre una copia
   del proyecto; solo se guarda cuando el usuario confirma en la vista previa. */

var TOL_CANT = 1e-6, TOL_PRECIO = 0.01, TOL_VALOR = 0.5;

/* ---------------------------- Cálculos ---------------------------- */

/* El desperdicio es global del catálogo: el del Excel se incorpora en la cantidad */
function cantConDesperdicio(cant, despExcel, despApp) {
  return cant * (1 + (despExcel || 0) / 100) / (1 + (despApp || 0) / 100);
}

/* Inverso de precioAjustado (datos/motor.js) */
function costoDesdeVenta(venta, it, mg) {
  var rent = it.rent === false ? 0 : Number(mg.rent || 0);
  var dol = it.imp ? Number(mg.dolar || 0) : 0;
  var v = venta;
  if (rent > 0 && rent < 100) v = v * (1 - rent / 100);
  if (dol > 0 && dol < 100) v = v * (1 - dol / 100);
  return v;
}

/* La línea de ajuste es material: transporte y herramienta también se calculan sobre ella */
function valorLineaAjuste(valorPrevio, diferencia, pctTH) {
  return valorPrevio + diferencia / (1 + (pctTH || 0) / 100);
}

/* ---------------------------- Lectura ----------------------------- */

function celdaXl(ws, r, c) { return ws[XLSX.utils.encode_cell({ r: r, c: c })] || null; }
function textoXl(cel) {
  return cel && cel.t !== "e" && cel.v !== null && cel.v !== undefined ? txt(cel.v) : "";
}
function numXl(cel) {
  if (!cel || cel.t === "e" || cel.v === null || cel.v === undefined || cel.v === "") return null;
  if (typeof cel.v === "number") return cel.v;
  return /\d/.test(String(cel.v)) ? aNum(cel.v) : null;
}
function pctDeTexto(s) { return Number(String(s).replace(",", ".")) || 0; }

function hojaXl(wb, nombre) {
  var n = wb.SheetNames.filter(function (x) { return norm(x) === nombre; })[0];
  return n ? wb.Sheets[n] : null;
}

function leerAnalisisXl(ws) {
  var rango = XLSX.utils.decode_range(ws["!ref"]);
  var apus = {}, act = null, sec = null;
  for (var r = rango.s.r; r <= rango.e.r; r++) {
    var a = textoXl(celdaXl(ws, r, 0)), b = textoXl(celdaXl(ws, r, 1)), c = textoXl(celdaXl(ws, r, 2));
    var mApu = /^APU\s+(\d+)\b/i.exec(a);
    if (mApu) {
      act = { apu: Number(mApu[1]), lineas: [], pctT: null, pctH: null, directo: null, directoFormula: true };
      apus[act.apu] = act;
      sec = null;
      continue;
    }
    if (!act || norm(a) === "codigo") continue;
    if (!a && !b) {
      var mSec = /^(i{1,3})\s*·/i.exec(c);
      if (mSec) sec = { i: "mat", ii: "th", iii: "mo" }[mSec[1].toLowerCase()];
      else if (norm(c) === "costodirecto") {
        var celDir = celdaXl(ws, r, 6);
        act.directo = numXl(celDir);
        act.directoFormula = !celDir || !!celDir.f;
      }
      continue;
    }
    if (sec === "th") {
      var pct = numXl(celdaXl(ws, r, 4));
      var codTh = a.toUpperCase();
      if (codTh === "TR1") act.pctT = pct === null ? 0 : pct * 100;
      if (codTh === "HER1") act.pctH = pct === null ? 0 : pct * 100;
      continue;
    }
    if (!sec) continue;
    var cant = numXl(celdaXl(ws, r, 3)) || 0;
    var desp = numXl(celdaXl(ws, r, 4)) || 0;
    var precio = numXl(celdaXl(ws, r, 5));
    var celG = celdaXl(ws, r, 6), g = numXl(celG);
    /* Un total escrito a mano manda sobre el precio de esa línea */
    if (g !== null && !celG.f && cant) {
      var esperado = cant * (1 + desp) * (precio || 0);
      if (Math.abs(g - esperado) > TOL_VALOR) precio = g / (cant * (1 + desp));
    }
    act.lineas.push({
      cod: codClave(a), desc: b, und: c, cant: cant, desp: desp * 100,
      precio: precio, mo: sec === "mo"
    });
  }
  return apus;
}

function leerCotizacionXl(ws) {
  var rango = XLSX.utils.decode_range(ws["!ref"]);
  var hdr = -1;
  for (var h = rango.s.r; h <= rango.e.r && hdr < 0; h++) {
    if (norm(textoXl(celdaXl(ws, h, 0))) === "apu") hdr = h;
  }
  if (hdr < 0) throw new Error("La hoja Cotización no tiene la fila de encabezado esperada.");
  var sep = norm(textoXl(celdaXl(ws, hdr, 5))) === "suminunit";
  var hojas = [], hoja = null;
  var asegurar = function () {
    if (!hoja) { hoja = { nombre: "Hoja 1", filas: [] }; hojas.push(hoja); }
    return hoja;
  };
  for (var r = hdr + 1; r <= rango.e.r; r++) {
    var a = textoXl(celdaXl(ws, r, 0)), b = textoXl(celdaXl(ws, r, 1));
    var c = textoXl(celdaXl(ws, r, 2)), d = textoXl(celdaXl(ws, r, 3));
    var cant = numXl(celdaXl(ws, r, 4));
    if (!a && !b && !c) continue;
    if (cant !== null && (c || d)) {
      var celU = celdaXl(ws, r, 5), celT = celdaXl(ws, r, 6), celMo = sep ? celdaXl(ws, r, 7) : null;
      asegurar().filas.push({
        tipo: "it", apu: Number(a) || null, item: b, desc: c, und: d, cant: cant,
        unit: numXl(celU), unitFormula: !celU || !!celU.f,
        tot: numXl(celT), totFormula: !celT || !!celT.f,
        moFormula: !sep || !celMo || !!celMo.f
      });
    } else if (a && !b && !c) {
      hoja = { nombre: a, filas: [] };
      hojas.push(hoja);
    } else if (c) {
      asegurar().filas.push({ tipo: "cap", item: b, desc: c });
    }
  }
  return { sep: sep, hojas: hojas };
}

function leerMembreteXl(ws) {
  var out = { nombre: "", cliente: "", constructora: "", ciudad: "", encargado: "",
              pct: {}, total: null, anticipo: null };
  var rango = XLSX.utils.decode_range(ws["!ref"]);
  var campos = { proyecto: "nombre", cliente: "cliente", constructora: "constructora",
                 ciudad: "ciudad", encargado: "encargado" };
  var valUtil = null, valIvaJunta = null;
  for (var r = rango.s.r; r <= rango.e.r; r++) {
    var etiqueta = textoXl(celdaXl(ws, r, 1));
    if (!etiqueta) continue;
    var k = norm(etiqueta), e = numXl(celdaXl(ws, r, 4)), m;
    if (campos[k]) out[campos[k]] = textoXl(celdaXl(ws, r, 2));
    else if ((m = /^administraci[oó]n\s+([\d.,]+)%/i.exec(etiqueta))) out.pct.admin = pctDeTexto(m[1]);
    else if ((m = /^imprevistos\s+([\d.,]+)%/i.exec(etiqueta))) out.pct.imprev = pctDeTexto(m[1]);
    else if ((m = /^utilidad\s+([\d.,]+)%/i.exec(etiqueta))) { out.pct.util = pctDeTexto(m[1]); valUtil = e; }
    else if ((m = /^iva\b.*?([\d.,]+)%/i.exec(etiqueta))) out.pct.iva = pctDeTexto(m[1]);
    else if (k === "ivasobreutilidad") valIvaJunta = e;
    else if (k === "valortotal") out.total = e;
    else if ((m = /^([\d.,]+)%\s*anticipo/i.exec(etiqueta))) out.anticipo = pctDeTexto(m[1]);
  }
  /* En modo junta el IVA solo aparece como valor, sin porcentaje en la etiqueta */
  if (out.pct.iva === undefined && valUtil && valIvaJunta !== null) {
    out.pct.iva = Math.round((valIvaJunta / valUtil) * 10000) / 100;
  }
  return out;
}

function leerExcelEditado(buffer) {
  var wb = XLSX.read(buffer, { type: "array", cellFormula: true });
  var wsA = hojaXl(wb, "analisis"), wsC = hojaXl(wb, "cotizacion"), wsM = hojaXl(wb, "membrete");
  if (!wsA) throw new Error("Este Excel no tiene hoja Análisis. Usa el Excel completo exportado por la app.");
  if (!wsC || !wsM) throw new Error("Faltan las hojas Cotización o Membrete. Usa el Excel completo exportado por la app.");
  var cot = leerCotizacionXl(wsC);
  return { apus: leerAnalisisXl(wsA), sep: cot.sep, hojas: cot.hojas, mem: leerMembreteXl(wsM) };
}

/* ---------------------- Conversión al proyecto --------------------- */

function clonar(o) { return JSON.parse(JSON.stringify(o)); }

function masFrecuente(valores, porDefecto) {
  var cuenta = {}, mejor = porDefecto, max = 0;
  valores.forEach(function (v) {
    cuenta[v] = (cuenta[v] || 0) + 1;
    if (cuenta[v] > max) { max = cuenta[v]; mejor = v; }
  });
  return mejor;
}

function proyectoDesdeExcel(xl) {
  var pcts = function (campo) {
    return Object.keys(xl.apus).map(function (n) { return xl.apus[n][campo]; })
      .filter(function (v) { return v !== null; });
  };
  var m = xl.mem;
  return {
    id: id(), nombre: m.nombre || "Proyecto importado", cliente: m.cliente, ciudad: m.ciudad,
    recibo: hoy(), entrega: "", archivo: "", constructora: m.constructora, encargado: m.encargado,
    entregaObs: "", tipo: "", check: {}, consideraciones: "", costoDirecto: 0,
    margenes: {
      rent: 0, dolar: 0, admin: m.pct.admin || 0, imprev: m.pct.imprev || 0, util: m.pct.util || 0,
      iva: m.pct.iva || 0, transporte: masFrecuente(pcts("pctT"), 0), herramienta: masFrecuente(pcts("pctH"), 0)
    },
    forma: xl.sep ? "separada" : "junta",
    anticipo: m.anticipo === null ? 30 : m.anticipo,
    avance: m.anticipo === null ? 70 : 100 - m.anticipo,
    creado: new Date().toISOString(),
    datosApu: {},
    hojas: xl.hojas.map(function (h) {
      return {
        /* Sin "crudas": la pestaña Anexo no debe reinterpretar columnas que este libro no tiene */
        nombre: h.nombre, ok: true, usar: true, encabezado: 0, mapa: {}, columnas: [],
        filas: h.filas.map(function (f) {
          return f.tipo === "cap"
            ? { tipo: "cap", item: f.item, desc: f.desc }
            : { tipo: "it", item: f.item, desc: f.desc, und: f.und, cant: f.cant, cod: [], apu: f.apu, cantObs: "" };
        })
      };
    })
  };
}

function sincronizarItems(p, xl, cambios) {
  var existentes = itemsDe(p);
  var usados = [];
  var buscar = function (it) {
    var clave = (it.item || "") + "|" + (it.desc || "");
    var exacto = null, parecido = null;
    existentes.forEach(function (x, i) {
      if (usados[i]) return;
      if (!exacto && (x.f.item || "") + "|" + (x.f.desc || "") === clave) exacto = i;
      if (parecido === null && norm(x.f.desc) === norm(it.desc)) parecido = i;
    });
    return exacto !== null ? exacto : parecido;
  };
  xl.hojas.forEach(function (hx) {
    hx.filas.forEach(function (it) {
      if (it.tipo !== "it") return;
      var i = buscar(it);
      if (i === null) {
        var destino = (p.hojas || []).filter(function (h) { return h.usar && txt(h.nombre) === txt(hx.nombre); })[0] ||
          (p.hojas || []).filter(function (h) { return h.usar; })[0];
        if (!destino) return;
        destino.filas.push({ tipo: "it", item: it.item, desc: it.desc, und: it.und, cant: it.cant, cod: [], apu: it.apu, cantObs: "" });
        cambios.push({ apu: it.apu, txt: "Ítem nuevo: " + it.desc });
        return;
      }
      usados[i] = true;
      var f = existentes[i].f;
      if (Math.abs((Number(f.cant) || 0) - it.cant) > TOL_CANT) {
        cambios.push({ apu: it.apu, txt: "Cantidad del ítem " + (f.item || f.desc) + ": " + f.cant + " → " + it.cant });
        f.cant = it.cant;
      }
      if ((f.apu || null) !== (it.apu || null)) {
        cambios.push({ apu: it.apu, txt: "Ítem " + (f.item || f.desc) + " pasa del análisis " + (f.apu || "ninguno") + " a " + (it.apu || "ninguno") });
        f.apu = it.apu;
      }
    });
  });
  existentes.forEach(function (x, i) {
    /* Una fila sin ítem ni descripción no se distingue en Cotización de una fila en blanco */
    if (usados[i] || (!txt(x.f.item) && !txt(x.f.desc))) return;
    var h = p.hojas[x.hi];
    h.filas.splice(h.filas.indexOf(x.f), 1);
    cambios.push({ apu: x.f.apu, txt: "Ítem quitado: " + (x.f.desc || x.f.item) });
  });
}

function asegurarPropio(p, cod, linea) {
  if (!p.propios) p.propios = {};
  p.propios[cod] = {
    cod: cod, desc: linea.desc, und: linea.und || "UND", precio: 0,
    imp: false, rent: false, desp: 0, propio: true
  };
}

function sincronizarLineas(p, cat, n, ax, cambios, avisos, esNuevo) {
  if (!p.datosApu) p.datosApu = {};
  var d = p.datosApu[n] || (p.datosApu[n] = {});
  var sinAjustes = {};
  Object.keys(d).forEach(function (k) { sinAjustes[k] = d[k]; });
  sinAjustes.ajustes = {};
  var base = {}, realDe = {};
  componerAnalisis(cat, sinAjustes, p, n).lineas.forEach(function (l) {
    base[l.cod] = l.cant;
    realDe[codClave(l.cod)] = l.cod;
  });

  var objetivo = {}, orden = [], precios = [], sinCodigo = 0;
  ax.lineas.forEach(function (l) {
    var cod = l.cod;
    if (!cod) {
      sinCodigo++;
      /* El prefijo LTC es lo que hace que un insumo cuente como mano de obra */
      cod = (l.mo ? "LTCEXC-" : "EXC-") + n + "-" + sinCodigo;
    }
    var real = realDe[codClave(cod)] || cod;
    if (!insumoDe(cat, real, p)) {
      asegurarPropio(p, real, l);
      if (l.mo && !esManoObra(real)) {
        avisos.push("Análisis " + n + ": el código " + real + " está en Mano de obra, pero la app lo contará como material.");
      }
    }
    var it = insumoDe(cat, real, p);
    var despApp = it && Number(it.desp) > 0 ? Number(it.desp) : 0;
    if (objetivo[real] === undefined) { objetivo[real] = { cant: 0, linea: l }; orden.push(real); }
    objetivo[real].cant += cantConDesperdicio(l.cant, l.desp, despApp);
    if (l.precio !== null && l.precio > 0) precios.push({ cod: real, desc: l.desc, precio: l.precio, apu: n });
  });

  var aj = d.ajustes || {};
  orden.forEach(function (c) {
    var meta = objetivo[c].cant, l = objetivo[c].linea;
    if (base[c] === undefined) {
      if (!d.extra) d.extra = [];
      d.extra.push({ cod: c, desc: l.desc, und: l.und, cant: meta });
      delete aj[c];
      if (!esNuevo) cambios.push({ apu: n, txt: "Línea nueva: " + c + " " + l.desc + " × " + fmt(meta) });
      return;
    }
    var cur = aj[c];
    var tieneCant = cur && cur.cant !== undefined && cur.cant !== null && cur.cant !== "";
    var actual = cur && cur.quitado ? null : (tieneCant ? Number(cur.cant) : base[c]);
    if (actual !== null && Math.abs(actual - meta) <= TOL_CANT) return;
    if (Math.abs(base[c] - meta) <= TOL_CANT) delete aj[c];
    else aj[c] = { cant: meta };
    cambios.push({ apu: n, txt: "Cantidad de " + c + " " + l.desc + ": " + (actual === null ? "quitada" : fmt(actual)) + " → " + fmt(meta) });
  });
  Object.keys(base).forEach(function (c) {
    /* La línea de ajuste la resuelve ajustarPrecioFinal: un Excel anterior al ajuste no la trae */
    if (c === "AJEX-" + n || objetivo[c] !== undefined || (aj[c] && aj[c].quitado)) return;
    aj[c] = { quitado: true };
    cambios.push({ apu: n, txt: "Línea quitada: " + c });
  });
  if (Object.keys(aj).length) d.ajustes = aj; else delete d.ajustes;

  /* Sin la sección II el Excel no dice el porcentaje; se asume 0 solo en un proyecto nuevo con materiales */
  var hayMat = ax.lineas.some(function (l) { return !l.mo; });
  var pctT = ax.pctT, pctH = ax.pctH;
  if (esNuevo && hayMat && pctT === null) pctT = 0;
  if (esNuevo && hayMat && pctH === null) pctH = 0;
  var ov = d.pct || {};
  var mg = p.margenes || {};
  var fijarPct = function (campo, valor) {
    if (valor === null) return;
    var vigente = ov[campo] !== undefined && ov[campo] !== null && ov[campo] !== "" ? Number(ov[campo]) : (Number(mg[campo]) || 0);
    if (Math.abs(vigente - valor) <= TOL_CANT) return;
    if (!d.pct) d.pct = {};
    d.pct[campo] = valor;
    if (!esNuevo) cambios.push({ apu: n, txt: campo + ": " + fmt(vigente) + "% → " + fmt(valor) + "%" });
  };
  fijarPct("transporte", pctT);
  fijarPct("herramienta", pctH);
  return precios;
}

function fijarCostoCopia(p, it, costo) {
  if (p.congelarPrecios && p.preciosCongelados && p.preciosCongelados[it.cod]) {
    var cong = p.preciosCongelados[it.cod];
    cong.precio = costo;
    var idx = p.proveedores && p.proveedores[it.cod] !== undefined ? p.proveedores[it.cod] : (it.sel || 0);
    if (cong.ofertas && cong.ofertas[idx]) cong.ofertas[idx].precio = costo;
  }
  if (!it.propio) {
    if (!p.preciosLocales) p.preciosLocales = {};
    p.preciosLocales[it.cod] = costo;
    return;
  }
  p.propios[it.cod].precio = costo;
  /* registrarPropio vuelve a escribir este precio desde la fila del equipo al componer */
  Object.keys(p.datosApu || {}).forEach(function (k) {
    ((p.datosApu[k] || {}).EQ || []).forEach(function (fila) {
      if (fila.crearItem && fila.codItem === it.cod) fila.precio = costo;
    });
  });
}

function fijarPrecios(p, cat, precios, elecciones, cambios, esNuevo) {
  var porCod = {}, orden = [];
  precios.forEach(function (x) {
    if (!porCod[x.cod]) { porCod[x.cod] = { desc: x.desc, opciones: {} }; orden.push(x.cod); }
    var k = (Math.round(x.precio * 100) / 100).toFixed(2);
    var op = porCod[x.cod].opciones[k] || (porCod[x.cod].opciones[k] = { clave: k, precio: x.precio, n: 0, apus: [] });
    op.n++;
    if (op.apus.indexOf(x.apu) < 0) op.apus.push(x.apu);
  });
  var conflictos = [];
  orden.forEach(function (cod) {
    var ops = Object.keys(porCod[cod].opciones).map(function (k) { return porCod[cod].opciones[k]; });
    ops.sort(function (a, b) { return b.n - a.n; });
    var elegido = ops[0];
    if (ops.length > 1) {
      var marcado = ops.filter(function (o) { return o.clave === elecciones[cod]; })[0];
      if (marcado) elegido = marcado;
      conflictos.push({ cod: cod, desc: porCod[cod].desc, opciones: ops, elegido: elegido.clave });
    }
    var it = insumoDe(cat, cod, p);
    if (!it) return;
    var actual = precioAjustado(it, p.margenes || {}, p);
    if (Math.abs(actual - elegido.precio) < TOL_PRECIO) return;
    fijarCostoCopia(p, it, costoDesdeVenta(elegido.precio, it, p.margenes || {}));
    if (!esNuevo) cambios.push({ apu: null, txt: "Precio de " + cod + " " + porCod[cod].desc + ": " + cop(actual) + " → " + cop(elegido.precio) });
  });
  return conflictos;
}

/* Un valor escrito a mano reemplaza la fórmula; si sigue siendo fórmula no se fuerza nada,
   para no ocultar diferencias que vienen de los conflictos de precio. */
function valorManualApu(xl, n, ax, avisos) {
  if (!xl.sep) {
    var items = [];
    xl.hojas.forEach(function (h) {
      h.filas.forEach(function (f) { if (f.tipo === "it" && f.apu === n) items.push(f); });
    });
    for (var i = 0; i < items.length; i++) {
      var f = items[i];
      if (f.unit !== null && !f.unitFormula) return f.unit;
      if (f.tot !== null && !f.totFormula && f.cant) return f.tot / f.cant;
    }
  } else {
    /* ponytail: en modo separado un unitario manual no se puede repartir entre suministro y M.O.; se avisa y no se aplica */
    xl.hojas.forEach(function (h) {
      h.filas.forEach(function (f) {
        if (f.tipo === "it" && f.apu === n && (!f.unitFormula || !f.moFormula)) {
          avisos.push("Análisis " + n + ": el valor escrito a mano en Cotización no se aplica en modo separado. Edítalo en la hoja Análisis.");
        }
      });
    });
  }
  return !ax.directoFormula && ax.directo !== null ? ax.directo : null;
}

function ajustarPrecioFinal(p, cat, xl, n, ax, cambios, avisos) {
  var objetivo = valorManualApu(xl, n, ax, avisos);
  var d = p.datosApu[n];
  var cod = "AJEX-" + n;
  var existente = (d.extra || []).filter(function (x) { return x.cod === cod; })[0];
  if (objetivo === null) {
    var enExcel = ax.lineas.some(function (l) { return l.cod === cod; });
    if (existente && !enExcel) {
      d.extra = d.extra.filter(function (x) { return x.cod !== cod; });
      cambios.push({ apu: n, txt: "Se quita el ajuste de precio final" });
    }
    return;
  }
  var comp = componerAnalisis(cat, d, p, n);
  var val = valorizar(cat, comp.lineas, margenesDe(p, n), p);
  var dif = objetivo - val.directo;
  if (Math.abs(dif) <= TOL_VALOR) return;

  var previo = existente && p.propios && p.propios[cod]
    ? (Number(existente.cant) || 0) * (Number(p.propios[cod].precio) || 0) : 0;
  var nuevo = valorLineaAjuste(previo, dif, val.pctTrans + val.pctHerr);
  if (d.ajustes) {
    delete d.ajustes[cod];
    if (!Object.keys(d.ajustes).length) delete d.ajustes;
  }
  if (!d.extra) d.extra = [];
  d.extra = d.extra.filter(function (x) { return x.cod !== cod; });
  if (Math.abs(nuevo) > TOL_VALOR) {
    var linea = { desc: "Ajuste Excel análisis " + n, und: "UN" };
    asegurarPropio(p, cod, linea);
    /* precioAjustado no acepta precios negativos: el signo va en la cantidad */
    p.propios[cod].precio = Math.abs(nuevo);
    d.extra.push({ cod: cod, desc: linea.desc, und: linea.und, cant: nuevo < 0 ? -1 : 1 });
  }
  cambios.push({ apu: n, txt: "Precio final escrito a mano: " + cop(val.directo) + " → " + cop(objetivo) });
}

function planImportacion(xl, base, cat, elecciones) {
  var esNuevo = !base;
  var p = esNuevo ? proyectoDesdeExcel(xl) : clonar(base);
  normalizarProyecto(p);
  var cambios = [], avisos = [];

  if (!esNuevo) {
    sincronizarItems(p, xl, cambios);
    if ((p.forma === "separada") !== xl.sep) avisos.push("El Excel y el proyecto usan una presentación distinta (junta o separada).");
    ["admin", "imprev", "util", "iva"].forEach(function (k) {
      var enExcel = xl.mem.pct[k];
      if (enExcel !== undefined && Math.abs(enExcel - (Number((p.margenes || {})[k]) || 0)) > 0.01) {
        avisos.push("El margen " + k + " es " + enExcel + "% en el Excel y " + ((p.margenes || {})[k] || 0) + "% en el proyecto; no se cambia.");
      }
    });
  }

  var precios = [];
  var ordenApus = Object.keys(xl.apus).map(Number).sort(function (a, b) { return a - b; });
  ordenApus.forEach(function (n) {
    precios = precios.concat(sincronizarLineas(p, cat, n, xl.apus[n], cambios, avisos, esNuevo));
  });
  var conflictos = fijarPrecios(p, cat, precios, elecciones || {}, cambios, esNuevo);
  ordenApus.forEach(function (n) { ajustarPrecioFinal(p, cat, xl, n, xl.apus[n], cambios, avisos); });

  var t = totalesProyecto(p, cat);
  var total = xl.sep ? t.totalSep : t.total;
  var noCuadran = [];
  ordenApus.forEach(function (n) {
    var enApp = t.porApu[n] ? t.porApu[n].unitario : null;
    var enExcel = xl.apus[n].directo;
    if (enApp !== null && enExcel !== null && Math.abs(enApp - enExcel) > 1) {
      noCuadran.push({ apu: n, app: enApp, excel: enExcel });
    }
  });
  return {
    p: p, esNuevo: esNuevo, cambios: cambios, avisos: avisos, conflictos: conflictos,
    totalApp: total, totalExcel: xl.mem.total, noCuadran: noCuadran
  };
}

/* ---------------------------- Interfaz ----------------------------- */

function htmlPlanImportacion(plan, xl, destino) {
  var opciones = '<option value="nuevo"' + (destino === "nuevo" ? " selected" : "") + '>Crear proyecto nuevo</option>' +
    Store.todos().map(function (x) {
      return '<option value="' + esc(x.id) + '"' + (x.id === destino ? " selected" : "") + '>' + esc(x.nombre) + '</option>';
    }).join("");

  var conflictos = plan.conflictos.map(function (c) {
    return '<div style="display:flex;gap:8px;align-items:center;margin:4px 0;flex-wrap:wrap">' +
      '<span style="flex:1;min-width:180px;font-size:12px">' + esc(c.cod) + ' ' + esc(c.desc) + '</span>' +
      '<select class="in" style="max-width:280px" data-conflicto="' + esc(c.cod) + '">' +
      c.opciones.map(function (o) {
        return '<option value="' + esc(o.clave) + '"' + (o.clave === c.elegido ? " selected" : "") + '>' +
          esc(cop(o.precio)) + ' · análisis ' + esc(o.apus.join(", ")) + '</option>';
      }).join("") + '</select></div>';
  }).join("");

  var porApu = {}, ordenCambios = [];
  plan.cambios.forEach(function (c) {
    var k = c.apu === null || c.apu === undefined ? "Precios e ítems" : "Análisis " + c.apu;
    if (!porApu[k]) { porApu[k] = []; ordenCambios.push(k); }
    porApu[k].push(c.txt);
  });
  var cambios = ordenCambios.map(function (k) {
    return '<div style="margin-top:8px"><b style="font-size:12px">' + esc(k) + '</b>' +
      porApu[k].map(function (t) { return '<div style="font-size:12px;margin-left:8px">' + esc(t) + '</div>'; }).join("") + '</div>';
  }).join("");

  var hayTotal = plan.totalExcel !== null;
  var cuadra = hayTotal && Math.abs(plan.totalApp - plan.totalExcel) <= 1;
  var conciliacion = '<div style="margin-top:12px;padding:10px;border-radius:6px;background:' + (cuadra ? "#ecf7e4" : "#fff4e0") + '">' +
    '<div style="font-size:13px"><b>Total en la app después de importar:</b> ' + esc(cop(plan.totalApp)) + '</div>' +
    '<div style="font-size:13px"><b>Total en el Excel:</b> ' + (hayTotal ? esc(cop(plan.totalExcel)) : "no encontrado") + '</div>' +
    (cuadra ? '<div style="font-size:12px;margin-top:4px">Los totales coinciden.</div>'
      : '<div style="font-size:12px;margin-top:4px">Los totales no coinciden' +
        (hayTotal ? ": diferencia de " + esc(cop(plan.totalApp - plan.totalExcel)) : "") + '.</div>') +
    plan.noCuadran.map(function (x) {
      return '<div style="font-size:12px">Análisis ' + esc(x.apu) + ': app ' + esc(cop(x.app)) + ', Excel ' + esc(cop(x.excel)) + '</div>';
    }).join("") + '</div>';

  var sinCambios = !plan.esNuevo && !plan.cambios.length;
  return '<div style="background:#fff;color:#222;max-width:680px;width:94%;max-height:88vh;overflow:auto;' +
      'border-radius:8px;padding:18px;box-shadow:0 8px 30px rgba(0,0,0,.3)">' +
    '<h3 style="margin:0 0 4px">Importar Excel editado</h3>' +
    '<div style="font-size:12px;color:#666;margin-bottom:10px">Proyecto en el Excel: ' + esc(xl.mem.nombre || "sin nombre") + '</div>' +
    '<label class="lbl" for="impdestino">Cargar en</label>' +
    '<select class="in" id="impdestino">' + opciones + '</select>' +
    (plan.esNuevo ? '<div style="font-size:12px;color:#666;margin-top:6px">Los análisis se crean como listas de insumos, sin Tubería, Cableado ni los demás apartados, porque el Excel no los guarda.</div>' : '') +
    (conflictos ? '<div style="margin-top:12px"><b style="font-size:13px">Elige un precio para cada insumo con varios precios</b>' + conflictos + '</div>' : '') +
    conciliacion +
    (plan.avisos.length ? '<div style="margin-top:12px"><b style="font-size:13px">Avisos</b>' +
      plan.avisos.map(function (a) { return '<div style="font-size:12px">' + esc(a) + '</div>'; }).join("") + '</div>' : '') +
    '<div style="margin-top:12px"><b style="font-size:13px">Cambios (' + plan.cambios.length + ')</b>' +
      (cambios || '<div style="font-size:12px">' + (plan.esNuevo ? "Se creará el proyecto completo." : "No hay cambios frente al proyecto.") + '</div>') + '</div>' +
    (plan.esNuevo ? '' : '<div style="font-size:12px;color:#666;margin-top:10px">Antes de aplicar se guarda una copia llamada "' + esc(plan.p.nombre) + ' (antes de Excel)".</div>') +
    '<div style="margin-top:16px;display:flex;gap:8px;justify-content:flex-end">' +
      '<button class="btn" id="impcancelar">Cancelar</button>' +
      '<button class="btn btnp" id="impaplicar"' + (sinCambios ? " disabled" : "") + '>Aplicar</button>' +
    '</div></div>';
}

function mostrarPlanImportacion(xl, cat) {
  var nombre = norm(xl.mem.nombre);
  var coincide = nombre ? Store.todos().filter(function (x) { return norm(x.nombre) === nombre; })[0] : null;
  var destino = coincide ? coincide.id : "nuevo";
  var elecciones = {};
  var ov = document.createElement("div");
  ov.id = "impoverlay";
  ov.style.cssText = "position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,.5);z-index:9999;display:flex;align-items:center;justify-content:center";
  document.body.appendChild(ov);
  var cerrar = function () { if (ov.parentNode) ov.parentNode.removeChild(ov); };

  function dibujar() {
    var base = destino === "nuevo" ? null : Store.leer(destino);
    var plan;
    try {
      plan = planImportacion(xl, base, cat, elecciones);
    } catch (e) {
      cerrar();
      avisoError("No se pudo interpretar el Excel: " + (e && e.message ? e.message : e));
      return;
    }
    ov.innerHTML = htmlPlanImportacion(plan, xl, destino);
    document.getElementById("impcancelar").onclick = cerrar;
    document.getElementById("impdestino").onchange = function () {
      destino = this.value;
      dibujar();
    };
    Array.prototype.forEach.call(ov.querySelectorAll("[data-conflicto]"), function (s) {
      s.onchange = function () {
        elecciones[s.dataset.conflicto] = s.value;
        dibujar();
      };
    });
    document.getElementById("impaplicar").onclick = function () {
      if (base) {
        var copia = clonar(base);
        copia.id = id();
        copia.nombre = base.nombre + " (antes de Excel)";
        Store.guardar(copia);
      }
      Store.guardar(plan.p);
      cerrar();
      avisoOk("Excel importado.");
      ir({ pantalla: "proyecto", pid: plan.p.id, paso: "ficha", hoja: 0, sel: [], apu: null });
    };
  }
  dibujar();
}

function abrirImportarExcel() {
  var cat = Catalogo.leer();
  if (!cat || !cat.comp) { avisoError("Primero carga el catálogo de insumos."); return; }
  var input = document.createElement("input");
  input.type = "file";
  input.accept = ".xlsx";
  input.onchange = function () {
    var f = input.files[0];
    if (!f) return;
    var fr = new FileReader();
    fr.onload = function () {
      var xl;
      try {
        xl = leerExcelEditado(new Uint8Array(fr.result));
      } catch (e) {
        avisoError(e && e.message ? e.message : "No se pudo leer ese Excel.");
        return;
      }
      mostrarPlanImportacion(xl, cat);
    };
    fr.readAsArrayBuffer(f);
  };
  input.click();
}
