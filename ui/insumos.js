"use strict";


/* Recorre todos los análisis y junta los insumos con su cantidad total */
function insumosDe(p, cat) {
  var uso = {}, orden = [];
  analisisDe(p).forEach(function (a) {
    var datos = (p.datosApu && p.datosApu[a.apu]) || {};
    var comp = componerAnalisis(cat, datos, p, a.apu);
    var cantAnexo = a.items.reduce(function (t, x) { return t + (Number(x.cant) || 0); }, 0);
    comp.lineas.forEach(function (l) {
      if (!uso[l.cod]) {
        uso[l.cod] = { cod: l.cod, desc: l.desc, und: l.und, cantidad: 0, apus: [] };
        orden.push(l.cod);
      }
      uso[l.cod].cantidad += l.cant * cantAnexo;
      if (uso[l.cod].apus.indexOf(a.apu) < 0) uso[l.cod].apus.push(a.apu);
    });
  });
  var idx = Catalogo.indice(cat);
  return orden.map(function (c) {
    var u = uso[c];
    var it = insumoDe(cat, c, p);
    u.propio = !!(it && it.propio);
    u.desc = u.desc || (it ? it.desc : "");
    u.und = u.und || (it ? it.und : "");
    u.precio = it ? Number(it.precio) || 0 : 0;
    u.imp = it ? !!it.imp : false;
    u.desp = it ? Number(it.desp) || 0 : 0;
    u.ofertas = it ? (it.ofertas || []) : [];
    u.sel = it ? it.sel : undefined;
    u.enCat = !!it;
    u.mo = esManoObra(c);
    return u;
  });
}

