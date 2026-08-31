"use strict";


/* Agrupa los ítems del anexo por número de análisis */
function analisisDe(p) {
  var g = {}, orden = [];
  itemsDe(p).forEach(function (x) {
    if (!x.f.apu) return;
    if (!g[x.f.apu]) { g[x.f.apu] = { apu: x.f.apu, items: [], cod: [] }; orden.push(x.f.apu); }
    g[x.f.apu].items.push(x.f);
    x.f.cod.forEach(function (c) { if (g[x.f.apu].cod.indexOf(c) < 0) g[x.f.apu].cod.push(c); });
  });
  orden.sort(function (a, b) { return a - b; });
  return orden.map(function (n) { return g[n]; });
}

function datosDe(p, apu) {
  if (!p.datosApu) p.datosApu = {};
  if (!p.datosApu[apu]) p.datosApu[apu] = {};
  return p.datosApu[apu];
}

/* Cuál análisis está abierto */
function apuActivo(p) {
  var lista = analisisDe(p);
  if (!lista.length) return null;
  for (var i = 0; i < lista.length; i++) if (lista[i].apu === vista.apu) return lista[i];
  return lista[0];
}

function vApartados(p) {
  var cat = Catalogo.leer();
  var lista = analisisDe(p);

  if (!lista.length)
    return '<div class="card"><div class="empty"><div class="dropt">Todavía no hay análisis</div>' +
      'Asigna apartados a los ítems en el paso 3.</div></div>';

  if (!cat)
    return '<div class="card"><div class="empty"><div class="dropt">Falta el catálogo</div>' +
      'Cárgalo en la sección de catálogo de insumos para poder componer los análisis.</div></div>';

  if (!cat.comp || !((cat.comp.tuberia || []).length)) {
    return '<div class="card"><div class="chd"><span class="ct">Falta recargar el catálogo</span></div>' +
      '<div class="cbd">' +
      '<div class="err">El catálogo guardado tiene los precios pero no las hojas de composición ' +
      '(tubería, equipos, tableros, salidas, cableado y bornas). Sin ellas no se puede armar ningún análisis.</div>' +
      '<p style="margin:14px 0 0;font-size:13px;color:var(--ink2)">Se cargó con una versión anterior de la ' +
      'aplicación. Ve a <strong>Catálogo de insumos</strong>, pulsa <strong>Reemplazar catálogo</strong> y ' +
      'sube otra vez tu archivo de datos maestros.</p>' +
      '<div class="btnrow" style="margin-top:14px"><button class="btn btnp" id="ircat">Ir al catálogo</button></div>' +
      '</div></div>';
  }

  var act = apuActivo(p);

  var mg = p.margenes || {};
  if (mg.transporte === undefined) mg.transporte = 1;
  if (mg.herramienta === undefined) mg.herramienta = 2;

  var barraPct = '<div class="card"><div class="cbd pctbar">' +
    '<div><label class="lbl" for="pt">Transporte %</label>' +
      '<input class="in m" type="number" min="0" max="100" step="0.5" id="pt" value="' + mg.transporte + '"></div>' +
    '<div><label class="lbl" for="ph">Herramienta %</label>' +
      '<input class="in m" type="number" min="0" max="100" step="0.5" id="ph" value="' + mg.herramienta + '"></div>' +
    '<div class="pctnota">Se calculan sobre el subtotal de materiales de cada análisis y valen para todo el proyecto.</div>' +
  '</div></div>';

  var listaFiltrada = filtrarApus(lista);

  return barraPct + '<div class="g g32">' +
      '<div class="card" style="margin:0"><div class="chd"><span class="ct">Análisis</span>' +
      '<span class="cn">' + listaFiltrada.length + ' de ' + lista.length + '</span></div>' +
      '<div style="padding:0 10px 8px"><input class="in" id="filtroapu" placeholder="Buscar por número o descripción" value="' +
        esc(vista.filtroApu || '') + '"></div>' +
      '<div class="alist" id="listaapu">' + listaApu(p, listaFiltrada, act) + '</div></div>' +
      '<div id="panelapu">' + panelApu(p, cat, act) + '</div>' +
    '</div>';
}

/* Filtra la lista de análisis por número de APU o texto de descripción del anexo,
   según lo que haya escrito el usuario en #filtroapu */
function filtrarApus(lista) {
  var filtro = (vista.filtroApu || "").toLowerCase();
  if (!filtro) return lista;
  return lista.filter(function (a) {
    if (String(a.apu).indexOf(filtro) >= 0) return true;
    return a.items.some(function (it) {
      return (it.desc || "").toLowerCase().indexOf(filtro) >= 0;
    });
  });
}

function listaApu(p, lista, act) {
  return lista.map(function (a) {
    var d = p.datosApu && p.datosApu[a.apu];
    var listo = d && d.TU && d.TU.length;
    return '<button class="arow" data-apu="' + a.apu + '" aria-current="' + (a.apu === act.apu) + '">' +
      '<div class="an"><span class="anum">APU ' + a.apu + '</span><span>' +
        a.cod.map(function (c) { return '<span class="chip">' + c + '</span>'; }).join("") +
        (listo ? '<span class="pt" title="con datos"></span>' : "") + '</span></div>' +
      '<div class="ad">' + esc(a.items[0].desc) + '</div>' +
      (a.items.length > 1 ? '<div class="anum" style="color:var(--limedk);margin-top:3px">' +
        a.items.length + ' ítems del anexo</div>' : "") +
    '</button>';
  }).join("");
}

