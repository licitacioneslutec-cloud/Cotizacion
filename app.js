"use strict";

/* ==================================================================
   Cotización eléctrica · armado de análisis de precios unitarios
   Orquestador: estado de la vista, render dispatcher, arranque.
   ================================================================== */

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
  Sync.escucharCatalogo();
  Sync.bajarTodo().then(function (res) {
    render();
    if (res && res.ok && (res.catalogo || res.nProy)) {
      Sync.marca("ok");
    }
  });
}

