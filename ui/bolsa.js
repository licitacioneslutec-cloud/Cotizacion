"use strict";

/* ------------------------------------------------------------------
   Bolsa eléctrica — insumos agrupados por capítulo del proyecto
   ------------------------------------------------------------------ */

function capituloDeItem(h) {
  var capActual = "Sin capítulo";
  var mapa = {};
  (h.filas || []).forEach(function (f, fi) {
    if (f.tipo === "cap") { capActual = f.desc || f.item || "Sin capítulo"; return; }
    if (f.tipo === "it" && f.apu) mapa[fi] = capActual;
  });
  return mapa;
}

function insumosPorCapitulo(p, cat) {
  var capPorApu = {};
  (p.hojas || []).forEach(function (h, hi) {
    if (!h.usar) return;
    var capActual = "Sin capítulo";
    (h.filas || []).forEach(function (f) {
      if (f.tipo === "cap") { capActual = f.desc || f.item || "Sin capítulo"; return; }
      if (f.tipo === "it" && f.apu) {
        if (!capPorApu[f.apu]) capPorApu[f.apu] = capActual;
      }
    });
  });

  var caps = {};
  var ordenCaps = [];
  analisisDe(p).forEach(function (a) {
    var cap = capPorApu[a.apu] || "Sin capítulo";
    var datos = (p.datosApu && p.datosApu[a.apu]) || {};
    var comp = componerAnalisis(cat, datos, p, a.apu);
    var cantAnexo = a.items.reduce(function (t, x) { return t + (Number(x.cant) || 0); }, 0);
    comp.lineas.forEach(function (l) {
      if (!caps[cap]) { caps[cap] = { uso: {}, orden: [] }; ordenCaps.push(cap); }
      var g = caps[cap];
      if (!g.uso[l.cod]) {
        g.uso[l.cod] = { cod: l.cod, desc: l.desc, und: l.und, cantidad: 0, apus: [] };
        g.orden.push(l.cod);
      }
      g.uso[l.cod].cantidad += l.cant * cantAnexo;
      if (g.uso[l.cod].apus.indexOf(a.apu) < 0) g.uso[l.cod].apus.push(a.apu);
    });
  });

  var idx = Catalogo.indice(cat);
  var result = [];
  var visto = {};
  ordenCaps.forEach(function (cap) {
    if (visto[cap]) return;
    visto[cap] = true;
    var g = caps[cap];
    var items = g.orden.map(function (c) {
      var u = g.uso[c];
      var it = insumoDe(cat, c, p);
      u.propio = !!(it && it.propio);
      u.desc = u.desc || (it ? it.desc : "");
      u.und = u.und || (it ? it.und : "");
      u.precio = it ? Number(it.precio) || 0 : 0;
      u.imp = it ? !!it.imp : false;
      u.rent = it ? (it.rent !== undefined ? !!it.rent : true) : true;
      u.ofertas = it ? (it.ofertas || []) : [];
      u.sel = it ? it.sel : undefined;
      u.mo = esManoObra(c);
      u.costoReal = costoDe({ precio: u.precio, ofertas: u.ofertas, sel: u.sel, cod: u.cod }, p);
      return u;
    });
    result.push({ cap: cap, items: items });
  });
  return result;
}

