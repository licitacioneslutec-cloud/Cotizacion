"use strict";

/* ------------------------------------------------------------------
   4bis. Catálogo de insumos y precios de proveedor
   ------------------------------------------------------------------ */

/* Hojas de composición que necesita el motor */
var HOJAS_COMP = [
  { llave: "tuberia",  busca: ["tuberia"] },
  { llave: "equipos",  busca: ["equipos"] },
  { llave: "tableros", busca: ["tableros"] },
  { llave: "salidas",  busca: ["salidas"] },
  { llave: "cableado", busca: ["cableado"] },
  { llave: "bornas",   busca: ["bornas"] }
];

/* Convierte una hoja en registros usando su primera fila como encabezado */
function hojaARegistros(wb, nombre) {
  var filas = XLSX.utils.sheet_to_json(wb.Sheets[nombre], {
    header: 1, raw: true, defval: null, blankrows: false
  });
  if (!filas.length) return [];
  var enc = (filas[0] || []).map(function (v) { return txt(v); });
  var out = [];
  for (var i = 1; i < filas.length; i++) {
    var f = filas[i] || [], r = {}, algo = false;
    for (var c = 0; c < enc.length; c++) {
      if (!enc[c] || enc[c].indexOf("Unnamed") === 0) continue;
      var v = f[c];
      if (v !== null && v !== undefined && String(v).trim() !== "") algo = true;
      r[enc[c]] = v;
    }
    if (algo) out.push(r);
  }
  return out;
}

/* Lee la hoja BASE DE DATOS de Datos_APU y arma el catálogo */
function leerCatalogo(buffer, nombreArchivo) {
  var wb = XLSX.read(buffer, { type: "array" });

  /* Buscamos la hoja que tenga código, descripción y precio */
  var mejor = null;
  wb.SheetNames.forEach(function (nombre) {
    var filas = XLSX.utils.sheet_to_json(wb.Sheets[nombre], {
      header: 1, raw: false, defval: null, blankrows: false
    });
    var det = detectarCols(filas, ROLES_PRECIO);
    if (!det) return;
    if (det.mapa.cod === undefined || det.mapa.precio === undefined) return;
    var n = filas.length;
    if (!mejor || n > mejor.n) mejor = { hoja: nombre, filas: filas, det: det, n: n };
  });

  if (!mejor) throw new Error("sin hoja de precios");

  var m = mejor.det.mapa;
  var items = [], vistos = {};
  for (var i = mejor.det.fila + 1; i < mejor.filas.length; i++) {
    var f = mejor.filas[i] || [];
    var cod = codClave(f[m.cod]);
    if (!cod || cod === "NAN") continue;
    if (vistos[cod]) continue;
    vistos[cod] = true;
    items.push({
      cod: cod,
      desc: m.desc !== undefined ? txt(f[m.desc]) : "",
      und: m.und !== undefined ? txt(f[m.und]) : "",
      precio: m.precio !== undefined ? aNum(f[m.precio]) : 0,
      precioAnt: 0,
      prov: "",
      codProv: m.codprov !== undefined ? txt(f[m.codprov]) : "",
      act: ""
    });
  }

  /* Hojas de composición: se guardan tal cual para que el motor las consulte */
  var comp = {};
  HOJAS_COMP.forEach(function (h) {
    var nombre = wb.SheetNames.find(function (n) {
      var t = norm(n);
      return h.busca.some(function (b) { return t === b || t.indexOf(b) === 0; });
    });
    comp[h.llave] = nombre ? hojaARegistros(wb, nombre) : [];
  });

  return {
    archivo: nombreArchivo, hoja: mejor.hoja, cargado: new Date().toISOString(),
    items: items, comp: comp
  };
}

/* Detección genérica de encabezado contra un juego de roles */
function detectarCols(filas, roles) {
  var lim = Math.min(filas.length, 40);
  for (var i = 0; i < lim; i++) {
    var f = filas[i] || [];
    var vistos = {};
    for (var c = 0; c < f.length; c++) {
      var t = norm(f[c]);
      if (!t) continue;
      for (var r = 0; r < roles.length; r++) {
        if (vistos[roles[r].id] === undefined && roles[r].test(t)) { vistos[roles[r].id] = c; break; }
      }
    }
    if (Object.keys(vistos).length >= 2) return { fila: i, mapa: vistos };
  }
  return null;
}

