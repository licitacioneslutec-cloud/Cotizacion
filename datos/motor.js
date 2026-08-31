"use strict";

/* ------------------------------------------------------------------
   4ter. Motor de composición
   ------------------------------------------------------------------ */

/* Códigos de mano de obra que llevan factor 0,75 en tubería PVC enterrada */
var CODIGOS_MO_075 = ["LTC_PMO006", "LTC_PMO003", "LTC_PMO007", "LTC_PMO008"];
var SUBITEM_075 = ["ZONA VERDE", "ANDEN"];

function esManoObra(cod) {
  return String(cod || "").toUpperCase().indexOf("LTC") === 0;
}
function limpia(v) { return txt(v).toUpperCase(); }

/* Opciones disponibles en el apartado de tuberías, en cascada */
function opcionesTuberia(cat, material, tipo) {
  var d = (cat && cat.comp && cat.comp.tuberia) || [];
  var fam = {}, sub = {}, dia = {};
  d.forEach(function (r) {
    var f = limpia(r["Familia"]), s = limpia(r["SUB-ITEM"]), c = txt(r["C. Tuberia"]);
    if (!f) return;
    fam[f] = true;
    if (material && f !== limpia(material)) return;
    if (s) sub[s] = true;
    if (tipo && s !== limpia(tipo)) return;
    if (c) dia[c] = true;
  });
  var orden = function (o) { return Object.keys(o).sort(); };
  return { familias: orden(fam), tipos: orden(sub), diametros: orden(dia) };
}

/* Compone una fila de tubería. Réplica de la sección 5.2 del proceso actual. */
function componerTuberia(cat, fila) {
  var d = (cat && cat.comp && cat.comp.tuberia) || [];
  var mat = limpia(fila.material), tipo = limpia(fila.tipo), dia = txt(fila.diam);
  var cantM = Number(fila.cantidad) || 0;
  if (cantM === 0) cantM = 1;

  var encontradas = d.filter(function (r) {
    return limpia(r["Familia"]) === mat &&
           limpia(r["SUB-ITEM"]) === tipo &&
           txt(r["C. Tuberia"]) === dia;
  });
  if (!encontradas.length) return { lineas: [], aviso: "No hay esa combinación en el catálogo" };

  var aplica075 = mat === "PVC" && SUBITEM_075.indexOf(tipo) >= 0 && cantM > 1;

  var lineas = encontradas.map(function (r) {
    var cod = codClave(r["CODIGO"]);
    var con075 = aplica075 && CODIGOS_MO_075.indexOf(cod) >= 0;
    var factor = cantM * (con075 ? 0.75 : 1);
    return {
      cant: aNum(r["CANT"]) * factor,
      cod: cod,
      desc: txt(r["DESCRIPCION"]),
      und: txt(r["UNID"]),
      f075: con075
    };
  });
  return { lineas: lineas, aplica075: aplica075, aviso: null };
}

/* Contadores correlativos por familia, para los ítems que se crean */
var CONTADOR_INICIAL = {
  TRAFO: 5560010, CELDA: 5660010, TABLERO: 5760010,
  CAJA_MAMPOSTERIA: 5860010, CAJA_METALICA: 5870010, SUBESTACION: 5880010,
  CAJA_PVC: 5890010, LUMINARIA: 5910010, APANTALLAMIENTO: 5920010,
  SIS_INCENDIO: 6020010, SIS_RITEL: 6030010, SIS_SEG_CTRL: 6040010,
  SIS_SEG_CCTV: 6050010, SIS_COMM: 6060010, SIS_AUTOM: 6070010,
  SIS_CTRL_ILU: 6080010, BORNA: 653100034, DOCUMENTACION: 6090010, EQUI_URB: 6100010
};

/* Opciones del apartado de equipos, en cascada */
function opcionesEquipo(cat, familia) {
  var d = (cat && cat.comp && cat.comp.equipos) || [];
  var fam = {}, sub = {};
  d.forEach(function (r) {
    var f = limpia(r["FAMILIA"]), s = limpia(r["SUBFAMILIA"]);
    if (f) fam[f] = true;
    if (familia && f !== limpia(familia)) return;
    if (s) sub[s] = true;
  });
  return { familias: Object.keys(fam).sort(), subfamilias: Object.keys(sub).sort() };
}

/* Todas las subfamilias, para el apartado de módulos */
function subfamiliasEquipo(cat) {
  var d = (cat && cat.comp && cat.comp.equipos) || [];
  var s = {};
  d.forEach(function (r) { var v = limpia(r["SUBFAMILIA"]); if (v) s[v] = true; });
  return Object.keys(s).sort();
}

