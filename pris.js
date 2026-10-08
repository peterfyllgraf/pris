/* Prisoverslag for byggeri. Priser pr. 2026K2, inkl. moms, ekskl. grund. Vejledende. */
(function () {
  var CFG = Object.assign({ cta: "/kontakt", mount: "pris-app", top: 70 }, window.PRIS_CONFIG || {});

  /* ---------- DATA (ret her, når priserne opdateres) ---------- */
  var REF = { kvartal: "2026K2", indeks: 124.9, dato: "oktober 2026" };
  // Grundpris pr. m² uden køkken, bad, varmeanlæg og ventilation. [lav, mid, høj]
  var TYPER = {
    villa:      { navn: "Villa / nybyg",  pris: [12000, 14500, 21000], uforudsete: [0.05, 0.075, 0.10], kb: { koekken: 1, bad: 2 } },
    sommerhus:  { navn: "Sommerhus",      pris: [10000, 12500, 19000], uforudsete: [0.15, 0.175, 0.20], kb: { koekken: 1, bad: 1 } },
    anneks:     { navn: "Anneks",         pris: [7000, 11000, 17000],  uforudsete: [0.08, 0.10, 0.12],  kb: { koekken: 0, bad: 0 } },
    tilbygning: { navn: "Tilbygning",     pris: [15000, 20000, 28000], uforudsete: [0.10, 0.125, 0.15], kb: { koekken: 0, bad: 0 } }
  };
  // Komponenter: andel af byggesum og relative priser (r) pr. valg. s = skøn uden kilde.
  var KOMP = [
    { id: "fund", navn: "Fundering", andel: 0.08, hurtig: false, valg: [
      ["Punktfundament", 700, 1], ["Jordskruer", 900, 1], ["Randfundament", 1000], ["Støbt plade", 650] ] },
    { id: "kon", navn: "Konstruktion", andel: 0.15, hurtig: true, valg: [
      ["Rammekonstruktion / træskelet", 0.95], ["Stolpekonstruktion", 0.92], ["Teglblokke / letklinker", 1.12],
      ["Gasbeton / letbeton (bærende)", 1.02, 1], ["Massivtræ (KL-træ)", 1.25, 1] ] },
    { id: "fac", navn: "Facade", andel: 0.07, hurtig: true, valg: [
      ["Listebeklædning", 750], ["Træbeklædning", 1000], ["Puds", 600], ["Fibercement", 1900],
      ["Metal (stål / zink)", 1500, 1], ["Mursten", 2150] ] },
    { id: "iso", navn: "Isolering", andel: 0.04, hurtig: true, valg: [
      ["Mineraluld (fx Rockwool)", 1.0], ["Papiruld", 0.95], ["Træfiber", 1.25], ["Ålegræs", 1.9, 1], ["Halm", 1.4, 1], ["PIR / EPS", 1.2, 1] ] },
    { id: "tag", navn: "Tag", andel: 0.10, hurtig: true, valg: [
      ["Tagpap", 1000], ["Stål", 775], ["Tegl", 1800], ["Fibercement", 1300], ["Sedum", 1600, 1],
      ["Aluminium", 1700, 1], ["Zink", 2400, 1], ["Træ / spån", 1900, 1], ["Skifer", 2800, 1] ] },
    { id: "inv", navn: "Indervægge", andel: 0.05, hurtig: true, valg: [
      ["Gips", 1.0], ["Lerpuds", 1.5, 1], ["Birkefiner", 1.7, 1], ["Træpaneler", 1.35, 1], ["Malet beton", 1.1, 1], ["Fliser", 1.6, 1] ] },
    { id: "gul", navn: "Gulve", andel: 0.04, hurtig: false, valg: [
      ["Trægulv", 1150], ["Vinyl", 600, 1], ["Linoleum", 800, 1], ["Slebet beton", 900], ["Fliser", 1200, 1] ] }
  ];
  var KOEKKEN = [["Intet", 0], ["Basis", 70000], ["Mellem", 120000], ["Højt niveau", 200000]];
  var VARME = [["Luft/luft-varmepumpe (1–2 indedele)", 18000, 0, ["sommerhus", "anneks"]], ["Luft/vand-varmepumpe", 129000, 0, ["villa", "sommerhus"]], ["Jordvarme", 150000, 0, ["villa"]], ["Fjernvarme (installation og tilslutning)", 70000, 0, ["villa"]]];
  var BRAENDE = 55000; // brændeovn inkl. skorsten (skøn)
  // Etablering for sommerhus: [navn, [lav, mid, høj], skøn?]. std = antaget valg, når intet er valgt.
  var ETAB = [
    { id: "evand", navn: "Vand", std: 0, valg: [["Tilslutning til vandværk", [20000, 40000, 100000]], ["Privat boring inkl. filter", [150000, 190000, 230000], 1]] },
    { id: "espild", navn: "Spildevand", std: 1, valg: [["Tilslutning til offentlig kloak", [40000, 70000, 120000], 1], ["Nedsivningsanlæg", [25000, 50000, 75000]], ["Samletank", [20000, 35000, 50000], 1], ["Minirenseanlæg", [50000, 75000, 100000], 1]] }
  ];
  var LCA = ["LCA-beregning (klimaberegning)", [10000, 16000, 25000], 1];
  // Renovering: enhedspriser (mid), skønnet
  var RTAG = [["Tagpap", 2200], ["Stål / trapezplader", 1900], ["Betontagsten", 2600], ["Teglsten", 3200], ["Fibercement", 2800, 1], ["Skifer", 4300, 1]];
  var RILOFT = [["Loftsgulv (løst fyld eller batts)", 400], ["Skråvægge indefra (inkl. ny beklædning)", 1050, 1]];
  var RIYD = [["Udvendigt (med ny facade)", 1500], ["Indvendigt", 1200, 1]];
  var RP = { lk: 2300, tt: 8000, trappe: 60000, kvist: 65000, ovn: 16000, bv: 14000, igul: 550, vin: 6500 };
  var RUF = [0.12, 0.18, 0.25], RLOEN = 0.45;
  var TERRASSE = [["Træterrasse, fyr", 1000], ["Træterrasse, lærk", 1250], ["Træterrasse, hårdttræ", 1600, 1], ["Komposit", 1100], ["Fliser", 600]];
  var TIMEPRIS = 650, LOENANDEL = 0.38;
  // Biomkostninger: [navn, [lav, mid, høj], kun for typer, skøn?]
  var BI = [
    ["Arkitekt (skitse- og myndighedsprojekt)", [70000, 84000, 100000], ["villa", "sommerhus", "anneks", "tilbygning"], 0, { tilbygning: 71000, anneks: 71000, sommerhus: 84000, villa: 96000 }],
    ["Bygningskonstruktør (projektering og byggestyring)", [80000, 100000, 120000], ["villa", "sommerhus", "anneks", "tilbygning"], 1, "areal"],
    ["Landinspektør (afsætning af skel)", [6000, 11000, 16000], ["villa", "sommerhus", "anneks"], 0],
    ["Geoteknisk undersøgelse", [8000, 12000, 20000], ["villa", "sommerhus", "anneks", "tilbygning"], 1],
    ["Byggetilladelse (kommunens gebyr)", [1000, 7000, 23000], ["villa", "sommerhus", "anneks", "tilbygning"], 0],
    ["Byggesagkyndig (ca. 15 timer)", [12000, 14000, 15000], ["villa", "sommerhus", "tilbygning"], 1],
    ["Advokat (kontraktgennemgang)", [7000, 7500, 8000], ["villa", "sommerhus", "tilbygning"], 0],
    ["Tilslutning af vand og spildevand", [40000, 100000, 150000], ["villa"], 1],
    ["El-tilslutning (stik og måler)", [15000, 30000, 60000], ["sommerhus"], 1],
    ["Energimærkning", [7200, 8000, 8800], ["villa", "sommerhus"], 0]
  ];
  var BI_PCT = [
    ["Ingeniør", [0.01, 0.015, 0.025], ["villa", "sommerhus", "tilbygning"], 1],
    ["Byggeskadeforsikring", [0.01, 0.015, 0.03], ["villa"], 0]
  ];

  /* ---------- HJÆLPERE ---------- */
  var fmt = function (n) { return Math.round(n / 1000) * 1000; };
  var kr = function (n) { return fmt(n).toLocaleString("da-DK") + " kr."; };
  var num = function (v) { var x = parseFloat(String(v).replace(",", ".")); return isNaN(x) || x < 0 ? 0 : x; };
  var avg = function (a) { return a.reduce(function (s, x) { return s + x; }, 0) / a.length; };
  var el = function (t, c, h) { var e = document.createElement(t); if (c) e.className = c; if (h != null) e.innerHTML = h; return e; };
  var indeksFaktor = 1;

  /* ---------- BEREGNING ---------- */
  function beregn(s) {
    var T = TYPER[s.type], A = s.areal, ud = [], poster = [], skoen = 0, ukendt = 0;
    var stoerr = Math.min(1.3, Math.max(0.88, Math.pow(100 / Math.max(A, 20), 0.15)));
    var grund = T.pris[1] * A * stoerr * indeksFaktor;
    var kern = 0;
    KOMP.forEach(function (k) {
      var gns = avg(k.valg.map(function (v) { return v[1]; }));
      var idx = s[k.id], v = idx === "" || idx == null ? null : k.valg[idx];
      var m = v ? v[1] / gns : 1;
      var beloeb = grund * k.andel * m;
      if (v) { if (v[2]) skoen++; } else ukendt++;
      kern += beloeb;
      poster.push([k.navn + ": " + (v ? v[0] : "gennemsnit"), beloeb, !!v]);
    });
    var rest = grund * (1 - KOMP.reduce(function (a, k) { return a + k.andel; }, 0));
    kern += rest; poster.push(["Øvrigt (installationer, byggeplads, entreprenør m.m.)", rest, false]);
    // vinduer
    var standard = 0.15 * A, vin = s.vin > 0 ? s.vin : standard;
    var vinTil = grund * 0.08 * (vin / standard - 1);
    if (Math.abs(vinTil) > 1) { kern += vinTil; poster.push(["Vinduer: " + Math.round(vin) + " m² (standard er " + Math.round(standard) + " m²)", vinTil, true]); }
    if (s.glas > 0) { var g = s.glas * 9500 * indeksFaktor; kern += g; skoen++; poster.push(["Glaspartier / skydedøre, " + s.glas + " m²", g, true]); }
    // køkken, bad
    var kInd = s.koekken === "" ? T.kb.koekken ? 2 : 0 : +s.koekken;
    var kNavn = s.koekken === "" ? (kInd ? "Køkken (mellem, antaget)" : "") : "";
    if (kInd) { var kp = KOEKKEN[kInd][1] * indeksFaktor; kern += kp; poster.push([kNavn || "Køkken: " + KOEKKEN[kInd][0], kp, s.koekken !== ""]); }
    var nb = s.bad === "" ? T.kb.bad : +s.bad;
    if (nb) { var bp = nb * 160000 * indeksFaktor; kern += bp; poster.push(["Badeværelse × " + nb + (s.bad === "" ? " (antaget)" : ""), bp, s.bad !== ""]); }
    // varme og ventilation
    var vi = s.varme, vp = null;
    if (vi !== "" ) { vp = VARME[vi][1] * indeksFaktor; poster.push(["Varme: " + VARME[vi][0], vp, true]); }
    else if (s.type === "villa" || s.type === "sommerhus") { var vv = VARME.filter(function (x) { return x[3].indexOf(s.type) >= 0; }); vp = avg(vv.map(function (x) { return x[1]; })) * indeksFaktor; poster.push([s.type === "villa" ? "Varme: gennemsnit af varmepumpe, jordvarme og fjernvarme" : "Varme: gennemsnit af luft/luft- og luft/vand-varmepumpe", vp, false]); ukendt++; }
    if (vp) kern += vp;
    if (s.braende) { var bo = BRAENDE * indeksFaktor; kern += bo; skoen++; poster.push(["Brændeovn inkl. skorsten", bo, true]); }
    if (s.gulvvarme) { var gv = 400 * A * indeksFaktor; kern += gv; poster.push(["Gulvvarme", gv, true]); }
    if (s.vent === "ja" || (s.vent === "" && (s.type === "villa" || s.type === "sommerhus"))) { var vt = 78000 * indeksFaktor; kern += vt; poster.push(["Ventilation med varmegenvinding" + (s.vent === "" ? " (antaget)" : ""), vt, s.vent !== ""]); }
    if (s.solkwp > 0) { var sc = s.solkwp * 17000 * indeksFaktor; kern += sc; poster.push(["Solceller, " + s.solkwp + " kWp", sc, true]); }
    // terrasse
    if (s.terr !== "" && s.terrm2 > 0) {
      var t = TERRASSE[s.terr]; if (t[2]) skoen++;
      var tp = t[1] * s.terrm2 * indeksFaktor + (s.overdaek ? 1000 * s.terrm2 * indeksFaktor : 0);
      kern += tp; poster.push(["Terrasse: " + t[0] + ", " + s.terrm2 + " m²" + (s.overdaek ? " med overdækning" : ""), tp, true]);
    }
    var uf = (T.uforudsete[1]) * kern;
    // usikkerhed
    var w = Math.min(0.32, 0.18 + 0.015 * ukendt + 0.025 * skoen + (s.type === "tilbygning" ? 0.04 : 0));
    var lo = kern * (1 - w), hi = kern * (1 + w);
    // biomkostninger
    var bi = [], bLo = 0, bMid = 0, bHi = 0;
    BI.forEach(function (b) { if (b[2].indexOf(s.type) < 0) return; var f = 1, m; if (b[4] === "areal") f = Math.max(0.4, Math.min(1, 0.4 + 0.6 * (A - 40) / 60)); m = (b[4] && b[4][s.type]) || b[1][1] * f; bi.push([b[0], m, b[3]]); bLo += b[1][0] * f; bMid += m; bHi += b[1][2] * f; });
    if (s.type === "sommerhus") ETAB.forEach(function (e) { var i = s[e.id] === "" || s[e.id] == null ? e.std : +s[e.id], o = e.valg[i], gaet = s[e.id] === "" || s[e.id] == null; bi.push([e.navn + ": " + o[0] + (gaet ? " (antaget)" : ""), o[1][1], o[2] || gaet]); bLo += o[1][0]; bMid += o[1][1]; bHi += o[1][2]; });
    if (s.type === "villa" || s.type === "sommerhus" || s.lca) { bi.push([LCA[0], LCA[1][1], LCA[2]]); bLo += LCA[1][0]; bMid += LCA[1][1]; bHi += LCA[1][2]; }
    BI_PCT.forEach(function (b) { if (b[2].indexOf(s.type) < 0) return; bi.push([b[0], kern * b[1][1], b[3]]); bLo += kern * b[1][0]; bMid += kern * b[1][1]; bHi += kern * b[1][2]; });
    var uLo = lo * T.uforudsete[0], uHi = hi * T.uforudsete[2];
    var total = [lo + bLo + uLo, kern + bMid + uf, hi + bHi + uHi];
    var timer = LOENANDEL * kern / TIMEPRIS;
    return { poster: poster, kern: kern, bi: bi, uf: uf, ufp: T.uforudsete[1], total: total, w: w, timer: [timer * (1 - w), timer * (1 + w)], skoen: skoen, ukendt: ukendt };
  }

  function beregnReno(s) {
    var F = indeksFaktor, poster = [], kern = 0, skoen = 0, strukt = false;
    function add(navn, bel, sk) { kern += bel; poster.push([navn, bel, true]); if (sk) skoen++; }
    if (s.rlk > 0) { add("Loft til kip, " + s.rlk + " m² (ombygning af spær, isolering, nye lofter)", s.rlk * RP.lk * F, 1); strukt = true; }
    if (s.rtt > 0) { add("Inddragelse af tagetage til beboelse, " + s.rtt + " m²", s.rtt * RP.tt * F, 1); if (s.rtrappe) add("Ny trappe til tagetagen", RP.trappe * F, 1); strukt = true; }
    if (s.rkv > 0) { add("Kvist, " + s.rkv + " m bred", s.rkv * RP.kvist * F, 1); strukt = true; }
    if (s.rovn > 0) add("Ovenlysvinduer × " + s.rovn + " (monteret i eksisterende tag)", s.rovn * RP.ovn * F, 1);
    if (s.rtagm2 > 0) {
      var tv = s.rtagtype === "" ? null : RTAG[s.rtagtype], tp = tv ? tv[1] : avg(RTAG.map(function (x) { return x[1]; }));
      add("Nyt tag med ny tagkonstruktion, " + s.rtagm2 + " m² tagflade" + (tv ? ": " + tv[0] : " (gennemsnit af tagtyper)"), s.rtagm2 * tp * F, 1); strukt = true;
    }
    if (s.rbv > 0) { add("Fjernelse af bærende væg, " + s.rbv + " m (inkl. ny bjælke og afstivning)", s.rbv * RP.bv * F, 1); strukt = true; }
    if (s.rvin > 0) add("Udskiftning af vinduer, " + s.rvin + " m²", s.rvin * RP.vin * F, 1);
    var P = s.iplan;
    if (P > 0) {
      if (s.iloft) { var lt = s.iloftt === "" ? null : RILOFT[s.iloftt], lp = lt ? lt[1] : avg(RILOFT.map(function (x) { return x[1]; })), la = lt && s.iloftt == 1 ? P * 1.25 : P; add("Efterisolering af loft/tag" + (lt ? ": " + lt[0] : " (gennemsnit)") + ", " + Math.round(la) + " m²", la * lp * F, 1); }
      if (s.iyd) { var yt = s.iydt === "" ? null : RIYD[s.iydt], yp = yt ? yt[1] : avg(RIYD.map(function (x) { return x[1]; })), ya = 8.2 * Math.sqrt(P); add("Efterisolering af ydervægge" + (yt ? ": " + yt[0] : " (gennemsnit)") + ", ca. " + Math.round(ya) + " m²", ya * yp * F, 1); }
      if (s.igul) add("Efterisolering af gulv (fra krybekælder), " + Math.round(P) + " m²", P * RP.igul * F, 1);
    }
    if (s.rkoek !== "" && +s.rkoek > 0) add("Køkken: " + KOEKKEN[+s.rkoek][0], KOEKKEN[+s.rkoek][1] * F, 0);
    if (s.rbad > 0) add("Badeværelse × " + s.rbad, s.rbad * 160000 * F, 0);
    if (s.rvarme !== "") add("Varme: " + VARME[+s.rvarme][0], VARME[+s.rvarme][1] * F, 0);
    if (!poster.length) return { tomt: true, poster: [], bi: [], total: [0, 0, 0], w: 0, timer: [0, 0], kern: 0, uf: 0, ufp: 0 };
    var w = Math.min(0.4, 0.25 + 0.03 * skoen), lo = kern * (1 - w), hi = kern * (1 + w), bi = [], bLo = 0, bMid = 0, bHi = 0;
    function fee(n, r, m, sk) { bi.push([n, m, sk]); bLo += r[0]; bMid += m; bHi += r[1]; }
    if (strukt) {
      fee("Arkitekt (skitse- og myndighedsprojekt)", [70000, 100000], 71000, 0);
      fee("Bygningskonstruktør (projektering og byggestyring)", [30000, 60000], 40000, 1);
      fee("Ingeniør (statik og bjælkeberegning)", [8000, 25000], 15000, 1);
      fee("Byggetilladelse (kommunens gebyr)", [1000, 23000], 7000, 0);
    }
    var uf = RUF[1] * kern, total = [lo + bLo + lo * RUF[0], kern + bMid + uf, hi + bHi + hi * RUF[2]], timer = RLOEN * kern / TIMEPRIS;
    return { poster: poster, kern: kern, bi: bi, uf: uf, ufp: RUF[1], total: total, w: w, timer: [timer * (1 - w), timer * (1 + w)], strukt: strukt, skoen: skoen, ukendt: 0 };
  }

  /* ---------- UI ---------- */
  var CSS = ".pa{--a:#1a1b1f;--g:#6b6e75;--l:#e3e3e5;--top:70px;width:100%;max-width:1000px;margin:0 auto;font-family:inherit;color:#1a1b1f;font-size:13px;line-height:20px;box-sizing:border-box}.pa *{box-sizing:border-box;font-family:inherit}.pa h3{margin:0 0 8px;font-size:18px;line-height:22px;font-weight:700}.pa .t{color:var(--a);margin:0 0 28px;max-width:560px}.pa .g{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:48px;align-items:start}.pa .k{padding:22px 0 14px;border-top:1px solid #1a1b1f}.pa .k h4{margin:0 0 6px;font-size:14px;line-height:20px;font-weight:700!important}.pa label{display:block;font-weight:400;font-size:11px;line-height:16px;letter-spacing:.02em;margin:16px 0 6px}.pa label small{display:block;color:var(--g);font-size:11px}.pa input,.pa select{width:100%;height:48px;padding:0 16px;border:1px solid #d6d6d9;border-radius:0;font-size:12px;background:#fff;color:inherit;-webkit-appearance:none;appearance:none;margin:0}.pa select{background-image:linear-gradient(45deg,transparent 50%,#1a1b1f 50%),linear-gradient(135deg,#1a1b1f 50%,transparent 50%);background-position:calc(100% - 20px) 50%,calc(100% - 15px) 50%;background-size:5px 5px;background-repeat:no-repeat;padding-right:36px}.pa input::placeholder{color:#a4a6ab}.pa input:focus,.pa select:focus{border-color:#1a1b1f;outline:0}.pa input[type=range]{height:28px;padding:0;accent-color:#1a1b1f;border:0;margin-top:10px;-webkit-appearance:auto;appearance:auto;background:none}.pa input[type=checkbox]{width:18px;height:18px;margin:0 10px 0 0;accent-color:#1a1b1f;-webkit-appearance:auto;appearance:auto}.pa .cb{display:flex;align-items:center;font-size:12px;letter-spacing:0;margin-top:16px;min-height:44px}.pa .sw{display:flex;margin-bottom:24px}.pa .sw button{flex:1;min-height:48px;border:1px solid #1a1b1f;background:#fff;color:#1a1b1f;border-radius:0;font-weight:700!important;cursor:pointer;font-size:12px}.pa .sw button+button{border-left:0}.pa .sw button.on{background:#1a1b1f;color:#fff}.pa .ty{display:grid;grid-template-columns:1fr 1fr;gap:8px}.pa .ty button{min-height:48px;border:1px solid #d6d6d9;background:#fff;border-radius:0;cursor:pointer;font-size:12px;color:inherit}.pa .ty button.on{border-color:#1a1b1f;background:#1a1b1f;color:#fff}.pa .r{position:sticky;top:var(--top);background:#fff;border:1px solid var(--l);padding:32px;scroll-margin-top:var(--top)}.pa .big{font-size:24px;line-height:30px;font-weight:700}.pa .m{color:var(--g);font-size:12px}.pa table{width:100%;border-collapse:collapse;margin:10px 0}.pa td{padding:6px 0;border-bottom:1px solid var(--l);vertical-align:top;font-size:12px}.pa td:last-child{text-align:right;white-space:nowrap;padding-left:12px}.pa .gn td:first-child{color:var(--g)}.pa h5{margin:22px 0 2px;font-size:13px;font-weight:700}.pa .cta{display:block;width:100%;margin:22px 0 0;padding:16px 20px;background:#1a1b1f;color:#fff;text-align:center;text-decoration:none;font-weight:700;font-size:12px;letter-spacing:.06em;border:1px solid #1a1b1f}.pa .cta:hover{background:#fff;color:#1a1b1f}.pa .bt{display:inline-block;margin:10px 0 0;padding:9px 15px;background:#fff;color:#1a1b1f;border:1px solid #1a1b1f;border-radius:0;font-weight:700;font-size:12px;cursor:pointer}.pa .bt:hover{background:#1a1b1f;color:#fff}.pa .d{margin-top:28px;font-size:11px;line-height:16px;color:var(--g);max-width:720px}.pa .mini{display:none}.pa :focus-visible{outline:2px solid #1a1b1f;outline-offset:2px}@media(max-width:991px){.pa .g{grid-template-columns:minmax(0,1fr);gap:28px}.pa .r{position:static;padding:22px}.pa .mini{display:flex;justify-content:space-between;align-items:center;gap:12px;position:sticky;top:var(--top);z-index:5;background:#1a1b1f;color:#fff;padding:12px 16px;margin:0 -2px 18px}.pa .mini b{font-size:15px;font-weight:700!important}.pa .mini a{color:#fff;font-size:12px;white-space:nowrap}}@media(max-width:767px){.pa{padding-left:24px;padding-right:24px}.pa .mini{margin:0 -24px 18px;padding:12px 24px}.pa input,.pa select{font-size:16px}.pa .big{font-size:21px;line-height:27px}.pa td{font-size:12px}}";
  var S = { type: "villa", areal: 140, vin: "", glas: 0, koekken: "", bad: "", varme: "", vent: "", gulvvarme: false, solkwp: 0, terr: "", terrm2: 0, overdaek: false, detalje: false, mode: "hurtig", braende: false, lca: false, evand: "", espild: "", rlk: 0, rtt: 0, rtrappe: false, rkv: 0, rovn: 0, rtagm2: 0, rtagtype: "", rbv: 0, rvin: 0, iplan: 0, iloft: false, iloftt: "", iyd: false, iydt: "", igul: false, rkoek: "", rbad: 0, rvarme: "" };
  KOMP.forEach(function (k) { S[k.id] = ""; });
  var root, out, mini;

  function sel(label, key, opts, hint, tom) {
    var w = el("div"), l = el("label", null, label + (hint ? "<small>" + hint + "</small>" : ""));
    var s = el("select"); s.setAttribute("aria-label", label);
    s.appendChild(new Option(tom || "Ikke valgt (gennemsnit)", ""));
    opts.forEach(function (o, i) { s.appendChild(new Option(o[0] + (o[2] ? " *" : ""), i)); });
    s.value = S[key]; s.onchange = function () { S[key] = s.value; update(); };
    w.appendChild(l); w.appendChild(s); return w;
  }
  function inp(label, key, hint, ph) {
    var w = el("div"), l = el("label", null, label + (hint ? "<small>" + hint + "</small>" : ""));
    var i = el("input"); i.inputMode = "decimal"; i.placeholder = ph || ""; i.setAttribute("aria-label", label);
    i.value = S[key] || ""; i.oninput = function () { S[key] = (i.value.trim() === "" && (key === "bad" || key === "vin")) ? "" : num(i.value); update(); };
    w.appendChild(l); w.appendChild(i); return w;
  }
  function chk(label, key) {
    var l = el("label", "cb"), c = el("input"); c.type = "checkbox"; c.checked = S[key];
    c.onchange = function () { S[key] = c.checked; update(); }; l.appendChild(c); l.appendChild(document.createTextNode(label)); return l;
  }
  function bygReno(left) {
    var a = el("div", "k"); a.appendChild(el("h4", null, "Tag og loft"));
    a.appendChild(inp("Loft til kip (m²)", "rlk", "Loftareal, der får rejsning til kip, fx fra gitterspær med fladt loft", "fx 80"));
    a.appendChild(inp("Inddragelse af tagetage til beboelse (m²)", "rtt", "Gulvareal, der bliver til beboelse", "fx 50")); a.appendChild(chk("Med ny trappe til tagetagen", "rtrappe"));
    a.appendChild(inp("Kvist (løbende meter bredde)", "rkv", "", "fx 3"));
    a.appendChild(inp("Ovenlysvinduer (antal)", "rovn", "I eksisterende tag", "fx 4"));
    a.appendChild(inp("Nyt tag med ny tagkonstruktion (m² tagflade)", "rtagm2", "Tagfladen er ca. 1,2 × husets grundplan", "fx 120"));
    a.appendChild(sel("Tagbeklædning", "rtagtype", RTAG)); left.appendChild(a);
    var b = el("div", "k"); b.appendChild(el("h4", null, "Vægge og vinduer"));
    b.appendChild(inp("Fjernelse af bærende vægge (løbende meter)", "rbv", "Inkl. ny bjælke i stedet for væg", "fx 5"));
    b.appendChild(inp("Udskiftning af vinduer (m² vindue)", "rvin", "", "fx 12")); left.appendChild(b);
    var c = el("div", "k"); c.appendChild(el("h4", null, "Efterisolering"));
    c.appendChild(inp("Husets grundplan (m²)", "iplan", "Bruges til at regne loft, væg og gulv ud", "fx 80"));
    c.appendChild(chk("Loft / tag", "iloft")); c.appendChild(sel("Type", "iloftt", RILOFT));
    c.appendChild(chk("Ydervægge", "iyd")); c.appendChild(sel("Type", "iydt", RIYD));
    c.appendChild(chk("Gulv (fra krybekælder)", "igul")); left.appendChild(c);
    var d = el("div", "k"); d.appendChild(el("h4", null, "Køkken, bad og varme"));
    d.appendChild(sel("Nyt køkken", "rkoek", KOEKKEN, "", "Intet køkken"));
    d.appendChild(inp("Nye badeværelser (antal)", "rbad", "", "fx 1"));
    d.appendChild(sel("Ny varmekilde", "rvarme", VARME, "", "Ingen ændring")); left.appendChild(d);
  }
  function byg() {
    root.innerHTML = "";
    var g = el("div", "g"), left = el("div"), right = el("div", "r");
    var h = el("div"); 
    root.appendChild(h);
    var sw = el("div", "sw");
    [["Hurtigt overslag", "hurtig"], ["Detaljeret", "detalje"], ["Renovering", "reno"]].forEach(function (x) {
      var b = el("button", S.mode === x[1] ? "on" : "", x[0]); b.type = "button"; b.onclick = function () { S.mode = x[1]; S.detalje = x[1] === "detalje"; byg(); update(); }; sw.appendChild(b);
    });
    mini = el("div", "mini"); left.appendChild(mini);
    left.appendChild(sw);
    if (S.mode === "reno") { bygReno(left); } else {
    var k1 = el("div", "k"); k1.appendChild(el("h4", null, "Hvad skal bygges?"));
    var ty = el("div", "ty");
    Object.keys(TYPER).forEach(function (t) { var b = el("button", S.type === t ? "on" : "", TYPER[t].navn); b.type = "button"; b.onclick = function () { S.type = t; byg(); update(); }; ty.appendChild(b); });
    k1.appendChild(ty); k1.appendChild(inp("Areal (m²)", "areal", "Etageareal i alt", "fx 140"));
    var r = el("input"); r.type = "range"; r.min = 20; r.max = 400; r.value = S.areal; r.setAttribute("aria-label", "Areal"); r.oninput = function () { S.areal = +r.value; k1.querySelector("input[inputmode]").value = r.value; update(); };
    k1.appendChild(r);
    if (S.type === "tilbygning" || S.type === "anneks") k1.appendChild(chk("Medregn LCA-beregning (krav ved nybyg og sommerhuse, tilbygninger kun over 250 m²)", "lca"));
    left.appendChild(k1);
    var k2 = el("div", "k"); k2.appendChild(el("h4", null, "Huset"));
    KOMP.forEach(function (k) { if (k.hurtig || S.detalje) k2.appendChild(sel(k.navn, k.id, k.valg)); });
    left.appendChild(k2);
    if (S.detalje) {
      var k3 = el("div", "k"); k3.appendChild(el("h4", null, "Vinduer, køkken og bad"));
      k3.appendChild(inp("Vinduer i alt (m²)", "vin", "Tom = ca. 15 % af arealet", ""));
      k3.appendChild(inp("Glaspartier og skydedøre (m²)", "glas", "Oven i vinduerne", "fx 6"));
      k3.appendChild(sel("Køkken", "koekken", KOEKKEN, "", "Standard for typen"));
      k3.appendChild(inp("Antal badeværelser", "bad", "Tom = standard for typen", ""));
      left.appendChild(k3);
      var k4 = el("div", "k"); k4.appendChild(el("h4", null, "Varme og energi"));
      k4.appendChild(sel("Varmekilde", "varme", VARME));
      k4.appendChild(chk("Gulvvarme", "gulvvarme"));
      k4.appendChild(chk("Brændeovn med skorsten", "braende"));
      k4.appendChild(sel("Ventilation med varmegenvinding", "vent", [["Ja", "ja"], ["Nej", "nej"]], "", "Standard for typen"));
      var vs = k4.querySelectorAll("select"), vsv = vs[vs.length - 1]; vsv.innerHTML = ""; vsv.appendChild(new Option("Standard for typen", "")); vsv.appendChild(new Option("Ja", "ja")); vsv.appendChild(new Option("Nej", "nej")); vsv.value = S.vent; vsv.onchange = function () { S.vent = vsv.value; update(); };
      k4.appendChild(inp("Solceller (kWp)", "solkwp", "Tom = ingen", "fx 6"));
      left.appendChild(k4);
      var k5 = el("div", "k"); k5.appendChild(el("h4", null, "Terrasse"));
      k5.appendChild(sel("Materiale", "terr", TERRASSE, "", "Ingen terrasse"));
      k5.appendChild(inp("Størrelse (m²)", "terrm2", "", "fx 30")); k5.appendChild(chk("Med overdækning", "overdaek"));
      left.appendChild(k5);
      if (S.type === "sommerhus") {
        var k6 = el("div", "k"); k6.appendChild(el("h4", null, "Etablering af sommerhus"));
        ETAB.forEach(function (e) { k6.appendChild(sel(e.navn, e.id, e.valg.map(function (o) { return [o[0], 0, o[2]]; }), "", "Ikke valgt (antager " + e.valg[e.std][0].toLowerCase() + ")")); });
        left.appendChild(k6);
      }
    }
    }
    g.appendChild(left); out = right; g.appendChild(right); root.appendChild(g);
    var d = el("p", "d", "* Skøn uden fast kilde, som gør spændet bredere. Priser pr. " + REF.kvartal + " inkl. moms, ekskl. grund, og reguleres efter Danmarks Statistiks byggeomkostningsindeks, når den kan hentes. Kilder: bl.a. Bolius, Molio, Danmarks Statistik og branchens prisguider. Overslaget er vejledende og afløser ikke tilbud fra entreprenører. Det er ikke et tilbud.");
    root.appendChild(d);
  }
  function update() {
    var reno = S.mode === "reno", R = reno ? beregnReno(S) : beregn(S), rows = "", bi = "";
    if (R.tomt) { out.innerHTML = "<div class='big'>Vælg et indgreb</div><div class='m' style='margin-top:8px'>Skriv fx antal m² loft til kip, meter bærende væg eller antal ovenlysvinduer, så regner jeg et overslag ud.</div>"; mini.innerHTML = "<b>Vælg et indgreb</b><a href='#pris-resultat'>↓</a>"; out.id = "pris-resultat"; return; }
    R.poster.forEach(function (p) { rows += "<tr class='" + (p[2] ? "" : "gn") + "'><td>" + p[0] + "</td><td>" + kr(p[1]) + "</td></tr>"; });
    R.bi.forEach(function (b) { bi += "<tr><td>" + b[0] + (b[2] ? " *" : "") + "</td><td>" + kr(b[1]) + "</td></tr>"; });
    var tekst = (reno ? "Renovering" : TYPER[S.type].navn + ", " + S.areal + " m²") + ": ca. " + kr(R.total[0]) + " til " + kr(R.total[2]);
    out.innerHTML = "<div class='m'>Samlet overslag</div><div class='big'>" + kr(R.total[0]) + " – " + kr(R.total[2]) + "</div><div class='m'>Midt i spændet: " + kr(R.total[1]) + " (ca. ±" + Math.round(R.w * 100) + " %). Medregner byggeri, biomkostninger og uforudsete udgifter.</div>" +
      "<div class='m' style='margin-top:6px'>Håndværkertimer: ca. " + Math.round(R.timer[0] / 100) * 100 + "–" + Math.round(R.timer[1] / 100) * 100 + " timer.</div>" +
      "<h5>Byggeriet</h5><table>" + rows + "<tr><td><b>Byggesum (midt)</b></td><td><b>" + kr(R.kern) + "</b></td></tr></table>" +
      "<h5>Rådgivere, gebyrer og tilslutninger</h5><table>" + bi + "<tr><td>Uforudsete udgifter (" + Math.round(R.ufp * 1000) / 10 + " %)</td><td>" + kr(R.uf) + "</td></tr></table>" +
      "<div class='m'>Grå linjer er gennemsnit eller antagelser, fordi du ikke har valgt. " + (reno ? "Renovering afhænger af, hvad der gemmer sig i den gamle konstruktion, så spændet er bredere. Ikke med: stillads, flytning af installationer og uforudsete forhold i bygningen." : "Ikke med: grund, indretning og have" + (S.type === "sommerhus" ? "." : ", el-tilslutning.")) + "</div>" +
      "<a class='cta' href='" + CFG.cta + "?type=" + (reno ? "renovering" : S.type + "&areal=" + S.areal) + "&overslag=" + Math.round(R.total[1]) + "'>Få en arkitekts vurdering →</a><button class='bt' type='button' id='kop'>Kopier overslag</button>";
    mini.innerHTML = "<b>" + kr(R.total[0]) + " – " + kr(R.total[2]) + "</b><a href='#pris-resultat'>Se overslag ↓</a>";
    out.id = "pris-resultat";
    out.querySelector("#kop").onclick = function () {
      var t = tekst + "\n" + R.poster.map(function (p) { return "- " + p[0] + ": " + kr(p[1]); }).join("\n") + "\nVejledende overslag, ikke et tilbud.";
      if (navigator.clipboard) navigator.clipboard.writeText(t); this.textContent = "Kopieret";
    };
  }
  function indeks() {
    try {
      var u = "https://api.statbank.dk/v1/data/BYG43/CSV?lang=da&HINDEKS=02&DINDEKS=10000&ART=1002&TAL=100&Tid=*";
      fetch(u).then(function (r) { return r.text(); }).then(function (t) {
        var rows = t.trim().split("\n"), last = rows[rows.length - 1].split(";"), v = parseFloat(String(last[last.length - 1]).replace(",", "."));
        if (v > 80 && v < 300) { indeksFaktor = v / REF.indeks; update(); }
      }).catch(function () {});
    } catch (e) {}
  }
  function init() {
    root = document.getElementById(CFG.mount); if (!root) return;
    root.className = "pa"; root.style.setProperty("--top", CFG.top + "px"); var st = el("style", null, CSS); document.head.appendChild(st);
    byg(); update(); indeks();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
  window.PRIS_DATA = { TYPER: TYPER, KOMP: KOMP, KOEKKEN: KOEKKEN, VARME: VARME, TERRASSE: TERRASSE, BI: BI, BI_PCT: BI_PCT, REF: REF, RTAG: RTAG, RILOFT: RILOFT, RIYD: RIYD, RP: RP, ETAB: ETAB, LCA: LCA, BRAENDE: BRAENDE };
  window.PRIS_BEREGN = function (s) { var x = Object.assign({}, S, s); return x.mode === "reno" ? beregnReno(x) : beregn(x); };
})();
