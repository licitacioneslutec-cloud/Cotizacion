"use strict";

/* ------------------------------------------------------------------
   Calculadora de llenado de tubería eléctrica
   NEC Chapter 9 Tables 1, 4, 5 — THHN/THWN-2
   ------------------------------------------------------------------ */

var TUBERIA_AREAS = {
  "PVC Sch40": {
    "1/2\"": 0.285, "3/4\"": 0.508, "1\"": 0.832, "1-1/4\"": 1.453, "1-1/2\"": 1.986,
    "2\"": 3.291, "2-1/2\"": 5.066, "3\"": 7.922, "3-1/2\"": 10.568, "4\"": 13.886
  },
  "EMT": {
    "1/2\"": 0.304, "3/4\"": 0.533, "1\"": 0.864, "1-1/4\"": 1.496, "1-1/2\"": 2.036,
    "2\"": 3.356, "2-1/2\"": 5.858, "3\"": 8.846, "3-1/2\"": 11.545, "4\"": 15.513
  },
  "IMC": {
    "1/2\"": 0.342, "3/4\"": 0.586, "1\"": 0.959, "1-1/4\"": 1.647, "1-1/2\"": 2.169,
    "2\"": 3.630, "2-1/2\"": 5.452, "3\"": 8.688, "3-1/2\"": 11.258, "4\"": 15.040
  }
};

var CABLE_AREAS = [
  { cal: "14 AWG", area: 0.0097 },
  { cal: "12 AWG", area: 0.0133 },
  { cal: "10 AWG", area: 0.0211 },
  { cal: "8 AWG",  area: 0.0366 },
  { cal: "6 AWG",  area: 0.0507 },
  { cal: "4 AWG",  area: 0.0824 },
  { cal: "3 AWG",  area: 0.0973 },
  { cal: "2 AWG",  area: 0.1158 },
  { cal: "1 AWG",  area: 0.1562 },
  { cal: "1/0",    area: 0.1855 },
  { cal: "2/0",    area: 0.2223 },
  { cal: "3/0",    area: 0.2679 },
  { cal: "4/0",    area: 0.3237 },
  { cal: "250 kcmil", area: 0.3970 },
  { cal: "300 kcmil", area: 0.4608 },
  { cal: "350 kcmil", area: 0.5242 },
  { cal: "500 kcmil", area: 0.7073 }
];

/* NEC Chapter 9 Table 1 */
function limiteNEC(n) { return n <= 1 ? 0.53 : n === 2 ? 0.31 : 0.40; }

