"use strict";

/* ==================================================================
   Cotización eléctrica · armado de análisis de precios unitarios
   Orquestador: estado de la vista, render dispatcher, arranque.
   ================================================================== */

/* ------------------------------------------------------------------
   5. Estado de la vista
   ------------------------------------------------------------------ */

var vista = { pantalla: "proyectos", pid: null, paso: "ficha", hoja: 0, sel: [], borrador: null,
              precios: null, busca: "", soloSin: false, apu: null, filtroArmadoApu: "" };
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
      '<button class="tirab" id="btnperfil">Mi perfil</button>' +
    '</div>' +
    '</div></div>';
}
function enlazarTop() {
  Array.prototype.forEach.call(document.querySelectorAll("[data-top]"), function (b) {
    b.onclick = function () { ir({ pantalla: b.dataset.top, sel: [], precios: null }); };
  });
  Sync.marca(Sync.encendida() ? "ok" : "");
  var bp = document.getElementById("btnperfil");
  if (bp) bp.onclick = abrirPerfil;
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
      '<div class="sub">El catálogo de insumos se sincroniza con la nube cada 30 minutos</div>' +
    '</div></div></header>' +
    '<main class="wrap main">' +
      '<div class="card"><div class="cbd">' +
        '<div class="ct" style="margin-bottom:8px">Catálogo en la nube</div>' +
        '<div class="field"><label class="lbl" for="synyo">Tu nombre</label>' +
          '<input class="in" id="synyo" placeholder="Para que el equipo sepa quién edita" value="' +
          esc(Nube.yo || "") + '"></div>' +
        '<label class="lbl" style="margin-top:6px"><input type="checkbox" id="synon"' +
          (on ? " checked" : "") + '> Sincronizar catálogo con la nube (cada 30 min)</label>' +
        '<div id="synmsg" style="margin-top:14px"></div>' +
        '<div class="btnrow" style="margin-top:14px">' +
          '<button class="btn" id="synprobar">Probar conexión</button>' +
          '<button class="btn" id="synbajar">Traer catálogo de la nube</button>' +
          '<button class="btn" id="synsubir">Subir catálogo a la nube</button>' +
        '</div>' +
      '</div></div>' +
      '<div class="note"><div class="notet">Cómo funciona ahora</div>' +
      '<div class="noteb"><strong>Catálogo de insumos:</strong> se sincroniza automáticamente cada 30 minutos ' +
      'con la nube de la empresa. También puedes sincronizarlo manualmente con los botones de arriba o desde ' +
      'la pantalla de Proyectos.</div>' +
      '<div class="noteb" style="margin-top:8px"><strong>Proyectos:</strong> cada proyecto vive en tu equipo. ' +
      'Para compartir un proyecto con otro computador, usa <strong>Respaldo</strong> en la lista de proyectos ' +
      'para descargar el archivo JSON, ponlo en la carpeta compartida del Drive, y en el otro equipo usa ' +
      '<strong>Restaurar</strong> para cargarlo. Así cada quien decide qué proyectos trae y no se pisan.</div></div>' +
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
      if (m) m.innerHTML = '<div class="ok">Sincronización encendida. Trayendo catálogo…</div>';
      Sync.bajarTodo().then(function (res) {
        render();
        var mm = document.getElementById("synmsg");
        if (mm && res && res.ok) mm.innerHTML = '<div class="ok">Al día: catálogo ' +
          (res.catalogo || res.sembrado ? "sincronizado" : "sin cambios") + '.</div>';
      });
    }
  };
  var pr = document.getElementById("synprobar");
  if (pr) pr.onclick = function () {
    var m = document.getElementById("synmsg");
    if (m) m.innerHTML = '<div class="note" style="margin:0"><div class="noteb">Probando…</div></div>';
    Nube.leer("catalogo").then(function (cat) {
      var n = cat && cat.items ? cat.items.length : 0;
      if (m) m.innerHTML = '<div class="ok">Conexión correcta. En la nube hay ' +
        (n ? "un catálogo de " + n + " insumos." : "todavía sin catálogo.") + '</div>';
    }).catch(function (e) {
      if (m) m.innerHTML = '<div class="err">No se pudo conectar: ' + esc(e.message) +
        '. Revisa que la base esté en modo prueba y que la dirección sea correcta.</div>';
    });
  };
  var sb = document.getElementById("synsubir");
  if (sb) sb.onclick = function () {
    if (!Sync.encendida()) { avisoError("Primero enciende la sincronización."); return; }
    if (!confirm("Subir tu catálogo a la nube, reemplazando el que haya allá. ¿Seguir?")) return;
    var m = document.getElementById("synmsg");
    if (m) m.innerHTML = '<div class="note" style="margin:0"><div class="noteb">Subiendo…</div></div>';
    var cat = Catalogo.leer();
    var tareas = [];
    if (cat && cat.items) tareas.push(Nube.escribir("catalogo", cat));
    tareas.push(Nube.escribir("plantillas", Plantillas.leer()));
    Promise.all(tareas).then(function () {
      Sync.marca("ok");
      if (m) m.innerHTML = '<div class="ok">Catálogo subido: ' +
        (cat && cat.items ? cat.items.length : 0) + ' insumos.</div>';
    }).catch(function (e) {
      Sync.marca("err");
      if (m) m.innerHTML = '<div class="err">Falló la subida: ' + esc(e && e.message ? e.message : "sin conexión") + '</div>';
    });
  };

  var bj = document.getElementById("synbajar");
  if (bj) bj.onclick = function () {
    if (!Sync.encendida()) { avisoError("Primero enciende la sincronización."); return; }
    Sync.bajarTodo().then(function (res) {
      render();
      if (res && res.ok) {
        avisoOk("Al día con la nube: catálogo " + (res.catalogo ? "actualizado" : "sin cambios") + "." +
          (res.sembrado ? " Se subió tu catálogo a la nube." : ""));
      } else avisoError("No se pudo traer de la nube. Revisa la conexión.");
    });
  };
}

