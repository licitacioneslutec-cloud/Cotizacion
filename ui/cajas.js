"use strict";

/* ------------------------------------------------------------------
   Repositorio de cajas tipo Enel / Codensa
   ------------------------------------------------------------------ */

var CAJAS_ENEL = [
  { ref: "CS274",  nombre: "Caja de inspección — alumbrado público y acometidas BT",
    tapa: "60 × 60 cm", interior: "55 × 55 cm", prof: "60 cm",
    uso: "Acometidas de baja tensión y alumbrado público. No aplica en zonas vehiculares." },
  { ref: "CS275",  nombre: "Caja de inspección sencilla — canalización MT y BT",
    tapa: "118 × 68 cm", interior: "119 × 69 cm", prof: "137 cm",
    uso: "Canalización subterránea de media y baja tensión. Ductos 6ø4\" y 6ø6\". No aplica en zonas vehiculares." },
  { ref: "CS276",  nombre: "Caja de inspección doble — canalización MT y BT",
    tapa: "118 × 138 cm", interior: "119 × 139 cm", prof: "137 cm",
    uso: "Derivación de la CS275 cuando se requieren derivaciones futuras de media tensión." },
  { ref: "CS277",  nombre: "Cámara de inspección tipo bóveda",
    tapa: "120 × 120 cm", interior: "200 × 200 cm", prof: "200 cm",
    uso: "Cámaras de inspección grandes para redes subterráneas principales." }
];

var CLAVE_CAJAS = "apu.cajas.custom.v1";

function cajasCustom() {
  try { return JSON.parse(localStorage.getItem(CLAVE_CAJAS)) || []; } catch (e) { return []; }
}
function guardarCajasCustom(lista) {
  localStorage.setItem(CLAVE_CAJAS, JSON.stringify(lista));
}

