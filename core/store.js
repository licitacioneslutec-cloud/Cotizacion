"use strict";

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