/* Panel derecho: encabezado, formularios y composición */
function panelApu(p, cat, act) {
  var f;
  var datos = datosDe(p, act.apu);
  var filasTU = datos.TU || [];
  var tieneTU = act.cod.indexOf("TU") >= 0;

  /* --- formulario de tuberías --- */
  var formTU = "";
  if (tieneTU) {
    var bloques = filasTU.map(function (f, i) {
      var op = opcionesTuberia(cat, f.material, f.tipo);
      var sel = function (campo, valor, opciones, deshab) {
        return '<select class="in" data-tu="' + i + '|' + campo + '"' + (deshab ? " disabled" : "") + '>' +
          '<option value="">' + (deshab ? "—" : "Elegir…") + '</option>' +
          opciones.map(function (o) {
            return '<option' + (txt(o) === txt(valor) ? " selected" : "") + '>' + esc(o) + '</option>';
          }).join("") + '</select>';
      };
      return '<div class="bloque">' +
        '<div class="bloque-hd"><span class="bloque-n">Tubería ' + (i + 1) + '</span>' +
          '<button class="btnx" data-quitatu="' + i + '">Quitar</button></div>' +
        '<div class="g" style="grid-template-columns:repeat(auto-fit,minmax(120px,1fr))">' +
          '<div><label class="lbl">Material</label>' + sel("material", f.material, op.familias, false) + '</div>' +
          '<div><label class="lbl">Instalación</label>' + sel("tipo", f.tipo, op.tipos, !f.material) + '</div>' +
          '<div><label class="lbl">Diámetro</label>' + sel("diam", f.diam, op.diametros, !f.tipo) + '</div>' +
          '<div><label class="lbl">Cantidad (m)</label>' +
            '<input class="in m" type="number" min="0" step="0.01" data-tu="' + i + '|cantidad" value="' +
            (f.cantidad === undefined ? 1 : f.cantidad) + '"></div>' +
        '</div></div>';
    }).join("");

    formTU = '<div class="card"><div class="chd"><span class="ct">Tuberías</span>' +
      '<span class="cn">' + filasTU.length + (filasTU.length === 1 ? " línea" : " líneas") + '</span></div>' +
      '<div class="cbd">' + (bloques || '<p style="margin:0 0 12px;font-size:13px;color:var(--ink2)">' +
        'Sin líneas todavía.</p>') +
      '<button class="btn" id="masTU">+ Agregar tubería</button></div></div>';
  }

  /* --- formulario de equipos --- */
  var filasEQ = datos.EQ || [];
  var formEQ = "";
  if (act.cod.indexOf("EQ") >= 0) {
    var bloquesEQ = filasEQ.map(function (f, i) {
      var op = opcionesEquipo(cat, f.familia);
      var sel = function (campo, valor, opciones, deshab) {
        return '<select class="in" data-eq="' + i + '|' + campo + '"' + (deshab ? " disabled" : "") + '>' +
          '<option value="">' + (deshab ? "\u2014" : "Elegir\u2026") + '</option>' +
          opciones.map(function (o) {
            return '<option' + (txt(o) === txt(valor) ? " selected" : "") + '>' + esc(o) + '</option>';
          }).join("") + '</select>';
      };
      return '<div class="bloque">' +
        '<div class="bloque-hd"><span class="bloque-n">Equipo ' + (i + 1) + '</span>' +
          '<button class="btnx" data-quitaeq="' + i + '">Quitar</button></div>' +
        '<div class="g" style="grid-template-columns:repeat(auto-fit,minmax(130px,1fr))">' +
          '<div><label class="lbl">Familia</label>' + sel("familia", f.familia, op.familias, false) + '</div>' +
          '<div><label class="lbl">Subfamilia</label>' + sel("subfamilia", f.subfamilia, op.subfamilias, !f.familia) + '</div>' +
          '<div><label class="lbl">Mano de obra</label>' +
            '<input class="in m" type="number" min="0" step="0.01" data-eq="' + i + '|manoObra" ' +
            'placeholder="la del cat\u00e1logo" value="' + (f.manoObra || "") + '"></div>' +
        '</div>' +
        '<label class="lbl" style="margin-top:10px"><input type="checkbox" data-eqchk="' + i + '"' +
          (f.crearItem ? " checked" : "") + '> Crear \u00edtem propio</label>' +
        (f.crearItem ? '<div class="itemnuevo">' +
          '<div class="g" style="grid-template-columns:1fr 116px">' +
            '<div><label class="lbl">Nombre del \u00edtem</label>' +
              '<input class="in" data-eq="' + i + '|nombreItem" placeholder="C\u00f3mo se llama" value="' +
              esc(f.nombreItem || "") + '"></div>' +
            '<div><label class="lbl">C\u00f3digo</label>' +
              '<div class="m codnuevo">' + (f.codItem ? esc(f.codItem) : "se asigna solo") + '</div></div>' +
          '</div>' +
          '<div class="g" style="grid-template-columns:116px 1fr;margin-top:8px">' +
            '<div><label class="lbl">Unidad</label>' +
              '<input class="in" data-eq="' + i + '|unidad" placeholder="UND" value="' + esc(f.unidad || "") + '"></div>' +
            '<div><label class="lbl">Precio costo</label>' +
              '<input class="in m" type="number" min="0" step="1" data-eq="' + i + '|precio" ' +
              'placeholder="sin precio" value="' + (f.precio || "") + '"></div>' +
          '</div></div>' : "") +
      '</div>';
    }).join("");

    formEQ = '<div class="card"><div class="chd"><span class="ct">Equipos</span>' +
      '<span class="cn">' + filasEQ.length + (filasEQ.length === 1 ? " l\u00ednea" : " l\u00edneas") + '</span></div>' +
      '<div class="cbd">' + (bloquesEQ || '<p style="margin:0 0 12px;font-size:13px;color:var(--ink2)">Sin l\u00edneas todav\u00eda.</p>') +
      '<button class="btn" id="masEQ">+ Agregar equipo</button></div></div>';
  }

  /* --- formulario de salidas --- */
  var filasSA = datos.SA || [];
  var formSA = "";
  if (act.cod.indexOf("SA") >= 0) {
    var os = opcionesSalida(cat);
    var bloquesSA = filasSA.map(function (fx, i) {
      var g = fx;
      var sel = function (campo, valor, opciones, ancho) {
        return '<select class="in" data-sa="' + i + '|' + campo + '">' +
          '<option value="">Elegir\u2026</option>' +
          opciones.map(function (o) {
            return '<option' + (txt(o) === txt(valor) ? " selected" : "") + '>' + esc(o) + '</option>';
          }).join("") + '</select>';
      };
      var num = function (campo, valor, paso) {
        return '<input class="in m" type="number" min="0" step="' + (paso || 1) + '" data-sa="' + i + '|' + campo +
          '" value="' + (valor === undefined || valor === null ? "" : valor) + '">';
      };
      return '<div class="bloque">' +
        '<div class="bloque-hd"><span class="bloque-n">Salida ' + (i + 1) + '</span>' +
          '<button class="btnx" data-quitasa="' + i + '">Quitar</button></div>' +

        '<div class="field"><label class="lbl">Aparato</label>' + sel("aparato", g.aparato, os.aparatos) + '</div>' +

        '<div class="field"><label class="lbl">C\u00f3mo viene en el presupuesto</label>' +
          '<select class="in" data-sa="' + i + '|modo">' +
          MODOS_SALIDA.map(function (m) {
            return '<option value="' + m.id + '"' + ((g.modo || "normal") === m.id ? " selected" : "") + '>' +
              esc(m.nombre) + (m.fmo !== 1 ? "  \u00b7 mano de obra " + Math.round(m.fmo * 100) + "%" : "") +
              '</option>';
          }).join("") + '</select></div>' +

        '<label class="lbl">Tuber\u00eda 1</label>' +
        '<div class="g" style="grid-template-columns:1fr 1fr 78px;margin-bottom:8px">' +
          '<div>' + sel("mat1", g.mat1, os.materiales) + '</div>' +
          '<div>' + sel("tubo1", g.tubo1, os.tubos) + '</div>' +
          '<div>' + num("pct1", g.pct1 === undefined ? 100 : g.pct1) + '</div>' +
        '</div>' +
        '<label class="lbl">Tuber\u00eda 2 <span style="text-transform:none;letter-spacing:0">(opcional)</span></label>' +
        '<div class="g" style="grid-template-columns:1fr 1fr 78px;margin-bottom:10px">' +
          '<div>' + sel("mat2", g.mat2, os.materiales) + '</div>' +
          '<div>' + sel("tubo2", g.tubo2, os.tubos) + '</div>' +
          '<div>' + num("pct2", g.pct2) + '</div>' +
        '</div>' +

        '<div class="g" style="grid-template-columns:1fr 1fr 1fr;margin-bottom:9px">' +
          '<div><label class="lbl">Cable</label>' + sel("calibreCable", g.calibreCable, os.calibres) + '</div>' +
          '<div><label class="lbl">Material cable</label>' + sel("matCable", g.matCable, os.matCable) + '</div>' +
          '<div><label class="lbl">N.\u00ba de cables</label>' + num("multCable", g.multCable === undefined ? 1 : g.multCable) + '</div>' +
        '</div>' +

        '<div class="g" style="grid-template-columns:1fr 1fr 1fr">' +
          '<div><label class="lbl">Estrato</label>' + num("estrato", g.estrato === undefined ? 2 : g.estrato) + '</div>' +
          '<div><label class="lbl">Promedio</label>' + num("promedio", g.promedio === undefined ? 1 : g.promedio, "0.1") + '</div>' +
          '<div><label class="lbl">Tipo de caja</label>' +
            '<select class="in" data-sa="' + i + '|caja">' +
            [["cuadrada", "Cuadrada"], ["octogonal", "Octogonal"], ["honda", "10x10"]].map(function (o) {
              return '<option value="' + o[0] + '"' + ((g.caja || "cuadrada") === o[0] ? " selected" : "") + '>' + o[1] + '</option>';
            }).join("") + '</select></div>' +
        '</div>' +
        '<label class="lbl" style="margin-top:9px"><input type="checkbox" data-sachk="' + i + '"' +
          (g.sinInstalacion ? " checked" : "") + '> Sin materiales de instalaci\u00f3n</label>' +
      '</div>';
    }).join("");

    formSA = '<div class="card"><div class="chd"><span class="ct">Salidas</span>' +
      '<span class="cn">' + filasSA.length + (filasSA.length === 1 ? " salida" : " salidas") + '</span></div>' +
      '<div class="cbd">' + (bloquesSA || '<p style="margin:0 0 12px;font-size:13px;color:var(--ink2)">Sin salidas todav\u00eda.</p>') +
      '<button class="btn" id="masSA">+ Agregar salida</button></div></div>';
  }

  /* --- formulario de cableados --- */
  var filasCA = datos.CA || [];
  var formCA = "";
  if (act.cod.indexOf("CA") >= 0) {
    var cables = listaCables(cat);
    var opCable = function (valor) {
      return '<option value="">Elegir cable\u2026</option>' +
        cables.map(function (c) {
          return '<option value="' + esc(c.cod) + '"' + (codClave(valor) === c.cod ? " selected" : "") +
            '>' + esc(c.desc) + '</option>';
        }).join("");
    };
    var linea = function (i, rol, etiq) {
      var campoC = rol, campoQ = "cant" + rol.charAt(0).toUpperCase() + rol.slice(1);
      return '<div class="g cafila" style="grid-template-columns:74px 1fr 72px">' +
        '<div class="carol">' + etiq + '</div>' +
        '<div><select class="in" data-ca="' + i + '|' + campoC + '">' + opCable(f[campoC]) + '</select></div>' +
        '<div><input class="in m" type="number" min="0" step="1" data-ca="' + i + '|' + campoQ + '" ' +
          'placeholder="cant." value="' + (f[campoQ] || "") + '"></div>' +
      '</div>';
    };
    var bloquesCA = filasCA.map(function (fx, i) {
      f = fx;
      return '<div class="bloque">' +
        '<div class="bloque-hd"><span class="bloque-n">Acometida ' + (i + 1) + '</span>' +
          '<button class="btnx" data-quitaca="' + i + '">Quitar</button></div>' +
        '<div class="field"><label class="lbl">Nombre</label>' +
          '<input class="in" data-ca="' + i + '|nombre" placeholder="C\u00f3mo se llama" value="' +
          esc(f.nombre || "") + '"></div>' +
        linea(i, "fase", "Fase") + linea(i, "neutro", "Neutro") + linea(i, "tierra", "Tierra") +
        '<div class="g" style="grid-template-columns:1fr 1fr 1fr;margin-top:9px">' +
          '<div><label class="lbl">Metrado</label>' +
            '<input class="in m" type="number" min="0" step="0.01" data-ca="' + i + '|metrado" value="' +
            (f.metrado === undefined ? 1 : f.metrado) + '"></div>' +
          '<div><label class="lbl">Repite</label>' +
            '<input class="in m" type="number" min="0" step="1" data-ca="' + i + '|repite" value="' +
            (f.repite === undefined ? 1 : f.repite) + '"></div>' +
          '<div><label class="lbl">Bornas</label>' +
            '<input type="checkbox" data-cachk="' + i + '"' + (f.bornas ? " checked" : "") +
            ' style="margin-top:8px"></div>' +
        '</div></div>';
    }).join("");

    formCA = '<div class="card"><div class="chd"><span class="ct">Cableados</span>' +
      '<span class="cn">' + filasCA.length + (filasCA.length === 1 ? " acometida" : " acometidas") + '</span></div>' +
      '<div class="cbd">' + (bloquesCA || '<p style="margin:0 0 12px;font-size:13px;color:var(--ink2)">Sin acometidas todav\u00eda.</p>') +
      '<button class="btn" id="masCA">+ Agregar acometida</button></div></div>';
  }

  /* --- formulario de tableros --- */
  var filasTA = datos.TA || [];
  var formTA = "";
  if (act.cod.indexOf("TA") >= 0) {
    var bloquesTA = filasTA.map(function (f, i) {
      var op = opcionesTablero(cat, f.familia);
      var selT = function (campo, valor, opciones, deshab) {
        return '<select class="in" data-ta="' + i + '|' + campo + '"' + (deshab ? " disabled" : "") + '>' +
          '<option value="">' + (deshab ? "\u2014" : "Elegir\u2026") + '</option>' +
          opciones.map(function (o) {
            return '<option' + (txt(o) === txt(valor) ? " selected" : "") + '>' + esc(o) + '</option>';
          }).join("") + '</select>';
      };

      var prots = (f.prot || []).map(function (pr, j) {
        var opp = opcionesTablero(cat, pr.familia);
        var selP = function (campo, valor, opciones, deshab) {
          return '<select class="in" data-tap="' + i + '|' + j + '|' + campo + '"' + (deshab ? " disabled" : "") + '>' +
            '<option value="">' + (deshab ? "\u2014" : "Elegir\u2026") + '</option>' +
            opciones.map(function (o) {
              return '<option' + (txt(o) === txt(valor) ? " selected" : "") + '>' + esc(o) + '</option>';
            }).join("") + '</select>';
        };
        return '<div class="g protfila" style="grid-template-columns:1fr 1.3fr 76px 62px">' +
          '<div>' + selP("familia", pr.familia, opp.protecciones, false) + '</div>' +
          '<div>' + selP("subitem", pr.subitem, opp.subitems, !pr.familia) + '</div>' +
          '<div><input class="in m" type="number" min="0" step="1" data-tap="' + i + '|' + j + '|cantidad" value="' +
            (pr.cantidad === undefined ? 1 : pr.cantidad) + '"></div>' +
          '<div><button class="btnx" data-quitaprot="' + i + '|' + j + '">Quitar</button></div>' +
        '</div>';
      }).join("");

      return '<div class="bloque">' +
        '<div class="bloque-hd"><span class="bloque-n">Tablero ' + (i + 1) + '</span>' +
          '<button class="btnx" data-quitata="' + i + '">Quitar</button></div>' +
        '<div class="g" style="grid-template-columns:1fr 1fr">' +
          '<div><label class="lbl">Tipo</label>' + selT("familia", f.familia, op.tableros, false) + '</div>' +
          '<div><label class="lbl">Configuraci\u00f3n</label>' + selT("subitem", f.subitem, op.subitems, !f.familia) + '</div>' +
        '</div>' +
        '<div class="protbloque">' +
          '<label class="lbl">Protecciones</label>' +
          (prots || '<p style="margin:0 0 8px;font-size:12px;color:var(--ink3)">Sin protecciones.</p>') +
          '<button class="btn btnmini" data-masprot="' + i + '">+ Agregar protecci\u00f3n</button>' +
        '</div>' +
      '</div>';
    }).join("");

    formTA = '<div class="card"><div class="chd"><span class="ct">Tableros</span>' +
      '<span class="cn">' + filasTA.length + (filasTA.length === 1 ? " l\u00ednea" : " l\u00edneas") + '</span></div>' +
      '<div class="cbd">' + (bloquesTA || '<p style="margin:0 0 12px;font-size:13px;color:var(--ink2)">Sin l\u00edneas todav\u00eda.</p>') +
      '<button class="btn" id="masTA">+ Agregar tablero</button></div></div>';
  }

  /* --- formulario de módulos --- */
  var filasMO = datos.mo || [];
  var formMO = "";
  if (act.cod.indexOf("mo") >= 0) {
    var subs = subfamiliasEquipo(cat);
    var bloquesMO = filasMO.map(function (f, i) {
      return '<div class="bloque">' +
        '<div class="bloque-hd"><span class="bloque-n">M\u00f3dulo ' + (i + 1) + '</span>' +
          '<button class="btnx" data-quitamo="' + i + '">Quitar</button></div>' +
        '<div class="g" style="grid-template-columns:1fr 130px">' +
          '<div><label class="lbl">\u00cdtem</label>' +
            '<select class="in" data-mo="' + i + '|item"><option value="">Elegir\u2026</option>' +
            subs.map(function (o) {
              return '<option' + (txt(o) === txt(f.item) ? " selected" : "") + '>' + esc(o) + '</option>';
            }).join("") + '</select></div>' +
          '<div><label class="lbl">Cantidad</label>' +
            '<input class="in m" type="number" min="0" step="0.01" data-mo="' + i + '|cantidad" value="' +
            (f.cantidad === undefined ? 1 : f.cantidad) + '"></div>' +
        '</div></div>';
    }).join("");

    formMO = '<div class="card"><div class="chd"><span class="ct">M\u00f3dulos</span>' +
      '<span class="cn">' + filasMO.length + (filasMO.length === 1 ? " l\u00ednea" : " l\u00edneas") + '</span></div>' +
      '<div class="cbd">' + (bloquesMO || '<p style="margin:0 0 12px;font-size:13px;color:var(--ink2)">Sin l\u00edneas todav\u00eda.</p>') +
      '<button class="btn" id="masMO">+ Agregar m\u00f3dulo</button></div></div>';
  }

  /* --- apartados aún no portados --- */
  var listos = ["TU", "EQ", "TA", "CA", "SA", "mo"];
  var pendientes = act.cod.filter(function (c) { return listos.indexOf(c) < 0; });
  var avisoPend = pendientes.length
    ? '<div class="note"><div class="notet">Apartados en camino</div><div class="noteb">' +
      'Este análisis también usa ' + pendientes.map(function (c) {
        var a = APARTADOS.find(function (x) { return x.id === c; });
        return a ? a.nombre.toLowerCase() : c;
      }).join(" y ") + '. Todavía no está el motor de ' +
      (pendientes.length === 1 ? "ese apartado" : "esos apartados") +
      ', así que la composición de abajo va incompleta.</div></div>'
    : "";

  /* --- composición: siempre visible, con su estado --- */
  var comp = componerAnalisis(cat, datos, p, act.apu);
  var mgA = margenesDe(p, act.apu);
  var val = valorizar(cat, comp.lineas, mgA, p);
  var cuerpoComp;

  if (comp.lineas.length) {
    var filaLinea = function (l) {
      var celPrecio;
      if (l.falta) {
        celPrecio = '<input class="in m inprecio" type="number" min="0" step="1" ' +
          'data-poner="' + esc(l.cod) + '" placeholder="poner precio">';
      } else {
        celPrecio = cop(l.precio) +
          (l.base && Math.abs(l.precio - l.base) > 0.5
            ? '<div class="base">costo ' + cop(l.base) + '</div>' : "");
      }
      return '<tr' + (l.mo ? ' class="morow"' : "") + (l.ajustada ? ' data-aj="1"' : "") + '>' +
        '<td class="num"><input class="in m incant' + (l.ajustada ? " tocada" : "") + '" type="number" ' +
          'min="0" step="0.0001" data-ajcant="' + esc(l.cod) + '" value="' + l.cant + '"' +
          (l.ajustada ? ' title="Cantidad ajustada. Original: ' + dec(l.cantOrig) + '"' : "") + '></td>' +
        '<td class="m" style="font-size:12px">' + esc(l.cod) + (l.f075 ? ' <span class="f75">·75%</span>' : "") +
          (l.ajustada ? ' <span class="ajmarca" title="ajustada">±</span>' : "") + '</td>' +
        '<td>' + esc(l.desc) + '</td>' +
        '<td style="color:var(--ink3);font-size:12px">' + esc(l.und) + '</td>' +
        '<td style="text-align:center">' + (l.enCatalogo && !l.mo
          ? '<input class="in m indesp" type="number" min="0" max="50" step="1" data-desp="' + esc(l.cod) +
            '" value="' + (l.desp || "") + '" placeholder="0" title="Desperdicio %">' : "") + '</td>' +
        '<td class="num">' + celPrecio + '</td>' +
        '<td class="num">' + (l.falta ? "—" : cop(l.total)) + '</td>' +
        '<td style="text-align:center">' +
          (l.ajustada ? '<button class="btnx" data-ajrest="' + esc(l.cod) + '" title="Volver a la cantidad del catálogo">Volver</button>'
                      : '<button class="btnx btnxdel" data-ajquita="' + esc(l.cod) + '" title="Quitar de este análisis">Quitar</button>') +
        '</td>' +
      '</tr>';
    };

    var secc = function (titulo, arr, extra) {
      if (!arr.length && !extra) return "";
      return '<tr class="seccrow"><td colspan="8">' + titulo + '</td></tr>' + arr.join("") + (extra || "");
    };
    var filasMat = val.lineas.filter(function (l) { return !l.mo; }).map(filaLinea).join("");
    var filasMo = val.lineas.filter(function (l) { return l.mo; }).map(filaLinea).join("");
    var filasTh =
      (val.lineas.length
        ? '<tr><td class="num"></td><td class="m" style="font-size:12px">TR1</td>' +
          '<td>Transportes</td><td style="color:var(--ink3);font-size:12px"></td><td></td>' +
          '<td class="num"><input class="in m indesp" type="number" min="0" max="100" step="0.5" ' +
            'data-ovpct="transporte" value="' + (val.ovTrans === undefined || val.ovTrans === "" ? "" : val.ovTrans) +
            '" placeholder="' + dec(p.margenes.transporte || 0) + '" title="Excepción para este análisis"></td>' +
          '<td class="num">' + cop(val.transporte) + '</td><td></td></tr>' +
          '<tr><td class="num"></td><td class="m" style="font-size:12px">HER1</td>' +
          '<td>Herramienta de mano</td><td style="color:var(--ink3);font-size:12px"></td><td></td>' +
          '<td class="num"><input class="in m indesp" type="number" min="0" max="100" step="0.5" ' +
            'data-ovpct="herramienta" value="' + (val.ovHerr === undefined || val.ovHerr === "" ? "" : val.ovHerr) +
            '" placeholder="' + dec(p.margenes.herramienta || 0) + '" title="Excepción para este análisis"></td>' +
          '<td class="num">' + cop(val.herramienta) + '</td><td></td></tr>'
        : "");

    cuerpoComp = '<div class="scroll"><table class="tbl"><thead><tr>' +
        '<th class="num" style="width:78px">Cant.</th><th style="width:104px">Código</th>' +
        '<th>Descripción</th><th style="width:52px">Und</th>' +
        '<th style="width:52px;text-align:center" title="Desperdicio">Desp.</th>' +
        '<th class="num" style="width:100px">Vr. venta</th><th class="num" style="width:94px">Vr. total</th>' +
        '<th style="width:56px"><span class="sr">Acciones</span></th>' +
      '</tr></thead><tbody>' +
        secc("I · Materiales", [filasMat]) +
        (filasTh ? secc("II · Transporte y herramienta", [], filasTh) : "") +
        secc("III · Mano de obra", [filasMo]) +
      '</tbody></table></div>' +
      '<div class="cbd" style="border-top:1px solid var(--line2)">' +
        (comp.quitadas ? '<div class="note" style="margin:0 0 13px"><div class="notet">Líneas quitadas</div>' +
          '<div class="noteb">Se quitaron ' + comp.quitadas + ' insumos de este análisis. ' +
          'No se tocó el catálogo, solo este APU. ' +
          '<button class="btn btnmini" id="ajlimpiar" style="margin-left:6px">Devolver todo</button></div></div>' : "") +
        (val.sinPrecio ? '<div class="err" style="margin-bottom:13px">' + val.sinPrecio +
          (val.sinPrecio === 1 ? " insumo no tiene precio" : " insumos no tienen precio") +
          ' en el catálogo. El total de abajo está incompleto.</div>' : "") +
        (function () {
          var esSep = (p.forma || "junta") === "separada";
          if (esSep) {
            var mg = p.margenes || {};
            var pA = (mg.admin || 0) / 100, pI = (mg.imprev || 0) / 100;
            var pU = (mg.util || 0) / 100, pV = (mg.iva || 0) / 100;
            var aiuT = pA + pI + pU + pU * pV;
            var matDisp = pV > 0 ? val.matConTh * (1 + aiuT) / (1 + pV) : val.matConTh * (1 + aiuT);
            var ivaMat = matDisp * pV;
            var moDisp = val.mo * (1 + aiuT);
            return '<div class="dl">' +
              '<div class="dlr"><span class="dlk">Suministro</span><span class="dlv m">' + cop(matDisp) + '</span></div>' +
              '<div class="dlr"><span class="dlk">IVA ' + (mg.iva || 0) + '%</span><span class="dlv m">' + cop(ivaMat) + '</span></div>' +
              '<div class="dlr"><span class="dlk">Mano de obra</span><span class="dlv m">' + cop(moDisp) + '</span></div>' +
              '<div class="dlr dltot"><span class="dlk">Costo directo</span>' +
                '<span class="dlv m">' + cop(val.unitario) + '</span></div>' +
            '</div>';
          }
          return '<div class="dl">' +
            '<div class="dlr"><span class="dlk">Subtotal materiales</span><span class="dlv m">' + cop(val.mat) + '</span></div>' +
            (val.th > 0 ? '<div class="dlr"><span class="dlk">Transporte y herramienta</span>' +
              '<span class="dlv m">' + cop(val.th) + '</span></div>' : "") +
            '<div class="dlr"><span class="dlk">Subtotal mano de obra</span><span class="dlv m">' + cop(val.mo) + '</span></div>' +
            '<div class="dlr dltot"><span class="dlk">Costo directo</span>' +
              '<span class="dlv m">' + cop(val.unitario) + '</span></div>' +
          '</div>';
        })() +
        '<div class="aporte">' + act.items.map(function (x) {
            return '<div class="dlr"><span class="dlk">' + esc(x.item) + ' · ' + fmt(x.cant) + ' ' + esc(x.und) +
              '</span><span class="dlv m">' + cop(val.unitario * (Number(x.cant) || 0)) + '</span></div>';
          }).join("") +
          (act.items.length > 1 ? '<div class="dlr dltot"><span class="dlk">Aporte al proyecto</span>' +
            '<span class="dlv m">' + cop(act.items.reduce(function (t, x) {
              return t + val.unitario * (Number(x.cant) || 0); }, 0)) + '</span></div>' : "") +
        '</div>' +
        (val.directo > 0 ? '<div class="ok" style="margin-top:13px">La mano de obra pesa ' +
          val.pesoMo + '% del costo directo.</div>' : "") +
      '</div>';
  } else if (!filasTU.length && !filasEQ.length && !filasTA.length && !filasMO.length && !filasCA.length && !filasSA.length) {
    cuerpoComp = '<div class="empty">Agrega una línea arriba y la composición aparece aquí.</div>';
  } else {
    var faltan = [];
    filasTU.forEach(function (f, i) {
      var pend = [];
      if (!f.material) pend.push("material");
      if (!f.tipo) pend.push("instalación");
      if (!f.diam) pend.push("diámetro");
      if (pend.length) faltan.push("Tubería " + (i + 1) + ": falta " + pend.join(", "));
    });
    cuerpoComp = '<div class="empty">' +
      (faltan.length ? esc(faltan.join(" · ")) : "No hay insumos para esta combinación.") + '</div>';
  }

  var tabla = '<div class="card"><div class="chd"><span class="ct">Cómo queda el análisis</span>' +
    '<span class="cn">' + (comp.lineas.length ? comp.lineas.length + " insumos" : "sin datos") + '</span></div>' +
    cuerpoComp + '</div>';

  var reglas = comp.reglas.length
    ? '<div class="note"><div class="notet">Reglas aplicadas</div><div class="noteb">' +
      comp.reglas.join(" ") + '</div></div>' : "";

  var avisos = comp.avisos.length
    ? '<div class="card"><div class="cbd"><div class="err">' + comp.avisos.map(esc).join("<br>") +
      '</div></div></div>' : "";

  var nota = (p.notasApu || {})[act.apu] || "";

  var cantTotal = act.items.reduce(function (s, x) { return s + (Number(x.cant) || 0); }, 0);
  var undTotal = act.items[0] ? act.items[0].und : "";
  return '<div class="card"><div class="chd">' +
      '<span class="ct">APU ' + act.apu + ' · ' + act.cod.join(" + ") + '</span>' +
      '<span class="cn">Cantidad total: <strong style="color:var(--ink)">' + fmt(cantTotal) + " " + esc(undTotal) +
        '</strong> · ' + act.items.length + (act.items.length === 1 ? " ítem" : " ítems") + '</span></div>' +
      '<div class="cbd"><p style="margin:0;font-size:13px;color:var(--ink2)">' +
        act.items.map(function (x) { return esc(x.desc); }).join("<br>") + '</p>' +
        '<div class="m" style="font-size:11px;color:var(--ink3);margin-top:7px">' +
        act.items.map(function (x) { return fmt(x.cant) + " " + esc(x.und); }).join("  ·  ") + '</div>' +
      '</div></div>' +
    avisoPend + formSA + formCA + formTU + formEQ + formTA + formMO + reglas + avisos + tabla +
    '<div class="card"><div class="chd"><span class="ct">Consideraciones del análisis</span></div>' +
      '<div class="cbd"><textarea class="in" id="notaapu" ' +
      'placeholder="Por qué se armó así, qué se asumió, qué quedó por fuera.">' + esc(nota) + '</textarea></div></div>' +

    '<div class="card"><div class="chd"><span class="ct">Análisis guardados</span>' +
      '<span class="cn">' + Plantillas.leer().length + '</span></div><div class="cbd">' +
      '<div class="btnrow" style="margin-bottom:12px">' +
        '<button class="btn" id="guardaplan">Guardar este armado</button>' +
        '<button class="btn" id="verplan">' + (vista.verPlan ? "Ocultar" : "Usar uno guardado") + '</button>' +
      '</div>' +
      (vista.verPlan
        ? (Plantillas.leer().length
          ? '<div class="planlista">' + Plantillas.leer().map(function (pl) {
              var partes = [];
              ["CA", "TU", "TA", "EQ", "SA", "mo"].forEach(function (k) {
                if (pl.datos[k] && pl.datos[k].length) partes.push(k + " " + pl.datos[k].length);
              });
              return '<div class="planitem"><div><div class="plann">' + esc(pl.nombre) + '</div>' +
                '<div class="planm m">' + partes.join(" · ") + ' · ' + fecha(pl.fecha.slice(0, 10)) + '</div></div>' +
                '<div class="btnrow">' +
                  '<button class="btn btnmini" data-usaplan="' + pl.id + '">Usar</button>' +
                  '<button class="btnx btnxdel" data-quitaplan="' + pl.id + '">Borrar</button>' +
                '</div></div>';
            }).join("") + '</div>'
          : '<p style="margin:0;font-size:13px;color:var(--ink2)">Todavía no hay ninguno guardado. ' +
            'Arma un análisis y pulsa Guardar este armado para reutilizarlo después.</p>')
        : "") +
    '</div></div>';
}

