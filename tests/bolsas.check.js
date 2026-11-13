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

// Renombrar un capítulo arrastra ítems, subtítulo y pedidos; el disponible se conserva
ctx.bolsaRenombrarCap(b, cap1, "ACOMETIDAS");
assert.strictEqual(ctx.bolsaDisponible(b, "100", "ACOMETIDAS"), 60);
assert.ok(b.items.some(i => i.tipo === "sub" && i.desc === "ACOMETIDAS"));
assert.strictEqual(b.pedidos[1].items[0].cap, "ACOMETIDAS"); // la línea antigua quedó fija

// Mover un solo ítem: sus pedidos lo siguen
const tubo = b.items.find(i => i.cod === "200");
b.pedidos.push({ num: 4, tipo: "obra", items: [{ cod: "200", cap: cap2, cant: 2 }] });
ctx.bolsaMoverItemCap(b, tubo, "OTRO");
assert.strictEqual(ctx.bolsaDisponible(b, "200", "OTRO"), 3);
assert.strictEqual(ctx.bolsaDisponible(b, "100", cap2), 60);

// Hoja APU (formato con "ITEM:"): cantidad del APU, desperdicio, valor unitario, secciones y costo directo
const apuWs = XLSX.utils.aoa_to_sheet([
  [null, "ANALISIS DE PRECIOS UNITARIOS"],
  ["ITEM:", "DESCRIPCION:", "UM:", "CANT", null, null, "COSTO DIRECTO CALCULADO"],
  [1, "Tubería IMC", "m", 22, null, null, 1500],
  ["CODIGO DE INSUMO", "DESCRIPCIÓN", "UM", "CANT", "VR.UNIT", "DESP.", "VR.TOTAL"],
  [null, "I.MATERIALES"],
  [266000316, "VARILLA", "UND", 0.12, 1000, 0.03, 123.6],
  ["-", "-", 0, 0, "0", 0, 0],
  [null, "SUBTOTAL MATERIALES", null, null, "SUBTOTAL MATERIALES", null, 123.6],
  [null, "II. HERRAMIENTAS Y TRANSPORTE"],
  ["TR1", " TRANSPORTES", 0, 0, null, null, 10],
  ["HER1", "HERRAMIENTAS", 0, 0, null, null, 5],
  [null, "III.MANO DE OBRA"],
  ["LTC_PMO008", "OFICIAL", "Hrs", 4, 50, null, 200],
  [null, null, null, null, "COSTO DIRECTO", null, 338.6]
]);
const apus = ctx._extraerApuExcel(apuWs);
assert.strictEqual(apus.length, 1);
const a1 = apus[0];
assert.strictEqual(a1.cant, 22);
assert.strictEqual(a1.lineas.length, 2);
assert.strictEqual(Math.round(a1.lineas[0].desp), 3);
assert.strictEqual(a1.lineas[0].precio, 1000);
assert.strictEqual(a1.lineas[1].mo, true);
assert.strictEqual(a1.transporte, 10);
assert.strictEqual(a1.herramienta, 5);
assert.strictEqual(a1.directo, 338.6);

console.log("bolsas.check OK");
