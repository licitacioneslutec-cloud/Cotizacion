/* ==================================================================
   Cotización eléctrica · armado de análisis de precios unitarios
   Versión 1 — sin backend. Los proyectos viven en este navegador.
   ================================================================== */

(function () {
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
  if (typeof v === "number") return isFinite(v) ? v : 0;
  var s = String(v).trim();
  /* Se quitan símbolos de moneda, espacios normales y duros, y paréntesis de negativo */
  var neg = /^\(.*\)$/.test(s);
  s = s.replace(/[$€£\s\u00a0\u202f()]/g, "");
  if (!s) return 0;
  /* Decimal con coma: 1.234,56 → 1234.56  |  1,234.56 → 1234.56 */
  if (/,\d+$/.test(s)) s = s.replace(/\./g, "").replace(",", ".");
  /* Miles con punto: 1.180 o 12.345.678, pero NO 0.025 (un cero al frente nunca es millar) */
  else if (/^-?[1-9]\d{0,2}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, "");
  /* En cualquier otro caso el punto es decimal (0.025, 3.5) y la coma sobra */
  else s = s.replace(/,/g, "");
  var n = Number(s);
  if (isNaN(n)) return 0;
  return neg ? -n : n;
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

function avisoOk(mensaje) {
  var caja = document.getElementById("errorglobal");
  if (!caja) {
    caja = document.createElement("div");
    caja.id = "errorglobal";
    document.body.appendChild(caja);
  }
  caja.className = "errglobal okglobal";
  caja.innerHTML = '<div class="errglobal-t">Listo</div>' +
    '<div class="errglobal-b">' + esc(mensaje) + '</div>' +
    '<div class="errglobal-a"><button class="btn" id="errcerrar">Cerrar</button></div>';
  caja.style.display = "block";
  var cc = document.getElementById("errcerrar");
  if (cc) cc.onclick = function () { caja.style.display = "none"; };
  setTimeout(function () { if (caja && caja.className.indexOf("okglobal") >= 0) caja.style.display = "none"; }, 7000);
}

function avisoError(mensaje) {
  var caja = document.getElementById("errorglobal");
  if (!caja) {
    caja = document.createElement("div");
    caja.id = "errorglobal";
    document.body.appendChild(caja);
  }
  caja.className = "errglobal";
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
    _cacheProy.forEach(normalizarProyecto);
    return _cacheProy;
  },
  guardar: function (proy) {
    var lista = Store.todos(), i = -1;
    for (var k = 0; k < lista.length; k++) if (lista[k].id === proy.id) { i = k; break; }
    proy.modificado = new Date().toISOString();
    if (Nube.yo) proy.ultimoEditor = Nube.yo;
    if (i >= 0) lista[i] = proy; else lista.unshift(proy);
    _cacheProy = lista;
    var ok = true;
    try { localStorage.setItem(CLAVE, JSON.stringify(lista)); }
    catch (e) {
      ok = false;
      if (!_avisoEspacio) {
        _avisoEspacio = true;
        avisoError("El navegador se quedó sin espacio y no se pudo guardar. Descarga el respaldo de tus proyectos y borra alguno que ya no uses.");
      }
    }
    Sync.subirProyecto(proy);
    return ok;
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
    Sync.borrarProyecto(pid);
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
    var ok = true;
    try { localStorage.setItem(CLAVE_CAT, JSON.stringify(cat)); }
    catch (e) { ok = false; avisoError("No se pudo guardar el catálogo: el navegador se quedó sin espacio."); }
    Sync.subirCatalogo();
    return ok;
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

/* ==================================================================
   Coordinador de sincronización
   - Sube en segundo plano, con un pequeño retardo para no mandar una
     escritura por cada tecla.
   - Baja al abrir la aplicación y al entrar a un proyecto.
   - Nunca bloquea: si la nube falla, se sigue con lo local.
   ================================================================== */
var Sync = {
  pendProy: {}, timerProy: null, timerCat: null, ocupado: false,

  encendida: function () {
    return Nube.activa && localStorage.getItem("apu.sync.on") !== "no";
  },
  prender: function (v) {
    localStorage.setItem("apu.sync.on", v ? "si" : "no");
    if (v) Sync.bajarTodo();
  },

  subirProyecto: function (proy) {
    if (!Sync.encendida()) return;
    var copia = JSON.parse(JSON.stringify(proy));
    copia.baseModificado = proy.modificado;   /* se guarda aparte para el cotejo, no viaja como dato del proyecto */
    Sync.pendProy[proy.id] = copia;
    clearTimeout(Sync.timerProy);
    Sync.timerProy = setTimeout(Sync.vaciarProy, 1200);
  },
  vaciarProy: function () {
    var ids = Object.keys(Sync.pendProy);
    if (!ids.length) return;
    ids.forEach(function (id) {
      var proy = Sync.pendProy[id];
      delete Sync.pendProy[id];
      /* Comprobar que nadie haya guardado una versión más nueva mientras editábamos */
      Nube.leer("proyectos/" + id).then(function (nube) {
        if (nube && nube.modificado && proy.baseModificado && nube.modificado > proy.baseModificado) {
          /* Otro escribió después de que cargamos. Avisar en vez de pisar. */
          Sync.conflicto(id, nube, proy);
          return;
        }
        var subir = JSON.parse(JSON.stringify(proy));
        delete subir.baseModificado;
        return Nube.escribir("proyectos/" + id, subir).then(function () { Sync.marca("ok"); });
      }).catch(function () { Sync.marca("err"); Sync.pendProy[id] = proy; });
    });
  },

  /* Alguien más guardó el mismo proyecto mientras lo teníamos abierto */
  conflicto: function (id, nube, mio) {
    var quien = nube.ultimoEditor || "otra persona";
    var msg = quien + " guardó cambios en este proyecto mientras trabajabas.\n\n" +
      "Aceptar: traer su versión (pierdes lo que no habías subido).\n" +
      "Cancelar: subir la tuya encima (pierdes lo de " + quien + ").";
    if (confirm(msg)) {
      normalizarProyecto(nube);
      var lista = Store.todos();
      for (var i = 0; i < lista.length; i++) if (lista[i].id === id) { lista[i] = nube; break; }
      _cacheProy = lista;
      try { localStorage.setItem(CLAVE, JSON.stringify(lista)); } catch (e) {}
      render();
      avisoOk("Se cargó la versión de " + quien + ".");
    } else {
      mio.baseModificado = nube.modificado;   /* aceptamos pisar: la base pasa a ser la de la nube */
      Nube.escribir("proyectos/" + id, mio).then(function () { Sync.marca("ok"); });
    }
  },
  borrarProyecto: function (id) {
    if (!Sync.encendida()) return;
    Nube.borrar("proyectos/" + id).catch(function () {});
  },

  subirCatalogo: function () {
    if (!Sync.encendida()) return;
    clearTimeout(Sync.timerCat);
    Sync.marca("sync");
    Sync.timerCat = setTimeout(function () {
      var cat = Catalogo.leer();
      if (!cat) return;
      Nube.escribir("catalogo", cat)
        .then(function () { Sync.marca("ok"); })
        .catch(function (e) {
          Sync.marca("err");
          avisoError("No se pudo subir el catálogo a la nube: " + (e && e.message ? e.message : "sin conexión") +
            ". Se reintenta al próximo cambio.");
        });
    }, 1800);
  },
  subirPlantillas: function () {
    if (!Sync.encendida()) return;
    Nube.escribir("plantillas", Plantillas.leer()).catch(function () {});
  },

  /* Trae todo de la nube. Robusto: reporta qué trajo y siembra la nube si está vacía. */
  bajarTodo: function () {
    if (!Sync.encendida()) return Promise.resolve({ ok: false });
    Sync.marca("sync");
    return Promise.all([
      Nube.leer("catalogo").catch(function () { return "ERR"; }),
      Nube.leer("proyectos").catch(function () { return "ERR"; }),
      Nube.leer("plantillas").catch(function () { return "ERR"; })
    ]).then(function (r) {
      var cat = r[0], proys = r[1], plan = r[2];
      var fallo = (cat === "ERR" || proys === "ERR");
      if (cat === "ERR") cat = undefined;
      if (proys === "ERR") proys = undefined;
      if (plan === "ERR") plan = undefined;

      var res = { ok: !fallo, catalogo: false, nProy: 0, sembrado: false };

      /* ---- Catálogo ---- */
      var local = Catalogo.leer();
      if (cat && cat.items && cat.items.length) {
        var fNube = cat.modificado || "";
        var fLoc = local && local.modificado ? local.modificado : "";
        /* La nube gana salvo que lo local sea estrictamente más nuevo */
        if (!local || fNube >= fLoc) {
          _cacheCat = cat; _catLeido = true; _idxCat = null;
          try { localStorage.setItem(CLAVE_CAT, JSON.stringify(cat)); } catch (e) {}
          res.catalogo = true;
        } else {
          Sync.subirCatalogo();  /* lo local es más nuevo: se sube */
        }
      } else if (local && local.items && local.items.length) {
        /* La nube no tiene catálogo: se siembra con el local */
        Nube.escribir("catalogo", local).then(function () { Sync.marca("ok"); }).catch(function () {});
        res.sembrado = true;
      }

      /* ---- Proyectos ---- */
      var locales = Store.todos();
      var porId = {};
      locales.forEach(function (pp) { porId[pp.id] = pp; });
      if (proys) {
        Object.keys(proys).forEach(function (id) {
          var nube = proys[id];
          if (!nube) return;
          var loc = porId[id];
          if (!loc || (nube.modificado || "") >= (loc.modificado || "")) porId[id] = nube;
        });
        /* subir los que solo existen en local */
        locales.forEach(function (pp) { if (!proys[pp.id]) Sync.subirProyecto(pp); });
      } else if (locales.length) {
        locales.forEach(function (pp) { Sync.subirProyecto(pp); });
      }
      var lista = Object.keys(porId).map(function (k) { return normalizarProyecto(porId[k]); });
      lista.sort(function (a, b) { return (b.modificado || "").localeCompare(a.modificado || ""); });
      _cacheProy = lista;
      try { localStorage.setItem(CLAVE, JSON.stringify(lista)); } catch (e) {}
      res.nProy = lista.length;

      /* ---- Plantillas ---- */
      if (plan && plan.length) {
        var lp = Plantillas.leer();
        if (plan.length >= lp.length) Plantillas.guardar(plan);
      } else if (Plantillas.leer().length) {
        Sync.subirPlantillas();
      }

      Sync.marca(fallo ? "err" : "ok");
      return res;
    }).catch(function () { Sync.marca("err"); return { ok: false }; });
  },

  /* Trae la versión más reciente de un proyecto al abrirlo */
  bajarProyecto: function (id) {
    if (!Sync.encendida()) return Promise.resolve(null);
    return Nube.leer("proyectos/" + id).then(function (nube) {
      if (!nube) return null;
      var loc = Store.leer(id);
      if (!loc || (nube.modificado || "") > (loc.modificado || "")) {
        normalizarProyecto(nube);
        var lista = Store.todos();
        var i = -1;
        for (var k = 0; k < lista.length; k++) if (lista[k].id === id) { i = k; break; }
        if (i >= 0) lista[i] = nube; else lista.unshift(nube);
        _cacheProy = lista;
        try { localStorage.setItem(CLAVE, JSON.stringify(lista)); } catch (e) {}
        return nube;
      }
      return null;
    }).catch(function () { return null; });
  },

  /* Aviso de que alguien más tiene el proyecto abierto */
  avisarAbierto: function (id) {
    if (!Sync.encendida() || !Nube.yo) return;
    Nube.escribir("meta/" + id, { quien: Nube.yo, cuando: new Date().toISOString() }).catch(function () {});
  },
  quienAbrio: function (id) {
    if (!Sync.encendida()) return Promise.resolve(null);
    return Nube.leer("meta/" + id).then(function (m) {
      if (!m || !m.cuando) return null;
      if (m.quien === Nube.yo) return null;
      var mins = (Date.now() - new Date(m.cuando).getTime()) / 60000;
      if (mins > 30) return null;   /* rastro viejo, se ignora */
      return { quien: m.quien, minutos: Math.round(mins) };
    }).catch(function () { return null; });
  },

  marca: function (estado) {
    var el = document.getElementById("syncestado");
    if (!el) return;
    var txt = { sync: "sincronizando…", ok: "al día", err: "sin conexión" }[estado] || "";
    el.textContent = txt;
    el.className = "syncestado " + estado;
  }
};

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

/* Los ítems que crea el usuario viven en el proyecto, no en el catálogo general */
function registrarPropio(p, fila) {
  if (!p.propios) p.propios = {};
  var cod = codClave(fila.codItem);
  var prev = p.propios[cod] || {};
  /* El precio y la unidad pueden haberse editado desde la pantalla de insumos;
     el del formulario manda solo si trae un valor, para no pisar lo editado. */
  var precioForm = aNum(fila.precio);
  var undForm = txt(fila.unidad);
  p.propios[cod] = {
    cod: cod,
    desc: txt(fila.nombreItem) || prev.desc || "",
    und: undForm || prev.und || "UND",
    precio: precioForm > 0 ? precioForm : (Number(prev.precio) || 0),
    imp: fila.imp !== undefined ? !!fila.imp : !!prev.imp,
    desp: aNum(fila.desp) || Number(prev.desp) || 0,
    propio: true
  };
}

/* Fija el precio de un insumo desde cualquier pantalla del proyecto.
   Si es propio, va al proyecto; si tiene ofertas, cambia la elegida; si no, el precio suelto. */
function fijarPrecio(p, cod, valor) {
  var n = Number(valor) || 0;
  if (p.propios && p.propios[cod]) { p.propios[cod].precio = n; Store.guardar(p); return; }
  var c = Catalogo.leer();
  var i = Catalogo.indice(c)[cod];
  if (i === undefined) return;
  var it = c.items[i];
  if (it.ofertas && it.ofertas.length) {
    var j = (p.proveedores && p.proveedores[cod] !== undefined)
      ? p.proveedores[cod] : (it.sel !== undefined ? it.sel : 0);
    if (it.ofertas[j]) it.ofertas[j].precio = n;
  } else {
    it.precio = n;
  }
  it.act = new Date().toISOString();
  Catalogo.guardar(c);
}

/* Busca un insumo primero entre los propios del proyecto, luego en el catálogo */
function insumoDe(cat, cod, p) {
  if (p && p.propios && p.propios[cod]) return p.propios[cod];
  var idx = Catalogo.indice(cat);
  return idx[cod] !== undefined ? cat.items[idx[cod]] : null;
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

/* ------------------------------------------------------------------
   Salidas
   ------------------------------------------------------------------ */

var FAM_CUADRADA = "SALIDA CUADRADA O RECTANGULAR";
var FAM_OCTOGONAL = "SALIDA CAJA OCTOGONAL";
var FAM_HONDA = "SALIDA CAJA 10X10";

/* Códigos de caja cuadrada que se retiran al cambiar de tipo de caja */
var SWAP_METAL = ["418000033", "418000003"];
var SWAP_PVC = ["181000167", "181000030"];
/* Códigos que se quitan cuando la salida no lleva instalación */
var COD_N_INS = ["266000485", "604000046", "266000558", "210000058", "210000060",
                 "692000017", "266001635", "266001611", "720000039", "266000497"];

var MODOS_SALIDA = [
  { id: "completa", nombre: "Completa · incluye interruptor", fmo: 1 },
  { id: "interruptor", nombre: "Interruptor separado", fmo: 0.75 },
  { id: "iluminacion", nombre: "Iluminación separada", fmo: 0.35 },
  { id: "normal", nombre: "Sin ajuste", fmo: 1 }
];

function multEstrato(e) {
  var n = Number(e) || 2;
  if (n < 2) n = 2;
  if (n > 3) n = 3;              /* de 3 en adelante, el mismo multiplicador */
  return 1 + (n - 2) * 0.1;
}
function multCable(prom) {
  var n = Number(prom) || 0;
  if (n < 5) return 1.0;
  if (n <= 11) return 1.5;
  return 2.0;
}

function filasSalida(cat) { return (cat && cat.comp && cat.comp.salidas) || []; }

function opcionesSalida(cat) {
  var d = filasSalida(cat);
  var ap = {}, mat = {}, tub = {}, cal = {}, mc = {};
  d.forEach(function (r) {
    var f = txt(r["Familia"]);
    if (f && limpia(f) !== FAM_CUADRADA && limpia(f) !== FAM_OCTOGONAL && limpia(f) !== FAM_HONDA) ap[f] = true;
    var m = txt(r["Material"]); if (m) mat[m] = true;
    var t = txt(r["calibre tubo"]); if (t) tub[t] = true;
    var c = txt(r["calibre cable"]); if (c) cal[c] = true;
    var x = txt(r["Mat. Cable"]); if (x) mc[x] = true;
  });
  var ord = function (o) { return Object.keys(o).sort(function (a, b) { return a.localeCompare(b, "es"); }); };
  return { aparatos: ord(ap), materiales: ord(mat), tubos: ord(tub), calibres: ord(cal), matCable: ord(mc) };
}

function itemsFamilia(cat, familia, tubo, material) {
  var fam = limpia(familia);
  return filasSalida(cat).filter(function (r) {
    if (limpia(r["Familia"]) !== fam) return false;
    if (fam === FAM_CUADRADA) {
      if (tubo && txt(r["calibre tubo"]) !== txt(tubo)) return false;
      if (material && limpia(r["Material"]) !== limpia(material)) return false;
    } else if (fam === FAM_OCTOGONAL || fam === FAM_HONDA) {
      if (material && limpia(r["Material"]) !== limpia(material)) return false;
    }
    return true;
  }).map(function (r) {
    return {
      cant: aNum(r["incidencia"]), cod: codClave(r["codigo"]),
      desc: txt(r["descripcion"]), und: txt(r["unidad"])
    };
  });
}

/* Cambia la caja cuadrada por la octogonal o la 10x10 */
function cambiarCaja(base, variante, material) {
  var m = limpia(material);
  var quitar = (m === "IMC" || m === "EMT") ? SWAP_METAL
             : (m === "PVC" || m === "SCH40") ? SWAP_PVC : [];
  var salen = {};
  quitar.forEach(function (c) { salen[codClave(c)] = true; });
  var res = variante.slice();
  var yaHay = {};
  variante.forEach(function (l) { yaHay[l.cod] = true; });
  base.forEach(function (l) {
    if (salen[l.cod] || yaHay[l.cod]) return;
    res.push(l);
  });
  return res;
}

/* Compone una salida completa */
function componerSalida(cat, fila) {
  var avisos = [], lineas = [];
  var aparato = txt(fila.aparato);
  if (!aparato) return { lineas: [], avisos: [] };

  var modo = fila.modo || "normal";
  var infoModo = null;
  MODOS_SALIDA.forEach(function (m) { if (m.id === modo) infoModo = m; });
  var fmo = infoModo ? infoModo.fmo : 1;

  var mEstrato = multEstrato(fila.estrato);
  var prom = Number(fila.promedio) || 1;
  var mCable = multCable(prom);

  /* Las dos tuberías, cada una con su parte del recorrido */
  var tubos = [
    { mat: fila.mat1, cal: fila.tubo1, pct: Number(fila.pct1) },
    { mat: fila.mat2, cal: fila.tubo2, pct: Number(fila.pct2) }
  ].filter(function (t) { return t.mat && t.cal && t.pct > 0; });
  if (!tubos.length && fila.mat1 && fila.tubo1) tubos = [{ mat: fila.mat1, cal: fila.tubo1, pct: 100 }];

  var suma = tubos.reduce(function (t, x) { return t + x.pct; }, 0);
  if (tubos.length > 1 && Math.abs(suma - 100) > 0.5) {
    avisos.push("Las dos tuberías suman " + dec(suma) + "%, deberían dar 100");
  }

  tubos.forEach(function (t) {
    var parte = t.pct / 100;
    var base = itemsFamilia(cat, FAM_CUADRADA, t.cal, t.mat);
    if (!base.length) { avisos.push("No hay salida cuadrada en " + limpia(t.mat) + " " + txt(t.cal)); return; }

    var juego;
    var caja = fila.caja || "cuadrada";
    if (caja === "octogonal") {
      juego = cambiarCaja(base, itemsFamilia(cat, FAM_OCTOGONAL, t.cal, t.mat), t.mat);
    } else if (caja === "honda") {
      juego = cambiarCaja(base, itemsFamilia(cat, FAM_HONDA, t.cal, t.mat), t.mat);
    } else {
      juego = base.slice();
    }

    /* Modo completo: se suma la caja octogonal y tres adaptadores */
    if (modo === "completa") {
      itemsFamilia(cat, FAM_OCTOGONAL, t.cal, t.mat).forEach(function (l) {
        juego.push({ cant: l.cant, cod: l.cod, desc: l.desc, und: l.und });
      });
      var adap = null;
      juego.forEach(function (l) { if (!adap && limpia(l.desc).indexOf("ADAPTADOR") >= 0) adap = l; });
      if (adap) juego.push({ cant: 3, cod: adap.cod, desc: adap.desc, und: adap.und });
      else avisos.push("No se encontró adaptador en " + limpia(t.mat) + " " + txt(t.cal) + " para sumarle tres");
    }

    /* Iluminación: siempre al menos una caja octogonal, aunque no sea modo completo */
    if (modo === "iluminacion") {
      var yaOct = juego.some(function (l) { return limpia(l.desc).indexOf("OCTOGONAL") >= 0 || limpia(l.desc).indexOf("OCTAGONAL") >= 0; });
      if (!yaOct) {
        var oct = itemsFamilia(cat, FAM_OCTOGONAL, t.cal, t.mat);
        var caja = null;
        oct.forEach(function (l) { if (!caja && (limpia(l.desc).indexOf("OCTOGONAL") >= 0 || limpia(l.desc).indexOf("OCTAGONAL") >= 0 || limpia(l.desc).indexOf("CAJA") >= 0)) caja = l; });
        if (caja) juego.push({ cant: caja.cant || 1, cod: caja.cod, desc: caja.desc, und: caja.und });
        else avisos.push("No se encontró caja octogonal para la salida de iluminación");
      }
    }

    if (fila.sinInstalacion) {
      var fuera = {};
      COD_N_INS.forEach(function (c) { fuera[codClave(c)] = true; });
      juego = juego.filter(function (l) { return !fuera[l.cod]; });
    }

    juego.forEach(function (l) {
      var c = l.cant * parte;
      if (esManoObra(l.cod)) c *= mEstrato * fmo;
      else if (limpia(l.desc).indexOf("TUBO") >= 0) c *= prom;
      lineas.push({ cant: c, cod: l.cod, desc: l.desc, und: l.und });
    });
  });

  /* Los ítems propios del aparato */
  itemsFamilia(cat, aparato, null, null).forEach(function (l) {
    var c = l.cant;
    if (esManoObra(l.cod)) c *= mEstrato * fmo;
    lineas.push({ cant: c, cod: l.cod, desc: l.desc, und: l.und });
  });

  /* El cable */
  if (fila.calibreCable && fila.matCable) {
    var mult = Number(fila.multCable) || 1;
    var enc = filasSalida(cat).filter(function (r) {
      return txt(r["calibre cable"]) === txt(fila.calibreCable) &&
             limpia(r["Mat. Cable"]).indexOf(limpia(fila.matCable)) >= 0;
    });
    if (!enc.length) avisos.push("No hay cable " + txt(fila.calibreCable) + " " + txt(fila.matCable));
    enc.forEach(function (r) {
      var cod = codClave(r["codigo"]);
      var inc = aNum(r["incidencia"]);
      var c = esManoObra(cod) ? inc * mEstrato * mCable * fmo : inc * mult * prom;
      lineas.push({ cant: c, cod: cod, desc: txt(r["descripcion"]), und: txt(r["unidad"]) });
    });
  }

  return { lineas: lineas, avisos: avisos, fmo: fmo, mEstrato: mEstrato, mCable: mCable };
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
    if (fila.crearItem && fila.codItem && txt(fila.nombreItem)) registrarPropio(p, fila);
    var r = componerEquipo(cat, fila, p, apu);
    if (r.aviso) { avisos.push("Equipo " + (i + 1) + ": " + r.aviso); return; }
    if (r.creado) creados.push(r.creado);
    lineas = lineas.concat(r.lineas);
  });

  ((datos && datos.SA) || []).forEach(function (fila, i) {
    var r = componerSalida(cat, fila);
    (r.avisos || []).forEach(function (a) { avisos.push("Salida " + (i + 1) + ": " + a); });
    if (r.fmo && r.fmo !== 1) reglas.push("Salida " + (i + 1) + ": la mano de obra va al " +
      Math.round(r.fmo * 100) + "% por venir separada.");
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
/* Oferta vigente de un insumo: la que eligió el proyecto, o la marcada
   por defecto en el catálogo, o el precio suelto si no hay ofertas. */
function ofertaDe(it, p) {
  if (!it || !it.ofertas || !it.ofertas.length) return null;
  var sel = null;
  if (p && p.proveedores && p.proveedores[it.cod] !== undefined) sel = p.proveedores[it.cod];
  if (sel === null || sel === undefined || !it.ofertas[sel]) sel = (it.sel !== undefined ? it.sel : 0);
  return it.ofertas[sel] || it.ofertas[0];
}
function costoDe(it, p) {
  if (!it) return 0;
  var of = ofertaDe(it, p);
  if (of && Number(of.precio) > 0) return Number(of.precio);
  return Number(it.precio) || 0;
}

function precioAjustado(it, mg, p) {
  var base = costoDe(it, p);
  if (base <= 0) return 0;
  var rent = it.rent !== undefined && it.rent !== null ? Number(it.rent) : Number(mg.rent || 0);
  var dol = it.imp ? (it.dol !== undefined && it.dol !== null ? Number(it.dol) : Number(mg.dolar || 0)) : 0;
  var v = base;
  if (rent > 0 && rent < 100) v = v / (1 - rent / 100);
  if (dol > 0 && dol < 100) v = v / (1 - dol / 100);
  return v;
}

/* Le pone precio a cada línea y arma las tres secciones del análisis */
function valorizar(cat, lineas, margenes, p) {
  var idx = Catalogo.indice(cat);
  var mg = margenes || {};
  var mat = 0, mo = 0, sinPrecio = 0;

  var conPrecio = lineas.map(function (l) {
    var it = insumoDe(cat, l.cod, p);
    var base = costoDe(it, p);
    var precio = precioAjustado(it, mg, p);
    var desp = it && Number(it.desp) > 0 ? Number(it.desp) : 0;
    var cantDesp = l.cant * (1 + desp / 100);
    var total = cantDesp * precio;
    if (precio <= 0) sinPrecio++;
    var esMo = esManoObra(l.cod);
    if (esMo) mo += total; else mat += total;
    return {
      cant: l.cant, cantDesp: cantDesp, desp: desp,
      cod: l.cod, desc: l.desc || (it ? it.desc : ""),
      und: l.und || (it ? it.und : ""), base: base, precio: precio, total: total,
      falta: precio <= 0, mo: esMo, f075: l.f075, ajustada: l.ajustada, cantOrig: l.cantOrig,
      propio: l.propio, imp: it ? !!it.imp : false, enCatalogo: !!it,
      oferta: ofertaDe(it, p)
    };
  });

  var ov = (mg && mg.__ov) || {};
  var pctTrans = ov.transporte !== undefined && ov.transporte !== null && ov.transporte !== ""
    ? Number(ov.transporte) : (Number(mg.transporte) || 0);
  var pctHerr = ov.herramienta !== undefined && ov.herramienta !== null && ov.herramienta !== ""
    ? Number(ov.herramienta) : (Number(mg.herramienta) || 0);
  var transporte = mat * (pctTrans / 100);
  var herramienta = mat * (pctHerr / 100);
  var th = transporte + herramienta;
  var directo = mat + th + mo;

  return {
    lineas: conPrecio,
    mat: mat, transporte: transporte, herramienta: herramienta, th: th, mo: mo,
    directo: directo, unitario: directo, sinPrecio: sinPrecio,
    pctTrans: pctTrans, pctHerr: pctHerr, ovTrans: ov.transporte, ovHerr: ov.herramienta,
    matConTh: mat + th,
    pesoMo: directo > 0 ? Math.round((mo / directo) * 100) : 0
  };
}

/* Los márgenes del proyecto, con la excepción que tenga ese análisis */
function margenesDe(p, apu) {
  var mg = {};
  Object.keys(p.margenes || {}).forEach(function (k) { mg[k] = p.margenes[k]; });
  var d = (p.datosApu && p.datosApu[apu]) || {};
  mg.__ov = d.pct || {};
  return mg;
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

/* ------------------------------------------------------------------
   7. Render
   ------------------------------------------------------------------ */

function render() {
  if (vista.pantalla === "catalogo") return renderCatalogo();
  if (vista.pantalla === "precios") return renderPrecios();
  if (vista.pantalla === "ofertas") return renderOfertas();
  if (vista.pantalla === "sync") return renderSync();
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
    '<div class="tirasync">' +
      '<span id="syncestado" class="syncestado"></span>' +
      '<button class="tirab" data-top="sync">Sincronización</button>' +
    '</div>' +
    '</div></div>';
}
function enlazarTop() {
  Array.prototype.forEach.call(document.querySelectorAll("[data-top]"), function (b) {
    b.onclick = function () { ir({ pantalla: b.dataset.top, sel: [], precios: null }); };
  });
  Sync.marca(Sync.encendida() ? "ok" : "");
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
          (i.imp ? " checked" : "") + ' title="Importado: lleva el IVA de importados"></td>' +
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
          '<th style="width:44px;text-align:center" title="Importado">Imp.</th>' +
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
      Catalogo.guardar(c);
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
      Catalogo.guardar(c);
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
      Catalogo.guardar(c);
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
      Catalogo.guardar(c);
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

  var campos = [["rent", "Rentabilidad"], ["dolar", "IVA importados"],
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
        '<div class="dlr dltot"><span class="dlk">Valor total</span><span class="dlv m">' + cop(t.total) + '</span></div>' +
      '</div>' +
      '<div class="ok" style="margin-top:13px">La rentabilidad y el IVA de importados se montan sobre el precio de cada ' +
      'insumo: costo dividido entre uno menos el factor. El de importados solo aplica a los insumos marcados. ' +
      'Administración, imprevistos, utilidad e IVA van una sola vez sobre el subtotal.</div>' +
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

  var colspan = sep ? 11 : 9;
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
    var celPrecio;
    if (!f.apu) {
      celPrecio = sep
        ? '<td class="num">—</td><td class="num">—</td><td class="num">—</td><td class="num">—</td>'
        : '<td class="num">—</td><td class="num">—</td>';
    } else if (sep) {
      celPrecio =
        '<td class="num pmat">' + (a.matConTh ? cop(a.matConTh) : "—") + '</td>' +
        '<td class="num pmat">' + (a.matConTh ? cop(a.matConTh * qf) : "—") + '</td>' +
        '<td class="num pmo">' + (a.mo ? cop(a.mo) : "—") + '</td>' +
        '<td class="num pmo">' + (a.mo ? cop(a.mo * qf) : "—") + '</td>';
    } else {
      celPrecio =
        '<td class="num">' + (a.unitario ? cop(a.unitario) : "—") + '</td>' +
        '<td class="num prtotal">' + (a.unitario ? cop(a.unitario * qf) : "—") + '</td>';
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
      celPrecio +
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

  var encPrecio = sep
    ? '<th style="width:88px;text-align:right">Sumin. unit</th>' +
      '<th style="width:92px;text-align:right">Sumin. total</th>' +
      '<th style="width:88px;text-align:right">M.O. unit</th>' +
      '<th style="width:92px;text-align:right">M.O. total</th>'
    : '<th style="width:100px;text-align:right">Vr. unitario</th>' +
      '<th style="width:104px;text-align:right">Vr. total</th>';

  return '<div class="card">' +
      '<div class="chd"><span class="ct">Armado de análisis</span>' +
      '<span class="cn">' + r.items + ' ítems · ' + r.analisis + ' análisis · ' + r.asignados + ' asignados</span></div>' +
      '<div class="cbd barmado">' +
        '<div class="tabs tabsfijas">' + pestanas + '</div>' +
        '<input class="in infiltro" id="filtroarmado" placeholder="Filtrar por descripción o ítem" value="' +
          esc(vista.filtroArmado || "") + '">' +
      '</div>' +
      '<div class="scroll"><table class="tbl tblarmado"><thead><tr>' +
        '<th style="width:34px"><span class="sr">Elegir</span></th>' +
        '<th style="width:58px">Ítem</th><th>Descripción</th>' +
        '<th style="width:38px">Und</th><th style="width:56px" class="num">Cant.</th>' +
        '<th style="width:210px">Apartados</th><th style="width:54px;text-align:center">Análisis</th>' +
        encPrecio +
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

  return barraPct + '<div class="g g32">' +
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
        '<div class="dl">' +
          '<div class="dlr"><span class="dlk">Subtotal materiales</span><span class="dlv m">' + cop(val.mat) + '</span></div>' +
          (val.th > 0 ? '<div class="dlr"><span class="dlk">Transporte y herramienta</span>' +
            '<span class="dlv m">' + cop(val.th) + '</span></div>' : "") +
          '<div class="dlr"><span class="dlk">Subtotal mano de obra</span><span class="dlv m">' + cop(val.mo) + '</span></div>' +
          '<div class="dlr dltot"><span class="dlk">Costo directo</span>' +
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

/* ------------------------------------------------------------------
   Vista de impresión · el navegador la guarda como PDF
   ------------------------------------------------------------------ */

function imprimirPropuesta(p) {
  var cat = Catalogo.leer();
  if (!cat) { avisoError("Falta el catálogo de insumos."); return; }
  var t = totalesProyecto(p, cat);
  var sep = (p.forma || "junta") === "separada";
  var mg = p.margenes || {};

  var filaTot = function (k, v, fuerte) {
    return '<tr' + (fuerte ? ' class="tot"' : "") + '><td class="k">' + esc(k) + '</td>' +
      '<td class="v">' + cop(v) + '</td></tr>';
  };

  var resumen = sep
    ? '<table class="res"><tbody>' +
        '<tr class="sec"><td colspan="2">Materiales</td></tr>' +
        filaTot("Subtotal", t.subMat) + filaTot("IVA " + (mg.iva || 0) + "%", t.ivaMat) +
        filaTot("Total materiales", t.totalMat, true) +
        '<tr class="sec"><td colspan="2">Mano de obra</td></tr>' +
        filaTot("Subtotal", t.subMo) + filaTot("Administración " + (mg.admin || 0) + "%", t.moAdmin) +
        filaTot("Imprevistos " + (mg.imprev || 0) + "%", t.moImprev) +
        filaTot("Utilidad " + (mg.util || 0) + "%", t.moUtil) +
        filaTot("IVA sobre la utilidad", t.moIva) + filaTot("Total mano de obra", t.totalMo, true) +
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
  (p.hojas || []).forEach(function (h) {
    if (!h.usar) return;
    var cuerpo = "";
    h.filas.forEach(function (f) {
      if (f.tipo === "cap") {
        cuerpo += '<tr class="cap"><td>' + esc(f.item) + '</td><td colspan="' + (sep ? 6 : 4) + '">' +
          esc(f.desc) + '</td></tr>';
        return;
      }
      var a = t.porApu[f.apu] || {};
      var q = Number(f.cant) || 0;
      cuerpo += '<tr><td class="c">' + esc(f.item) + '</td><td>' + esc(f.desc) + '</td>' +
        '<td class="c">' + esc(f.und) + '</td><td class="n">' + fmt(q) + '</td>' +
        (sep
          ? '<td class="n">' + (a.matConTh ? cop(a.matConTh) : "—") + '</td>' +
            '<td class="n">' + (a.matConTh ? cop(a.matConTh * q) : "—") + '</td>' +
            '<td class="n">' + (a.mo ? cop(a.mo) : "—") + '</td>' +
            '<td class="n">' + (a.mo ? cop(a.mo * q) : "—") + '</td>'
          : '<td class="n">' + (a.unitario ? cop(a.unitario) : "—") + '</td>' +
            '<td class="n">' + (a.unitario ? cop(a.unitario * q) : "—") + '</td>') +
      '</tr>';
    });
    cot += '<h3>' + esc(h.nombre) + '</h3><table class="cot"><thead><tr>' +
      '<th style="width:8%">Ítem</th><th>Descripción</th><th style="width:5%">Und</th>' +
      '<th style="width:7%">Cant.</th>' +
      (sep ? '<th style="width:11%">Sumin. unit</th><th style="width:12%">Sumin. total</th>' +
             '<th style="width:11%">M.O. unit</th><th style="width:12%">M.O. total</th>'
           : '<th style="width:13%">Vr. unitario</th><th style="width:14%">Vr. total</th>') +
      '</tr></thead><tbody>' + cuerpo + '</tbody></table>';
  });

  var ana = "";
  analisisDe(p).forEach(function (a) {
    var datos = (p.datosApu && p.datosApu[a.apu]) || {};
    var comp = componerAnalisis(cat, datos, p, a.apu);
    var val = valorizar(cat, comp.lineas, margenesDe(p, a.apu), p);
    var fl = function (l) {
      return '<tr><td class="n">' + dec(l.cantDesp) + '</td><td class="c">' + esc(l.cod) + '</td>' +
        '<td>' + esc(l.desc) + '</td><td class="c">' + esc(l.und) + '</td>' +
        '<td class="n">' + (l.desp ? l.desp + "%" : "") + '</td>' +
        '<td class="n">' + (l.falta ? "—" : cop(l.precio)) + '</td>' +
        '<td class="n">' + (l.falta ? "—" : cop(l.total)) + '</td></tr>';
    };
    ana += '<div class="apu"><div class="apuhd"><span class="apun">APU ' + a.apu + '</span>' +
      '<span class="apui">' + a.items.map(function (x) { return esc(x.item); }).join(", ") + '</span>' +
      '<span class="apud">' + esc(a.items[0] ? a.items[0].desc : "") + '</span></div>' +
      '<table class="cot"><thead><tr><th style="width:10%">Cant.</th><th style="width:12%">Código</th>' +
      '<th>Descripción</th><th style="width:6%">Und</th><th style="width:7%">Desp.</th>' +
      '<th style="width:13%">Vr. unit</th><th style="width:14%">Vr. total</th></tr></thead><tbody>' +
      '<tr class="cap"><td colspan="7">I · Materiales</td></tr>' +
      val.lineas.filter(function (l) { return !l.mo; }).map(fl).join("") +
      '<tr class="sub"><td colspan="6">Subtotal materiales</td><td class="n">' + cop(val.mat) + '</td></tr>' +
      (val.th > 0
        ? '<tr class="cap"><td colspan="7">II · Transporte y herramienta</td></tr>' +
          '<tr><td></td><td class="c">TR1</td><td>Transportes</td><td></td><td class="n">' + dec(val.pctTrans) + '%</td>' +
          '<td></td><td class="n">' + cop(val.transporte) + '</td></tr>' +
          '<tr><td></td><td class="c">HER1</td><td>Herramienta de mano</td><td></td><td class="n">' + dec(val.pctHerr) + '%</td>' +
          '<td></td><td class="n">' + cop(val.herramienta) + '</td></tr>'
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
    res("Materiales · subtotal", t.subMat);
    res("IVA " + (mg.iva || 0) + "%", t.ivaMat);
    res("Total materiales", t.totalMat, true);
    res("Mano de obra · subtotal", t.subMo);
    res("AIU", t.moAdmin + t.moImprev + t.moUtil);
    res("IVA sobre utilidad", t.moIva);
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
    ? ["Ítem", "Descripción", "Und", "Cant.", "APU", "Sumin. unit", "Sumin. total", "M.O. unit", "M.O. total"]
    : ["Ítem", "Descripción", "Und", "Cant.", "APU", "Vr. unitario", "Vr. total"];
  c2.columns = (sep ? [11, 48, 7, 10, 7, 14, 15, 14, 15] : [11, 55, 7, 11, 7, 15, 17]).map(function (w) { return { width: w }; });
  c2.addRow(encCot).eachCell(thd);
  c2.getRow(1).height = 18;

  var rc = 2;
  (p.hojas || []).forEach(function (h) {
    if (!h.usar) return;
    var hr = c2.addRow([h.nombre]);
    c2.mergeCells("A" + rc + ":" + (sep ? "I" : "G") + rc);
    hr.getCell(1).font = { bold: true, size: 10, color: { argb: NAVY } };
    hr.getCell(1).fill = fill(LIME); rc++;
    h.filas.forEach(function (f) {
      if (f.tipo === "cap") {
        var cr = c2.addRow([f.item, f.desc]);
        cr.eachCell(function (cel) { cel.font = { bold: true, size: 9, color: { argb: "FF5A6B7B" } };
          cel.fill = fill(GRIS); }); rc++; return;
      }
      var a = t.porApu[f.apu] || {}; var q = Number(f.cant) || 0;
      var r = sep
        ? c2.addRow([f.item, f.desc, f.und, q, f.apu || "", a.matConTh || null, a.matConTh ? a.matConTh * q : null,
            a.mo || null, a.mo ? a.mo * q : null])
        : c2.addRow([f.item, f.desc, f.und, q, f.apu || "", a.unitario || null, a.unitario ? a.unitario * q : null]);
      r.eachCell(function (cel, cn) {
        cel.border = borde; cel.font = { size: 9 };
        if (cn >= 6) cel.numFmt = moneda;
        if (cn === 4) cel.numFmt = "#,##0.##";
        if (cn === 5) cel.alignment = { horizontal: "center" };
      });
      if (rc % 2 === 0) r.eachCell(function (cel) { if (!cel.fill || !cel.fill.fgColor) cel.fill = fill(GRIS2); });
      rc++;
    });
  });
  c2.addRow([]); rc++;
  var totCot = function (k, v, col) {
    var arr = new Array(sep ? 9 : 7).fill(null);
    arr[1] = k; arr[col] = v;
    var r = c2.addRow(arr);
    r.getCell(2).font = { bold: true, color: { argb: NAVY } };
    r.getCell(col + 1).numFmt = moneda; r.getCell(col + 1).font = { bold: true, color: { argb: NAVY } };
    rc++;
  };
  if (sep) {
    /* col 6 = Sumin. total, col 8 = M.O. total (índices base 0) */
    totCot("Subtotal materiales", t.subMat, 6);
    totCot("Subtotal mano de obra", t.subMo, 8);
    totCot("Total materiales (con IVA)", t.totalMat, 6);
    totCot("Total mano de obra (con AIU)", t.totalMo, 8);
  } else {
    totCot("Subtotal", t.subtotal, 6);
    totCot("AIU", t.admin + t.imprev + t.util, 6);
    totCot("IVA sobre utilidad", t.iva, 6);
    totCot("VALOR TOTAL", t.total, 6);
  }

  /* ===== 3. ANÁLISIS ===== */
  var a3 = wb.addWorksheet("Análisis", { views: [{ showGridLines: false }] });
  a3.columns = [11, 13, 56, 7, 8, 14, 15].map(function (w) { return { width: w }; });
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
    a3.addRow(["Cant.", "Código", "Descripción", "Und", "Desp.", "Vr. unit", "Vr. total"]).eachCell(thd);
    ra++;

    var seccion = function (titulo) {
      var r = a3.addRow(["", "", titulo]);
      a3.mergeCells("C" + ra + ":G" + ra);
      r.getCell(3).font = { bold: true, size: 9, color: { argb: "FF5A6B7B" } };
      r.getCell(3).fill = fill(GRIS); ra++;
    };
    var linea = function (l) {
      var r = a3.addRow([l.cantDesp, l.cod, l.desc, l.und, l.desp ? l.desp / 100 : null,
                         l.falta ? null : l.precio, l.falta ? null : l.total]);
      r.eachCell(function (cel, cn) {
        cel.font = { size: 9 }; cel.border = borde;
        if (cn === 1) cel.numFmt = "#,##0.####";
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
      var tr = a3.addRow([null, "TR1", "Transportes", "", val.pctTrans / 100, null, val.transporte]);
      tr.getCell(5).numFmt = "0.##%"; tr.getCell(7).numFmt = moneda; tr.eachCell(function (c) { c.font = { size: 9 }; }); ra++;
      var he = a3.addRow([null, "HER1", "Herramienta de mano", "", val.pctHerr / 100, null, val.herramienta]);
      he.getCell(5).numFmt = "0.##%"; he.getCell(7).numFmt = moneda; he.eachCell(function (c) { c.font = { size: 9 }; }); ra++;
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
  (p.hojas || []).forEach(function (h) {
    if (!h.usar) return;
    cot.push([h.nombre]);
    h.filas.forEach(function (f) {
      if (f.tipo === "cap") { cot.push([f.item, f.desc]); return; }
      var a = t.porApu[f.apu] || {}; var q = Number(f.cant) || 0;
      cot.push(sep
        ? [f.item, f.desc, f.und, q, f.apu, a.matConTh || "", a.mo || "", a.matConTh ? a.matConTh * q : "", a.mo ? a.mo * q : ""]
        : [f.item, f.desc, f.und, q, f.apu, a.unitario || "", a.unitario ? a.unitario * q : ""]);
    });
  });
  var ws = XLSX.utils.aoa_to_sheet(cot);
  XLSX.utils.book_append_sheet(wb, ws, "COTIZACION");
  XLSX.writeFile(wb, (p.nombre || "propuesta").replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "_") + ".xlsx");
}


/* ------------------------------------------------------------------ */

/* ------------------------------------------------------------------
   Pantalla de sincronización
   ------------------------------------------------------------------ */
function renderSync() {
  var on = Sync.encendida();
  app.innerHTML = barraTop("") +
    '<header class="top"><div class="wrap topin"><div>' +
      '<div class="brand">Trabajo en equipo</div>' +
      '<h1 class="d h1">Sincronización</h1>' +
      '<div class="sub">Los proyectos y el catálogo se guardan en la nube de la empresa</div>' +
    '</div></div></header>' +
    '<main class="wrap main">' +
      '<div class="card"><div class="cbd">' +
        '<div class="field"><label class="lbl" for="synyo">Tu nombre</label>' +
          '<input class="in" id="synyo" placeholder="Para que el equipo sepa quién edita" value="' +
          esc(Nube.yo || "") + '"></div>' +
        '<label class="lbl" style="margin-top:6px"><input type="checkbox" id="synon"' +
          (on ? " checked" : "") + '> Guardar en la nube y ver lo que hacen los demás</label>' +
        '<div id="synmsg" style="margin-top:14px"></div>' +
        '<div class="btnrow" style="margin-top:14px">' +
          '<button class="btn" id="synprobar">Probar conexión</button>' +
          '<button class="btn" id="synbajar">Traer todo de la nube</button>' +
          '<button class="btn" id="synsubir">Subir todo a la nube</button>' +
        '</div>' +
      '</div></div>' +
      '<div class="note"><div class="notet">Cómo funciona</div>' +
      '<div class="noteb">Cada proyecto se guarda por separado, así dos personas en proyectos distintos ' +
      'nunca se pisan. Al abrir uno que otro tiene abierto, te avisa. Todo se guarda primero en tu equipo ' +
      'y luego en la nube, de modo que si se cae internet puedes seguir trabajando y se sube cuando vuelva. ' +
      'No hay contraseña: quien tenga la dirección de la aplicación ve los proyectos.</div></div>' +
    '</main>';
  enlazarTop();

  var yo = document.getElementById("synyo");
  if (yo) yo.onchange = function () {
    Nube.yo = this.value.trim();
    localStorage.setItem("apu.sync.yo", Nube.yo);
  };
  var chk = document.getElementById("synon");
  if (chk) chk.onchange = function () {
    Sync.prender(this.checked);
    Sync.marca(this.checked ? "sync" : "");
    if (this.checked) {
      var m = document.getElementById("synmsg");
      if (m) m.innerHTML = '<div class="ok">Sincronización encendida. Trayendo lo que haya en la nube…</div>';
      Sync.bajarTodo().then(function (res) {
        render();
        var mm = document.getElementById("synmsg");
        if (mm && res && res.ok) mm.innerHTML = '<div class="ok">Todo al día: catálogo ' +
          (res.catalogo || res.sembrado ? "sincronizado" : "sin cambios") + ' y ' + res.nProy +
          (res.nProy === 1 ? " proyecto." : " proyectos.") + '</div>';
      });
    }
  };
  var pr = document.getElementById("synprobar");
  if (pr) pr.onclick = function () {
    var m = document.getElementById("synmsg");
    if (m) m.innerHTML = '<div class="note" style="margin:0"><div class="noteb">Probando…</div></div>';
    Promise.all([
      Nube.leer("catalogo").catch(function () { return null; }),
      Nube.leer("proyectos").catch(function () { return null; })
    ]).then(function (r) {
      var n = r[0] && r[0].items ? r[0].items.length : 0;
      var np = r[1] ? Object.keys(r[1]).length : 0;
      if (m) m.innerHTML = '<div class="ok">Conexión correcta. En la nube hay ' +
        (n ? "un catálogo de " + n + " insumos" : "todavía sin catálogo") +
        ' y ' + np + (np === 1 ? " proyecto." : " proyectos.") + '</div>';
    }).catch(function (e) {
      if (m) m.innerHTML = '<div class="err">No se pudo conectar: ' + esc(e.message) +
        '. Revisa que la base esté en modo prueba y que la dirección sea correcta.</div>';
    });
  };
  var sb = document.getElementById("synsubir");
  if (sb) sb.onclick = function () {
    if (!Sync.encendida()) { avisoError("Primero enciende la sincronización."); return; }
    if (!confirm("Subir tu catálogo y todos tus proyectos a la nube, reemplazando lo que haya allá. ¿Seguir?")) return;
    var m = document.getElementById("synmsg");
    if (m) m.innerHTML = '<div class="note" style="margin:0"><div class="noteb">Subiendo…</div></div>';
    var cat = Catalogo.leer();
    var tareas = [];
    if (cat && cat.items) tareas.push(Nube.escribir("catalogo", cat));
    Store.todos().forEach(function (pp) { tareas.push(Nube.escribir("proyectos/" + pp.id, pp)); });
    tareas.push(Nube.escribir("plantillas", Plantillas.leer()));
    Promise.all(tareas).then(function () {
      Sync.marca("ok");
      if (m) m.innerHTML = '<div class="ok">Se subió todo: catálogo de ' +
        (cat && cat.items ? cat.items.length : 0) + ' insumos y ' + Store.todos().length + ' proyectos.</div>';
    }).catch(function (e) {
      Sync.marca("err");
      if (m) m.innerHTML = '<div class="err">Falló la subida: ' + esc(e && e.message ? e.message : "sin conexión") + '</div>';
    });
  };

  var bj = document.getElementById("synbajar");
  if (bj) bj.onclick = function () {
    if (!Sync.encendida()) { avisoError("Primero enciende la sincronización."); return; }
    if (!confirm("Traer proyectos y catálogo de la nube. Si algo local es más viejo, se actualiza. ¿Seguir?")) return;
    Sync.bajarTodo().then(function (res) {
      render();
      if (res && res.ok) {
        avisoOk("Al día con la nube: catálogo " + (res.catalogo ? "actualizado" : "sin cambios") +
          ", " + res.nProy + (res.nProy === 1 ? " proyecto." : " proyectos.") +
          (res.sembrado ? " Se subió tu catálogo a la nube." : ""));
      } else avisoError("No se pudo traer de la nube. Revisa la conexión.");
    });
  };
}

/* Arranque: recuperar el nombre y sincronizar al abrir */
Nube.yo = localStorage.getItem("apu.sync.yo") || "";

render();

if (Sync.encendida()) {
  Sync.bajarTodo().then(function (res) {
    render();
    if (res && res.ok && (res.catalogo || res.nProy)) {
      Sync.marca("ok");
    }
  });
}

})();