/* Reserva el siguiente código correlativo de una familia */
function siguienteCodigo(p, familia) {
  if (!p.contadores) p.contadores = {};
  var f = limpia(familia);
  if (p.contadores[f] === undefined) {
    p.contadores[f] = CONTADOR_INICIAL[f] !== undefined ? CONTADOR_INICIAL[f] : null;
  }
  if (p.contadores[f] === null) return "ITEM_" + f;
  var cod = String(p.contadores[f]);
  p.contadores[f] += 1;
  return cod;
}

/* Compone una fila de equipos. Réplica de la sección 5.4 del proceso actual. */
function componerEquipo(cat, fila, p, apu) {
  var d = (cat && cat.comp && cat.comp.equipos) || [];
  var fam = limpia(fila.familia), sub = limpia(fila.subfamilia);
  if (!fam || !sub) return { lineas: [], aviso: null, incompleto: true };

  var enc = d.filter(function (r) {
    return limpia(r["FAMILIA"]) === fam && limpia(r["SUBFAMILIA"]) === sub;
  });
  if (!enc.length) return { lineas: [], aviso: "No hay coincidencia: " + fam + " / " + sub };

  var lineas = [], creado = null;
  var quitarPrincipal = false;

  if (fila.crearItem && txt(fila.nombreItem)) {
    /* El código se reserva una vez y queda guardado con la fila */
    if (!fila.codItem) {
      fila.codItem = siguienteCodigo(p, fam);
      Store.guardar(p);
    }
    creado = { cod: fila.codItem, desc: txt(fila.nombreItem) };
    lineas.push({
      cant: 1, cod: fila.codItem, desc: txt(fila.nombreItem),
      und: txt(fila.unidad) || "UND", propio: true
    });
    quitarPrincipal = true;
  }

  var mo = Number(fila.manoObra) || 0;

  enc.forEach(function (r) {
    var marca = limpia(r["ITEMP"]);
    if (quitarPrincipal && marca === "PRINCIPAL") return;
    var inc = aNum(r["INCIDENCIA"]);
    var cant = (marca === "MN" && mo > 0) ? mo : inc;
    lineas.push({
      cant: cant, cod: codClave(r["CODIGO"]), desc: txt(r["DESCRIPCION"]),
      und: txt(r["UNIDAD"]), mn: marca === "MN"
    });
  });

  return { lineas: lineas, creado: creado, aviso: null };
}

/* Compone una fila de módulos: busca en equipos solo por subfamilia */
function componerModulo(cat, fila) {
  var d = (cat && cat.comp && cat.comp.equipos) || [];
  var item = limpia(fila.item);
  if (!item) return { lineas: [], incompleto: true };

  var enc = d.filter(function (r) { return limpia(r["SUBFAMILIA"]) === item; });
  if (!enc.length) return { lineas: [], aviso: "No se encontró en equipos: " + item };

  var cu = Number(fila.cantidad);
  if (!cu) cu = 1;
  return {
    lineas: enc.map(function (r) {
      return {
        cant: aNum(r["INCIDENCIA"]) * cu, cod: codClave(r["CODIGO"]),
        desc: txt(r["DESCRIPCION"]), und: txt(r["UNIDAD"])
      };
    }), aviso: null
  };
}

/* Los ítems que crea el usuario viven en el proyecto, no en el catálogo general */
function registrarPropio(p, fila) {
  if (!p.propios) p.propios = {};
  var cod = codClave(fila.codItem);
  var prev = p.propios[cod] || {};
  /* El precio y la unidad pueden haberse editado desde la pantalla de insumos;
     el del formulario manda solo si trae un valor, para no pisar lo editado. */
  var precioForm = aNum(fila.precio);
  var undForm = txt(fila.unidad);
  p.propios[cod] = {
    cod: cod,
    desc: txt(fila.nombreItem) || prev.desc || "",
    und: undForm || prev.und || "UND",
    precio: precioForm > 0 ? precioForm : (Number(prev.precio) || 0),
    imp: fila.imp !== undefined ? !!fila.imp : !!prev.imp,
    desp: aNum(fila.desp) || Number(prev.desp) || 0,
    propio: true
  };
}

/* Fija el precio de un insumo desde cualquier pantalla del proyecto.
   Si es propio, va al proyecto; si tiene ofertas, cambia la elegida; si no, el precio suelto. */
