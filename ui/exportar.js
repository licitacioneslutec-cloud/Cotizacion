"use strict";

/* ------------------------------------------------------------------
   Vista de impresión · el navegador la guarda como PDF
   ------------------------------------------------------------------ */

function imprimirPropuesta(p) {
  var cat = Catalogo.leer();
  if (!cat) { avisoError("Falta el catálogo de insumos."); return; }
  var t = totalesProyecto(p, cat);
  var sep = (p.forma || "junta") === "separada";
  var mg = p.margenes || {};
  var pA = (mg.admin || 0) / 100, pI = (mg.imprev || 0) / 100;
  var pU = (mg.util || 0) / 100, pV = (mg.iva || 0) / 100;
  var aiuTotal = pA + pI + pU + pU * pV;
  var matItem = function (valor) {
    var v = Number(valor) || 0;
    return pV > 0 ? v * (1 + aiuTotal) / (1 + pV) : v * (1 + aiuTotal);
  };
  var materialVisibleTotal = 0, materialVisibleIva = 0, manoObraVisibleTotal = 0;
  var hojas = Array.isArray(p.hojas) ? p.hojas : [];
  hojas.forEach(function (h) {
    if (!h || !h.usar) return;
    var filas = Array.isArray(h.filas) ? h.filas : [];
    filas.forEach(function (f) {
      if (!f || f.tipo !== "it") return;
      var apu = f.apu || null;
      var a = apu && t.porApu ? (t.porApu[apu] || {}) : {};
      var q = Number(f.cant) || 0;
      var mat = Number(a.matConTh) || 0;
      var mo = Number(a.mo) || 0;
      materialVisibleTotal += (mat > 0 ? matItem(mat) * q : 0);
      manoObraVisibleTotal += (mo > 0 ? mo * q : 0);
    });
  });
  materialVisibleIva = materialVisibleTotal * pV;
  var materialVisibleTotalConIva = materialVisibleTotal + materialVisibleIva;

  var filaTot = function (k, v, fuerte) {
    return '<tr' + (fuerte ? ' class="tot"' : "") + '><td class="k">' + esc(k) + '</td>' +
      '<td class="v">' + cop(v) + '</td></tr>';
  };

  var resumen = sep
    ? '<table class="res"><tbody>' +
        '<tr class="sec"><td colspan="2">Materiales</td></tr>' +
        filaTot("Subtotal", materialVisibleTotal) +
        filaTot("IVA " + (mg.iva || 0) + "%", materialVisibleIva) +
        filaTot("Total materiales", materialVisibleTotalConIva, true) +
        '<tr class="sec"><td colspan="2">Mano de obra</td></tr>' +
        filaTot("Subtotal", manoObraVisibleTotal) +
        filaTot("Administración " + (mg.admin || 0) + "%", t.moAdmin) +
        filaTot("Imprevistos " + (mg.imprev || 0) + "%", t.moImprev) +
        filaTot("Utilidad " + (mg.util || 0) + "%", t.moUtil) +
        filaTot("IVA sobre la utilidad " + (mg.iva || 0) + "%", t.moIva) +
        filaTot("Total mano de obra", t.totalMo, true) +
        '<tr class="gran"><td class="k">Valor total de la propuesta</td><td class="v">' + cop(t.totalSep) + '</td></tr>' +
      '</tbody></table>'
    : '<table class="res"><tbody>' +
        filaTot("Subtotal · costo directo", t.subtotal) +
        filaTot("Administración " + (mg.admin || 0) + "%", t.admin) +
        filaTot("Imprevistos " + (mg.imprev || 0) + "%", t.imprev) +
        filaTot("Utilidad " + (mg.util || 0) + "%", t.util) +
        filaTot("IVA " + (mg.iva || 0) + "% sobre la utilidad", t.iva) +
        '<tr class="gran"><td class="k">Valor total de la propuesta</td><td class="v">' + cop(t.total) + '</td></tr>' +
      '</tbody></table>';

  var cot = "";
  var notasApuPdf = p.notasApu || {};
  var hojas = Array.isArray(p.hojas) ? p.hojas : [];
  hojas.forEach(function (h) {
    if (!h || !h.usar) return;
    var cuerpo = "";
    var filas = Array.isArray(h.filas) ? h.filas : [];
    filas.forEach(function (f) {
      if (!f) return;
      if (f.tipo === "cap") {
        cuerpo += '<tr class="cap"><td></td><td>' + esc(f.item) + '</td><td colspan="' + (sep ? 6 : 4) + '">' +
          esc(f.desc) + '</td></tr>';
        return;
      }
      var apu = f.apu || null;
      var a = apu && t.porApu ? (t.porApu[apu] || {}) : {};
      var q = Number(f.cant) || 0;
      var nota = apu ? (notasApuPdf[apu] || "") : "";
      var matVal = Number(a.matConTh) || 0;
      var matU = sep ? matItem(matVal) : null;
      var matT = matU !== null ? matU * q : null;
      var moU = Number(a.mo) || 0;
      cuerpo += '<tr><td class="c">' + (apu || "") + '</td><td class="c">' + esc(f.item) + '</td><td>' + esc(f.desc) + '</td>' +
        '<td class="c">' + esc(f.und) + '</td><td class="n">' + fmt(q) + '</td>' +
        (sep
          ? '<td class="n">' + (matU !== null ? cop(matU) : "—") + '</td>' +
            '<td class="n">' + (matT !== null ? cop(matT) : "—") + '</td>' +
            '<td class="n">' + (moU > 0 ? cop(moU) : "—") + '</td>' +
            '<td class="n">' + (moU > 0 ? cop(moU * q) : "—") + '</td>'
          : '<td class="n">' + (a.unitario ? cop(a.unitario) : "—") + '</td>' +
            '<td class="n">' + (a.unitario ? cop(a.unitario * q) : "—") + '</td>') +
        '<td style="font-size:8px">' + esc(nota) + '</td>' +
      '</tr>';
    });
    cot += '<h3>' + esc(h.nombre) + '</h3><table class="cot"><thead><tr>' +
      '<th style="width:5%">APU</th><th style="width:7%">Ítem</th><th>Descripción</th><th style="width:4%">Und</th>' +
      '<th style="width:6%">Cant.</th>' +
      (sep ? '<th style="width:10%">Sumin. unit</th><th style="width:11%">Sumin. total</th>' +
             '<th style="width:10%">M.O. unit</th><th style="width:11%">M.O. total</th>'
           : '<th style="width:12%">Vr. unitario</th><th style="width:13%">Vr. total</th>') +
      '<th style="width:14%">Notas</th>' +
      '</tr></thead><tbody>' + cuerpo + '</tbody></table>';
  });

  var ana = "";
  analisisDe(p).forEach(function (a) {
    var datos = (p.datosApu && p.datosApu[a.apu]) || {};
    var comp = componerAnalisis(cat, datos, p, a.apu);
    var val = valorizar(cat, comp.lineas, margenesDe(p, a.apu), p);
    var fl = function (l) {
      return '<tr><td class="c">' + esc(l.cod) + '</td><td>' + esc(l.desc) + '</td>' +
        '<td class="c">' + esc(l.und) + '</td><td class="n">' + dec(l.cantDesp) + '</td>' +
        '<td class="n">' + (l.desp ? l.desp + "%" : "") + '</td>' +
        '<td class="n">' + (l.falta ? "—" : cop(l.precio)) + '</td>' +
        '<td class="n">' + (l.falta ? "—" : cop(l.total)) + '</td></tr>';
    };
    ana += '<div class="apu"><div class="apuhd"><span class="apun">APU ' + a.apu + '</span>' +
      '<span class="apui">' + a.items.map(function (x) { return esc(x.item); }).join(", ") + '</span>' +
      '<span class="apud">' + esc(a.items[0] ? a.items[0].desc : "") + '</span></div>' +
      '<table class="cot"><thead><tr><th style="width:12%">Código</th>' +
      '<th>Descripción</th><th style="width:6%">Und</th><th style="width:10%">Cant.</th><th style="width:7%">Desp.</th>' +
      '<th style="width:13%">Vr. unit</th><th style="width:14%">Vr. total</th></tr></thead><tbody>' +
      '<tr class="cap"><td colspan="7">I · Materiales</td></tr>' +
      val.lineas.filter(function (l) { return !l.mo; }).map(fl).join("") +
      '<tr class="sub"><td colspan="6">Subtotal materiales</td><td class="n">' + cop(val.mat) + '</td></tr>' +
      (val.th > 0
        ? '<tr class="cap"><td colspan="7">II · Transporte y herramienta</td></tr>' +
          '<tr><td class="c">TR1</td><td>Transportes</td><td></td><td></td><td class="n">' + dec(val.pctTrans) + '%</td>' +
          '<td></td><td class="n">' + cop(val.transporte) + '</td></tr>' +
          '<tr><td class="c">HER1</td><td>Herramienta de mano</td><td></td><td></td><td class="n">' + dec(val.pctHerr) + '%</td>' +
          '<td></td><td class="n">' + cop(val.herramienta) + '</td></tr>' +
          '<tr class="sub"><td colspan="6">Subtotal transporte y herramienta</td><td class="n">' + cop(val.th) + '</td></tr>'
        : "") +
      '<tr class="cap"><td colspan="7">III · Mano de obra</td></tr>' +
      val.lineas.filter(function (l) { return l.mo; }).map(fl).join("") +
      '<tr class="sub"><td colspan="6">Subtotal mano de obra</td><td class="n">' + cop(val.mo) + '</td></tr>' +
      '<tr class="tot"><td colspan="6">Costo directo</td><td class="n">' + cop(val.directo) + '</td></tr>' +
      '</tbody></table>' +
      ((p.notasApu || {})[a.apu] ? '<p class="nota">' + esc(p.notasApu[a.apu]) + '</p>' : "") +
      '</div>';
  });

  var cons = p.consideraciones
    ? '<div class="cons"><h3>Consideraciones</h3>' +
      String(p.consideraciones).split("\n").filter(function (l) { return l.trim(); })
        .map(function (l) { return '<p>' + esc(l) + '</p>'; }).join("") + '</div>'
    : "";

  var w = window.open("", "_blank");
  if (!w) { avisoError("El navegador bloqueó la ventana. Permite las ventanas emergentes de este sitio."); return; }
  w.document.write('<!doctype html><html lang="es"><head><meta charset="utf-8">' +
    '<title>' + esc(p.nombre || "Propuesta") + '</title>' +
    '<link rel="stylesheet" href="print.css"></head><body>' +
    '<div class="barra no-print"><button onclick="window.print()">Imprimir o guardar como PDF</button>' +
      '<span>En el diálogo, elige “Guardar como PDF” en el destino.</span></div>' +
    '<header class="mem">' +
      '<img src="logo.png" alt="Lutec" class="lg">' +
      '<div class="memtx"><div class="memmarca">LUTEC · Soluciones brillantes</div>' +
      '<div class="memweb">www.lutec.com.co</div></div>' +
      '<div class="memfec">' + fecha(hoy()) + '</div>' +
    '</header>' +
    '<h1>Propuesta económica</h1>' +
    '<table class="datos"><tbody>' +
      '<tr><td class="k">Proyecto</td><td>' + esc(p.nombre || "") + '</td>' +
        '<td class="k">Cliente</td><td>' + esc(p.cliente || "") + '</td></tr>' +
      '<tr><td class="k">Ciudad</td><td>' + esc(p.ciudad || "") + '</td>' +
        '<td class="k">Entrega</td><td>' + fecha(p.entrega) + '</td></tr>' +
      '<tr><td class="k">Ítems</td><td>' + (t.conValor + t.sinValor) + '</td>' +
        '<td class="k">Análisis</td><td>' + t.analisis + '</td></tr>' +
    '</tbody></table>' +
    '<h2>Resumen</h2>' + resumen + cons +
    '<div class="salto"></div><h2>Cotización</h2>' + cot +
    '<div class="salto"></div><h2>Análisis de precios unitarios</h2>' + ana +
    '<footer class="pie">Lutec · Soluciones brillantes · www.lutec.com.co</footer>' +
    '</body></html>');
  w.document.close();
}