function vInsumos(p) {
  var cat = Catalogo.leer();
  if (!cat || !cat.comp)
    return '<div class="card"><div class="empty">Falta cargar el catálogo de insumos.</div></div>';

  var lista = insumosDe(p, cat);
  if (!lista.length)
    return '<div class="card"><div class="empty"><div class="dropt">Todavía no hay insumos</div>' +
      'Arma algún análisis en el paso 4 y aquí aparecerán los insumos que usa este proyecto.</div></div>';

  /* El precio real puede venir de una oferta de proveedor, no solo del precio suelto */
  lista.forEach(function (i) {
    i.costoReal = costoDe({ precio: i.precio, ofertas: i.ofertas, sel: i.sel, cod: i.cod }, p);
  });

  var sin = lista.filter(function (i) { return i.costoReal <= 0; }).length;
  var q = (vista.buscaIns || "").toLowerCase();
  var ver = lista;
  if (q) ver = ver.filter(function (i) {
    return i.cod.toLowerCase().indexOf(q) >= 0 || (i.desc || "").toLowerCase().indexOf(q) >= 0;
  });
  if (vista.soloSinIns) ver = ver.filter(function (i) { return i.costoReal <= 0; });

  var mg = p.margenes || {};
  var impMat = lista.filter(function (i) { return !i.mo; });
  var impTot = impMat.length;
  var impCount = impMat.filter(function (i) { return i.imp; }).length;
  var totalMat = 0, totalMo = 0;
  lista.forEach(function (i) {
    var v = i.cantidad * precioAjustado({ precio: i.precio, imp: i.imp, ofertas: i.ofertas, sel: i.sel, cod: i.cod }, mg, p);
    if (i.mo) totalMo += v; else totalMat += v;
  });

  var rent = Number(mg.rent) || 0, ivImp = Number(mg.dolar) || 0;
  var filas = ver.map(function (i) {
    var itRef = { precio: i.precio, imp: i.imp, ofertas: i.ofertas, sel: i.sel, cod: i.cod };
    var costo = costoDe(itRef, p);
    /* precio con rentabilidad, y luego con IVA de importados si aplica */
    var conRent = costo > 0 && rent > 0 ? costo / (1 - rent / 100) : costo;
    var venta = precioAjustado(itRef, mg, p);
    var tieneOf = i.ofertas.length > 0;
    /* La celda de costo es editable: si hay proveedor elegido, edita ESE precio */
    var celCosto = '<input class="in m inprecio' + (costo > 0 ? " ok" : "") + '" type="number" min="0" step="1" ' +
      'data-iprecio="' + esc(i.cod) + '" value="' + (costo > 0 ? costo : "") + '" placeholder="sin precio">';
    return '<tr' + (costo <= 0 ? ' class="filasinp"' : "") + (i.mo ? ' data-mo="1"' : "") + '>' +
      '<td class="m" style="font-size:12px">' + esc(i.cod) + '</td>' +
      '<td>' + esc(i.desc) + (i.propio ? ' <span class="tagpropio">propio</span>' : "") + '</td>' +
      '<td style="color:var(--ink3);font-size:12px">' + esc(i.und) + '</td>' +
      '<td class="num">' + dec(i.cantidad) + '</td>' +
      '<td class="num">' + celCosto + '</td>' +
      '<td class="num">' + (costo > 0 ? cop(conRent) : "—") + '</td>' +
      '<td class="num">' + (costo > 0 ? cop(venta) : "—") + '</td>' +
      '<td>' + (tieneOf
        ? '<select class="in inprov" data-iprov="' + esc(i.cod) + '">' +
          i.ofertas.map(function (o, j) {
            var elegido = (p.proveedores && p.proveedores[i.cod] !== undefined)
              ? p.proveedores[i.cod] === j : (i.sel !== undefined ? i.sel : 0) === j;
            return '<option value="' + j + '"' + (elegido ? " selected" : "") + '>' +
              esc(o.marca || "sin marca") + (Number(o.precio) > 0 ? " · " + cop(o.precio) : " · sin precio") +
              '</option>';
          }).join("") + '</select>'
        : '<span style="color:var(--ink3);font-size:12px">sin proveedor</span>') + '</td>' +
      '<td style="text-align:center">' + (i.mo ? "" :
        '<input type="checkbox" data-iimp="' + esc(i.cod) + '"' + (i.imp ? " checked" : "") + '>') + '</td>' +
      '<td class="num">' + (costo > 0 ? cop(venta * i.cantidad) : "—") + '</td>' +
    '</tr>';
  }).join("");

  return '<div class="card"><div class="cbd">' +
      '<div class="kpi" style="margin-bottom:13px">' +
        '<div class="kc"><div class="kk">Insumos</div><div class="kv">' + lista.length + '</div></div>' +
        '<div class="kc"><div class="kk">Sin precio</div><div class="kv">' + sin + '</div></div>' +
        '<div class="kc"><div class="kk">Materiales</div><div class="kv" style="font-size:15px">' + cop(totalMat) + '</div></div>' +
        '<div class="kc"><div class="kk">Mano de obra</div><div class="kv" style="font-size:15px">' + cop(totalMo) + '</div></div>' +
      '</div>' +
      (sin ? '<div class="err">Faltan ' + sin + ' precios para poder cerrar la oferta.</div>'
           : '<div class="ok">Todos los insumos de este proyecto tienen precio.</div>') +
    '</div></div>' +

    '<div class="card">' +
      '<div class="chd"><span class="ct">Insumos de este proyecto</span>' +
      '<span class="cn">' + ver.length + ' de ' + lista.length + '</span></div>' +
      '<div class="cbd" style="padding-bottom:12px">' +
        '<input class="in" id="buscains" placeholder="Buscar por código o descripción" value="' +
          esc(vista.buscaIns || "") + '">' +
        '<label class="lbl" style="margin-top:10px"><input type="checkbox" id="solosinins"' +
          (vista.soloSinIns ? " checked" : "") + '> Ver solo los que no tienen precio</label>' +
        '<div class="btnrow" style="margin-top:11px">' +
          '<button class="btn btnmini" id="impall">Marcar todos como importados</button>' +
          '<button class="btn btnmini" id="impnone">Quitar importado a todos</button>' +
          '<span class="pctnota" style="min-width:0">' + impCount + ' de ' + impTot + ' marcados</span>' +
        '</div>' +
      '</div>' +
      '<div class="scroll"><table class="tbl"><thead><tr>' +
        '<th style="width:96px">Código</th><th>Descripción</th><th style="width:52px">Und</th>' +
        '<th class="num" style="width:88px">Cantidad</th>' +
        '<th class="num" style="width:100px" title="Precio de compra">Costo</th>' +
        '<th class="num" style="width:100px" title="Costo con rentabilidad">+ Rent.</th>' +
        '<th class="num" style="width:100px" title="Con rentabilidad e IVA de importados">Venta</th>' +
        '<th style="width:150px">Proveedor</th>' +
        '<th style="width:40px;text-align:center" title="Importado">Imp.</th>' +
        '<th class="num" style="width:104px">Vale</th>' +
      '</tr></thead><tbody>' +
        filas + '</tbody></table></div>' +
    '</div>' +

    '<div class="note"><div class="notet">Qué muestra la cantidad</div>' +
    '<div class="noteb">Es cuánto se necesita de ese insumo en todo el proyecto: la incidencia de cada ' +
    'análisis multiplicada por las cantidades del anexo del cliente. Sirve tanto para pedir precios ' +
    'como para saber qué comprar.</div></div>';
}