function fijarPrecio(p, cod, valor) {
  var n = Number(valor) || 0;
  if (p.propios && p.propios[cod]) { p.propios[cod].precio = n; Store.guardar(p); return; }
  var c = Catalogo.leer();
  var i = Catalogo.indice(c)[cod];
  if (i === undefined) return;
  var it = c.items[i];
  if (it.ofertas && it.ofertas.length) {
    var j = (p.proveedores && p.proveedores[cod] !== undefined)
      ? p.proveedores[cod] : (it.sel !== undefined ? it.sel : 0);
    if (it.ofertas[j]) it.ofertas[j].precio = n;
  } else {
    it.precio = n;
  }
  it.act = new Date().toISOString();
  Catalogo.guardar(c);
}

/* Busca un insumo primero entre los propios del proyecto, luego en el catálogo */
function insumoDe(cat, cod, p) {
  if (p && p.propios && p.propios[cod]) return p.propios[cod];
  var idx = Catalogo.indice(cat);
  return idx[cod] !== undefined ? cat.items[idx[cod]] : null;
}

/* ------------------------------------------------------------------
   Tableros
   El catálogo ya trae las protecciones listadas ("3x40 A 10kA"), así que
   aquí se eligen de una lista en vez de escribirlas y descifrarlas.
   ------------------------------------------------------------------ */

var FAM_TABLERO = ["MONOFASICO", "BIFASICO", "TRIFASICO", "DRX", "DPX"];

function opcionesTablero(cat, familia) {
  var d = (cat && cat.comp && cat.comp.tableros) || [];
  var fam = {}, sub = {};
  d.forEach(function (r) {
    var f = limpia(r["Familia"]), s = txt(r["SUB-ITEM"]);
    if (f) fam[f] = true;
    if (familia && f !== limpia(familia)) return;
    if (s) sub[s] = true;
  });
  var todas = Object.keys(fam).sort();
  return {
    tableros: todas.filter(function (f) { return FAM_TABLERO.indexOf(f) >= 0; }),
    protecciones: todas.filter(function (f) { return FAM_TABLERO.indexOf(f) < 0; }),
    subitems: Object.keys(sub).sort(function (a, b) {
      var na = parseFloat(a), nb = parseFloat(b);
      if (!isNaN(na) && !isNaN(nb) && na !== nb) return na - nb;
      return a.localeCompare(b, "es");
    })
  };
}

function itemsTablero(cat, familia, subitem) {
  var d = (cat && cat.comp && cat.comp.tableros) || [];
  return d.filter(function (r) {
    return limpia(r["Familia"]) === limpia(familia) &&
           normSub(r["SUB-ITEM"]) === normSub(subitem);
  });
}
function normSub(v) { return limpia(v).replace(/\s+/g, ""); }

/* Compone una fila de tableros: el tablero base más sus protecciones */
function componerTablero(cat, fila) {
  var lineas = [], avisos = [];

  if (fila.familia && fila.subitem) {
    var base = itemsTablero(cat, fila.familia, fila.subitem);
    if (!base.length) avisos.push("No hay tablero " + limpia(fila.familia) + " " + txt(fila.subitem));
    base.forEach(function (r) {
      lineas.push({
        cant: aNum(r["CANT"]), cod: codClave(r["CODIGO"]),
        desc: txt(r["DESCRIPCION"]), und: txt(r["UNIDAD"])
      });
    });
  }

  (fila.prot || []).forEach(function (pr, i) {
    if (!pr.familia || !pr.subitem) return;
    var cant = Number(pr.cantidad) || 0;
    if (cant <= 0) return;
    var enc = itemsTablero(cat, pr.familia, pr.subitem);
    if (!enc.length) {
      avisos.push("Protección " + (i + 1) + ": no existe " + limpia(pr.familia) + " " + txt(pr.subitem));
      return;
    }
    enc.forEach(function (r) {
      lineas.push({
        cant: aNum(r["CANT"]) * cant, cod: codClave(r["CODIGO"]),
        desc: txt(r["DESCRIPCION"]), und: txt(r["UNIDAD"])
      });
    });
  });

  return { lineas: lineas, aviso: avisos.length ? avisos.join(" · ") : null };
}

/* ------------------------------------------------------------------
   Cableados
   Los 100 cables del catálogo se eligen de una lista, así que no hay
   que descifrar textos como "1/0 THHN CU": el cable ya viene con su
   código, su descripción y su rendimiento de mano de obra.
   ------------------------------------------------------------------ */

