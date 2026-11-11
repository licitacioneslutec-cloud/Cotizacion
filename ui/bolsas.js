"use strict";

/* ==================================================================
   Editor de Bolsas — Control de inventario de obra
   Vista independiente (pantalla "bolsas") con sub-navegación via vista.bolsaPaso.
   ================================================================== */

/* ---- Helpers de cálculo ---- */

function bolsaDisponible(b, cod) {
  var total = 0;
  (b.items || []).forEach(function (it) { if (it.tipo === "it" && it.cod === cod) total = it.cantTotal || 0; });
  (b.pedidos || []).forEach(function (ped) {
    if (ped.tipo === "adicional" || ped.tipo === "omision") return;
    (ped.items || []).forEach(function (pi) { if (pi.cod === cod) total -= (pi.cant || 0); });
  });
  return total;
}

function bolsaSiguientePedido(b) {
  var max = 0;
  (b.pedidos || []).forEach(function (p) { if (p.num > max) max = p.num; });
  return max + 1;
}

function bolsaItemPorCod(b, cod) {
  var items = b.items || [];
  for (var i = 0; i < items.length; i++) if (items[i].tipo === "it" && items[i].cod === cod) return items[i];
  return null;
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
      var it = bolsaItemPorCod(b, li.cod);
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

function importarBolsaExcel(buffer) {
  var wb = XLSX.read(buffer, { type: "array" });
  var bolsa = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
    nombre: "", descripcion: "", responsable: "", telefono: "", direccion: "",
    fechaInicio: "", fechaFin: "", centroCostos: "", notas: "",
    modificado: new Date().toISOString(),
    items: [], pedidos: []
  };

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
        capitulo: cH ? String(cH.v || "") : "",
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
        var bolsa = importarBolsaExcel(new Uint8Array(ev.target.result));
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
        var res = importarPresupuestoExcel(new Uint8Array(ev.target.result), b);
        avisoOk("Presupuesto importado: " + res.items + " ítems, " + res.apus + " APUs.");
        render();
      } catch (err) { avisoError("Error al importar presupuesto: " + err.message); }
    };
    reader.readAsArrayBuffer(f);
  };
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
      filas += '<tr style="background:var(--bg2)"><td colspan="11" style="font-weight:700;padding:8px 6px">' + esc(it.desc) + '</td></tr>';
      return;
    }
    if (q && (it.cod || "").toLowerCase().indexOf(q) < 0 && (it.desc || "").toLowerCase().indexOf(q) < 0) return;
    visibles++;
    var disp = bolsaDisponible(b, it.cod);
    var pct = it.cantTotal > 0 ? disp / it.cantTotal : 1;
    var color = pct > 0.3 ? "var(--ok,#2e7d32)" : pct > 0 ? "#e65100" : "#c00";
    var checked = sel.indexOf(i) >= 0 ? " checked" : "";
    filas += '<tr>' +
      '<td style="width:30px;text-align:center"><input type="checkbox" data-selinv="' + i + '"' + checked + '></td>' +
      '<td class="m">' + esc(it.cod) + '</td>' +
      '<td>' + esc(it.desc) + '</td>' +
      '<td class="num">' + fmt(it.cantTotal) + '</td>' +
      '<td class="num">' + cop(it.precio) + '</td>' +
      '<td class="num">' + cop((it.cantTotal || 0) * (it.precio || 0)) + '</td>' +
      '<td class="m">' + esc(it.und) + '</td>' +
      '<td class="m">' + esc(it.capitulo) + '</td>' +
      '<td class="m">' + esc(it.codAuranet) + '</td>' +
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
        '<th style="width:70px" class="num">Cant.</th>' +
        '<th style="width:90px" class="num">Precio</th>' +
        '<th style="width:100px" class="num">Valor</th>' +
        '<th style="width:50px">Und</th><th style="width:70px">Cap.</th>' +
        '<th style="width:80px">Auranet</th>' +
        '<th style="width:70px" class="num">Disp.</th><th style="width:60px"></th>' +
      '</tr></thead><tbody>' + filas + '</tbody></table></div>' +
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
      return it ? { cod: it.cod, desc: it.desc, precio: it.precio, und: it.und } : null;
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
      var nc = prompt("Cantidad total:", it.cantTotal);
      if (nc !== null) it.cantTotal = Number(nc) || 0;
      var np = prompt("Precio unitario:", it.precio);
      if (np !== null) it.precio = Number(np) || 0;
      Bolsas.guardar(b); render();
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
        '<th style="width:100px">Código</th><th>Descripción</th><th style="width:60px">Und</th>' +
        '<th style="width:70px" class="num">Disp.</th><th style="width:80px" class="num">Cantidad</th>' +
        '<th style="width:100px" class="num">Precio</th><th style="width:100px" class="num">Subtotal</th>' +
        '<th style="width:80px">Obs.</th><th style="width:40px"></th>' +
      '</tr></thead><tbody id="pedBody"></tbody>' +
      '<tfoot><tr><td colspan="6" style="text-align:right;font-weight:600">Total:</td>' +
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
    lineas = vista.bolsaPrePedido.map(function (x) { return { cod: x.cod, cant: 0, obs: "" }; });
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
  tipoSel.onchange = actualizarTipoUI;

  function redibujarLineas() {
    var body = document.getElementById("pedBody");
    var total = 0;
    body.innerHTML = lineas.map(function (l, i) {
      var esExtra = l.cod && (l.cod.indexOf("AD_") === 0 || l.cod.indexOf("OS_") === 0);
      var it = esExtra ? null : bolsaItemPorCod(b, l.cod);
      var precio = esExtra ? (l.precio || 0) : (it ? (it.precio || 0) : 0);
      var sub = (l.cant || 0) * precio;
      total += sub;

      if (esExtra) {
        return '<tr style="background:#fff8e1">' +
          '<td><input class="in m" data-pedcod="' + i + '" value="' + esc(l.cod) + '" readonly style="width:90px;background:#eee"></td>' +
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

      var disp = it ? bolsaDisponible(b, l.cod) : 0;
      return '<tr>' +
        '<td><input class="in m" data-pedcod="' + i + '" value="' + esc(l.cod) + '" placeholder="Código" list="dlCods"></td>' +
        '<td style="font-size:12px">' + (it ? esc(it.desc) : '<span style="color:var(--ink3)">—</span>') + '</td>' +
        '<td class="m">' + (it ? esc(it.und) : "") + '</td>' +
        '<td class="num">' + (it ? fmt(disp) : "—") + '</td>' +
        '<td><input class="in m" type="number" min="0" data-pedcant="' + i + '" value="' + (l.cant || "") + '" style="width:70px;text-align:right"></td>' +
        '<td class="num">' + (it ? cop(it.precio) : "—") + '</td>' +
        '<td class="num">' + cop(sub) + '</td>' +
        '<td><input class="in m" data-pedobs="' + i + '" value="' + esc(l.obs) + '" style="width:70px"></td>' +
        '<td><button class="btnx" data-pedquit="' + i + '" style="color:#c00">&times;</button></td>' +
      '</tr>';
    }).join("");
    document.getElementById("pedTotal").textContent = cop(total);

    var dl = document.getElementById("dlCods");
    if (!dl) { dl = document.createElement("datalist"); dl.id = "dlCods"; document.body.appendChild(dl); }
    dl.innerHTML = (b.items || []).filter(function (it) { return it.tipo === "it"; }).map(function (it) {
      return '<option value="' + esc(it.cod) + '">' + esc(it.desc) + '</option>';
    }).join("");

    Array.prototype.forEach.call(document.querySelectorAll("[data-pedcod]"), function (inp) {
      inp.onchange = function () { lineas[Number(inp.dataset.pedcod)].cod = inp.value.trim(); redibujarLineas(); };
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
      var warn = [];
      itemsVal.forEach(function (l) {
        if (l.cod.indexOf("AD_") === 0 || l.cod.indexOf("OS_") === 0) return;
        var disp = bolsaDisponible(b, l.cod);
        if (l.cant > disp) warn.push(l.cod + " (pide " + l.cant + ", disp " + fmt(disp) + ")");
      });
      if (warn.length && !confirm("Estos ítems exceden el disponible:\n" + warn.join("\n") + "\n\n¿Registrar de todos modos?")) return;
    }

    var items = itemsVal.map(function (l) {
      var base = { cod: l.cod, cant: l.cant, obs: l.obs || "" };
      if (l.cod.indexOf("AD_") === 0 || l.cod.indexOf("OS_") === 0) {
        base.desc = l.desc || "";
        base.precio = l.precio || 0;
        base.und = l.und || "UND";
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
  (b.pedidos || []).forEach(function (ped) {
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
        '<td colspan="2" style="text-align:right;padding:8px 6px;white-space:nowrap">' +
          '<button class="btn" data-imprimir="' + ped.num + '" style="font-size:11px;padding:2px 8px">Imprimir</button> ' +
          '<button class="btn" data-expexcel="' + ped.num + '" style="font-size:11px;padding:2px 8px">Excel</button>' +
        '</td>' +
      '</tr>';
    }

    (ped.items || []).forEach(function (li) {
      if (qh && (li.cod || "").toLowerCase().indexOf(qh) < 0 && (ped.solicitante || "").toLowerCase().indexOf(qh) < 0) return;
      var esExtra = li.cod && (li.cod.indexOf("AD_") === 0 || li.cod.indexOf("OS_") === 0);
      var it = esExtra ? null : bolsaItemPorCod(b, li.cod);
      var desc = esExtra ? (li.desc || li.cod) : (it ? it.desc : "—");
      var precio = esExtra ? (li.precio || 0) : (it ? it.precio : 0);
      filas += '<tr>' +
        '<td class="m">' + ped.num + '</td>' +
        '<td class="m">' + esc(ped.fecha) + '</td>' +
        '<td>' + esc(ped.solicitante) + '</td>' +
        '<td class="m">' + esc(li.cod) + (esExtra ? ' <span style="color:#e65100;font-size:10px">' + ped.tipo.toUpperCase().slice(0,3) + '</span>' : '') + '</td>' +
        '<td style="font-size:12px">' + esc(desc) + '</td>' +
        '<td class="num">' + fmt(li.cant) + '</td>' +
        '<td class="num">' + cop(precio) + '</td>' +
        '<td class="num">' + cop((li.cant || 0) * precio) + '</td>' +
        '<td class="m">' + esc(ped.tipo || "") + '</td>' +
        '<td style="font-size:11px">' + esc(li.obs || "") + '</td>' +
      '</tr>';
    });
  });

  if (!filas) filas = '<tr><td colspan="10" style="text-align:center;color:var(--ink3);padding:20px">Sin pedidos registrados.</td></tr>';

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
        '<th style="width:80px">Código</th><th>Descripción</th>' +
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

  var fh = document.getElementById("filtBolsaHist");
  if (fh) fh.oninput = function () {
    vista.filtBolsaHist = this.value;
    var pos = this.selectionStart, y = window.scrollY;
    render(); window.scrollTo(0, y);
    var n = document.getElementById("filtBolsaHist");
    if (n) { n.focus(); n.setSelectionRange(pos, pos); }
  };
}

/* ---- 6. Resumen ---- */

function renderBolsaResumen(b) {
  var items = (b.items || []).filter(function (it) { return it.tipo === "it"; });
  var totalPedInv = 0, totalDisp = 0;
  var filas = items.map(function (it) {
    var totalPed = 0;
    (b.pedidos || []).forEach(function (ped) {
      if (ped.tipo === "adicional" || ped.tipo === "omision") return;
      (ped.items || []).forEach(function (li) { if (li.cod === it.cod) totalPed += (li.cant || 0); });
    });
    var disp = (it.cantTotal || 0) - totalPed;
    var valorPed = totalPed * (it.precio || 0);
    totalPedInv += valorPed;
    totalDisp += disp * (it.precio || 0);
    var pct = it.cantTotal > 0 ? disp / it.cantTotal : 1;
    var estado = pct > 0.3 ? "Disponible" : pct > 0 ? "Crítico" : "Agotado";
    var color = pct > 0.3 ? "var(--ok,#2e7d32)" : pct > 0 ? "#e65100" : "#c00";
    return '<tr>' +
      '<td class="m">' + esc(it.cod) + '</td>' +
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
        '<th style="width:80px">Código</th><th>Descripción</th>' +
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
  { id: "apu", test: function (t) { return t === "apu"; } },
  { id: "desc", test: function (t) { return t.indexOf("descripcion") === 0; } },
  { id: "und", test: function (t) { return t === "unidad" || t === "und" || t === "um"; } },
  { id: "cant", test: function (t) { return t === "cantidad" || t === "cant"; } },
  { id: "precioUnit", test: function (t) { return t === "valorunitario" || t === "preciounitario" || t === "vlrunitario"; } },
  { id: "valorTotal", test: function (t) { return t === "valortotal" || t === "vlrtotal"; } },
  { id: "item", test: function (t) { return t === "n" || t === "no" || t === "item" || t === "numero"; } }
];

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

function importarPresupuestoExcel(buffer, b) {
  var wb = XLSX.read(buffer, { type: "array" });
  var oferta = null;
  for (var si = 0; si < wb.SheetNames.length; si++) {
    if (wb.SheetNames[si].toLowerCase().indexOf("oferta") >= 0) { oferta = wb.Sheets[wb.SheetNames[si]]; break; }
  }
  var presupuesto = [];
  if (oferta) {
    var det = _detectarEnHoja(oferta, ROLES_PRESUPUESTO);
    if (det) {
      var m = det.mapa;
      var rng = XLSX.utils.decode_range(oferta["!ref"] || "A1");
      for (var r = det.fila + 1; r <= rng.e.r; r++) {
        var vApu = m.apu !== undefined ? (Number(_cellVal(oferta, r, m.apu)) || 0) : 0;
        var vDesc = m.desc !== undefined ? String(_cellVal(oferta, r, m.desc) != null ? _cellVal(oferta, r, m.desc) : "").trim() : "";
        if (!vDesc) continue;
        if (!vApu) { presupuesto.push({ tipo: "cap", desc: vDesc }); continue; }
        presupuesto.push({
          tipo: "it",
          item: m.item !== undefined ? String(_cellVal(oferta, r, m.item) != null ? _cellVal(oferta, r, m.item) : "") : "",
          desc: vDesc,
          und: m.und !== undefined ? String(_cellVal(oferta, r, m.und) != null ? _cellVal(oferta, r, m.und) : "") : "",
          cant: m.cant !== undefined ? (Number(_cellVal(oferta, r, m.cant)) || 0) : 0,
          apu: vApu,
          precioUnit: m.precioUnit !== undefined ? (Number(_cellVal(oferta, r, m.precioUnit)) || 0) : 0,
          valorTotal: m.valorTotal !== undefined ? (Number(_cellVal(oferta, r, m.valorTotal)) || 0) : 0
        });
      }
    }
  }

  var apuSheet = null;
  for (var si2 = 0; si2 < wb.SheetNames.length; si2++) {
    if (wb.SheetNames[si2].toUpperCase() === "APU") { apuSheet = wb.Sheets[wb.SheetNames[si2]]; break; }
  }
  var apuExcel = [];
  if (apuSheet) {
    var bc = _hallarColBaseAPU(apuSheet);
    if (bc >= 0) {
      var rng2 = XLSX.utils.decode_range(apuSheet["!ref"] || "A1");
      var r2 = rng2.s.r;
      while (r2 <= rng2.e.r) {
        var vk = _cellVal(apuSheet, r2, bc);
        var sk = vk != null ? String(vk).trim() : "";
        if (sk.indexOf("ITEM") < 0 || sk.indexOf(":") < 0) { r2++; continue; }
        r2++;
        if (r2 > rng2.e.r) break;
        var apuObj = {
          apu: Number(_cellVal(apuSheet, r2, bc)) || 0,
          desc: String(_cellVal(apuSheet, r2, bc + 1) != null ? _cellVal(apuSheet, r2, bc + 1) : ""),
          und: String(_cellVal(apuSheet, r2, bc + 2) != null ? _cellVal(apuSheet, r2, bc + 2) : ""),
          cant: Number(_cellVal(apuSheet, r2, bc + 3)) || 0,
          insumos: []
        };
        r2++;
        while (r2 <= rng2.e.r) {
          var vi = _cellVal(apuSheet, r2, bc);
          var si3 = vi != null ? String(vi).trim() : "";
          if (si3.indexOf("ITEM") >= 0 && si3.indexOf(":") >= 0) break;
          if (!si3 || si3 === "-" || /^I{1,3}\./.test(si3) ||
              si3.toUpperCase().indexOf("CODIGO") >= 0 ||
              si3.toUpperCase().indexOf("SUBTOTAL") >= 0 ||
              si3.toUpperCase().indexOf("DESCRIPCI") >= 0) { r2++; continue; }
          var cantVal = Number(_cellVal(apuSheet, r2, bc + 3)) || 0;
          if (cantVal > 0) {
            apuObj.insumos.push({
              cod: si3,
              desc: String(_cellVal(apuSheet, r2, bc + 1) != null ? _cellVal(apuSheet, r2, bc + 1) : ""),
              und: String(_cellVal(apuSheet, r2, bc + 2) != null ? _cellVal(apuSheet, r2, bc + 2) : ""),
              cant: cantVal
            });
          }
          r2++;
        }
        if (apuObj.apu > 0 && apuObj.insumos.length) apuExcel.push(apuObj);
      }
    }
  }

  b.presupuesto = presupuesto;
  b.apuExcel = apuExcel;
  Bolsas.guardar(b);
  return { items: presupuesto.filter(function (x) { return x.tipo === "it"; }).length, apus: apuExcel.length };
}

function importarInventarioDesdeProyecto(b) {
  var p = b.proyectoId ? Store.leer(b.proyectoId) : null;
  if (!p || !p.datosApu) return 0;
  var cat = Catalogo.leer();
  if (!cat || !cat.comp) return 0;
  var existentes = {};
  (b.items || []).forEach(function (it) { if (it.tipo === "it" && it.cod) existentes[it.cod] = true; });
  var nuevos = 0;
  analisisDe(p).forEach(function (a) {
    var datos = (p.datosApu && p.datosApu[a.apu]) || {};
    var comp = componerAnalisis(cat, datos, p, a.apu);
    comp.lineas.forEach(function (l) {
      if (!l.cod || existentes[l.cod]) return;
      existentes[l.cod] = true;
      if (!b.items) b.items = [];
      b.items.push({
        tipo: "it", cod: l.cod, desc: l.desc || "", und: l.und || "",
        cantTotal: 0, precio: l.precio || 0, capitulo: "", codAuranet: ""
      });
      nuevos++;
    });
  });
  if (nuevos) Bolsas.guardar(b);
  return nuevos;
}

function obtenerDatosCruce(b) {
  var p = b.proyectoId ? Store.leer(b.proyectoId) : null;
  if (p && p.datosApu) {
    var cat = Catalogo.leer();
    if (cat && cat.comp) return cruzarDesdeProyecto(b, p, cat);
  }
  if (b.apuExcel && b.apuExcel.length) return cruzarDesdeExcel(b);
  return null;
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
        presupuesto.push({
          tipo: "it", item: f.item || "", desc: f.desc || "",
          und: f.und || "", cant: Number(f.cant) || 0, apu: f.apu,
          precioUnit: 0, valorTotal: 0
        });
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
    if (tieneCoincidencia) {
      apus.push({
        apu: a.apu,
        desc: a.items[0] ? (a.items[0].desc || "APU " + a.apu) : "APU " + a.apu,
        und: a.items[0] ? (a.items[0].und || "") : "",
        cantAnexo: cantAnexo, cap: capPorApu[a.apu] || "Sin capítulo",
        insumos: insumos
      });
    }
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
      apu: x.apu, precioUnit: x.precioUnit, valorTotal: x.valorTotal, insCoinciden: coinciden };
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
    if (tieneCoincidencia) {
      var cap = "Sin capítulo";
      for (var pi = 0; pi < (b.presupuesto || []).length; pi++) {
        if (b.presupuesto[pi].tipo === "cap") cap = b.presupuesto[pi].desc;
        if (b.presupuesto[pi].tipo === "it" && b.presupuesto[pi].apu === a.apu) break;
      }
      apus.push({ apu: a.apu, desc: a.desc, und: a.und,
        cantAnexo: cantAnexo, cap: cap, insumos: insumos });
    }
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

    cuerpo = grupos.map(function (g) {
      var filas = g.items.map(function (it) {
        return '<tr>' +
          '<td class="m">' + esc(String(it.apu || "")) + '</td>' +
          '<td class="m">' + esc(it.item || "") + '</td>' +
          '<td>' + esc(it.desc) + '</td>' +
          '<td class="m">' + esc(it.und || "") + '</td>' +
          '<td class="num">' + fmt(it.cant) + '</td>' +
          (it.precioUnit ? '<td class="num">' + cop(it.precioUnit) + '</td>' : '<td class="num" style="color:var(--ink3)">—</td>') +
          (it.valorTotal ? '<td class="num">' + cop(it.valorTotal) + '</td>' : '<td class="num" style="color:var(--ink3)">—</td>') +
          '<td class="num" style="font-weight:600;color:' + (it.insCoinciden > 0 ? 'var(--ok,#2e7d32)' : 'var(--ink3)') + '">' +
            (it.insCoinciden || 0) + '</td></tr>';
      }).join("");
      var totalCap = g.items.reduce(function (s, it) { return s + (it.valorTotal || 0); }, 0);
      return '<div class="card">' +
        '<div class="chd" style="background:var(--navy);border-radius:5px 5px 0 0">' +
          '<span class="ct" style="color:#fff">' + esc(g.cap) + '</span>' +
          '<span class="cn" style="color:#93A4B4">' + g.items.length + ' ítems' +
            (totalCap ? ' · ' + cop(totalCap) : '') + '</span></div>' +
        '<div class="scroll"><table class="tbl"><thead><tr>' +
          '<th style="width:50px">APU</th><th style="width:70px">Item</th><th>Descripción</th>' +
          '<th style="width:50px">Und</th><th class="num" style="width:70px">Cant.</th>' +
          '<th class="num" style="width:100px">Precio</th><th class="num" style="width:100px">Total</th>' +
          '<th class="num" style="width:80px">Insumos</th>' +
        '</tr></thead><tbody>' + filas + '</tbody></table></div></div>';
    }).join("");
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
    var totalCoinciden = 0;
    datos.apus.forEach(function (a) {
      a.insumos.forEach(function (i) { if (i.enBolsa) totalCoinciden++; });
    });
    cuerpo = '<div class="card"><div class="cbd" style="display:flex;gap:24px;flex-wrap:wrap">' +
      '<div><div class="lbl">APUs con insumos en bolsa</div><div style="font-size:20px;font-weight:700">' + datos.apus.length + '</div></div>' +
      '<div><div class="lbl">Insumos coincidentes</div><div style="font-size:20px;font-weight:700">' + totalCoinciden + '</div></div>' +
    '</div></div>';

    cuerpo += datos.apus.map(function (a) {
      var filas = a.insumos.filter(function (i) { return i.enBolsa; }).map(function (i) {
        var disp = bolsaDisponible(b, i.cod);
        var bItem = bolsaItemPorCod(b, i.cod);
        var enBolsa = bItem ? (bItem.cantTotal || 0) : 0;
        var color = disp > 0 ? "var(--ok,#2e7d32)" : "#c00";
        return '<tr>' +
          '<td class="m">' + esc(i.cod) + '</td>' +
          '<td>' + esc(i.desc) + '</td>' +
          '<td class="m">' + esc(i.und) + '</td>' +
          '<td class="num">' + fmt(i.cantNec) + '</td>' +
          '<td class="num">' + fmt(enBolsa) + '</td>' +
          '<td class="num" style="color:' + color + ';font-weight:600">' + fmt(disp) + '</td></tr>';
      }).join("");
      var coinciden = a.insumos.filter(function (i) { return i.enBolsa; }).length;
      return '<div class="card">' +
        '<div class="chd" style="background:var(--navy);border-radius:5px 5px 0 0">' +
          '<span class="ct" style="color:#fff">APU ' + a.apu + ' — ' + esc(a.desc) + '</span>' +
          '<span class="cn" style="color:#93A4B4">' + esc(a.cap || "") +
            ' · ' + esc(a.und || "") + ' · Anexo: ' + fmt(a.cantAnexo) +
            ' · ' + coinciden + ' insumos en bolsa</span></div>' +
        '<div class="scroll"><table class="tbl"><thead><tr>' +
          '<th style="width:90px">Código</th><th>Descripción</th><th style="width:50px">Und</th>' +
          '<th class="num" style="width:80px">Necesario</th>' +
          '<th class="num" style="width:80px">En bolsa</th>' +
          '<th class="num" style="width:80px">Disp.</th>' +
        '</tr></thead><tbody>' + filas + '</tbody></table></div></div>';
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
    var it = esExtra ? null : bolsaItemPorCod(b, li.cod);
    var desc = esExtra ? (li.desc || li.cod) : (it ? it.desc : li.cod);
    var und = esExtra ? (li.und || "UND") : (it ? it.und : "");
    var precio = esExtra ? (li.precio || 0) : (it ? it.precio : 0);
    var costoT = (li.cant || 0) * precio;
    subtotal += costoT;
    var cap = it ? (it.capitulo || "") : "";
    var aura = it ? (it.codAuranet || "") : "";
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
    '@media print{body{margin:10mm}}' +
    '</style></head><body>' +
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
      '<th style="width:60px">CAPÍTULO</th><th style="width:65px">COD. AURANET</th>' +
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
    { width: 14 }, { width: 14 }, { width: 12 }, { width: 12 }, { width: 12 }
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
  for (var ii = 0; ii < pedItems.length; ii++) {
    var li = pedItems[ii];
    var esExtra = li.cod && (li.cod.indexOf("AD_") === 0 || li.cod.indexOf("OS_") === 0);
    var it = esExtra ? null : bolsaItemPorCod(b, li.cod);
    var desc = esExtra ? (li.desc || li.cod) : (it ? it.desc : li.cod);
    var und = esExtra ? (li.und || "UND") : (it ? it.und : "");
    var precio = esExtra ? (li.precio || 0) : (it ? it.precio : 0);
    var cap = it ? (it.capitulo || "") : "";
    var aura = it ? (it.codAuranet || "") : "";
    var rr = ws.getRow(dataStart + ii);
    rr.getCell(1).value = ii + 1;
    rr.getCell(2).value = desc;
    rr.getCell(3).value = und;
    rr.getCell(4).value = li.cant || 0;
    rr.getCell(5).value = precio; rr.getCell(5).numFmt = moneda;
    rr.getCell(6).value = { formula: "D" + (dataStart + ii) + "*E" + (dataStart + ii) }; rr.getCell(6).numFmt = moneda;
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
  trSub.getCell(6).value = { formula: "SUM(F" + dataStart + ":F" + lastData + ")" }; trSub.getCell(6).numFmt = moneda; trSub.getCell(6).font = fB;
  for (var tc = 1; tc <= 9; tc++) trSub.getCell(tc).border = borde;

  var trIva = ws.getRow(totRow + 1);
  ws.mergeCells("A" + (totRow + 1) + ":E" + (totRow + 1));
  trIva.getCell(1).value = "IVA 19%:"; trIva.getCell(1).font = fB; trIva.getCell(1).alignment = { horizontal: "right" };
  trIva.getCell(6).value = { formula: "F" + totRow + "*0.19" }; trIva.getCell(6).numFmt = moneda; trIva.getCell(6).font = fB;
  for (var ic = 1; ic <= 9; ic++) trIva.getCell(ic).border = borde;

  var trTot = ws.getRow(totRow + 2);
  ws.mergeCells("A" + (totRow + 2) + ":E" + (totRow + 2));
  trTot.getCell(1).value = "TOTAL:"; trTot.getCell(1).font = { bold: true, size: 11, name: "Arial" }; trTot.getCell(1).alignment = { horizontal: "right" };
  trTot.getCell(6).value = { formula: "F" + totRow + "+F" + (totRow + 1) }; trTot.getCell(6).numFmt = moneda;
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
