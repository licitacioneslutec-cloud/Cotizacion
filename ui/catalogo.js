"use strict";

function renderCatalogo() {
  var cat = Catalogo.leer();
  var cob = Catalogo.cobertura(cat);
  var hist = Historial.leer();

  var cuerpo;
  if (!cat) {
    cuerpo =
      '<div class="card"><div class="chd"><span class="ct">Cargar el catálogo</span></div><div class="cbd">' +
        '<p style="margin:0 0 14px;font-size:13px;color:var(--ink2)">Sube tu archivo de datos maestros. ' +
        'Se busca la hoja que tenga código, descripción y precio.</p>' +
        '<button class="drop" id="dropcat"><div class="dropt">Soltar Datos APU</div>' +
        '<div class="dropn">xlsx o xlsm · se carga una sola vez</div></button>' +
        '<input type="file" id="fcat" accept=".xlsx,.xlsm,.xls" class="hide">' +
      '</div></div>';
  } else {
    var q = (vista.busca || "").toLowerCase();
    var lista = cat.items;
    if (q) lista = lista.filter(function (i) {
      return i.cod.toLowerCase().indexOf(q) >= 0 || (i.desc || "").toLowerCase().indexOf(q) >= 0;
    });
    if (vista.soloSin) lista = lista.filter(function (i) { return !(Number(i.precio) > 0); });
    var tope = vista.tope || 150;
    var muestra = lista.slice(0, tope);

    var filas = muestra.map(function (i) {
      var ofs = i.ofertas || [];
      var of = ofs.length ? ofs[i.sel !== undefined && ofs[i.sel] ? i.sel : 0] : null;
      var costo = of && Number(of.precio) > 0 ? Number(of.precio) : Number(i.precio) || 0;
      var tiene = costo > 0;
      var abierto = vista.abierto === i.cod;

      var f = '<tr' + (tiene ? "" : ' class="filasinp"') + '>' +
        '<td class="m" style="font-size:12px">' + esc(i.cod) + '</td>' +
        '<td>' + esc(i.desc) +
          '<button class="ofbtn' + (ofs.length ? "" : " vacio") + '" data-abrir-of="' + esc(i.cod) + '">' +
            (ofs.length
              ? ofs.length + (ofs.length === 1 ? " proveedor" : " proveedores") +
                (of && of.marca ? " · " + esc(of.marca) : "")
              : "sin proveedor") +
            (abierto ? " ▴" : " ▾") + '</button>' +
        '</td>' +
        '<td><input class="in inund" data-cund="' + esc(i.cod) + '" value="' + esc(i.und || "") + '"></td>' +
        '<td class="num">' + (ofs.length
          ? '<span class="m">' + (tiene ? cop(costo) : "—") + '</span>'
          : '<input class="in m inprecio' + (tiene ? " ok" : "") + '" type="number" min="0" step="1" ' +
            'data-cprecio="' + esc(i.cod) + '" value="' + (tiene ? i.precio : "") + '" placeholder="sin precio">') + '</td>' +
        '<td style="text-align:center"><input class="in m indesp" type="number" min="0" max="50" step="1" ' +
          'data-cdesp="' + esc(i.cod) + '" value="' + (i.desp || "") + '" placeholder="0"></td>' +
        '<td style="text-align:center"><input type="checkbox" data-cimp="' + esc(i.cod) + '"' +
          (i.imp ? " checked" : "") + ' title="Aplica IVA"></td>' +
        '<td style="font-size:12px;color:var(--ink3)">' + (i.act ? fecha(i.act.slice(0, 10)) : "—") + '</td>' +
      '</tr>';

      if (abierto) {
        f += '<tr class="ofrow"><td colspan="7"><div class="oflista">' +
          (ofs.length ? "" : '<div class="ofnota">Este insumo todavía no tiene proveedores. ' +
            'Agrega uno o deja el precio suelto de la columna.</div>') +
          ofs.map(function (o, j) {
            var elegido = (i.sel !== undefined ? i.sel : 0) === j;
            var kk = esc(i.cod) + "|" + j;
            return '<div class="ofitem' + (elegido ? " on" : "") + '">' +
              '<input type="radio" name="of_' + esc(i.cod) + '" data-elige-of="' + kk + '"' +
                (elegido ? " checked" : "") + ' title="Usar esta oferta por defecto">' +
              '<input class="in ofin ofmarca" data-edof="' + kk + '|marca" value="' + esc(o.marca || "") +
                '" placeholder="marca">' +
              '<input class="in ofin ofnombre" data-edof="' + kk + '|nombre" value="' + esc(o.nombre || "") +
                '" placeholder="nombre del proveedor">' +
              '<input class="in ofin ofcod m" data-edof="' + kk + '|codAur" value="' + esc(o.codAur || "") +
                '" placeholder="cód.">' +
              '<input class="in ofin ofprecio m" type="number" min="0" step="1" data-edof="' + kk + '|precio" value="' +
                (Number(o.precio) > 0 ? o.precio : "") + '" placeholder="sin precio">' +
              '<button class="btnx btnxdel" data-quitaof="' + kk + '" title="Quitar esta oferta">×</button>' +
            '</div>';
          }).join("") +
          '<div class="ofpie">' +
            '<button class="btn btnmini" data-masof="' + esc(i.cod) + '">+ Agregar proveedor</button>' +
            '<span class="ofnota">El marcado es el que se usa por defecto. Cada proyecto puede cambiarlo en su paso de insumos.</span>' +
          '</div>' +
        '</div></td></tr>';
      }
      return f;
    }).join("");

    var histFilas = hist.slice(0, 6).map(function (h) {
      return '<div class="dlr"><span class="dlk">' + fecha(h.fecha.slice(0, 10)) + ' · ' + esc(h.proveedor || "sin nombre") + '</span>' +
        '<span class="dlv m" style="font-weight:400;font-size:12px">' + h.aplicados + ' precios</span></div>';
    }).join("");

    cuerpo =
      '<div class="card"><div class="cbd">' +
        '<div class="kpi" style="margin-bottom:13px">' +
          '<div class="kc"><div class="kk">Insumos</div><div class="kv">' + cob.total + '</div></div>' +
          '<div class="kc"><div class="kk">Con precio</div><div class="kv">' + cob.con + '</div></div>' +
          '<div class="kc"><div class="kk">Sin precio</div><div class="kv">' + cob.sin + '</div></div>' +
          '<div class="kc"><div class="kk">Cobertura</div><div class="kv">' + cob.pct + '%</div></div>' +
        '</div><div class="bar"><div class="barf" style="width:' + cob.pct + '%"></div></div>' +
        '<div class="btnrow" style="margin-top:15px">' +
          '<button class="btn btnp" id="actualizar">Actualizar precios</button>' +
          '<button class="btn" id="cargarofertas">Cargar proveedores</button>' +
          '<button class="btn" id="expcat">Descargar catálogo</button>' +
          '<button class="btn" id="expof">Descargar proveedores</button>' +
          '<button class="btn" id="recargar">Reemplazar catálogo</button>' +
        '</div>' +
        '<input type="file" id="fcat" accept=".xlsx,.xlsm,.xls" class="hide">' +
      '</div></div>' +

      (hist.length ? '<div class="card"><div class="chd"><span class="ct">Últimas actualizaciones</span></div>' +
        '<div class="cbd"><div class="dl">' + histFilas + '</div></div></div>' : "") +

      '<div class="card">' +
        '<div class="chd"><span class="ct">Insumos</span>' +
        '<span class="cn">' + lista.length + ' coinciden · se ven ' + muestra.length + '</span></div>' +
        '<div class="cbd" style="padding-bottom:12px">' +
          '<input class="in" id="busca" placeholder="Buscar por código o descripción" value="' + esc(vista.busca || "") + '">' +
          '<label class="lbl" style="margin-top:10px"><input type="checkbox" id="solosin"' +
            (vista.soloSin ? " checked" : "") + '> Ver solo los que no tienen precio</label>' +
        '</div>' +
        '<div class="scroll"><table class="tbl"><thead><tr>' +
          '<th style="width:92px">Código</th><th>Descripción</th><th style="width:70px">Und</th>' +
          '<th style="width:106px" class="num">Precio costo</th>' +
          '<th style="width:56px;text-align:center" title="Desperdicio">Desp.</th>' +
          '<th style="width:44px;text-align:center" title="Aplica IVA">IVA</th>' +
          '<th style="width:86px">Actualizado</th>' +
        '</tr></thead><tbody>' +
        filas + '</tbody></table></div>' +
        (lista.length > muestra.length
          ? '<div class="cbd" style="border-top:1px solid var(--line2);text-align:center">' +
            '<button class="btn" id="masfilas">Ver ' + Math.min(150, lista.length - muestra.length) +
            ' más · faltan ' + (lista.length - muestra.length) + '</button></div>'
          : "") +
      '</div>';
  }

  app.innerHTML = barraTop("catalogo") +
    '<header class="top"><div class="wrap topin"><div>' +
      '<div class="brand">Datos maestros</div>' +
      '<h1 class="d h1">Catálogo de insumos</h1>' +
      '<div class="sub">Compartido por todos los proyectos' +
        (cat ? ' · ' + esc(cat.archivo) : "") + '</div>' +
    '</div></div></header>' +
    '<main class="wrap main">' + cuerpo +
      '<div class="note"><div class="notet">Cómo se llena</div>' +
      '<div class="noteb">Los precios entran por tandas, según lo que vaya cotizando cada proveedor. ' +
      'Cada actualización solo toca los códigos que vengan en el archivo; el resto queda como estaba.</div></div>' +
    '</main>';

  enlazarTop();

  var input = document.getElementById("fcat");
  var drop = document.getElementById("dropcat");
  if (drop) { drop.onclick = function () { input.click(); }; }
  var rec = document.getElementById("recargar");
  if (rec) rec.onclick = function () {
    if (confirm("Se reemplaza el catálogo. Los precios que hayas actualizado se pierden. ¿Seguir?")) input.click();
  };
  if (input) input.onchange = function (e) {
    var file = e.target.files[0]; if (!file) return;
    var fr = new FileReader();
    fr.onload = function () {
      try {
        var nuevo = leerCatalogo(new Uint8Array(fr.result), file.name);
        if (!nuevo.items.length) { alert("No se encontraron insumos con código y precio."); return; }
        Catalogo.guardar(nuevo); render();
      } catch (err) {
        alert("No se pudo leer el archivo. Debe tener una hoja con columnas de código y precio.");
      }
    };
    fr.readAsArrayBuffer(file);
  };

  var b = document.getElementById("busca");
  if (b) b.oninput = function () {
    vista.busca = this.value;
    vista.tope = 150;
    var pos = this.selectionStart;
    render();
    var n = document.getElementById("busca");
    if (n) { n.focus(); n.setSelectionRange(pos, pos); }
  };
  var s = document.getElementById("solosin");
  if (s) s.onchange = function () { ir({ soloSin: this.checked, tope: 150 }); };

  /* edición directa de precio, unidad e IVA */
  var editar = function (attr, aplica) {
    Array.prototype.forEach.call(document.querySelectorAll("[" + attr + "]"), function (el) {
      var accion = function () {
        var c = Catalogo.leer();
        var ix = Catalogo.indice(c);
        var i = ix[el.getAttribute(attr)];
        if (i === undefined) return;
        aplica(c.items[i], el);
        c.items[i].act = new Date().toISOString();
        Catalogo.guardar(c, i);
        var cb = Catalogo.cobertura(c);
        var kv = document.querySelectorAll(".kv");
        if (kv.length >= 4) { kv[1].textContent = cb.con; kv[2].textContent = cb.sin; kv[3].textContent = cb.pct + "%"; }
        var bf = document.querySelector(".barf");
        if (bf) bf.style.width = cb.pct + "%";
        if (el.type === "number") {
          var tiene = Number(el.value) > 0;
          el.classList.toggle("ok", tiene);
          if (el.closest) { var tr = el.closest("tr"); if (tr) tr.classList.toggle("filasinp", !tiene); }
        }
      };
      el.onchange = accion;
      el.onkeydown = function (e) { if (e.key === "Enter") { e.preventDefault(); el.blur(); } };
    });
  };
  editar("data-cprecio", function (it, el) { it.precio = Number(el.value) || 0; });
  editar("data-cdesp", function (it, el) { it.desp = Number(el.value) || 0; });
  editar("data-cund", function (it, el) { it.und = el.value; });
  editar("data-cimp", function (it, el) { it.imp = el.checked; });

  var mf = document.getElementById("masfilas");
  if (mf) mf.onclick = function () {
    vista.tope = (vista.tope || 150) + 150;
    var y = window.scrollY; render(); window.scrollTo(0, y);
  };

  Array.prototype.forEach.call(document.querySelectorAll("[data-abrir-of]"), function (b) {
    b.onclick = function () {
      var c = b.dataset.abrirOf;
      vista.abierto = vista.abierto === c ? null : c;
      var y = window.scrollY; render(); window.scrollTo(0, y);
    };
  });
  Array.prototype.forEach.call(document.querySelectorAll("[data-elige-of]"), function (r) {
    r.onchange = function () {
      var q = r.dataset.eligeOf.split("|");
      var c = Catalogo.leer();
      var ix = Catalogo.indice(c);
      var i = ix[q[0]];
      if (i === undefined) return;
      c.items[i].sel = Number(q[1]);
      Catalogo.guardar(c, i);
      var y = window.scrollY; render(); window.scrollTo(0, y);
    };
  });

  Array.prototype.forEach.call(document.querySelectorAll("[data-edof]"), function (el) {
    el.onchange = function () {
      var q = el.dataset.edof.split("|");
      var c = Catalogo.leer();
      var i = Catalogo.indice(c)[q[0]];
      if (i === undefined || !c.items[i].ofertas) return;
      var of = c.items[i].ofertas[Number(q[1])];
      if (!of) return;
      of[q[2]] = q[2] === "precio" ? (Number(el.value) || 0) : el.value;
      c.items[i].act = new Date().toISOString();
      Catalogo.guardar(c, i);
      var y = window.scrollY; render(); window.scrollTo(0, y);
    };
    el.onkeydown = function (e) { if (e.key === "Enter") { e.preventDefault(); el.blur(); } };
  });
  Array.prototype.forEach.call(document.querySelectorAll("[data-quitaof]"), function (b) {
    b.onclick = function () {
      var q = b.dataset.quitaof.split("|");
      var c = Catalogo.leer();
      var i = Catalogo.indice(c)[q[0]];
      if (i === undefined || !c.items[i].ofertas) return;
      c.items[i].ofertas.splice(Number(q[1]), 1);
      if (c.items[i].sel >= c.items[i].ofertas.length) c.items[i].sel = 0;
      Catalogo.guardar(c, i);
      var y = window.scrollY; render(); window.scrollTo(0, y);
    };
  });
  Array.prototype.forEach.call(document.querySelectorAll("[data-masof]"), function (b) {
    b.onclick = function () {
      var c = Catalogo.leer();
      var i = Catalogo.indice(c)[b.dataset.masof];
      if (i === undefined) return;
      if (!c.items[i].ofertas) c.items[i].ofertas = [];
      c.items[i].ofertas.push({ marca: "", codAur: "", nombre: "", precio: 0, und: "", codCla: "", estado: "Activo" });
      if (c.items[i].sel === undefined) c.items[i].sel = 0;
      Catalogo.guardar(c, i);
      var y = window.scrollY; render(); window.scrollTo(0, y);
    };
  });

  var co = document.getElementById("cargarofertas");
  if (co) co.onclick = function () { ir({ pantalla: "ofertas", precios: null }); };

  var act = document.getElementById("actualizar");
  if (act) act.onclick = function () { ir({ pantalla: "precios", precios: null }); };

  var exp = document.getElementById("expcat");
  if (exp) exp.onclick = function () {
    var datos = [["CODIGO", "DESCRIPCION", "UNIDAD", "PRECIO COSTO", "DESP %", "IMPORTADO",
                  "PROVEEDOR ELEGIDO", "CODIGO AURANET", "N OFERTAS", "ACTUALIZADO"]];
    cat.items.forEach(function (i) {
      var ofs = i.ofertas || [];
      var of = ofs.length ? (ofs[i.sel !== undefined && ofs[i.sel] ? i.sel : 0]) : null;
      var costo = of && Number(of.precio) > 0 ? Number(of.precio) : Number(i.precio) || 0;
      datos.push([i.cod, i.desc, i.und, costo, i.desp || 0, i.imp ? "SI" : "",
                  of ? of.marca : "", of ? of.codAur : "", ofs.length,
                  i.act ? i.act.slice(0, 10) : ""]);
    });
    var ws = XLSX.utils.aoa_to_sheet(datos);
    ws["!cols"] = [{ wch: 14 }, { wch: 58 }, { wch: 8 }, { wch: 14 }, { wch: 8 }, { wch: 11 },
                   { wch: 18 }, { wch: 15 }, { wch: 11 }, { wch: 12 }];
    var wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "CATALOGO");
    XLSX.writeFile(wb, "catalogo_insumos_" + hoy() + ".xlsx");
  };

  var eo = document.getElementById("expof");
  if (eo) eo.onclick = function () {
    var datos = [["Codigo_Material", "Descripcion Material", "Nombre_Auranet", "Codigo_Auranet",
                  "Marca", "Precio_Auranet", "Unidad", "Cod Clase", "Estado", "ELEGIDO"]];
    var n = 0;
    cat.items.forEach(function (i) {
      var ofs = i.ofertas || [];
      if (!ofs.length) return;
      var selJ = i.sel !== undefined && ofs[i.sel] ? i.sel : 0;
      ofs.forEach(function (o, j) {
        n++;
        datos.push([i.cod, i.desc, o.nombre || "", o.codAur || "", o.marca || "",
                    Number(o.precio) || 0, o.und || i.und || "", o.codCla || "",
                    o.estado || "", j === selJ ? "SI" : ""]);
      });
    });
    if (!n) { avisoError("Todavía no hay ofertas de proveedor cargadas."); return; }
    var ws = XLSX.utils.aoa_to_sheet(datos);
    ws["!cols"] = [{ wch: 15 }, { wch: 52 }, { wch: 46 }, { wch: 15 }, { wch: 16 },
                   { wch: 14 }, { wch: 8 }, { wch: 11 }, { wch: 10 }, { wch: 9 }];
    var wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "PROVEEDORES");
    XLSX.writeFile(wb, "proveedores_" + hoy() + ".xlsx");
  };
}

