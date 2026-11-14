"use strict";

/* ==================================================================
   Editor de Bolsas — Control de inventario de obra
   Vista independiente (pantalla "bolsas") con sub-navegación via vista.bolsaPaso.
   ================================================================== */

/* ---- Helpers de cálculo ---- */

/* Un ítem de la bolsa se identifica por código + capítulo (el mismo código puede estar en varios capítulos).
   Las líneas de pedido guardan `cap`; las antiguas (sin `cap`) se cargan al primer ítem con ese código. */
function bolsaCapDeLinea(b, li) {
  if (li.cap !== undefined && li.cap !== null) return li.cap;
  var it = bolsaItemPorCod(b, li.cod);
  return it ? (it.capitulo || "") : "";
}

/* cap undefined = todos los capítulos de ese código */
function bolsaDisponible(b, cod, cap) {
  var porCap = cap !== undefined && cap !== null;
  var total = 0;
  (b.items || []).forEach(function (it) {
    if (it.tipo === "it" && it.cod === cod && (!porCap || (it.capitulo || "") === cap)) total += (it.cantTotal || 0);
  });
  (b.pedidos || []).forEach(function (ped) {
    if (ped.tipo === "adicional" || ped.tipo === "omision") return;
    (ped.items || []).forEach(function (pi) {
      if (pi.cod === cod && (!porCap || bolsaCapDeLinea(b, pi) === cap)) total -= (pi.cant || 0);
    });
  });
  return total;
}

/* Código Auranet: el guardado en el ítem; si no hay y la bolsa está vinculada a un proyecto,
   el del proveedor elegido en el catálogo. */
function bolsaAuranet(b, it) {
  if (!it) return "";
  if (it.codAuranet) return it.codAuranet;
  var p = b.proyectoId ? Store.leer(b.proyectoId) : null;
  var cat = Catalogo.leer();
  if (!cat || !cat.items) return "";
  var of = ofertaDe(insumoDe(cat, it.cod, p), p);
  return of && of.codAur ? String(of.codAur).trim() : "";
}

function bolsaSiguientePedido(b) {
  var max = 0;
  (b.pedidos || []).forEach(function (p) { if (p.num > max) max = p.num; });
  return max + 1;
}

/* Con cap: el ítem de ese capítulo (o el primero del código si ya no existe). Sin cap: el primero. */
function bolsaItemPorCod(b, cod, cap) {
  var items = b.items || [], primero = null;
  for (var i = 0; i < items.length; i++) {
    if (items[i].tipo !== "it" || items[i].cod !== cod) continue;
    if (cap === undefined || cap === null || (items[i].capitulo || "") === cap) return items[i];
    if (!primero) primero = items[i];
  }
  return primero;
}

function bolsaItemsPorCod(b, cod) {
  return (b.items || []).filter(function (it) { return it.tipo === "it" && it.cod === cod; });
}

/* Líneas de un pedido de obra/provisional que piden más de lo disponible (por código + capítulo).
   excluirNum: al editar un pedido, lo que ese mismo pedido ya tenía vuelve a contar como disponible. */
function bolsaExcedidos(b, lineas, excluirNum) {
  var pedida = {}, msgs = [], SEP = "\u0001";
  lineas.forEach(function (l) {
    if (!l.cod || l.cod.indexOf("AD_") === 0 || l.cod.indexOf("OS_") === 0) return;
    var k = l.cod + SEP + (l.cap || "");
    pedida[k] = (pedida[k] || 0) + (Number(l.cant) || 0);
  });
  Object.keys(pedida).forEach(function (k) {
    var cod = k.split(SEP)[0], cap = k.split(SEP)[1];
    var disp = bolsaDisponible(b, cod, cap);
    (b.pedidos || []).forEach(function (ped) {
      if (excluirNum === undefined || ped.num !== excluirNum || ped.tipo === "adicional" || ped.tipo === "omision") return;
      (ped.items || []).forEach(function (li) { if (li.cod === cod && bolsaCapDeLinea(b, li) === cap) disp += (li.cant || 0); });
    });
    if (pedida[k] > disp + 1e-9) msgs.push(cod + (cap ? " [" + cap + "]" : "") + ": pide " + fmt(pedida[k]) + ", disponible " + fmt(disp));
  });
  return msgs;
}

/* Antes de mover capítulos, las líneas antiguas (sin cap) quedan fijas en el capítulo que hoy les toca */
function _bolsaFijarCapLineas(b) {
  (b.pedidos || []).forEach(function (ped) {
    if (ped.tipo === "adicional" || ped.tipo === "omision") return;
    (ped.items || []).forEach(function (li) { if (li.cap === undefined || li.cap === null) li.cap = bolsaCapDeLinea(b, li); });
  });
}

/* Renombra un capítulo en ítems, subtítulos y líneas de pedido */
function bolsaRenombrarCap(b, viejo, nuevo) {
  _bolsaFijarCapLineas(b);
  (b.items || []).forEach(function (it) {
    if (it.tipo === "it" && (it.capitulo || "") === viejo) it.capitulo = nuevo;
    if (it.tipo === "sub" && it.desc === viejo) it.desc = nuevo;
  });
  (b.pedidos || []).forEach(function (ped) {
    (ped.items || []).forEach(function (li) { if (li.cap === viejo) li.cap = nuevo; });
  });
}

/* Mueve un solo ítem a otro capítulo; sus pedidos lo siguen si ya no queda ese código en el capítulo viejo */
function bolsaMoverItemCap(b, it, nuevo) {
  _bolsaFijarCapLineas(b);
  var viejo = it.capitulo || "";
  it.capitulo = nuevo;
  var queda = bolsaItemsPorCod(b, it.cod).some(function (x) { return (x.capitulo || "") === viejo; });
  if (queda) return;
  (b.pedidos || []).forEach(function (ped) {
    (ped.items || []).forEach(function (li) { if (li.cod === it.cod && li.cap === viejo) li.cap = nuevo; });
  });
}

function bolsaResumen(b) {
  var totalItems = 0, valorInv = 0, pedidos = (b.pedidos || []).length;
  var valorPedInv = 0, valorAdicional = 0, valorOmision = 0;
  (b.items || []).forEach(function (it) {
    if (it.tipo !== "it") return;
    totalItems++;
    valorInv += (it.cantTotal || 0) * (it.precio || 0);
  });
  (b.pedidos || []).forEach(function (ped) {
    (ped.items || []).forEach(function (li) {
      var it = bolsaItemPorCod(b, li.cod, li.cap);
      var precio = (li.precio || (it ? it.precio : 0)) || 0;
      var sub = (li.cant || 0) * precio;
      if (ped.tipo === "adicional") valorAdicional += sub;
      else if (ped.tipo === "omision") valorOmision += sub;
      else valorPedInv += sub;
    });
  });
  return { totalItems: totalItems, valorInv: valorInv, pedidos: pedidos,
           valorPedInv: valorPedInv, valorAdicional: valorAdicional, valorOmision: valorOmision };
}

/* ---- Importar Excel ---- */

/* Busca la fila de encabezados de una hoja tipo bolsa: código, descripción, precio unitario y
   cantidad total y/o columnas CAP1, CAP2... con la cantidad de cada capítulo. */
function _bolsaEncabezados(sheet) {
  if (!sheet || !sheet["!ref"]) return null;
  var rng = XLSX.utils.decode_range(sheet["!ref"]);
  for (var r = rng.s.r; r <= Math.min(rng.e.r, rng.s.r + 30); r++) {
    var m = { caps: [], fila: r, s: rng.s.c, e: rng.e.r };
    for (var c = rng.s.c; c <= rng.e.c; c++) {
      var t = norm(_cellVal(sheet, r, c));
      if (!t) continue;
      var mc = /^cap(?:itulo)?(\d+)$/.exec(t);
      if (mc) { m.caps.push({ c: c, n: Number(mc[1]) }); continue; }
      if (m.precio === undefined && (t.indexOf("preciounit") === 0 || t === "vrunitario" || t === "valorunitario")) m.precio = c;
      else if (t === "cantidadfinal") m.cantFinal = c;
      else if (m.cant === undefined && (t === "canttotal" || t === "cantidadtotal" || t === "cantidad" || t === "cant")) m.cant = c;
      else if (m.cod === undefined && (t === "codigolutec" || t === "codigo" || t === "cod" || t === "codigomaterial" || t === "codigosap")) m.cod = c;
      else if (m.desc === undefined && (t.indexOf("descripcion") === 0 || t === "materiales" || t === "material")) m.desc = c;
      else if (m.und === undefined && (t === "und" || t === "unidad" || t === "um" || t === "unid")) m.und = c;
      else if (t === "codauranetarr") m.aurArr = c;
      else if (m.aur === undefined && (t === "codauranet" || t === "codigoauranet")) m.aur = c;
    }
    if (m.cantFinal !== undefined) m.cant = m.cantFinal;
    if (m.precio !== undefined && (m.caps.length || m.cant !== undefined)) {
      if (m.cod === undefined) m.cod = rng.s.c;
      if (m.desc === undefined) m.desc = m.cod + 1;
      if (m.aurArr !== undefined) m.aur = m.aurArr;
      return m;
    }
  }
  return null;
}

/* Nombres de capítulo del presupuesto: filas cuyo ÍTEM es un entero (1, 2, 3...) en orden.
   CAPn de la bolsa corresponde al n-ésimo capítulo. Solo se usa una hoja con exactamente
   `total` capítulos; si no hay, los capítulos quedan como "CAP n" (mejor sin nombre que con uno errado). */
function _bolsaNombresCap(wb, hojaBolsa, total) {
  var mejor = [];
  wb.SheetNames.forEach(function (n) {
    if (n === hojaBolsa) return;
    var sh = wb.Sheets[n];
    if (!sh || !sh["!ref"]) return;
    var rng = XLSX.utils.decode_range(sh["!ref"]);
    var cItem = -1, cDesc = -1, r0 = -1;
    for (var r = rng.s.r; r <= Math.min(rng.e.r, rng.s.r + 15) && r0 < 0; r++) {
      for (var c = rng.s.c; c <= rng.e.c; c++) {
        var t = norm(_cellVal(sh, r, c));
        if (t === "item" && cItem < 0) cItem = c;
        else if (t.indexOf("descripcion") === 0 && cDesc < 0) cDesc = c;
      }
      if (cItem >= 0 && cDesc >= 0) r0 = r; else { cItem = -1; cDesc = -1; }
    }
    if (r0 < 0) return;
    var nombres = [];
    for (var rr = r0 + 1; rr <= rng.e.r; rr++) {
      var vi = _cellVal(sh, rr, cItem), vd = _cellVal(sh, rr, cDesc);
      if (vi === null || vd === null || typeof vd !== "string" || !vd.trim()) continue;
      if (!/^\d{1,3}(\.0+)?$/.test(String(vi).trim())) continue;
      var nom = vd.trim().replace(/\s+/g, " ");
      nombres.push(nom.length > 60 ? nom.slice(0, 57) + "..." : nom);
    }
    if (nombres.length === total && !mejor.length) mejor = nombres;
  });
  return mejor;
}

/* Hoja de bolsa en formato matriz (una fila por material, columnas CAPn con cantidades).
   Devuelve los ítems agrupados por capítulo, o null si no encuentra una hoja así. */
function _bolsaDesdeMatriz(wb) {
  var orden = wb.SheetNames.slice().sort(function (a, b) {
    var pa = /bolsa/i.test(a) ? 0 : /consolidado|inventario/i.test(a) ? 1 : 2;
    var pb = /bolsa/i.test(b) ? 0 : /consolidado|inventario/i.test(b) ? 1 : 2;
    return pa - pb;
  });
  var hoja = null, m = null;
  /* Primero una hoja con columnas de capítulo; si ninguna tiene, la primera con cantidad total */
  for (var pase = 0; pase < 2 && !m; pase++) {
    for (var i = 0; i < orden.length; i++) {
      var det = _bolsaEncabezados(wb.Sheets[orden[i]]);
      if (det && (pase === 1 || det.caps.length)) { hoja = orden[i]; m = det; break; }
    }
  }
  if (!m) return null;
  var sheet = wb.Sheets[hoja];
  var maxCap = m.caps.reduce(function (s, k) { return Math.max(s, k.n); }, 0);
  var nombres = maxCap ? _bolsaNombresCap(wb, hoja, maxCap) : [];
  var txt = function (r, c) { var v = c === undefined ? null : _cellVal(sheet, r, c); return v === null ? "" : String(v).trim(); };
  var num = function (r, c) { return c === undefined ? 0 : (Number(_cellVal(sheet, r, c)) || 0); };

  var grupos = {}, ordenGrupos = [];
  function agregar(cap, base, cant) {
    if (!grupos[cap]) { grupos[cap] = { items: [], porCod: {} }; ordenGrupos.push(cap); }
    var g = grupos[cap];
    if (g.porCod[base.cod]) { g.porCod[base.cod].cantTotal += cant; return; }
    var it = { tipo: "it", cod: base.cod, desc: base.desc, cantTotal: cant, precio: base.precio,
               und: base.und, capitulo: cap, codAuranet: base.codAuranet };
    g.porCod[base.cod] = it; g.items.push(it);
  }
  var etiquetaCap = function (n) { return "CAP " + n + (nombres[n - 1] ? " - " + nombres[n - 1] : ""); };
  /* Los capítulos aparecen en el orden de las columnas */
  m.caps.forEach(function (k) { var e = etiquetaCap(k.n); if (!grupos[e]) { grupos[e] = { items: [], porCod: {} }; ordenGrupos.push(e); } });

  for (var r = m.fila + 1; r <= m.e; r++) {
    var cod = txt(r, m.cod), desc = txt(r, m.desc);
    if (!cod || !desc) continue;
    var base = { cod: cod, desc: desc, precio: num(r, m.precio), und: txt(r, m.und), codAuranet: txt(r, m.aur) };
    var enCaps = 0;
    m.caps.forEach(function (k) {
      var q = num(r, k.c);
      if (q) { agregar(etiquetaCap(k.n), base, q); enCaps += q; }
    });
    if (!enCaps && num(r, m.cant)) agregar(m.caps.length ? "Sin capítulo" : "", base, num(r, m.cant));
  }

  var items = [];
  ordenGrupos.forEach(function (cap) {
    var g = grupos[cap];
    if (!g.items.length) return;
    if (cap) items.push({ tipo: "sub", desc: cap });
    items.push.apply(items, g.items);
  });
  return items;
}

