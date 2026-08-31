"use strict";

/* ------------------------------------------------------------------
   Totales del proyecto
   El unitario de cada análisis se multiplica por la cantidad de cada
   ítem del anexo que lo usa. El AIU y el IVA se montan una sola vez
   sobre el subtotal, igual que en la carta de oferta.
   ------------------------------------------------------------------ */
function totalesProyecto(p, cat) {
  var mg = p.margenes || {};
  var subtotal = 0, conValor = 0, sinValor = 0, faltantes = 0, analisis = 0;
  var subMat = 0, subMo = 0;
  var porApu = {};

  if (cat && cat.comp) {
    analisisDe(p).forEach(function (a) {
      analisis++;
      var datos = (p.datosApu && p.datosApu[a.apu]) || {};
      var comp = componerAnalisis(cat, datos, p, a.apu);
      var val = valorizar(cat, comp.lineas, margenesDe(p, a.apu), p);
      porApu[a.apu] = {
        unitario: val.unitario, matConTh: val.matConTh, mo: val.mo,
        sinPrecio: val.sinPrecio, lineas: comp.lineas.length
      };
      faltantes += val.sinPrecio;
      a.items.forEach(function (it) {
        var q = Number(it.cant) || 0;
        if (val.unitario > 0) {
          subtotal += val.unitario * q;
          subMat += val.matConTh * q;
          subMo += val.mo * q;
          conValor++;
        } else sinValor++;
      });
    });
  }

  var pA = (mg.admin || 0) / 100, pI = (mg.imprev || 0) / 100;
  var pU = (mg.util || 0) / 100, pV = (mg.iva || 0) / 100;

  /* Forma junta: el AIU va sobre todo el subtotal */
  var admin = subtotal * pA, imprev = subtotal * pI, util = subtotal * pU;
  var iva = util * pV;

  /* Forma separada: el material lleva IVA; la mano de obra lleva AIU y su IVA sobre la utilidad */
  var ivaMat = subMat * pV;
  var moAdmin = subMo * pA, moImprev = subMo * pI, moUtil = subMo * pU;
  var moIva = moUtil * pV;
  var totalMat = subMat + ivaMat;
  var totalMo = subMo + moAdmin + moImprev + moUtil + moIva;

  return {
    subtotal: subtotal, admin: admin, imprev: imprev, util: util, iva: iva,
    total: subtotal + admin + imprev + util + iva,
    subMat: subMat, ivaMat: ivaMat, totalMat: totalMat,
    subMo: subMo, moAdmin: moAdmin, moImprev: moImprev, moUtil: moUtil, moIva: moIva, totalMo: totalMo,
    totalSep: totalMat + totalMo,
    conValor: conValor, sinValor: sinValor, faltantes: faltantes,
    analisis: analisis, porApu: porApu
  };
}

/* ------------------------------------------------------------------
   4. Lectura del anexo del cliente
   ------------------------------------------------------------------ */

/* Encuentra la fila de encabezado: la primera con 3 o más roles reconocidos */
function detectarEncabezado(filas) {
  var lim = Math.min(filas.length, 40);
  for (var i = 0; i < lim; i++) {
    var f = filas[i] || [];
    var vistos = {};
    for (var c = 0; c < f.length; c++) {
      var t = norm(f[c]);
      if (!t) continue;
      for (var r = 0; r < ROLES.length; r++) {
        if (!vistos[ROLES[r].id] && ROLES[r].test(t)) { vistos[ROLES[r].id] = c; break; }
      }
    }
    if (Object.keys(vistos).length >= 3) return { fila: i, mapa: vistos };
  }
  return null;
}

/* Convierte las filas en capítulos e ítems.
   Regla: un ítem tiene unidad y cantidad; un capítulo no. */