/* ------------------------------------------------------------------
   Archivo de entrega
   ------------------------------------------------------------------ */

function exportarTodo(p) {
  var cat = Catalogo.leer();
  if (!cat) { avisoError("Falta el catálogo de insumos."); return; }
  if (typeof ExcelJS === "undefined") { exportarTodoSimple(p); return; }
  var t = totalesProyecto(p, cat);
  var sep = (p.forma || "junta") === "separada";
  var mg = p.margenes || {};
  var pA = (mg.admin || 0) / 100, pI = (mg.imprev || 0) / 100;
  var pU = (mg.util || 0) / 100, pV = (mg.iva || 0) / 100;
  var aiuTotal = pA + pI + pU + pU * pV;
  var matItem = function (valor) {
    var v = Number(valor) || 0;
    return pV > 0 ? v * (1 + aiuTotal) / (1 + pV) : v * (1 + aiuTotal);
  };
  var materialVisibleTotal = 0, materialVisibleIva = 0, manoObraVisibleTotal = 0;
  var hojas = Array.isArray(p.hojas) ? p.hojas : [];
  hojas.forEach(function (h) {
    if (!h || !h.usar) return;
    var filas = Array.isArray(h.filas) ? h.filas : [];
    filas.forEach(function (f) {
      if (!f || f.tipo !== "it") return;
      var apu = f.apu || null;
      var a = apu && t.porApu ? (t.porApu[apu] || {}) : {};
      var q = Number(f.cant) || 0;
      var matVal = Number(a.matConTh) || 0;
      var moVal = Number(a.mo) || 0;
      materialVisibleTotal += (matVal > 0 ? matItem(matVal) * q : 0);
      manoObraVisibleTotal += (moVal > 0 ? moVal * q : 0);
    });
  });
  materialVisibleIva = materialVisibleTotal * pV;
  var materialVisibleTotalConIva = materialVisibleTotal + materialVisibleIva;

  var NAVY = "FF0F2436", LIME = "FFA6CE39", GRIS = "FFF4F6F8", GRIS2 = "FFFAFBFC";
  var moneda = '"$"#,##0';
  var wb = new ExcelJS.Workbook();
  wb.creator = "Lutec"; wb.created = new Date();

  var borde = { top: { style: "thin", color: { argb: "FFDDE3E8" } },
                bottom: { style: "thin", color: { argb: "FFDDE3E8" } },
                left: { style: "thin", color: { argb: "FFDDE3E8" } },
                right: { style: "thin", color: { argb: "FFDDE3E8" } } };
  var fill = function (argb) { return { type: "pattern", pattern: "solid", fgColor: { argb: argb } }; };
  var thd = function (cel) {
    cel.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 10, name: "Calibri" };
    cel.fill = fill(NAVY); cel.alignment = { vertical: "middle" }; cel.border = borde;
  };

  /* ===== 1. MEMBRETE ===== */
  var m = wb.addWorksheet("Membrete", { views: [{ showGridLines: false }] });
  m.columns = [{ width: 3 }, { width: 30 }, { width: 26 }, { width: 22 }, { width: 20 }];
  try {
    var img = wb.addImage({ base64: "data:image/png;base64," + LOGO64, extension: "png" });
    m.addImage(img, { tl: { col: 1, row: 1 }, ext: { width: 62, height: 62 } });
  } catch (e) {}
  m.getCell("C2").value = "LUTEC";
  m.getCell("C2").font = { bold: true, size: 20, color: { argb: NAVY }, name: "Calibri" };
  m.getCell("C3").value = "Soluciones brillantes en iluminación e ingeniería eléctrica";
  m.getCell("C3").font = { size: 9, color: { argb: "FF5A6B7B" } };
  m.getCell("C4").value = "www.lutec.com.co";
  m.getCell("C4").font = { size: 9, color: { argb: "FF6F9418" }, bold: true };
  m.mergeCells("B6:E6");
  m.getCell("B6").value = "PROPUESTA ECONÓMICA";
  m.getCell("B6").font = { bold: true, size: 14, color: { argb: NAVY } };
  m.getCell("B6").alignment = { horizontal: "center" };
  m.getCell("B6").fill = fill(LIME);
  m.getRow(6).height = 22;

  var fila = 8;
  var dato = function (k, v) {
    m.getCell("B" + fila).value = k;
    m.getCell("B" + fila).font = { bold: true, size: 9, color: { argb: "FF5A6B7B" } };
    m.mergeCells("C" + fila + ":E" + fila);
    m.getCell("C" + fila).value = v;
    fila++;
  };
  dato("Proyecto", p.nombre || "");
  dato("Cliente", p.cliente || "");
  dato("Constructora", p.constructora || "");
  dato("Ciudad", p.ciudad || "");
  dato("Encargado", p.encargado || "");
  dato("Entrega de la oferta", fecha(p.entrega));
  dato("Ítems del anexo", t.conValor + t.sinValor);
  dato("Análisis de precios", t.analisis);
  fila++;

  m.mergeCells("B" + fila + ":E" + fila);
  m.getCell("B" + fila).value = "RESUMEN";
  m.getCell("B" + fila).font = { bold: true, size: 11, color: { argb: "FFFFFFFF" } };
  m.getCell("B" + fila).fill = fill(NAVY);
  fila++;
  var res = function (k, v, fuerte) {
    m.getCell("B" + fila).value = k;
    if (fuerte) m.getCell("B" + fila).font = { bold: true, color: { argb: NAVY } };
    m.mergeCells("C" + fila + ":D" + fila);
    var c = m.getCell("E" + fila);
    c.value = v; c.numFmt = moneda; c.alignment = { horizontal: "right" };
    if (fuerte) c.font = { bold: true, color: { argb: NAVY } };
    fila++;
  };
  if (sep) {
    res("Materiales · subtotal", materialVisibleTotal);
    res("IVA " + (mg.iva || 0) + "%", materialVisibleIva);
    res("Total materiales", materialVisibleTotalConIva, true);
    res("Mano de obra · subtotal", manoObraVisibleTotal);
    res("Administración " + (mg.admin || 0) + "%", t.moAdmin);
    res("Imprevistos " + (mg.imprev || 0) + "%", t.moImprev);
    res("Utilidad " + (mg.util || 0) + "%", t.moUtil);
    res("IVA sobre la utilidad " + (mg.iva || 0) + "%", t.moIva);
    res("Total mano de obra", t.totalMo, true);
    fila++;
    res("VALOR TOTAL", t.totalSep, true);
  } else {
    res("Subtotal · costo directo", t.subtotal);
    res("Administración " + (mg.admin || 0) + "%", t.admin);
    res("Imprevistos " + (mg.imprev || 0) + "%", t.imprev);
    res("Utilidad " + (mg.util || 0) + "%", t.util);
    res("IVA sobre utilidad", t.iva);
    fila++;
    res("VALOR TOTAL", t.total, true);
  }
  m.getCell("E" + (fila - 1)).fill = fill(GRIS);
  m.getCell("B" + (fila - 1)).fill = fill(GRIS);

  if (p.consideraciones) {
    fila += 1;
    m.getCell("B" + fila).value = "CONSIDERACIONES";
    m.getCell("B" + fila).font = { bold: true, size: 10, color: { argb: NAVY } };
    fila++;
    String(p.consideraciones).split("\n").forEach(function (l) {
      if (!l.trim()) return;
      m.mergeCells("B" + fila + ":E" + fila);
      m.getCell("B" + fila).value = l;
      m.getCell("B" + fila).font = { size: 9, color: { argb: "FF5A6B7B" } };
      m.getCell("B" + fila).alignment = { wrapText: true };
      fila++;
    });
  }

  /* ===== 2. COTIZACIÓN ===== */
  var c2 = wb.addWorksheet("Cotización", { views: [{ showGridLines: false }] });
  var encCot = sep
    ? ["APU", "Ítem", "Descripción", "Und", "Cant.", "Sumin. unit", "Sumin. total", "M.O. unit", "M.O. total", "Notas"]
    : ["APU", "Ítem", "Descripción", "Und", "Cant.", "Vr. unitario", "Vr. total", "Notas"];
  c2.columns = (sep ? [7, 11, 40, 7, 10, 14, 15, 14, 15, 25] : [7, 11, 47, 7, 11, 15, 17, 25]).map(function (w) { return { width: w }; });
  c2.addRow(encCot).eachCell(thd);
  c2.getRow(1).height = 18;

  var rc = 2;
  var notasApu = p.notasApu || {};
  var hojas = Array.isArray(p.hojas) ? p.hojas : [];
  hojas.forEach(function (h) {
    if (!h || !h.usar) return;
    var hr = c2.addRow([h.nombre]);
    c2.mergeCells("A" + rc + ":" + (sep ? "J" : "H") + rc);
    hr.getCell(1).font = { bold: true, size: 10, color: { argb: NAVY } };
    hr.getCell(1).fill = fill(LIME); rc++;
    var filas = Array.isArray(h.filas) ? h.filas : [];
    filas.forEach(function (f) {
      if (!f) return;
      if (f.tipo === "cap") {
        var cr = c2.addRow(["", f.item, f.desc]);
        cr.eachCell(function (cel) { cel.font = { bold: true, size: 9, color: { argb: "FF5A6B7B" } };
          cel.fill = fill(GRIS); }); rc++; return;
      }
      var apu = f.apu || null;
      var a = apu && t.porApu ? (t.porApu[apu] || {}) : {};
      var q = Number(f.cant) || 0;
      var nota = apu ? (notasApu[apu] || "") : "";
      var matU = sep ? matItem(Number(a.matConTh) || 0) : null;
      var matT = matU !== null ? matU * q : null;
      var moU = Number(a.mo) || 0;
      var r = sep
        ? c2.addRow([apu || "", f.item, f.desc, f.und, q, matU, matT,
            moU || null, moU ? moU * q : null, nota || null])
        : c2.addRow([apu || "", f.item, f.desc, f.und, q, a.unitario || null, a.unitario ? a.unitario * q : null, nota || null]);
      r.eachCell(function (cel, cn) {
        cel.border = borde; cel.font = { size: 9 };
        if (cn >= 6 && cn <= (sep ? 9 : 7)) cel.numFmt = moneda;
        if (cn === 5) cel.numFmt = "#,##0.##";
        if (cn === 1) cel.alignment = { horizontal: "center" };
        if (cn === (sep ? 10 : 8)) cel.alignment = { wrapText: true };
      });
      if (rc % 2 === 0) r.eachCell(function (cel) { if (!cel.fill || !cel.fill.fgColor) cel.fill = fill(GRIS2); });
      rc++;
    });
  });
  c2.addRow([]); rc++;
  var totCot = function (k, v, col) {
    var arr = new Array(sep ? 10 : 8).fill(null);
    arr[1] = k; arr[col] = v;
    var r = c2.addRow(arr);
    r.getCell(2).font = { bold: true, color: { argb: NAVY } };
    r.getCell(col + 1).numFmt = moneda; r.getCell(col + 1).font = { bold: true, color: { argb: NAVY } };
    rc++;
  };
  if (sep) {
    /* col 6 = Sumin. total, col 8 = M.O. total (índices base 0) */
    totCot("Subtotal materiales", materialVisibleTotal, 6);
    totCot("IVA materiales " + (mg.iva || 0) + "%", materialVisibleIva, 6);
    totCot("Total materiales", materialVisibleTotalConIva, 6);
    totCot("Subtotal mano de obra", manoObraVisibleTotal, 8);
    totCot("Administración mano de obra " + (mg.admin || 0) + "%", t.moAdmin, 8);
    totCot("Imprevistos mano de obra " + (mg.imprev || 0) + "%", t.moImprev, 8);
    totCot("Utilidad mano de obra " + (mg.util || 0) + "%", t.moUtil, 8);
    totCot("IVA sobre utilidad mano de obra " + (mg.iva || 0) + "%", t.moIva, 8);
    totCot("Total mano de obra", t.totalMo, 8);
  } else {
    totCot("Subtotal", t.subtotal, 6);
    totCot("AIU", t.admin + t.imprev + t.util, 6);
    totCot("IVA sobre utilidad", t.iva, 6);
    totCot("VALOR TOTAL", t.total, 6);
  }

  /* ===== 3. ANÁLISIS ===== */
  var a3 = wb.addWorksheet("Análisis", { views: [{ showGridLines: false }] });
  a3.columns = [13, 56, 7, 11, 8, 14, 15].map(function (w) { return { width: w }; });
  var ra = 1;
  analisisDe(p).forEach(function (aa) {
    var datos = (p.datosApu && p.datosApu[aa.apu]) || {};
    var comp = componerAnalisis(cat, datos, p, aa.apu);
    var val = valorizar(cat, comp.lineas, margenesDe(p, aa.apu), p);

    var hd = a3.addRow(["APU " + aa.apu, aa.items.map(function (x) { return x.item; }).join(", "),
                        aa.items[0] ? aa.items[0].desc : ""]);
    a3.mergeCells("C" + ra + ":G" + ra);
    hd.getCell(1).font = { bold: true, size: 12, color: { argb: NAVY } };
    hd.getCell(2).font = { size: 9, color: { argb: "FF8A99A7" } };
    hd.getCell(1).border = { bottom: { style: "medium", color: { argb: LIME } } };
    hd.getCell(3).border = { bottom: { style: "medium", color: { argb: LIME } } };
    ra++;
    a3.addRow(["Código", "Descripción", "Und", "Cant.", "Desp.", "Vr. unit", "Vr. total"]).eachCell(thd);
    ra++;

    var seccion = function (titulo) {
      var r = a3.addRow(["", "", titulo]);
      a3.mergeCells("C" + ra + ":G" + ra);
      r.getCell(3).font = { bold: true, size: 9, color: { argb: "FF5A6B7B" } };
      r.getCell(3).fill = fill(GRIS); ra++;
    };
    var linea = function (l) {
      var r = a3.addRow([l.cod, l.desc, l.und, l.cantDesp, l.desp ? l.desp / 100 : null,
                         l.falta ? null : l.precio, l.falta ? null : l.total]);
      r.eachCell(function (cel, cn) {
        cel.font = { size: 9 }; cel.border = borde;
        if (cn === 4) cel.numFmt = "#,##0.####";
        if (cn === 5) cel.numFmt = "0%";
        if (cn >= 6) cel.numFmt = moneda;
      });
      ra++;
    };
    var subt = function (k, v) {
      var r = a3.addRow(["", "", k, "", "", "", v]);
      a3.mergeCells("C" + ra + ":F" + ra);
      r.getCell(3).font = { bold: true, size: 9 }; r.getCell(7).numFmt = moneda;
      r.getCell(7).font = { bold: true, size: 9 };
      r.eachCell(function (cel) { cel.fill = fill(GRIS2); });
      ra++;
    };

    seccion("I · Materiales");
    val.lineas.filter(function (l) { return !l.mo; }).forEach(linea);
    subt("Subtotal materiales", val.mat);
    if (val.th > 0) {
      seccion("II · Transporte y herramienta");
      var tr = a3.addRow(["TR1", "Transportes", "", null, val.pctTrans / 100, null, val.transporte]);
      tr.getCell(5).numFmt = "0.##%"; tr.getCell(7).numFmt = moneda; tr.eachCell(function (c) { c.font = { size: 9 }; }); ra++;
      var he = a3.addRow(["HER1", "Herramienta de mano", "", null, val.pctHerr / 100, null, val.herramienta]);
      he.getCell(5).numFmt = "0.##%"; he.getCell(7).numFmt = moneda; he.eachCell(function (c) { c.font = { size: 9 }; }); ra++;
      subt("Subtotal transporte y herramienta", val.th);
    }
    seccion("III · Mano de obra");
    val.lineas.filter(function (l) { return l.mo; }).forEach(linea);
    subt("Subtotal mano de obra", val.mo);

    var dr = a3.addRow(["", "", "COSTO DIRECTO", "", "", "", val.directo]);
    a3.mergeCells("C" + ra + ":F" + ra);
    dr.getCell(3).font = { bold: true, color: { argb: NAVY } };
    dr.getCell(7).numFmt = moneda; dr.getCell(7).font = { bold: true, color: { argb: NAVY } };
    dr.eachCell(function (cel) { cel.fill = fill(GRIS); }); ra++;
    a3.addRow([]); ra++;
  });

  /* ===== 4. INSUMOS ===== */
  var i4 = wb.addWorksheet("Insumos", { views: [{ showGridLines: false }] });
  i4.columns = [13, 56, 7, 12, 8, 14, 14, 15, 20].map(function (w) { return { width: w }; });
  i4.addRow(["Código", "Descripción", "Und", "Cantidad", "Desp.", "Precio costo", "Vr. venta", "Vale", "Análisis"]).eachCell(thd);
  var ri = 2;
  insumosDe(p, cat).forEach(function (i) {
    var venta = precioAjustado({ precio: i.precio, imp: i.imp, ofertas: i.ofertas, sel: i.sel, cod: i.cod }, mg, p);
    var costo = costoDe({ precio: i.precio, ofertas: i.ofertas, sel: i.sel, cod: i.cod }, p);
    var r = i4.addRow([i.cod, i.desc, i.und, i.cantidad, i.desp ? i.desp / 100 : null,
                       costo || null, venta || null, costo > 0 ? venta * i.cantidad : null, i.apus.join(", ")]);
    r.eachCell(function (cel, cn) {
      cel.font = { size: 9 }; cel.border = borde;
      if (cn === 4) cel.numFmt = "#,##0.##";
      if (cn === 5) cel.numFmt = "0%";
      if (cn >= 6 && cn <= 8) cel.numFmt = moneda;
    });
    if (ri % 2 === 0) r.eachCell(function (cel) { cel.fill = fill(GRIS2); });
    ri++;
  });
  i4.autoFilter = "A1:I1";

  var nombre = (p.nombre || "propuesta").replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "_");
  wb.xlsx.writeBuffer().then(function (buf) {
    var blob = new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = nombre + ".xlsx";
    a.click(); URL.revokeObjectURL(a.href);
    avisoOk("Archivo descargado con formato.");
  }).catch(function (e) {
    avisoError("No se pudo generar el Excel con formato: " + (e && e.message ? e.message : e));
    exportarTodoSimple(p);
  });
}

