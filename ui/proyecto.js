"use strict";


function renderProyectos() {
  var lista = Store.todos();
  var filas = lista.map(function (p) {
    var r = resumen(p);
    return '<div class="prow">' +
      '<button class="pabrir" data-abrir="' + p.id + '">' +
        '<div class="pn">' + esc(p.nombre) + '</div>' +
        '<div class="pc">' + esc(p.cliente || "sin cliente") +
          (p.ciudad ? " · " + esc(p.ciudad) : "") +
          " · entrega " + fecha(p.entrega) + '</div>' +
      '</button>' +
      '<div class="pstats">' +
        '<div style="text-align:right"><div class="mk">Ítems</div><div class="m" style="font-size:15px;color:var(--navy)">' + r.items + '</div></div>' +
        '<div style="text-align:right"><div class="mk">Análisis</div><div class="m" style="font-size:15px;color:var(--navy)">' + r.analisis + '</div></div>' +
        '<div style="width:84px"><div class="bar"><div class="barf" style="width:' + r.avance + '%"></div></div>' +
          '<div class="m" style="font-size:11px;color:var(--ink3);margin-top:4px;text-align:right">' + r.avance + '%</div></div>' +
        '<span class="badge' + (r.avance === 100 ? "" : " act") + '">' + (r.avance === 100 ? "Completo" : "En armado") + '</span>' +
        '<button class="btnx" data-resp="' + p.id + '" title="Descargar respaldo">Respaldo</button>' +
        '<button class="btnx btnxdel" data-borrar="' + p.id + '" title="Borrar proyecto">Borrar</button>' +
      '</div></div>';
  }).join("");

  app.innerHTML = barraTop("proyectos") +
    '<header class="top"><div class="wrap topin">' +
      '<div class="marca">' +
        '<a class="logo" href="https://www.lutec.com.co/" target="_blank" rel="noopener">' +
          '<img src="logo.png" alt="Lutec, soluciones brillantes" width="58" height="58">' +
        '</a>' +
        '<div><div class="brand">Cotización eléctrica</div>' +
        '<h1 class="d h1">Proyectos</h1>' +
        '<div class="sub">Cada proyecto guarda su anexo, sus análisis y su oferta · ' +
        '<a class="enlace" href="https://www.lutec.com.co/" target="_blank" rel="noopener">lutec.com.co</a></div></div>' +
      '</div>' +
      '<div class="btnrow">' +
        '<button class="btn" id="exportall">Respaldo completo</button>' +
        '<button class="btn" id="importar">Restaurar</button>' +
        '<button class="btn btnp" id="nuevo">Nuevo proyecto</button>' +
      '</div>' +
    '</div></header>' +
    '<main class="wrap main">' +
      (lista.length
        ? '<div class="card">' + filas + '</div>'
        : '<div class="card"><div class="empty">' +
          '<div class="dropt">Todavía no hay proyectos</div>' +
          'Crea el primero y sube el anexo de cantidades del cliente.</div></div>') +
      '<div class="note"><div class="notet">Cómo llevarlo a otro equipo</div>' +
      '<div class="noteb"><strong>Respaldo completo</strong> baja un archivo con el catálogo, los precios ' +
      'y todos los proyectos. En el otro equipo, abre la misma dirección y pulsa <strong>Restaurar</strong>. ' +
      'Queda todo igual. Ten en cuenta que no es sincronización: si los dos trabajan a la vez, cada uno ' +
      'avanza por su lado y el último respaldo que se restaure pisa al otro.</div></div>' +
      '<input type="file" id="fimport" accept="application/json,.json" class="hide">' +
    '</main>';

  enlazarTop();
  document.getElementById("nuevo").onclick = function () {
    vista.borrador = { nombre: "", cliente: "", ciudad: "", recibo: hoy(), entrega: "",
                       constructora: "", encargado: "", entregaObs: "", tipo: "", hojas: null, archivo: "" };
    ir({ pantalla: "nuevo" });
  };
  document.getElementById("exportall").onclick = function () {
    var paquete = {
      formato: "apu-respaldo",
      version: 1,
      fecha: new Date().toISOString(),
      catalogo: Catalogo.leer(),
      proyectos: Store.todos(),
      historial: Historial.leer(),
      plantillas: Plantillas.leer()
    };
    var blob = new Blob([JSON.stringify(paquete)], { type: "application/json" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "respaldo_apu_" + hoy() + ".json";
    a.click(); URL.revokeObjectURL(a.href);
  };

  document.getElementById("importar").onclick = function () { document.getElementById("fimport").click(); };
  document.getElementById("fimport").onchange = function (e) {
    var f = e.target.files[0]; if (!f) return;
    var fr = new FileReader();
    fr.onload = function () {
      var datos;
      try { datos = JSON.parse(fr.result); }
      catch (err) { avisoError("Ese archivo no se pudo leer como respaldo."); return; }

      /* Respaldo completo */
      if (datos && datos.formato === "apu-respaldo") {
        var nP = (datos.proyectos || []).length;
        var nI = datos.catalogo && datos.catalogo.items ? datos.catalogo.items.length : 0;
        if (!confirm("Este respaldo trae " + nP + (nP === 1 ? " proyecto" : " proyectos") +
                     " y un catálogo de " + nI + " insumos.\n\n" +
                     "Se reemplaza todo lo que haya en este navegador. ¿Seguir?")) return;
        try {
          if (datos.catalogo) Catalogo.guardar(datos.catalogo);
          _cacheProy = (datos.proyectos || []).map(normalizarProyecto);
          localStorage.setItem(CLAVE, JSON.stringify(_cacheProy));
          if (datos.historial) localStorage.setItem(CLAVE_HIST, JSON.stringify(datos.historial));
          if (datos.plantillas) Plantillas.guardar(datos.plantillas);
          ir({ pantalla: "proyectos", tope: 150 });
        } catch (err) {
          avisoError("No se pudo restaurar: " + (err && err.message ? err.message : err) +
            ". Puede ser falta de espacio en el navegador.");
        }
        return;
      }

      /* Respaldo de un solo proyecto */
      if (datos && datos.id && datos.nombre) {
        datos.id = id();
        Store.guardar(datos); render();
        return;
      }
      avisoError("Ese archivo no es un respaldo válido de esta aplicación.");
    };
    fr.readAsText(f);
  };
  Array.prototype.forEach.call(document.querySelectorAll("[data-abrir]"), function (b) {
    b.onclick = function () {
      var pid = b.dataset.abrir;
      var abrir = function () {
        var pp = Store.leer(pid);
        if (pp) pp.baseModificado = pp.modificado;   /* referencia para detectar conflictos al guardar */
        ir({ pantalla: "proyecto", pid: pid, paso: "ficha", hoja: 0, sel: [], apu: null });
        Sync.avisarAbierto(pid);
      };
      if (Sync.encendida()) {
        Sync.quienAbrio(pid).then(function (q) {
          if (q && q.quien) {
            if (!confirm(q.quien + " tiene este proyecto abierto (hace " + q.minutos + " min). " +
              "Pueden pisarse los cambios si trabajan a la vez. ¿Abrir de todos modos?")) return;
          }
          Sync.bajarProyecto(pid).then(abrir);
        });
      } else abrir();
    };
  });
  Array.prototype.forEach.call(document.querySelectorAll("[data-borrar]"), function (b) {
    b.onclick = function () {
      var p = Store.leer(b.dataset.borrar);
      if (!p) return;
      if (confirm('Se borra "' + p.nombre + '" de este navegador y no se puede deshacer.\n\n' +
                  'Si aún lo necesitas, descarga primero el respaldo. ¿Borrar de todos modos?')) {
        Store.borrar(b.dataset.borrar);
        render();
      }
    };
  });
  Array.prototype.forEach.call(document.querySelectorAll("[data-resp]"), function (b) {
    b.onclick = function () {
      var p = Store.leer(b.dataset.resp);
      if (!p) return;
      var blob = new Blob([JSON.stringify(p, null, 2)], { type: "application/json" });
      var a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = p.nombre.replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "_") + ".json";
      a.click(); URL.revokeObjectURL(a.href);
    };
  });
}

/* ---- 7.2 Nuevo proyecto ---- */

function renderNuevo() {
  var b = vista.borrador;
  var listo = b.nombre.trim() !== "" && b.hojas;

  var resumenAnexo = "";
  if (b.hojas) {
    var totalItems = 0, totalCap = 0;
    b.hojas.forEach(function (h) {
      h.filas.forEach(function (f) { if (f.tipo === "it") totalItems++; else totalCap++; });
    });
    resumenAnexo =
      '<div class="file"><span>' + esc(b.archivo) + '</span><span class="fw m">' + b.hojas.length + ' hojas</span></div>' +
      '<div class="ok" style="margin-top:10px">' + totalItems + ' ítems con cantidad y ' + totalCap +
      ' capítulos. El emparejamiento de columnas se confirma en el paso 2.</div>';
  }

  app.innerHTML =
    '<div class="tira"><div class="wrap tirain">' +
      '<button class="tirab" id="volver">← Todos los proyectos</button>' +
      '<span class="tiran">Nuevo proyecto</span>' +
    '</div></div>' +
    '<header class="top"><div class="wrap topin"><div>' +
      '<h1 class="d h1">Nuevo proyecto</h1>' +
      '<div class="sub">Los datos y los archivos quedan juntos desde el principio</div>' +
    '</div></div></header>' +
    '<main class="wrap main"><div class="g g2">' +
      '<div class="card"><div class="chd"><span class="ct">Datos del proyecto</span></div><div class="cbd">' +
        '<div class="field"><label class="lbl" for="n-nom">Nombre</label>' +
          '<input class="in" id="n-nom" value="' + esc(b.nombre) + '" placeholder="Palermo · redes urbanismo"></div>' +
        '<div class="g" style="grid-template-columns:1fr 1fr;margin-bottom:13px">' +
          '<div><label class="lbl" for="n-cli">Cliente</label><input class="in" id="n-cli" value="' + esc(b.cliente) + '"></div>' +
          '<div><label class="lbl" for="n-ciu">Ciudad</label><input class="in" id="n-ciu" value="' + esc(b.ciudad) + '"></div>' +
        '</div>' +
        '<div class="g" style="grid-template-columns:1fr 1fr;margin-bottom:13px">' +
          '<div><label class="lbl" for="n-con">Constructora</label><input class="in" id="n-con" value="' + esc(b.constructora || "") + '"></div>' +
          '<div><label class="lbl" for="n-tip">Tipo de proyecto</label>' +
            '<select class="in" id="n-tip">' +
            ["", "Residencial", "Comercial", "Público", "Provisión", "Industrial"].map(function (o) {
              return '<option' + ((b.tipo || "") === o ? " selected" : "") + '>' + esc(o) + '</option>';
            }).join("") + '</select></div>' +
        '</div>' +
        '<div class="field"><label class="lbl" for="n-enc">Encargado del presupuesto</label>' +
          '<input class="in" id="n-enc" value="' + esc(b.encargado || "") + '"></div>' +
        '<div class="g" style="grid-template-columns:1fr 1fr;margin-bottom:13px">' +
          '<div><label class="lbl" for="n-rec">Recibo del anexo</label><input class="in m" type="date" id="n-rec" value="' + esc(b.recibo) + '"></div>' +
          '<div><label class="lbl" for="n-ent">Entrega de la oferta</label><input class="in m" type="date" id="n-ent" value="' + esc(b.entrega) + '"></div>' +
        '</div>' +
        '<div><label class="lbl" for="n-obs">Entrega de observaciones</label>' +
          '<input class="in m" type="date" id="n-obs" value="' + esc(b.entregaObs || "") + '"></div>' +
      '</div></div>' +
      '<div>' +
        '<div class="card"><div class="chd"><span class="ct">Anexo de cantidades</span><span class="cn">Obligatorio</span></div>' +
        '<div class="cbd" id="zona">' +
          (b.hojas ? resumenAnexo :
            '<button class="drop" id="drop"><div class="dropt">Soltar el Excel del cliente</div>' +
            '<div class="dropn">xlsx o xlsm · se lee tal como llegó</div></button>') +
          '<input type="file" id="fanexo" accept=".xlsx,.xlsm,.xls" class="hide">' +
        '</div></div>' +
        '<button class="btn btnp" id="crear" style="width:100%"' + (listo ? "" : " disabled") + '>' +
          'Crear proyecto y leer el anexo</button>' +
      '</div>' +
    '</div></main>';

  function recoger() {
    b.nombre = document.getElementById("n-nom").value;
    b.cliente = document.getElementById("n-cli").value;
    b.ciudad = document.getElementById("n-ciu").value;
    b.recibo = document.getElementById("n-rec").value;
    b.entrega = document.getElementById("n-ent").value;
    var g = function (x) { var e = document.getElementById(x); return e ? e.value : ""; };
    b.constructora = g("n-con"); b.encargado = g("n-enc");
    b.entregaObs = g("n-obs"); b.tipo = g("n-tip");
  }
  document.getElementById("volver").onclick = function () { recoger(); ir({ pantalla: "proyectos" }); };
  document.getElementById("n-nom").oninput = function () {
    b.nombre = this.value;
    document.getElementById("crear").disabled = !(b.nombre.trim() && b.hojas);
  };

  var input = document.getElementById("fanexo");
  var drop = document.getElementById("drop");
  if (drop) {
    drop.onclick = function () { input.click(); };
    ["dragenter", "dragover"].forEach(function (ev) {
      drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.add("over"); });
    });
    ["dragleave", "drop"].forEach(function (ev) {
      drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.remove("over"); });
    });
    drop.addEventListener("drop", function (e) {
      if (e.dataTransfer.files[0]) cargarAnexo(e.dataTransfer.files[0], recoger);
    });
  }
  input.onchange = function (e) { if (e.target.files[0]) cargarAnexo(e.target.files[0], recoger); };

  document.getElementById("crear").onclick = function () {
    recoger();
    if (!b.nombre.trim() || !b.hojas) return;
    var p = {
      id: id(), nombre: b.nombre.trim(), cliente: b.cliente, ciudad: b.ciudad,
      recibo: b.recibo, entrega: b.entrega, archivo: b.archivo, hojas: b.hojas,
      constructora: b.constructora || "", encargado: b.encargado || "",
      entregaObs: b.entregaObs || "", tipo: b.tipo || "", check: {},
      consideraciones: "", costoDirecto: 0,
      margenes: { rent: 10, dolar: 19, admin: 8, imprev: 2, util: 5, iva: 19, transporte: 1, herramienta: 2 },
      forma: "junta",
      creado: new Date().toISOString()
    };
    Store.guardar(p);
    ir({ pantalla: "proyecto", pid: p.id, paso: "anexo", hoja: 0, sel: [] });
  };
}