/* Redibuja solo el panel derecho: así el resto de la página no se destruye
   y no se pierden los clics que el usuario esté haciendo en otra parte */
function refrescarPanel(p, foco) {
  var cat = Catalogo.leer();
  var act = apuActivo(p);
  if (!act || !cat) return;

  var panel = document.getElementById("panelapu");
  if (panel) {
    var html;
    try { html = panelApu(p, cat, act); }
    catch (e) {
      avisoError("Al dibujar el análisis: " + (e && e.message ? e.message : e));
      html = '<div class="card"><div class="cbd"><div class="err">No se pudo dibujar este análisis. ' +
        'El detalle está en el aviso de abajo.</div></div></div>';
    }
    panel.innerHTML = html;
    try { enlazarPanel(p); } catch (e) { avisoError("Al conectar los controles: " + (e && e.message ? e.message : e)); }
  }

  var lst = document.getElementById("listaapu");
  if (lst) { lst.innerHTML = listaApu(p, filtrarApus(analisisDe(p)), act); enlazarLista(p); }

  if (foco) {
    var el = document.querySelector('[data-tu="' + foco + '"]');
    if (el) { el.focus(); if (el.select) try { el.select(); } catch (e) {} }
  }
}

function enlazarLista(p) {
  Array.prototype.forEach.call(document.querySelectorAll("[data-apu]"), function (b) {
    b.onclick = function () { vista.apu = Number(b.dataset.apu); refrescarPanel(p); };
  });

  var fa = document.getElementById("filtroapu");
  if (fa) fa.oninput = function () {
    vista.filtroApu = this.value;
    var pos = this.selectionStart;
    var y = window.scrollY;
    render();
    window.scrollTo(0, y);
    var n = document.getElementById("filtroapu");
    if (n) { n.focus(); n.setSelectionRange(pos, pos); }
  };
}