function renderLlenado() {
  if (!vista.llenadoCables) vista.llenadoCables = [];
  if (!vista.llenadoTubo) vista.llenadoTubo = "PVC Sch40";
  if (!vista.llenadoDiam) vista.llenadoDiam = "1\"";

  var tipos = Object.keys(TUBERIA_AREAS);
  var diams = Object.keys(TUBERIA_AREAS[vista.llenadoTubo] || {});
  var areaTubo = (TUBERIA_AREAS[vista.llenadoTubo] || {})[vista.llenadoDiam] || 0;

  var cables = vista.llenadoCables;
  var totalCables = 0;
  var areaCables = 0;
  cables.forEach(function (c) {
    totalCables += c.qty;
    areaCables += c.qty * c.area;
  });

  var lim = limiteNEC(totalCables);
  var areaDisp = areaTubo * lim;
  var pctUsado = areaTubo > 0 ? (areaCables / areaTubo * 100) : 0;
  var pctLimite = lim * 100;
  var pctDeDisp = areaDisp > 0 ? (areaCables / areaDisp * 100) : 0;
  var ok = areaCables <= areaDisp;

  var filasCables = cables.map(function (c, i) {
    return '<tr><td>' + esc(c.cal) + '</td><td class="num">' + c.qty + '</td>' +
      '<td class="num m">' + (c.area * c.qty * 645.16).toFixed(1) + '</td>' +
      '<td style="text-align:center"><button class="btnx" data-quitcable="' + i + '">Quitar</button></td></tr>';
  }).join("");

  var selCal = CABLE_AREAS.map(function (c) {
    return '<option value="' + c.cal + '">' + c.cal + ' (' + (c.area * 645.16).toFixed(1) + ' mm²)</option>';
  }).join("");

  app.innerHTML = barraTop("llenado") +
    '<header class="top"><div class="wrap topin"><div>' +
      '<div class="brand">Herramientas</div>' +
      '<h1 class="d h1">Llenado de tubería</h1>' +
      '<div class="sub">Calculadora de capacidad de llenado según NEC/RETIE Cap. 9</div>' +
    '</div></div></header>' +
    '<main class="wrap main">' +

    '<div class="card"><div class="chd"><span class="ct">Tubería</span></div><div class="cbd">' +
      '<div class="g g2">' +
        '<div><label class="lbl" for="ll-tipo">Tipo de tubería</label>' +
          '<select class="in" id="ll-tipo">' + tipos.map(function (t) {
            return '<option' + (t === vista.llenadoTubo ? ' selected' : '') + '>' + t + '</option>';
          }).join("") + '</select></div>' +
        '<div><label class="lbl" for="ll-diam">Diámetro</label>' +
          '<select class="in" id="ll-diam">' + diams.map(function (d) {
            return '<option' + (d === vista.llenadoDiam ? ' selected' : '') + '>' + esc(d) + '</option>';
          }).join("") + '</select></div>' +
      '</div>' +
      '<div class="kpi" style="margin-top:14px">' +
        '<div class="kc"><div class="kk">Área interna</div><div class="kv" style="font-size:16px">' + (areaTubo * 645.16).toFixed(1) + ' mm²</div></div>' +
        '<div class="kc"><div class="kk">Llenado máx. (' + totalCables + (totalCables === 1 ? ' cable' : ' cables') + ')</div><div class="kv" style="font-size:16px">' + pctLimite.toFixed(0) + '%</div></div>' +
      '</div>' +
    '</div></div>' +

    '<div class="card"><div class="chd"><span class="ct">Cables</span>' +
      '<span class="cn">' + totalCables + ' conductores</span></div><div class="cbd">' +
      '<div class="g" style="grid-template-columns:1fr 80px auto;align-items:end;gap:10px;max-width:500px">' +
        '<div><label class="lbl" for="ll-cal">Calibre</label>' +
          '<select class="in" id="ll-cal">' + selCal + '</select></div>' +
        '<div><label class="lbl" for="ll-qty">Cantidad</label>' +
          '<input class="in m" type="number" id="ll-qty" min="1" value="1" style="text-align:center"></div>' +
        '<div><button class="btn btnp" id="ll-agregar">Agregar</button></div>' +
      '</div>' +
      (cables.length ? '<div class="scroll" style="margin-top:14px"><table class="tbl"><thead><tr>' +
        '<th>Calibre</th><th class="num">Cantidad</th><th class="num">Área total (mm²)</th><th style="width:60px"></th>' +
        '</tr></thead><tbody>' + filasCables + '</tbody></table></div>'
        : '<div class="empty" style="padding:24px">Agrega cables para calcular el llenado.</div>') +
    '</div></div>' +

    (cables.length ? '<div class="card"><div class="chd"><span class="ct">Resultado</span></div><div class="cbd">' +
      '<div class="kpi">' +
        '<div class="kc"><div class="kk">Área cables</div><div class="kv" style="font-size:16px">' + (areaCables * 645.16).toFixed(1) + ' mm²</div></div>' +
        '<div class="kc"><div class="kk">Área disponible</div><div class="kv" style="font-size:16px">' + (areaDisp * 645.16).toFixed(1) + ' mm²</div></div>' +
        '<div class="kc"><div class="kk">% Ocupado (del total)</div><div class="kv" style="font-size:16px">' + pctUsado.toFixed(1) + '%</div></div>' +
        '<div class="kc"><div class="kk">% del permitido</div><div class="kv" style="font-size:16px;color:' + (ok ? 'var(--ok)' : 'var(--err)') + '">' + pctDeDisp.toFixed(1) + '%</div></div>' +
      '</div>' +
      '<div class="bar" style="margin-top:14px;height:22px;border-radius:4px;position:relative;background:var(--line)">' +
        '<div style="position:absolute;left:0;top:0;bottom:0;width:' + Math.min(pctDeDisp, 100) + '%;background:' + (ok ? 'var(--lime)' : 'var(--err)') + ';border-radius:4px;transition:width .3s"></div>' +
        '<div style="position:absolute;top:0;bottom:0;left:0;right:0;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:600;color:var(--navy)">' +
          (areaCables * 645.16).toFixed(0) + ' / ' + (areaDisp * 645.16).toFixed(0) + ' mm²</div>' +
      '</div>' +
      (ok
        ? '<div class="ok" style="margin-top:14px">Cumple el llenado máximo del ' + pctLimite.toFixed(0) + '% para ' + totalCables + ' conductores.</div>'
        : '<div class="err" style="margin-top:14px">Excede el llenado máximo del ' + pctLimite.toFixed(0) + '%. Se necesita un diámetro mayor.</div>') +
    '</div></div>' : '') +

    '<div class="note"><div class="notet">Referencia</div>' +
      '<div class="noteb">Áreas según NEC Chapter 9, Tables 4 y 5 (THHN/THWN-2). ' +
      'Llenado máximo: 1 cable = 53%, 2 cables = 31%, 3+ cables = 40% (Table 1). ' +
      'Los datos son orientativos — verificar contra la edición del código adoptada por su jurisdicción.</div></div>' +

    '</main>';

  enlazarTop();
  enlazarLlenado();
}

function enlazarLlenado() {
  var tipo = document.getElementById("ll-tipo");
  if (tipo) tipo.onchange = function () {
    vista.llenadoTubo = this.value;
    var diams = Object.keys(TUBERIA_AREAS[vista.llenadoTubo] || {});
    if (diams.indexOf(vista.llenadoDiam) < 0) vista.llenadoDiam = diams[0] || "";
    render();
  };
  var diam = document.getElementById("ll-diam");
  if (diam) diam.onchange = function () { vista.llenadoDiam = this.value; render(); };

  var btn = document.getElementById("ll-agregar");
  if (btn) btn.onclick = function () {
    var cal = document.getElementById("ll-cal").value;
    var qty = Number(document.getElementById("ll-qty").value) || 1;
    if (qty < 1) qty = 1;
    var area = 0;
    CABLE_AREAS.forEach(function (c) { if (c.cal === cal) area = c.area; });
    if (!vista.llenadoCables) vista.llenadoCables = [];
    var existe = false;
    vista.llenadoCables.forEach(function (c) {
      if (c.cal === cal) { c.qty += qty; existe = true; }
    });
    if (!existe) vista.llenadoCables.push({ cal: cal, qty: qty, area: area });
    render();
  };

  Array.prototype.forEach.call(document.querySelectorAll("[data-quitcable]"), function (b) {
    b.onclick = function () {
      var i = Number(b.dataset.quitcable);
      vista.llenadoCables.splice(i, 1);
      render();
    };
  });
}