function cargarAnexo(file, recoger) {
  recoger();
  var b = vista.borrador;
  var fr = new FileReader();
  fr.onload = function () {
    try {
      b.hojas = leerLibro(new Uint8Array(fr.result));
      b.archivo = file.name;
      render();
    } catch (e) {
      alert("No se pudo leer ese archivo. Revisa que sea un Excel válido.");
    }
  };
  fr.readAsArrayBuffer(file);
}

/* ---- 7.3 Proyecto: cascarón ---- */

function renderProyecto() {
  var p = Store.leer(vista.pid);
  if (!p) return ir({ pantalla: "proyectos" });
  var r = resumen(p);

  var pasos = PASOS.map(function (s) {
    return '<button class="step" data-paso="' + s.id + '" aria-current="' + (vista.paso === s.id) + '">' +
      '<span class="stepn">' + ("0" + s.n).slice(-2) + '</span>' + s.nombre + '</button>';
  }).join("");

  var cuerpo =
    vista.paso === "ficha" ? vFicha(p, r) :
    vista.paso === "anexo" ? vAnexo(p) :
    vista.paso === "armado" ? vArmado(p, r) :
    vista.paso === "apartados" ? vApartados(p) :
    vista.paso === "insumos" ? vInsumos(p) : vEntrega(p);

  app.innerHTML =
    '<div class="tira"><div class="wrap tirain">' +
      '<button class="tirab" id="volver">← Todos los proyectos</button>' +
      '<button class="tirab" id="otro">+ Nuevo proyecto</button>' +
      '<span class="tiran">' + esc(p.nombre) + '</span>' +
    '</div></div>' +
    '<header class="top"><div class="wrap topin"><div>' +
      '<h1 class="d h1">' + esc(p.nombre) + '</h1>' +
      '<div class="sub">' + esc(p.cliente || "sin cliente") + (p.ciudad ? " · " + esc(p.ciudad) : "") + '</div>' +
    '</div><div class="meta">' +
      '<div><div class="mk">Entrega</div><div class="mv m">' + fecha(p.entrega) + '</div></div>' +
      '<div><div class="mk">Avance</div><div class="mv m">' + r.avance + '%</div></div>' +
    '</div></div></header>' +
    '<nav class="nav" aria-label="Pasos del proyecto"><div class="wrap navin">' + pasos + '</div></nav>' +
    '<main class="wrap main">' + cuerpo + '</main>';

  document.getElementById("volver").onclick = function () { ir({ pantalla: "proyectos", sel: [] }); };
  document.getElementById("otro").onclick = function () {
    vista.borrador = { nombre: "", cliente: "", ciudad: "", recibo: hoy(), entrega: "",
                       constructora: "", encargado: "", entregaObs: "", tipo: "", hojas: null, archivo: "" };
    ir({ pantalla: "nuevo" });
  };
  Array.prototype.forEach.call(document.querySelectorAll("[data-paso]"), function (b) {
    b.onclick = function () { ir({ paso: b.dataset.paso, sel: [] }); };
  });

  if (vista.paso === "ficha") enlazarFicha(p);
  if (vista.paso === "anexo") enlazarAnexo(p);
  if (vista.paso === "armado") enlazarArmado(p);
  if (vista.paso === "apartados") enlazarApartados(p);
  if (vista.paso === "insumos") enlazarInsumos(p);
  if (vista.paso === "entrega") enlazarEntrega(p);
}

