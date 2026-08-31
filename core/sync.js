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