function importarBolsaExcel(buffer, nombreArchivo) {
  var wb = XLSX.read(buffer, { type: "array" });
  var bolsa = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
    nombre: "", descripcion: "", responsable: "", telefono: "", direccion: "",
    fechaInicio: "", fechaFin: "", centroCostos: "", notas: "",
    modificado: new Date().toISOString(),
    items: [], pedidos: []
  };

  /* Formato propio (Membrete / Inventario / Pedidos_Historial) o bolsa en matriz con CAP1, CAP2... */
  if (!wb.Sheets["Inventario"] && !wb.Sheets["Membrete"]) {
    var itemsMatriz = _bolsaDesdeMatriz(wb);
    if (!itemsMatriz || !itemsMatriz.length) throw new Error("No se encontró una hoja de bolsa con columnas de código, descripción, precio unitario y cantidad o capítulos (CAP1, CAP2...).");
    bolsa.items = itemsMatriz;
    bolsa.nombre = String(nombreArchivo || "").replace(/\.[^.]+$/, "") || ("Bolsa importada " + new Date().toISOString().slice(0, 10));
    return bolsa;
  }

  // Membrete
  var memb = wb.Sheets["Membrete"];
  if (memb) {
    bolsa.nombre = (memb["B2"] && memb["B2"].v) || (memb["B3"] && memb["B3"].v) || "Bolsa importada";
    bolsa.responsable = (memb["B5"] && memb["B5"].v) || "";
    bolsa.direccion = (memb["B4"] && memb["B4"].v) || "";
  }

  // Inventario
  var inv = wb.Sheets["Inventario"] || wb.Sheets[wb.SheetNames[1]];
  if (inv) {
    var rango = XLSX.utils.decode_range(inv["!ref"] || "A1");
    var subActual = "";
    for (var r = 2; r <= rango.e.r; r++) {
      var cB = inv[XLSX.utils.encode_cell({ r: r, c: 1 })];
      var cC = inv[XLSX.utils.encode_cell({ r: r, c: 2 })];
      var cD = inv[XLSX.utils.encode_cell({ r: r, c: 3 })];
      var cE = inv[XLSX.utils.encode_cell({ r: r, c: 4 })];
      var cG = inv[XLSX.utils.encode_cell({ r: r, c: 6 })];
      var cH = inv[XLSX.utils.encode_cell({ r: r, c: 7 })];
      var cI = inv[XLSX.utils.encode_cell({ r: r, c: 8 })];
      var valB = cB ? String(cB.v || "").trim() : "";
      var valC = cC ? String(cC.v || "").trim() : "";
      if (!valB && !valC) continue;
      // Subtítulo: solo tiene col B (texto largo, sin código numérico)
      if (valB && !valC && !/^\d+$/.test(valB.replace(/[.\-]/g, ""))) {
        bolsa.items.push({ tipo: "sub", desc: valB });
        subActual = valB;
        continue;
      }
      // Ítem normal
      bolsa.items.push({
        tipo: "it",
        cod: valB,
        desc: valC,
        cantTotal: cD ? Number(cD.v) || 0 : 0,
        precio: cE ? Number(cE.v) || 0 : 0,
        und: cG ? String(cG.v || "") : "",
        capitulo: (cH && String(cH.v || "").trim()) || subActual,
        codAuranet: cI ? String(cI.v || "") : ""
      });
    }
  }

  // Historial — cols: A=#PED, B=FECHA, C=SOLICITANTE, D=CODIGO, E=DESCRIPCION, F=CANTIDAD, G=PRECIO, H=SUBTOTAL, I=TIPO
  var hist = wb.Sheets["Pedidos_Historial"];
  if (hist) {
    var rh = XLSX.utils.decode_range(hist["!ref"] || "A1");
    var pedMap = {};
    for (var rx = 1; rx <= rh.e.r; rx++) {
      var nCell = hist[XLSX.utils.encode_cell({ r: rx, c: 0 })];
      var num = nCell ? Number(nCell.v) || 0 : 0;
      if (!num) continue;
      if (!pedMap[num]) {
        var fCell = hist[XLSX.utils.encode_cell({ r: rx, c: 1 })];
        var sCell = hist[XLSX.utils.encode_cell({ r: rx, c: 2 })];
        var tCell = hist[XLSX.utils.encode_cell({ r: rx, c: 8 })];
        var tipoStr = tCell ? String(tCell.v || "").toLowerCase().trim() : "";
        var tipo = "obra";
        if (tipoStr.indexOf("adicional") >= 0) tipo = "adicional";
        else if (tipoStr.indexOf("omisi") >= 0) tipo = "omision";
        else if (tipoStr.indexOf("provisional") >= 0) tipo = "provisional";
        pedMap[num] = {
          num: num,
          fecha: fCell ? String(fCell.v || "") : "",
          solicitante: sCell ? String(sCell.v || "") : "",
          tipo: tipo, items: []
        };
      }
      var codCell  = hist[XLSX.utils.encode_cell({ r: rx, c: 3 })];
      var descCell = hist[XLSX.utils.encode_cell({ r: rx, c: 4 })];
      var cantCell = hist[XLSX.utils.encode_cell({ r: rx, c: 5 })];
      var precCell = hist[XLSX.utils.encode_cell({ r: rx, c: 6 })];
      if (codCell) {
        var codStr = String(codCell.v || "");
        var item = { cod: codStr, cant: cantCell ? Number(cantCell.v) || 0 : 0, obs: "" };
        if (codStr.indexOf("AD_") === 0 || codStr.indexOf("OS_") === 0) {
          item.desc = descCell ? String(descCell.v || "") : "";
          item.precio = precCell ? Number(precCell.v) || 0 : 0;
          item.und = "UND";
        }
        pedMap[num].items.push(item);
      }
    }
    bolsa.pedidos = Object.keys(pedMap).map(function (k) { return pedMap[k]; });
    bolsa.pedidos.sort(function (a, b) { return a.num - b.num; });
  }

  if (!bolsa.nombre) bolsa.nombre = "Bolsa importada " + new Date().toISOString().slice(0, 10);
  return bolsa;
}

/* ---- Render principal ---- */

function renderBolsas() {
  if (vista.bolsaId) {
    var b = Bolsas.leer(vista.bolsaId);
    if (!b) { ir({ pantalla: "bolsas", bolsaId: null, bolsaPaso: null }); return; }
    var paso = vista.bolsaPaso || "ficha";
    if (paso === "inventario") return renderBolsaInventario(b);
    if (paso === "pedido") return renderBolsaPedido(b);
    if (paso === "historial") return renderBolsaHistorial(b);
    if (paso === "resumen") return renderBolsaResumen(b);
    if (paso === "presupuesto") return renderBolsaPresupuesto(b);
    if (paso === "apus") return renderBolsaApus(b);
    return renderBolsaFicha(b);
  }
  return renderBolsaLista();
}

/* ---- Barra de pasos de bolsa ---- */

function barraBolsa(b, paso) {
  var pasos = [
    { id: "ficha", label: "Ficha" },
    { id: "presupuesto", label: "Presupuesto" },
    { id: "apus", label: "APUs" },
    { id: "inventario", label: "Inventario" },
    { id: "pedido", label: "Nuevo pedido" },
    { id: "historial", label: "Historial" },
    { id: "resumen", label: "Resumen" }
  ];
  return '<div class="tabs tabsfijas" style="margin-bottom:12px">' +
    '<button class="tab" data-bolvolver style="font-weight:700">&larr; Bolsas</button>' +
    pasos.map(function (p) {
      return '<button class="tab" data-bolpaso="' + p.id + '" aria-pressed="' + (paso === p.id) + '">' + p.label + '</button>';
    }).join("") +
    '</div>';
}
function enlazarBarraBolsa(b) {
  var btnV = document.querySelector("[data-bolvolver]");
  if (btnV) btnV.onclick = function () { ir({ pantalla: "bolsas", bolsaId: null, bolsaPaso: null }); };
  Array.prototype.forEach.call(document.querySelectorAll("[data-bolpaso]"), function (btn) {
    btn.onclick = function () { ir({ bolsaPaso: btn.dataset.bolpaso }); };
  });
}

/* ---- 1. Lista de bolsas ---- */

function renderBolsaLista() {
  var todas = Bolsas.todos();
  var tarjetas = todas.map(function (b) {
    var r = bolsaResumen(b);
    return '<div class="card" style="cursor:pointer" data-abrirbolsa="' + b.id + '">' +
      '<div class="chd"><span class="ct">' + esc(b.nombre || "Sin nombre") + '</span>' +
      '<span class="cn">' + esc(b.responsable || "") + '</span></div>' +
      '<div class="cbd" style="font-size:13px">' +
        '<span>' + r.totalItems + ' items</span> · ' +
        '<span>' + cop(r.valorInv) + '</span> · ' +
        '<span>' + r.pedidos + ' pedidos</span>' +
        '<div style="font-size:11px;color:var(--ink3);margin-top:4px">' +
          (b.modificado ? 'Mod. ' + b.modificado.slice(0, 10) : '') + '</div>' +
      '</div></div>';
  }).join("") || '<div class="empty" style="padding:24px">No hay bolsas registradas. Crea una nueva o importa un Excel.</div>';

  app.innerHTML = barraTop("bolsas") +
    '<header class="top"><div class="wrap topin"><div>' +
      '<div class="brand">Control de inventario</div>' +
      '<h1 class="d h1">Bolsas de obra</h1>' +
      '<div class="sub">Administra el inventario de materiales por obra</div>' +
    '</div></div></header>' +
    '<main class="wrap main">' +
      '<div class="btnrow" style="margin-bottom:16px">' +
        '<button class="btn btnp" id="bolNueva">+ Nueva bolsa</button>' +
        '<label class="btn" style="margin-left:8px;cursor:pointer">Importar Excel<input type="file" id="bolImport" accept=".xlsx,.xlsm" style="display:none"></label>' +
        '<button class="btn" id="bolSync" style="margin-left:8px">Sincronizar</button>' +
        '<label class="btn" style="margin-left:8px;cursor:pointer">Restaurar JSON<input type="file" id="bolRestore" accept=".json" style="display:none"></label>' +
      '</div>' +
      tarjetas +
    '</main>';

  enlazarTop();
  enlazarBolsaLista();
}

function enlazarBolsaLista() {
  document.getElementById("bolNueva").onclick = function () {
    var b = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
      nombre: "", descripcion: "", responsable: "", telefono: "", direccion: "",
      fechaInicio: "", fechaFin: "", centroCostos: "", notas: "",
      modificado: new Date().toISOString(), items: [], pedidos: []
    };
    Bolsas.guardar(b);
    ir({ bolsaId: b.id, bolsaPaso: "ficha" });
  };

  document.getElementById("bolImport").onchange = function (e) {
    var f = e.target.files[0]; if (!f) return;
    var reader = new FileReader();
    reader.onload = function (ev) {
      try {
        var bolsa = importarBolsaExcel(new Uint8Array(ev.target.result), f.name);
        Bolsas.guardar(bolsa);
        avisoOk("Bolsa \"" + bolsa.nombre + "\" importada con " + bolsa.items.filter(function (i) { return i.tipo === "it"; }).length + " items.");
        render();
      } catch (err) { avisoError("Error al importar: " + err.message); }
    };
    reader.readAsArrayBuffer(f);
  };

  document.getElementById("bolSync").onclick = function () {
    if (!Sync.encendida()) { avisoError("Activa la sincronización primero."); return; }
    Sync.marca("sync");
    var prom = [];
    Bolsas.todos().forEach(function (b) { prom.push(Nube.escribir("bolsas/" + b.id, b)); });
    prom.push(Sync.bajarBolsas());
    Promise.all(prom).then(function () {
      Sync.marca("ok");
      avisoOk("Bolsas sincronizadas.");
      render();
    }).catch(function () { Sync.marca("err"); avisoError("Error de sincronización."); });
  };

  document.getElementById("bolRestore").onchange = function (e) {
    var f = e.target.files[0]; if (!f) return;
    var reader = new FileReader();
    reader.onload = function (ev) {
      try {
        var b = JSON.parse(ev.target.result);
        if (!b.id || !b.items) { avisoError("Archivo no válido."); return; }
        Bolsas.guardar(b);
        avisoOk("Bolsa \"" + (b.nombre || b.id) + "\" restaurada.");
        render();
      } catch (err) { avisoError("Error al restaurar: " + err.message); }
    };
    reader.readAsText(f);
  };

  Array.prototype.forEach.call(document.querySelectorAll("[data-abrirbolsa]"), function (el) {
    el.onclick = function () { ir({ bolsaId: el.dataset.abrirbolsa, bolsaPaso: "ficha" }); };
  });
}

/* ---- 2. Ficha ---- */