/* ---- 7.4 Paso 1: ficha ---- */

function vFicha(p, r) {
  var cat = Catalogo.leer();
  var t = totalesProyecto(p, cat);
  var mg = p.margenes;
  if (mg.rent === undefined) mg.rent = 10;
  if (mg.dolar === undefined) mg.dolar = 19;

  var campos = [["admin", "Administración"], ["imprev", "Imprevistos"],
                ["util", "Utilidad"], ["iva", "IVA s/ utilidad"]]
    .map(function (c) {
      return '<div><label class="lbl" for="mg-' + c[0] + '">' + c[1] + ' %</label>' +
        '<input class="in m" type="number" min="0" max="100" step="0.5" id="mg-' + c[0] +
        '" data-mg="' + c[0] + '" value="' + mg[c[0]] + '"></div>';
    }).join("");

  var estado = "";
  if (!cat) estado = '<div class="err">Falta cargar el catálogo de insumos. Sin él no se puede valorizar nada.</div>';
  else if (t.sinValor) estado = '<div class="note" style="margin:0"><div class="notet">Lo que falta</div>' +
    '<div class="noteb">' + t.sinValor + ' de ' + (t.conValor + t.sinValor) +
    ' ítems todavía no tienen valor, porque su análisis está sin armar o sin precios. ' +
    'El total de abajo solo cuenta los ' + t.conValor + ' que sí lo tienen.</div></div>';
  else if (t.faltantes) estado = '<div class="note" style="margin:0"><div class="notet">Precios pendientes</div>' +
    '<div class="noteb">Hay ' + t.faltantes + ' insumos sin precio repartidos entre los análisis. ' +
    'El total va incompleto hasta que se llenen.</div></div>';
  else if (t.subtotal > 0) estado = '<div class="ok">Todos los ítems tienen valor y todos los insumos tienen precio.</div>';

  return '<div class="card"><div class="cbd">' +
      '<div class="kpi" style="margin-bottom:13px">' +
        '<div class="kc"><div class="kk">Avance</div><div class="kv">' + r.avance + '%</div></div>' +
        '<div class="kc"><div class="kk">Ítems</div><div class="kv">' + r.items + '</div></div>' +
        '<div class="kc"><div class="kk">Análisis</div><div class="kv">' + r.analisis + '</div></div>' +
        '<div class="kc"><div class="kk">Con valor</div><div class="kv">' + t.conValor + '</div></div>' +
        '<div class="kc"><div class="kk">% Mano de obra</div><div class="kv">' +
          (t.subtotal > 0 ? Math.round((t.subMo / t.subtotal) * 100) : 0) + '%</div></div>' +
      '</div><div class="bar"><div class="barf" style="width:' + r.avance + '%"></div></div>' +
    '</div></div>' +

    '<div class="g g2">' +
      '<div class="card"><div class="chd"><span class="ct">Datos y fechas</span></div><div class="cbd">' +
        '<div class="g" style="grid-template-columns:1fr 1fr;margin-bottom:13px">' +
          '<div><label class="lbl" for="f-con">Constructora</label>' +
            '<input class="in" id="f-con" value="' + esc(p.constructora || "") + '"></div>' +
          '<div><label class="lbl" for="f-enc">Encargado</label>' +
            '<input class="in" id="f-enc" value="' + esc(p.encargado || "") + '"></div>' +
        '</div>' +
        '<div class="g" style="grid-template-columns:1fr 1fr;margin-bottom:13px">' +
          '<div><label class="lbl" for="f-rec">Recibo del anexo</label>' +
            '<input class="in m" type="date" id="f-rec" value="' + esc(p.recibo || "") + '"></div>' +
          '<div><label class="lbl" for="f-obs">Entrega de observaciones</label>' +
            '<input class="in m" type="date" id="f-obs" value="' + esc(p.entregaObs || "") + '"></div>' +
        '</div>' +
        '<div><label class="lbl" for="f-ent">Entrega de la oferta</label>' +
          '<input class="in m" type="date" id="f-ent" value="' + esc(p.entrega || "") + '"></div>' +
      '</div></div>' +
      '<div class="card"><div class="chd"><span class="ct">Anexo</span></div><div class="cbd">' +
        '<div class="file"><span>' + esc(p.archivo || "sin archivo") + '</span>' +
          '<span class="fw m">' + (p.hojas ? p.hojas.length + " hojas" : "—") + '</span></div>' +
        '<div class="btnrow" style="margin-top:10px">' +
          '<button class="btn" id="respaldo">Descargar respaldo</button>' +
          '<button class="btn" id="borrar">Borrar proyecto</button>' +
        '</div>' +
      '</div></div>' +
    '</div>' +

    '<div class="card"><div class="chd"><span class="ct">Lista de verificación</span>' +
      '<span class="cn">' + CHECK.filter(function (c, j) { return (p.check || {})[j]; }).length +
      ' de ' + CHECK.length + '</span></div><div class="cbd">' +
      '<div class="checklist">' + CHECK.map(function (c, j) {
        var hecho = (p.check || {})[j];
        return '<label class="chkitem' + (hecho ? " on" : "") + '">' +
          '<input type="checkbox" data-chk="' + j + '"' + (hecho ? " checked" : "") + '>' +
          '<span class="chkn">' + (j + 1) + '</span><span>' + esc(c) + '</span></label>';
      }).join("") + '</div></div></div>' +

    '<div class="card"><div class="chd"><span class="ct">Consideraciones del proyecto</span>' +
      '<span class="cn">Van a la carta de oferta</span></div><div class="cbd">' +
      '<textarea class="in" id="f-cons" placeholder="Condiciones acordadas, exclusiones, criterios técnicos.">' +
      esc(p.consideraciones || "") + '</textarea></div></div>' +

    '<div class="card"><div class="chd"><span class="ct">Valor de la oferta</span>' +
      '<span class="cn">Se recalcula con cada análisis</span></div><div class="cbd">' +
      (estado ? estado + '<div style="height:15px"></div>' : "") +
      '<div class="g" style="grid-template-columns:repeat(auto-fit,minmax(104px,1fr));margin-bottom:17px">' + campos + '</div>' +
      '<div class="dl">' +
        '<div class="dlr"><span class="dlk">Subtotal · costo directo</span><span class="dlv m">' + cop(t.subtotal) + '</span></div>' +
        '<div class="dlr"><span class="dlk">Administración</span><span class="dlv m">' + cop(t.admin) + '</span></div>' +
        '<div class="dlr"><span class="dlk">Imprevistos</span><span class="dlv m">' + cop(t.imprev) + '</span></div>' +
        '<div class="dlr"><span class="dlk">Utilidad</span><span class="dlv m">' + cop(t.util) + '</span></div>' +
        '<div class="dlr"><span class="dlk">IVA sobre utilidad</span><span class="dlv m">' + cop(t.iva) + '</span></div>' +
        '<div class="dlr dltot"><span class="dlk">Valor total</span><span class="dlv m">' + cop((p.forma || "junta") === "separada" ? t.totalSep : t.total) + '</span></div>' +
      '</div>' +
      '<div class="ok" style="margin-top:13px">La rentabilidad y el IVA se montan sobre el precio de cada insumo: ' +
      'costo dividido entre uno menos el factor. Administración, imprevistos, utilidad e IVA van una sola vez ' +
      'sobre el subtotal.</div>' +
    '</div></div>' +

    '<div class="card" style="margin-top:12px"><div class="cbd">' +
      '<div class="notet">Versiones guardadas</div>' +
      '<div class="btnrow">' +
        '<button class="btn" id="btnSnap">Guardar versión actual</button>' +
        '<button class="btn" id="btnSnapList">Ver versiones</button>' +
      '</div>' +
      '<div id="snapLista"></div>' +
    '</div></div>';
}