/* Lee un archivo de precios de proveedor: devuelve las hojas con su lectura */
function leerListaPrecios(buffer) {
  var wb = XLSX.read(buffer, { type: "array" });
  var hojas = [];
  wb.SheetNames.forEach(function (nombre) {
    var filas = XLSX.utils.sheet_to_json(wb.Sheets[nombre], {
      header: 1, raw: false, defval: null, blankrows: false
    });
    var det = detectarCols(filas, ROLES_PRECIO);
    var columnas = [];
    if (det) {
      columnas = (filas[det.fila] || []).map(function (v, i) {
        var rol = null;
        Object.keys(det.mapa).forEach(function (k) { if (det.mapa[k] === i) rol = k; });
        return { i: i, nombre: txt(v), rol: rol };
      }).filter(function (c) { return c.nombre !== ""; });
    }
    hojas.push({
      nombre: nombre, filas: filas, ok: !!det,
      encabezado: det ? det.fila : null, mapa: det ? det.mapa : {}, columnas: columnas
    });
  });
  return hojas;
}

/* Lee una lista de ofertas: varios proveedores para el mismo código */
function leerOfertas(hoja, mapa, cat) {
  var idx = Catalogo.indice(cat);
  var nuevas = [], fuera = [], vistos = {};
  for (var i = hoja.encabezado + 1; i < hoja.filas.length; i++) {
    var f = hoja.filas[i] || [];
    var cod = codClave(f[mapa.cod]);
    if (!cod || cod === "NAN") continue;
    var precio = mapa.precio !== undefined ? aNum(f[mapa.precio]) : 0;
    var marca = mapa.marca !== undefined ? txt(f[mapa.marca]) : "";
    var codAur = mapa.codAur !== undefined ? txt(f[mapa.codAur]) : "";
    var clave = cod + "|" + marca + "|" + codAur;
    if (vistos[clave]) continue;
    vistos[clave] = true;
    var of = {
      marca: marca, codAur: codAur,
      nombre: mapa.nombre !== undefined ? txt(f[mapa.nombre]) : "",
      precio: precio,
      und: mapa.und !== undefined ? txt(f[mapa.und]) : "",
      codCla: mapa.codCla !== undefined ? txt(f[mapa.codCla]) : "",
      estado: mapa.estado !== undefined ? txt(f[mapa.estado]) : ""
    };
    if (idx[cod] === undefined) { fuera.push({ cod: cod, of: of }); continue; }
    nuevas.push({ cod: cod, of: of });
  }
  return { nuevas: nuevas, fuera: fuera };
}

/* Mete las ofertas en el catálogo, reemplazando las de la misma marca */
function aplicarOfertas(cat, nuevas) {
  var idx = Catalogo.indice(cat);
  var tocados = {}, agregadas = 0, reemplazadas = 0;
  nuevas.forEach(function (n) {
    var it = cat.items[idx[n.cod]];
    if (!it) return;
    if (!it.ofertas) it.ofertas = [];
    var pos = -1;
    for (var i = 0; i < it.ofertas.length; i++) {
      var o = it.ofertas[i];
      if (limpia(o.marca) === limpia(n.of.marca) &&
          (!n.of.codAur || txt(o.codAur) === txt(n.of.codAur))) { pos = i; break; }
    }
    if (pos >= 0) { it.ofertas[pos] = n.of; reemplazadas++; }
    else { it.ofertas.push(n.of); agregadas++; }
    if (it.sel === undefined) it.sel = 0;
    it.act = new Date().toISOString();
    tocados[n.cod] = true;
  });
  return { agregadas: agregadas, reemplazadas: reemplazadas, insumos: Object.keys(tocados).length };
}

/* Compara una lista de precios contra el catálogo vigente */
function compararPrecios(cat, hoja, mapa) {
  var idx = Catalogo.indice(cat);
  var suben = [], bajan = [], estrena = [], iguales = [], fuera = [];
  var vistos = {};

  for (var i = hoja.encabezado + 1; i < hoja.filas.length; i++) {
    var f = hoja.filas[i] || [];
    var cod = codClave(f[mapa.cod]);
    if (!cod || cod === "NAN") continue;
    var nuevo = aNum(f[mapa.precio]);
    if (nuevo <= 0) continue;
    if (vistos[cod]) continue;
    vistos[cod] = true;

    var desc = mapa.desc !== undefined ? txt(f[mapa.desc]) : "";
    var codProv = mapa.codprov !== undefined ? txt(f[mapa.codprov]) : "";

    if (idx[cod] === undefined) {
      fuera.push({ cod: cod, desc: desc, nuevo: nuevo });
      continue;
    }
    var it = cat.items[idx[cod]];
    var viejo = Number(it.precio) || 0;
    var reg = {
      cod: cod, desc: it.desc || desc, und: it.und, viejo: viejo, nuevo: nuevo,
      codProv: codProv, var: viejo > 0 ? ((nuevo - viejo) / viejo) * 100 : null
    };
    if (viejo === 0) estrena.push(reg);
    else if (nuevo > viejo) suben.push(reg);
    else if (nuevo < viejo) bajan.push(reg);
    else iguales.push(reg);
  }
  return { suben: suben, bajan: bajan, estrena: estrena, iguales: iguales, fuera: fuera };
}

