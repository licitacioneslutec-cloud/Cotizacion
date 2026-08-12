/* ==================================================================
   Cotización eléctrica · armado de análisis de precios unitarios
   Versión 1 — sin backend. Los proyectos viven en este navegador.
   ================================================================== */

(function () {
"use strict";

/* ------------------------------------------------------------------
   1. Constantes del dominio
   ------------------------------------------------------------------ */

var APARTADOS = [
  { id: "CA", nombre: "Cableados" },
  { id: "TU", nombre: "Tuberías" },
  { id: "TA", nombre: "Tableros" },
  { id: "EQ", nombre: "Equipos" },
  { id: "SA", nombre: "Salidas" },
  { id: "mo", nombre: "Módulos" }
];

var PASOS = [
  { id: "ficha",     n: 1, nombre: "Ficha" },
  { id: "anexo",     n: 2, nombre: "Anexo del cliente" },
  { id: "armado",    n: 3, nombre: "Armado" },
  { id: "apartados", n: 4, nombre: "Apartados" },
  { id: "insumos",   n: 5, nombre: "Insumos" },
  { id: "entrega",   n: 6, nombre: "Entrega" }
];

/* Roles de columna que buscamos en el encabezado del anexo */
var ROLES = [
  { id: "item",   nombre: "Código de ítem",  test: function (t) { return t === "item" || t === "items" || t === "no" || t === "num"; } },
  { id: "desc",   nombre: "Descripción",     test: function (t) { return t.indexOf("descripcion") === 0 || t.indexOf("actividad") >= 0; } },
  { id: "und",    nombre: "Unidad",          test: function (t) { return t === "und" || t === "un" || t === "unidad" || t === "um" || t === "unid"; } },
  { id: "cant",   nombre: "Cantidad",        test: function (t) { return t.indexOf("cant") === 0; } },
  { id: "vunit",  nombre: "Valor unitario",  test: function (t) { return t.indexOf("unitario") >= 0 || t === "vunit" || t === "vrunit"; } },
  { id: "vtotal", nombre: "Valor total",     test: function (t) { return t.indexOf("total") >= 0; } }
];

var CLAVE = "apu.proyectos.v1";
var CLAVE_CAT = "apu.catalogo.v1";
var CLAVE_HIST = "apu.historial.v1";

/* Roles de columna que buscamos en un archivo de precios de proveedor */
var ROLES_PRECIO = [
  { id: "cod",    nombre: "Código del insumo", test: function (t) {
      return t === "codigo" || t === "codigos" || t === "cod" || t === "code" ||
             t === "referencia" || t === "ref" || t === "sku" || t === "item"; } },
  { id: "desc",   nombre: "Descripción",       test: function (t) {
      return t.indexOf("descripcion") === 0 || t === "nombre" || t === "articulo" || t === "material"; } },
  { id: "precio", nombre: "Precio",            test: function (t) {
      return t.indexOf("precio") === 0 || t.indexOf("unitario") >= 0 || t === "valor" ||
             t === "vrunit" || t === "costo" || t.indexOf("vunit") === 0; } },
  { id: "und",    nombre: "Unidad",            test: function (t) {
      return t === "und" || t === "un" || t === "unidad" || t === "um" || t === "unid"; } },
  { id: "codprov",nombre: "Código del proveedor", test: function (t) {
      return t.indexOf("codigoproveedor") === 0 || t.indexOf("codigoauranet") === 0 ||
             t.indexOf("refproveedor") === 0 || t.indexOf("codprov") === 0; } }
];

/* ------------------------------------------------------------------
   2. Utilidades
   ------------------------------------------------------------------ */

function norm(v) {
  if (v === null || v === undefined) return "";
  return String(v)
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}
function txt(v) {
  if (v === null || v === undefined) return "";
  return String(v).replace(/\s+/g, " ").trim();
}
function esNum(v) {
  if (v === null || v === undefined || v === "") return false;
  var n = Number(String(v).replace(/\./g, "").replace(",", "."));
  return !isNaN(n);
}
function aNum(v) {
  if (v === null || v === undefined || v === "") return 0;
  var s = String(v).trim();
  /* Formato colombiano: 1.234,56 → 1234.56 */
  if (/,\d{1,3}$/.test(s)) s = s.replace(/\./g, "").replace(",", ".");
  else s = s.replace(/,/g, "");
  var n = Number(s);
  return isNaN(n) ? 0 : n;
}
/* Los códigos de ítem llegan a veces como 3.3399999999999928 */
function codigoItem(v) {
  if (v === null || v === undefined) return "";
  var s = String(v).trim();
  if (/^\d+\.\d{6,}$/.test(s)) {
    var n = Number(s);
    var r = n.toFixed(2);
    return r.replace(/0+$/, "").replace(/\.$/, "");
  }
  return s;
}
function fmt(n) { return Number(n).toLocaleString("es-CO"); }
function dec(n) {
  var v = Number(n);
  if (!isFinite(v)) return "0";
  return v.toLocaleString("es-CO", { minimumFractionDigits: 0, maximumFractionDigits: 4 });
}
function cop(n) { return "$" + Math.round(Number(n) || 0).toLocaleString("es-CO"); }
function hoy() { return new Date().toISOString().slice(0, 10); }
function fecha(s) {
  if (!s) return "—";
  var p = String(s).split("-");
  if (p.length !== 3) return s;
  var mes = ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"];
  return Number(p[2]) + " " + mes[Number(p[1]) - 1] + " " + p[0];
}
function id() { return "p" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
function esc(s) {
  return String(s === null || s === undefined ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

/* ------------------------------------------------------------------
   2bis. Aviso de errores a la vista
   Si algo falla, se muestra en pantalla en vez de morir en silencio.
   ------------------------------------------------------------------ */

function avisoError(mensaje) {
  var caja = document.getElementById("errorglobal");
  if (!caja) {
    caja = document.createElement("div");
    caja.id = "errorglobal";
    caja.className = "errglobal";
    document.body.appendChild(caja);
  }
  caja.innerHTML =
    '<div class="errglobal-t">Algo falló</div>' +
    '<div class="errglobal-b">' + esc(mensaje) + '</div>' +
    '<div class="errglobal-a">' +
      '<button class="btn" id="errcopiar">Copiar el mensaje</button>' +
      '<button class="btn" id="errcerrar">Cerrar</button>' +
    '</div>';
  caja.style.display = "block";
  var cp = document.getElementById("errcopiar");
  if (cp) cp.onclick = function () {
    try { navigator.clipboard.writeText(mensaje); cp.textContent = "Copiado"; } catch (e) {}
  };
  var cc = document.getElementById("errcerrar");
  if (cc) cc.onclick = function () { caja.style.display = "none"; };
}

window.onerror = function (msg, url, linea, col) {
  avisoError(msg + "  (línea " + linea + ":" + col + ")");
  return false;
};
window.addEventListener("unhandledrejection", function (e) {
  avisoError("Fallo sin atender: " + (e.reason && e.reason.message ? e.reason.message : e.reason));
});

/* ------------------------------------------------------------------
   3. Almacenamiento
   ------------------------------------------------------------------ */

/* Los datos se guardan en el navegador, pero se mantienen en memoria mientras
   dure la sesión: volver a interpretarlos en cada redibujado ahoga la página. */
var _cacheProy = null;
var _cacheCat = null;
var _catLeido = false;
var _avisoEspacio = false;

var Store = {
  todos: function () {
    if (_cacheProy) return _cacheProy;
    try { _cacheProy = JSON.parse(localStorage.getItem(CLAVE) || "[]"); }
    catch (e) { _cacheProy = []; }
    return _cacheProy;
  },
  guardar: function (proy) {
    var lista = Store.todos(), i = -1;
    for (var k = 0; k < lista.length; k++) if (lista[k].id === proy.id) { i = k; break; }
    proy.modificado = new Date().toISOString();
    if (i >= 0) lista[i] = proy; else lista.unshift(proy);
    _cacheProy = lista;
    try { localStorage.setItem(CLAVE, JSON.stringify(lista)); return true; }
    catch (e) {
      if (!_avisoEspacio) {
        _avisoEspacio = true;
        avisoError("El navegador se quedó sin espacio y no se pudo guardar. Descarga el respaldo de tus proyectos y borra alguno que ya no uses.");
      }
      return false;
    }
  },
  leer: function (pid) {
    var l = Store.todos();
    for (var i = 0; i < l.length; i++) if (l[i].id === pid) return l[i];
    return null;
  },
  borrar: function (pid) {
    var lista = Store.todos().filter(function (p) { return p.id !== pid; });
    _cacheProy = lista;
    try { localStorage.setItem(CLAVE, JSON.stringify(lista)); } catch (e) {}
  }
};
/* Catálogo de insumos, compartido por todos los proyectos */
var Catalogo = {
  leer: function () {
    if (_catLeido) return _cacheCat;
    _catLeido = true;
    try { _cacheCat = JSON.parse(localStorage.getItem(CLAVE_CAT) || "null"); }
    catch (e) { _cacheCat = null; }
    return _cacheCat;
  },
  guardar: function (cat) {
    cat.modificado = new Date().toISOString();
    _cacheCat = cat; _catLeido = true;
    _idxCat = null;
    try { localStorage.setItem(CLAVE_CAT, JSON.stringify(cat)); return true; }
    catch (e) {
      avisoError("No se pudo guardar el catálogo: el navegador se quedó sin espacio.");
      return false;
    }
  },
  borrar: function () {
    localStorage.removeItem(CLAVE_CAT);
    _cacheCat = null; _catLeido = true; _idxCat = null;
  },
  indice: function (cat) {
    if (_idxCat && _idxCatDe === cat) return _idxCat;
    var m = {};
    if (cat) cat.items.forEach(function (it, i) { m[it.cod] = i; });
    _idxCat = m; _idxCatDe = cat;
    return m;
  },
  cobertura: function (cat) {
    if (!cat) return { total: 0, con: 0, sin: 0, pct: 0 };
    var con = 0;
    cat.items.forEach(function (i) { if (Number(i.precio) > 0) con++; });
    return {
      total: cat.items.length, con: con, sin: cat.items.length - con,
      pct: cat.items.length ? Math.round((con / cat.items.length) * 100) : 0
    };
  }
};
var _idxCat = null, _idxCatDe = null;

var Historial = {
  leer: function () {
    try { return JSON.parse(localStorage.getItem(CLAVE_HIST) || "[]"); }
    catch (e) { return []; }
  },
  agregar: function (reg) {
    var h = Historial.leer();
    h.unshift(reg);
    if (h.length > 40) h = h.slice(0, 40);
    try { localStorage.setItem(CLAVE_HIST, JSON.stringify(h)); } catch (e) {}
  }
};

/* Normaliza un código para poder emparejarlo entre archivos distintos */
function codClave(v) {
  if (v === null || v === undefined) return "";
  var s = String(v).trim();
  s = s.replace(/\.0+$/, "");
  return s.toUpperCase();
}

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
    header: 1, raw: false, defval: null, blankrows: false
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

/* ------------------------------------------------------------------
   4ter. Motor de composición
   ------------------------------------------------------------------ */

/* Códigos de mano de obra que llevan factor 0,75 en tubería PVC enterrada */
var CODIGOS_MO_075 = ["LTC_PMO006", "LTC_PMO003", "LTC_PMO007", "LTC_PMO008"];
var SUBITEM_075 = ["ZONA VERDE", "ANDEN"];

function esManoObra(cod) {
  return String(cod || "").toUpperCase().indexOf("LTC") === 0;
}
function limpia(v) { return txt(v).toUpperCase(); }

/* Opciones disponibles en el apartado de tuberías, en cascada */
function opcionesTuberia(cat, material, tipo) {
  var d = (cat && cat.comp && cat.comp.tuberia) || [];
  var fam = {}, sub = {}, dia = {};
  d.forEach(function (r) {
    var f = limpia(r["Familia"]), s = limpia(r["SUB-ITEM"]), c = txt(r["C. Tuberia"]);
    if (!f) return;
    fam[f] = true;
    if (material && f !== limpia(material)) return;
    if (s) sub[s] = true;
    if (tipo && s !== limpia(tipo)) return;
    if (c) dia[c] = true;
  });
  var orden = function (o) { return Object.keys(o).sort(); };
  return { familias: orden(fam), tipos: orden(sub), diametros: orden(dia) };
}

/* Compone una fila de tubería. Réplica de la sección 5.2 del proceso actual. */
function componerTuberia(cat, fila) {
  var d = (cat && cat.comp && cat.comp.tuberia) || [];
  var mat = limpia(fila.material), tipo = limpia(fila.tipo), dia = txt(fila.diam);
  var cantM = Number(fila.cantidad) || 0;
  if (cantM === 0) cantM = 1;

  var encontradas = d.filter(function (r) {
    return limpia(r["Familia"]) === mat &&
           limpia(r["SUB-ITEM"]) === tipo &&
           txt(r["C. Tuberia"]) === dia;
  });
  if (!encontradas.length) return { lineas: [], aviso: "No hay esa combinación en el catálogo" };

  var aplica075 = mat === "PVC" && SUBITEM_075.indexOf(tipo) >= 0 && cantM > 1;

  var lineas = encontradas.map(function (r) {
    var cod = codClave(r["CODIGO"]);
    var con075 = aplica075 && CODIGOS_MO_075.indexOf(cod) >= 0;
    var factor = cantM * (con075 ? 0.75 : 1);
    return {
      cant: aNum(r["CANT"]) * factor,
      cod: cod,
      desc: txt(r["DESCRIPCION"]),
      und: txt(r["UNID"]),
      f075: con075
    };
  });
  return { lineas: lineas, aplica075: aplica075, aviso: null };
}

/* Contadores correlativos por familia, para los ítems que se crean */
var CONTADOR_INICIAL = {
  TRAFO: 5560010, CELDA: 5660010, TABLERO: 5760010,
  CAJA_MAMPOSTERIA: 5860010, CAJA_METALICA: 5870010, SUBESTACION: 5880010,
  CAJA_PVC: 5890010, LUMINARIA: 5910010, APANTALLAMIENTO: 5920010,
  SIS_INCENDIO: 6020010, SIS_RITEL: 6030010, SIS_SEG_CTRL: 6040010,
  SIS_SEG_CCTV: 6050010, SIS_COMM: 6060010, SIS_AUTOM: 6070010,
  SIS_CTRL_ILU: 6080010, BORNA: 653100034, DOCUMENTACION: 6090010, EQUI_URB: 6100010
};

/* Opciones del apartado de equipos, en cascada */
function opcionesEquipo(cat, familia) {
  var d = (cat && cat.comp && cat.comp.equipos) || [];
  var fam = {}, sub = {};
  d.forEach(function (r) {
    var f = limpia(r["FAMILIA"]), s = limpia(r["SUBFAMILIA"]);
    if (f) fam[f] = true;
    if (familia && f !== limpia(familia)) return;
    if (s) sub[s] = true;
  });
  return { familias: Object.keys(fam).sort(), subfamilias: Object.keys(sub).sort() };
}

/* Todas las subfamilias, para el apartado de módulos */
function subfamiliasEquipo(cat) {
  var d = (cat && cat.comp && cat.comp.equipos) || [];
  var s = {};
  d.forEach(function (r) { var v = limpia(r["SUBFAMILIA"]); if (v) s[v] = true; });
  return Object.keys(s).sort();
}

/* Reserva el siguiente código correlativo de una familia */
function siguienteCodigo(p, familia) {
  if (!p.contadores) p.contadores = {};
  var f = limpia(familia);
  if (p.contadores[f] === undefined) {
    p.contadores[f] = CONTADOR_INICIAL[f] !== undefined ? CONTADOR_INICIAL[f] : null;
  }
  if (p.contadores[f] === null) return "ITEM_" + f;
  var cod = String(p.contadores[f]);
  p.contadores[f] += 1;
  return cod;
}

/* Compone una fila de equipos. Réplica de la sección 5.4 del proceso actual. */
function componerEquipo(cat, fila, p, apu) {
  var d = (cat && cat.comp && cat.comp.equipos) || [];
  var fam = limpia(fila.familia), sub = limpia(fila.subfamilia);
  if (!fam || !sub) return { lineas: [], aviso: null, incompleto: true };

  var enc = d.filter(function (r) {
    return limpia(r["FAMILIA"]) === fam && limpia(r["SUBFAMILIA"]) === sub;
  });
  if (!enc.length) return { lineas: [], aviso: "No hay coincidencia: " + fam + " / " + sub };

  var lineas = [], creado = null;
  var quitarPrincipal = false;

  if (fila.crearItem && txt(fila.nombreItem)) {
    /* El código se reserva una vez y queda guardado con la fila */
    if (!fila.codItem) {
      fila.codItem = siguienteCodigo(p, fam);
      Store.guardar(p);
    }
    creado = { cod: fila.codItem, desc: txt(fila.nombreItem) };
    lineas.push({
      cant: 1, cod: fila.codItem, desc: txt(fila.nombreItem),
      und: txt(fila.unidad) || "UND", propio: true
    });
    quitarPrincipal = true;
  }

  var mo = Number(fila.manoObra) || 0;

  enc.forEach(function (r) {
    var marca = limpia(r["ITEMP"]);
    if (quitarPrincipal && marca === "PRINCIPAL") return;
    var inc = aNum(r["INCIDENCIA"]);
    var cant = (marca === "MN" && mo > 0) ? mo : inc;
    lineas.push({
      cant: cant, cod: codClave(r["CODIGO"]), desc: txt(r["DESCRIPCION"]),
      und: txt(r["UNIDAD"]), mn: marca === "MN"
    });
  });

  return { lineas: lineas, creado: creado, aviso: null };
}

/* Compone una fila de módulos: busca en equipos solo por subfamilia */
function componerModulo(cat, fila) {
  var d = (cat && cat.comp && cat.comp.equipos) || [];
  var item = limpia(fila.item);
  if (!item) return { lineas: [], incompleto: true };

  var enc = d.filter(function (r) { return limpia(r["SUBFAMILIA"]) === item; });
  if (!enc.length) return { lineas: [], aviso: "No se encontró en equipos: " + item };

  var cu = Number(fila.cantidad);
  if (!cu) cu = 1;
  return {
    lineas: enc.map(function (r) {
      return {
        cant: aNum(r["INCIDENCIA"]) * cu, cod: codClave(r["CODIGO"]),
        desc: txt(r["DESCRIPCION"]), und: txt(r["UNIDAD"])
      };
    }), aviso: null
  };
}

/* Los ítems que crea el usuario entran al catálogo para poder valorizarlos */
function registrarPropio(cat, fila) {
  var idx = Catalogo.indice(cat);
  var cod = codClave(fila.codItem);
  var it;
  if (idx[cod] === undefined) {
    it = { cod: cod, desc: "", und: "", precio: 0, precioAnt: 0, prov: "", codProv: "", act: "", propio: true };
    cat.items.push(it);
    _idxCat = null;
  } else {
    it = cat.items[idx[cod]];
  }
  var cambio = false;
  var nd = txt(fila.nombreItem), nu = txt(fila.unidad) || "UND", np = Number(fila.precio) || 0;
  if (it.desc !== nd) { it.desc = nd; cambio = true; }
  if (it.und !== nu) { it.und = nu; cambio = true; }
  if (Number(it.precio) !== np) { it.precio = np; cambio = true; }
  if (!!it.imp !== !!fila.imp) { it.imp = !!fila.imp; cambio = true; }
  if (cambio) Catalogo.guardar(cat);
}

/* ------------------------------------------------------------------
   Tableros
   El catálogo ya trae las protecciones listadas ("3x40 A 10kA"), así que
   aquí se eligen de una lista en vez de escribirlas y descifrarlas.
   ------------------------------------------------------------------ */

var FAM_TABLERO = ["MONOFASICO", "BIFASICO", "TRIFASICO", "DRX", "DPX"];

function opcionesTablero(cat, familia) {
  var d = (cat && cat.comp && cat.comp.tableros) || [];
  var fam = {}, sub = {};
  d.forEach(function (r) {
    var f = limpia(r["Familia"]), s = txt(r["SUB-ITEM"]);
    if (f) fam[f] = true;
    if (familia && f !== limpia(familia)) return;
    if (s) sub[s] = true;
  });
  var todas = Object.keys(fam).sort();
  return {
    tableros: todas.filter(function (f) { return FAM_TABLERO.indexOf(f) >= 0; }),
    protecciones: todas.filter(function (f) { return FAM_TABLERO.indexOf(f) < 0; }),
    subitems: Object.keys(sub).sort(function (a, b) {
      var na = parseFloat(a), nb = parseFloat(b);
      if (!isNaN(na) && !isNaN(nb) && na !== nb) return na - nb;
      return a.localeCompare(b, "es");
    })
  };
}

function itemsTablero(cat, familia, subitem) {
  var d = (cat && cat.comp && cat.comp.tableros) || [];
  return d.filter(function (r) {
    return limpia(r["Familia"]) === limpia(familia) &&
           normSub(r["SUB-ITEM"]) === normSub(subitem);
  });
}
function normSub(v) { return limpia(v).replace(/\s+/g, ""); }

/* Compone una fila de tableros: el tablero base más sus protecciones */
function componerTablero(cat, fila) {
  var lineas = [], avisos = [];

  if (fila.familia && fila.subitem) {
    var base = itemsTablero(cat, fila.familia, fila.subitem);
    if (!base.length) avisos.push("No hay tablero " + limpia(fila.familia) + " " + txt(fila.subitem));
    base.forEach(function (r) {
      lineas.push({
        cant: aNum(r["CANT"]), cod: codClave(r["CODIGO"]),
        desc: txt(r["DESCRIPCION"]), und: txt(r["UNIDAD"])
      });
    });
  }

  (fila.prot || []).forEach(function (pr, i) {
    if (!pr.familia || !pr.subitem) return;
    var cant = Number(pr.cantidad) || 0;
    if (cant <= 0) return;
    var enc = itemsTablero(cat, pr.familia, pr.subitem);
    if (!enc.length) {
      avisos.push("Protección " + (i + 1) + ": no existe " + limpia(pr.familia) + " " + txt(pr.subitem));
      return;
    }
    enc.forEach(function (r) {
      lineas.push({
        cant: aNum(r["CANT"]) * cant, cod: codClave(r["CODIGO"]),
        desc: txt(r["DESCRIPCION"]), und: txt(r["UNIDAD"])
      });
    });
  });

  return { lineas: lineas, aviso: avisos.length ? avisos.join(" · ") : null };
}

/* ------------------------------------------------------------------
   Cableados
   Los 100 cables del catálogo se eligen de una lista, así que no hay
   que descifrar textos como "1/0 THHN CU": el cable ya viene con su
   código, su descripción y su rendimiento de mano de obra.
   ------------------------------------------------------------------ */

/* Calibre de una descripción, para emparejar cable con borna */
function calibreDe(texto) {
  var t = limpia(texto);
  var m = t.match(/(\d+)\s*MM2/);        if (m) return m[1];
  m = t.match(/(\d+)\s*\/\s*0/);          if (m) return m[1] + "/0";
  m = t.match(/(\d+)\s*MCM/);             if (m) return m[1];
  m = t.match(/(\d+)\s*AWG/);             if (m) return m[1];
  m = t.match(/(\d+)\s*[X]\s*(\d+)/);     if (m) return m[1] + "x" + m[2];
  m = t.match(/\d+/);                     return m ? m[0] : null;
}

/* Cables que no llevan borna estándar por calibre */
function sinBornaEstandar(desc) {
  var t = limpia(desc);
  return t.indexOf("DUPLEX") >= 0 || t.indexOf("SPT") >= 0 ||
         t.indexOf("ENCAU") >= 0 || t.indexOf("ALAMBRON") >= 0 ||
         t.indexOf("UTP") >= 0 || t.indexOf("COAXIAL") >= 0;
}
function esUTP(desc) { return limpia(desc).indexOf("UTP") >= 0; }

function listaCables(cat) {
  var d = (cat && cat.comp && cat.comp.cableado) || [];
  return d.map(function (r, i) {
    return {
      i: i, cod: codClave(r["codigo cable"]), desc: txt(r["descricion cable"]),
      pmo: aNum(r["cantidades mano de obra"]),
      codMo: codClave(r["Codigo mano de obra"]), nomMo: txt(r["nombre mano de obra"])
    };
  }).filter(function (c) { return c.cod && c.desc; });
}

function bornaPorCalibre(cat, calibre) {
  var d = (cat && cat.comp && cat.comp.bornas) || [];
  for (var i = 0; i < d.length; i++) {
    var desc = txt(d[i]["Descripcion"]);
    if (limpia(desc).indexOf("COAXIAL") >= 0) continue;   /* el RG-6 va solo a los UTP */
    if (calibreDe(desc) === calibre) {
      return { cod: codClave(d[i]["Codigo Bornas"]), desc: desc, und: txt(d[i]["UNIDAD"]) };
    }
  }
  return null;
}
function conectorCoaxial(cat) {
  var d = (cat && cat.comp && cat.comp.bornas) || [];
  for (var i = 0; i < d.length; i++) {
    if (limpia(d[i]["Descripcion"]).indexOf("COAXIAL") >= 0) {
      return { cod: codClave(d[i]["Codigo Bornas"]), desc: txt(d[i]["Descripcion"]), und: txt(d[i]["UNIDAD"]) };
    }
  }
  return null;
}

/* Compone una acometida: los cables, su mano de obra y sus bornas */
function componerCableado(cat, fila) {
  var cables = listaCables(cat);
  var porCod = {};
  cables.forEach(function (c) { porCod[c.cod] = c; });

  var lineas = [], avisos = [];
  var totalPmo = 0, moRef = null;
  var bornasPorCal = {}, utpTotal = 0;

  var metrado = Number(fila.metrado) || 0;
  var repite = Number(fila.repite) || 0;
  var divisor = metrado > 0 ? metrado : 1;
  var factor = repite > 0 ? repite : 1;

  ["fase", "neutro", "tierra"].forEach(function (rol) {
    var codCable = fila[rol];
    var cant = Number(fila["cant" + rol.charAt(0).toUpperCase() + rol.slice(1)]) || 0;
    if (!codCable || cant <= 0) return;

    var c = porCod[codClave(codCable)];
    if (!c) { avisos.push("El cable de " + rol + " ya no está en el catálogo"); return; }

    lineas.push({ cant: cant, cod: c.cod, desc: c.desc, und: "ML" });
    totalPmo += c.pmo * cant;
    if (!moRef) moRef = c;

    if (fila.bornas) {
      if (esUTP(c.desc)) utpTotal += cant;
      else if (!sinBornaEstandar(c.desc)) {
        var k = calibreDe(c.desc);
        if (k) bornasPorCal[k] = (bornasPorCal[k] || 0) + cant;
      }
    }
  });

  if (totalPmo > 0 && moRef) {
    lineas.push({ cant: totalPmo, cod: moRef.codMo, desc: moRef.nomMo, und: "Hrs" });
  }

  if (fila.bornas) {
    Object.keys(bornasPorCal).forEach(function (k) {
      var b = bornaPorCalibre(cat, k);
      if (!b) { avisos.push("No hay borna para calibre " + k); return; }
      lineas.push({
        cant: (bornasPorCal[k] * 2) / divisor * factor,
        cod: b.cod, desc: b.desc, und: b.und
      });
    });
    if (utpTotal > 0) {
      var rg = conectorCoaxial(cat);
      if (rg) lineas.push({ cant: (utpTotal * 2) / divisor * factor, cod: rg.cod, desc: rg.desc, und: rg.und });
      else avisos.push("No se encontró el conector coaxial RG-6");
    }
  }

  return { lineas: lineas, aviso: avisos.length ? avisos.join(" · ") : null };
}

/* Compone todas las filas de un análisis */
function componerAnalisis(cat, datos, p, apu) {
  var lineas = [], avisos = [], reglas = [], creados = [];

  ((datos && datos.TU) || []).forEach(function (fila, i) {
    var r = componerTuberia(cat, fila);
    if (r.aviso) { avisos.push("Tubería " + (i + 1) + ": " + r.aviso); return; }
    if (r.aplica075) reglas.push("Se aplicó el factor 0,75 a la mano de obra por tubería " +
      limpia(fila.material) + " en " + limpia(fila.tipo).toLowerCase() + " con más de un metro.");
    lineas = lineas.concat(r.lineas);
  });

  ((datos && datos.EQ) || []).forEach(function (fila, i) {
    if (fila.crearItem && fila.codItem && txt(fila.nombreItem)) registrarPropio(cat, fila);
    var r = componerEquipo(cat, fila, p, apu);
    if (r.aviso) { avisos.push("Equipo " + (i + 1) + ": " + r.aviso); return; }
    if (r.creado) creados.push(r.creado);
    lineas = lineas.concat(r.lineas);
  });

  ((datos && datos.CA) || []).forEach(function (fila, i) {
    var r = componerCableado(cat, fila);
    if (r.aviso) avisos.push("Acometida " + (i + 1) + ": " + r.aviso);
    lineas = lineas.concat(r.lineas);
  });

  ((datos && datos.TA) || []).forEach(function (fila, i) {
    var r = componerTablero(cat, fila);
    if (r.aviso) avisos.push("Tablero " + (i + 1) + ": " + r.aviso);
    lineas = lineas.concat(r.lineas);
  });

  ((datos && datos.mo) || []).forEach(function (fila, i) {
    var r = componerModulo(cat, fila);
    if (r.aviso) { avisos.push("Módulo " + (i + 1) + ": " + r.aviso); return; }
    lineas = lineas.concat(r.lineas);
  });

  /* Se suman las líneas repetidas del mismo código */
  var mapa = {}, orden = [];
  lineas.forEach(function (l) {
    if (mapa[l.cod]) { mapa[l.cod].cant += l.cant; return; }
    mapa[l.cod] = { cant: l.cant, cod: l.cod, desc: l.desc, und: l.und, f075: l.f075, propio: l.propio };
    orden.push(l.cod);
  });
  /* Ajustes manuales: cantidad cambiada o línea quitada en este análisis */
  var aj = (datos && datos.ajustes) || {};
  var finales = [];
  orden.forEach(function (c) {
    var l = mapa[c];
    var a = aj[c];
    if (a && a.quitado) return;
    if (a && a.cant !== undefined && a.cant !== null && a.cant !== "") {
      l.cantOrig = l.cant;
      l.cant = Number(a.cant) || 0;
      l.ajustada = true;
    }
    finales.push(l);
  });

  var quitadas = 0;
  Object.keys(aj).forEach(function (c) { if (aj[c] && aj[c].quitado && mapa[c]) quitadas++; });

  return {
    lineas: finales, avisos: avisos, reglas: reglas, creados: creados, quitadas: quitadas
  };
}

/* Precio de venta de un insumo: al costo se le monta la rentabilidad y,
   si es importado, el factor de dólar. Ambos sobre el precio de venta,
   igual que en la hoja de márgenes: costo / (1 - factor). */
function precioAjustado(it, mg) {
  var base = it ? Number(it.precio) || 0 : 0;
  if (base <= 0) return 0;
  var rent = it.rent !== undefined && it.rent !== null ? Number(it.rent) : Number(mg.rent || 0);
  var dol = it.imp ? (it.dol !== undefined && it.dol !== null ? Number(it.dol) : Number(mg.dolar || 0)) : 0;
  var v = base;
  if (rent > 0 && rent < 100) v = v / (1 - rent / 100);
  if (dol > 0 && dol < 100) v = v / (1 - dol / 100);
  return v;
}

/* Le pone precio a cada línea y calcula subtotales */
function valorizar(cat, lineas, margenes) {
  var idx = Catalogo.indice(cat);
  var mg = margenes || {};
  var mat = 0, mo = 0, sinPrecio = 0;

  var conPrecio = lineas.map(function (l) {
    var it = idx[l.cod] !== undefined ? cat.items[idx[l.cod]] : null;
    var base = it ? Number(it.precio) || 0 : 0;
    var precio = precioAjustado(it, mg);
    var total = l.cant * precio;
    if (precio <= 0) sinPrecio++;
    if (esManoObra(l.cod)) mo += total; else mat += total;
    return {
      cant: l.cant, cod: l.cod, desc: l.desc || (it ? it.desc : ""),
      und: l.und || (it ? it.und : ""), base: base, precio: precio, total: total,
      falta: precio <= 0, mo: esManoObra(l.cod), f075: l.f075,
      propio: l.propio, imp: it ? !!it.imp : false, enCatalogo: !!it
    };
  });

  var directo = mat + mo;
  return {
    lineas: conPrecio, mat: mat, mo: mo, directo: directo,
    unitario: directo, sinPrecio: sinPrecio,
    pesoMo: directo > 0 ? Math.round((mo / directo) * 100) : 0
  };
}

/* ------------------------------------------------------------------
   Totales del proyecto
   El unitario de cada análisis se multiplica por la cantidad de cada
   ítem del anexo que lo usa. El AIU y el IVA se montan una sola vez
   sobre el subtotal, igual que en la carta de oferta.
   ------------------------------------------------------------------ */
function totalesProyecto(p, cat) {
  var mg = p.margenes || {};
  var subtotal = 0, conValor = 0, sinValor = 0, faltantes = 0, analisis = 0;
  var porApu = {};

  if (cat && cat.comp) {
    analisisDe(p).forEach(function (a) {
      analisis++;
      var datos = (p.datosApu && p.datosApu[a.apu]) || {};
      var comp = componerAnalisis(cat, datos, p, a.apu);
      var val = valorizar(cat, comp.lineas, mg);
      porApu[a.apu] = { unitario: val.unitario, sinPrecio: val.sinPrecio, lineas: comp.lineas.length };
      faltantes += val.sinPrecio;
      a.items.forEach(function (it) {
        if (val.unitario > 0) { subtotal += val.unitario * (Number(it.cant) || 0); conValor++; }
        else sinValor++;
      });
    });
  }

  var admin = subtotal * ((mg.admin || 0) / 100);
  var imprev = subtotal * ((mg.imprev || 0) / 100);
  var util = subtotal * ((mg.util || 0) / 100);
  var iva = util * ((mg.iva || 0) / 100);

  return {
    subtotal: subtotal, admin: admin, imprev: imprev, util: util, iva: iva,
    total: subtotal + admin + imprev + util + iva,
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
      hojas.push({ nombre: nombre, ok: false, encabezado: null, columnas: [], filas: [], usar: false });
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
      descartadas: filas.length - det.fila - 1 - extraidas.length
    });
  });
  return hojas;
}

/* ------------------------------------------------------------------
   5. Estado de la vista
   ------------------------------------------------------------------ */

var vista = { pantalla: "proyectos", pid: null, paso: "ficha", hoja: 0, sel: [], borrador: null,
              precios: null, busca: "", soloSin: false, apu: null };
var app = document.getElementById("app");

function ir(cambios) {
  Object.keys(cambios).forEach(function (k) { vista[k] = cambios[k]; });
  render();
}

/* ------------------------------------------------------------------
   6. Cálculos del proyecto
   ------------------------------------------------------------------ */

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
  var asignados = its.filter(function (x) { return x.f.cod.length > 0 && x.f.apu; }).length;
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

/* ------------------------------------------------------------------
   7. Render
   ------------------------------------------------------------------ */

function render() {
  if (vista.pantalla === "catalogo") return renderCatalogo();
  if (vista.pantalla === "precios") return renderPrecios();
  if (vista.pantalla === "proyectos") return renderProyectos();
  if (vista.pantalla === "nuevo") return renderNuevo();
  return renderProyecto();
}

/* ------------------------------------------------------------------
   7bis. Catálogo de insumos
   ------------------------------------------------------------------ */

function barraTop(activa) {
  return '<div class="tira"><div class="wrap tirain">' +
    '<button class="tirab' + (activa === "proyectos" ? " on" : "") + '" data-top="proyectos">Proyectos</button>' +
    '<button class="tirab' + (activa === "catalogo" ? " on" : "") + '" data-top="catalogo">Catálogo de insumos</button>' +
    '</div></div>';
}
function enlazarTop() {
  Array.prototype.forEach.call(document.querySelectorAll("[data-top]"), function (b) {
    b.onclick = function () { ir({ pantalla: b.dataset.top, sel: [], precios: null }); };
  });
}

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
      var tiene = Number(i.precio) > 0;
      return '<tr' + (tiene ? "" : ' class="filasinp"') + '>' +
        '<td class="m" style="font-size:12px">' + esc(i.cod) + '</td>' +
        '<td>' + esc(i.desc) + '</td>' +
        '<td><input class="in inund" data-cund="' + esc(i.cod) + '" value="' + esc(i.und || "") + '"></td>' +
        '<td class="num"><input class="in m inprecio' + (tiene ? " ok" : "") + '" type="number" min="0" step="1" ' +
          'data-cprecio="' + esc(i.cod) + '" value="' + (tiene ? i.precio : "") + '" placeholder="sin precio"></td>' +
        '<td style="text-align:center"><input type="checkbox" data-cimp="' + esc(i.cod) + '"' +
          (i.imp ? " checked" : "") + ' title="Importado: lleva el factor de dólar"></td>' +
        '<td style="font-size:12px;color:var(--ink3)">' + esc(i.prov || "—") + '</td>' +
        '<td style="font-size:12px;color:var(--ink3)">' + (i.act ? fecha(i.act.slice(0, 10)) : "—") + '</td>' +
      '</tr>';
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
          '<button class="btn" id="expcat">Descargar catálogo</button>' +
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
          '<th style="width:96px">Código</th><th>Descripción</th><th style="width:74px">Und</th>' +
          '<th style="width:112px" class="num">Precio costo</th>' +
          '<th style="width:44px;text-align:center" title="Importado">Imp.</th>' +
          '<th style="width:104px">Proveedor</th><th style="width:88px">Actualizado</th>' +
        '</tr></thead><tbody>' + filas + '</tbody></table></div>' +
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

  /* edición directa de precio, unidad e importado */
  var editar = function (attr, aplica) {
    Array.prototype.forEach.call(document.querySelectorAll("[" + attr + "]"), function (el) {
      var accion = function () {
        var c = Catalogo.leer();
        var ix = Catalogo.indice(c);
        var i = ix[el.getAttribute(attr)];
        if (i === undefined) return;
        aplica(c.items[i], el);
        c.items[i].act = new Date().toISOString();
        Catalogo.guardar(c);
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
  editar("data-cund", function (it, el) { it.und = el.value; });
  editar("data-cimp", function (it, el) { it.imp = el.checked; });

  var mf = document.getElementById("masfilas");
  if (mf) mf.onclick = function () {
    vista.tope = (vista.tope || 150) + 150;
    var y = window.scrollY; render(); window.scrollTo(0, y);
  };

  var act = document.getElementById("actualizar");
  if (act) act.onclick = function () { ir({ pantalla: "precios", precios: null }); };

  var exp = document.getElementById("expcat");
  if (exp) exp.onclick = function () {
    var datos = [["CODIGO", "DESCRIPCION", "UNIDAD", "PRECIO", "PRECIO ANTERIOR", "PROVEEDOR", "CODIGO PROVEEDOR", "ACTUALIZADO"]];
    cat.items.forEach(function (i) {
      datos.push([i.cod, i.desc, i.und, i.precio, i.precioAnt || "", i.prov || "", i.codProv || "",
        i.act ? i.act.slice(0, 10) : ""]);
    });
    var ws = XLSX.utils.aoa_to_sheet(datos);
    ws["!cols"] = [{ wch: 14 }, { wch: 58 }, { wch: 8 }, { wch: 13 }, { wch: 13 }, { wch: 18 }, { wch: 16 }, { wch: 12 }];
    var wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "CATALOGO");
    XLSX.writeFile(wb, "catalogo_insumos.xlsx");
  };
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

/* ---- 7.1 Lista de proyectos ---- */

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
    vista.borrador = { nombre: "", cliente: "", ciudad: "", recibo: hoy(), entrega: "", hojas: null, archivo: "" };
    ir({ pantalla: "nuevo" });
  };
  document.getElementById("exportall").onclick = function () {
    var paquete = {
      formato: "apu-respaldo",
      version: 1,
      fecha: new Date().toISOString(),
      catalogo: Catalogo.leer(),
      proyectos: Store.todos(),
      historial: Historial.leer()
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
          _cacheProy = datos.proyectos || [];
          localStorage.setItem(CLAVE, JSON.stringify(_cacheProy));
          if (datos.historial) localStorage.setItem(CLAVE_HIST, JSON.stringify(datos.historial));
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
    b.onclick = function () { ir({ pantalla: "proyecto", pid: b.dataset.abrir, paso: "ficha", hoja: 0, sel: [], apu: null }); };
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
        '<div class="g" style="grid-template-columns:1fr 1fr">' +
          '<div><label class="lbl" for="n-rec">Recibo del anexo</label><input class="in m" type="date" id="n-rec" value="' + esc(b.recibo) + '"></div>' +
          '<div><label class="lbl" for="n-ent">Entrega de la oferta</label><input class="in m" type="date" id="n-ent" value="' + esc(b.entrega) + '"></div>' +
        '</div>' +
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
      consideraciones: "", costoDirecto: 0,
      margenes: { rent: 10, dolar: 19, admin: 8, imprev: 2, util: 5, iva: 19 },
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
    vista.borrador = { nombre: "", cliente: "", ciudad: "", recibo: hoy(), entrega: "", hojas: null, archivo: "" };
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

  var campos = [["rent", "Rentabilidad"], ["dolar", "Factor dólar"],
                ["admin", "Administración"], ["imprev", "Imprevistos"],
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
      '</div><div class="bar"><div class="barf" style="width:' + r.avance + '%"></div></div>' +
    '</div></div>' +

    '<div class="g g2">' +
      '<div class="card"><div class="chd"><span class="ct">Fechas</span></div><div class="cbd">' +
        '<div class="field"><label class="lbl" for="f-rec">Recibo del anexo</label>' +
          '<input class="in m" type="date" id="f-rec" value="' + esc(p.recibo || "") + '"></div>' +
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
        '<div class="dlr dltot"><span class="dlk">Valor total</span><span class="dlv m">' + cop(t.total) + '</span></div>' +
      '</div>' +
      '<div class="ok" style="margin-top:13px">La rentabilidad y el factor dólar se montan sobre el precio de cada ' +
      'insumo: costo dividido entre uno menos el factor. El dólar solo aplica a los marcados como importados. ' +
      'Administración, imprevistos, utilidad e IVA van una sola vez sobre el subtotal.</div>' +
    '</div></div>';
}

function enlazarFicha(p) {
  function guardar() { Store.guardar(p); }
  document.getElementById("f-rec").onchange = function () { p.recibo = this.value; guardar(); };
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
      '<div class="ok" style="margin-bottom:17px">Encabezado encontrado en la fila ' + (h.encabezado + 1) +
        '. Se reconocieron ' + Object.keys(h.mapa).length + ' columnas.</div>' +
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
      '<div class="cbd" style="padding-bottom:12px"><div class="tabs">' + pestanas + '</div></div>' +
      '<div class="cbd" style="border-top:1px solid var(--line2)">' + cuerpo + '</div></div>' +
    '<div class="note"><div class="notet">Cómo se separan capítulos de ítems</div>' +
    '<div class="noteb">Una fila es un ítem cuando tiene unidad y cantidad. Si le falta alguna de las dos, ' +
    'se toma como capítulo y encabeza el bloque. Las filas de notas se descartan.</div></div>';
}

function enlazarAnexo(p) {
  Array.prototype.forEach.call(document.querySelectorAll("[data-hoja]"), function (b) {
    b.onclick = function () { ir({ hoja: Number(b.dataset.hoja) }); };
  });
  var usar = document.getElementById("usar");
  if (usar) usar.onchange = function () { p.hojas[vista.hoja].usar = this.checked; Store.guardar(p); render(); };

  var releer = document.getElementById("releer");
  if (releer) releer.onclick = function () {
    var h = p.hojas[vista.hoja];
    var mapa = {};
    Array.prototype.forEach.call(document.querySelectorAll("[data-col]"), function (s) {
      if (s.value) mapa[s.value] = Number(s.dataset.col);
    });
    if (!mapa.desc || mapa.und === undefined || mapa.cant === undefined) {
      alert("Hacen falta al menos descripción, unidad y cantidad para poder leer los ítems.");
      return;
    }
    alert("Para volver a leer con un mapeo distinto hay que cargar el archivo otra vez. " +
      "Esta versión conserva la lectura original; el mapeo manual llega en la siguiente.");
  };
}

/* ---- 7.6 Paso 3: armado ---- */

function vArmado(p, r) {
  var pestanas = p.hojas.map(function (h, i) {
    if (!h.usar) return "";
    return '<button class="tab" data-hoja="' + i + '" aria-pressed="' + (vista.hoja === i) + '">' + esc(h.nombre) + '</button>';
  }).join("");

  var h = p.hojas[vista.hoja];
  if (!h || !h.usar) {
    return '<div class="card"><div class="cbd"><div class="tabs">' + pestanas + '</div></div>' +
      '<div class="empty">Esta hoja no está incluida en el proyecto. Actívala en el paso 2.</div></div>';
  }

  /* Cuántos ítems comparten cada análisis, en todo el proyecto */
  var cuenta = {};
  itemsDe(p).forEach(function (x) { if (x.f.apu) cuenta[x.f.apu] = (cuenta[x.f.apu] || 0) + 1; });

  var cuerpo = "", capPend = null;
  h.filas.forEach(function (f, fi) {
    if (f.tipo === "cap") { capPend = f; return; }
    if (capPend) {
      cuerpo += '<tr class="caprow"><td colspan="7">' + esc(capPend.item) + ' · ' + esc(capPend.desc) + '</td></tr>';
      capPend = null;
    }
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

    cuerpo += '<tr class="itrow' + (marcada ? " sel" : "") + '">' +
      '<td style="text-align:center"><input type="checkbox" data-sel="' + k + '"' + (marcada ? " checked" : "") +
        ' aria-label="Elegir ítem ' + esc(f.item) + '"></td>' +
      '<td class="m" style="font-size:12px;color:var(--ink2)">' + esc(f.item) + '</td>' +
      '<td>' + esc(f.desc) + '</td>' +
      '<td style="color:var(--ink2)">' + esc(f.und) + '</td>' +
      '<td class="num">' + fmt(f.cant) + '</td>' +
      '<td>' + togs + '</td>' +
      '<td' + tie + '><div class="apu' + (comparte ? " apudup" : "") + '">' +
        (f.apu ? '<button class="verapu" data-verapu="' + f.apu + '" title="Ver este análisis">' +
          f.apu + '</button>' : "—") + '</div></td>' +
    '</tr>';
  });

  var barra = vista.sel.length
    ? '<div class="bulk"><span class="bulkn">' + vista.sel.length +
      (vista.sel.length === 1 ? " ítem elegido" : " ítems elegidos") + '</span>' +
      '<button class="btn btnp" id="asignar">Dar análisis nuevo</button>' +
      '<button class="btn" id="unir"' + (vista.sel.length < 2 ? " disabled" : "") + '>Unir en un análisis</button>' +
      '<button class="btn" id="limpiar">Quitar</button>' +
      '<button class="btn" id="cancelar">Cancelar</button></div>'
    : "";

  return '<div class="card">' +
      '<div class="chd"><span class="ct">Armado de análisis</span>' +
      '<span class="cn">' + r.items + ' ítems · ' + r.analisis + ' análisis · ' + r.asignados + ' asignados</span></div>' +
      '<div class="cbd" style="padding-bottom:12px"><div class="tabs">' + pestanas + '</div></div>' +
      '<div class="scroll"><table class="tbl"><thead><tr>' +
        '<th style="width:34px"><span class="sr">Elegir</span></th>' +
        '<th style="width:62px">Ítem</th><th>Descripción</th>' +
        '<th style="width:40px">Und</th><th style="width:62px" class="num">Cant.</th>' +
        '<th style="width:224px">Apartados</th><th style="width:58px;text-align:center">Análisis</th>' +
      '</tr></thead><tbody>' + cuerpo + '</tbody></table></div>' + barra +
    '</div>' +
    '<div class="note"><div class="notet">Cómo se usa</div>' +
    '<div class="noteb">Toca una sigla para decir a qué apartado va el ítem. Elige uno o varios y dales ' +
    'un análisis nuevo, o únelos si se resuelven con el mismo. Los que comparten análisis quedan atados ' +
    'por la barra verde de la derecha.</div></div>';
}

function enlazarArmado(p) {
  Array.prototype.forEach.call(document.querySelectorAll("[data-verapu]"), function (b) {
    b.onclick = function (e) {
      e.stopPropagation();
      ir({ paso: "apartados", apu: Number(b.dataset.verapu), sel: [] });
    };
  });
  Array.prototype.forEach.call(document.querySelectorAll("[data-hoja]"), function (b) {
    b.onclick = function () { ir({ hoja: Number(b.dataset.hoja), sel: [] }); };
  });
  Array.prototype.forEach.call(document.querySelectorAll("[data-sel]"), function (c) {
    c.onchange = function () {
      var k = c.dataset.sel, i = vista.sel.indexOf(k);
      if (i >= 0) vista.sel.splice(i, 1); else vista.sel.push(k);
      render();
    };
  });
  Array.prototype.forEach.call(document.querySelectorAll("[data-ap]"), function (b) {
    b.onclick = function () {
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
    seleccionadas().forEach(function (f) { f.apu = siguienteApu(p); });
    Store.guardar(p); ir({ sel: [] });
  };
  var b2 = document.getElementById("unir");
  if (b2) b2.onclick = function () {
    var fs = seleccionadas();
    var conApu = fs.filter(function (f) { return f.apu; }).map(function (f) { return f.apu; });
    var destino = conApu.length ? Math.min.apply(null, conApu) : siguienteApu(p);
    fs.forEach(function (f) { f.apu = destino; });
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

/* ---- 7.7 Paso 4: apartados ---- */

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

  return '<div class="g g32">' +
      '<div class="card" style="margin:0"><div class="chd"><span class="ct">Análisis</span>' +
      '<span class="cn">' + lista.length + '</span></div>' +
      '<div class="alist" id="listaapu">' + listaApu(p, lista, act) + '</div></div>' +
      '<div id="panelapu">' + panelApu(p, cat, act) + '</div>' +
    '</div>';
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
          '<div class="g" style="grid-template-columns:116px 1fr 44px;margin-top:8px">' +
            '<div><label class="lbl">Unidad</label>' +
              '<input class="in" data-eq="' + i + '|unidad" placeholder="UND" value="' + esc(f.unidad || "") + '"></div>' +
            '<div><label class="lbl">Precio costo</label>' +
              '<input class="in m" type="number" min="0" step="1" data-eq="' + i + '|precio" ' +
              'placeholder="sin precio" value="' + (f.precio || "") + '"></div>' +
            '<div><label class="lbl">Imp.</label>' +
              '<input type="checkbox" data-eqimp="' + i + '"' + (f.imp ? " checked" : "") +
              ' title="Importado" style="margin-top:8px"></div>' +
          '</div></div>' : "") +
      '</div>';
    }).join("");

    formEQ = '<div class="card"><div class="chd"><span class="ct">Equipos</span>' +
      '<span class="cn">' + filasEQ.length + (filasEQ.length === 1 ? " l\u00ednea" : " l\u00edneas") + '</span></div>' +
      '<div class="cbd">' + (bloquesEQ || '<p style="margin:0 0 12px;font-size:13px;color:var(--ink2)">Sin l\u00edneas todav\u00eda.</p>') +
      '<button class="btn" id="masEQ">+ Agregar equipo</button></div></div>';
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
  var listos = ["TU", "EQ", "TA", "CA", "mo"];
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
  var val = valorizar(cat, comp.lineas, p.margenes);
  var cuerpoComp;

  if (comp.lineas.length) {
    var filas = val.lineas.map(function (l) {
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
          ? '<input type="checkbox" data-imp="' + esc(l.cod) + '"' + (l.imp ? " checked" : "") +
            ' title="Insumo importado: lleva el factor de dólar">' : "") + '</td>' +
        '<td class="num">' + celPrecio + '</td>' +
        '<td class="num">' + (l.falta ? "—" : cop(l.total)) + '</td>' +
        '<td style="text-align:center">' +
          (l.ajustada ? '<button class="btnx" data-ajrest="' + esc(l.cod) + '" title="Volver a la cantidad del catálogo">Volver</button>'
                      : '<button class="btnx btnxdel" data-ajquita="' + esc(l.cod) + '" title="Quitar de este análisis">Quitar</button>') +
        '</td>' +
      '</tr>';
    }).join("");

    cuerpoComp = '<div class="scroll"><table class="tbl"><thead><tr>' +
        '<th class="num" style="width:78px">Cant.</th><th style="width:104px">Código</th>' +
        '<th>Descripción</th><th style="width:52px">Und</th>' +
        '<th style="width:44px;text-align:center" title="Importado">Imp.</th>' +
        '<th class="num" style="width:100px">Vr. venta</th><th class="num" style="width:94px">Vr. total</th>' +
        '<th style="width:56px"><span class="sr">Acciones</span></th>' +
      '</tr></thead><tbody>' + filas + '</tbody></table></div>' +
      '<div class="cbd" style="border-top:1px solid var(--line2)">' +
        (comp.quitadas ? '<div class="note" style="margin:0 0 13px"><div class="notet">Líneas quitadas</div>' +
          '<div class="noteb">Se quitaron ' + comp.quitadas + ' insumos de este análisis. ' +
          'No se tocó el catálogo, solo este APU. ' +
          '<button class="btn btnmini" id="ajlimpiar" style="margin-left:6px">Devolver todo</button></div></div>' : "") +
        (val.sinPrecio ? '<div class="err" style="margin-bottom:13px">' + val.sinPrecio +
          (val.sinPrecio === 1 ? " insumo no tiene precio" : " insumos no tienen precio") +
          ' en el catálogo. El total de abajo está incompleto.</div>' : "") +
        '<div class="dl">' +
          '<div class="dlr"><span class="dlk">Subtotal materiales</span><span class="dlv m">' + cop(val.mat) + '</span></div>' +
          '<div class="dlr"><span class="dlk">Subtotal mano de obra</span><span class="dlv m">' + cop(val.mo) + '</span></div>' +
          '<div class="dlr dltot"><span class="dlk">Valor unitario</span>' +
            '<span class="dlv m">' + cop(val.unitario) + '</span></div>' +
        '</div>' +
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
  } else if (!filasTU.length && !filasEQ.length && !filasTA.length && !filasMO.length && !filasCA.length) {
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

  return '<div class="card"><div class="chd">' +
      '<span class="ct">APU ' + act.apu + ' · ' + act.cod.join(" + ") + '</span>' +
      '<span class="cn">' + act.items.map(function (x) { return esc(x.item); }).join(", ") + '</span></div>' +
      '<div class="cbd"><p style="margin:0;font-size:13px;color:var(--ink2)">' +
        act.items.map(function (x) { return esc(x.desc); }).join("<br>") + '</p>' +
        '<div class="m" style="font-size:11px;color:var(--ink3);margin-top:7px">' +
        act.items.map(function (x) { return fmt(x.cant) + " " + esc(x.und); }).join("  ·  ") + '</div>' +
      '</div></div>' +
    avisoPend + formCA + formTU + formEQ + formTA + formMO + reglas + avisos + tabla +
    '<div class="card"><div class="chd"><span class="ct">Consideraciones del análisis</span></div>' +
      '<div class="cbd"><textarea class="in" id="notaapu" ' +
      'placeholder="Por qué se armó así, qué se asumió, qué quedó por fuera.">' + esc(nota) + '</textarea></div></div>';
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
  if (lst) { lst.innerHTML = listaApu(p, analisisDe(p), act); enlazarLista(p); }

  if (foco) {
    var el = document.querySelector('[data-tu="' + foco + '"]');
    if (el) { el.focus(); if (el.select) try { el.select(); } catch (e) {} }
  }
}

function enlazarLista(p) {
  Array.prototype.forEach.call(document.querySelectorAll("[data-apu]"), function (b) {
    b.onclick = function () { vista.apu = Number(b.dataset.apu); refrescarPanel(p); };
  });
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
  Array.prototype.forEach.call(document.querySelectorAll("[data-eqimp]"), function (c) {
    c.onchange = function () {
      var d = datosDe(p, act.apu);
      var f = d.EQ[Number(c.dataset.eqimp)];
      if (!f) return;
      f.imp = c.checked;
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
      var valor = campo === "manoObra" ? el.value : el.value;
      if (f[campo] === valor) return;
      f[campo] = valor;
      if (campo === "familia") { f.subfamilia = ""; }
      Store.guardar(p); refrescarPanel(p);
    };
    el.onchange = aplicar;
    if (el.tagName === "INPUT") el.onkeydown = function (e) {
      if (e.key === "Enter") { e.preventDefault(); el.blur(); }
    };
  });

  /* --- cableados --- */
  var masC = document.getElementById("masCA");
  if (masC) masC.onclick = function () {
    var d = datosDe(p, act.apu);
    if (!d.CA) d.CA = [];
    d.CA.push({ nombre: "", fase: "", cantFase: "", neutro: "", cantNeutro: "",
                tierra: "", cantTierra: "", metrado: 1, repite: 1, bornas: false });
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
      var cat = Catalogo.leer();
      var idx = Catalogo.indice(cat);
      var i = idx[el.dataset.poner];
      if (i === undefined) return;
      cat.items[i].precio = Number(el.value) || 0;
      cat.items[i].act = new Date().toISOString();
      Catalogo.guardar(cat); refrescarPanel(p);
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

/* ---- Paso 5: insumos usados en el proyecto ---- */

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
    var it = idx[c] !== undefined ? cat.items[idx[c]] : null;
    u.desc = u.desc || (it ? it.desc : "");
    u.und = u.und || (it ? it.und : "");
    u.precio = it ? Number(it.precio) || 0 : 0;
    u.imp = it ? !!it.imp : false;
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

  var sin = lista.filter(function (i) { return i.precio <= 0; }).length;
  var q = (vista.buscaIns || "").toLowerCase();
  var ver = lista;
  if (q) ver = ver.filter(function (i) {
    return i.cod.toLowerCase().indexOf(q) >= 0 || (i.desc || "").toLowerCase().indexOf(q) >= 0;
  });
  if (vista.soloSinIns) ver = ver.filter(function (i) { return i.precio <= 0; });

  var mg = p.margenes || {};
  var totalMat = 0, totalMo = 0;
  lista.forEach(function (i) {
    var v = i.cantidad * precioAjustado({ precio: i.precio, imp: i.imp }, mg);
    if (i.mo) totalMo += v; else totalMat += v;
  });

  var filas = ver.map(function (i) {
    var venta = precioAjustado({ precio: i.precio, imp: i.imp }, mg);
    return '<tr' + (i.precio <= 0 ? ' class="filasinp"' : "") + (i.mo ? ' data-mo="1"' : "") + '>' +
      '<td class="m" style="font-size:12px">' + esc(i.cod) + '</td>' +
      '<td>' + esc(i.desc) + '</td>' +
      '<td style="color:var(--ink3);font-size:12px">' + esc(i.und) + '</td>' +
      '<td class="num">' + dec(i.cantidad) + '</td>' +
      '<td class="num"><input class="in m inprecio' + (i.precio > 0 ? " ok" : "") + '" type="number" min="0" step="1" ' +
        'data-iprecio="' + esc(i.cod) + '" value="' + (i.precio > 0 ? i.precio : "") + '" placeholder="sin precio"></td>' +
      '<td style="text-align:center">' + (i.mo ? "" :
        '<input type="checkbox" data-iimp="' + esc(i.cod) + '"' + (i.imp ? " checked" : "") + '>') + '</td>' +
      '<td class="num">' + (i.precio > 0 ? cop(venta * i.cantidad) : "—") + '</td>' +
      '<td class="m" style="font-size:11px;color:var(--ink3)">' + i.apus.slice(0, 4).join(", ") +
        (i.apus.length > 4 ? " +" + (i.apus.length - 4) : "") + '</td>' +
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
      '</div>' +
      '<div class="scroll"><table class="tbl"><thead><tr>' +
        '<th style="width:96px">Código</th><th>Descripción</th><th style="width:52px">Und</th>' +
        '<th class="num" style="width:88px">Cantidad</th>' +
        '<th class="num" style="width:112px">Precio costo</th>' +
        '<th style="width:44px;text-align:center" title="Importado">Imp.</th>' +
        '<th class="num" style="width:108px">Vale</th>' +
        '<th style="width:92px">Análisis</th>' +
      '</tr></thead><tbody>' + filas + '</tbody></table></div>' +
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
  editar("data-iprecio", function (it, el) { it.precio = Number(el.value) || 0; });
  editar("data-iimp", function (it, el) { it.imp = el.checked; });
}

/* ---- 7.8 Paso 5: entrega ---- */

function vEntrega(p) {
  var cat = Catalogo.leer();
  var t = totalesProyecto(p, cat);
  return '<div class="card"><div class="chd"><span class="ct">Resumen de la oferta</span>' +
      '<span class="cn">' + t.conValor + ' de ' + (t.conValor + t.sinValor) + ' ítems con valor</span></div>' +
      '<div class="cbd">' +
      (t.sinValor || t.faltantes
        ? '<div class="note" style="margin:0 0 15px"><div class="notet">Todavía incompleto</div>' +
          '<div class="noteb">' + (t.sinValor ? t.sinValor + ' ítems sin valor. ' : "") +
          (t.faltantes ? t.faltantes + ' insumos sin precio. ' : "") +
          'El total de abajo no es definitivo.</div></div>' : "") +
      '<div class="dl">' +
        '<div class="dlr"><span class="dlk">Subtotal · costo directo</span><span class="dlv m">' + cop(t.subtotal) + '</span></div>' +
        '<div class="dlr"><span class="dlk">Administración</span><span class="dlv m">' + cop(t.admin) + '</span></div>' +
        '<div class="dlr"><span class="dlk">Imprevistos</span><span class="dlv m">' + cop(t.imprev) + '</span></div>' +
        '<div class="dlr"><span class="dlk">Utilidad</span><span class="dlv m">' + cop(t.util) + '</span></div>' +
        '<div class="dlr"><span class="dlk">IVA sobre utilidad</span><span class="dlv m">' + cop(t.iva) + '</span></div>' +
        '<div class="dlr dltot"><span class="dlk">Valor total</span><span class="dlv m">' + cop(t.total) + '</span></div>' +
      '</div>' +
      '<div class="btnrow" style="margin-top:17px">' +
        '<button class="btn btnp" id="exp-armado">Descargar cotización valorizada</button>' +
      '</div>' +
    '</div></div>' +
    '<div class="note"><div class="notet">Alcance de esta versión</div>' +
    '<div class="noteb">El Excel trae el anexo del cliente con su reparto de apartados, su número de análisis ' +
    'y el valor unitario de los que ya están armados. La hoja de análisis detallada y la carta llegan cuando ' +
    'estén los seis apartados.</div></div>';
}

function enlazarEntrega(p) {
  document.getElementById("exp-armado").onclick = function () {
    var cat = Catalogo.leer();
    var t = totalesProyecto(p, cat);
    var datos = [["HOJA", "CODIGO", "APU", "ITEM", "DESCRIPCION", "UND", "CANTIDAD",
                  "VR UNITARIO", "VR TOTAL", "CONSIDERACIONES"]];
    (p.hojas || []).forEach(function (h) {
      if (!h.usar) return;
      h.filas.forEach(function (f) {
        if (f.tipo !== "it") return;
        var u = (t.porApu[f.apu] && t.porApu[f.apu].unitario) || 0;
        datos.push([h.nombre, f.cod.join(" "), f.apu || "", f.item, f.desc, f.und, f.cant,
          u || "", u ? u * (Number(f.cant) || 0) : "", (p.notasApu || {})[f.apu] || ""]);
      });
    });
    datos.push([]);
    datos.push(["", "", "", "", "SUBTOTAL", "", "", "", t.subtotal, ""]);
    datos.push(["", "", "", "", "ADMINISTRACION", "", "", "", t.admin, ""]);
    datos.push(["", "", "", "", "IMPREVISTOS", "", "", "", t.imprev, ""]);
    datos.push(["", "", "", "", "UTILIDAD", "", "", "", t.util, ""]);
    datos.push(["", "", "", "", "IVA SOBRE UTILIDAD", "", "", "", t.iva, ""]);
    datos.push(["", "", "", "", "VALOR TOTAL", "", "", "", t.total, ""]);
    var ws = XLSX.utils.aoa_to_sheet(datos);
    ws["!cols"] = [{ wch: 22 }, { wch: 10 }, { wch: 6 }, { wch: 10 }, { wch: 58 }, { wch: 6 }, { wch: 11 }, { wch: 14 }, { wch: 16 }, { wch: 38 }];
    var wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "COTIZACION");
    XLSX.writeFile(wb, p.nombre.replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "_") + "_cotizacion.xlsx");
  };
}

/* ------------------------------------------------------------------ */

render();

})();