function enlazarFicha(p) {
  function guardar() { Store.guardar(p); }
  document.getElementById("f-rec").onchange = function () { p.recibo = this.value; guardar(); };
  ["f-con:constructora", "f-enc:encargado", "f-obs:entregaObs"].forEach(function (par) {
    var q = par.split(":"), el = document.getElementById(q[0]);
    if (el) el.onchange = function () { p[q[1]] = this.value; guardar(); };
  });
  Array.prototype.forEach.call(document.querySelectorAll("[data-chk]"), function (c) {
    c.onchange = function () {
      if (!p.check) p.check = {};
      p.check[c.dataset.chk] = c.checked;
      guardar(); render();
    };
  });
  document.getElementById("f-ent").onchange = function () { p.entrega = this.value; guardar(); render(); };
  document.getElementById("f-cons").onblur = function () { p.consideraciones = this.value; guardar(); };
  Array.prototype.forEach.call(document.querySelectorAll("[data-mg]"), function (el) {
    el.oninput = function () { p.margenes[el.dataset.mg] = Number(el.value) || 0; guardar(); render(); };
  });
  document.getElementById("respaldo").onclick = function () {
    var blob = new Blob([JSON.stringify(p, null, 2)], { type: "application/json" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = p.nombre.replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "_") + ".json";
    a.click(); URL.revokeObjectURL(a.href);
  };
  document.getElementById("borrar").onclick = function () {
    if (confirm("Se borra el proyecto de este navegador. ¿Seguir?")) {
      Store.borrar(p.id); ir({ pantalla: "proyectos" });
    }
  };

  var btnSnap = document.getElementById("btnSnap");
  if (btnSnap) btnSnap.onclick = function () {
    var etiqueta = prompt("Nombre para esta versión (opcional):", "");
    Sync.crearSnapshot(p.id, etiqueta || "Versión " + new Date().toLocaleDateString()).then(function (ok) {
      if (ok) avisoOk("Versión guardada.");
      else avisoError("No se pudo guardar la versión.");
    });
  };

  var btnList = document.getElementById("btnSnapList");
  if (btnList) btnList.onclick = function () {
    var div = document.getElementById("snapLista");
    if (!div) return;
    div.innerHTML = '<div class="note" style="margin:0"><div class="noteb">Cargando…</div></div>';
    Sync.listarSnapshots(p.id).then(function (lista) {
      if (!lista.length) { div.innerHTML = '<p>No hay versiones guardadas.</p>'; return; }
      var html = '<div class="scroll"><table class="tbl"><tr><th>Fecha</th><th>Etiqueta</th><th>Editor</th><th></th></tr>';
      lista.forEach(function (s) {
        html += '<tr><td>' + esc(s.fecha.slice(0, 16).replace("T", " ")) + '</td>' +
          '<td>' + esc(s.etiqueta || "") + '</td>' +
          '<td>' + esc(s.editor || "") + '</td>' +
          '<td><button class="btn btnmini" data-snaprest="' + esc(s.ts) + '">Restaurar</button> ' +
          '<button class="btn btnmini" data-snapdl="' + esc(s.ts) + '">Descargar</button></td></tr>';
      });
      html += '</table></div>';
      div.innerHTML = html;
      Array.prototype.forEach.call(div.querySelectorAll("[data-snaprest]"), function (b) {
        b.onclick = function () {
          if (!confirm("Restaurar esta versión reemplaza el proyecto actual. ¿Continuar?")) return;
          Sync.restaurarSnapshot(p.id, b.dataset.snaprest).then(function (ok) {
            if (ok) { avisoOk("Proyecto restaurado."); render(); }
            else avisoError("No se pudo restaurar.");
          });
        };
      });
      Array.prototype.forEach.call(div.querySelectorAll("[data-snapdl]"), function (b) {
        b.onclick = function () { Sync.descargarSnapshot(p.id, b.dataset.snapdl); };
      });
    });
  };
}

/* ---- 7.5 Paso 2: anexo ---- */

function vAnexo(p) {
  if (!p.hojas) return '<div class="card"><div class="empty">Este proyecto no tiene anexo cargado.</div></div>';

  var pestanas = p.hojas.map(function (h, i) {
    var n = h.filas ? h.filas.filter(function (f) { return f.tipo === "it"; }).length : 0;
    return '<button class="tab" data-hoja="' + i + '" aria-pressed="' + (vista.hoja === i) + '">' +
      esc(h.nombre) + ' · ' + n + '</button>';
  }).join("");

  var h = p.hojas[vista.hoja];
  if (!h) return '<div class="card"><div class="empty">Hoja no encontrada.</div></div>';

  var cuerpo;
  if (!h.ok) {
    cuerpo = '<div class="err">No se encontró una fila de encabezado en esta hoja. ' +
      'Suele pasar con hojas de portada o de cálculo interno del cliente.</div>';
  } else {
    var opciones = function (rolActual) {
      var o = '<option value=""' + (rolActual ? "" : " selected") + '>No usar</option>';
      ROLES.forEach(function (r) {
        o += '<option value="' + r.id + '"' + (rolActual === r.id ? " selected" : "") + '>' + r.nombre + '</option>';
      });
      return o;
    };
    var filas = h.columnas.map(function (c) {
      return '<tr><td class="m" style="font-size:12px">' + esc(c.nombre) + '</td>' +
        '<td><select class="in" data-col="' + c.i + '">' + opciones(c.rol) + '</select></td></tr>';
    }).join("");

    var nIt = h.filas.filter(function (f) { return f.tipo === "it"; }).length;
    var nCap = h.filas.length - nIt;

    cuerpo =
      (vista.avisoRelectura
        ? '<div class="ok" style="margin-bottom:14px">' + esc(vista.avisoRelectura) + '</div>'
        : '<div class="ok" style="margin-bottom:14px">Encabezado en la fila ' + (h.encabezado + 1) +
          '. Se reconocieron ' + Object.keys(h.mapa).length + ' columnas.</div>') +
      '<div class="g" style="grid-template-columns:150px 1fr;margin-bottom:14px;align-items:end">' +
        '<div><label class="lbl" for="filaenc">Fila del encabezado</label>' +
          '<input class="in m" type="number" min="1" id="filaenc" value="' + (h.encabezado + 1) + '"></div>' +
        '<div style="font-size:12px;color:var(--ink3);padding-bottom:8px">' +
          'Si la tabla arranca en otra fila, cámbiala y vuelve a leer.</div>' +
      '</div>' +
      '<label class="lbl">' +
        '<input type="checkbox" id="usar" ' + (h.usar ? "checked" : "") + '> Usar esta hoja en el proyecto</label>' +
      '<div class="kpi" style="grid-template-columns:repeat(3,1fr);margin:14px 0 18px">' +
        '<div class="kc"><div class="kk">Capítulos</div><div class="kv">' + nCap + '</div></div>' +
        '<div class="kc"><div class="kk">Ítems</div><div class="kv">' + nIt + '</div></div>' +
        '<div class="kc"><div class="kk">Descartadas</div><div class="kv">' + (h.descartadas || 0) + '</div></div>' +
      '</div>' +
      '<label class="lbl">Columnas encontradas</label>' +
      '<div class="scroll"><table class="tbl"><thead><tr>' +
        '<th style="width:46%">En el archivo</th><th>Corresponde a</th></tr></thead>' +
        '<tbody>' + filas + '</tbody></table></div>' +
      '<div class="btnrow" style="margin-top:16px"><button class="btn btnp" id="releer">Volver a leer con este mapeo</button></div>';
  }

  return '<div class="card"><div class="chd"><span class="ct">Anexo del cliente</span>' +
      '<span class="cn m">' + esc(p.archivo) + '</span></div>' +
      '<div class="cbd" style="padding-bottom:12px">' +
        '<div class="tabs">' + pestanas + '</div>' +
        '<div class="btnrow" style="margin-top:12px">' +
          '<button class="btn" id="resubir">Reemplazar archivo del anexo</button>' +
          '<input type="file" id="fresubir" accept=".xlsx,.xlsm,.xls,.csv" class="hide">' +
        '</div>' +
      '</div>' +
      '<div class="cbd" style="border-top:1px solid var(--line2)">' + cuerpo + '</div></div>' +
    '<div class="note"><div class="notet">Cómo se separan capítulos de ítems</div>' +
    '<div class="noteb">Una fila es un ítem cuando tiene unidad y cantidad. Si le falta alguna de las dos, ' +
    'se toma como capítulo y encabeza el bloque. Las filas de notas se descartan.</div></div>';
}

function enlazarAnexo(p) {
  Array.prototype.forEach.call(document.querySelectorAll("[data-hoja]"), function (b) {
    b.onclick = function () { ir({ hoja: Number(b.dataset.hoja), avisoRelectura: null }); };
  });

  var resubir = document.getElementById("resubir");
  var finput = document.getElementById("fresubir");
  if (resubir && finput) {
    resubir.onclick = function () { finput.click(); };
    finput.onchange = function (e) {
      var file = e.target.files[0]; if (!file) return;
      var fr = new FileReader();
      fr.onload = function () {
        try {
          var hojasNuevas = leerLibro(new Uint8Array(fr.result));

          /* Guardar el armado actual por item+descripción para reponerlo */
          var previo = {};
          (p.hojas || []).forEach(function (h) {
            (h.filas || []).forEach(function (f) {
              if (f.tipo === "it" && (f.apu || (f.cod && f.cod.length))) {
                previo[(f.item || "") + "|" + (f.desc || "")] = { cod: f.cod || [], apu: f.apu || null };
              }
            });
          });

          /* Reponer el armado en el archivo nuevo donde coincida */
          var rescatados = 0;
          hojasNuevas.forEach(function (h) {
            (h.filas || []).forEach(function (f) {
              if (f.tipo !== "it") return;
              var v = previo[(f.item || "") + "|" + (f.desc || "")];
              if (v) { f.cod = v.cod.slice(); f.apu = v.apu; rescatados++; }
            });
          });

          if (!confirm("El archivo nuevo tiene " +
              hojasNuevas.reduce(function (s, h) { return s + (h.filas ? h.filas.filter(function (x) { return x.tipo === "it"; }).length : 0); }, 0) +
              " ítems. Se conserva el armado de " + rescatados + " que coinciden por ítem y descripción.\\n\\n" +
              "Los análisis ya compuestos (datosApu) se mantienen. ¿Reemplazar el anexo?")) return;

          p.hojas = hojasNuevas;
          p.archivo = file.name;
          Store.guardar(p);
          ir({ hoja: 0, avisoRelectura: "Anexo reemplazado. Se conservó el armado de " + rescatados + " ítems." });
        } catch (err) {
          avisoError("No se pudo leer el archivo: " + (err && err.message ? err.message : err));
        }
      };
      fr.readAsArrayBuffer(file);
    };
  }

  var usar = document.getElementById("usar");
  if (usar) usar.onchange = function () { p.hojas[vista.hoja].usar = this.checked; Store.guardar(p); render(); };

  var releer = document.getElementById("releer");
  if (releer) releer.onclick = function () {
    var h = p.hojas[vista.hoja];
    var mapa = {};
    Array.prototype.forEach.call(document.querySelectorAll("[data-col]"), function (x) {
      if (x.value) mapa[x.value] = Number(x.dataset.col);
    });
    if (mapa.desc === undefined || mapa.und === undefined || mapa.cant === undefined) {
      avisoError("Hacen falta al menos descripción, unidad y cantidad para poder leer los ítems.");
      return;
    }
    if (!h.crudas) {
      avisoError("Esta hoja se cargó con una versión anterior y no guardó el archivo original. " +
        "Vuelve a subir el anexo desde el paso 2 para poder remapear.");
      return;
    }

    var fEnc = document.getElementById("filaenc");
    var hdr = fEnc ? Math.max(0, Number(fEnc.value) - 1) : h.encabezado;

    /* Se conserva el trabajo hecho: apartados y número de análisis por código de ítem */
    var previo = {};
    (h.filas || []).forEach(function (f) {
      if (f.tipo === "it" && (f.apu || (f.cod && f.cod.length))) {
        previo[f.item + "|" + f.desc] = { cod: f.cod || [], apu: f.apu || null };
      }
    });

    var nuevas = extraerFilas(h.crudas, hdr, mapa);
    var rescatados = 0;
    nuevas.forEach(function (f) {
      if (f.tipo !== "it") return;
      var v = previo[f.item + "|" + f.desc];
      if (v) { f.cod = v.cod; f.apu = v.apu; rescatados++; }
    });

    var nIt = nuevas.filter(function (f) { return f.tipo === "it"; }).length;
    if (!nIt) {
      avisoError("Con ese mapeo no se encontró ningún ítem con unidad y cantidad. Revisa las columnas.");
      return;
    }

    h.mapa = mapa;
    h.encabezado = hdr;
    h.filas = nuevas;
    h.descartadas = h.crudas.length - hdr - 1 - nuevas.length;
    h.columnas = (h.crudas[hdr] || []).map(function (v, i) {
      var rol = null;
      Object.keys(mapa).forEach(function (k) { if (mapa[k] === i) rol = k; });
      return { i: i, nombre: txt(v), rol: rol };
    }).filter(function (c) { return c.nombre !== ""; });
    h.usar = nIt > 0;
    Store.guardar(p);
    vista.avisoRelectura = "Se leyeron " + nIt + " ítems" +
      (rescatados ? " y se conservó el armado de " + rescatados + "." : ".");
    render();
  };
}

/* ---- 7.6 Paso 3: armado ---- */

function vArmado(p, r) {
  var cat = Catalogo.leer();
  var t = cat ? totalesProyecto(p, cat) : { porApu: {} };
  var sep = (p.forma || "junta") === "separada";
  var mg = p.margenes || {};
  var pA = (mg.admin || 0) / 100, pI = (mg.imprev || 0) / 100;
  var pU = (mg.util || 0) / 100, pV = (mg.iva || 0) / 100;
  var aiuTotal = pA + pI + pU + pU * pV;
  var matItem = function (v) { return pV > 0 ? v * (1 + aiuTotal) / (1 + pV) : v * (1 + aiuTotal); };
  var verPct = !!vista.verPctMatMo;
  var verTot = vista.verTotales !== false; // default true

  var pestanas = p.hojas.map(function (h, i) {
    if (!h.usar) return "";
    return '<button class="tab" data-hoja="' + i + '" aria-pressed="' + (vista.hoja === i) + '">' + esc(h.nombre) + '</button>';
  }).join("");

  var h = p.hojas[vista.hoja];
  if (!h || !h.usar) {
    return '<div class="card"><div class="cbd"><div class="tabs">' + pestanas + '</div></div>' +
      '<div class="empty">Esta hoja no está incluida en el proyecto. Actívala en el paso 2.</div></div>';
  }

  var filtro = (vista.filtroArmado || "").toLowerCase();

  /* Cuántos ítems comparten cada análisis, en todo el proyecto */
  var cuenta = {};
  itemsDe(p).forEach(function (x) { if (x.f.apu) cuenta[x.f.apu] = (cuenta[x.f.apu] || 0) + 1; });

  var extraCols = (verPct ? 2 : 0) + (sep ? (verTot ? 4 : 2) : (verTot ? 2 : 1));
  var colspan = 7 + extraCols;
  var cuerpo = "", capPend = null, visibles = 0;
  h.filas.forEach(function (f, fi) {
    if (f.tipo === "cap") { capPend = f; return; }
    if (filtro && (f.desc || "").toLowerCase().indexOf(filtro) < 0 &&
        (f.item || "").toLowerCase().indexOf(filtro) < 0) return;
    if (capPend && !filtro) {
      cuerpo += '<tr class="caprow"><td colspan="' + colspan + '">' + esc(capPend.item) + ' · ' + esc(capPend.desc) + '</td></tr>';
      capPend = null;
    }
    visibles++;
    var k = vista.hoja + ":" + fi;
    var marcada = vista.sel.indexOf(k) >= 0;
    var comparte = f.apu && cuenta[f.apu] > 1;

    var prev = h.filas[fi - 1], next = h.filas[fi + 1];
    var antes = prev && prev.tipo === "it" && prev.apu && prev.apu === f.apu;
    var desp = next && next.tipo === "it" && next.apu && next.apu === f.apu;
    var tie = comparte ? " class=\"tie" + (!antes ? " tietop" : (desp ? "" : " tiebot")) + "\"" : "";

    var togs = APARTADOS.map(function (a) {
      return '<button class="tog" data-ap="' + k + "|" + a.id + '" aria-pressed="' +
        (f.cod.indexOf(a.id) >= 0) + '" title="' + a.nombre + '">' + a.id + '</button>';
    }).join("");

    /* precio del análisis de este ítem: unitario y total (× cantidad de este ítem) */
    var a = f.apu ? (t.porApu[f.apu] || {}) : {};
    var qf = Number(f.cant) || 0;

    var celPct = '';
    if (verPct) {
      if (!f.apu || !a.unitario || a.unitario <= 0) {
        celPct = '<td class="num">—</td><td class="num">—</td>';
      } else {
        var pctMat = Math.round((a.matConTh / a.unitario) * 100);
        var pctMo = 100 - pctMat;
        celPct = '<td class="num" style="font-size:11px;color:var(--ink2)">' + pctMat + '%</td>' +
                 '<td class="num" style="font-size:11px;color:var(--ink2)">' + pctMo + '%</td>';
      }
    }

    var celPrecio;
    if (!f.apu) {
      celPrecio = sep
        ? '<td class="num">—</td>' + (verTot ? '<td class="num">—</td>' : '') +
          '<td class="num">—</td>' + (verTot ? '<td class="num">—</td>' : '')
        : '<td class="num">—</td>' + (verTot ? '<td class="num">—</td>' : '');
    } else if (sep) {
      var matU = a.matConTh ? matItem(a.matConTh) : 0;
      celPrecio =
        '<td class="num pmat">' + (matU ? cop(matU) : "—") + '</td>' +
        (verTot ? '<td class="num pmat">' + (matU ? cop(matU * qf) : "—") + '</td>' : '') +
        '<td class="num pmo">' + (a.mo ? cop(a.mo) : "—") + '</td>' +
        (verTot ? '<td class="num pmo">' + (a.mo ? cop(a.mo * qf) : "—") + '</td>' : '');
    } else {
      celPrecio =
        '<td class="num">' + (a.unitario ? cop(a.unitario) : "—") + '</td>' +
        (verTot ? '<td class="num prtotal">' + (a.unitario ? cop(a.unitario * qf) : "—") + '</td>' : '');
    }

    cuerpo += '<tr class="itrow' + (marcada ? " sel" : "") + '" data-fila="' + k + '">' +
      '<td style="text-align:center"><input type="checkbox" data-sel="' + k + '"' + (marcada ? " checked" : "") +
        ' aria-label="Elegir ítem ' + esc(f.item) + '"></td>' +
      '<td class="m" style="font-size:12px;color:var(--ink2)">' + esc(f.item) + '</td>' +
      '<td>' + esc(f.desc) + '</td>' +
      '<td style="color:var(--ink2)">' + esc(f.und) + '</td>' +
      '<td class="num">' + fmt(f.cant) + '</td>' +
      '<td class="celtog">' + togs + '</td>' +
      '<td' + tie + '><div class="apu' + (comparte ? " apudup" : "") + '">' +
        '<input class="in m inapu" data-apunum="' + k + '" value="' + (f.apu || "") +
          '" placeholder="—" title="Escribe un número para asignar o unir análisis"></div></td>' +
      celPct + celPrecio +
    '</tr>';
  });

  if (!visibles) cuerpo = '<tr><td colspan="' + colspan + '" style="text-align:center;color:var(--ink3);padding:22px">' +
    (filtro ? "Ningún ítem coincide con “" + esc(vista.filtroArmado) + "”." : "Esta hoja no tiene ítems.") + '</td></tr>';

  var barra = vista.sel.length
    ? '<div class="bulk"><span class="bulkn">' + vista.sel.length +
      (vista.sel.length === 1 ? " ítem elegido" : " ítems elegidos") + '</span>' +
      '<button class="btn btnp" id="asignar">Dar análisis nuevo</button>' +
      '<button class="btn" id="unir"' + (vista.sel.length < 2 ? " disabled" : "") + '>Unir en un análisis</button>' +
      '<button class="btn" id="limpiar">Quitar</button>' +
      '<button class="btn" id="cancelar">Cancelar</button></div>'
    : "";

  var encPct = verPct
    ? '<th style="width:52px;text-align:right">% Mat</th><th style="width:52px;text-align:right">% MO</th>'
    : '';

  var encPrecio = sep
    ? '<th style="width:88px;text-align:right">Sumin. unit</th>' +
      (verTot ? '<th style="width:92px;text-align:right">Sumin. total</th>' : '') +
      '<th style="width:88px;text-align:right">M.O. unit</th>' +
      (verTot ? '<th style="width:92px;text-align:right">M.O. total</th>' : '')
    : '<th style="width:100px;text-align:right">Vr. unitario</th>' +
      (verTot ? '<th style="width:104px;text-align:right">Vr. total</th>' : '');

  return '<div class="card">' +
      '<div class="chd"><span class="ct">Armado de análisis</span>' +
      '<span class="cn">' + r.items + ' ítems · ' + r.analisis + ' análisis · ' + r.asignados + ' asignados</span></div>' +
      '<div class="cbd barmado">' +
        '<div class="tabs tabsfijas">' + pestanas + '</div>' +
        '<div class="togsarmado" style="display:flex;gap:16px;align-items:center;margin:8px 0">' +
          '<label class="lbl" style="font-size:12px;cursor:pointer"><input type="checkbox" id="togpct"' +
            (verPct ? ' checked' : '') + '> % Material / M.O.</label>' +
          '<label class="lbl" style="font-size:12px;cursor:pointer"><input type="checkbox" id="togtot"' +
            (verTot ? ' checked' : '') + '> Valores totales</label>' +
        '</div>' +
        '<input class="in infiltro" id="filtroarmado" placeholder="Filtrar por descripción o ítem" value="' +
          esc(vista.filtroArmado || "") + '">' +
      '</div>' +
      '<div class="scroll"><table class="tbl tblarmado"><thead><tr>' +
        '<th style="width:34px"><span class="sr">Elegir</span></th>' +
        '<th style="width:58px">Ítem</th><th>Descripción</th>' +
        '<th style="width:38px">Und</th><th style="width:56px" class="num">Cant.</th>' +
        '<th style="width:210px">Apartados</th><th style="width:54px;text-align:center">Análisis</th>' +
        encPct + encPrecio +
      '</tr></thead><tbody>' + cuerpo + '</tbody></table></div>' + barra +
    '</div>' +
    '<div class="note"><div class="notet">Cómo se usa</div>' +
    '<div class="noteb">Toca una sigla para decir a qué apartado va el ítem. Escribe el mismo número de ' +
    'análisis en dos ítems para unirlos, o usa la selección para hacerlo en grupo. El precio de la derecha ' +
    'se actualiza a medida que armas cada análisis' + (sep ? ", separado en suministro y mano de obra." : ".") + '</div></div>';
}

function enlazarArmado(p) {
  var ff = document.getElementById("filtroarmado");
  if (ff) ff.oninput = function () {
    vista.filtroArmado = this.value;
    var pos = this.selectionStart, y = window.scrollY;
    render(); window.scrollTo(0, y);
    var n = document.getElementById("filtroarmado");
    if (n) { n.focus(); n.setSelectionRange(pos, pos); }
  };
  var tp = document.getElementById("togpct");
  if (tp) tp.onchange = function () { vista.verPctMatMo = this.checked; var y = window.scrollY; render(); window.scrollTo(0, y); };
  var tt = document.getElementById("togtot");
  if (tt) tt.onchange = function () { vista.verTotales = this.checked; var y = window.scrollY; render(); window.scrollTo(0, y); };
  Array.prototype.forEach.call(document.querySelectorAll("[data-hoja]"), function (b) {
    b.onclick = function () { ir({ hoja: Number(b.dataset.hoja), sel: [] }); };
  });
  Array.prototype.forEach.call(document.querySelectorAll("[data-fila]"), function (tr) {
    tr.onclick = function (e) {
      if (e.target.closest(".tog") || e.target.closest(".inapu") || e.target.matches("[data-sel]")) return;
      var k = tr.dataset.fila, i = vista.sel.indexOf(k);
      if (i >= 0) vista.sel.splice(i, 1); else vista.sel.push(k);
      render();
    };
  });
  Array.prototype.forEach.call(document.querySelectorAll("[data-sel]"), function (c) {
    c.onchange = function () {
      var k = c.dataset.sel, i = vista.sel.indexOf(k);
      if (i >= 0) vista.sel.splice(i, 1); else vista.sel.push(k);
      render();
    };
  });
  Array.prototype.forEach.call(document.querySelectorAll("[data-apunum]"), function (el) {
    el.onchange = function () {
      var q = el.dataset.apunum.split(":");
      var f = p.hojas[Number(q[0])].filas[Number(q[1])];
      if (!f) return;
      var v = el.value.trim();
      if (v === "") { f.apu = null; }
      else {
        var n = parseInt(v, 10);
        if (isNaN(n) || n <= 0) { avisoError("El número de análisis debe ser un entero positivo."); return; }
        f.apu = n;
        if (!f.cod || !f.cod.length) f.cod = ["CA"];
      }
      Store.guardar(p); render();
    };
    el.onkeydown = function (e) { if (e.key === "Enter") { e.preventDefault(); el.blur(); } };
  });
  Array.prototype.forEach.call(document.querySelectorAll("[data-ap]"), function (b) {
    b.onclick = function (e) {
      e.stopPropagation();
      var partes = b.dataset.ap.split("|");
      var pos = partes[0].split(":");
      var f = p.hojas[Number(pos[0])].filas[Number(pos[1])];
      var ap = partes[1], i = f.cod.indexOf(ap);
      if (i >= 0) f.cod.splice(i, 1); else f.cod.push(ap);
      if (f.cod.length && !f.apu) f.apu = siguienteApu(p);
      Store.guardar(p); render();
    };
  });

  function seleccionadas() {
    return vista.sel.map(function (k) {
      var pos = k.split(":");
      return p.hojas[Number(pos[0])].filas[Number(pos[1])];
    });
  }
  var b1 = document.getElementById("asignar");
  if (b1) b1.onclick = function () {
    seleccionadas().forEach(function (f) {
      f.apu = siguienteApu(p);
      if (!f.cod || !f.cod.length) f.cod = ["CA"];
    });
    Store.guardar(p); ir({ sel: [] });
  };
  var b2 = document.getElementById("unir");
  if (b2) b2.onclick = function () {
    var fs = seleccionadas();
    var conApu = fs.filter(function (f) { return f.apu; }).map(function (f) { return f.apu; });
    var destino = conApu.length ? Math.min.apply(null, conApu) : siguienteApu(p);
    fs.forEach(function (f) { f.apu = destino; if (!f.cod || !f.cod.length) f.cod = ["CA"]; });
    Store.guardar(p); ir({ sel: [] });
  };
  var b3 = document.getElementById("limpiar");
  if (b3) b3.onclick = function () {
    seleccionadas().forEach(function (f) { f.cod = []; f.apu = null; });
    Store.guardar(p); ir({ sel: [] });
  };
  var b4 = document.getElementById("cancelar");
  if (b4) b4.onclick = function () { ir({ sel: [] }); };
}