function enlazarInsumos(p) {
  var b = document.getElementById("buscains");
  if (b) b.oninput = function () {
    vista.buscaIns = this.value;
    var pos = this.selectionStart, y = window.scrollY;
    render(); window.scrollTo(0, y);
    var n = document.getElementById("buscains");
    if (n) { n.focus(); n.setSelectionRange(pos, pos); }
  };
  var s = document.getElementById("solosinins");
  if (s) s.onchange = function () { ir({ soloSinIns: this.checked }); };

  var marcarImp = function (valor) {
    var cat = Catalogo.leer();
    var idx = Catalogo.indice(cat);
    var lista = insumosDe(p, cat);
    var n = 0;
    lista.forEach(function (i) {
      if (i.mo) return;  /* la mano de obra no lleva IVA de importados */
      if (p.propios && p.propios[i.cod]) {
        if (!!p.propios[i.cod].imp !== valor) { p.propios[i.cod].imp = valor; n++; }
      } else if (idx[i.cod] !== undefined) {
        if (!!cat.items[idx[i.cod]].imp !== valor) { cat.items[idx[i.cod]].imp = valor; n++; }
      }
    });
    Catalogo.guardar(cat); Store.guardar(p);
    var y = window.scrollY; render(); window.scrollTo(0, y);
    avisoOk((valor ? "Se marcaron " : "Se desmarcaron ") + n + " insumos.");
  };
  var ia = document.getElementById("impall");
  if (ia) ia.onclick = function () {
    if (confirm("¿Marcar todos los materiales de este proyecto como importados? Les aplicará el IVA de importados.")) marcarImp(true);
  };
  var inn = document.getElementById("impnone");
  if (inn) inn.onclick = function () { marcarImp(false); };

  var editar = function (attr, aplica) {
    Array.prototype.forEach.call(document.querySelectorAll("[" + attr + "]"), function (el) {
      el.onchange = function () {
        var c = Catalogo.leer();
        var ix = Catalogo.indice(c);
        var i = ix[el.getAttribute(attr)];
        if (i === undefined) return;
        aplica(c.items[i], el);
        c.items[i].act = new Date().toISOString();
        Catalogo.guardar(c);
        var y = window.scrollY; render(); window.scrollTo(0, y);
      };
      el.onkeydown = function (e) { if (e.key === "Enter") { e.preventDefault(); el.blur(); } };
    });
  };
  Array.prototype.forEach.call(document.querySelectorAll("[data-iprov]"), function (el) {
    el.onchange = function () {
      if (!p.proveedores) p.proveedores = {};
      p.proveedores[el.dataset.iprov] = Number(el.value);
      Store.guardar(p);
      var y = window.scrollY; render(); window.scrollTo(0, y);
    };
  });
  /* El precio editado aquí cambia el catálogo; si hay proveedor elegido, cambia esa oferta */
  Array.prototype.forEach.call(document.querySelectorAll("[data-iprecio]"), function (el) {
    var accion = function () {
      fijarPrecio(p, el.dataset.iprecio, el.value);
      var y = window.scrollY; render(); window.scrollTo(0, y);
    };
    el.onchange = accion;
    el.onkeydown = function (e) { if (e.key === "Enter") { e.preventDefault(); el.blur(); } };
  });
  editar("data-iimp", function (it, el) { it.imp = el.checked; });
}

/* ---- 7.8 Paso 5: entrega ---- */