/* Respaldo sin formato, por si ExcelJS no cargó */
function exportarTodoSimple(p) {
  var cat = Catalogo.leer();
  var t = totalesProyecto(p, cat);
  var sep = (p.forma || "junta") === "separada";
  var mg = p.margenes || {};
  var wb = XLSX.utils.book_new();
  var enc = sep
    ? ["ITEM", "DESCRIPCION", "UND", "CANT", "APU", "VR MATERIAL", "VR MANO OBRA", "TOTAL MAT", "TOTAL MO"]
    : ["ITEM", "DESCRIPCION", "UND", "CANT", "APU", "VR UNITARIO", "VR TOTAL"];
  var cot = [enc];
  var hojas = Array.isArray(p.hojas) ? p.hojas : [];
  hojas.forEach(function (h) {
    if (!h || !h.usar) return;
    cot.push([h.nombre]);
    var filas = Array.isArray(h.filas) ? h.filas : [];
    filas.forEach(function (f) {
      if (!f) return;
      if (f.tipo === "cap") { cot.push([f.item, f.desc]); return; }
      var apu = f.apu || null;
      var a = apu && t.porApu ? (t.porApu[apu] || {}) : {};
      var q = Number(f.cant) || 0;
      var mat = Number(a.matConTh) || 0;
      var mo = Number(a.mo) || 0;
      cot.push(sep
        ? [f.item, f.desc, f.und, q, apu || "", mat || "", mo || "", mat ? mat * q : "", mo ? mo * q : ""]
        : [f.item, f.desc, f.und, q, apu || "", a.unitario || "", a.unitario ? a.unitario * q : ""]);
    });
  });
  var ws = XLSX.utils.aoa_to_sheet(cot);
  XLSX.utils.book_append_sheet(wb, ws, "COTIZACION");
  XLSX.writeFile(wb, (p.nombre || "propuesta").replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "_") + ".xlsx");
}

