"use strict";

  var LOGO64 = "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";

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

/* ==================================================================
   Sincronización con Firebase Realtime Database (REST)
   Cada nodo es una URL .json: se lee con GET, se escribe con PUT.
   Un nodo por proyecto para que dos personas en proyectos distintos
   nunca se pisen. El catálogo y las plantillas son compartidos.
   ================================================================== */
/* Firebase prohíbe . # $ [ ] / en las claves. Se codifican con un prefijo
   reversible para que columnas como "C. Tuberia" o "Mat. Cable" viajen intactas. */
var MAP_CLAVE = { ".": "~p~", "#": "~h~", "$": "~d~", "[": "~a~", "]": "~b~", "/": "~s~" };
function codClaveFB(k) {
  var s = String(k);
  return s.replace(/[.#$\[\]/]/g, function (c) { return MAP_CLAVE[c]; });
}
function decClaveFB(k) {
  return String(k).replace(/~[phdabs]~/g, function (t) {
    for (var real in MAP_CLAVE) if (MAP_CLAVE[real] === t) return real;
    return t;
  });
}
/* Recorre un objeto y codifica o decodifica todas sus claves */
function transformarClaves(obj, fn) {
  if (obj === null || typeof obj !== "object") return obj;
  if (Array.isArray(obj)) return obj.map(function (x) { return transformarClaves(x, fn); });
  var out = {};
  Object.keys(obj).forEach(function (k) {
    out[fn(k)] = transformarClaves(obj[k], fn);
  });
  return out;
}

var Nube = {
  base: "https://cotizacioneslutec-default-rtdb.firebaseio.com",
  activa: true,
  yo: "",   /* nombre de quien está usando este equipo */

  url: function (ruta) { return Nube.base + "/" + ruta + ".json"; },

  /* Lee un nodo y decodifica las claves. Devuelve el objeto o null. */
  leer: function (ruta) {
    return fetch(Nube.url(ruta), { cache: "no-store" })
      .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
      .then(function (data) { return transformarClaves(data, decClaveFB); });
  },

  /* Escribe un nodo completo. Codifica claves y limpia undefined (Firebase los rechaza). */
  escribir: function (ruta, dato) {
    var limpio = JSON.parse(JSON.stringify(dato, function (k, v) { return v === undefined ? null : v; }));
    var seguro = transformarClaves(limpio, codClaveFB);
    return fetch(Nube.url(ruta), {
      method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(seguro)
    }).then(function (r) {
      if (!r.ok) throw new Error("HTTP " + r.status);
      return r.json();
    });
  },

  borrar: function (ruta) {
    return fetch(Nube.url(ruta), { method: "DELETE" })
      .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return true; });
  },

  /* Prueba de conexión. */
  probar: function () {
    return Nube.leer(".info/connected").then(function () { return true; }).catch(function () { return false; });
  }
};

var CLAVE = "apu.proyectos.v1";

/* Lista de verificación, la misma que se lleva en el tablero de licitaciones */
var CHECK = [
  "Revisión de cantidades",
  "Enviar a cotizar equipos especiales",
  "Montar códigos",
  "Llenar formato relleno",
  "Entrega presupuestos con precios",
  "Diligenciar anexos"
];
var CLAVE_CAT = "apu.catalogo.v1";
var CLAVE_HIST = "apu.historial.v1";
var CLAVE_PLAN = "apu.plantillas.v1";

/* Análisis ya armados que se guardan para reutilizar en otros proyectos */
var Plantillas = {
  leer: function () {
    try { return JSON.parse(localStorage.getItem(CLAVE_PLAN) || "[]"); }
    catch (e) { return []; }
  },
  guardar: function (lista) {
    try { localStorage.setItem(CLAVE_PLAN, JSON.stringify(lista)); return true; }
    catch (e) { avisoError("No se pudo guardar la plantilla: falta espacio."); return false; }
  },
  agregar: function (nombre, datos) {
    var l = Plantillas.leer();
    var copia = JSON.parse(JSON.stringify(datos));
    delete copia.ajustes;
    l.unshift({ id: id(), nombre: nombre, fecha: new Date().toISOString(), datos: copia });
    var ok = Plantillas.guardar(l);
    Sync.subirPlantillas();
    return ok;
  },
  quitar: function (pid) {
    return Plantillas.guardar(Plantillas.leer().filter(function (x) { return x.id !== pid; }));
  }
};

/* Roles de columna que buscamos en un archivo de precios de proveedor */
/* Columnas de una lista de proveedor con ofertas por marca */
var ROLES_OFERTA = [
  { id: "cod",    nombre: "Código del material", test: function (t) {
      return t === "codigomaterial" || t === "codigo" || t === "codmaterial" || t === "codigodeinsumo"; } },
  { id: "nombre", nombre: "Nombre del proveedor", test: function (t) {
      return t.indexOf("nombreauranet") === 0 || t.indexOf("nombreproveedor") === 0 || t === "nombre"; } },
  { id: "codAur", nombre: "Código Auranet", test: function (t) {
      return t.indexOf("codigoauranet") === 0 || t.indexOf("codauranet") === 0; } },
  { id: "marca",  nombre: "Marca o clase", test: function (t) {
      return t === "marca" || t === "clase" || t === "proveedor"; } },
  { id: "precio", nombre: "Precio", test: function (t) {
      return t.indexOf("precio") === 0 || t === "valor" || t === "costo"; } },
  { id: "und",    nombre: "Unidad", test: function (t) {
      return t === "und" || t === "un" || t === "unidad" || t === "um"; } },
  { id: "codCla", nombre: "Código de clase", test: function (t) {
      return t.indexOf("codclase") === 0 || t.indexOf("codigoclase") === 0; } },
  { id: "estado", nombre: "Estado", test: function (t) { return t === "estado"; } },
  { id: "desc",   nombre: "Descripción del material", test: function (t) {
      return t.indexOf("descripcionmaterial") === 0 || t.indexOf("descripcion") === 0; } }
];

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