function enlazarPanel(p) {
  var act = apuActivo(p);
  if (!act) return;

  var mas = document.getElementById("masTU");
  if (mas) mas.onclick = function () {
    var d = datosDe(p, act.apu);
    if (!d.TU) d.TU = [];
    d.TU.push({ material: "", tipo: "", diam: "", cantidad: 1 });
    Store.guardar(p); refrescarPanel(p);
  };

  Array.prototype.forEach.call(document.querySelectorAll("[data-quitatu]"), function (b) {
    b.onclick = function () {
      var d = datosDe(p, act.apu);
      d.TU.splice(Number(b.dataset.quitatu), 1);
      Store.guardar(p); refrescarPanel(p);
    };
  });

  Array.prototype.forEach.call(document.querySelectorAll("[data-tu]"), function (el) {
    var clave = el.dataset.tu;
    var partes = clave.split("|");
    var campo = partes[1];

    var aplicar = function (redibuja) {
      var d = datosDe(p, act.apu);
      var fila = d.TU && d.TU[Number(partes[0])];
      if (!fila) return;
      var valor = campo === "cantidad" ? (Number(el.value) || 0) : el.value;
      if (fila[campo] === valor) return;
      fila[campo] = valor;
      /* Al cambiar el material o la instalación caducan las opciones que dependían */
      if (campo === "material") { fila.tipo = ""; fila.diam = ""; }
      if (campo === "tipo") { fila.diam = ""; }
      Store.guardar(p);
      if (redibuja) refrescarPanel(p, campo === "cantidad" ? clave : null);
    };

    if (el.tagName === "SELECT") {
      el.onchange = function () { aplicar(true); };
    } else {
      /* Solo al salir del campo o al pulsar Enter: guardar en cada tecla
         obliga a serializar todo el proyecto y vuelve lenta la escritura. */
      el.onchange = function () { aplicar(true); };
      el.onkeydown = function (e) { if (e.key === "Enter") { e.preventDefault(); el.blur(); } };
    }
  });

  /* --- equipos --- */
  var masE = document.getElementById("masEQ");
  if (masE) masE.onclick = function () {
    var d = datosDe(p, act.apu);
    if (!d.EQ) d.EQ = [];
    d.EQ.push({ familia: "", subfamilia: "", manoObra: "", crearItem: false, nombreItem: "", codItem: "" });
    Store.guardar(p); refrescarPanel(p);
  };
  Array.prototype.forEach.call(document.querySelectorAll("[data-quitaeq]"), function (b) {
    b.onclick = function () {
      var d = datosDe(p, act.apu);
      d.EQ.splice(Number(b.dataset.quitaeq), 1);
      Store.guardar(p); refrescarPanel(p);
    };
  });
  Array.prototype.forEach.call(document.querySelectorAll("[data-eqchk]"), function (c) {
    c.onchange = function () {
      var d = datosDe(p, act.apu);
      var f = d.EQ[Number(c.dataset.eqchk)];
      if (!f) return;
      f.crearItem = c.checked;
      if (!c.checked) { f.codItem = ""; }
      Store.guardar(p); refrescarPanel(p);
    };
  });
  Array.prototype.forEach.call(document.querySelectorAll("[data-eq]"), function (el) {
    var partes = el.dataset.eq.split("|"), campo = partes[1];
    var aplicar = function () {
      var d = datosDe(p, act.apu);
      var f = d.EQ && d.EQ[Number(partes[0])];
      if (!f) return;
      var valor = el.value;
      if (f[campo] === valor) return;
      f[campo] = valor;
      /* si cambió el precio o la unidad de un ítem propio ya creado, aplicarlo de una vez */
      if ((campo === "precio" || campo === "unidad") && f.crearItem && f.codItem) {
        registrarPropio(p, f);
      }
      if (campo === "familia") { f.subfamilia = ""; }
      Store.guardar(p); refrescarPanel(p);
    };
    el.onchange = aplicar;
    if (el.tagName === "INPUT") el.onkeydown = function (e) {
      if (e.key === "Enter") { e.preventDefault(); el.blur(); }
    };
  });

  /* --- salidas --- */
  var masS = document.getElementById("masSA");
  if (masS) masS.onclick = function () {
    var d = datosDe(p, act.apu);
    if (!d.SA) d.SA = [];
    d.SA.push({ aparato: "", modo: "normal", mat1: "", tubo1: "", pct1: 100,
                mat2: "", tubo2: "", pct2: "", calibreCable: "", matCable: "",
                multCable: 1, estrato: 2, promedio: 1, caja: "cuadrada", sinInstalacion: false });
    Store.guardar(p); refrescarPanel(p);
  };
  Array.prototype.forEach.call(document.querySelectorAll("[data-quitasa]"), function (b) {
    b.onclick = function () {
      var d = datosDe(p, act.apu);
      d.SA.splice(Number(b.dataset.quitasa), 1);
      Store.guardar(p); refrescarPanel(p);
    };
  });
  Array.prototype.forEach.call(document.querySelectorAll("[data-sachk]"), function (c) {
    c.onchange = function () {
      var d = datosDe(p, act.apu);
      var f = d.SA[Number(c.dataset.sachk)];
      if (!f) return;
      f.sinInstalacion = c.checked;
      Store.guardar(p); refrescarPanel(p);
    };
  });
  Array.prototype.forEach.call(document.querySelectorAll("[data-sa]"), function (el) {
    var q = el.dataset.sa.split("|"), campo = q[1];
    var numericos = ["pct1", "pct2", "multCable", "estrato", "promedio"];
    el.onchange = function () {
      var d = datosDe(p, act.apu);
      var f = d.SA && d.SA[Number(q[0])];
      if (!f) return;
      f[campo] = numericos.indexOf(campo) >= 0 ? (el.value === "" ? "" : Number(el.value) || 0) : el.value;
      Store.guardar(p); refrescarPanel(p);
    };
    if (el.tagName === "INPUT") el.onkeydown = function (e) {
      if (e.key === "Enter") { e.preventDefault(); el.blur(); }
    };
  });

  /* --- porcentajes de transporte y herramienta --- */
  ["pt", "ph"].forEach(function (idc) {
    var el = document.getElementById(idc);
    if (!el) return;
    el.onchange = function () {
      p.margenes[idc === "pt" ? "transporte" : "herramienta"] = Number(el.value) || 0;
      Store.guardar(p); refrescarPanel(p);
    };
    el.onkeydown = function (e) { if (e.key === "Enter") { e.preventDefault(); el.blur(); } };
  });

  /* --- excepción de transporte y herramienta en este análisis --- */
  Array.prototype.forEach.call(document.querySelectorAll("[data-ovpct]"), function (el) {
    el.onchange = function () {
      var d = datosDe(p, act.apu);
      if (!d.pct) d.pct = {};
      d.pct[el.dataset.ovpct] = el.value === "" ? null : Number(el.value) || 0;
      Store.guardar(p); refrescarPanel(p);
    };
    el.onkeydown = function (e) { if (e.key === "Enter") { e.preventDefault(); el.blur(); } };
  });

  /* --- desperdicio por insumo --- */
  Array.prototype.forEach.call(document.querySelectorAll("[data-desp]"), function (el) {
    el.onchange = function () {
      var c = Catalogo.leer();
      var ix = Catalogo.indice(c);
      var i = ix[el.dataset.desp];
      if (i === undefined) return;
      c.items[i].desp = Number(el.value) || 0;
      Catalogo.guardar(c); refrescarPanel(p);
    };
    el.onkeydown = function (e) { if (e.key === "Enter") { e.preventDefault(); el.blur(); } };
  });

  /* --- cableados --- */
  var masC = document.getElementById("masCA");
  if (masC) masC.onclick = function () {
    var d = datosDe(p, act.apu);
    if (!d.CA) d.CA = [];
    var met = 0, rep = 0;
    analisisDe(p).forEach(function (a) {
      if (a.apu === act.apu) {
        rep = a.items.length;
        a.items.forEach(function (it) { met += Number(it.cant) || 0; });
      }
    });
    d.CA.push({ nombre: "", fase: "", cantFase: "", neutro: "", cantNeutro: "",
                tierra: "", cantTierra: "", metrado: met || 1, repite: rep || 1, bornas: false });
    Store.guardar(p); refrescarPanel(p);
  };
  Array.prototype.forEach.call(document.querySelectorAll("[data-quitaca]"), function (b) {
    b.onclick = function () {
      var d = datosDe(p, act.apu);
      d.CA.splice(Number(b.dataset.quitaca), 1);
      Store.guardar(p); refrescarPanel(p);
    };
  });
  Array.prototype.forEach.call(document.querySelectorAll("[data-cachk]"), function (c) {
    c.onchange = function () {
      var d = datosDe(p, act.apu);
      var f = d.CA[Number(c.dataset.cachk)];
      if (!f) return;
      f.bornas = c.checked;
      Store.guardar(p); refrescarPanel(p);
    };
  });
  Array.prototype.forEach.call(document.querySelectorAll("[data-ca]"), function (el) {
    var q = el.dataset.ca.split("|"), campo = q[1];
    el.onchange = function () {
      var d = datosDe(p, act.apu);
      var f = d.CA && d.CA[Number(q[0])];
      if (!f) return;
      f[campo] = (campo.indexOf("cant") === 0 || campo === "metrado" || campo === "repite")
        ? (Number(el.value) || 0) : el.value;
      Store.guardar(p); refrescarPanel(p);
    };
    if (el.tagName === "INPUT") el.onkeydown = function (e) {
      if (e.key === "Enter") { e.preventDefault(); el.blur(); }
    };
  });

  /* --- ajustes por línea del análisis --- */
  var ajDe = function () {
    var d = datosDe(p, act.apu);
    if (!d.ajustes) d.ajustes = {};
    return d.ajustes;
  };
  Array.prototype.forEach.call(document.querySelectorAll("[data-ajcant]"), function (el) {
    el.onchange = function () {
      var aj = ajDe(), cod = el.dataset.ajcant;
      aj[cod] = aj[cod] || {};
      aj[cod].cant = el.value === "" ? null : Number(el.value) || 0;
      Store.guardar(p); refrescarPanel(p);
    };
    el.onkeydown = function (e) { if (e.key === "Enter") { e.preventDefault(); el.blur(); } };
  });
  Array.prototype.forEach.call(document.querySelectorAll("[data-ajquita]"), function (b) {
    b.onclick = function () {
      var aj = ajDe(), cod = b.dataset.ajquita;
      aj[cod] = aj[cod] || {};
      aj[cod].quitado = true;
      Store.guardar(p); refrescarPanel(p);
    };
  });
  Array.prototype.forEach.call(document.querySelectorAll("[data-ajrest]"), function (b) {
    b.onclick = function () {
      var aj = ajDe();
      delete aj[b.dataset.ajrest];
      Store.guardar(p); refrescarPanel(p);
    };
  });
  var ajl = document.getElementById("ajlimpiar");
  if (ajl) ajl.onclick = function () {
    var d = datosDe(p, act.apu);
    d.ajustes = {};
    Store.guardar(p); refrescarPanel(p);
  };

  /* --- tableros --- */
  var masT = document.getElementById("masTA");
  if (masT) masT.onclick = function () {
    var d = datosDe(p, act.apu);
    if (!d.TA) d.TA = [];
    d.TA.push({ familia: "", subitem: "", prot: [] });
    Store.guardar(p); refrescarPanel(p);
  };
  Array.prototype.forEach.call(document.querySelectorAll("[data-quitata]"), function (b) {
    b.onclick = function () {
      var d = datosDe(p, act.apu);
      d.TA.splice(Number(b.dataset.quitata), 1);
      Store.guardar(p); refrescarPanel(p);
    };
  });
  Array.prototype.forEach.call(document.querySelectorAll("[data-masprot]"), function (b) {
    b.onclick = function () {
      var d = datosDe(p, act.apu);
      var f = d.TA[Number(b.dataset.masprot)];
      if (!f) return;
      if (!f.prot) f.prot = [];
      f.prot.push({ familia: "", subitem: "", cantidad: 1 });
      Store.guardar(p); refrescarPanel(p);
    };
  });
  Array.prototype.forEach.call(document.querySelectorAll("[data-quitaprot]"), function (b) {
    b.onclick = function () {
      var q = b.dataset.quitaprot.split("|");
      var d = datosDe(p, act.apu);
      var f = d.TA[Number(q[0])];
      if (!f || !f.prot) return;
      f.prot.splice(Number(q[1]), 1);
      Store.guardar(p); refrescarPanel(p);
    };
  });
  Array.prototype.forEach.call(document.querySelectorAll("[data-ta]"), function (el) {
    var q = el.dataset.ta.split("|"), campo = q[1];
    el.onchange = function () {
      var d = datosDe(p, act.apu);
      var f = d.TA && d.TA[Number(q[0])];
      if (!f) return;
      f[campo] = el.value;
      if (campo === "familia") f.subitem = "";
      Store.guardar(p); refrescarPanel(p);
    };
  });
  Array.prototype.forEach.call(document.querySelectorAll("[data-tap]"), function (el) {
    var q = el.dataset.tap.split("|"), campo = q[2];
    el.onchange = function () {
      var d = datosDe(p, act.apu);
      var f = d.TA && d.TA[Number(q[0])];
      if (!f || !f.prot) return;
      var pr = f.prot[Number(q[1])];
      if (!pr) return;
      pr[campo] = campo === "cantidad" ? (Number(el.value) || 0) : el.value;
      if (campo === "familia") pr.subitem = "";
      Store.guardar(p); refrescarPanel(p);
    };
    if (el.tagName === "INPUT") el.onkeydown = function (e) {
      if (e.key === "Enter") { e.preventDefault(); el.blur(); }
    };
  });

  /* --- módulos --- */
  var masM = document.getElementById("masMO");
  if (masM) masM.onclick = function () {
    var d = datosDe(p, act.apu);
    if (!d.mo) d.mo = [];
    d.mo.push({ item: "", cantidad: 1 });
    Store.guardar(p); refrescarPanel(p);
  };
  Array.prototype.forEach.call(document.querySelectorAll("[data-quitamo]"), function (b) {
    b.onclick = function () {
      var d = datosDe(p, act.apu);
      d.mo.splice(Number(b.dataset.quitamo), 1);
      Store.guardar(p); refrescarPanel(p);
    };
  });
  Array.prototype.forEach.call(document.querySelectorAll("[data-mo]"), function (el) {
    var partes = el.dataset.mo.split("|"), campo = partes[1];
    el.onchange = function () {
      var d = datosDe(p, act.apu);
      var f = d.mo && d.mo[Number(partes[0])];
      if (!f) return;
      f[campo] = campo === "cantidad" ? (Number(el.value) || 0) : el.value;
      Store.guardar(p); refrescarPanel(p);
    };
    if (el.tagName === "INPUT") el.onkeydown = function (e) {
      if (e.key === "Enter") { e.preventDefault(); el.blur(); }
    };
  });

  /* --- poner precio a un insumo desde el análisis --- */
  Array.prototype.forEach.call(document.querySelectorAll("[data-poner]"), function (el) {
    el.onchange = function () {
      fijarPrecio(p, el.dataset.poner, el.value);
      refrescarPanel(p);
    };
    el.onkeydown = function (e) { if (e.key === "Enter") { e.preventDefault(); el.blur(); } };
  });
  Array.prototype.forEach.call(document.querySelectorAll("[data-imp]"), function (c) {
    c.onchange = function () {
      var cat = Catalogo.leer();
      var idx = Catalogo.indice(cat);
      var i = idx[c.dataset.imp];
      if (i === undefined) return;
      cat.items[i].imp = c.checked;
      Catalogo.guardar(cat); refrescarPanel(p);
    };
  });

  var gp = document.getElementById("guardaplan");
  if (gp) gp.onclick = function () {
    var d = datosDe(p, act.apu);
    var tiene = ["CA", "TU", "TA", "EQ", "SA", "mo"].some(function (k) { return d[k] && d[k].length; });
    if (!tiene) { avisoError("Este análisis todavía no tiene nada armado."); return; }
    var n = prompt("¿Con qué nombre lo guardas?", act.items[0] ? act.items[0].desc.slice(0, 60) : "Análisis " + act.apu);
    if (!n) return;
    if (Plantillas.agregar(n, d)) { avisoOk("Guardado. Ya lo puedes usar en cualquier proyecto."); refrescarPanel(p); }
  };
  var vp = document.getElementById("verplan");
  if (vp) vp.onclick = function () { vista.verPlan = !vista.verPlan; refrescarPanel(p); };
  Array.prototype.forEach.call(document.querySelectorAll("[data-usaplan]"), function (b) {
    b.onclick = function () {
      var pl = null;
      Plantillas.leer().forEach(function (x) { if (x.id === b.dataset.usaplan) pl = x; });
      if (!pl) return;
      var d = datosDe(p, act.apu);
      var hay = ["CA", "TU", "TA", "EQ", "SA", "mo"].some(function (k) { return d[k] && d[k].length; });
      if (hay && !confirm("Este análisis ya tiene datos. Se reemplazan por los del guardado. ¿Seguir?")) return;
      p.datosApu[act.apu] = JSON.parse(JSON.stringify(pl.datos));
      Store.guardar(p);
      vista.verPlan = false;
      refrescarPanel(p);
      avisoOk("Se aplicó el armado de " + pl.nombre + ".");
    };
  });
  Array.prototype.forEach.call(document.querySelectorAll("[data-quitaplan]"), function (b) {
    b.onclick = function () {
      if (!confirm("Se borra ese análisis guardado. ¿Seguir?")) return;
      Plantillas.quitar(b.dataset.quitaplan); refrescarPanel(p);
    };
  });

  var nt = document.getElementById("notaapu");
  if (nt) nt.onblur = function () {
    if (!p.notasApu) p.notasApu = {};
    p.notasApu[act.apu] = this.value;
    Store.guardar(p);
  };
}

function enlazarApartados(p) {
  var ic = document.getElementById("ircat");
  if (ic) { ic.onclick = function () { ir({ pantalla: "catalogo" }); }; return; }
  enlazarLista(p);
  enlazarPanel(p);
}