/* Calibre de una descripción, para emparejar cable con borna */
function calibreDe(texto) {
  var t = limpia(texto);
  var m = t.match(/(\d+)\s*MM2/);        if (m) return m[1];
  m = t.match(/(\d+)\s*\/\s*0/);          if (m) return m[1] + "/0";
  m = t.match(/(\d+)\s*MCM/);             if (m) return m[1];
  m = t.match(/(\d+)\s*AWG/);             if (m) return m[1];
  m = t.match(/(\d+)\s*[X]\s*(\d+)/);     if (m) return m[1] + "x" + m[2];
  m = t.match(/\d+/);                     return m ? m[0] : null;
}

/* Cables que no llevan borna estándar por calibre */
function sinBornaEstandar(desc) {
  var t = limpia(desc);
  return t.indexOf("DUPLEX") >= 0 || t.indexOf("SPT") >= 0 ||
         t.indexOf("ENCAU") >= 0 || t.indexOf("ALAMBRON") >= 0 ||
         t.indexOf("UTP") >= 0 || t.indexOf("COAXIAL") >= 0;
}
function esUTP(desc) { return limpia(desc).indexOf("UTP") >= 0; }

function listaCables(cat) {
  var d = (cat && cat.comp && cat.comp.cableado) || [];
  return d.map(function (r, i) {
    return {
      i: i, cod: codClave(r["codigo cable"]), desc: txt(r["descricion cable"]),
      pmo: aNum(r["cantidades mano de obra"]),
      codMo: codClave(r["Codigo mano de obra"]), nomMo: txt(r["nombre mano de obra"])
    };
  }).filter(function (c) { return c.cod && c.desc; });
}

function bornaPorCalibre(cat, calibre) {
  var d = (cat && cat.comp && cat.comp.bornas) || [];
  for (var i = 0; i < d.length; i++) {
    var desc = txt(d[i]["Descripcion"]);
    if (limpia(desc).indexOf("COAXIAL") >= 0) continue;   /* el RG-6 va solo a los UTP */
    if (calibreDe(desc) === calibre) {
      return { cod: codClave(d[i]["Codigo Bornas"]), desc: desc, und: txt(d[i]["UNIDAD"]) };
    }
  }
  return null;
}
function conectorCoaxial(cat) {
  var d = (cat && cat.comp && cat.comp.bornas) || [];
  for (var i = 0; i < d.length; i++) {
    if (limpia(d[i]["Descripcion"]).indexOf("COAXIAL") >= 0) {
      return { cod: codClave(d[i]["Codigo Bornas"]), desc: txt(d[i]["Descripcion"]), und: txt(d[i]["UNIDAD"]) };
    }
  }
  return null;
}

/* Compone una acometida: los cables, su mano de obra y sus bornas */
function componerCableado(cat, fila) {
  var cables = listaCables(cat);
  var porCod = {};
  cables.forEach(function (c) { porCod[c.cod] = c; });

  var lineas = [], avisos = [];
  var totalPmo = 0, moRef = null;
  var bornasPorCal = {}, utpTotal = 0;

  var metrado = Number(fila.metrado) || 0;
  var repite = Number(fila.repite) || 0;
  var divisor = metrado > 0 ? metrado : 1;
  var factor = repite > 0 ? repite : 1;

  ["fase", "neutro", "tierra"].forEach(function (rol) {
    var codCable = fila[rol];
    var cant = Number(fila["cant" + rol.charAt(0).toUpperCase() + rol.slice(1)]) || 0;
    if (!codCable || cant <= 0) return;

    var c = porCod[codClave(codCable)];
    if (!c) { avisos.push("El cable de " + rol + " ya no está en el catálogo"); return; }

    lineas.push({ cant: cant, cod: c.cod, desc: c.desc, und: "ML" });
    totalPmo += c.pmo * cant;
    if (!moRef) moRef = c;

    if (fila.bornas) {
      if (esUTP(c.desc)) utpTotal += cant;
      else if (!sinBornaEstandar(c.desc)) {
        var k = calibreDe(c.desc);
        if (k) bornasPorCal[k] = (bornasPorCal[k] || 0) + cant;
      }
    }
  });

  if (totalPmo > 0 && moRef) {
    lineas.push({ cant: totalPmo, cod: moRef.codMo, desc: moRef.nomMo, und: "Hrs" });
  }

  if (fila.bornas) {
    Object.keys(bornasPorCal).forEach(function (k) {
      var b = bornaPorCalibre(cat, k);
      if (!b) { avisos.push("No hay borna para calibre " + k); return; }
      lineas.push({
        cant: (bornasPorCal[k] * 2) / divisor * factor,
        cod: b.cod, desc: b.desc, und: b.und
      });
    });
    if (utpTotal > 0) {
      var rg = conectorCoaxial(cat);
      if (rg) lineas.push({ cant: (utpTotal * 2) / divisor * factor, cod: rg.cod, desc: rg.desc, und: rg.und });
      else avisos.push("No se encontró el conector coaxial RG-6");
    }
  }

  return { lineas: lineas, aviso: avisos.length ? avisos.join(" · ") : null };
}

