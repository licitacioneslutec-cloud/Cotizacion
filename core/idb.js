"use strict";

/* ------------------------------------------------------------------
   IndexedDB — reemplaza localStorage para datos grandes.
   ~50-100 MB+ vs el límite de ~5-10 MB de localStorage.
   ------------------------------------------------------------------ */

var IDB = {
  _db: null,

  abrir: function () {
    if (IDB._db) return Promise.resolve(IDB._db);
    return new Promise(function (resolve, reject) {
      var req = indexedDB.open("apu-db", 1);
      req.onupgradeneeded = function (e) {
        var db = e.target.result;
        if (!db.objectStoreNames.contains("proyectos"))  db.createObjectStore("proyectos", { keyPath: "id" });
        if (!db.objectStoreNames.contains("catalogo"))    db.createObjectStore("catalogo");
        if (!db.objectStoreNames.contains("historial"))   db.createObjectStore("historial");
        if (!db.objectStoreNames.contains("plantillas"))  db.createObjectStore("plantillas");
      };
      req.onsuccess = function (e) {
        IDB._db = e.target.result;
        IDB._migrar().then(function () { resolve(IDB._db); }).catch(function () { resolve(IDB._db); });
      };
      req.onerror = function () { reject(req.error); };
    });
  },

  _migrar: function () {
    var promesas = [], claves = [];
    try {
      var raw;
      raw = localStorage.getItem(CLAVE);
      if (raw) { promesas.push(IDB.escribirTodosProyectos(JSON.parse(raw))); claves.push(CLAVE); }
      raw = localStorage.getItem(CLAVE_CAT);
      if (raw) { promesas.push(IDB.escribir("catalogo", JSON.parse(raw))); claves.push(CLAVE_CAT); }
      raw = localStorage.getItem(CLAVE_HIST);
      if (raw) { promesas.push(IDB.escribir("historial", JSON.parse(raw))); claves.push(CLAVE_HIST); }
      raw = localStorage.getItem(CLAVE_PLAN);
      if (raw) { promesas.push(IDB.escribir("plantillas", JSON.parse(raw))); claves.push(CLAVE_PLAN); }
    } catch (e) { return Promise.resolve(); }
    if (!promesas.length) return Promise.resolve();
    return Promise.all(promesas).then(function () {
      claves.forEach(function (k) { localStorage.removeItem(k); });
    });
  },

  todosProyectos: function () {
    return new Promise(function (resolve, reject) {
      var tx = IDB._db.transaction("proyectos", "readonly");
      var req = tx.objectStore("proyectos").getAll();
      req.onsuccess = function () { resolve(req.result || []); };
      req.onerror = function () { reject(req.error); };
    });
  },

  guardarProyecto: function (p) {
    return new Promise(function (resolve, reject) {
      var tx = IDB._db.transaction("proyectos", "readwrite");
      tx.objectStore("proyectos").put(p);
      tx.oncomplete = function () { resolve(); };
      tx.onerror = function () { reject(tx.error); };
    });
  },

  borrarProyecto: function (pid) {
    return new Promise(function (resolve, reject) {
      var tx = IDB._db.transaction("proyectos", "readwrite");
      tx.objectStore("proyectos").delete(pid);
      tx.oncomplete = function () { resolve(); };
      tx.onerror = function () { reject(tx.error); };
    });
  },

  escribirTodosProyectos: function (lista) {
    return new Promise(function (resolve, reject) {
      var tx = IDB._db.transaction("proyectos", "readwrite");
      var store = tx.objectStore("proyectos");
      store.clear();
      lista.forEach(function (p) { store.put(p); });
      tx.oncomplete = function () { resolve(); };
      tx.onerror = function () { reject(tx.error); };
    });
  },

  leer: function (nombre) {
    return new Promise(function (resolve, reject) {
      var tx = IDB._db.transaction(nombre, "readonly");
      var req = tx.objectStore(nombre).get("main");
      req.onsuccess = function () { resolve(req.result !== undefined ? req.result : null); };
      req.onerror = function () { reject(req.error); };
    });
  },

  escribir: function (nombre, valor) {
    return new Promise(function (resolve, reject) {
      var tx = IDB._db.transaction(nombre, "readwrite");
      tx.objectStore(nombre).put(valor, "main");
      tx.oncomplete = function () { resolve(); };
      tx.onerror = function () { reject(tx.error); };
    });
  },

  borrar: function (nombre) {
    return new Promise(function (resolve, reject) {
      var tx = IDB._db.transaction(nombre, "readwrite");
      tx.objectStore(nombre).delete("main");
      tx.oncomplete = function () { resolve(); };
      tx.onerror = function () { reject(tx.error); };
    });
  }
};