function extraerFilas(filas, hdr, mapa) {
  var out = [];
  for (var i = hdr + 1; i < filas.length; i++) {
    var f = filas[i] || [];
    var cItem = mapa.item, cDesc = mapa.desc, cUnd = mapa.und, cCant = mapa.cant;

    var item = cItem !== undefined ? codigoItem(f[cItem]) : "";
    var desc = cDesc !== undefined ? txt(f[cDesc]) : "";
    var und  = cUnd  !== undefined ? txt(f[cUnd])  : "";
    var cant = cCant !== undefined ? f[cCant] : null;

    if (!item && !desc) continue;
    if (norm(desc).indexOf("notas") === 0) continue;

    var tieneUnd = und !== "" && norm(und) !== "nan";
    var tieneCant = esNum(cant);

    if (tieneUnd && tieneCant) {
      out.push({ tipo: "it", item: item, desc: desc, und: und, cant: aNum(cant), cod: [], apu: null });
    } else if (desc) {
      out.push({ tipo: "cap", item: item, desc: desc });
    }
  }
  return out;
}

function leerLibro(buffer) {
  var wb = XLSX.read(buffer, { type: "array" });
  var hojas = [];
  wb.SheetNames.forEach(function (nombre) {
    var filas = XLSX.utils.sheet_to_json(wb.Sheets[nombre], {
      header: 1, raw: false, defval: null, blankrows: true
    });
    var det = detectarEncabezado(filas);
    if (!det) {
      hojas.push({ nombre: nombre, ok: false, encabezado: null, columnas: [], filas: [],
                   usar: false, crudas: filas });
      return;
    }
    var encab = (filas[det.fila] || []).map(function (v, i) {
      var rol = null;
      Object.keys(det.mapa).forEach(function (k) { if (det.mapa[k] === i) rol = k; });
      return { i: i, nombre: txt(v), rol: rol };
    }).filter(function (c) { return c.nombre !== ""; });

    var extraidas = extraerFilas(filas, det.fila, det.mapa);
    var nItems = extraidas.filter(function (x) { return x.tipo === "it"; }).length;

    hojas.push({
      nombre: nombre, ok: true, encabezado: det.fila, mapa: det.mapa,
      columnas: encab, filas: extraidas, usar: nItems > 0,
      crudas: filas,
      descartadas: filas.length - det.fila - 1 - extraidas.length
    });
  });
  return hojas;
}


/* ------------------------------------------------------------------
   6. Cálculos del proyecto
   ------------------------------------------------------------------ */

/* Garantiza la forma correcta de un proyecto que puede venir de la nube o de un respaldo viejo */
function normalizarProyecto(p) {
  if (!p) return p;
  if (!p.hojas) return p;
  p.hojas.forEach(function (h) {
    if (!h.filas) { h.filas = []; return; }
    h.filas.forEach(function (f) {
      if (f.tipo === "it") {
        if (!Array.isArray(f.cod)) f.cod = f.cod ? [f.cod] : [];
        if (f.apu === undefined) f.apu = null;
      }
    });
  });
  return p;
}

function itemsDe(p) {
  var out = [];
  (p.hojas || []).forEach(function (h, hi) {
    if (!h.usar) return;
    h.filas.forEach(function (f, fi) {
      if (f.tipo === "it") out.push({ f: f, hi: hi, fi: fi });
    });
  });
  return out;
}
function resumen(p) {
  var its = itemsDe(p);
  var asignados = its.filter(function (x) { return x.f.cod && x.f.cod.length > 0 && x.f.apu; }).length;
  var apus = {};
  its.forEach(function (x) { if (x.f.apu) apus[x.f.apu] = true; });
  return {
    items: its.length,
    asignados: asignados,
    analisis: Object.keys(apus).length,
    avance: its.length ? Math.round((asignados / its.length) * 100) : 0
  };
}
function totales(p) {
  var mg = p.margenes || {};
  var d = Number(p.costoDirecto) || 0;
  var a = d * ((mg.admin || 0) / 100);
  var i = d * ((mg.imprev || 0) / 100);
  var u = d * ((mg.util || 0) / 100);
  var v = u * ((mg.iva || 0) / 100);
  return { d: d, a: a, i: i, u: u, v: v, total: d + a + i + u + v };
}
function siguienteApu(p) {
  var max = 0;
  itemsDe(p).forEach(function (x) { if (x.f.apu && x.f.apu > max) max = x.f.apu; });
  return max + 1;
}

