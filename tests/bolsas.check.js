"use strict";
/* Ejecutar con: node tests/bolsas.check.js  (necesita el paquete xlsx: npm i xlsx en esta carpeta o una superior) */
const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const XLSX = require("xlsx");

const raiz = path.join(__dirname, "..");
const ctx = { console, XLSX, window: { addEventListener() {} }, document: {},
  Store: { leer: () => null }, Catalogo: { leer: () => null } };
vm.createContext(ctx);
["core/utils.js", "ui/bolsas.js"].forEach(function (f) {
  const src = fs.readFileSync(path.join(raiz, f), "utf8").replace('"use strict";', "");
  vm.runInContext(src, ctx, { filename: f });
});

// Excel de bolsa en matriz: columnas CAP1, CAP2 con la cantidad de cada capítulo
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([
  ["REVISIÓN CANTIDADES"],
  [null, "ÍTEM", "DESCRIPCIÓN"],
  [null, 1, "REDES EXTERIORES"],
  [null, "1.1", "Tubería"],
  [null, 2, "SUBESTACIÓN"]
]), "TORRE");
XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([
  [],
  [],
  [null, null, "PRECIO UNITARIO", null, "COD AURANET", "COD AURANET ARR", "CAP1", "CAP2", "CANTIDAD FINAL"],
  [100, "Cable 12", 2000, 160, 11031, "011031", 100, 60, 160],
  [200, "Tubo", 500, 5, 77, "000077", 0, 5, 5],
  [300, "Sin capítulos", 10, 3, null, null, 0, 0, 3],
  [null, null, null, null, null, null, 999, 999, null]
]), "BOLSA");
const buf = XLSX.write(wb, { type: "array", bookType: "xlsx" });
const b = ctx.importarBolsaExcel(new Uint8Array(buf), "bolsa prueba.xlsx");

assert.strictEqual(b.nombre, "bolsa prueba");
const cap1 = "CAP 1 - REDES EXTERIORES", cap2 = "CAP 2 - SUBESTACIÓN";
assert.strictEqual(b.items.filter(i => i.tipo === "sub").map(i => i.desc).join("|"), [cap1, cap2, "Sin capítulo"].join("|"));
const items = b.items.filter(i => i.tipo === "it");
assert.strictEqual(items.length, 4);
const cable1 = items.find(i => i.cod === "100" && i.capitulo === cap1);
assert.strictEqual(cable1.cantTotal, 100);
assert.strictEqual(cable1.codAuranet, "011031");
assert.strictEqual(items.find(i => i.cod === "100" && i.capitulo === cap2).cantTotal, 60);
assert.strictEqual(items.find(i => i.cod === "300").capitulo, "Sin capítulo");

// Un pedido de capítulo 1 solo descuenta del capítulo 1
b.pedidos = [{ num: 1, tipo: "obra", items: [{ cod: "100", cap: cap1, cant: 30 }] }];
assert.strictEqual(ctx.bolsaDisponible(b, "100", cap1), 70);
assert.strictEqual(ctx.bolsaDisponible(b, "100", cap2), 60);
assert.strictEqual(ctx.bolsaDisponible(b, "100"), 130);

// Pedidos antiguos (sin cap) se cargan al primer ítem con ese código
b.pedidos.push({ num: 2, tipo: "obra", items: [{ cod: "100", cant: 10 }] });
assert.strictEqual(ctx.bolsaDisponible(b, "100", cap1), 60);
assert.strictEqual(ctx.bolsaDisponible(b, "100", cap2), 60);

// Adicionales no restan
b.pedidos.push({ num: 3, tipo: "adicional", items: [{ cod: "100", cap: cap2, cant: 50 }] });
assert.strictEqual(ctx.bolsaDisponible(b, "100", cap2), 60);

assert.strictEqual(ctx.bolsaItemPorCod(b, "100", cap2).cantTotal, 60);
assert.strictEqual(ctx.bolsaAuranet(b, cable1), "011031");

console.log("bolsas.check OK");