function renderCajas() {
  var custom = cajasCustom();
  var todas = CAJAS_ENEL.concat(custom);
  var q = (vista.buscaCaja || "").toLowerCase();
  var ver = todas;
  if (q) ver = ver.filter(function (c) {
    return c.ref.toLowerCase().indexOf(q) >= 0 ||
           c.nombre.toLowerCase().indexOf(q) >= 0 ||
           (c.uso || "").toLowerCase().indexOf(q) >= 0;
  });

  var filas = ver.map(function (c, i) {
    var esCustom = i >= CAJAS_ENEL.length;
    return '<tr>' +
      '<td class="m" style="font-weight:500">' + esc(c.ref) + '</td>' +
      '<td>' + esc(c.nombre) + (esCustom ? ' <span class="tagpropio">personalizada</span>' : '') + '</td>' +
      '<td class="m" style="font-size:12px">' + esc(c.tapa || "—") + '</td>' +
      '<td class="m" style="font-size:12px">' + esc(c.interior || "—") + '</td>' +
      '<td class="m" style="font-size:12px">' + esc(c.prof || "—") + '</td>' +
      '<td style="font-size:12px;color:var(--ink2)">' + esc(c.uso || "") + '</td>' +
      (esCustom ? '<td style="text-align:center"><button class="btnx" data-quitcaja="' + (i - CAJAS_ENEL.length) + '">Quitar</button></td>' : '<td></td>') +
    '</tr>';
  }).join("");

  app.innerHTML = barraTop("cajas") +
    '<header class="top"><div class="wrap topin"><div>' +
      '<div class="brand">Referencia</div>' +
      '<h1 class="d h1">Cajas tipo Enel</h1>' +
      '<div class="sub">Repositorio de cajas de inspección Enel / Codensa — dimensiones de referencia</div>' +
    '</div></div></header>' +
    '<main class="wrap main">' +

    '<div class="card"><div class="chd"><span class="ct">Cajas registradas</span>' +
      '<span class="cn">' + ver.length + ' de ' + todas.length + '</span></div><div class="cbd">' +
      '<input class="in" id="buscacaja" placeholder="Buscar por referencia, nombre o uso" value="' + esc(vista.buscaCaja || "") + '">' +
      '<div class="scroll" style="margin-top:14px"><table class="tbl"><thead><tr>' +
        '<th style="width:80px">Ref.</th><th>Nombre</th>' +
        '<th style="width:110px">Tapa</th><th style="width:110px">Interior</th>' +
        '<th style="width:80px">Prof.</th><th>Uso / notas</th><th style="width:50px"></th>' +
      '</tr></thead><tbody>' + filas + '</tbody></table></div>' +
    '</div></div>' +

    '<div class="card"><div class="chd"><span class="ct">Agregar caja personalizada</span></div><div class="cbd">' +
      '<div class="g" style="grid-template-columns:100px 1fr;gap:10px">' +
        '<div><label class="lbl" for="cj-ref">Referencia</label><input class="in m" id="cj-ref" placeholder="CS999"></div>' +
        '<div><label class="lbl" for="cj-nombre">Nombre</label><input class="in" id="cj-nombre" placeholder="Caja de..."></div>' +
      '</div>' +
      '<div class="g" style="grid-template-columns:1fr 1fr 1fr;gap:10px;margin-top:10px">' +
        '<div><label class="lbl" for="cj-tapa">Tapa (cm)</label><input class="in m" id="cj-tapa" placeholder="60 × 60 cm"></div>' +
        '<div><label class="lbl" for="cj-int">Interior (cm)</label><input class="in m" id="cj-int" placeholder="55 × 55 cm"></div>' +
        '<div><label class="lbl" for="cj-prof">Profundidad</label><input class="in m" id="cj-prof" placeholder="60 cm"></div>' +
      '</div>' +
      '<div style="margin-top:10px"><label class="lbl" for="cj-uso">Uso / notas</label><input class="in" id="cj-uso" placeholder="Opcional"></div>' +
      '<div class="btnrow" style="margin-top:12px">' +
        '<button class="btn btnp" id="cj-agregar">Agregar caja</button>' +
      '</div>' +
    '</div></div>' +

    '<div class="note"><div class="notet">Fuente de datos</div>' +
      '<div class="noteb">Dimensiones tomadas de las normas de construcción Enel Colombia (CS274, CS275, CS276, CS277). ' +
      'Verificar contra la norma vigente en likinormas.enelcol.com.co. Las cajas personalizadas se guardan en este navegador.</div></div>' +

    '</main>';

  enlazarTop();
  enlazarCajas();
}

function enlazarCajas() {
  var b = document.getElementById("buscacaja");
  if (b) b.oninput = function () {
    vista.buscaCaja = this.value;
    var pos = this.selectionStart, y = window.scrollY;
    render(); window.scrollTo(0, y);
    var n = document.getElementById("buscacaja");
    if (n) { n.focus(); n.setSelectionRange(pos, pos); }
  };

  var btn = document.getElementById("cj-agregar");
  if (btn) btn.onclick = function () {
    var ref = document.getElementById("cj-ref").value.trim();
    var nombre = document.getElementById("cj-nombre").value.trim();
    if (!ref || !nombre) { avisoError("La referencia y el nombre son obligatorios."); return; }
    var c = cajasCustom();
    c.push({
      ref: ref, nombre: nombre,
      tapa: document.getElementById("cj-tapa").value.trim(),
      interior: document.getElementById("cj-int").value.trim(),
      prof: document.getElementById("cj-prof").value.trim(),
      uso: document.getElementById("cj-uso").value.trim()
    });
    guardarCajasCustom(c);
    avisoOk("Caja " + ref + " agregada.");
    render();
  };

  Array.prototype.forEach.call(document.querySelectorAll("[data-quitcaja]"), function (b) {
    b.onclick = function () {
      var i = Number(b.dataset.quitcaja);
      var c = cajasCustom();
      c.splice(i, 1);
      guardarCajasCustom(c);
      render();
    };
  });
}
