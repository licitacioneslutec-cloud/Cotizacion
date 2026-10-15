"use strict";

/* ia.js - Autollenado de APU con IA: filtros regex, cache local, sugerencia individual y por lote.
   Depende de globales: analisisDe, datosDe, Catalogo, Store, refrescarPanel, avisoOk, avisoError, esc, URL_IA. */

var APARTADOS_IA = ["TU", "EQ", "CA", "SA", "TA", "mo"];

function extraerOpcionesComp(cat) {
  var tu = opcionesTuberia(cat);
  var eq = opcionesEquipo(cat);
  var ta = opcionesTablero(cat);
  return {
    TU: { familias: tu.familias, tipos: tu.tipos, diametros: tu.diametros },
    EQ: { familias: eq.familias, subfamilias: eq.subfamilias },
    CA: { cables: listaCables(cat).map(function (c) { return { cod: c.cod, desc: c.desc }; }) },
    SA: opcionesSalida(cat),
    TA: { tableros: ta.tableros, subitems: ta.subitems },
    mo: { items: subfamiliasEquipo(cat) }
  };
}

var cacheIA = {
  _leer: function () { try { return JSON.parse(localStorage.getItem("apu.ia.cache.v1")) || {}; } catch (e) { return {}; } },
  buscar: function (desc) { var c = this._leer(); var k = desc.trim().toLowerCase(); return c[k] || null; },
  guardar: function (desc, sug) {
    var c = this._leer();
    c[desc.trim().toLowerCase()] = { t: Date.now(), d: sug };
    var lim = Date.now() - 30 * 86400000;
    Object.keys(c).forEach(function (k) { if (c[k].t < lim) delete c[k]; });
    try { localStorage.setItem("apu.ia.cache.v1", JSON.stringify(c)); } catch (e) {}
  },
  limpiar: function () { try { localStorage.removeItem("apu.ia.cache.v1"); } catch (e) {} }
};

function resolverRegexIA(p, act, cat) {
  var hechos = [];
  var desc = act.items.length ? act.items[0].desc : "";
  var d = datosDe(p, act.apu);
  if (act.cod.indexOf("TU") >= 0) {
    var t = parsearTuberia(desc, opcionesTuberia(cat));
    if (t) {
      if (!d.TU) d.TU = [];
      d.TU.push(t);
      hechos.push("TU");
    }
  }
  if (act.cod.indexOf("CA") >= 0) {
    var r = parsearCableado(desc, listaCables(cat));
    if (r) {
      if (!d.CA) d.CA = [];
      d.CA.push({
        fase: r.fase ? r.fase.cod : "", cantFase: r.fase ? r.fase.cant : 0,
        neutro: r.neutro ? r.neutro.cod : "", cantNeutro: r.neutro ? r.neutro.cant : 0,
        tierra: r.tierra ? r.tierra.cod : "", cantTierra: r.tierra ? r.tierra.cant : 0,
        metrado: 0, repite: 0, bornas: true
      });
      hechos.push("CA");
    }
  }
  if (hechos.length) Store.guardar(p);
  return hechos;
}

function pendientesIA(act, hechos) {
  return act.cod.filter(function (c) { return hechos.indexOf(c) < 0; });
}

function itemsIA(items) {
  return items.map(function (i) { return { desc: i.desc, und: i.und, cant: i.cant }; });
}

function postIA(body) {
  return fetch(URL_IA, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  }).then(function (res) {
    if (!res.ok) return res.json().catch(function () { return {}; }).then(function (j) {
      var msg = (j.error && j.error.message) || (j.error && typeof j.error === "string" && j.error) || ("HTTP " + res.status);
      throw new Error(msg);
    });
    return res.json();
  });
}

function pedirSugerenciaIA(p, apu) {
  var act = analisisDe(p).filter(function (a) { return a.apu === apu; })[0];
  var cat = Catalogo.leer();
  if (!act || !cat || !act.items.length) return;

  var hechos = resolverRegexIA(p, act, cat);
  var faltan = pendientesIA(act, hechos);
  if (hechos.length) {
    refrescarPanel(p);
    avisoOk(hechos.indexOf("TU") >= 0 ? "Tubería detectada automáticamente" : "Cableado detectado automáticamente");
  }
  if (act.cod.length && !faltan.length) return;

  var desc = act.items[0].desc;
  var cached = cacheIA.buscar(desc);
  if (cached) { mostrarPreviewIA(p, apu, cached.d); return; }

  var btn = document.getElementById("btnIA");
  var textoOrig = btn ? btn.textContent : "";
  if (btn) { btn.textContent = "Procesando..."; btn.disabled = true; }

  postIA({ items: itemsIA(act.items), cod: faltan, opciones: extraerOpcionesComp(cat) })
    .then(function (j) {
      var sug = j.sugerencia;
      if (!sug) throw new Error("respuesta sin sugerencia");
      cacheIA.guardar(desc, sug);
      mostrarPreviewIA(p, apu, sug);
    })
    .catch(function (e) {
      avisoError("Error al consultar IA: " + (e && e.message ? e.message : e));
    })
    .then(function () {
      if (btn) { btn.textContent = textoOrig; btn.disabled = false; }
    });
}

