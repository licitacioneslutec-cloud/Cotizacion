"use strict";

/* ==================================================================
   Coordinador de sincronización
   - Sube en segundo plano, con un pequeño retardo para no mandar una
     escritura por cada tecla.
   - Baja al abrir la aplicación y al entrar a un proyecto.
   - Nunca bloquea: si la nube falla, se sigue con lo local.
   ================================================================== */
var Sync = {
  pendProy: {}, timerProy: null, timerCat: null, ocupado: false,
  _listeners: {},

  /* Listener en tiempo real de la lista de proyectos: crear/eliminar/modificar se ve sin recargar. */
  escucharProyectos: function () {
    if (!db || Sync._listeners.proyChanged) return;

    var onCambio = function (snap) {
      var id = snap.key;
      var nube = snap.val();
      if (!nube) return;
      nube = transformarClaves(nube, decClaveFB);
      if (vista.pid === id) return;
      var loc = Store.leer(id);
      if (!loc || (nube.modificado || "") > (loc.modificado || "")) {
        normalizarProyecto(nube);
        var lista = Store.todos();
        var encontrado = false;
        for (var k = 0; k < lista.length; k++) {
          if (lista[k].id === id) { lista[k] = nube; encontrado = true; break; }
        }
        if (!encontrado) lista.unshift(nube);
        _cacheProy = lista;
        IDB.guardarProyecto(nube);
      }
      if (vista.pantalla === "proyectos") render();
      Sync.marca("ok");
    };

    Sync._listeners.proyChanged = db.ref("proyectos").on("child_changed", onCambio);

    Sync._listeners.proyRemoved = db.ref("proyectos").on("child_removed", function (snap) {
      var id = snap.key;
      if (vista.pid === id) return;
      _cacheProy = Store.todos().filter(function (p) { return p.id !== id; });
      IDB.borrarProyecto(id);
      if (vista.pantalla === "proyectos") render();
    });
  },

  /* Listener en tiempo real del catálogo: empuja cada cambio a todos los equipos. */
  escucharCatalogo: function () {
    if (!db || Sync._listeners.catItems) return;

    Sync._listeners.catItems = db.ref("catalogo/items").on("child_changed", function (snap) {
      var idx = Number(snap.key);
      var itemNube = snap.val();
      if (!itemNube || isNaN(idx)) return;
      itemNube = transformarClaves(itemNube, decClaveFB);
      var cat = Catalogo.leer();
      if (!cat || !cat.items || idx >= cat.items.length) return;
      cat.items[idx] = itemNube;
      _cacheCat = cat;
      _idxCat = null;
      IDB.escribir("catalogo", cat);
      if (vista.pantalla === "catalogo" || vista.pantalla === "precios" || vista.pantalla === "ofertas") render();
      Sync.marca("ok");
    });

    Sync._listeners.catMod = db.ref("catalogo/modificado").on("value", function (snap) {
      var fNube = snap.val() || "";
      var cat = Catalogo.leer();
      var fLoc = cat && cat.modificado ? cat.modificado : "";
      if (fNube > fLoc && cat) {
        cat.modificado = fNube;
        _cacheCat = cat;
        var hoy = new Date().toISOString().slice(0, 10);
        var ultimoAutoSnap = localStorage.getItem("apu.lastAutoSnap") || "";
        if (hoy !== ultimoAutoSnap) {
          localStorage.setItem("apu.lastAutoSnap", hoy);
          Store.todos().forEach(function (pp) {
            if (!pp.congelarPrecios) {
              Sync.crearSnapshot(pp.id, "Auto: catálogo " + hoy).catch(function () {});
            }
          });
        }
      }
    });
  },

  /* Apaga todos los listeners en tiempo real (catálogo + proyectos). */
  detenerListeners: function () {
    if (!db) return;
    if (Sync._listeners.catItems) {
      db.ref("catalogo/items").off("child_changed", Sync._listeners.catItems);
      Sync._listeners.catItems = null;
    }
    if (Sync._listeners.catMod) {
      db.ref("catalogo/modificado").off("value", Sync._listeners.catMod);
      Sync._listeners.catMod = null;
    }
    if (Sync._listeners.proyChanged) {
      db.ref("proyectos").off("child_changed", Sync._listeners.proyChanged);
      Sync._listeners.proyChanged = null;
    }
    if (Sync._listeners.proyRemoved) {
      db.ref("proyectos").off("child_removed", Sync._listeners.proyRemoved);
      Sync._listeners.proyRemoved = null;
    }
  },

  encendida: function () {
    return Nube.activa && localStorage.getItem("apu.sync.on") !== "no";
  },
  prender: function (v) {
    localStorage.setItem("apu.sync.on", v ? "si" : "no");
    if (v) {
      Sync.escucharCatalogo();
      Sync.escucharProyectos();
      Sync.bajarTodo();
    } else {
      Sync.detenerListeners();
    }
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
      IDB.escribirTodosProyectos(lista);
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
  /* Sube un solo ítem del catálogo (PATCH) en vez del catálogo entero (~1.2MB).
     También empuja el timestamp del catálogo para que el listener de otros equipos vea el cambio. */
  subirItem: function (indice, item) {
    if (!Sync.encendida()) return;
    var ref = Nube.ref("catalogo/items/" + indice);
    if (!ref) return;
    var limpio = JSON.parse(JSON.stringify(item, function (k, v) { return v === undefined ? null : v; }));
    var seguro = transformarClaves(limpio, codClaveFB);
    ref.set(seguro).then(function () { Sync.marca("ok"); }).catch(function () { Sync.marca("err"); });
    var cat = Catalogo.leer();
    if (cat) Nube.actualizar("catalogo", { modificado: cat.modificado }).catch(function () {});
  },
  subirPlantillas: function () {
    if (!Sync.encendida()) return;
    Nube.escribir("plantillas", Plantillas.leer()).catch(function () {});
  },

  /* Carga inicial / reconexión. Los listeners (escucharCatalogo/escucharProyectos) ya
     mantienen todo al día en tiempo real; esto solo siembra la nube si está vacía y
     sube lo que exista únicamente en local (catálogo, proyectos, plantillas). */
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

      /* ---- Catálogo: sembrar la nube si está vacía ---- */
      var local = Catalogo.leer();
      if ((!cat || !cat.items || !cat.items.length) && local && local.items && local.items.length) {
        Nube.escribir("catalogo", local).then(function () { Sync.marca("ok"); }).catch(function () {});
        res.sembrado = true;
      }
      res.catalogo = !!(cat && cat.items && cat.items.length);

      /* ---- Proyectos: subir los que solo existen en local ---- */
      var locales = Store.todos();
      if (proys) {
        locales.forEach(function (pp) { if (!proys[pp.id]) Sync.subirProyecto(pp); });
        res.nProy = Object.keys(proys).length;
      } else if (locales.length) {
        locales.forEach(function (pp) { Sync.subirProyecto(pp); });
        res.nProy = locales.length;
      }

      /* ---- Plantillas: bajar si la nube tiene más, subir si la nube no tiene ---- */
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
        IDB.guardarProyecto(nube);
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
  /* Baja un snapshot como archivo .json (no toca el proyecto local) */
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