function vBolsa(p) {
  var cat = Catalogo.leer();
  if (!cat || !cat.comp)
    return '<div class="card"><div class="empty">Falta cargar el catálogo de insumos.</div></div>';

  var grupos = insumosPorCapitulo(p, cat);
  if (!grupos.length)
    return '<div class="card"><div class="empty"><div class="dropt">Todavía no hay insumos</div>' +
      'Arma algún análisis en el paso 4 y aquí aparecerán los insumos agrupados por capítulo.</div></div>';

  var mg = p.margenes || {};
  var totalItems = 0, totalSin = 0, totalMat = 0, totalMo = 0;
  grupos.forEach(function (g) {
    g.items.forEach(function (i) {
      totalItems++;
      if (i.costoReal <= 0) totalSin++;
      var v = i.cantidad * precioAjustado({ precio: i.precio, imp: i.imp, rent: i.rent, ofertas: i.ofertas, sel: i.sel, cod: i.cod }, mg, p);
      if (i.mo) totalMo += v; else totalMat += v;
    });
  });

  var q = (vista.buscaBolsa || "").toLowerCase();

  var cuerpo = grupos.map(function (g) {
    var ver = g.items;
    if (q) ver = ver.filter(function (i) {
      return i.cod.toLowerCase().indexOf(q) >= 0 || (i.desc || "").toLowerCase().indexOf(q) >= 0;
    });
    if (vista.soloSinBolsa) ver = ver.filter(function (i) { return i.costoReal <= 0; });
    if (!ver.length && q) return "";

    var rent = Number(mg.rent) || 0;
    var filas = ver.map(function (i) {
      var itRef = { precio: i.precio, imp: i.imp, rent: i.rent, ofertas: i.ofertas, sel: i.sel, cod: i.cod };
      var costo = costoDe(itRef, p);
      var venta = precioAjustado(itRef, mg, p);
      return '<tr' + (costo <= 0 ? ' class="filasinp"' : "") + '>' +
        '<td class="m" style="font-size:12px">' + esc(i.cod) + '</td>' +
        '<td>' + esc(i.desc) + (i.propio ? ' <span class="tagpropio">propio</span>' : "") + '</td>' +
        '<td style="color:var(--ink3);font-size:12px">' + esc(i.und) + '</td>' +
        '<td class="num">' + dec(i.cantidad) + '</td>' +
        '<td class="num m">' + (costo > 0 ? cop(costo) : "—") + '</td>' +
        '<td class="num m">' + (costo > 0 ? cop(venta) : "—") + '</td>' +
        '<td class="num m">' + (costo > 0 ? cop(venta * i.cantidad) : "—") + '</td>' +
      '</tr>';
    }).join("");

    var subMat = 0, subMo = 0;
    ver.forEach(function (i) {
      var v = i.cantidad * precioAjustado({ precio: i.precio, imp: i.imp, rent: i.rent, ofertas: i.ofertas, sel: i.sel, cod: i.cod }, mg, p);
      if (i.mo) subMo += v; else subMat += v;
    });

    return '<div class="card">' +
      '<div class="chd" style="background:var(--navy);border-radius:5px 5px 0 0">' +
        '<span class="ct" style="color:#fff">' + esc(g.cap) + '</span>' +
        '<span class="cn" style="color:#93A4B4">' + ver.length + ' insumos · Mat: ' + cop(subMat) + ' · MO: ' + cop(subMo) + '</span>' +
      '</div>' +
      '<div class="scroll"><table class="tbl"><thead><tr>' +
        '<th style="width:96px">Código</th><th>Descripción</th><th style="width:52px">Und</th>' +
        '<th class="num" style="width:80px">Cantidad</th>' +
        '<th class="num" style="width:100px">Costo</th>' +
        '<th class="num" style="width:100px">Venta</th>' +
        '<th class="num" style="width:104px">Vale</th>' +
      '</tr></thead><tbody>' + filas + '</tbody></table></div>' +
    '</div>';
  }).join("");

  return '<div class="card"><div class="cbd">' +
      '<div class="kpi" style="margin-bottom:13px">' +
        '<div class="kc"><div class="kk">Insumos</div><div class="kv">' + totalItems + '</div></div>' +
        '<div class="kc"><div class="kk">Sin precio</div><div class="kv">' + totalSin + '</div></div>' +
        '<div class="kc"><div class="kk">Materiales</div><div class="kv" style="font-size:15px">' + cop(totalMat) + '</div></div>' +
        '<div class="kc"><div class="kk">Mano de obra</div><div class="kv" style="font-size:15px">' + cop(totalMo) + '</div></div>' +
      '</div>' +
    '</div></div>' +
    '<div class="card"><div class="cbd" style="padding-bottom:12px">' +
      '<input class="in" id="buscabolsa" placeholder="Buscar por código o descripción" value="' +
        esc(vista.buscaBolsa || "") + '">' +
      '<label class="lbl" style="margin-top:10px"><input type="checkbox" id="solosinbolsa"' +
        (vista.soloSinBolsa ? " checked" : "") + '> Ver solo los que no tienen precio</label>' +
    '</div></div>' +
    cuerpo +
    '<div class="note"><div class="notet">Qué es la bolsa eléctrica</div>' +
    '<div class="noteb">Muestra los mismos insumos que el paso de Insumos, pero agrupados por los capítulos ' +
    'del anexo del cliente. Así puedes ver qué materiales corresponden a cada sección del proyecto.</div></div>';
}

function enlazarBolsa(p) {
  var b = document.getElementById("buscabolsa");
  if (b) b.oninput = function () {
    vista.buscaBolsa = this.value;
    var pos = this.selectionStart, y = window.scrollY;
    render(); window.scrollTo(0, y);
    var n = document.getElementById("buscabolsa");
    if (n) { n.focus(); n.setSelectionRange(pos, pos); }
  };
  var s = document.getElementById("solosinbolsa");
  if (s) s.onchange = function () { ir({ soloSinBolsa: this.checked }); };
}