function renderBolsaFicha(b) {
  var r = bolsaResumen(b);
  var proyOpts = '<option value="">— Sin proyecto vinculado —</option>';
  Store.todos().forEach(function (p) {
    proyOpts += '<option value="' + p.id + '"' + (b.proyectoId === p.id ? ' selected' : '') + '>' + esc(p.nombre || p.id) + '</option>';
  });
  var nPres = (b.presupuesto || []).filter(function (x) { return x.tipo === "it"; }).length;
  var nApuEx = (b.apuExcel || []).length;
  var statPres = nPres || nApuEx
    ? '<div style="margin-top:8px;font-size:12px;color:var(--ok,#2e7d32)">' + nPres + ' ítems y ' + nApuEx + ' APUs importados del Excel</div>'
    : '';
  app.innerHTML = barraTop("bolsas") +
    '<header class="top"><div class="wrap topin"><div>' +
      '<div class="brand">Bolsa</div>' +
      '<h1 class="d h1">' + esc(b.nombre || "Sin nombre") + '</h1>' +
    '</div></div></header>' +
    '<main class="wrap main">' +
    barraBolsa(b, "ficha") +
    '<div class="card"><div class="chd"><span class="ct">Datos de la bolsa</span>' +
      '<span class="cn">' + r.totalItems + ' items · ' + cop(r.valorInv) + ' · ' + r.pedidos + ' pedidos</span></div>' +
      '<div class="cbd">' +
        '<div class="g" style="grid-template-columns:1fr 1fr;gap:10px">' +
          campo("bf-nombre", "Nombre", b.nombre) +
          campo("bf-resp", "Responsable", b.responsable) +
          campo("bf-tel", "Teléfono", b.telefono) +
          campo("bf-dir", "Dirección", b.direccion) +
          campo("bf-fi", "Fecha inicio", b.fechaInicio, "date") +
          campo("bf-ff", "Fecha fin", b.fechaFin, "date") +
          campo("bf-cc", "Centro de costos", b.centroCostos) +
        '</div>' +
        '<div style="margin-top:10px">' + campo("bf-desc", "Descripción", b.descripcion) + '</div>' +
        '<div style="margin-top:10px">' + campo("bf-notas", "Notas", b.notas) + '</div>' +
        '<div style="margin-top:16px;padding-top:12px;border-top:1px solid var(--borde,#dde3e8)">' +
          '<div class="lbl" style="margin-bottom:6px;font-weight:700">Vínculo con proyecto</div>' +
          '<div class="g" style="grid-template-columns:1fr auto;gap:10px;align-items:end">' +
            '<div><label class="lbl" for="bf-proy">Proyecto de la app</label>' +
              '<select class="in" id="bf-proy">' + proyOpts + '</select></div>' +
            '<label class="btn" style="cursor:pointer;white-space:nowrap">Importar presupuesto Excel' +
              '<input type="file" id="bf-presfile" accept=".xlsx,.xlsm" style="display:none"></label>' +
          '</div>' + statPres +
          _htmlMapeoPresupuesto() +
        '</div>' +
        '<div class="btnrow" style="margin-top:12px">' +
          '<button class="btn btnp" id="bf-guardar">Guardar cambios</button>' +
          '<button class="btn" id="bf-respaldo" style="margin-left:8px">Descargar respaldo JSON</button>' +
          '<button class="btn" id="bf-borrar" style="margin-left:8px;color:#c00">Eliminar bolsa</button>' +
        '</div>' +
    '</div></div></main>';

  enlazarTop(); enlazarBarraBolsa(b);
  document.getElementById("bf-guardar").onclick = function () {
    b.nombre = document.getElementById("bf-nombre").value.trim();
    b.responsable = document.getElementById("bf-resp").value.trim();
    b.telefono = document.getElementById("bf-tel").value.trim();
    b.direccion = document.getElementById("bf-dir").value.trim();
    b.fechaInicio = document.getElementById("bf-fi").value;
    b.fechaFin = document.getElementById("bf-ff").value;
    b.centroCostos = document.getElementById("bf-cc").value.trim();
    b.descripcion = document.getElementById("bf-desc").value.trim();
    b.notas = document.getElementById("bf-notas").value.trim();
    var prevProy = b.proyectoId || "";
    b.proyectoId = document.getElementById("bf-proy").value || "";
    Bolsas.guardar(b);
    if (b.proyectoId && b.proyectoId !== prevProy) {
      var ni = importarInventarioDesdeProyecto(b);
      if (ni) avisoOk("Ficha guardada. Se importaron " + ni + " insumos del proyecto al inventario.");
      else avisoOk("Ficha guardada. Proyecto vinculado.");
    } else {
      avisoOk("Ficha guardada.");
    }
  };
  document.getElementById("bf-presfile").onchange = function (e) {
    var f = e.target.files[0]; if (!f) return;
    var reader = new FileReader();
    reader.onload = function (ev) {
      try {
        _wbPresup = XLSX.read(new Uint8Array(ev.target.result), { type: "array" });
        _wbPresupHojaOf = 0;
        _wbPresupHojaApu = -1;
        for (var i = 0; i < _wbPresup.SheetNames.length; i++) {
          var nl = _wbPresup.SheetNames[i].toLowerCase();
          if (nl.indexOf("oferta") >= 0 || nl.indexOf("cotizacion") >= 0 || nl.indexOf("presupuesto") >= 0) _wbPresupHojaOf = i;
          if (nl === "apu" || nl === "apus") _wbPresupHojaApu = i;
        }
        render();
      } catch (err) { avisoError("Error al leer el archivo: " + err.message); }
    };
    reader.readAsArrayBuffer(f);
  };
  var mpHojaOf = document.getElementById("mp-hojaOf");
  if (mpHojaOf) mpHojaOf.onchange = function () { _wbPresupHojaOf = Number(this.value); render(); };
  var mpHojaApu = document.getElementById("mp-hojaApu");
  if (mpHojaApu) mpHojaApu.onchange = function () { _wbPresupHojaApu = Number(this.value); render(); };
  var mpImportar = document.getElementById("mp-importar");
  if (mpImportar) mpImportar.onclick = function () { importarPresupuestoConMapeo(b); };
  var mpCancelar = document.getElementById("mp-cancelar");
  if (mpCancelar) mpCancelar.onclick = function () { _wbPresup = null; render(); };
  document.getElementById("bf-respaldo").onclick = function () {
    var blob = new Blob([JSON.stringify(b, null, 2)], { type: "application/json" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = "bolsa_" + (b.nombre || b.id) + ".json"; a.click();
    URL.revokeObjectURL(a.href);
  };
  document.getElementById("bf-borrar").onclick = function () {
    if (!confirm("¿Eliminar la bolsa \"" + (b.nombre || b.id) + "\"? Esta acción no se puede deshacer.")) return;
    Bolsas.borrar(b.id);
    ir({ pantalla: "bolsas", bolsaId: null, bolsaPaso: null });
  };
}

function campo(id, label, val, tipo) {
  return '<div><label class="lbl" for="' + id + '">' + label + '</label>' +
    '<input class="in" id="' + id + '" type="' + (tipo || "text") + '" value="' + esc(val || "") + '"></div>';
}

/* ---- 3. Inventario ---- */

function renderBolsaInventario(b) {
  var q = (vista.filtBolsaInv || "").toLowerCase();
  if (!vista.bolsaSelInv) vista.bolsaSelInv = [];
  var sel = vista.bolsaSelInv;
  var filas = "";
  var visibles = 0;
  (b.items || []).forEach(function (it, i) {
    if (it.tipo === "sub") {
      filas += '<tr style="background:var(--bg2)"><td colspan="11" style="padding:6px">' +
        '<input class="in" data-subinv="' + i + '" value="' + esc(it.desc) + '" title="Nombre del capítulo" style="font-weight:700"></td></tr>';
      return;
    }
    if (q && (it.cod || "").toLowerCase().indexOf(q) < 0 && (it.desc || "").toLowerCase().indexOf(q) < 0) return;
    visibles++;
    var disp = bolsaDisponible(b, it.cod, it.capitulo || "");
    var pct = it.cantTotal > 0 ? disp / it.cantTotal : 1;
    var color = pct > 0.3 ? "var(--ok,#2e7d32)" : pct > 0 ? "#e65100" : "#c00";
    var checked = sel.indexOf(i) >= 0 ? " checked" : "";
    filas += '<tr>' +
      '<td style="width:30px;text-align:center"><input type="checkbox" data-selinv="' + i + '"' + checked + '></td>' +
      '<td class="m">' + esc(it.cod) + '</td>' +
      '<td>' + esc(it.desc) + '</td>' +
      '<td><input class="in m" type="number" min="0" step="any" data-cantinv="' + i + '" value="' + (it.cantTotal || 0) + '" style="width:80px;text-align:right"></td>' +
      '<td class="num">' + cop(it.precio) + '</td>' +
      '<td class="num">' + cop((it.cantTotal || 0) * (it.precio || 0)) + '</td>' +
      '<td class="m">' + esc(it.und) + '</td>' +
      '<td><input class="in" data-capinv="' + i + '" value="' + esc(it.capitulo || "") + '" list="dlCapsInv" style="font-size:12px;min-width:130px"></td>' +
      '<td><input class="in m" data-aurinv="' + i + '" value="' + esc(bolsaAuranet(b, it)) + '" style="width:80px"></td>' +
      '<td class="num" style="color:' + color + ';font-weight:600">' + fmt(disp) + '</td>' +
      '<td style="text-align:center"><button class="btnx" data-editinv="' + i + '" title="Editar">&#9998;</button>' +
        '<button class="btnx" data-delinv="' + i + '" title="Quitar" style="color:#c00;margin-left:4px">&times;</button></td>' +
    '</tr>';
  });

  var bulkHtml = sel.length
    ? '<div class="bulk" style="margin-bottom:10px"><span>' + sel.length + ' items seleccionados</span>' +
        '<button class="btn btnp" id="enviarAPedido" style="margin-left:12px">Enviar a pedido</button></div>'
    : '';

  app.innerHTML = barraTop("bolsas") +
    '<header class="top"><div class="wrap topin"><div>' +
      '<div class="brand">Bolsa</div>' +
      '<h1 class="d h1">' + esc(b.nombre || "Sin nombre") + ' — Inventario</h1>' +
    '</div></div></header>' +
    '<main class="wrap main">' +
    barraBolsa(b, "inventario") +
    '<div class="card"><div class="chd"><span class="ct">Inventario</span>' +
      '<span class="cn">' + visibles + ' items</span></div><div class="cbd">' +
      '<input class="in infiltro" id="filtBolsaInv" placeholder="Buscar por código o descripción" value="' + esc(vista.filtBolsaInv || "") + '">' +
      bulkHtml +
      '<div class="scroll" style="margin-top:10px"><table class="tbl"><thead><tr>' +
        '<th style="width:30px"><input type="checkbox" id="selAllInv"></th>' +
        '<th style="width:80px">Código</th><th>Descripción</th>' +
        '<th style="width:90px" class="num">Cant.</th>' +
        '<th style="width:90px" class="num">Precio</th>' +
        '<th style="width:100px" class="num">Valor</th>' +
        '<th style="width:50px">Und</th><th style="width:150px">Cap.</th>' +
        '<th style="width:90px">Auranet</th>' +
        '<th style="width:70px" class="num">Disp.</th><th style="width:60px"></th>' +
      '</tr></thead><tbody>' + filas + '</tbody></table></div>' +
      '<datalist id="dlCapsInv">' + Object.keys((b.items || []).reduce(function (o, x) {
        if (x.tipo === "it" && x.capitulo) o[x.capitulo] = 1; return o; }, {})).map(function (c) {
        return '<option value="' + esc(c) + '">'; }).join("") + '</datalist>' +
      '<div class="btnrow" style="margin-top:12px">' +
        '<button class="btn" id="bolAddItem">+ Agregar ítem</button>' +
        '<button class="btn" id="bolAddSub" style="margin-left:8px">+ Subtítulo</button>' +
      '</div>' +
    '</div></div></main>';

  enlazarTop(); enlazarBarraBolsa(b);

  var selAll = document.getElementById("selAllInv");
  if (selAll) {
    selAll.checked = sel.length > 0 && sel.length === visibles;
    selAll.onchange = function () {
      vista.bolsaSelInv = [];
      if (this.checked) {
        (b.items || []).forEach(function (it, i) {
          if (it.tipo !== "it") return;
          if (q && (it.cod || "").toLowerCase().indexOf(q) < 0 && (it.desc || "").toLowerCase().indexOf(q) < 0) return;
          vista.bolsaSelInv.push(i);
        });
      }
      render();
    };
  }

  Array.prototype.forEach.call(document.querySelectorAll("[data-selinv]"), function (cb) {
    cb.onchange = function () {
      var idx = Number(cb.dataset.selinv);
      if (cb.checked) { if (sel.indexOf(idx) < 0) sel.push(idx); }
      else { vista.bolsaSelInv = sel.filter(function (x) { return x !== idx; }); }
      render();
    };
  });

  var envBtn = document.getElementById("enviarAPedido");
  if (envBtn) envBtn.onclick = function () {
    vista.bolsaPrePedido = sel.map(function (i) {
      var it = b.items[i];
      return it ? { cod: it.cod, cap: it.capitulo || "" } : null;
    }).filter(function (x) { return x && x.cod; });
    vista.bolsaSelInv = [];
    ir({ bolsaPaso: "pedido" });
  };

  var fi = document.getElementById("filtBolsaInv");
  if (fi) fi.oninput = function () {
    vista.filtBolsaInv = this.value;
    vista.bolsaSelInv = [];
    var pos = this.selectionStart, y = window.scrollY;
    render(); window.scrollTo(0, y);
    var n = document.getElementById("filtBolsaInv");
    if (n) { n.focus(); n.setSelectionRange(pos, pos); }
  };

  document.getElementById("bolAddItem").onclick = function () {
    b.items.push({ tipo: "it", cod: "", desc: "Nuevo ítem", cantTotal: 0, precio: 0, und: "UND", capitulo: "", codAuranet: "" });
    Bolsas.guardar(b); render();
  };
  document.getElementById("bolAddSub").onclick = function () {
    b.items.push({ tipo: "sub", desc: "Nuevo subtítulo" });
    Bolsas.guardar(b); render();
  };

  Array.prototype.forEach.call(document.querySelectorAll("[data-editinv]"), function (btn) {
    btn.onclick = function () {
      var idx = Number(btn.dataset.editinv);
      var it = b.items[idx]; if (!it || it.tipo !== "it") return;
      var nd = prompt("Descripción:", it.desc);
      if (nd === null) return;
      it.desc = nd;
      var np = prompt("Precio unitario:", it.precio);
      if (np !== null) it.precio = Number(np) || 0;
      Bolsas.guardar(b); render();
    };
  });

  /* Edición en línea: se guarda al salir del campo (change), no mientras se escribe */
  var conScroll = function (fn) { var y = window.scrollY; fn(); window.scrollTo(0, y); };
  Array.prototype.forEach.call(document.querySelectorAll("[data-cantinv]"), function (inp) {
    inp.onchange = function () {
      var it = b.items[Number(inp.dataset.cantinv)]; if (!it) return;
      it.cantTotal = Number(inp.value) || 0;
      Bolsas.guardar(b); conScroll(render);
    };
  });
  Array.prototype.forEach.call(document.querySelectorAll("[data-aurinv]"), function (inp) {
    inp.onchange = function () {
      var it = b.items[Number(inp.dataset.aurinv)]; if (!it) return;
      it.codAuranet = inp.value.trim();
      Bolsas.guardar(b);
    };
  });
  Array.prototype.forEach.call(document.querySelectorAll("[data-capinv]"), function (inp) {
    inp.onchange = function () {
      var it = b.items[Number(inp.dataset.capinv)]; if (!it) return;
      var viejo = it.capitulo || "", nuevo = inp.value.trim();
      if (nuevo === viejo) return;
      var n = (b.items || []).filter(function (x) { return x.tipo === "it" && (x.capitulo || "") === viejo; }).length;
      if (viejo && n > 1 && confirm("¿Renombrar el capítulo «" + viejo + "» a «" + nuevo + "» en sus " + n +
          " ítems y pedidos?\n\nAceptar = todo el capítulo\nCancelar = mover solo este ítem")) {
        bolsaRenombrarCap(b, viejo, nuevo);
      } else {
        bolsaMoverItemCap(b, it, nuevo);
      }
      Bolsas.guardar(b); conScroll(render);
    };
  });
  Array.prototype.forEach.call(document.querySelectorAll("[data-subinv]"), function (inp) {
    inp.onchange = function () {
      var sub = b.items[Number(inp.dataset.subinv)]; if (!sub) return;
      var nuevo = inp.value.trim();
      if (!nuevo || nuevo === sub.desc) { inp.value = sub.desc; return; }
      bolsaRenombrarCap(b, sub.desc, nuevo);
      sub.desc = nuevo;
      Bolsas.guardar(b); conScroll(render);
    };
  });

  Array.prototype.forEach.call(document.querySelectorAll("[data-delinv]"), function (btn) {
    btn.onclick = function () {
      var idx = Number(btn.dataset.delinv);
      if (!confirm("¿Eliminar este ítem del inventario?")) return;
      b.items.splice(idx, 1);
      vista.bolsaSelInv = [];
      Bolsas.guardar(b); render();
    };
  });
}

/* ---- 4. Nuevo pedido ---- */

function renderBolsaPedido(b) {
  var num = bolsaSiguientePedido(b);
  var hoy = new Date().toISOString().slice(0, 10);

  app.innerHTML = barraTop("bolsas") +
    '<header class="top"><div class="wrap topin"><div>' +
      '<div class="brand">Bolsa</div>' +
      '<h1 class="d h1">' + esc(b.nombre || "Sin nombre") + ' — Pedido #' + num + '</h1>' +
    '</div></div></header>' +
    '<main class="wrap main">' +
    barraBolsa(b, "pedido") +
    '<div class="card"><div class="chd"><span class="ct">Datos del pedido</span></div><div class="cbd">' +
      '<div class="g" style="grid-template-columns:100px 1fr 1fr 1fr;gap:10px">' +
        '<div><label class="lbl">Pedido #</label><input class="in m" id="ped-num" value="' + num + '" readonly></div>' +
        campo("ped-fecha", "Fecha", hoy, "date") +
        campo("ped-sol", "Solicitante", "") +
        '<div><label class="lbl" for="ped-tipo">Tipo</label><select class="in" id="ped-tipo">' +
          '<option value="obra">Obra</option><option value="provisional">Provisional</option>' +
          '<option value="omision">Omisión</option><option value="adicional">Adicional</option>' +
        '</select></div>' +
      '</div>' +
      campo("ped-tel", "Teléfono", "") +
      campo("ped-dest", "Destino", "") +
      '<div id="pedAviso" style="display:none;background:#fff3cd;border-left:4px solid #ffc107;padding:10px;margin-top:10px;font-size:13px">' +
        'Los items de este pedido <b>no restan del inventario</b>. Puede agregar items que no están en el inventario.' +
      '</div>' +
    '</div></div>' +

    '<div class="card"><div class="chd"><span class="ct">Items del pedido</span></div><div class="cbd">' +
      '<table class="tbl" id="tblPedItems"><thead><tr>' +
        '<th style="width:100px">Código</th><th style="width:160px">Capítulo</th><th>Descripción</th><th style="width:60px">Und</th>' +
        '<th style="width:70px" class="num">Disp.</th><th style="width:80px" class="num">Cantidad</th>' +
        '<th style="width:100px" class="num">Precio</th><th style="width:100px" class="num">Subtotal</th>' +
        '<th style="width:80px">Obs.</th><th style="width:40px"></th>' +
      '</tr></thead><tbody id="pedBody"></tbody>' +
      '<tfoot><tr><td colspan="7" style="text-align:right;font-weight:600">Total:</td>' +
        '<td class="num" id="pedTotal" style="font-weight:700">$0</td><td colspan="2"></td></tr></tfoot></table>' +
      '<div class="btnrow" style="margin-top:10px">' +
        '<button class="btn" id="pedAddRow">+ Agregar línea</button>' +
        '<button class="btn" id="pedAddExtra" style="margin-left:8px;display:none">+ Item no inventariado</button>' +
        '<button class="btn btnp" id="pedRegistrar" style="margin-left:12px">Registrar pedido</button>' +
      '</div>' +
    '</div></div></main>';

  enlazarTop(); enlazarBarraBolsa(b);

  // Pre-llenar desde checkboxes de inventario
  var lineas;
  if (vista.bolsaPrePedido && vista.bolsaPrePedido.length) {
    lineas = vista.bolsaPrePedido.map(function (x) { return { cod: x.cod, cap: x.cap, cant: 0, obs: "" }; });
    vista.bolsaPrePedido = null;
  } else {
    lineas = [{ cod: "", cant: 0, obs: "" }];
  }

  var tipoSel = document.getElementById("ped-tipo");

  function actualizarTipoUI() {
    var esExtra = tipoSel.value === "adicional" || tipoSel.value === "omision";
    document.getElementById("pedAviso").style.display = esExtra ? "" : "none";
    document.getElementById("pedAddExtra").style.display = esExtra ? "" : "none";
  }
  tipoSel.onchange = function () { actualizarTipoUI(); redibujarLineas(); };

  function redibujarLineas() {
    var body = document.getElementById("pedBody");
    var total = 0;
    var topado = tipoSel.value === "obra" || tipoSel.value === "provisional";
    body.innerHTML = lineas.map(function (l, i) {
      var esExtra = l.cod && (l.cod.indexOf("AD_") === 0 || l.cod.indexOf("OS_") === 0);
      var opciones = esExtra ? [] : bolsaItemsPorCod(b, l.cod);
      if (opciones.length && !opciones.some(function (o) { return (o.capitulo || "") === l.cap; })) l.cap = opciones[0].capitulo || "";
      var it = esExtra ? null : bolsaItemPorCod(b, l.cod, l.cap);
      var precio = esExtra ? (l.precio || 0) : (it ? (it.precio || 0) : 0);
      var sub = (l.cant || 0) * precio;
      total += sub;

      if (esExtra) {
        return '<tr style="background:#fff8e1">' +
          '<td><input class="in m" data-pedcod="' + i + '" value="' + esc(l.cod) + '" readonly style="width:90px;background:#eee"></td>' +
          '<td style="color:var(--ink3)">—</td>' +
          '<td><input class="in" data-peddesc="' + i + '" value="' + esc(l.desc || "") + '" placeholder="Descripción"></td>' +
          '<td><input class="in m" data-pedund="' + i + '" value="' + esc(l.und || "UND") + '" style="width:50px"></td>' +
          '<td class="num" style="color:var(--ink3)">N/A</td>' +
          '<td><input class="in m" type="number" min="0" data-pedcant="' + i + '" value="' + (l.cant || "") + '" style="width:70px;text-align:right"></td>' +
          '<td><input class="in m" type="number" min="0" data-pedprecio="' + i + '" value="' + (l.precio || "") + '" style="width:90px;text-align:right"></td>' +
          '<td class="num">' + cop(sub) + '</td>' +
          '<td><input class="in m" data-pedobs="' + i + '" value="' + esc(l.obs) + '" style="width:70px"></td>' +
          '<td><button class="btnx" data-pedquit="' + i + '" style="color:#c00">&times;</button></td>' +
        '</tr>';
      }

      var disp = it ? bolsaDisponible(b, l.cod, l.cap || "") : 0;
      var celdaCap = opciones.length > 1
        ? '<select class="in" data-pedcap="' + i + '" style="font-size:12px">' + opciones.map(function (o) {
            var c = o.capitulo || "";
            return '<option value="' + esc(c) + '"' + (c === l.cap ? " selected" : "") + '>' +
              esc(c || "Sin capítulo") + ' (disp. ' + fmt(bolsaDisponible(b, l.cod, c)) + ')</option>';
          }).join("") + '</select>'
        : '<span style="font-size:12px">' + esc(it ? (it.capitulo || "") : "") + '</span>';
      return '<tr>' +
        '<td><input class="in m" data-pedcod="' + i + '" value="' + esc(l.cod) + '" placeholder="Código" list="dlCods"></td>' +
        '<td>' + celdaCap + '</td>' +
        '<td style="font-size:12px">' + (it ? esc(it.desc) : '<span style="color:var(--ink3)">—</span>') + '</td>' +
        '<td class="m">' + (it ? esc(it.und) : "") + '</td>' +
        '<td class="num">' + (it ? fmt(disp) : "—") + '</td>' +
        '<td><input class="in m" type="number" min="0"' + (topado && it ? ' max="' + Math.max(disp, 0) + '"' : '') +
          ' data-pedcant="' + i + '" value="' + (l.cant || "") + '" style="width:70px;text-align:right' +
          (topado && (l.cant || 0) > disp ? ';border-color:#c00;color:#c00" title="Supera lo disponible (' + fmt(disp) + ')' : '') + '"></td>' +
        '<td class="num">' + (it ? cop(it.precio) : "—") + '</td>' +
        '<td class="num">' + cop(sub) + '</td>' +
        '<td><input class="in m" data-pedobs="' + i + '" value="' + esc(l.obs) + '" style="width:70px"></td>' +
        '<td><button class="btnx" data-pedquit="' + i + '" style="color:#c00">&times;</button></td>' +
      '</tr>';
    }).join("");
    document.getElementById("pedTotal").textContent = cop(total);

    var dl = document.getElementById("dlCods");
    if (!dl) { dl = document.createElement("datalist"); dl.id = "dlCods"; document.body.appendChild(dl); }
    var vistosDl = {};
    dl.innerHTML = (b.items || []).filter(function (it) {
      if (it.tipo !== "it" || vistosDl[it.cod]) return false;
      return (vistosDl[it.cod] = true);
    }).map(function (it) {
      return '<option value="' + esc(it.cod) + '">' + esc(it.desc) + '</option>';
    }).join("");

    Array.prototype.forEach.call(document.querySelectorAll("[data-pedcod]"), function (inp) {
      inp.onchange = function () { var l = lineas[Number(inp.dataset.pedcod)]; l.cod = inp.value.trim(); l.cap = undefined; redibujarLineas(); };
    });
    Array.prototype.forEach.call(document.querySelectorAll("[data-pedcap]"), function (sel) {
      sel.onchange = function () { lineas[Number(sel.dataset.pedcap)].cap = sel.value; redibujarLineas(); };
    });
    Array.prototype.forEach.call(document.querySelectorAll("[data-pedcant]"), function (inp) {
      inp.onchange = function () { lineas[Number(inp.dataset.pedcant)].cant = Number(inp.value) || 0; redibujarLineas(); };
    });
    Array.prototype.forEach.call(document.querySelectorAll("[data-pedobs]"), function (inp) {
      inp.onchange = function () { lineas[Number(inp.dataset.pedobs)].obs = inp.value; };
    });
    Array.prototype.forEach.call(document.querySelectorAll("[data-peddesc]"), function (inp) {
      inp.onchange = function () { lineas[Number(inp.dataset.peddesc)].desc = inp.value; };
    });
    Array.prototype.forEach.call(document.querySelectorAll("[data-pedprecio]"), function (inp) {
      inp.onchange = function () { lineas[Number(inp.dataset.pedprecio)].precio = Number(inp.value) || 0; redibujarLineas(); };
    });
    Array.prototype.forEach.call(document.querySelectorAll("[data-pedund]"), function (inp) {
      inp.onchange = function () { lineas[Number(inp.dataset.pedund)].und = inp.value; };
    });
    Array.prototype.forEach.call(document.querySelectorAll("[data-pedquit]"), function (btn) {
      btn.onclick = function () { lineas.splice(Number(btn.dataset.pedquit), 1); if (!lineas.length) lineas.push({ cod: "", cant: 0, obs: "" }); redibujarLineas(); };
    });
  }

  redibujarLineas();

  document.getElementById("pedAddRow").onclick = function () {
    lineas.push({ cod: "", cant: 0, obs: "" });
    redibujarLineas();
  };

  document.getElementById("pedAddExtra").onclick = function () {
    var prefix = tipoSel.value === "adicional" ? "AD_" : "OS_";
    var maxN = 0;
    lineas.forEach(function (l) {
      if (l.cod && l.cod.indexOf(prefix) === 0) {
        var n = Number(l.cod.slice(prefix.length)) || 0;
        if (n > maxN) maxN = n;
      }
    });
    var ns = String(maxN + 1); while (ns.length < 3) ns = "0" + ns;
    lineas.push({ cod: prefix + ns, cant: 0, obs: "", desc: "", precio: 0, und: "UND" });
    redibujarLineas();
  };

  document.getElementById("pedRegistrar").onclick = function () {
    var itemsVal = lineas.filter(function (l) { return l.cod && l.cant > 0; });
    if (!itemsVal.length) { avisoError("Agrega al menos un ítem con código y cantidad."); return; }
    var tipo = tipoSel.value;

    if (tipo === "obra" || tipo === "provisional") {
      /* Obra y provisional no pueden pedir más de lo que queda en la bolsa */
      var warn = bolsaExcedidos(b, itemsVal);
      if (warn.length) { avisoError("No se registró: estos ítems superan lo disponible en la bolsa. " + warn.join(" · ")); return; }
    }

    var items = itemsVal.map(function (l) {
      var base = { cod: l.cod, cant: l.cant, obs: l.obs || "" };
      if (l.cod.indexOf("AD_") === 0 || l.cod.indexOf("OS_") === 0) {
        base.desc = l.desc || "";
        base.precio = l.precio || 0;
        base.und = l.und || "UND";
      } else {
        base.cap = l.cap || "";
      }
      return base;
    });

    var pedNum = Number(document.getElementById("ped-num").value) || num;
    if (!b.pedidos) b.pedidos = [];
    b.pedidos.push({
      num: pedNum,
      fecha: document.getElementById("ped-fecha").value,
      solicitante: document.getElementById("ped-sol").value.trim(),
      tipo: tipo,
      telefono: document.getElementById("ped-tel").value.trim(),
      destino: document.getElementById("ped-dest").value.trim(),
      items: items
    });
    Bolsas.guardar(b);
    avisoOk("Pedido #" + pedNum + " registrado.");
    if (confirm("¿Imprimir formato del pedido #" + pedNum + "?")) {
      imprimirPedido(b, pedNum);
    }
    ir({ bolsaPaso: "historial" });
  };
}

/* ---- 5. Historial ---- */

function renderBolsaHistorial(b) {
  var qh = (vista.filtBolsaHist || "").toLowerCase();
  var filas = "";
  var prevNum = -1;
  var edIdx = vista.bolsaEditPed, draft = vista.bolsaEditDraft;
  if (edIdx !== undefined && edIdx !== null && (!draft || !b.pedidos[edIdx] || vista.bolsaEditBolsa !== b.id)) {
    edIdx = null; vista.bolsaEditPed = null; vista.bolsaEditDraft = null;
  }
  var tipos = [["obra", "Obra"], ["provisional", "Provisional"], ["omision", "Omisión"], ["adicional", "Adicional"]];
  var mini = 'style="font-size:11px;padding:2px 8px"';
  (b.pedidos || []).forEach(function (ped, pi) {
    /* Pedido en edición: se dibuja el borrador con campos editables */
    if (pi === edIdx) { filas += _filasPedidoEdicion(b, draft, tipos, mini); return; }

    var pedTieneMatch = false;
    if (!qh) pedTieneMatch = true;
    else {
      (ped.items || []).forEach(function (li) {
        if ((li.cod || "").toLowerCase().indexOf(qh) >= 0 || (ped.solicitante || "").toLowerCase().indexOf(qh) >= 0) pedTieneMatch = true;
      });
    }
    if (!pedTieneMatch) return;

    if (ped.num !== prevNum) {
      prevNum = ped.num;
      filas += '<tr style="background:var(--bg2)">' +
        '<td colspan="8" style="font-weight:600;padding:8px 6px">' +
          'Pedido #' + ped.num + ' — ' + esc(ped.fecha) + ' — ' + esc(ped.tipo || "obra") +
          (ped.solicitante ? ' — ' + esc(ped.solicitante) : '') +
        '</td>' +
        '<td colspan="3" style="text-align:right;padding:8px 6px;white-space:nowrap">' +
          '<button class="btn" data-imprimir="' + ped.num + '" ' + mini + '>Imprimir</button> ' +
          '<button class="btn" data-expexcel="' + ped.num + '" ' + mini + '>Excel</button> ' +
          '<button class="btn" data-editped="' + pi + '" ' + mini + '>Editar</button> ' +
          '<button class="btn" data-delped="' + pi + '" style="font-size:11px;padding:2px 8px;color:#c00">Eliminar</button>' +
        '</td>' +
      '</tr>';
    }

    (ped.items || []).forEach(function (li) {
      if (qh && (li.cod || "").toLowerCase().indexOf(qh) < 0 && (ped.solicitante || "").toLowerCase().indexOf(qh) < 0) return;
      var esExtra = li.cod && (li.cod.indexOf("AD_") === 0 || li.cod.indexOf("OS_") === 0);
      var it = esExtra ? null : bolsaItemPorCod(b, li.cod, li.cap);
      var desc = esExtra ? (li.desc || li.cod) : (it ? it.desc : "—");
      var precio = esExtra ? (li.precio || 0) : (it ? it.precio : 0);
      filas += '<tr>' +
        '<td class="m">' + ped.num + '</td>' +
        '<td class="m">' + esc(ped.fecha) + '</td>' +
        '<td>' + esc(ped.solicitante) + '</td>' +
        '<td class="m">' + esc(li.cod) + (esExtra ? ' <span style="color:#e65100;font-size:10px">' + ped.tipo.toUpperCase().slice(0,3) + '</span>' : '') + '</td>' +
        '<td style="font-size:11px">' + esc(esExtra ? "" : bolsaCapDeLinea(b, li)) + '</td>' +
        '<td style="font-size:12px">' + esc(desc) + '</td>' +
        '<td class="num">' + fmt(li.cant) + '</td>' +
        '<td class="num">' + cop(precio) + '</td>' +
        '<td class="num">' + cop((li.cant || 0) * precio) + '</td>' +
        '<td class="m">' + esc(ped.tipo || "") + '</td>' +
        '<td style="font-size:11px">' + esc(li.obs || "") + '</td>' +
      '</tr>';
    });
  });

  if (!filas) filas = '<tr><td colspan="11" style="text-align:center;color:var(--ink3);padding:20px">Sin pedidos registrados.</td></tr>';

  app.innerHTML = barraTop("bolsas") +
    '<header class="top"><div class="wrap topin"><div>' +
      '<div class="brand">Bolsa</div>' +
      '<h1 class="d h1">' + esc(b.nombre || "Sin nombre") + ' — Historial</h1>' +
    '</div></div></header>' +
    '<main class="wrap main">' +
    barraBolsa(b, "historial") +
    '<div class="card"><div class="chd"><span class="ct">Historial de pedidos</span>' +
      '<span class="cn">' + (b.pedidos || []).length + ' pedidos</span></div><div class="cbd">' +
      '<input class="in infiltro" id="filtBolsaHist" placeholder="Filtrar por código o solicitante" value="' + esc(vista.filtBolsaHist || "") + '">' +
      '<div class="scroll" style="margin-top:10px"><table class="tbl"><thead><tr>' +
        '<th style="width:40px">#</th><th style="width:90px">Fecha</th><th>Solicitante</th>' +
        '<th style="width:80px">Código</th><th style="width:120px">Capítulo</th><th>Descripción</th>' +
        '<th style="width:60px" class="num">Cant.</th><th style="width:80px" class="num">Precio</th>' +
        '<th style="width:90px" class="num">Subtotal</th><th style="width:70px">Tipo</th>' +
        '<th>Obs.</th>' +
      '</tr></thead><tbody>' + filas + '</tbody></table></div>' +
    '</div></div></main>';

  enlazarTop(); enlazarBarraBolsa(b);

  Array.prototype.forEach.call(document.querySelectorAll("[data-imprimir]"), function (btn) {
    btn.onclick = function () { imprimirPedido(b, Number(btn.dataset.imprimir)); };
  });
  Array.prototype.forEach.call(document.querySelectorAll("[data-expexcel]"), function (btn) {
    btn.onclick = function () { exportarPedidoExcel(b, Number(btn.dataset.expexcel)); };
  });
  _enlazarEdicionPedidos(b);

  var fh = document.getElementById("filtBolsaHist");
  if (fh) fh.oninput = function () {
    vista.filtBolsaHist = this.value;
    var pos = this.selectionStart, y = window.scrollY;
    render(); window.scrollTo(0, y);
    var n = document.getElementById("filtBolsaHist");
    if (n) { n.focus(); n.setSelectionRange(pos, pos); }
  };
}

/* ---- 5b. Editar / eliminar pedidos desde el Historial ---- */

function _filasPedidoEdicion(b, d, tipos, mini) {
  var inp = function (k, v, extra) { return '<input class="in" data-edped="' + k + '" value="' + esc(v == null ? "" : v) + '"' + (extra || "") + '>'; };
  var html = '<tr style="background:#fff8e1">' +
    '<td colspan="8" style="padding:8px 6px"><div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">' +
      '<b>Editando pedido #' + d.num + '</b>' +
      inp("fecha", d.fecha, ' type="date" style="width:150px"') +
      inp("solicitante", d.solicitante, ' placeholder="Solicitante" style="width:180px"') +
      '<select class="in" data-edped="tipo" style="width:140px">' + tipos.map(function (t) {
        return '<option value="' + t[0] + '"' + ((d.tipo || "obra") === t[0] ? " selected" : "") + '>' + t[1] + '</option>';
      }).join("") + '</select>' +
    '</div></td>' +
    '<td colspan="3" style="text-align:right;padding:8px 6px;white-space:nowrap">' +
      '<button class="btn btnp" id="edPedGuardar" ' + mini + '>Guardar</button> ' +
      '<button class="btn" id="edPedCancelar" ' + mini + '>Cancelar</button>' +
    '</td></tr>';
  var topado = d.tipo === "obra" || d.tipo === "provisional";
  (d.items || []).forEach(function (li, i) {
    var esExtra = li.cod && (li.cod.indexOf("AD_") === 0 || li.cod.indexOf("OS_") === 0);
    var opciones = esExtra ? [] : bolsaItemsPorCod(b, li.cod);
    var it = esExtra ? null : bolsaItemPorCod(b, li.cod, li.cap);
    var precio = esExtra ? (li.precio || 0) : (it ? it.precio : 0);
    var celCap = esExtra || !opciones.length ? esc(li.cap || "") :
      '<select class="in" data-edli="' + i + '|cap" style="font-size:12px">' + opciones.map(function (o) {
        var c = o.capitulo || "";
        return '<option value="' + esc(c) + '"' + (c === li.cap ? " selected" : "") + '>' + esc(c || "Sin capítulo") +
          ' (disp. ' + fmt(bolsaDisponible(b, li.cod, c)) + ')</option>';
      }).join("") + '</select>';
    html += '<tr style="background:#fffdf5">' +
      '<td class="m">' + d.num + '</td><td></td><td></td>' +
      '<td class="m">' + esc(li.cod) + '</td>' +
      '<td>' + celCap + '</td>' +
      '<td style="font-size:12px">' + (esExtra ? '<input class="in" data-edli="' + i + '|desc" value="' + esc(li.desc || "") + '">' : esc(it ? it.desc : "—")) + '</td>' +
      '<td><input class="in m" type="number" min="0" step="any" data-edli="' + i + '|cant" value="' + (li.cant || 0) + '" style="width:80px;text-align:right"></td>' +
      '<td class="num">' + (esExtra ? '<input class="in m" type="number" min="0" data-edli="' + i + '|precio" value="' + (li.precio || 0) + '" style="width:90px;text-align:right">' : cop(precio)) + '</td>' +
      '<td class="num">' + cop((li.cant || 0) * precio) + '</td>' +
      '<td class="m" style="font-size:11px">' + (topado && !esExtra ? 'resta' : 'no resta') + '</td>' +
      '<td style="white-space:nowrap"><input class="in" data-edli="' + i + '|obs" value="' + esc(li.obs || "") + '" style="width:90px">' +
        '<button class="btnx" data-edquita="' + i + '" title="Quitar línea" style="color:#c00;margin-left:4px">&times;</button></td>' +
    '</tr>';
  });
  return html;
}

function _enlazarEdicionPedidos(b) {
  var reRender = function () { var y = window.scrollY; render(); window.scrollTo(0, y); };

  Array.prototype.forEach.call(document.querySelectorAll("[data-editped]"), function (btn) {
    btn.onclick = function () {
      var pi = Number(btn.dataset.editped), ped = b.pedidos[pi];
      if (!ped) return;
      var d = JSON.parse(JSON.stringify(ped));
      /* Las líneas antiguas sin capítulo quedan fijadas en el que hoy les toca */
      (d.items || []).forEach(function (li) {
        var esExtra = li.cod && (li.cod.indexOf("AD_") === 0 || li.cod.indexOf("OS_") === 0);
        if (!esExtra && (li.cap === undefined || li.cap === null)) li.cap = bolsaCapDeLinea(b, li);
      });
      vista.bolsaEditPed = pi; vista.bolsaEditDraft = d; vista.bolsaEditBolsa = b.id;
      reRender();
    };
  });

  /* Eliminar con doble verificación */
  Array.prototype.forEach.call(document.querySelectorAll("[data-delped]"), function (btn) {
    btn.onclick = function () {
      var pi = Number(btn.dataset.delped), ped = b.pedidos[pi];
      if (!ped) return;
      if (!confirm("¿Eliminar el pedido #" + ped.num + "?\nSus cantidades vuelven a quedar disponibles en la bolsa.")) return;
      var r = prompt("Esta acción no se puede deshacer.\nEscribe el número del pedido (" + ped.num + ") para confirmar:");
      if (r === null || String(r).trim() !== String(ped.num)) { avisoError("No se eliminó el pedido #" + ped.num + "."); return; }
      b.pedidos.splice(pi, 1);
      vista.bolsaEditPed = null; vista.bolsaEditDraft = null;
      Bolsas.guardar(b);
      avisoOk("Pedido #" + ped.num + " eliminado.");
      reRender();
    };
  });

  var d = vista.bolsaEditDraft;
  if (vista.bolsaEditPed === null || vista.bolsaEditPed === undefined || !d) return;

  Array.prototype.forEach.call(document.querySelectorAll("[data-edped]"), function (el) {
    el.onchange = function () { d[el.dataset.edped] = el.value; if (el.dataset.edped === "tipo") reRender(); };
  });
  Array.prototype.forEach.call(document.querySelectorAll("[data-edli]"), function (el) {
    el.onchange = function () {
      var p = el.dataset.edli.split("|"), li = d.items[Number(p[0])], k = p[1];
      if (!li) return;
      li[k] = (k === "cant" || k === "precio") ? (Number(el.value) || 0) : el.value;
      if (k !== "obs" && k !== "desc") reRender();
    };
  });
  Array.prototype.forEach.call(document.querySelectorAll("[data-edquita]"), function (btn) {
    btn.onclick = function () { d.items.splice(Number(btn.dataset.edquita), 1); reRender(); };
  });

  document.getElementById("edPedCancelar").onclick = function () {
    vista.bolsaEditPed = null; vista.bolsaEditDraft = null; reRender();
  };
  document.getElementById("edPedGuardar").onclick = function () {
    var pi = vista.bolsaEditPed, orig = b.pedidos[pi];
    d.items = (d.items || []).filter(function (li) { return li.cod && (li.cant || 0) > 0; });
    if (!d.items.length) { avisoError("El pedido quedó sin ítems. Si ya no sirve, usa Eliminar."); return; }
    if (d.tipo === "obra" || d.tipo === "provisional") {
      /* Lo que este pedido ya tenía vuelve a contar como disponible */
      var warn = bolsaExcedidos(b, d.items, orig.num);
      if (warn.length) { avisoError("No se guardó: estos ítems superan lo disponible en la bolsa. " + warn.join(" · ")); return; }
    }
    b.pedidos[pi] = d;
    vista.bolsaEditPed = null; vista.bolsaEditDraft = null;
    Bolsas.guardar(b);
    avisoOk("Pedido #" + d.num + " actualizado.");
    reRender();
  };
}

/* ---- 6. Resumen ---- */

function renderBolsaResumen(b) {
  var items = (b.items || []).filter(function (it) { return it.tipo === "it"; });
  var totalPedInv = 0, totalDisp = 0;
  var filas = items.map(function (it) {
    var cap = it.capitulo || "";
    var disp = bolsaDisponible(b, it.cod, cap);
    /* Si el mismo código+capítulo está repetido, lo pedido se reparte entre las filas: se muestra el total */
    var inicialCap = bolsaItemsPorCod(b, it.cod).reduce(function (s, x) { return (x.capitulo || "") === cap ? s + (x.cantTotal || 0) : s; }, 0);
    var totalPed = inicialCap - disp;
    var valorPed = totalPed * (it.precio || 0);
    totalPedInv += valorPed;
    totalDisp += disp * (it.precio || 0);
    var pct = it.cantTotal > 0 ? disp / it.cantTotal : 1;
    var estado = pct > 0.3 ? "Disponible" : pct > 0 ? "Crítico" : "Agotado";
    var color = pct > 0.3 ? "var(--ok,#2e7d32)" : pct > 0 ? "#e65100" : "#c00";
    return '<tr>' +
      '<td class="m">' + esc(it.cod) + '</td>' +
      '<td style="font-size:11px">' + esc(cap) + '</td>' +
      '<td style="font-size:12px">' + esc(it.desc) + '</td>' +
      '<td class="num">' + fmt(it.cantTotal) + '</td>' +
      '<td class="num">' + fmt(totalPed) + '</td>' +
      '<td class="num" style="font-weight:600;color:' + color + '">' + fmt(disp) + '</td>' +
      '<td class="num">' + cop(it.precio) + '</td>' +
      '<td class="num">' + cop(valorPed) + '</td>' +
      '<td style="color:' + color + ';font-weight:500">' + estado + '</td>' +
    '</tr>';
  }).join("");

  // Items adicionales/omisión (no-inventario)
  var extraRows = "";
  (b.pedidos || []).forEach(function (ped) {
    if (ped.tipo !== "adicional" && ped.tipo !== "omision") return;
    (ped.items || []).forEach(function (li) {
      var esExtra = li.cod && (li.cod.indexOf("AD_") === 0 || li.cod.indexOf("OS_") === 0);
      var it = esExtra ? null : bolsaItemPorCod(b, li.cod);
      var desc = esExtra ? (li.desc || li.cod) : (it ? it.desc : li.cod);
      var precio = esExtra ? (li.precio || 0) : (it ? it.precio : 0);
      var etiqueta = ped.tipo === "adicional" ? "ADICIONAL" : "OMISIÓN";
      var colE = ped.tipo === "adicional" ? "#1565c0" : "#e65100";
      extraRows += '<tr>' +
        '<td class="m">' + esc(li.cod) + '</td>' +
        '<td style="font-size:12px">' + esc(desc) + '</td>' +
        '<td class="num">—</td><td class="num">' + fmt(li.cant) + '</td><td class="num">—</td>' +
        '<td class="num">' + cop(precio) + '</td>' +
        '<td class="num">' + cop((li.cant || 0) * precio) + '</td>' +
        '<td style="color:' + colE + ';font-weight:500">' + etiqueta + '</td>' +
      '</tr>';
    });
  });

  var r = bolsaResumen(b);

  app.innerHTML = barraTop("bolsas") +
    '<header class="top"><div class="wrap topin"><div>' +
      '<div class="brand">Bolsa</div>' +
      '<h1 class="d h1">' + esc(b.nombre || "Sin nombre") + ' — Resumen</h1>' +
    '</div></div></header>' +
    '<main class="wrap main">' +
    barraBolsa(b, "resumen") +
    '<div class="card"><div class="cbd" style="display:flex;gap:24px;flex-wrap:wrap">' +
      '<div><div class="lbl">Items</div><div style="font-size:20px;font-weight:700">' + r.totalItems + '</div></div>' +
      '<div><div class="lbl">Pedidos</div><div style="font-size:20px;font-weight:700">' + r.pedidos + '</div></div>' +
      '<div><div class="lbl">Valor inventario</div><div style="font-size:20px;font-weight:700">' + cop(r.valorInv) + '</div></div>' +
      '<div><div class="lbl">Pedidos inv.</div><div style="font-size:20px;font-weight:700">' + cop(r.valorPedInv) + '</div></div>' +
      '<div><div class="lbl">Valor disponible</div><div style="font-size:20px;font-weight:700">' + cop(totalDisp) + '</div></div>' +
      (r.valorAdicional ? '<div><div class="lbl" style="color:#1565c0">Adicional</div><div style="font-size:20px;font-weight:700;color:#1565c0">' + cop(r.valorAdicional) + '</div></div>' : '') +
      (r.valorOmision ? '<div><div class="lbl" style="color:#e65100">Omisión</div><div style="font-size:20px;font-weight:700;color:#e65100">' + cop(r.valorOmision) + '</div></div>' : '') +
    '</div></div>' +
    '<div class="card"><div class="chd"><span class="ct">Resumen por ítem (inventario)</span></div><div class="cbd">' +
      '<div class="scroll"><table class="tbl"><thead><tr>' +
        '<th style="width:80px">Código</th><th style="width:120px">Capítulo</th><th>Descripción</th>' +
        '<th style="width:65px" class="num">Inicial</th><th style="width:65px" class="num">Pedido</th>' +
        '<th style="width:65px" class="num">Disp.</th><th style="width:90px" class="num">Precio</th>' +
        '<th style="width:100px" class="num">Vr. pedidos</th><th style="width:80px">Estado</th>' +
      '</tr></thead><tbody>' + filas + '</tbody></table></div>' +
    '</div></div>' +
    (extraRows ? '<div class="card"><div class="chd"><span class="ct">Items adicionales / omisión</span></div><div class="cbd">' +
      '<div class="scroll"><table class="tbl"><thead><tr>' +
        '<th style="width:80px">Código</th><th>Descripción</th>' +
        '<th style="width:65px" class="num">Inic.</th><th style="width:65px" class="num">Cant.</th>' +
        '<th style="width:65px" class="num">Disp.</th><th style="width:90px" class="num">Precio</th>' +
        '<th style="width:100px" class="num">Valor</th><th style="width:80px">Tipo</th>' +
      '</tr></thead><tbody>' + extraRows + '</tbody></table></div>' +
    '</div></div>' : '') +
    '</main>';

  enlazarTop(); enlazarBarraBolsa(b);
}

/* ---- Presupuesto y APUs (cruce con proyecto) ---- */

var ROLES_PRESUPUESTO = [
  { id: "apu", nombre: "APU", test: function (t) { return t === "apu" || t === "codapu" || t === "codigoapu" || t === "napu" || t === "noapu"; } },
  { id: "desc", nombre: "Descripción", test: function (t) { return t.indexOf("descripcion") === 0; } },
  { id: "und", nombre: "Unidad", test: function (t) { return t === "unidad" || t === "und" || t === "um"; } },
  { id: "cant", nombre: "Cantidad", test: function (t) { return t === "cantidad" || t === "cant"; } },
  { id: "precioUnit", nombre: "Precio unitario", test: function (t) { return t === "valorunitario" || t === "preciounitario" || t === "vlrunitario" || t === "vrunitario" || t === "vrunit"; } },
  { id: "valorTotal", nombre: "Valor total", test: function (t) { return t === "valortotal" || t === "vlrtotal" || t === "vrtotal"; } },
  /* Cuando el presupuesto viene separado: no se autodetectan por nombre, se asignan al repetirse
     la columna de precio/total (la primera es suministro, la segunda mano de obra) o a mano */
  { id: "precioSum", nombre: "Precio unitario suministro", test: function () { return false; } },
  { id: "totalSum", nombre: "Valor total suministro", test: function () { return false; } },
  { id: "precioMo", nombre: "Precio unitario mano de obra", test: function () { return false; } },
  { id: "totalMo", nombre: "Valor total mano de obra", test: function () { return false; } },
  { id: "item", nombre: "Item / Número", test: function (t) { return t === "n" || t === "no" || t === "item" || t === "numero"; } }
];

var _wbPresup = null;
var _wbPresupHojaOf = 0;
var _wbPresupHojaApu = -1;

function _cellVal(sheet, r, c) {
  var cell = sheet[XLSX.utils.encode_cell({ r: r, c: c })];
  return cell ? cell.v : null;
}

function _detectarEnHoja(sheet, roles) {
  var rng = XLSX.utils.decode_range(sheet["!ref"] || "A1");
  for (var r = rng.s.r; r <= Math.min(rng.e.r, rng.s.r + 40); r++) {
    var vistos = {};
    for (var c = rng.s.c; c <= rng.e.c; c++) {
      var v = _cellVal(sheet, r, c);
      var t = norm(v);
      if (!t) continue;
      for (var ri = 0; ri < roles.length; ri++) {
        if (vistos[roles[ri].id] === undefined && roles[ri].test(t)) { vistos[roles[ri].id] = c; break; }
      }
    }
    if (Object.keys(vistos).length >= 2) return { fila: r, mapa: vistos };
  }
  return null;
}

/* Encabezado del presupuesto + ajustes que la detección simple no cubre:
   - precio/total repetidos (suministro y mano de obra en columnas aparte)
   - columna de APU sin título: "Cód. APU" en las filas de abajo, o la columna junto a "APU12".
   det.apuComo dice cómo se encontró la columna de APU (o queda vacío si no existe). */
function _detectarPresupuesto(sheet) {
  var det = _detectarEnHoja(sheet, ROLES_PRESUPUESTO);
  if (!det) return null;
  var rng = XLSX.utils.decode_range(sheet["!ref"] || "A1");
  var m = det.mapa, hr = det.fila;
  var rol = function (id) { return ROLES_PRESUPUESTO.filter(function (r) { return r.id === id; })[0]; };
  for (var c = rng.s.c; c <= rng.e.c; c++) {
    var t = norm(_cellVal(sheet, hr, c));
    if (m.precioUnit !== undefined && c > m.precioUnit && m.precioMo === undefined && rol("precioUnit").test(t)) {
      m.precioSum = m.precioUnit; m.precioMo = c; delete m.precioUnit;
    } else if (m.valorTotal !== undefined && c > m.valorTotal && m.totalMo === undefined && rol("valorTotal").test(t)) {
      m.totalSum = m.valorTotal; m.totalMo = c; delete m.valorTotal;
    }
  }
  det.apuComo = m.apu !== undefined ? "título de la columna" : "";
  if (m.apu === undefined) {
    for (var r = hr + 1; r <= Math.min(rng.e.r, hr + 4) && m.apu === undefined; r++) {
      for (var c2 = rng.s.c; c2 <= rng.e.c; c2++) {
        var v2 = _cellVal(sheet, r, c2);
        if (rol("apu").test(norm(v2))) { m.apu = c2; det.apuComo = "título «" + String(v2).trim() + "» debajo del encabezado"; break; }
      }
    }
  }
  if (m.apu === undefined) {
    var hits = {}, hasta = Math.min(rng.e.r, hr + 60);
    for (var r2 = hr + 1; r2 <= hasta; r2++) {
      for (var c3 = rng.s.c; c3 <= rng.e.c; c3++) {
        if (/^APU\d+$/i.test(String(_cellVal(sheet, r2, c3) || "").trim())) hits[c3] = (hits[c3] || 0) + 1;
      }
    }
    Object.keys(hits).forEach(function (k) {
      if (m.apu !== undefined || hits[k] < 3) return;
      var col = Number(k), nums = 0;
      for (var r3 = hr + 1; r3 <= hasta; r3++) {
        if (/^APU\d+$/i.test(String(_cellVal(sheet, r3, col) || "").trim()) && typeof _cellVal(sheet, r3, col + 1) === "number") nums++;
      }
      /* El número del APU suele ir en la columna siguiente; si no, se toma del texto "APU12" */
      if (nums >= hits[k] / 2) { m.apu = col + 1; det.apuComo = "números junto a la columna «APU…» (col " + XLSX.utils.encode_col(col) + ")"; }
      else { m.apu = col; det.apuComo = "textos «APU…»"; }
    });
  }
  return det;
}

function _numApu(v) {
  if (typeof v === "number") return v || 0;
  var mm = /APU\s*(\d+)/i.exec(String(v || ""));
  return mm ? Number(mm[1]) : (Number(v) || 0);
}

function _hallarColBaseAPU(sheet) {
  var rng = XLSX.utils.decode_range(sheet["!ref"] || "A1");
  for (var r = rng.s.r; r <= Math.min(rng.e.r, rng.s.r + 100); r++) {
    for (var c = rng.s.c; c <= rng.e.c; c++) {
      var v = _cellVal(sheet, r, c);
      if (v != null) {
        var s = String(v).trim();
        if (s.indexOf("ITEM") >= 0 && s.indexOf(":") >= 0) return c;
      }
    }
  }
  return -1;
}

function _htmlMapeoPresupuesto() {
  if (!_wbPresup) return "";
  var wb = _wbPresup;
  var optsHojas = wb.SheetNames.map(function (n, i) {
    return '<option value="' + i + '"' + (i === _wbPresupHojaOf ? " selected" : "") + '>' + esc(n) + '</option>';
  }).join("");
  var optsApu = '<option value="-1">— No importar APUs —</option>' +
    wb.SheetNames.map(function (n, i) {
      return '<option value="' + i + '"' + (i === _wbPresupHojaApu ? " selected" : "") + '>' + esc(n) + '</option>';
    }).join("");

  var sheet = wb.Sheets[wb.SheetNames[_wbPresupHojaOf]];
  var det = sheet ? _detectarPresupuesto(sheet) : null;
  var columnas = [];
  if (sheet) {
    var rng = XLSX.utils.decode_range(sheet["!ref"] || "A1");
    var hr = det ? det.fila : 0;
    for (var c = rng.s.c; c <= rng.e.c; c++) {
      var v = _cellVal(sheet, hr, c);
      var nombre = v != null ? String(v).trim().replace(/\s+/g, " ") : "";
      /* Ejemplo del primer dato: distingue columnas repetidas o sin título */
      var ej = "";
      for (var r = hr + 1; r <= Math.min(rng.e.r, hr + 30) && !ej; r++) {
        var dv = _cellVal(sheet, r, c);
        if (dv !== null && String(dv).trim() !== "") ej = typeof dv === "number" ? dec(Math.round(dv * 100) / 100) : String(dv).trim().slice(0, 30);
      }
      if (!nombre && !ej) continue;
      var rol = null;
      if (det) Object.keys(det.mapa).forEach(function (k) { if (det.mapa[k] === c) rol = k; });
      columnas.push({ i: c, nombre: (nombre || "(sin título)") + " · col " + XLSX.utils.encode_col(c), ej: ej, rol: rol });
    }
  }
  var avisoApu = !sheet ? "" : (det && det.mapa.apu !== undefined
    ? '<div class="ok" style="margin-top:10px">Columna APU: <b>col ' + XLSX.utils.encode_col(det.mapa.apu) + '</b> (' + esc(det.apuComo) + ')</div>'
    : '<div class="err" style="margin-top:10px"><b>No existe columna APU en esta hoja.</b> Las filas con cantidad se importan como ítems sin análisis. ' +
      'Si alguna columna trae el número de APU, asígnala como «APU» en la tabla.</div>');

  var opciones = function (rolActual) {
    var o = '<option value=""' + (rolActual ? "" : " selected") + '>No usar</option>';
    ROLES_PRESUPUESTO.forEach(function (r) {
      o += '<option value="' + r.id + '"' + (rolActual === r.id ? " selected" : "") + '>' + esc(r.nombre) + '</option>';
    });
    return o;
  };
  var filasTbl = columnas.map(function (c) {
    return '<tr' + (c.rol === "apu" ? ' style="background:#e8f5e9"' : '') + '><td class="m" style="font-size:12px">' +
      (c.rol === "apu" ? '<b>' + esc(c.nombre) + ' — APU</b>' : esc(c.nombre)) +
      (c.ej ? '<div style="color:var(--ink3);font-size:11px">ej: ' + esc(c.ej) + '</div>' : '') + '</td>' +
      '<td><select class="in" data-cpres="' + c.i + '">' + opciones(c.rol) + '</select></td></tr>';
  }).join("");

  return '<div style="margin-top:12px;padding:12px;border:1px solid var(--borde,#dde3e8);border-radius:6px;background:var(--bg2,#f7f9fb)">' +
    '<div class="lbl" style="font-weight:700;margin-bottom:8px">Mapeo del archivo cargado</div>' +
    '<div class="g" style="grid-template-columns:1fr 1fr;gap:10px">' +
      '<div><label class="lbl">Hoja de presupuesto</label><select class="in" id="mp-hojaOf">' + optsHojas + '</select></div>' +
      '<div><label class="lbl">Hoja de APUs</label><select class="in" id="mp-hojaApu">' + optsApu + '</select></div>' +
    '</div>' + avisoApu +
    (columnas.length
      ? '<label class="lbl" style="margin-top:10px;display:block">Columnas encontradas</label>' +
        '<div class="scroll" style="max-height:320px"><table class="tbl"><thead><tr>' +
          '<th style="width:46%">En el archivo</th><th>Corresponde a</th></tr></thead>' +
          '<tbody>' + filasTbl + '</tbody></table></div>'
      : '<div style="margin-top:8px;color:#888">No se detectaron columnas en esta hoja</div>') +
    '<div class="btnrow" style="margin-top:10px">' +
      '<button class="btn btnp" id="mp-importar">Importar con este mapeo</button>' +
      '<button class="btn" id="mp-cancelar" style="margin-left:8px">Cancelar</button>' +
    '</div></div>';
}

function _extraerPresupuesto(sheet, mapa) {
  var presupuesto = [];
  var rng = XLSX.utils.decode_range(sheet["!ref"] || "A1");
  var det = _detectarPresupuesto(sheet);
  var inicio = det ? det.fila + 1 : 1;
  var m = {};
  Object.keys(mapa).forEach(function (k) { m[k] = mapa[k]; });
  var txt = function (r, k) { var v = m[k] === undefined ? null : _cellVal(sheet, r, m[k]); return v === null ? "" : String(v).trim(); };
  var num = function (r, k) { return m[k] === undefined ? 0 : (Number(_cellVal(sheet, r, m[k])) || 0); };
  for (var r = inicio; r <= rng.e.r; r++) {
    var vApu = m.apu !== undefined ? _numApu(_cellVal(sheet, r, m.apu)) : 0;
    var vDesc = txt(r, "desc").replace(/\s+/g, " ");
    if (!vDesc) continue;
    var cant = num(r, "cant");
    /* Ítem si tiene APU o cantidad; si no tiene ninguno, es un título de capítulo */
    if (!vApu && !cant) { presupuesto.push({ tipo: "cap", desc: vDesc }); continue; }
    var pSum = num(r, "precioSum"), pMo = num(r, "precioMo");
    var tSum = num(r, "totalSum") || pSum * cant, tMo = num(r, "totalMo") || pMo * cant;
    var pUnit = num(r, "precioUnit") || (pSum + pMo);
    var it = {
      tipo: "it", item: txt(r, "item"), desc: vDesc, und: txt(r, "und"), cant: cant, apu: vApu,
      precioUnit: pUnit,
      valorTotal: num(r, "valorTotal") || (tSum + tMo) || pUnit * cant
    };
    if (m.precioSum !== undefined || m.precioMo !== undefined || m.totalSum !== undefined || m.totalMo !== undefined) {
      it.precioSum = pSum; it.precioMo = pMo; it.totalSum = tSum; it.totalMo = tMo;
    }
    presupuesto.push(it);
  }
  return presupuesto;
}

function _extraerApuExcel(sheet) {
  var apuExcel = [];
  var bc = _hallarColBaseAPU(sheet);
  if (bc < 0) return apuExcel;
  var rng = XLSX.utils.decode_range(sheet["!ref"] || "A1");
  var r2 = rng.s.r;
  while (r2 <= rng.e.r) {
    var vk = _cellVal(sheet, r2, bc);
    var sk = vk != null ? String(vk).trim() : "";
    if (sk.indexOf("ITEM") < 0 || sk.indexOf(":") < 0) { r2++; continue; }
    r2++;
    if (r2 > rng.e.r) break;
    var sv = function (r, c) { var v = _cellVal(sheet, r, c); return v != null ? String(v).trim() : ""; };
    var nv = function (r, c) { return Number(_cellVal(sheet, r, c)) || 0; };
    var apuObj = {
      apu: Number(_cellVal(sheet, r2, bc)) || 0,
      desc: sv(r2, bc + 1), und: sv(r2, bc + 2), cant: nv(r2, bc + 3),
      insumos: [], lineas: [], transporte: 0, herramienta: 0, directo: 0
    };
    /* Columnas de valores: se ubican por el encabezado de insumos; si no está, el orden usual */
    var col = { unit: bc + 4, desp: bc + 5, total: bc + 6 };
    var sec = "mat";
    r2++;
    while (r2 <= rng.e.r) {
      var si3 = sv(r2, bc), d1 = sv(r2, bc + 1);
      if (si3.indexOf("ITEM") >= 0 && si3.indexOf(":") >= 0) break;
      var n0 = norm(si3), n1 = norm(d1);
      if (n0.indexOf("codigo") === 0) {
        for (var cc = bc + 3; cc <= bc + 8; cc++) {
          var th = norm(_cellVal(sheet, r2, cc));
          if (th === "vrunit" || th === "vrunitario" || th === "preciounit" || th === "preciounitario") col.unit = cc;
          else if (th.indexOf("desp") === 0) col.desp = cc;
          else if (th === "vrtotal" || th === "valortotal" || th === "preciototal") col.total = cc;
        }
        r2++; continue;
      }
      /* Secciones: I. materiales, II. herramientas y transporte, III. mano de obra */
      if (!si3 && /^i{1,3}\b/i.test(d1.replace(/[.\s·]+/g, " ").trim())) {
        if (n1.indexOf("mano") >= 0) sec = "mo";
        else if (n1.indexOf("herram") >= 0 || n1.indexOf("transp") >= 0) sec = "th";
        else sec = "mat";
        r2++; continue;
      }
      var etiq = norm(sv(r2, col.unit) || d1);
      if (!si3 && etiq === "costodirecto") { apuObj.directo = nv(r2, col.total); r2++; continue; }
      if (!si3 || si3 === "-") { r2++; continue; }
      if (sec === "th") {
        if (si3.toUpperCase() === "TR1") apuObj.transporte = nv(r2, col.total);
        else if (si3.toUpperCase() === "HER1") apuObj.herramienta = nv(r2, col.total);
        r2++; continue;
      }
      var cantVal = nv(r2, bc + 3);
      if (cantVal > 0) {
        var desp = nv(r2, col.desp);
        apuObj.insumos.push({ cod: si3, desc: d1, und: sv(r2, bc + 2), cant: cantVal });
        apuObj.lineas.push({
          cod: si3, desc: d1, und: sv(r2, bc + 2), cant: cantVal,
          desp: desp > 0 && desp < 1 ? desp * 100 : desp,
          precio: nv(r2, col.unit), total: nv(r2, col.total), mo: sec === "mo"
        });
      }
      r2++;
    }
    if (apuObj.apu > 0 && apuObj.insumos.length) apuExcel.push(apuObj);
  }
  return apuExcel;
}

function importarPresupuestoConMapeo(b) {
  if (!_wbPresup) return;
  var wb = _wbPresup;
  var mapa = {};
  Array.prototype.forEach.call(document.querySelectorAll("[data-cpres]"), function (x) {
    if (x.value) mapa[x.value] = Number(x.dataset.cpres);
  });
  var sheetOf = wb.Sheets[wb.SheetNames[_wbPresupHojaOf]];
  var presupuesto = sheetOf ? _extraerPresupuesto(sheetOf, mapa) : [];
  var apuExcel = [];
  if (_wbPresupHojaApu >= 0) {
    var sheetApu = wb.Sheets[wb.SheetNames[_wbPresupHojaApu]];
    if (sheetApu) apuExcel = _extraerApuExcel(sheetApu);
  }
  b.presupuesto = presupuesto;
  b.apuExcel = apuExcel;
  Bolsas.guardar(b);
  _wbPresup = null;
  var nItems = presupuesto.filter(function (x) { return x.tipo === "it"; }).length;
  avisoOk("Presupuesto importado: " + nItems + " ítems, " + apuExcel.length + " APUs.");
  render();
}

function importarInventarioDesdeProyecto(b) {
  var p = b.proyectoId ? Store.leer(b.proyectoId) : null;
  if (!p || !p.datosApu) return 0;
  var cat = Catalogo.leer();
  if (!cat || !cat.comp) return 0;

  var capPorApu = {};
  (p.hojas || []).forEach(function (h) {
    if (!h.usar) return;
    var capActual = "Sin capítulo";
    (h.filas || []).forEach(function (f) {
      if (f.tipo === "cap") { capActual = f.desc || f.item || "Sin capítulo"; return; }
      if (f.tipo === "it" && f.apu && !capPorApu[f.apu]) capPorApu[f.apu] = capActual;
    });
  });

  var existentes = {};
  (b.items || []).forEach(function (it) {
    if (it.tipo === "it" && it.cod) existentes[it.cod + "|" + (it.capitulo || "")] = true;
  });

  var acum = {};
  analisisDe(p).forEach(function (a) {
    var datos = (p.datosApu && p.datosApu[a.apu]) || {};
    var comp = componerAnalisis(cat, datos, p, a.apu);
    var cantAnexo = a.items.reduce(function (t, x) { return t + (Number(x.cant) || 0); }, 0);
    var cap = capPorApu[a.apu] || "Sin capítulo";
    comp.lineas.forEach(function (l) {
      if (!l.cod) return;
      var clave = l.cod + "|" + cap;
      if (existentes[clave]) return;
      if (!acum[clave]) {
        var ins = insumoDe(cat, l.cod, p);
        var of = ofertaDe(ins, p);
        acum[clave] = {
          cod: l.cod, desc: l.desc || "", und: l.und || "",
          cantTotal: 0, precio: ins ? (Number(ins.precio) || 0) : 0, capitulo: cap,
          codAuranet: of && of.codAur ? String(of.codAur).trim() : ""
        };
      }
      acum[clave].cantTotal += l.cant * cantAnexo;
    });
  });

  if (!b.items) b.items = [];
  var nuevos = 0;
  Object.keys(acum).forEach(function (k) {
    var a = acum[k];
    b.items.push({
      tipo: "it", cod: a.cod, desc: a.desc, und: a.und,
      cantTotal: a.cantTotal, precio: a.precio, capitulo: a.capitulo, codAuranet: a.codAuranet
    });
    nuevos++;
  });
  if (nuevos) Bolsas.guardar(b);
  return nuevos;
}

/* Desde el proyecto vinculado se calcula en vivo y se guarda una copia en la bolsa (snapProyecto),
   para que Presupuesto y APUs sigan disponibles si el proyecto se borra. */
function obtenerDatosCruce(b) {
  var p = b.proyectoId ? Store.leer(b.proyectoId) : null;
  if (p && p.datosApu) {
    var cat = Catalogo.leer();
    if (cat && cat.comp) {
      var d = cruzarDesdeProyecto(b, p, cat);
      var actual = b.snapProyecto ? JSON.stringify({ presupuesto: b.snapProyecto.presupuesto, apus: b.snapProyecto.apus }) : "";
      if (actual !== JSON.stringify({ presupuesto: d.presupuesto, apus: d.apus })) {
        b.snapProyecto = { fecha: new Date().toLocaleDateString("es-CO"), nombre: p.nombre || "", presupuesto: d.presupuesto, apus: d.apus };
        Bolsas.guardar(b);
      }
      return d;
    }
  }
  if (b.proyectoId && b.snapProyecto) {
    var s = b.snapProyecto;
    return { presupuesto: s.presupuesto, apus: s.apus,
      aviso: p ? "" : "El proyecto vinculado «" + (s.nombre || "") + "» ya no existe; se muestra la última copia guardada (" + s.fecha + ")." };
  }
  if (b.apuExcel && b.apuExcel.length) return cruzarDesdeExcel(b);
  return null;
}

function _avisoCruce(datos) {
  return datos && datos.aviso ? '<div class="card"><div class="cbd"><div class="err">' + esc(datos.aviso) + '</div></div></div>' : "";
}

function cruzarDesdeProyecto(b, p, cat) {
  var bolsaCods = {};
  (b.items || []).forEach(function (it) { if (it.tipo === "it") bolsaCods[it.cod] = true; });

  var capPorApu = {};
  (p.hojas || []).forEach(function (h) {
    if (!h.usar) return;
    var capActual = "Sin capítulo";
    (h.filas || []).forEach(function (f) {
      if (f.tipo === "cap") { capActual = f.desc || f.item || "Sin capítulo"; return; }
      if (f.tipo === "it" && f.apu && !capPorApu[f.apu]) capPorApu[f.apu] = capActual;
    });
  });

  /* Precios por ítem igual que en el Armado del proyecto (ui/proyecto.js vArmado) */
  var t = totalesProyecto(p, cat);
  var sep = (p.forma || "junta") === "separada";
  var mg = p.margenes || {};
  var pA = (mg.admin || 0) / 100, pI = (mg.imprev || 0) / 100, pU = (mg.util || 0) / 100, pV = (mg.iva || 0) / 100;
  var aiuTotal = pA + pI + pU + pU * pV;
  var matItem = function (v) { return pV > 0 ? v * (1 + aiuTotal) / (1 + pV) : v * (1 + aiuTotal); };

  var presupuesto = [];
  var lastCap = "";
  (p.hojas || []).forEach(function (h) {
    if (!h.usar) return;
    var cap = "Sin capítulo";
    (h.filas || []).forEach(function (f) {
      if (f.tipo === "cap") {
        cap = f.desc || f.item || "Sin capítulo";
        if (cap !== lastCap) { presupuesto.push({ tipo: "cap", desc: cap }); lastCap = cap; }
        return;
      }
      if (f.tipo === "it" && f.apu) {
        var a = t.porApu[f.apu] || {};
        var q = p.usarCantObs && f.cantObs ? (Number(f.cantObs) || 0) : (Number(f.cant) || 0);
        var it = {
          tipo: "it", item: f.item || "", desc: f.desc || "",
          und: f.und || "", cant: q, apu: f.apu,
          precioUnit: a.unitario || 0, valorTotal: (a.unitario || 0) * q
        };
        if (sep) {
          it.precioSum = a.matConTh ? matItem(a.matConTh) : 0;
          it.precioMo = a.mo || 0;
          it.totalSum = it.precioSum * q; it.totalMo = it.precioMo * q;
          it.precioUnit = it.precioSum + it.precioMo; it.valorTotal = it.totalSum + it.totalMo;
        }
        presupuesto.push(it);
      }
    });
  });

  var apus = [];
  analisisDe(p).forEach(function (a) {
    var datos = (p.datosApu && p.datosApu[a.apu]) || {};
    var comp = componerAnalisis(cat, datos, p, a.apu);
    var cantAnexo = a.items.reduce(function (t, x) { return t + (Number(x.cant) || 0); }, 0);
    var tieneCoincidencia = false;
    var insumos = comp.lineas.map(function (l) {
      var enBolsa = !!bolsaCods[l.cod];
      if (enBolsa) tieneCoincidencia = true;
      return { cod: l.cod, desc: l.desc || "", und: l.und || "",
        cantUnit: l.cant, cantNec: l.cant * cantAnexo, enBolsa: enBolsa };
    });
    /* Mismos valores que "Cómo queda el análisis" en Apartados */
    var val = valorizar(cat, comp.lineas, margenesDe(p, a.apu), p);
    apus.push({
      apu: a.apu,
      desc: a.items[0] ? (a.items[0].desc || "APU " + a.apu) : "APU " + a.apu,
      und: a.items[0] ? (a.items[0].und || "") : "",
      cantAnexo: cantAnexo, cap: capPorApu[a.apu] || "Sin capítulo",
      insumos: insumos, tieneCoincidencia: tieneCoincidencia,
      lineas: val.lineas.map(function (l) {
        return { cod: l.codVer || l.cod, desc: l.desc, und: l.und, cant: l.cant, desp: l.desp,
                 precio: l.falta ? null : l.precio, total: l.falta ? null : l.total, mo: l.mo };
      }),
      mat: val.mat, transporte: val.transporte, herramienta: val.herramienta, th: val.th,
      mo: val.mo, directo: val.directo
    });
  });

  var coinPorApu = {};
  apus.forEach(function (a) {
    coinPorApu[a.apu] = a.insumos.filter(function (i) { return i.enBolsa; }).length;
  });
  presupuesto.forEach(function (x) {
    if (x.tipo === "it") x.insCoinciden = coinPorApu[x.apu] || 0;
  });

  return { presupuesto: presupuesto, apus: apus };
}

function cruzarDesdeExcel(b) {
  var bolsaCods = {};
  (b.items || []).forEach(function (it) { if (it.tipo === "it") bolsaCods[it.cod] = true; });
  var apuMap = {};
  (b.apuExcel || []).forEach(function (a) { apuMap[a.apu] = a; });

  var presupuesto = (b.presupuesto || []).map(function (x) {
    if (x.tipo !== "it") return { tipo: x.tipo, desc: x.desc };
    var apuData = apuMap[x.apu];
    var coinciden = 0;
    if (apuData) apuData.insumos.forEach(function (ins) { if (bolsaCods[ins.cod]) coinciden++; });
    return { tipo: "it", item: x.item, desc: x.desc, und: x.und, cant: x.cant,
      apu: x.apu, precioUnit: x.precioUnit, valorTotal: x.valorTotal, insCoinciden: coinciden,
      precioSum: x.precioSum, precioMo: x.precioMo, totalSum: x.totalSum, totalMo: x.totalMo };
  });

  var apus = [];
  (b.apuExcel || []).forEach(function (a) {
    var tieneCoincidencia = false;
    var cantAnexo = 0;
    (b.presupuesto || []).forEach(function (x) { if (x.tipo === "it" && x.apu === a.apu) cantAnexo += (x.cant || 0); });
    var insumos = a.insumos.map(function (ins) {
      var enBolsa = !!bolsaCods[ins.cod];
      if (enBolsa) tieneCoincidencia = true;
      return { cod: ins.cod, desc: ins.desc, und: ins.und,
        cantUnit: ins.cant, cantNec: ins.cant * cantAnexo, enBolsa: enBolsa };
    });
    var cap = "Sin capítulo";
    for (var pi = 0; pi < (b.presupuesto || []).length; pi++) {
      if (b.presupuesto[pi].tipo === "cap") cap = b.presupuesto[pi].desc;
      if (b.presupuesto[pi].tipo === "it" && b.presupuesto[pi].apu === a.apu) break;
    }
    /* APUs importados antes de leer valores: solo traen cantidades */
    var lineas = a.lineas || a.insumos.map(function (ins) {
      return { cod: ins.cod, desc: ins.desc, und: ins.und, cant: ins.cant, desp: 0, precio: null, total: null, mo: false };
    });
    var mat = 0, mo = 0;
    lineas.forEach(function (l) { if (l.mo) mo += (l.total || 0); else mat += (l.total || 0); });
    var transp = a.transporte || 0, herr = a.herramienta || 0;
    apus.push({ apu: a.apu, desc: a.desc, und: a.und,
      cantAnexo: cantAnexo || a.cant || 0, cap: cap, insumos: insumos, tieneCoincidencia: tieneCoincidencia,
      sinValores: !a.lineas, lineas: lineas,
      mat: mat, transporte: transp, herramienta: herr, th: transp + herr, mo: mo,
      directo: a.directo || (mat + transp + herr + mo) });
  });

  return { presupuesto: presupuesto, apus: apus };
}

function renderBolsaPresupuesto(b) {
  var datos = obtenerDatosCruce(b);
  var cuerpo = "";
  if (!datos) {
    cuerpo = '<div class="card"><div class="empty" style="padding:24px">' +
      '<div class="dropt">Sin datos de presupuesto</div>' +
      'Vincula un proyecto en la pestaña Ficha, o importa un Excel de presupuesto (Anexo N1 Oferta).</div></div>';
  } else {
    var capActual = "", capItems = [], grupos = [];
    datos.presupuesto.forEach(function (x) {
      if (x.tipo === "cap") {
        if (capItems.length) grupos.push({ cap: capActual, items: capItems });
        capActual = x.desc; capItems = [];
      } else { capItems.push(x); }
    });
    if (capItems.length) grupos.push({ cap: capActual || "Sin capítulo", items: capItems });

    /* Separado en suministro y mano de obra si algún ítem lo trae */
    var sep = datos.presupuesto.some(function (x) { return x.tipo === "it" && (x.precioSum !== undefined || x.precioMo !== undefined); });
    var celda = function (v) { return v ? '<td class="num">' + cop(v) + '</td>' : '<td class="num" style="color:var(--ink3)">—</td>'; };
    var suma = function (arr, k) { return arr.reduce(function (s, it) { return s + (it[k] || 0); }, 0); };
    var granTotal = 0, granSum = 0, granMo = 0;

    cuerpo = _avisoCruce(datos) + grupos.map(function (g) {
      var filas = g.items.map(function (it) {
        return '<tr>' +
          '<td class="m">' + esc(String(it.apu || "")) + '</td>' +
          '<td class="m">' + esc(it.item || "") + '</td>' +
          '<td>' + esc(it.desc) + '</td>' +
          '<td class="m">' + esc(it.und || "") + '</td>' +
          '<td class="num">' + fmt(it.cant) + '</td>' +
          (sep
            ? celda(it.precioSum) + celda(it.totalSum) + celda(it.precioMo) + celda(it.totalMo) + celda(it.valorTotal)
            : celda(it.precioUnit) + celda(it.valorTotal)) +
          '<td class="num" style="font-weight:600;color:' + (it.insCoinciden > 0 ? 'var(--ok,#2e7d32)' : 'var(--ink3)') + '">' +
            (it.insCoinciden || 0) + '</td></tr>';
      }).join("");
      var totalCap = suma(g.items, "valorTotal"), sumCap = suma(g.items, "totalSum"), moCap = suma(g.items, "totalMo");
      granTotal += totalCap; granSum += sumCap; granMo += moCap;
      return '<div class="card">' +
        '<div class="chd" style="background:var(--navy);border-radius:5px 5px 0 0">' +
          '<span class="ct" style="color:#fff">' + esc(g.cap) + '</span>' +
          '<span class="cn" style="color:#93A4B4">' + g.items.length + ' ítems' +
            (sep ? ' · Sum. ' + cop(sumCap) + ' · MO ' + cop(moCap) : '') +
            (totalCap ? ' · ' + cop(totalCap) : '') + '</span></div>' +
        '<div class="scroll"><table class="tbl"><thead><tr>' +
          '<th style="width:50px">APU</th><th style="width:70px">Item</th><th>Descripción</th>' +
          '<th style="width:50px">Und</th><th class="num" style="width:70px">Cant.</th>' +
          (sep
            ? '<th class="num" style="width:95px">Vr. unit. sum.</th><th class="num" style="width:105px">Total sum.</th>' +
              '<th class="num" style="width:95px">Vr. unit. MO</th><th class="num" style="width:105px">Total MO</th>' +
              '<th class="num" style="width:110px">Total</th>'
            : '<th class="num" style="width:100px">Precio</th><th class="num" style="width:100px">Total</th>') +
          '<th class="num" style="width:80px">Insumos</th>' +
        '</tr></thead><tbody>' + filas + '</tbody></table></div></div>';
    }).join("");
    cuerpo = '<div class="card"><div class="cbd" style="display:flex;gap:24px;flex-wrap:wrap">' +
      (sep ? '<div><div class="lbl">Suministro</div><div style="font-size:20px;font-weight:700">' + cop(granSum) + '</div></div>' +
             '<div><div class="lbl">Mano de obra</div><div style="font-size:20px;font-weight:700">' + cop(granMo) + '</div></div>' : '') +
      '<div><div class="lbl">Total presupuesto</div><div style="font-size:20px;font-weight:700">' + cop(granTotal) + '</div></div>' +
    '</div></div>' + cuerpo;
  }

  app.innerHTML = barraTop("bolsas") +
    '<header class="top"><div class="wrap topin"><div>' +
      '<div class="brand">Bolsa</div>' +
      '<h1 class="d h1">' + esc(b.nombre || "Sin nombre") + ' — Presupuesto</h1>' +
    '</div></div></header>' +
    '<main class="wrap main">' + barraBolsa(b, "presupuesto") + cuerpo + '</main>';
  enlazarTop(); enlazarBarraBolsa(b);
}

function renderBolsaApus(b) {
  var datos = obtenerDatosCruce(b);
  var cuerpo = "";
  if (!datos) {
    cuerpo = '<div class="card"><div class="empty" style="padding:24px">' +
      '<div class="dropt">Sin datos de APUs</div>' +
      'Vincula un proyecto en la pestaña Ficha, o importa un Excel de presupuesto (Anexo N1 Oferta).</div></div>';
  } else {
    var valorTotal = datos.apus.reduce(function (s, a) { return s + a.directo * (a.cantAnexo || 0); }, 0);
    var sinValores = datos.apus.some(function (a) { return a.sinValores; });
    cuerpo = _avisoCruce(datos) + '<div class="card"><div class="cbd" style="display:flex;gap:24px;flex-wrap:wrap">' +
      '<div><div class="lbl">APUs</div><div style="font-size:20px;font-weight:700">' + datos.apus.length + '</div></div>' +
      '<div><div class="lbl">Valor total (costo directo × cantidad)</div><div style="font-size:20px;font-weight:700">' + cop(valorTotal) + '</div></div>' +
    '</div>' +
    (sinValores ? '<div class="cbd"><div class="err">Estos APUs se importaron sin valores. ' +
      'Re-importa el Excel de presupuesto en la Ficha para ver desperdicio, valor unitario y totales.</div></div>' : '') +
    '</div>';

    cuerpo += datos.apus.map(function (a) {
      /* Misma tabla que "Cómo queda el análisis" en Apartados, solo lectura */
      var fila = function (l) {
        return '<tr' + (l.mo ? ' class="morow"' : '') + '>' +
          '<td class="num">' + dec(l.cant) + '</td>' +
          '<td class="m" style="font-size:12px">' + esc(l.cod) + '</td>' +
          '<td>' + esc(l.desc) + '</td>' +
          '<td style="color:var(--ink3);font-size:12px">' + esc(l.und) + '</td>' +
          '<td style="text-align:center">' + (l.desp ? dec(l.desp) + '%' : '') + '</td>' +
          '<td class="num">' + (l.precio === null ? '—' : cop(l.precio)) + '</td>' +
          '<td class="num">' + (l.total === null ? '—' : cop(l.total)) + '</td>' +
        '</tr>';
      };
      var secc = function (titulo, html) { return html ? '<tr class="seccrow"><td colspan="7">' + titulo + '</td></tr>' + html : ''; };
      var filaTH = function (cod, nombre, v) {
        return '<tr><td></td><td class="m" style="font-size:12px">' + cod + '</td><td>' + nombre + '</td>' +
          '<td></td><td></td><td></td><td class="num">' + cop(v) + '</td></tr>';
      };
      var mat = a.lineas.filter(function (l) { return !l.mo; }).map(fila).join("");
      var mo = a.lineas.filter(function (l) { return l.mo; }).map(fila).join("");
      var th = a.th > 0 ? filaTH("TR1", "Transportes", a.transporte) + filaTH("HER1", "Herramienta de mano", a.herramienta) : "";
      var dlr = function (k, v, cls) {
        return '<div class="dlr' + (cls ? ' ' + cls : '') + '"><span class="dlk">' + k + '</span><span class="dlv m">' + cop(v) + '</span></div>';
      };
      return '<details class="card">' +
        '<summary class="chd" style="cursor:pointer">' +
          '<span class="ct">APU ' + a.apu + ' — ' + esc(a.desc) + '</span>' +
          '<span class="cn">' + esc(a.cap || "") + ' · Cantidad: <strong style="color:var(--ink)">' +
            dec(a.cantAnexo) + ' ' + esc(a.und || "") + '</strong> · ' + cop(a.directo) + '</span></summary>' +
        '<div class="scroll"><table class="tbl"><thead><tr>' +
          '<th class="num" style="width:78px">Cant.</th><th style="width:104px">Código</th>' +
          '<th>Descripción</th><th style="width:52px">Und</th>' +
          '<th style="width:52px;text-align:center" title="Desperdicio">Desp.</th>' +
          '<th class="num" style="width:100px">Vr. unitario</th><th class="num" style="width:94px">Vr. total</th>' +
        '</tr></thead><tbody>' +
          secc("I · Materiales", mat) + secc("II · Transporte y herramienta", th) + secc("III · Mano de obra", mo) +
        '</tbody></table></div>' +
        '<div class="cbd" style="border-top:1px solid var(--line2)"><div class="dl">' +
          dlr("Subtotal materiales", a.mat) +
          (a.th > 0 ? dlr("Transporte y herramienta", a.th) : "") +
          dlr("Subtotal mano de obra", a.mo) +
          dlr("Costo directo", a.directo, "dltot") +
        '</div><div class="aporte">' +
          dlr("Aporte · " + dec(a.cantAnexo) + " " + esc(a.und || "") + " × " + cop(a.directo), a.directo * (a.cantAnexo || 0), "dltot") +
        '</div></div></details>';
    }).join("");
  }

  app.innerHTML = barraTop("bolsas") +
    '<header class="top"><div class="wrap topin"><div>' +
      '<div class="brand">Bolsa</div>' +
      '<h1 class="d h1">' + esc(b.nombre || "Sin nombre") + ' — APUs</h1>' +
    '</div></div></header>' +
    '<main class="wrap main">' + barraBolsa(b, "apus") + cuerpo + '</main>';
  enlazarTop(); enlazarBarraBolsa(b);
}

/* ---- 7. Formato de impresión (PDF) ---- */

function imprimirPedido(b, numPedido) {
  var ped = null;
  (b.pedidos || []).forEach(function (p) { if (p.num === numPedido) ped = p; });
  if (!ped) { avisoError("Pedido #" + numPedido + " no encontrado."); return; }

  var filas = "";
  var subtotal = 0;
  (ped.items || []).forEach(function (li, idx) {
    var esExtra = li.cod && (li.cod.indexOf("AD_") === 0 || li.cod.indexOf("OS_") === 0);
    var it = esExtra ? null : bolsaItemPorCod(b, li.cod, li.cap);
    var desc = esExtra ? (li.desc || li.cod) : (it ? it.desc : li.cod);
    var und = esExtra ? (li.und || "UND") : (it ? it.und : "");
    var precio = esExtra ? (li.precio || 0) : (it ? it.precio : 0);
    var costoT = (li.cant || 0) * precio;
    subtotal += costoT;
    var cap = esExtra ? "" : bolsaCapDeLinea(b, li);
    var aura = bolsaAuranet(b, it);
    filas += '<tr><td>' + (idx + 1) + '</td><td style="text-align:left">' + e(desc) + '</td>' +
      '<td>' + e(und) + '</td><td class="r">' + n(li.cant) + '</td>' +
      '<td class="r">' + m(precio) + '</td><td class="r">' + m(costoT) + '</td>' +
      '<td>' + e(li.obs || "") + '</td><td>' + e(cap) + '</td><td>' + e(aura) + '</td></tr>';
  });
  var padRows = 29 - (ped.items || []).length;
  for (var pr = 0; pr < padRows; pr++) filas += '<tr><td>&nbsp;</td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>';

  var iva = subtotal * 0.19;
  var total = subtotal + iva;
  var destProv = ped.tipo === "provisional" ? "X" : "";
  var destObra = ped.tipo === "obra" ? "X" : "";
  var destAdic = ped.tipo === "adicional" ? "X" : "";
  var destOmis = ped.tipo === "omision" ? "X" : "";
  var fechaEnt = "";
  if (ped.fecha) {
    var d = new Date(ped.fecha); d.setDate(d.getDate() + 15);
    fechaEnt = d.toISOString().slice(0, 10);
  }

  var nombrePdf = "Pedido_" + numPedido + "_" + (b.nombre || "bolsa").replace(/[^a-zA-Z0-9]/g, "_") + ".pdf";
  var html = '<!doctype html><html><head><meta charset="utf-8"><title>Pedido #' + numPedido + '</title>' +
    '<style>' +
    'body{font-family:Arial,sans-serif;font-size:11px;margin:20px;color:#0f2436}' +
    'table{border-collapse:collapse;width:100%}' +
    '.hdr{text-align:center;font-size:16px;font-weight:700;padding:8px;background:#0f2436;color:#fff}' +
    '.info td{padding:3px 6px;font-size:11px}' +
    '.info .l{font-weight:700;width:120px}' +
    '.tbl th{background:#0f2436;color:#fff;padding:4px;font-size:10px;font-weight:600;text-align:center}' +
    '.tbl td{border:1px solid #ccc;padding:3px 5px;font-size:10px;text-align:center}' +
    '.tbl td.r{text-align:right}' +
    '.dest span{display:inline-block;border:1px solid #333;width:14px;height:14px;text-align:center;' +
      'line-height:14px;font-size:10px;vertical-align:middle;margin-right:2px}' +
    '.tot td{font-weight:700;text-align:right;padding:3px 5px;border:1px solid #ccc;font-size:10px}' +
    '.firma{margin-top:40px;display:flex;justify-content:space-around}' +
    '.firma div{text-align:center;width:200px;border-top:1px solid #333;padding-top:4px;font-size:10px}' +
    '.barra{display:flex;gap:8px;justify-content:flex-end;margin-bottom:10px}' +
    '.barra button{font:600 12px Arial,sans-serif;padding:7px 14px;border:1px solid #0f2436;border-radius:4px;background:#fff;color:#0f2436;cursor:pointer}' +
    '.barra button.p{background:#0f2436;color:#fff}' +
    '@media print{body{margin:10mm}.barra{display:none}}' +
    '</style></head><body>' +
    '<div class="barra"><button onclick="window.print()">Imprimir</button>' +
      '<button class="p" id="btnPdf" onclick="descargarPdf()">Descargar PDF</button></div>' +
    '<div id="doc">' +
    '<table><tr><td class="hdr" colspan="9">PEDIDOS DE MATERIAL</td></tr></table>' +
    '<table class="info" style="margin-top:8px;border:1px solid #ccc"><tbody>' +
      '<tr><td class="l">CONSECUTIVO No.</td><td>' + numPedido + '</td>' +
        '<td class="l">CENTRO DE COSTO</td><td>' + e(b.centroCostos || "") + '</td></tr>' +
      '<tr><td class="l">OBRA</td><td colspan="3">' + e(b.nombre || "") + '</td></tr>' +
      '<tr><td class="l">Almacenista</td><td>' + e(ped.solicitante || "") + '</td>' +
        '<td class="l">Responsable</td><td>' + e(b.responsable || "") + '</td></tr>' +
      '<tr><td class="l">Dirección</td><td>' + e(b.direccion || "") + '</td>' +
        '<td class="l">Teléfono</td><td>' + e(ped.telefono || b.telefono || "") + '</td></tr>' +
      '<tr><td class="l">Destino</td><td colspan="3" class="dest">' +
        '<span>' + destProv + '</span> Provisional &nbsp;&nbsp;' +
        '<span>' + destObra + '</span> Obra &nbsp;&nbsp;' +
        '<span>' + destAdic + '</span> Adicional &nbsp;&nbsp;' +
        '<span>' + destOmis + '</span> Omisión</td></tr>' +
      '<tr><td class="l">Fecha pedido</td><td>' + e(ped.fecha || "") + '</td>' +
        '<td class="l">Fecha entrega</td><td>' + e(fechaEnt) + '</td></tr>' +
    '</tbody></table>' +
    '<table class="tbl" style="margin-top:10px"><thead><tr>' +
      '<th style="width:30px">ITEM</th><th>DESCRIPCIÓN</th><th style="width:50px">UND</th>' +
      '<th style="width:55px">CANT.</th><th style="width:70px">COSTO UNT.</th>' +
      '<th style="width:75px">COSTO TOTAL</th><th style="width:70px">OBS.</th>' +
      '<th style="width:120px">CAPÍTULO</th><th style="width:65px">COD. AURANET</th>' +
    '</tr></thead><tbody>' + filas + '</tbody>' +
    '<tfoot>' +
      '<tr class="tot"><td colspan="5" style="text-align:right">SUB TOTAL:</td><td>' + m(subtotal) + '</td><td colspan="3"></td></tr>' +
      '<tr class="tot"><td colspan="5" style="text-align:right">IVA 19%:</td><td>' + m(iva) + '</td><td colspan="3"></td></tr>' +
      '<tr class="tot"><td colspan="5" style="text-align:right">TOTAL:</td><td>' + m(total) + '</td><td colspan="3"></td></tr>' +
    '</tfoot></table>' +
    '<div style="margin-top:12px;border:1px solid #ccc;padding:8px;min-height:40px;font-size:10px">' +
      '<b>Notas y comentarios:</b><br>' + e(b.notas || "") + '</div>' +
    '<div class="firma">' +
      '<div>Vo.Bo. Coordinador</div><div>Firma Almacenista</div>' +
    '</div>' +
    '</div>' +
    '<script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"><\/script>' +
    '<script>function descargarPdf(){' +
      'if(!window.html2pdf){alert("El generador de PDF aún está cargando o no hay conexión. Intenta de nuevo, o usa Imprimir > Guardar como PDF.");return;}' +
      'var b=document.getElementById("btnPdf");b.disabled=true;b.textContent="Generando...";' +
      'html2pdf().set({margin:8,filename:' + JSON.stringify(nombrePdf) + ',image:{type:"jpeg",quality:0.95},' +
        'html2canvas:{scale:2},jsPDF:{unit:"mm",format:"letter",orientation:"portrait"}})' +
        '.from(document.getElementById("doc")).save().then(function(){b.disabled=false;b.textContent="Descargar PDF";});' +
    '}<\/script>' +
    '</body></html>';

  function e(s) { return String(s === null || s === undefined ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
  function n(v) { return Number(v || 0).toLocaleString("es-CO"); }
  function m(v) { return "$" + Math.round(Number(v) || 0).toLocaleString("es-CO"); }

  var w = window.open("", "_blank");
  if (w) { w.document.write(html); w.document.close(); }
  else avisoError("El navegador bloqueó la ventana emergente. Permite pop-ups para este sitio.");
}

/* ---- 8. Exportar pedido a Excel ---- */

function exportarPedidoExcel(b, numPedido) {
  var ped = null;
  (b.pedidos || []).forEach(function (p) { if (p.num === numPedido) ped = p; });
  if (!ped) { avisoError("Pedido #" + numPedido + " no encontrado."); return; }

  var NAVY = "FF0F2436", LIME = "FFA6CE39", GRIS = "FFF4F6F8";
  var moneda = '"$"#,##0';
  var wb = new ExcelJS.Workbook();
  wb.creator = "Lutec"; wb.created = new Date();
  var ws = wb.addWorksheet("Pedido", { views: [{ showGridLines: false }] });

  ws.columns = [
    { width: 5 }, { width: 35 }, { width: 8 }, { width: 10 },
    { width: 14 }, { width: 14 }, { width: 12 }, { width: 28 }, { width: 14 }
  ];

  var fillN = { type: "pattern", pattern: "solid", fgColor: { argb: NAVY } };
  var fillG = { type: "pattern", pattern: "solid", fgColor: { argb: GRIS } };
  var borde = { top: { style: "thin", color: { argb: "FFDDE3E8" } },
                bottom: { style: "thin", color: { argb: "FFDDE3E8" } },
                left: { style: "thin", color: { argb: "FFDDE3E8" } },
                right: { style: "thin", color: { argb: "FFDDE3E8" } } };
  var fW = { bold: true, color: { argb: "FFFFFFFF" }, size: 10, name: "Arial" };
  var fB = { bold: true, size: 10, name: "Arial" };
  var fN = { size: 9, name: "Arial" };

  // Header
  ws.mergeCells("A1:I1");
  var h1 = ws.getCell("A1");
  h1.value = "PEDIDOS DE MATERIAL"; h1.font = { bold: true, size: 14, color: { argb: "FFFFFFFF" }, name: "Arial" };
  h1.fill = fillN; h1.alignment = { horizontal: "center", vertical: "middle" };
  ws.getRow(1).height = 28;

  // Info block
  var info = [
    ["CONSECUTIVO No.", String(numPedido), "CENTRO DE COSTO", b.centroCostos || ""],
    ["OBRA", b.nombre || "", "", ""],
    ["Almacenista", ped.solicitante || "", "Responsable", b.responsable || ""],
    ["Dirección", b.direccion || "", "Teléfono", ped.telefono || b.telefono || ""],
    ["Destino", (ped.tipo === "provisional" ? "[X] " : "[ ] ") + "Prov. " +
               (ped.tipo === "obra" ? "[X] " : "[ ] ") + "Obra " +
               (ped.tipo === "adicional" ? "[X] " : "[ ] ") + "Adic. " +
               (ped.tipo === "omision" ? "[X] " : "[ ] ") + "Omis.", "", ""],
    ["Fecha pedido", ped.fecha || "", "Fecha entrega", ""]
  ];
  if (ped.fecha) {
    var d = new Date(ped.fecha); d.setDate(d.getDate() + 15);
    info[5][3] = d.toISOString().slice(0, 10);
  }
  for (var ri = 0; ri < info.length; ri++) {
    var row = ws.getRow(ri + 2);
    row.getCell(1).value = info[ri][0]; row.getCell(1).font = fB; row.getCell(1).fill = fillG; row.getCell(1).border = borde;
    row.getCell(2).value = info[ri][1]; row.getCell(2).font = fN; row.getCell(2).border = borde;
    if (info[ri][2]) {
      row.getCell(5).value = info[ri][2]; row.getCell(5).font = fB; row.getCell(5).fill = fillG; row.getCell(5).border = borde;
      row.getCell(6).value = info[ri][3]; row.getCell(6).font = fN; row.getCell(6).border = borde;
    }
    if (ri === 1) ws.mergeCells("B" + (ri + 2) + ":I" + (ri + 2));
    if (ri === 4) ws.mergeCells("B" + (ri + 2) + ":D" + (ri + 2));
  }

  // Table header
  var thRow = 9;
  var encabezados = ["ITEM", "DESCRIPCIÓN", "UND", "CANT.", "COSTO UNT.", "COSTO TOTAL", "OBS.", "CAPÍTULO", "COD. AURANET"];
  var hdr = ws.getRow(thRow);
  encabezados.forEach(function (t, ci) {
    var c = hdr.getCell(ci + 1);
    c.value = t; c.font = fW; c.fill = fillN; c.alignment = { horizontal: "center", vertical: "middle" }; c.border = borde;
  });
  hdr.height = 20;

  // Items
  var dataStart = thRow + 1;
  var pedItems = ped.items || [];
  var subtotalXl = 0;
  for (var ii = 0; ii < pedItems.length; ii++) {
    var li = pedItems[ii];
    var esExtra = li.cod && (li.cod.indexOf("AD_") === 0 || li.cod.indexOf("OS_") === 0);
    var it = esExtra ? null : bolsaItemPorCod(b, li.cod, li.cap);
    var desc = esExtra ? (li.desc || li.cod) : (it ? it.desc : li.cod);
    var und = esExtra ? (li.und || "UND") : (it ? it.und : "");
    var precio = esExtra ? (li.precio || 0) : (it ? it.precio : 0);
    var cap = esExtra ? "" : bolsaCapDeLinea(b, li);
    var aura = bolsaAuranet(b, it);
    var rr = ws.getRow(dataStart + ii);
    rr.getCell(1).value = ii + 1;
    rr.getCell(2).value = desc;
    rr.getCell(3).value = und;
    rr.getCell(4).value = li.cant || 0;
    rr.getCell(5).value = precio; rr.getCell(5).numFmt = moneda;
    /* Fórmula con su resultado: se ve el valor aunque el visor no recalcule */
    var totLinea = (li.cant || 0) * (precio || 0);
    subtotalXl += totLinea;
    rr.getCell(6).value = { formula: "D" + (dataStart + ii) + "*E" + (dataStart + ii), result: totLinea }; rr.getCell(6).numFmt = moneda;
    rr.getCell(7).value = li.obs || "";
    rr.getCell(8).value = cap;
    rr.getCell(9).value = aura;
    for (var cc = 1; cc <= 9; cc++) { rr.getCell(cc).font = fN; rr.getCell(cc).border = borde; }
  }

  // Pad empty rows up to 29
  var totalRows = Math.max(pedItems.length, 29);
  for (var pp = pedItems.length; pp < totalRows; pp++) {
    var er = ws.getRow(dataStart + pp);
    for (var ec = 1; ec <= 9; ec++) { er.getCell(ec).border = borde; er.getCell(ec).font = fN; }
  }

  // Totals
  var totRow = dataStart + totalRows;
  var lastData = dataStart + totalRows - 1;
  var trSub = ws.getRow(totRow);
  ws.mergeCells("A" + totRow + ":E" + totRow);
  trSub.getCell(1).value = "SUB TOTAL:"; trSub.getCell(1).font = fB; trSub.getCell(1).alignment = { horizontal: "right" };
  trSub.getCell(6).value = { formula: "SUM(F" + dataStart + ":F" + lastData + ")", result: subtotalXl }; trSub.getCell(6).numFmt = moneda; trSub.getCell(6).font = fB;
  for (var tc = 1; tc <= 9; tc++) trSub.getCell(tc).border = borde;

  var trIva = ws.getRow(totRow + 1);
  ws.mergeCells("A" + (totRow + 1) + ":E" + (totRow + 1));
  trIva.getCell(1).value = "IVA 19%:"; trIva.getCell(1).font = fB; trIva.getCell(1).alignment = { horizontal: "right" };
  trIva.getCell(6).value = { formula: "F" + totRow + "*0.19", result: subtotalXl * 0.19 }; trIva.getCell(6).numFmt = moneda; trIva.getCell(6).font = fB;
  for (var ic = 1; ic <= 9; ic++) trIva.getCell(ic).border = borde;

  var trTot = ws.getRow(totRow + 2);
  ws.mergeCells("A" + (totRow + 2) + ":E" + (totRow + 2));
  trTot.getCell(1).value = "TOTAL:"; trTot.getCell(1).font = { bold: true, size: 11, name: "Arial" }; trTot.getCell(1).alignment = { horizontal: "right" };
  trTot.getCell(6).value = { formula: "F" + totRow + "+F" + (totRow + 1), result: subtotalXl * 1.19 }; trTot.getCell(6).numFmt = moneda;
  trTot.getCell(6).font = { bold: true, size: 11, name: "Arial" }; trTot.getCell(6).fill = { type: "pattern", pattern: "solid", fgColor: { argb: LIME } };
  for (var gc = 1; gc <= 9; gc++) trTot.getCell(gc).border = borde;

  // Download
  var nombre = "Pedido_" + numPedido + "_" + (b.nombre || "bolsa").replace(/[^a-zA-Z0-9]/g, "_");
  wb.xlsx.writeBuffer().then(function (buf) {
    var blob = new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = nombre + ".xlsx";
    a.click(); URL.revokeObjectURL(a.href);
    avisoOk("Excel del pedido #" + numPedido + " descargado.");
  }).catch(function (err) {
    avisoError("Error al generar Excel: " + (err && err.message ? err.message : err));
  });
}