/* ------------------------------------------------------------------
   Salidas
   ------------------------------------------------------------------ */

var FAM_CUADRADA = "SALIDA CUADRADA O RECTANGULAR";
var FAM_OCTOGONAL = "SALIDA CAJA OCTOGONAL";
var FAM_HONDA = "SALIDA CAJA 10X10";

/* Códigos de caja cuadrada que se retiran al cambiar de tipo de caja */
var SWAP_METAL = ["418000033", "418000003"];
var SWAP_PVC = ["181000167", "181000030"];
/* Códigos que se quitan cuando la salida no lleva instalación */
var COD_N_INS = ["266000485", "604000046", "266000558", "210000058", "210000060",
                 "692000017", "266001635", "266001611", "720000039", "266000497"];

var MODOS_SALIDA = [
  { id: "completa", nombre: "Completa · incluye interruptor", fmo: 1 },
  { id: "interruptor", nombre: "Interruptor separado", fmo: 0.75 },
  { id: "iluminacion", nombre: "Iluminación separada", fmo: 0.35 },
  { id: "normal", nombre: "Sin ajuste", fmo: 1 }
];

function multEstrato(e) {
  var n = Number(e) || 2;
  if (n < 2) n = 2;
  if (n > 3) n = 3;              /* de 3 en adelante, el mismo multiplicador */
  return 1 + (n - 2) * 0.1;
}
function multCable(prom) {
  var n = Number(prom) || 0;
  if (n < 5) return 1.0;
  if (n <= 11) return 1.5;
  return 2.0;
}

function filasSalida(cat) { return (cat && cat.comp && cat.comp.salidas) || []; }

function opcionesSalida(cat) {
  var d = filasSalida(cat);
  var ap = {}, mat = {}, tub = {}, cal = {}, mc = {};
  d.forEach(function (r) {
    var f = txt(r["Familia"]);
    if (f && limpia(f) !== FAM_CUADRADA && limpia(f) !== FAM_OCTOGONAL && limpia(f) !== FAM_HONDA) ap[f] = true;
    var m = txt(r["Material"]); if (m) mat[m] = true;
    var t = txt(r["calibre tubo"]); if (t) tub[t] = true;
    var c = txt(r["calibre cable"]); if (c) cal[c] = true;
    var x = txt(r["Mat. Cable"]); if (x) mc[x] = true;
  });
  var ord = function (o) { return Object.keys(o).sort(function (a, b) { return a.localeCompare(b, "es"); }); };
  return { aparatos: ord(ap), materiales: ord(mat), tubos: ord(tub), calibres: ord(cal), matCable: ord(mc) };
}

function itemsFamilia(cat, familia, tubo, material) {
  var fam = limpia(familia);
  return filasSalida(cat).filter(function (r) {
    if (limpia(r["Familia"]) !== fam) return false;
    if (fam === FAM_CUADRADA) {
      if (tubo && txt(r["calibre tubo"]) !== txt(tubo)) return false;
      if (material && limpia(r["Material"]) !== limpia(material)) return false;
    } else if (fam === FAM_OCTOGONAL || fam === FAM_HONDA) {
      if (material && limpia(r["Material"]) !== limpia(material)) return false;
    }
    return true;
  }).map(function (r) {
    return {
      cant: aNum(r["incidencia"]), cod: codClave(r["codigo"]),
      desc: txt(r["descripcion"]), und: txt(r["unidad"])
    };
  });
}

/* Cambia la caja cuadrada por la octogonal o la 10x10 */
function cambiarCaja(base, variante, material) {
  var m = limpia(material);
  var quitar = (m === "IMC" || m === "EMT") ? SWAP_METAL
             : (m === "PVC" || m === "SCH40") ? SWAP_PVC : [];
  var salen = {};
  quitar.forEach(function (c) { salen[codClave(c)] = true; });
  var res = variante.slice();
  var yaHay = {};
  variante.forEach(function (l) { yaHay[l.cod] = true; });
  base.forEach(function (l) {
    if (salen[l.cod] || yaHay[l.cod]) return;
    res.push(l);
  });
  return res;
}