function vEntrega(p) {
  var cat = Catalogo.leer();
  var t = totalesProyecto(p, cat);
  var forma = p.forma || "junta";

  var bloque = forma === "junta"
    ? '<div class="dl">' +
        '<div class="dlr"><span class="dlk">Subtotal · costo directo</span><span class="dlv m">' + cop(t.subtotal) + '</span></div>' +
        '<div class="dlr"><span class="dlk">Administración</span><span class="dlv m">' + cop(t.admin) + '</span></div>' +
        '<div class="dlr"><span class="dlk">Imprevistos</span><span class="dlv m">' + cop(t.imprev) + '</span></div>' +
        '<div class="dlr"><span class="dlk">Utilidad</span><span class="dlv m">' + cop(t.util) + '</span></div>' +
        '<div class="dlr"><span class="dlk">IVA sobre utilidad</span><span class="dlv m">' + cop(t.iva) + '</span></div>' +
        '<div class="dlr dltot"><span class="dlk">Valor total</span><span class="dlv m">' + cop(t.total) + '</span></div>' +
      '</div>'
    : '<div class="g g2">' +
        '<div><div class="subt">Materiales</div><div class="dl">' +
          '<div class="dlr"><span class="dlk">Subtotal</span><span class="dlv m">' + cop(t.subMat) + '</span></div>' +
          '<div class="dlr"><span class="dlk">IVA ' + (p.margenes.iva || 0) + '%</span><span class="dlv m">' + cop(t.ivaMat) + '</span></div>' +
          '<div class="dlr dltot"><span class="dlk">Total materiales</span><span class="dlv m">' + cop(t.totalMat) + '</span></div>' +
        '</div></div>' +
        '<div><div class="subt">Mano de obra</div><div class="dl">' +
          '<div class="dlr"><span class="dlk">Subtotal</span><span class="dlv m">' + cop(t.subMo) + '</span></div>' +
          '<div class="dlr"><span class="dlk">Administración</span><span class="dlv m">' + cop(t.moAdmin) + '</span></div>' +
          '<div class="dlr"><span class="dlk">Imprevistos</span><span class="dlv m">' + cop(t.moImprev) + '</span></div>' +
          '<div class="dlr"><span class="dlk">Utilidad</span><span class="dlv m">' + cop(t.moUtil) + '</span></div>' +
          '<div class="dlr"><span class="dlk">IVA sobre utilidad</span><span class="dlv m">' + cop(t.moIva) + '</span></div>' +
          '<div class="dlr dltot"><span class="dlk">Total mano de obra</span><span class="dlv m">' + cop(t.totalMo) + '</span></div>' +
        '</div></div>' +
      '</div>' +
      '<div class="dl" style="margin-top:14px"><div class="dlr dltot">' +
        '<span class="dlk">Valor total</span><span class="dlv m">' + cop(t.totalSep) + '</span></div></div>';

  return '<div class="card"><div class="chd"><span class="ct">Forma de presentar</span></div><div class="cbd">' +
      '<div class="tabs">' +
        '<button class="tab" data-forma="junta" aria-pressed="' + (forma === "junta") + '">Precio junto</button>' +
        '<button class="tab" data-forma="separada" aria-pressed="' + (forma === "separada") + '">Material y mano de obra aparte</button>' +
      '</div>' +
      '<p style="margin:12px 0 0;font-size:12.5px;color:var(--ink2)">' +
        (forma === "junta"
          ? "Un solo precio por ítem, con el AIU y el IVA sobre la utilidad al final."
          : "El material lleva IVA; la mano de obra lleva AIU con su IVA sobre la utilidad. El cliente ve las dos columnas.") +
      '</p></div></div>' +

    '<div class="card"><div class="chd"><span class="ct">Valor de la oferta</span>' +
      '<span class="cn">' + t.conValor + ' de ' + (t.conValor + t.sinValor) + ' ítems con valor</span></div>' +
      '<div class="cbd">' +
      (t.sinValor || t.faltantes
        ? '<div class="note" style="margin:0 0 15px"><div class="notet">Todavía incompleto</div>' +
          '<div class="noteb">' + (t.sinValor ? t.sinValor + ' ítems sin valor. ' : "") +
          (t.faltantes ? t.faltantes + ' insumos sin precio. ' : "") +
          'El total de abajo no es definitivo.</div></div>' : "") +
      bloque +
      '<div class="btnrow" style="margin-top:17px">' +
        '<button class="btn btnp" id="exp-todo">Descargar en Excel</button>' +
        '<button class="btn" id="exp-pdf">Ver para imprimir o guardar en PDF</button>' +
      '</div>' +
    '</div></div>' +
    '<div class="note"><div class="notet">Qué trae el archivo</div>' +
    '<div class="noteb">Cuatro hojas: membrete con los datos y el resumen, cotización con el anexo valorizado, ' +
    'análisis con los insumos de cada APU en sus tres secciones, e insumos con lo que se necesita comprar.</div></div>';
}

function enlazarEntrega(p) {
  Array.prototype.forEach.call(document.querySelectorAll("[data-forma]"), function (b) {
    b.onclick = function () { p.forma = b.dataset.forma; Store.guardar(p); render(); };
  });
  var e = document.getElementById("exp-todo");
  if (e) e.onclick = function () { exportarTodo(p); };
  var pd = document.getElementById("exp-pdf");
  if (pd) pd.onclick = function () { imprimirPropuesta(p); };
}