/* ---- Carga de proveedores ---- */

function renderOfertas() {
  var cat = Catalogo.leer();
  if (!cat) return ir({ pantalla: "catalogo" });
  var est = vista.precios;
  var cuerpo;

  if (!est) {
    cuerpo = '<div class="card"><div class="chd"><span class="ct">Lista de proveedores</span></div><div class="cbd">' +
      '<p style="margin:0 0 14px;font-size:13px;color:var(--ink2)">Sube el archivo donde cada fila es la oferta ' +
      'de un proveedor para un código de material. Un mismo código puede venir varias veces con marcas distintas.</p>' +
      '<button class="drop" id="dropof"><div class="dropt">Soltar la lista de proveedores</div>' +
      '<div class="dropn">xlsx, xlsm o csv</div></button>' +
      '<input type="file" id="fof" accept=".xlsx,.xlsm,.xls,.csv" class="hide">' +
    '</div></div>';
  } else if (!est.confirmado) {
    var hoja = est.hojas[est.hoja];
    var pest = est.hojas.map(function (h, i) {
      return '<button class="tab" data-hof="' + i + '" aria-pressed="' + (est.hoja === i) + '">' +
        esc(h.nombre) + (h.ok ? "" : " · sin encabezado") + '</button>';
    }).join("");

    var mapeo = "";
    if (hoja.ok) {
      var ops = function (rol) {
        var o = '<option value=""' + (rol ? "" : " selected") + '>No usar</option>';
        ROLES_OFERTA.forEach(function (r) {
          o += '<option value="' + r.id + '"' + (rol === r.id ? " selected" : "") + '>' + r.nombre + '</option>';
        });
        return o;
      };
      mapeo = hoja.columnas.map(function (c) {
        var rol = null;
        Object.keys(est.mapa).forEach(function (k) { if (est.mapa[k] === c.i) rol = k; });
        return '<tr><td class="m" style="font-size:12px">' + esc(c.nombre) + '</td>' +
          '<td><select class="in" data-cof="' + c.i + '">' + ops(rol) + '</select></td></tr>';
      }).join("");
    }

    var falta = est.mapa.cod === undefined || est.mapa.precio === undefined;
    var r = est.lect;

    cuerpo = '<div class="card"><div class="chd"><span class="ct">Lista de proveedores</span>' +
        '<span class="cn m">' + esc(est.archivo) + '</span></div>' +
        '<div class="cbd" style="padding-bottom:12px"><div class="tabs">' + pest + '</div></div>' +
        '<div class="cbd" style="border-top:1px solid var(--line2)">' +
          (hoja.ok
            ? '<label class="lbl">Columnas del archivo</label>' +
              '<div class="scroll"><table class="tbl"><thead><tr><th style="width:46%">En el archivo</th>' +
              '<th>Corresponde a</th></tr></thead><tbody>' + mapeo + '</tbody></table></div>' +
              (falta ? '<div class="err" style="margin-top:14px">Hacen falta la columna de código y la de precio.</div>' : "")
            : '<div class="err">No se encontró encabezado en esta hoja.</div>') +
        '</div></div>' +
      (r ? '<div class="card"><div class="cbd">' +
        '<div class="kpi" style="grid-template-columns:repeat(2,1fr)">' +
          '<div class="kc"><div class="kk">Ofertas que entran</div><div class="kv">' + r.nuevas.length + '</div></div>' +
          '<div class="kc"><div class="kk">Códigos que no están</div><div class="kv">' + r.fuera.length + '</div></div>' +
        '</div>' +
        (r.fuera.length ? '<div class="note" style="margin:14px 0 0"><div class="notet">Se van a ignorar</div>' +
          '<div class="noteb">' + r.fuera.length + ' códigos del archivo no existen en el catálogo. Ejemplos: ' +
          r.fuera.slice(0, 4).map(function (x) { return esc(x.cod); }).join(", ") + '.</div></div>' : "") +
        '<div class="btnrow" style="margin-top:15px">' +
          '<button class="btn btnp" id="aplicarof"' + (r.nuevas.length ? "" : " disabled") + '>' +
            'Aplicar ' + r.nuevas.length + ' ofertas</button>' +
          '<button class="btn" id="cancelarof">Cancelar</button>' +
        '</div></div></div>' : "");
  } else {
    cuerpo = '<div class="card"><div class="cbd"><div class="ok">' +
      'Se cargaron ' + est.res.agregadas + ' ofertas nuevas y se actualizaron ' + est.res.reemplazadas +
      ', repartidas en ' + est.res.insumos + ' insumos.</div>' +
      '<div class="btnrow" style="margin-top:14px">' +
        '<button class="btn btnp" id="otraof">Cargar otra lista</button>' +
        '<button class="btn" id="alcat2">Volver al catálogo</button>' +
      '</div></div></div>';
  }

  app.innerHTML = barraTop("catalogo") +
    '<header class="top"><div class="wrap topin"><div>' +
      '<div class="brand">Catálogo de insumos</div>' +
      '<h1 class="d h1">Proveedores por insumo</h1>' +
      '<div class="sub">Un mismo código puede tener varias marcas con su precio</div>' +
    '</div></div></header>' +
    '<main class="wrap main">' + cuerpo + '</main>';

  enlazarTop();

  var input = document.getElementById("fof");
  var drop = document.getElementById("dropof");
  if (drop) drop.onclick = function () { input.click(); };
  if (input) input.onchange = function (e) {
    var file = e.target.files[0]; if (!file) return;
    var fr = new FileReader();
    fr.onload = function () {
      try {
        var wb = XLSX.read(new Uint8Array(fr.result), { type: "array" });
        var hojas = [];
        wb.SheetNames.forEach(function (n) {
          var filas = XLSX.utils.sheet_to_json(wb.Sheets[n], { header: 1, raw: false, defval: null, blankrows: false });
          var det = detectarCols(filas, ROLES_OFERTA);
          var cols = [];
          if (det) cols = (filas[det.fila] || []).map(function (v, i) {
            var rol = null;
            Object.keys(det.mapa).forEach(function (k) { if (det.mapa[k] === i) rol = k; });
            return { i: i, nombre: txt(v), rol: rol };
          }).filter(function (c) { return c.nombre !== ""; });
          hojas.push({ nombre: n, filas: filas, ok: !!det, encabezado: det ? det.fila : null,
                       mapa: det ? det.mapa : {}, columnas: cols });
        });
        var i = 0;
        for (var k = 0; k < hojas.length; k++) {
          if (hojas[k].ok && hojas[k].mapa.cod !== undefined && hojas[k].mapa.precio !== undefined) { i = k; break; }
        }
        var e2 = { archivo: file.name, hojas: hojas, hoja: i, mapa: hojas[i].mapa || {}, confirmado: false };
        e2.lect = (hojas[i].ok && e2.mapa.cod !== undefined && e2.mapa.precio !== undefined)
          ? leerOfertas(hojas[i], e2.mapa, cat) : null;
        ir({ precios: e2 });
      } catch (err) { avisoError("No se pudo leer ese archivo: " + (err && err.message ? err.message : err)); }
    };
    fr.readAsArrayBuffer(file);
  };

  Array.prototype.forEach.call(document.querySelectorAll("[data-hof]"), function (b) {
    b.onclick = function () {
      var i = Number(b.dataset.hof);
      est.hoja = i; est.mapa = est.hojas[i].mapa || {};
      est.lect = (est.hojas[i].ok && est.mapa.cod !== undefined && est.mapa.precio !== undefined)
        ? leerOfertas(est.hojas[i], est.mapa, cat) : null;
      ir({ precios: est });
    };
  });
  Array.prototype.forEach.call(document.querySelectorAll("[data-cof]"), function (sel) {
    sel.onchange = function () {
      var mapa = {};
      Array.prototype.forEach.call(document.querySelectorAll("[data-cof]"), function (x) {
        if (x.value) mapa[x.value] = Number(x.dataset.cof);
      });
      est.mapa = mapa;
      est.lect = (mapa.cod !== undefined && mapa.precio !== undefined)
        ? leerOfertas(est.hojas[est.hoja], mapa, cat) : null;
      ir({ precios: est });
    };
  });
  var ap = document.getElementById("aplicarof");
  if (ap) ap.onclick = function () {
    est.res = aplicarOfertas(cat, est.lect.nuevas);
    Catalogo.guardar(cat);
    Historial.agregar({ fecha: new Date().toISOString(), archivo: est.archivo,
                        proveedor: "lista de proveedores", aplicados: est.lect.nuevas.length });
    est.confirmado = true;
    ir({ precios: est });
  };
  var ca = document.getElementById("cancelarof");
  if (ca) ca.onclick = function () { ir({ precios: null }); };
  var ot = document.getElementById("otraof");
  if (ot) ot.onclick = function () { ir({ precios: null }); };
  var al = document.getElementById("alcat2");
  if (al) al.onclick = function () { ir({ pantalla: "catalogo", precios: null }); };
}