/* Compone una salida completa */
function componerSalida(cat, fila) {
  var avisos = [], lineas = [];
  var aparato = txt(fila.aparato);
  if (!aparato) return { lineas: [], avisos: [] };

  var modo = fila.modo || "normal";
  var infoModo = null;
  MODOS_SALIDA.forEach(function (m) { if (m.id === modo) infoModo = m; });
  var fmo = infoModo ? infoModo.fmo : 1;

  var mEstrato = multEstrato(fila.estrato);
  var prom = Number(fila.promedio) || 1;
  var mCable = multCable(prom);

  /* Las dos tuberías, cada una con su parte del recorrido */
  var tubos = [
    { mat: fila.mat1, cal: fila.tubo1, pct: Number(fila.pct1) },
    { mat: fila.mat2, cal: fila.tubo2, pct: Number(fila.pct2) }
  ].filter(function (t) { return t.mat && t.cal && t.pct > 0; });
  if (!tubos.length && fila.mat1 && fila.tubo1) tubos = [{ mat: fila.mat1, cal: fila.tubo1, pct: 100 }];

  var suma = tubos.reduce(function (t, x) { return t + x.pct; }, 0);
  if (tubos.length > 1 && Math.abs(suma - 100) > 0.5) {
    avisos.push("Las dos tuberías suman " + dec(suma) + "%, deberían dar 100");
  }

  tubos.forEach(function (t) {
    var parte = t.pct / 100;
    var base = itemsFamilia(cat, FAM_CUADRADA, t.cal, t.mat);
    if (!base.length) { avisos.push("No hay salida cuadrada en " + limpia(t.mat) + " " + txt(t.cal)); return; }

    var juego;
    var caja = fila.caja || "cuadrada";
    if (caja === "octogonal") {
      juego = cambiarCaja(base, itemsFamilia(cat, FAM_OCTOGONAL, t.cal, t.mat), t.mat);
    } else if (caja === "honda") {
      juego = cambiarCaja(base, itemsFamilia(cat, FAM_HONDA, t.cal, t.mat), t.mat);
    } else {
      juego = base.slice();
    }

    /* Modo completo: se suma la caja octogonal y tres adaptadores */
    if (modo === "completa") {
      itemsFamilia(cat, FAM_OCTOGONAL, t.cal, t.mat).forEach(function (l) {
        juego.push({ cant: l.cant, cod: l.cod, desc: l.desc, und: l.und });
      });
      var adap = null;
      juego.forEach(function (l) { if (!adap && limpia(l.desc).indexOf("ADAPTADOR") >= 0) adap = l; });
      if (adap) juego.push({ cant: 3, cod: adap.cod, desc: adap.desc, und: adap.und });
      else avisos.push("No se encontró adaptador en " + limpia(t.mat) + " " + txt(t.cal) + " para sumarle tres");
    }

    /* Iluminación: siempre al menos una caja octogonal, aunque no sea modo completo */
    if (modo === "iluminacion") {
      var yaOct = juego.some(function (l) { return limpia(l.desc).indexOf("OCTOGONAL") >= 0 || limpia(l.desc).indexOf("OCTAGONAL") >= 0; });
      if (!yaOct) {
        var oct = itemsFamilia(cat, FAM_OCTOGONAL, t.cal, t.mat);
        var caja = null;
        oct.forEach(function (l) { if (!caja && (limpia(l.desc).indexOf("OCTOGONAL") >= 0 || limpia(l.desc).indexOf("OCTAGONAL") >= 0 || limpia(l.desc).indexOf("CAJA") >= 0)) caja = l; });
        if (caja) juego.push({ cant: caja.cant || 1, cod: caja.cod, desc: caja.desc, und: caja.und });
        else avisos.push("No se encontró caja octogonal para la salida de iluminación");
      }
    }

    if (fila.sinInstalacion) {
      var fuera = {};
      COD_N_INS.forEach(function (c) { fuera[codClave(c)] = true; });
      juego = juego.filter(function (l) { return !fuera[l.cod]; });
    }

    juego.forEach(function (l) {
      var c = l.cant * parte;
      if (esManoObra(l.cod)) c *= mEstrato * fmo;
      else if (limpia(l.desc).indexOf("TUBO") >= 0) c *= prom;
      lineas.push({ cant: c, cod: l.cod, desc: l.desc, und: l.und });
    });
  });

  /* Los ítems propios del aparato */
  itemsFamilia(cat, aparato, null, null).forEach(function (l) {
    var c = l.cant;
    if (esManoObra(l.cod)) c *= mEstrato * fmo;
    lineas.push({ cant: c, cod: l.cod, desc: l.desc, und: l.und });
  });

  /* El cable */
  if (fila.calibreCable && fila.matCable) {
    var mult = Number(fila.multCable) || 1;
    var enc = filasSalida(cat).filter(function (r) {
      return txt(r["calibre cable"]) === txt(fila.calibreCable) &&
             limpia(r["Mat. Cable"]).indexOf(limpia(fila.matCable)) >= 0;
    });
    if (!enc.length) avisos.push("No hay cable " + txt(fila.calibreCable) + " " + txt(fila.matCable));
    enc.forEach(function (r) {
      var cod = codClave(r["codigo"]);
      var inc = aNum(r["incidencia"]);
      var c = esManoObra(cod) ? inc * mEstrato * mCable * fmo : inc * mult * prom;
      lineas.push({ cant: c, cod: cod, desc: txt(r["descripcion"]), und: txt(r["unidad"]) });
    });
  }

  return { lineas: lineas, avisos: avisos, fmo: fmo, mEstrato: mEstrato, mCable: mCable };
}