function pedirSugerenciaLote(p) {
  var pendientes = analisisDe(p).filter(function (a) {
    var d = p.datosApu && p.datosApu[a.apu];
    if (!d) return true;
    return !Object.keys(d).some(function (k) { return Array.isArray(d[k]) && d[k].length; });
  });
  if (!pendientes.length) { avisoOk("Todos los APUs ya tienen datos"); return; }
  if (!confirm("Se procesarán " + pendientes.length + " APUs sin datos. ¿Continuar?")) return;

  var cat = Catalogo.leer();
  if (!cat) return;
  var opciones = extraerOpcionesComp(cat);
  var nRegex = 0, nCache = 0, nIA = 0, nError = 0;
  var porIA = [];

  pendientes.forEach(function (a) {
    if (!a.items.length) return;
    var hechos = resolverRegexIA(p, a, cat);
    var faltan = pendientesIA(a, hechos);
    if (hechos.length) nRegex++;
    if (a.cod.length && !faltan.length) return;
    var cached = cacheIA.buscar(a.items[0].desc);
    if (cached) { aplicarSugerenciaIA(p, a.apu, cached.d, true); nCache++; return; }
    porIA.push({ apu: a.apu, items: a.items, cod: faltan });
  });

  var lotes = [];
  for (var i = 0; i < porIA.length; i += 10) lotes.push(porIA.slice(i, i + 10));

  var prog = document.getElementById("iaProgreso");
  function mostrar(n) { if (prog) prog.textContent = "Lote " + n + " de " + lotes.length; }

  function fin() {
    if (prog) prog.textContent = "";
    Store.guardar(p);
    refrescarPanel(p);
    avisoOk("Listo: " + nRegex + " por regex, " + nCache + " desde caché, " + nIA + " por IA" +
      (nError ? ", " + nError + " con error" : ""));
  }

  function paso(n) {
    if (n >= lotes.length) { fin(); return; }
    mostrar(n + 1);
    var lote = lotes[n];
    postIA({
      lote: lote.map(function (a) { return { apu: a.apu, items: itemsIA(a.items), cod: a.cod }; }),
      opciones: opciones
    }).then(function (j) {
      var res = j.sugerencia || j.resultados || j.lote || j.sugerencias || [];
      var mapa = {};
      if (Array.isArray(res)) res.forEach(function (r) { mapa[r.apu] = r.sugerencia || r; });
      else mapa = res;
      lote.forEach(function (a) {
        var sug = mapa[a.apu];
        if (!sug) { nError++; return; }
        cacheIA.guardar(a.items[0].desc, sug);
        aplicarSugerenciaIA(p, a.apu, sug, true);
        nIA++;
      });
    }).catch(function (e) {
      nError += lote.length;
      avisoError("Error al consultar IA: " + (e && e.message ? e.message : e));
    }).then(function () { paso(n + 1); });
  }

  paso(0);
}

function resumenIA(k, x) {
  if (k === "TU") return [x.material, x.tipo, x.diam].join(" ") + " × " + x.cantidad;
  if (k === "EQ") return x.familia + " / " + x.subfamilia + " × " + x.cantidad;
  if (k === "CA") return "Fase: " + x.fase + " ×" + x.cantFase + ", Neutro: " + x.neutro + " ×" + x.cantNeutro +
    ", Tierra: " + x.tierra + " ×" + x.cantTierra;
  if (k === "SA") return x.aparato + " — " + x.modo;
  if (k === "TA") return x.familia + " / " + x.subitem + " × " + x.cantidad;
  return x.item + " × " + x.cantidad;
}

function mostrarPreviewIA(p, apu, sugerencia) {
  var viejo = document.getElementById("iapreview");
  if (viejo) viejo.parentNode.removeChild(viejo);

  var lineas = "";
  APARTADOS_IA.forEach(function (k) {
    if (!Array.isArray(sugerencia[k])) return;
    sugerencia[k].forEach(function (x) {
      lineas += '<div style="margin:4px 0"><b>' + k + ":</b> " + esc(resumenIA(k, x)) + "</div>";
    });
  });
  if (!lineas) lineas = "<div>La IA no devolvió datos para este APU.</div>";

  var ov = document.createElement("div");
  ov.id = "iapreview";
  ov.style.cssText = "position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,.5);z-index:9999;" +
    "display:flex;align-items:center;justify-content:center";
  ov.innerHTML =
    '<div style="background:#fff;color:#222;max-width:520px;width:92%;max-height:85vh;overflow:auto;' +
    'border-radius:8px;padding:18px;box-shadow:0 8px 30px rgba(0,0,0,.3)">' +
    '<h3 style="margin:0 0 12px">Sugerencia de IA — APU ' + esc(String(apu)) + "</h3>" + lineas +
    (sugerencia.razonamiento ? '<div style="margin-top:10px;font-size:12px;color:#666">' +
      esc(sugerencia.razonamiento) + "</div>" : "") +
    '<div style="margin-top:16px;display:flex;gap:8px;justify-content:flex-end">' +
    '<button class="btn" id="iaCancelar">Cancelar</button>' +
    '<button class="btn btnp" id="iaAplicar">Aplicar</button></div></div>';
  document.body.appendChild(ov);

  function cerrar() { if (ov.parentNode) ov.parentNode.removeChild(ov); }
  document.getElementById("iaCancelar").onclick = cerrar;
  document.getElementById("iaAplicar").onclick = function () {
    aplicarSugerenciaIA(p, apu, sugerencia);
    cerrar();
  };
}

function aplicarSugerenciaIA(p, apu, sugerencia, silencioso) {
  var datos = datosDe(p, apu);
  APARTADOS_IA.forEach(function (k) {
    var s = sugerencia[k];
    if (!Array.isArray(s) || !s.length) return;
    if (!Array.isArray(datos[k])) datos[k] = [];
    s.forEach(function (x) { datos[k].push(x); });
  });
  if (silencioso) return;
  Store.guardar(p);
  refrescarPanel(p);
  avisoOk("Sugerencia aplicada al APU " + apu);
}
