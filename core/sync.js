"use strict";

/* ==================================================================
   Coordinador de sincronización
   - El catálogo se sincroniza con Firebase via REST cada 30 min + botón manual.
   - Los proyectos NO van a Firebase: se exportan/importan como archivos JSON
     a través de una carpeta compartida (Drive, OneDrive, etc).
   - Nunca bloquea: si la nube falla, se sigue con lo local.
   ================================================================== */
var Sync = {
  timerCat: null, _timerPolling: null, ocupado: false,

  encendida: function () {
    return Nube.activa && localStorage.getItem("apu.sync.on") !== "no";
  },
  prender: function (v) {
    localStorage.setItem("apu.sync.on", v ? "si" : "no");
    if (v) {
      Sync.iniciarTimer();
      Sync.bajarTodo();
    } else {
      Sync.detenerTimer();
    }
  },

  /* Timer de polling: cada 30 min baja el catálogo de la nube */
  iniciarTimer: function () {
    if (Sync._timerPolling) return;
    Sync._timerPolling = setInterval(function () {
      if (Sync.encendida()) Sync.bajarCatalogo();
    }, 30 * 60 * 1000);
  },
  detenerTimer: function () {
    if (Sync._timerPolling) { clearInterval(Sync._timerPolling); Sync._timerPolling = null; }
  },

  /* Baja solo el catálogo de la nube (polling) */
  bajarCatalogo: function () {
    if (!Sync.encendida()) return Promise.resolve(false);
    Sync.marca("sync");
    return Nube.leer("catalogo").then(function (cat) {
      if (!cat || !cat.items || !cat.items.length) { Sync.marca("ok"); return false; }
      var local = Catalogo.leer();
      var fLoc = local && local.modificado ? local.modificado : "";
      if ((cat.modificado || "") > fLoc) {
        _cacheCat = cat; _catLeido = true; _idxCat = null;
        IDB.escribir("catalogo", cat);
        if (vista.pantalla === "catalogo" || vista.pantalla === "precios" || vista.pantalla === "ofertas") render();
      }
      Sync.marca("ok");
      return true;
    }).catch(function () { Sync.marca("err"); return false; });
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
  /* Sube un solo ítem del catálogo (REST) en vez del catálogo entero (~1.2MB). */
  subirItem: function (indice, item) {
    if (!Sync.encendida()) return;
    Nube.escribir("catalogo/items/" + indice, item)
      .then(function () { Sync.marca("ok"); })
      .catch(function () { Sync.marca("err"); });
    var cat = Catalogo.leer();
    if (cat) Nube.actualizar("catalogo", { modificado: cat.modificado }).catch(function () {});
  },
  subirPlantillas: function () {
    if (!Sync.encendida()) return;
    Nube.escribir("plantillas", Plantillas.leer()).catch(function () {});
  },

  /* Carga inicial: baja catálogo y plantillas de la nube. Los proyectos ya no viajan. */
  bajarTodo: function () {
    if (!Sync.encendida()) return Promise.resolve({ ok: false });
    Sync.marca("sync");
    return Promise.all([
      Nube.leer("catalogo").catch(function () { return "ERR"; }),
      Nube.leer("plantillas").catch(function () { return "ERR"; })
    ]).then(function (r) {
      var cat = r[0], plan = r[1];
      var fallo = (cat === "ERR");
      if (cat === "ERR") cat = undefined;
      if (plan === "ERR") plan = undefined;

      var res = { ok: !fallo, catalogo: false, sembrado: false };

      /* ---- Catálogo: bajar de la nube o sembrar si está vacía ---- */
      var local = Catalogo.leer();
      if (cat && cat.items && cat.items.length) {
        var fLoc = local && local.modificado ? local.modificado : "";
        if ((cat.modificado || "") >= fLoc) {
          _cacheCat = cat; _catLeido = true; _idxCat = null;
          IDB.escribir("catalogo", cat);
        }
        res.catalogo = true;
      } else if (local && local.items && local.items.length) {
        Nube.escribir("catalogo", local).catch(function () {});
        res.sembrado = true;
      }

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

  /* Snapshot congelado de un proyecto: copia completa bajo /snapshots/{proyId}/{timestamp} */
  crearSnapshot: function (proyId, etiqueta) {
    var proy = Store.leer(proyId);
    if (!proy) return Promise.resolve(false);
    var ts = new Date().toISOString().replace(/[:.]/g, "-");
    var snapshot = {
      fecha: new Date().toISOString(),
      etiqueta: etiqueta || "Respaldo manual",
      editor: Nube.yo || "desconocido",
      datos: JSON.parse(JSON.stringify(proy))
    };
    delete snapshot.datos.baseModificado;
    return Nube.escribir("snapshots/" + proyId + "/" + ts, snapshot)
      .then(function () {
        Sync.listarSnapshots(proyId).then(function (lista) {
          if (lista.length > 5) {
            lista.slice(5).forEach(function (s) {
              Nube.borrar("snapshots/" + proyId + "/" + s.ts).catch(function () {});
            });
          }
        });
        return true;
      })
      .catch(function () { return false; });
  },
  listarSnapshots: function (proyId) {
    return Nube.leer("snapshots/" + proyId).then(function (data) {
      if (!data) return [];
      return Object.keys(data).map(function (ts) {
        return { ts: ts, fecha: data[ts].fecha, etiqueta: data[ts].etiqueta, editor: data[ts].editor };
      }).sort(function (a, b) { return b.fecha.localeCompare(a.fecha); });
    }).catch(function () { return []; });
  },
  restaurarSnapshot: function (proyId, ts) {
    return Nube.leer("snapshots/" + proyId + "/" + ts).then(function (snap) {
      if (!snap || !snap.datos) return false;
      var proy = snap.datos;
      normalizarProyecto(proy);
      proy.modificado = new Date().toISOString();
      Store.guardar(proy);
      return true;
    }).catch(function () { return false; });
  },
  descargarSnapshot: function (proyId, ts) {
    return Nube.leer("snapshots/" + proyId + "/" + ts).then(function (snap) {
      if (!snap || !snap.datos) return;
      var blob = new Blob([JSON.stringify(snap, null, 2)], { type: "application/json" });
      var a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "snapshot_" + (snap.datos.nombre || proyId) + "_" + snap.fecha.slice(0, 10) + ".json";
      a.click();
      URL.revokeObjectURL(a.href);
    });
  },

  marca: function (estado) {
    var el = document.getElementById("syncestado");
    if (!el) return;
    var txt = { sync: "sincronizando…", ok: "al día", err: "sin conexión" }[estado] || "";
    el.textContent = txt;
    el.className = "syncestado " + estado;
  }
};

var _cacheHist = null;

var Historial = {
  leer: function () {
    if (_cacheHist !== null) return _cacheHist;
    _cacheHist = [];
    return _cacheHist;
  },
  agregar: function (reg) {
    var h = Historial.leer();
    h.unshift(reg);
    if (h.length > 40) h = h.slice(0, 40);
    _cacheHist = h;
    IDB.escribir("historial", h);
  }
};

/* Normaliza un código para poder emparejarlo entre archivos distintos */
function codClave(v) {
  if (v === null || v === undefined) return "";
  var s = String(v).trim();
  s = s.replace(/\.0+$/, "");
  return s.toUpperCase();
}