/* Compone todas las filas de un análisis */
function componerAnalisis(cat, datos, p, apu) {
  var lineas = [], avisos = [], reglas = [], creados = [];

  ((datos && datos.TU) || []).forEach(function (fila, i) {
    var r = componerTuberia(cat, fila);
    if (r.aviso) { avisos.push("Tubería " + (i + 1) + ": " + r.aviso); return; }
    if (r.aplica075) reglas.push("Se aplicó el factor 0,75 a la mano de obra por tubería " +
      limpia(fila.material) + " en " + limpia(fila.tipo).toLowerCase() + " con más de un metro.");
    lineas = lineas.concat(r.lineas);
  });

  ((datos && datos.EQ) || []).forEach(function (fila, i) {
    if (fila.crearItem && fila.codItem && txt(fila.nombreItem)) registrarPropio(p, fila);
    var r = componerEquipo(cat, fila, p, apu);
    if (r.aviso) { avisos.push("Equipo " + (i + 1) + ": " + r.aviso); return; }
    if (r.creado) creados.push(r.creado);
    lineas = lineas.concat(r.lineas);
  });

  ((datos && datos.SA) || []).forEach(function (fila, i) {
    var r = componerSalida(cat, fila);
    (r.avisos || []).forEach(function (a) { avisos.push("Salida " + (i + 1) + ": " + a); });
    if (r.fmo && r.fmo !== 1) reglas.push("Salida " + (i + 1) + ": la mano de obra va al " +
      Math.round(r.fmo * 100) + "% por venir separada.");
    lineas = lineas.concat(r.lineas);
  });

  ((datos && datos.CA) || []).forEach(function (fila, i) {
    var r = componerCableado(cat, fila);
    if (r.aviso) avisos.push("Acometida " + (i + 1) + ": " + r.aviso);
    lineas = lineas.concat(r.lineas);
  });

  ((datos && datos.TA) || []).forEach(function (fila, i) {
    var r = componerTablero(cat, fila);
    if (r.aviso) avisos.push("Tablero " + (i + 1) + ": " + r.aviso);
    lineas = lineas.concat(r.lineas);
  });

  ((datos && datos.mo) || []).forEach(function (fila, i) {
    var r = componerModulo(cat, fila);
    if (r.aviso) { avisos.push("Módulo " + (i + 1) + ": " + r.aviso); return; }
    lineas = lineas.concat(r.lineas);
  });

  /* Se suman las líneas repetidas del mismo código */
  var mapa = {}, orden = [];
  lineas.forEach(function (l) {
    if (mapa[l.cod]) { mapa[l.cod].cant += l.cant; return; }
    mapa[l.cod] = { cant: l.cant, cod: l.cod, desc: l.desc, und: l.und, f075: l.f075, propio: l.propio };
    orden.push(l.cod);
  });
  /* Ajustes manuales: cantidad cambiada o línea quitada en este análisis */
  var aj = (datos && datos.ajustes) || {};
  var finales = [];
  orden.forEach(function (c) {
    var l = mapa[c];
    var a = aj[c];
    if (a && a.quitado) return;
    if (a && a.cant !== undefined && a.cant !== null && a.cant !== "") {
      l.cantOrig = l.cant;
      l.cant = Number(a.cant) || 0;
      l.ajustada = true;
    }
    finales.push(l);
  });

  var quitadas = 0;
  Object.keys(aj).forEach(function (c) { if (aj[c] && aj[c].quitado && mapa[c]) quitadas++; });

  return {
    lineas: finales, avisos: avisos, reglas: reglas, creados: creados, quitadas: quitadas
  };
}

