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

// Tope de pedidos: obra/provisional no pueden superar el disponible por código + capítulo
const bt = { items: [{ tipo: "it", cod: "C", capitulo: "K1", cantTotal: 10 }, { tipo: "it", cod: "C", capitulo: "K2", cantTotal: 5 }],
  pedidos: [{ num: 1, tipo: "obra", items: [{ cod: "C", cap: "K1", cant: 8 }] }] };
assert.strictEqual(ctx.bolsaExcedidos(bt, [{ cod: "C", cap: "K1", cant: 2 }]).length, 0);
assert.strictEqual(ctx.bolsaExcedidos(bt, [{ cod: "C", cap: "K1", cant: 3 }]).length, 1);
assert.strictEqual(ctx.bolsaExcedidos(bt, [{ cod: "C", cap: "K1", cant: 2 }, { cod: "C", cap: "K1", cant: 1 }]).length, 1); // líneas se suman
assert.strictEqual(ctx.bolsaExcedidos(bt, [{ cod: "C", cap: "K2", cant: 5 }]).length, 0);
assert.strictEqual(ctx.bolsaExcedidos(bt, [{ cod: "AD_001", cant: 999 }]).length, 0);
// Editando el pedido 1: lo que ya tenía (8) vuelve a contar
assert.strictEqual(ctx.bolsaExcedidos(bt, [{ cod: "C", cap: "K1", cant: 10 }], 1).length, 0);
assert.strictEqual(ctx.bolsaExcedidos(bt, [{ cod: "C", cap: "K1", cant: 11 }], 1).length, 1);

// Presupuesto tipo Licify: "Cód. APU" como título, Vr. Unitario/Vr. Total repetidos (suministro y MO)
const presWs = XLSX.utils.aoa_to_sheet([
  ["Formulario"],
  [null, null, "Item", "Descripción", "Unidad", "Cantidad", "SUMINISTRO", "Vr. Unitario", "Vr. Total", "Vr. Unitario", null, "Vr. Total"],
  [null, "Cód. APU", null, "Salidas Torre 2"],
  ["APU0", 1, 1, "Salida cableada", "Un", 10, 0.19, 100, 1000, 50, null, 500],
  ["APU2", 2, 2, "Tomacorriente", "Un", 4, 0.19, 10, 40, 5, null, 20],
  ["APU3", 3, 3, "GFCI", "Un", 2, 0.19, 1, 2, 1, null, 2],
  [null, null, null, "Acometidas"],
  [null, null, 4, "Ítem sin APU", "Ml", 3, 0.19, 7, 21, 0, null, 0]
]);
const detP = ctx._detectarPresupuesto(presWs);
assert.strictEqual(detP.mapa.apu, 1);
assert.strictEqual(detP.mapa.precioSum, 7);
assert.strictEqual(detP.mapa.precioMo, 9);
assert.strictEqual(detP.mapa.totalMo, 11);
const pres = ctx._extraerPresupuesto(presWs, detP.mapa);
const presIt = pres.filter(x => x.tipo === "it");
assert.strictEqual(pres.filter(x => x.tipo === "cap").map(x => x.desc).join("|"), "Salidas Torre 2|Acometidas");
assert.strictEqual(presIt.length, 4);
assert.strictEqual(presIt[0].apu, 1);
assert.strictEqual(presIt[0].precioSum, 100);
assert.strictEqual(presIt[0].precioMo, 50);
assert.strictEqual(presIt[0].precioUnit, 150);
assert.strictEqual(presIt[0].valorTotal, 1500);
assert.strictEqual(presIt[3].apu, 0); // ítem con cantidad pero sin APU

// Sin título de APU: se toma la columna con números junto a "APU12"
const sinTit = XLSX.utils.aoa_to_sheet([
  [null, null, "Item", "Descripción", "Unidad", "Cantidad"],
  ["APU1", 7, "1", "A", "Un", 1], ["APU2", 8, "2", "B", "Un", 1], ["APU3", 9, "3", "C", "Un", 1]
]);
const detS = ctx._detectarPresupuesto(sinTit);
assert.strictEqual(detS.mapa.apu, 1);
assert.ok(/APU/.test(detS.apuComo));

console.log("bolsas.check OK");