/* ---- Actualización de precios ---- */

function renderPrecios() {
  var cat = Catalogo.leer();
  if (!cat) return ir({ pantalla: "catalogo" });
  var est = vista.precios;

  var cuerpo;
  if (!est) {
    cuerpo = '<div class="card"><div class="chd"><span class="ct">Lista del proveedor</span></div><div class="cbd">' +
      '<p style="margin:0 0 14px;font-size:13px;color:var(--ink2)">Sube el archivo con los precios que te pasaron. ' +
      'Puede traer solo unos pocos insumos: se actualiza únicamente lo que venga adentro.</p>' +
      '<button class="drop" id="droppre"><div class="dropt">Soltar la lista de precios</div>' +
      '<div class="dropn">xlsx, xlsm o csv</div></button>' +
      '<input type="file" id="fpre" accept=".xlsx,.xlsm,.xls,.csv" class="hide">' +
    '</div></div>';
  } else if (!est.confirmado) {
    var hoja = est.hojas[est.hoja];
    var pestanas = est.hojas.map(function (h, i) {
      return '<button class="tab" data-hp="' + i + '" aria-pressed="' + (est.hoja === i) + '">' +
        esc(h.nombre) + (h.ok ? "" : " ·  sin encabezado") + '</button>';
    }).join("");

    var mapeo = "";
    if (hoja.ok) {
      var opciones = function (rolActual) {
        var o = '<option value=""' + (rolActual ? "" : " selected") + '>No usar</option>';
        ROLES_PRECIO.forEach(function (r) {
          o += '<option value="' + r.id + '"' + (rolActual === r.id ? " selected" : "") + '>' + r.nombre + '</option>';
        });
        return o;
      };
      mapeo = hoja.columnas.map(function (c) {
        var rol = null;
        Object.keys(est.mapa).forEach(function (k) { if (est.mapa[k] === c.i) rol = k; });
        return '<tr><td class="m" style="font-size:12px">' + esc(c.nombre) + '</td>' +
          '<td><select class="in" data-cp="' + c.i + '">' + opciones(rol) + '</select></td></tr>';
      }).join("");
    }

    var falta = est.mapa.cod === undefined || est.mapa.precio === undefined;
    var d = est.dif;

    var tabla = function (titulo, arr, color) {
      if (!arr.length) return "";
      return '<div class="card"><div class="chd"><span class="ct">' + titulo + '</span>' +
        '<span class="cn">' + arr.length + '</span></div><div class="scroll">' +
        '<table class="tbl"><thead><tr><th style="width:96px">Código</th><th>Descripción</th>' +
        '<th class="num" style="width:92px">Antes</th><th class="num" style="width:92px">Ahora</th>' +
        '<th class="num" style="width:72px">Var.</th></tr></thead><tbody>' +
        arr.slice(0, 60).map(function (r) {
          return '<tr><td class="m" style="font-size:12px">' + esc(r.cod) + '</td>' +
            '<td>' + esc(r.desc) + '</td>' +
            '<td class="num" style="color:var(--ink3)">' + (r.viejo > 0 ? cop(r.viejo) : "—") + '</td>' +
            '<td class="num">' + cop(r.nuevo) + '</td>' +
            '<td class="num" style="color:' + color + '">' +
              (r.var === null ? "nuevo" : (r.var > 0 ? "+" : "") + r.var.toFixed(1) + "%") + '</td></tr>';
        }).join("") +
        (arr.length > 60 ? '<tr><td colspan="5" style="color:var(--ink3);font-size:12px">y ' +
          (arr.length - 60) + ' más</td></tr>' : "") +
        '</tbody></table></div></div>';
    };

    cuerpo =
      '<div class="card"><div class="chd"><span class="ct">Lista del proveedor</span>' +
        '<span class="cn m">' + esc(est.archivo) + '</span></div>' +
        '<div class="cbd" style="padding-bottom:12px"><div class="tabs">' + pestanas + '</div></div>' +
        '<div class="cbd" style="border-top:1px solid var(--line2)">' +
          (hoja.ok
            ? '<label class="lbl">Columnas del archivo</label>' +
              '<div class="scroll"><table class="tbl"><thead><tr><th style="width:46%">En el archivo</th>' +
              '<th>Corresponde a</th></tr></thead><tbody>' + mapeo + '</tbody></table></div>' +
              (falta ? '<div class="err" style="margin-top:14px">Hacen falta la columna de código y la de precio ' +
                'para poder comparar.</div>' : "")
            : '<div class="err">No se encontró encabezado en esta hoja.</div>') +
        '</div></div>' +

      (d ?
        '<div class="card"><div class="cbd">' +
          '<div class="kpi">' +
            '<div class="kc"><div class="kk">Estrenan precio</div><div class="kv">' + d.estrena.length + '</div></div>' +
            '<div class="kc"><div class="kk">Suben</div><div class="kv">' + d.suben.length + '</div></div>' +
            '<div class="kc"><div class="kk">Bajan</div><div class="kv">' + d.bajan.length + '</div></div>' +
            '<div class="kc"><div class="kk">Sin cambio</div><div class="kv">' + d.iguales.length + '</div></div>' +
          '</div>' +
          (d.fuera.length ? '<div class="note" style="margin:14px 0 0"><div class="notet">Códigos que no están en el catálogo</div>' +
            '<div class="noteb">' + d.fuera.length + ' códigos del archivo no existen en tus datos maestros y se van a ignorar. ' +
            'Ejemplos: ' + d.fuera.slice(0, 4).map(function (x) { return esc(x.cod); }).join(", ") + '.</div></div>' : "") +
          '<div class="field" style="margin:15px 0 0"><label class="lbl" for="prov">Nombre del proveedor</label>' +
            '<input class="in" id="prov" value="' + esc(est.proveedor || "") + '" placeholder="Quién pasó estos precios"></div>' +
          '<div class="btnrow" style="margin-top:14px">' +
            '<button class="btn btnp" id="aplicar"' +
              ((d.estrena.length + d.suben.length + d.bajan.length) ? "" : " disabled") + '>' +
              'Aplicar ' + (d.estrena.length + d.suben.length + d.bajan.length) + ' precios</button>' +
            '<button class="btn" id="cancelar">Cancelar</button>' +
          '</div>' +
        '</div></div>' +
        tabla("Estrenan precio", d.estrena, "var(--ok)") +
        tabla("Suben", d.suben, "var(--err)") +
        tabla("Bajan", d.bajan, "var(--ok)")
      : "");
  } else {
    cuerpo = '<div class="card"><div class="cbd">' +
      '<div class="ok">Se actualizaron ' + est.aplicados + ' precios' +
        (est.proveedor ? " con la lista de " + esc(est.proveedor) : "") + '.</div>' +
      '<div class="btnrow" style="margin-top:14px">' +
        '<button class="btn btnp" id="otra">Cargar otra lista</button>' +
        '<button class="btn" id="alcat">Volver al catálogo</button>' +
      '</div></div></div>';
  }

  app.innerHTML = barraTop("catalogo") +
    '<header class="top"><div class="wrap topin"><div>' +
      '<div class="brand">Catálogo de insumos</div>' +
      '<h1 class="d h1">Actualizar precios</h1>' +
      '<div class="sub">Solo se tocan los códigos que vengan en el archivo</div>' +
    '</div></div></header>' +
    '<main class="wrap main">' + cuerpo + '</main>';

  enlazarTop();

  var input = document.getElementById("fpre");
  var drop = document.getElementById("droppre");
  if (drop) drop.onclick = function () { input.click(); };
  if (input) input.onchange = function (e) {
    var file = e.target.files[0]; if (!file) return;
    var fr = new FileReader();
    fr.onload = function () {
      try {
        var hojas = leerListaPrecios(new Uint8Array(fr.result));
        var i = 0;
        for (var k = 0; k < hojas.length; k++) {
          if (hojas[k].ok && hojas[k].mapa.cod !== undefined && hojas[k].mapa.precio !== undefined) { i = k; break; }
        }
        var e2 = { archivo: file.name, hojas: hojas, hoja: i, mapa: hojas[i].mapa || {}, proveedor: "", confirmado: false };
        e2.dif = (hojas[i].ok && e2.mapa.cod !== undefined && e2.mapa.precio !== undefined)
          ? compararPrecios(cat, hojas[i], e2.mapa) : null;
        ir({ precios: e2 });
      } catch (err) { alert("No se pudo leer ese archivo."); }
    };
    fr.readAsArrayBuffer(file);
  };

  Array.prototype.forEach.call(document.querySelectorAll("[data-hp]"), function (b) {
    b.onclick = function () {
      var i = Number(b.dataset.hp);
      est.hoja = i; est.mapa = est.hojas[i].mapa || {};
      est.dif = (est.hojas[i].ok && est.mapa.cod !== undefined && est.mapa.precio !== undefined)
        ? compararPrecios(cat, est.hojas[i], est.mapa) : null;
      ir({ precios: est });
    };
  });

  Array.prototype.forEach.call(document.querySelectorAll("[data-cp]"), function (s) {
    s.onchange = function () {
      var mapa = {};
      Array.prototype.forEach.call(document.querySelectorAll("[data-cp]"), function (x) {
        if (x.value) mapa[x.value] = Number(x.dataset.cp);
      });
      est.mapa = mapa;
      est.dif = (mapa.cod !== undefined && mapa.precio !== undefined)
        ? compararPrecios(cat, est.hojas[est.hoja], mapa) : null;
      ir({ precios: est });
    };
  });

  var pr = document.getElementById("prov");
  if (pr) pr.oninput = function () { est.proveedor = this.value; };

  var ap = document.getElementById("aplicar");
  if (ap) ap.onclick = function () {
    var idx = Catalogo.indice(cat);
    var ahora = new Date().toISOString();
    var n = 0;
    ["estrena", "suben", "bajan"].forEach(function (g) {
      est.dif[g].forEach(function (r) {
        var it = cat.items[idx[r.cod]];
        if (!it) return;
        it.precioAnt = Number(it.precio) || 0;
        it.precio = r.nuevo;
        it.prov = est.proveedor || it.prov;
        if (r.codProv) it.codProv = r.codProv;
        it.act = ahora;
        n++;
      });
    });
    Catalogo.guardar(cat);
    Historial.agregar({ fecha: ahora, archivo: est.archivo, proveedor: est.proveedor, aplicados: n });
    est.confirmado = true; est.aplicados = n;
    ir({ precios: est });
  };
  var can = document.getElementById("cancelar");
  if (can) can.onclick = function () { ir({ precios: null }); };
  var otra = document.getElementById("otra");
  if (otra) otra.onclick = function () { ir({ precios: null }); };
  var alc = document.getElementById("alcat");
  if (alc) alc.onclick = function () { ir({ pantalla: "catalogo", precios: null }); };
}