/* Precio de venta de un insumo: al costo se le monta la rentabilidad y,
   si es importado, el factor de dólar. Ambos sobre el precio de venta,
   igual que en la hoja de márgenes: costo / (1 - factor). */
/* Oferta vigente de un insumo: la que eligió el proyecto, o la marcada
   por defecto en el catálogo, o el precio suelto si no hay ofertas. */
function ofertaDe(it, p) {
  if (!it || !it.ofertas || !it.ofertas.length) return null;
  var sel = null;
  if (p && p.proveedores && p.proveedores[it.cod] !== undefined) sel = p.proveedores[it.cod];
  if (sel === null || sel === undefined || !it.ofertas[sel]) sel = (it.sel !== undefined ? it.sel : 0);
  return it.ofertas[sel] || it.ofertas[0];
}
function costoDe(it, p) {
  if (!it) return 0;
  var of = ofertaDe(it, p);
  if (of && Number(of.precio) > 0) return Number(of.precio);
  return Number(it.precio) || 0;
}

function precioAjustado(it, mg, p) {
  var base = costoDe(it, p);
  if (base <= 0) return 0;
  var rent = it.rent !== undefined && it.rent !== null ? Number(it.rent) : Number(mg.rent || 0);
  var dol = it.imp ? (it.dol !== undefined && it.dol !== null ? Number(it.dol) : Number(mg.dolar || 0)) : 0;
  var v = base;
  if (rent > 0 && rent < 100) v = v / (1 - rent / 100);
  if (dol > 0 && dol < 100) v = v / (1 - dol / 100);
  return v;
}

/* Le pone precio a cada línea y arma las tres secciones del análisis */
function valorizar(cat, lineas, margenes, p) {
  var idx = Catalogo.indice(cat);
  var mg = margenes || {};
  var mat = 0, mo = 0, sinPrecio = 0;

  var conPrecio = lineas.map(function (l) {
    var it = insumoDe(cat, l.cod, p);
    var base = costoDe(it, p);
    var precio = precioAjustado(it, mg, p);
    var desp = it && Number(it.desp) > 0 ? Number(it.desp) : 0;
    var cantDesp = l.cant * (1 + desp / 100);
    var total = cantDesp * precio;
    if (precio <= 0) sinPrecio++;
    var esMo = esManoObra(l.cod);
    if (esMo) mo += total; else mat += total;
    return {
      cant: l.cant, cantDesp: cantDesp, desp: desp,
      cod: l.cod, desc: l.desc || (it ? it.desc : ""),
      und: l.und || (it ? it.und : ""), base: base, precio: precio, total: total,
      falta: precio <= 0, mo: esMo, f075: l.f075, ajustada: l.ajustada, cantOrig: l.cantOrig,
      propio: l.propio, imp: it ? !!it.imp : false, enCatalogo: !!it,
      oferta: ofertaDe(it, p)
    };
  });

  var ov = (mg && mg.__ov) || {};
  var pctTrans = ov.transporte !== undefined && ov.transporte !== null && ov.transporte !== ""
    ? Number(ov.transporte) : (Number(mg.transporte) || 0);
  var pctHerr = ov.herramienta !== undefined && ov.herramienta !== null && ov.herramienta !== ""
    ? Number(ov.herramienta) : (Number(mg.herramienta) || 0);
  var transporte = mat * (pctTrans / 100);
  var herramienta = mat * (pctHerr / 100);
  var th = transporte + herramienta;
  var directo = mat + th + mo;

  return {
    lineas: conPrecio,
    mat: mat, transporte: transporte, herramienta: herramienta, th: th, mo: mo,
    directo: directo, unitario: directo, sinPrecio: sinPrecio,
    pctTrans: pctTrans, pctHerr: pctHerr, ovTrans: ov.transporte, ovHerr: ov.herramienta,
    matConTh: mat + th,
    pesoMo: directo > 0 ? Math.round((mo / directo) * 100) : 0
  };
}

/* Los márgenes del proyecto, con la excepción que tenga ese análisis */
function margenesDe(p, apu) {
  var mg = {};
  Object.keys(p.margenes || {}).forEach(function (k) { mg[k] = p.margenes[k]; });
  var d = (p.datosApu && p.datosApu[apu]) || {};
  mg.__ov = d.pct || {};
  return mg;
}

