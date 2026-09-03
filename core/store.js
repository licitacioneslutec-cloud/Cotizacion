"use strict";

/* ------------------------------------------------------------------
   3. Almacenamiento
   ------------------------------------------------------------------ */

/* Los datos se guardan en el navegador, pero se mantienen en memoria mientras
   dure la sesión: volver a interpretarlos en cada redibujado ahoga la página. */
var _cacheProy = null;
var _cacheCat = null;
var _catLeido = false;

var Store = {
  todos: function () {
    if (!_cacheProy) _cacheProy = [];
    return _cacheProy;
  },
  guardar: function (proy) {
    var lista = Store.todos(), i = -1;
    for (var k = 0; k < lista.length; k++) if (lista[k].id === proy.id) { i = k; break; }
    proy.modificado = new Date().toISOString();
    if (Nube.yo) proy.ultimoEditor = Nube.yo;
    if (i >= 0) lista[i] = proy; else lista.unshift(proy);
    _cacheProy = lista;
    IDB.guardarProyecto(proy);
    Sync.subirProyecto(proy);
    return true;
  },
  leer: function (pid) {
    var l = Store.todos();
    for (var i = 0; i < l.length; i++) if (l[i].id === pid) return l[i];
    return null;
  },
  borrar: function (pid) {
    var lista = Store.todos().filter(function (p) { return p.id !== pid; });
    _cacheProy = lista;
    IDB.borrarProyecto(pid);
    Sync.borrarProyecto(pid);
  }
};
/* Catálogo de insumos, compartido por todos los proyectos */
var Catalogo = {
  leer: function () {
    if (!_catLeido) _catLeido = true;
    return _cacheCat;
  },
  /* indiceCambio: si se pasa (y >= 0), solo cambió ese ítem y se sube nada más él (PATCH).
     Sin índice, se asume un cambio masivo (import, restauración) y se sube el catálogo entero. */
  guardar: function (cat, indiceCambio) {
    cat.modificado = new Date().toISOString();
    _cacheCat = cat; _catLeido = true;
    _idxCat = null;
    IDB.escribir("catalogo", cat);
    if (indiceCambio !== undefined && indiceCambio >= 0) Sync.subirItem(indiceCambio, cat.items[indiceCambio]);
    else Sync.subirCatalogo();
    return true;
  },
  borrar: function () {
    IDB.borrar("catalogo");
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

