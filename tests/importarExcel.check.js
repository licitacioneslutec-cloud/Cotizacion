"use strict";
/* Ejecutar con: node tests/importarExcel.check.js */
const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const raiz = path.join(__dirname, "..");
const ctx = { console, window: { addEventListener() {} }, document: {} };
vm.createContext(ctx);
["core/utils.js", "datos/motor.js", "ui/importarExcel.js"].forEach(function (f) {
  /* Sin "use strict" las funciones quedan como globales del contexto, igual que en el navegador */
  const src = fs.readFileSync(path.join(raiz, f), "utf8").replace('"use strict";', "");
  vm.runInContext(src, ctx, { filename: f });
});

const cerca = (a, b) => assert.ok(Math.abs(a - b) < 1e-6, a + " != " + b);
const mg = { rent: 10, dolar: 19 };

// Venta a costo: debe ser el inverso exacto de precioAjustado
[
  { imp: true },
  { imp: false },
  { imp: true, rent: false },
  { imp: false, rent: false }
].forEach(function (banderas) {
  const costo = 1000;
  const it = Object.assign({ cod: "X", precio: costo }, banderas);
  const venta = ctx.precioAjustado(it, mg, {});
  cerca(ctx.costoDesdeVenta(venta, it, mg), costo);
});
cerca(ctx.costoDesdeVenta(500, { imp: true }, { rent: 0, dolar: 0 }), 500);

// Desperdicio: el total de la línea no cambia aunque el catálogo tenga otro desperdicio
const cant = ctx.cantConDesperdicio(10, 20, 5);
cerca(cant * 1.05, 10 * 1.2);
cerca(ctx.cantConDesperdicio(10, 5, 5), 10);
cerca(ctx.cantConDesperdicio(10, 0, 0), 10);

// Ajuste de precio final: con transporte y herramienta debe alcanzar la diferencia pedida
const pctTH = 3;
[300, -300].forEach(function (dif) {
  const valor = ctx.valorLineaAjuste(0, dif, pctTH);
  cerca(valor * (1 + pctTH / 100), dif);
});
cerca(ctx.valorLineaAjuste(100, 103, pctTH), 200);

console.log("OK");
