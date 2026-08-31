"use strict";

/* ------------------------------------------------------------------
   2. Utilidades
   ------------------------------------------------------------------ */

function norm(v) {
  if (v === null || v === undefined) return "";
  return String(v)
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}
function txt(v) {
  if (v === null || v === undefined) return "";
  return String(v).replace(/\s+/g, " ").trim();
}
function esNum(v) {
  if (v === null || v === undefined || v === "") return false;
  var n = Number(String(v).replace(/\./g, "").replace(",", "."));
  return !isNaN(n);
}
function aNum(v) {
  if (v === null || v === undefined || v === "") return 0;
  if (typeof v === "number") return isFinite(v) ? v : 0;
  var s = String(v).trim();
  /* Se quitan símbolos de moneda, espacios normales y duros, y paréntesis de negativo */
  var neg = /^\(.*\)$/.test(s);
  s = s.replace(/[$€£\s\u00a0\u202f()]/g, "");
  if (!s) return 0;
  /* Decimal con coma: 1.234,56 → 1234.56  |  1,234.56 → 1234.56 */
  if (/,\d+$/.test(s)) s = s.replace(/\./g, "").replace(",", ".");
  /* Miles con punto: 1.180 o 12.345.678, pero NO 0.025 (un cero al frente nunca es millar) */
  else if (/^-?[1-9]\d{0,2}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, "");
  /* En cualquier otro caso el punto es decimal (0.025, 3.5) y la coma sobra */
  else s = s.replace(/,/g, "");
  var n = Number(s);
  if (isNaN(n)) return 0;
  return neg ? -n : n;
}

/* Los códigos de ítem llegan a veces como 3.3399999999999928 */
function codigoItem(v) {
  if (v === null || v === undefined) return "";
  var s = String(v).trim();
  if (/^\d+\.\d{6,}$/.test(s)) {
    var n = Number(s);
    var r = n.toFixed(2);
    return r.replace(/0+$/, "").replace(/\.$/, "");
  }
  return s;
}
function fmt(n) { return Number(n).toLocaleString("es-CO"); }
function dec(n) {
  var v = Number(n);
  if (!isFinite(v)) return "0";
  return v.toLocaleString("es-CO", { minimumFractionDigits: 0, maximumFractionDigits: 4 });
}
function cop(n) { return "$" + Math.round(Number(n) || 0).toLocaleString("es-CO"); }
function hoy() { return new Date().toISOString().slice(0, 10); }
function fecha(s) {
  if (!s) return "—";
  var p = String(s).split("-");
  if (p.length !== 3) return s;
  var mes = ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"];
  return Number(p[2]) + " " + mes[Number(p[1]) - 1] + " " + p[0];
}
function id() { return "p" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
function esc(s) {
  return String(s === null || s === undefined ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

/* ------------------------------------------------------------------
   2bis. Aviso de errores a la vista
   Si algo falla, se muestra en pantalla en vez de morir en silencio.
   ------------------------------------------------------------------ */

function avisoOk(mensaje) {
  var caja = document.getElementById("errorglobal");
  if (!caja) {
    caja = document.createElement("div");
    caja.id = "errorglobal";
    document.body.appendChild(caja);
  }
  caja.className = "errglobal okglobal";
  caja.innerHTML = '<div class="errglobal-t">Listo</div>' +
    '<div class="errglobal-b">' + esc(mensaje) + '</div>' +
    '<div class="errglobal-a"><button class="btn" id="errcerrar">Cerrar</button></div>';
  caja.style.display = "block";
  var cc = document.getElementById("errcerrar");
  if (cc) cc.onclick = function () { caja.style.display = "none"; };
  setTimeout(function () { if (caja && caja.className.indexOf("okglobal") >= 0) caja.style.display = "none"; }, 7000);
}

function avisoError(mensaje) {
  var caja = document.getElementById("errorglobal");
  if (!caja) {
    caja = document.createElement("div");
    caja.id = "errorglobal";
    document.body.appendChild(caja);
  }
  caja.className = "errglobal";
  caja.innerHTML =
    '<div class="errglobal-t">Algo falló</div>' +
    '<div class="errglobal-b">' + esc(mensaje) + '</div>' +
    '<div class="errglobal-a">' +
      '<button class="btn" id="errcopiar">Copiar el mensaje</button>' +
      '<button class="btn" id="errcerrar">Cerrar</button>' +
    '</div>';
  caja.style.display = "block";
  var cp = document.getElementById("errcopiar");
  if (cp) cp.onclick = function () {
    try { navigator.clipboard.writeText(mensaje); cp.textContent = "Copiado"; } catch (e) {}
  };
  var cc = document.getElementById("errcerrar");
  if (cc) cc.onclick = function () { caja.style.display = "none"; };
}

window.onerror = function (msg, url, linea, col) {
  avisoError(msg + "  (línea " + linea + ":" + col + ")");
  return false;
};
window.addEventListener("unhandledrejection", function (e) {
  avisoError("Fallo sin atender: " + (e.reason && e.reason.message ? e.reason.message : e.reason));
});

