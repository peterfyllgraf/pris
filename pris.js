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
  var VARME = [["Luft/vand-varmepumpe", 129000], ["Jordvarme", 150000], ["Fjernvarme (installation og tilslutning)", 70000]];
  var TERRASSE = [["Træterrasse, fyr", 1000], ["Træterrasse, lærk", 1250], ["Træterrasse, hårdttræ", 1600, 1], ["Komposit", 1100], ["Fliser", 600]];
  var TIMEPRIS = 650, LOENANDEL = 0.38;
  // Biomkostninger: [navn, [lav, mid, høj], kun for typer, skøn?]
  var BI = [
    ["Landinspektør (afsætning af skel)", [6000, 11000, 16000], ["villa", "sommerhus", "anneks"], 0],
    ["Geoteknisk undersøgelse", [8000, 12000, 20000], ["villa", "sommerhus", "anneks", "tilbygning"], 1],
    ["Byggetilladelse (kommunens gebyr)", [1000, 7000, 23000], ["villa", "sommerhus", "anneks", "tilbygning"], 0],
    ["Byggesagkyndig (ca. 15 timer)", [12000, 14000, 15000], ["villa", "sommerhus", "tilbygning"], 1],
    ["Advokat (kontraktgennemgang)", [7000, 7500, 8000], ["villa", "sommerhus", "tilbygning"], 0],
    ["Tilslutning af vand og spildevand", [40000, 100000, 150000], ["villa", "sommerhus"], 1],
    ["Energimærkning", [7200, 8000, 8800], ["villa", "sommerhus"], 0]
  ];
  var BI_PCT = [
    ["Arkitekt (projektering og byggestyring)", [0.05, 0.08, 0.10], ["villa", "sommerhus", "anneks", "tilbygning"], 0],
    ["Ingeniør / konstruktør", [0.01, 0.015, 0.025], ["villa", "sommerhus", "tilbygning"], 1],
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
    else if (s.type === "villa" || s.type === "sommerhus") { vp = avg(VARME.map(function (x) { return x[1]; })) * indeksFaktor; poster.push(["Varme: gennemsnit af varmepumpe, jordvarme og fjernvarme", vp, false]); ukendt++; }
    if (vp) kern += vp;
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
    BI.forEach(function (b) { if (b[2].indexOf(s.type) < 0) return; bi.push([b[0], b[1][1], b[3]]); bLo += b[1][0]; bMid += b[1][1]; bHi += b[1][2]; });
    BI_PCT.forEach(function (b) { if (b[2].indexOf(s.type) < 0) return; bi.push([b[0], kern * b[1][1], b[3]]); bLo += kern * b[1][0]; bMid += kern * b[1][1]; bHi += kern * b[1][2]; });
    var uLo = lo * T.uforudsete[0], uHi = hi * T.uforudsete[2];
    var total = [lo + bLo + uLo, kern + bMid + uf, hi + bHi + uHi];
    var timer = LOENANDEL * kern / TIMEPRIS;
    return { poster: poster, kern: kern, bi: bi, uf: uf, ufp: T.uforudsete[1], total: total, w: w, timer: [timer * (1 - w), timer * (1 + w)], skoen: skoen, ukendt: ukendt };
  }

  /* ---------- UI ---------- */
  var CSS = ".pa{--a:#1a1b1f;--g:#6b6e75;--l:#e3e3e5;--top:70px;width:100%;max-width:1000px;margin:0 auto;font-family:inherit;color:#1a1b1f;font-size:13px;line-height:20px;box-sizing:border-box}.pa *{box-sizing:border-box;font-family:inherit}.pa h3{margin:0 0 8px;font-size:18px;line-height:22px;font-weight:700}.pa .t{color:var(--a);margin:0 0 28px;max-width:560px}.pa .g{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:48px;align-items:start}.pa .k{padding:22px 0 14px;border-top:1px solid #1a1b1f}.pa .k h4{margin:0 0 6px;font-size:14px;line-height:20px;font-weight:700}.pa label{display:block;font-weight:400;font-size:11px;line-height:16px;letter-spacing:.02em;margin:16px 0 6px}.pa label small{display:block;color:var(--g);font-size:11px}.pa input,.pa select{width:100%;height:48px;padding:0 16px;border:1px solid #d6d6d9;border-radius:0;font-size:12px;background:#fff;color:inherit;-webkit-appearance:none;appearance:none;margin:0}.pa select{background-image:linear-gradient(45deg,transparent 50%,#1a1b1f 50%),linear-gradient(135deg,#1a1b1f 50%,transparent 50%);background-position:calc(100% - 20px) 50%,calc(100% - 15px) 50%;background-size:5px 5px;background-repeat:no-repeat;padding-right:36px}.pa input::placeholder{color:#a4a6ab}.pa input:focus,.pa select:focus{border-color:#1a1b1f;outline:0}.pa input[type=range]{height:28px;padding:0;accent-color:#1a1b1f;border:0;margin-top:10px;-webkit-appearance:auto;appearance:auto;background:none}.pa input[type=checkbox]{width:18px;height:18px;margin:0 10px 0 0;accent-color:#1a1b1f;-webkit-appearance:auto;appearance:auto}.pa .cb{display:flex;align-items:center;font-size:12px;letter-spacing:0;margin-top:16px;min-height:44px}.pa .sw{display:flex;margin-bottom:24px}.pa .sw button{flex:1;min-height:48px;border:1px solid #1a1b1f;background:#fff;color:#1a1b1f;border-radius:0;font-weight:700;cursor:pointer;font-size:12px}.pa .sw button+button{border-left:0}.pa .sw button.on{background:#1a1b1f;color:#fff}.pa .ty{display:grid;grid-template-columns:1fr 1fr;gap:8px}.pa .ty button{min-height:48px;border:1px solid #d6d6d9;background:#fff;border-radius:0;cursor:pointer;font-size:12px;color:inherit}.pa .ty button.on{border-color:#1a1b1f;background:#1a1b1f;color:#fff}.pa .r{position:sticky;top:var(--top);background:#fff;border:1px solid var(--l);padding:32px;scroll-margin-top:var(--top)}.pa .big{font-size:24px;line-height:30px;font-weight:700}.pa .m{color:var(--g);font-size:12px}.pa table{width:100%;border-collapse:collapse;margin:10px 0}.pa td{padding:6px 0;border-bottom:1px solid var(--l);vertical-align:top;font-size:12px}.pa td:last-child{text-align:right;white-space:nowrap;padding-left:12px}.pa .gn td:first-child{color:var(--g)}.pa h5{margin:22px 0 2px;font-size:13px;font-weight:700}.pa .cta{display:block;width:100%;margin:22px 0 0;padding:16px 20px;background:#1a1b1f;color:#fff;text-align:center;text-decoration:none;font-weight:700;font-size:12px;letter-spacing:.06em;border:1px solid #1a1b1f}.pa .cta:hover{background:#fff;color:#1a1b1f}.pa .bt{display:inline-block;margin:10px 0 0;padding:9px 15px;background:#fff;color:#1a1b1f;border:1px solid #1a1b1f;border-radius:0;font-weight:700;font-size:12px;cursor:pointer}.pa .bt:hover{background:#1a1b1f;color:#fff}.pa .d{margin-top:28px;font-size:11px;line-height:16px;color:var(--g);max-width:720px}.pa .mini{display:none}.pa :focus-visible{outline:2px solid #1a1b1f;outline-offset:2px}@media(max-width:991px){.pa .g{grid-template-columns:minmax(0,1fr);gap:28px}.pa .r{position:static;padding:22px}.pa .mini{display:flex;justify-content:space-between;align-items:center;gap:12px;position:sticky;top:var(--top);z-index:5;background:#1a1b1f;color:#fff;padding:12px 16px;margin:0 -2px 18px}.pa .mini b{font-size:15px}.pa .mini a{color:#fff;font-size:12px;white-space:nowrap}}@media(max-width:767px){.pa input,.pa select{font-size:16px}.pa .big{font-size:21px;line-height:27px}.pa td{font-size:12px}}";
  var S = { type: "villa", areal: 140, vin: "", glas: 0, koekken: "", bad: "", varme: "", vent: "", gulvvarme: false, solkwp: 0, terr: "", terrm2: 0, overdaek: false, detalje: false };
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
  function byg() {
    root.innerHTML = "";
    var g = el("div", "g"), left = el("div"), right = el("div", "r");
    var h = el("div"); 
    h.appendChild(el("p", "t", "Vælg det, du ved, og lad resten stå. Det du ikke vælger, regnes som et gennemsnit. Jo flere valg, jo mere præcist overslag."));
    root.appendChild(h);
    var sw = el("div", "sw");
    [["Hurtigt overslag", false], ["Detaljeret", true]].forEach(function (x) {
      var b = el("button", S.detalje === x[1] ? "on" : "", x[0]); b.type = "button"; b.onclick = function () { S.detalje = x[1]; byg(); update(); }; sw.appendChild(b);
    });
    mini = el("div", "mini"); left.appendChild(mini);
    left.appendChild(sw);
    var k1 = el("div", "k"); k1.appendChild(el("h4", null, "Hvad skal bygges?"));
    var ty = el("div", "ty");
    Object.keys(TYPER).forEach(function (t) { var b = el("button", S.type === t ? "on" : "", TYPER[t].navn); b.type = "button"; b.onclick = function () { S.type = t; byg(); update(); }; ty.appendChild(b); });
    k1.appendChild(ty); k1.appendChild(inp("Areal (m²)", "areal", "Etageareal i alt", "fx 140"));
    var r = el("input"); r.type = "range"; r.min = 20; r.max = 400; r.value = S.areal; r.setAttribute("aria-label", "Areal"); r.oninput = function () { S.areal = +r.value; k1.querySelector("input[inputmode]").value = r.value; update(); };
    k1.appendChild(r); left.appendChild(k1);
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
      k4.appendChild(sel("Ventilation med varmegenvinding", "vent", [["Ja", "ja"], ["Nej", "nej"]], "", "Standard for typen"));
      var vs = k4.querySelectorAll("select"), vsv = vs[vs.length - 1]; vsv.innerHTML = ""; vsv.appendChild(new Option("Standard for typen", "")); vsv.appendChild(new Option("Ja", "ja")); vsv.appendChild(new Option("Nej", "nej")); vsv.value = S.vent; vsv.onchange = function () { S.vent = vsv.value; update(); };
      k4.appendChild(inp("Solceller (kWp)", "solkwp", "Tom = ingen", "fx 6"));
      left.appendChild(k4);
      var k5 = el("div", "k"); k5.appendChild(el("h4", null, "Terrasse"));
      k5.appendChild(sel("Materiale", "terr", TERRASSE, "", "Ingen terrasse"));
      k5.appendChild(inp("Størrelse (m²)", "terrm2", "", "fx 30")); k5.appendChild(chk("Med overdækning", "overdaek"));
      left.appendChild(k5);
    }
    g.appendChild(left); out = right; g.appendChild(right); root.appendChild(g);
    var d = el("p", "d", "* Skøn uden fast kilde, som gør spændet bredere. Priser pr. " + REF.kvartal + " inkl. moms, ekskl. grund, og reguleres efter Danmarks Statistiks byggeomkostningsindeks, når den kan hentes. Kilder: bl.a. Bolius, Molio, Danmarks Statistik og branchens prisguider. Overslaget er vejledende og afløser ikke tilbud fra entreprenører. Det er ikke et tilbud.");
    root.appendChild(d);
  }
  function update() {
    var R = beregn(S), rows = "", bi = "";
    R.poster.forEach(function (p) { rows += "<tr class='" + (p[2] ? "" : "gn") + "'><td>" + p[0] + "</td><td>" + kr(p[1]) + "</td></tr>"; });
    R.bi.forEach(function (b) { bi += "<tr><td>" + b[0] + (b[2] ? " *" : "") + "</td><td>" + kr(b[1]) + "</td></tr>"; });
    var tekst = TYPER[S.type].navn + ", " + S.areal + " m²: ca. " + kr(R.total[0]) + " til " + kr(R.total[2]);
    out.innerHTML = "<div class='m'>Samlet overslag</div><div class='big'>" + kr(R.total[0]) + " – " + kr(R.total[2]) + "</div><div class='m'>Midt i spændet: " + kr(R.total[1]) + " (ca. ±" + Math.round(R.w * 100) + " %). Medregner byggeri, biomkostninger og uforudsete udgifter.</div>" +
      "<div class='m' style='margin-top:6px'>Håndværkertimer: ca. " + Math.round(R.timer[0] / 100) * 100 + "–" + Math.round(R.timer[1] / 100) * 100 + " timer.</div>" +
      "<h5>Byggeriet</h5><table>" + rows + "<tr><td><b>Byggesum (midt)</b></td><td><b>" + kr(R.kern) + "</b></td></tr></table>" +
      "<h5>Rådgivere, gebyrer og tilslutninger</h5><table>" + bi + "<tr><td>Uforudsete udgifter (" + Math.round(R.ufp * 1000) / 10 + " %)</td><td>" + kr(R.uf) + "</td></tr></table>" +
      "<div class='m'>Grå linjer er gennemsnit, fordi du ikke har valgt. Ikke med: grund, el- og fjernvarmetilslutning, indretning og have.</div>" +
      "<a class='cta' href='" + CFG.cta + "?type=" + S.type + "&areal=" + S.areal + "&overslag=" + Math.round(R.total[1]) + "'>Få en arkitekts vurdering →</a><button class='bt' type='button' id='kop'>Kopier overslag</button>";
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
  window.PRIS_DATA = { TYPER: TYPER, KOMP: KOMP, KOEKKEN: KOEKKEN, VARME: VARME, TERRASSE: TERRASSE, BI: BI, BI_PCT: BI_PCT, REF: REF };
  window.PRIS_BEREGN = function (s) { return beregn(Object.assign({}, S, s)); };
})();