/* ------------------------------------------------------------------ */
/* Perfil de presupuestador                                           */
/* ------------------------------------------------------------------ */
function formularioPerfil(p) {
  p = p || {};
  var puede = !!Perfil.leer();
  return '<div class="modalfondo" id="perfilfondo"><div class="modalcaja card"><div class="cbd">' +
    '<div class="ct" style="margin-bottom:12px">Tu perfil</div>' +
    '<div class="field"><label class="lbl" for="pfnombre">Nombre</label>' +
      '<input class="in" id="pfnombre" value="' + esc(p.nombre || "") + '"></div>' +
    '<div class="field"><label class="lbl" for="pfcargo">Cargo</label>' +
      '<input class="in" id="pfcargo" value="' + esc(p.cargo || "") + '"></div>' +
    '<div class="field"><label class="lbl" for="pfemail">Email</label>' +
      '<input class="in" id="pfemail" value="' + esc(p.email || "") + '"></div>' +
    '<div class="field"><label class="lbl" for="pftel">Teléfono</label>' +
      '<input class="in" id="pftel" value="' + esc(p.tel || "") + '"></div>' +
    '<div class="field"><label class="lbl" for="pffirma">Imagen de firma (PNG o JPG)</label>' +
      '<input class="in" type="file" id="pffirma" accept="image/png,image/jpeg">' +
      (p.firma ? '<img src="' + p.firma + '" alt="Firma actual" style="max-width:220px;margin-top:8px;display:block">' : '') +
    '</div>' +
    '<div class="btnrow" style="margin-top:14px">' +
      '<button class="btn btnp" id="pfguardar">Guardar</button>' +
      (puede ? '<button class="btn" id="pfcerrar">Cancelar</button>' : '') +
    '</div>' +
  '</div></div></div>';
}
function abrirPerfil() {
  cerrarPerfil();
  var actual = Perfil.leer() || {};
  var firmaB64 = actual.firma || "";
  document.body.insertAdjacentHTML("beforeend", formularioPerfil(actual));
  var archivo = document.getElementById("pffirma");
  archivo.onchange = function () {
    var f = archivo.files[0];
    if (!f) return;
    var lector = new FileReader();
    lector.onload = function () { firmaB64 = lector.result; };
    lector.readAsDataURL(f);
  };
  var cerrar = document.getElementById("pfcerrar");
  if (cerrar) cerrar.onclick = cerrarPerfil;
  document.getElementById("pfguardar").onclick = function () {
    var nombre = document.getElementById("pfnombre").value.trim();
    if (!nombre) { avisoError("El nombre es obligatorio."); return; }
    Perfil.guardar({
      nombre: nombre,
      cargo: document.getElementById("pfcargo").value.trim(),
      email: document.getElementById("pfemail").value.trim(),
      tel: document.getElementById("pftel").value.trim(),
      firma: firmaB64
    });
    cerrarPerfil();
    avisoOk("Perfil guardado.");
  };
}
function cerrarPerfil() {
  var f = document.getElementById("perfilfondo");
  if (f) f.remove();
}

/* Arranque: recuperar el nombre y sincronizar al abrir */
var _perfil = Perfil.leer();
Nube.yo = (_perfil && _perfil.nombre) || localStorage.getItem("apu.sync.yo") || "";
if (!_perfil) setTimeout(abrirPerfil, 500);

IDB.abrir().then(function () {
  return Promise.all([IDB.todosProyectos(), IDB.leer("catalogo"), IDB.leer("historial"), IDB.leer("plantillas")]);
}).then(function (r) {
  _cacheProy = r[0] || [];
  _cacheProy.forEach(normalizarProyecto);
  if (r[1]) { _cacheCat = r[1]; _catLeido = true; }
  _cacheHist = r[2] || [];
  _cachePlan = r[3] || [];
  render();
  if (Sync.encendida()) {
    Sync.iniciarTimer();
    Sync.bajarTodo().then(function (res) {
      render();
      if (res && res.ok && res.catalogo) Sync.marca("ok");
    });
  }
}).catch(function () {
  render();
});

