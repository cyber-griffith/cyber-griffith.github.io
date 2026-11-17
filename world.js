/* The block.
 *
 * A neon street at night, drawn pixel by pixel onto a small canvas and scaled
 * up. Every building is a part of the site. Click the street to skate there,
 * drag to look around, arrow keys to ride, Enter to go in.
 *
 * No images: the whole scene is rectangles and hand-typed bitmaps (pix.js).
 */
(function () {
  'use strict';

  var cv = document.getElementById('world');
  var list = document.getElementById('zones');
  if (!cv || !cv.getContext || !window.PIX || !list) return;

  var ctx = cv.getContext('2d');
  var PIX = window.PIX;
  var reduce = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  var H = 160, W = 1790, FEET = 139;
  var C = { cyan: '#35c8ff', violet: '#a26bff', pink: '#ff4fa3', green: '#3dffa0', yellow: '#ffd447', blue: '#3d8bff', steel: '#8a90b0' };

  /* zones come from the list in the page, so the list still works as plain links */
  var zones = Array.prototype.map.call(list.querySelectorAll('li'), function (li) {
    var a = li.querySelector('a');
    return {
      id: li.getAttribute('data-zone'), x: +li.getAttribute('data-x'), w: +li.getAttribute('data-w'),
      color: C[li.getAttribute('data-c')] || C.cyan,
      title: li.querySelector('b').textContent, line: li.querySelector('span').textContent,
      cta: li.getAttribute('data-cta'), href: a.getAttribute('href'), el: li, a: a
    };
  });
  var card = { h: document.getElementById('zoneTitle'), p: document.getElementById('zoneLine'), a: document.getElementById('zoneGo') };
  var HINT = { title: card.h ? card.h.textContent : '', line: card.p ? card.p.textContent : '' };

  /* ── a little determinism: the skyline is the same every visit ───────── */
  function rng(seed) {
    return function () {
      seed |= 0; seed = seed + 0x6D2B79F5 | 0;
      var t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  function hash(a, b) { var n = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return n - Math.floor(n); }

  var rnd = rng(7);
  var stars = [], far = [], mid = [];
  for (var s = 0; s < 150; s++) stars.push({ x: rnd() * 1100, y: 2 + rnd() * 74, p: rnd() * 6.28, b: rnd() });
  for (var fx = -20; fx < 1300;) { var fw = 14 + rnd() * 26 | 0; far.push({ x: fx, w: fw, h: 22 + rnd() * 46 | 0, s: rnd() * 99 | 0 }); fx += fw + (rnd() * 6 | 0); }
  for (var mx = -20; mx < 1700;) { var mw = 18 + rnd() * 30 | 0; mid.push({ x: mx, w: mw, h: 16 + rnd() * 40 | 0, s: rnd() * 99 | 0, n: rnd() }); mx += mw + (rnd() * 10 | 0); }

  var NEON = [C.cyan, C.violet, C.pink, C.green, C.yellow];
  var walkers = [];
  for (var w = 0; w < 9; w++) {
    var board = w % 3 === 0;
    walkers.push({ x: 240 + rnd() * (W - 300), v: (board ? 26 + rnd() * 16 : 7 + rnd() * 8) * (rnd() < 0.5 ? -1 : 1),
                   c: NEON[w % NEON.length], skin: ['#7a4a2f', '#c68a5c', '#e0b08a', '#5a3824'][w % 4], board: board });
  }
  var cars = [
    { x: 300, v: 62, c: C.pink, lane: 144 }, { x: 900, v: 46, c: C.cyan, lane: 144 },
    { x: 1400, v: -54, c: C.yellow, lane: 151 }, { x: 600, v: -70, c: C.violet, lane: 151 }
  ];

  /* ── state ───────────────────────────────────────────────────────────── */
  var scale = 3, viewW = 480, cam = 0, camFree = false;
  var me = { x: 330, tx: 330, dir: 1, key: 0 };
  var active = null, t = 0;
  var seen = {};
  try { (JSON.parse(localStorage.getItem('seen') || '[]') || []).forEach(function (id) { seen[id] = 1; }); } catch (e) { /* fine */ }

  function R(x, y, w2, h2, c) { ctx.fillStyle = c; ctx.fillRect(x | 0, y | 0, w2, h2); }

  function sign(text, x, y, color, on, sc) {
    sc = sc || 1;
    var tw = PIX.textWidth(text, sc);
    R(x - 3, y - 3, tw + 6, 7 * sc + 6, '#07071a');
    R(x - 3, y - 3, tw + 6, 1, color);
    ctx.globalAlpha = on ? 1 : 0.72 + 0.28 * Math.sin(t * 3 + x);
    PIX.drawText(ctx, text, x, y, color, sc);
    ctx.globalAlpha = 1;
  }

  function person(x, base, shirt, skin, phase, hands) {
    var bob = Math.sin(phase) > 0 ? 0 : 1;
    R(x, base - 7 + bob, 3, 3, skin);
    R(x, base - 7 + bob, 3, 1, '#17131f');
    R(x, base - 4 + bob, 3, 3, shirt);
    R(x, base - 1, 1, 1, '#17131f'); R(x + 2, base - 1, 1, 1, '#17131f');
    if (hands) { R(x - 1, base - 8 + bob, 1, 3, skin); R(x + 3, base - 8 + bob, 1, 3, skin); }
  }

  /* ── buildings ───────────────────────────────────────────────────────── */

  function dock(on) {
    R(0, 136, 216, 24, '#0a1846');
    for (var i = 0; i < 14; i++) R((i * 17 + t * 6) % 216, 140 + (i * 7) % 18, 5, 1, '#1d3a8a');
    var hull = '#565c7c';
    for (var k = 0; k < 13; k++) R(30 + k, 118 + k, 13 - k, 1, hull);
    R(43, 118, 104, 13, hull);
    R(30, 117, 118, 1, C.steel);
    R(44, 127, 103, 1, '#b3394f');
    R(84, 100, 42, 17, '#6a7092'); R(94, 90, 22, 10, '#7b82a4');
    for (var wn = 0; wn < 6; wn++) R(87 + wn * 6, 105, 3, 2, hash(wn, 1) > 0.3 ? C.cyan : '#2b3560');
    R(104, 68, 2, 22, C.steel); R(98, 76, 14, 1, C.steel);
    R(104, 66, 2, 2, t % 1.2 < 0.6 ? '#ff5555' : '#4a1515');
    R(128, 108, 18, 9, '#4b5170');
    R(150, 132, 68, 4, '#3a2f60'); R(160, 136, 3, 12, '#2a2148'); R(204, 136, 3, 12, '#2a2148');
    R(160, 100, 2, 32, C.steel);
    sign('DOCK', 150, 90, C.yellow, on);
  }

  function lab(on) {
    R(250, 34, 160, 98, '#0f1746'); R(250, 34, 160, 2, C.cyan); R(250, 36, 2, 96, '#1f2c70'); R(408, 36, 2, 96, '#0a1030');
    for (var c = 0; c < 12; c++) for (var r = 0; r < 6; r++) {
      var lit = hash(c + 3, r + Math.floor(t * 0.6 + hash(c, r) * 9)) > 0.45;
      R(259 + c * 12, 68 + r * 8, 7, 3, lit ? C.cyan : '#15285e');
    }
    R(288, 39, 84, 21, '#050514'); R(288, 39, 84, 1, C.cyan);
    PIX.drawIcon(ctx, 'bot', 293, 43, t % 4 < 0.14 ? '#1b6a8a' : C.cyan, 1);
    ctx.globalAlpha = on ? 1 : 0.78 + 0.22 * Math.sin(t * 3);
    PIX.drawText(ctx, 'AGENT LAB', 311, 46, C.cyan, 1);
    ctx.globalAlpha = 1;
    R(329, 12, 2, 22, C.steel);
    var ring = (t * 9) % 16;
    ctx.globalAlpha = 1 - ring / 16;
    R(330 - ring, 12, 1, 1, C.cyan); R(330 + ring, 12, 1, 1, C.cyan); R(330, 12 - ring * 0.5, 1, 1, C.cyan);
    ctx.globalAlpha = 1;
    R(321, 116, 18, 16, '#0b3a55'); R(321, 116, 18, 1, C.cyan);
    for (var b = 0; b < 2; b++) {
      var bx = b ? 362 : 292, by = 121 + Math.round(Math.sin(t * 2.2 + b * 2) * 2);
      R(bx, by, 6, 5, '#cfd6ff'); R(bx + 1, by + 1, 1, 1, '#07071a'); R(bx + 4, by + 1, 1, 1, '#07071a'); R(bx + 2, by - 2, 1, 2, C.cyan);
    }
  }

  function shop(on) {
    R(490, 74, 150, 58, '#19113f'); R(486, 70, 158, 5, C.violet);
    R(516, 94, 64, 38, '#2a1f5c');
    for (var sl = 0; sl < 6; sl++) R(516, 96 + sl * 4, 64, 1, '#3a2d78');
    R(516, 118, 64, 14, '#3b2a14'); R(516, 118, 64, 1, C.yellow);
    R(524, 124, 18, 2, '#17131f'); R(528, 126, 2, 6, '#17131f'); R(538, 126, 2, 6, '#17131f');
    R(552, 120, 10, 12, '#22305e'); R(554, 122, 6, 3, C.cyan);
    if (t % 2.6 < 0.5) for (var sp = 0; sp < 5; sp++) R(543 + hash(sp, Math.floor(t * 20)) * 9, 119 + hash(sp + 9, Math.floor(t * 20)) * 6, 1, 1, C.yellow);
    PIX.drawIcon(ctx, 'gear', 600 + (Math.floor(t * 2) % 2), 98, C.violet, 2);
    sign('WORKSHOP', 498, 80, C.violet, on);
  }

  function arena(on) {
    for (var h = 0; h <= 66; h++) {
      var half = 86 * Math.sqrt(1 - (h / 67) * (h / 67)) | 0;
      R(780 - half, 132 - h, half * 2, 1, h % 9 === 0 ? '#2a1450' : '#1a0d38');
      R(780 - half, 132 - h, 2, 1, C.pink); R(780 + half - 2, 132 - h, 2, 1, C.pink);
    }
    R(766, 110, 28, 22, '#3a0f2c'); R(766, 110, 28, 1, C.pink);
    PIX.drawIcon(ctx, 'sword', 768, 40, C.pink, 2);
    for (var bm = 0; bm < 2; bm++) {
      var ang = Math.sin(t * 0.7 + bm * 2.4) * 0.5 + (bm ? -0.5 : 0.5);
      ctx.globalAlpha = 0.16;
      for (var k = 4; k < 70; k += 2) R((bm ? 852 : 708) + Math.sin(ang) * k - k * 0.06, 132 - Math.cos(ang) * k, 2 + k * 0.12, 2, '#ffffff');
      ctx.globalAlpha = 1;
    }
    sign('BOSS ARENA', 751, 80, C.pink, on);
  }

  function hall(on) {
    R(900, 128, 160, 4, '#3b3364'); R(906, 124, 148, 4, '#4b4284');
    for (var c = 0; c < 6; c++) { R(912 + c * 26, 94, 8, 30, '#d9c98d'); R(912 + c * 26, 94, 2, 30, '#f3e7b8'); }
    R(906, 83, 148, 11, '#e6d391');
    for (var y = 82; y >= 62; y--) { var half = (y - 61) * 3.5 | 0; R(980 - half, y, half * 2, 1, '#c8b46c'); }
    PIX.drawIcon(ctx, 'trophy', 974, 69, t % 2 < 1 ? '#7a5a00' : '#a07800', 1);
    PIX.drawText(ctx, 'TROPHY HALL', 948, 85, '#3a2a00', 1);
    if (on) R(906, 94, 148, 1, C.yellow);
  }

  function stage(on) {
    R(1110, 116, 140, 16, '#181040');
    for (var f = 0; f < 23; f++) R(1112 + f * 6, 118, 3, 2, NEON[(f + Math.floor(t * 4)) % NEON.length]);
    R(1110, 56, 3, 60, C.steel); R(1247, 56, 3, 60, C.steel); R(1110, 53, 140, 3, C.steel);
    for (var tr = 0; tr < 23; tr++) R(1113 + tr * 6, 54, 2, 1, '#07071a');
    R(1120, 62, 120, 42, '#0a0a24');
    for (var e = 0; e < 17; e++) {
      var eh = 4 + Math.abs(Math.sin(t * 5 + e * 1.3)) * (16 + 10 * Math.sin(t * 1.7 + e)) | 0;
      R(1123 + e * 7, 102 - eh, 5, eh, e % 2 ? C.pink : C.violet);
    }
    for (var b = 0; b < 3; b++) {
      var bx = 1136 + b * 44, sway = Math.sin(t * 1.3 + b * 2) * 16;
      ctx.globalAlpha = 0.13;
      for (var k = 0; k < 58; k += 2) R(bx + sway * k / 58 - k * 0.16, 57 + k, 2 + k * 0.32, 2, NEON[(b + Math.floor(t * 0.8)) % NEON.length]);
      ctx.globalAlpha = 1;
    }
    R(1096, 102, 12, 30, '#0d0d24'); R(1099, 106, 6, 6, '#2a2a5a'); R(1099, 118, 6, 6, '#2a2a5a');
    R(1252, 102, 12, 30, '#0d0d24'); R(1255, 106, 6, 6, '#2a2a5a'); R(1255, 118, 6, 6, '#2a2a5a');
    R(1202, 108, 14, 8, '#2a2360'); R(1200, 106, 4, 2, C.yellow); R(1214, 105, 4, 2, C.yellow);
    person(1207, 110, C.green, '#c68a5c', t * 9, false);
    person(1150, 116, C.pink, '#7a4a2f', t * 6, false); R(1147, 111, 9, 1, '#e8e8f0');
    person(1178, 116, C.cyan, '#e0b08a', t * 5, true); R(1181, 104, 1, 6, C.steel);
    for (var cr = 0; cr < 19; cr++) {
      var cx = 1108 + cr * 8 + (hash(cr, 2) * 3 | 0);
      person(cx, FEET - 1, NEON[cr % NEON.length], ['#7a4a2f', '#c68a5c', '#e0b08a'][cr % 3], t * 7 + cr * 1.7, hash(cr, 5) > 0.45);
    }
    sign('THE STAGE', 1153, 42, C.pink, on);
  }

  function rampH(x) {
    if (x < 1336) return Math.pow((1336 - x) / 36, 2) * 36;
    if (x > 1404) return Math.pow((x - 1404) / 36, 2) * 36;
    return 0;
  }
  function bowl(on) {
    R(1288, 96, 12, 36, '#2a2360'); R(1288, 95, 13, 1, C.green);
    R(1440, 96, 12, 36, '#2a2360'); R(1439, 95, 13, 1, C.green);
    for (var x = 1300; x <= 1440; x++) {
      var h = rampH(x) | 0;
      if (h > 0) { R(x, 132 - h, 1, h, '#2a2360'); R(x, 132 - h, 1, 1, C.green); }
    }
    R(1292, 108, 4, 2, C.pink); R(1294, 114, 5, 1, C.cyan); R(1443, 106, 5, 2, C.yellow); R(1444, 116, 3, 2, C.violet);
    var u = Math.sin(t * 1.5), sx = 1370 + u * 66, air = Math.max(0, Math.abs(u) - 0.94) * 90;
    var sy = 132 - rampH(sx) - air;
    R(sx - 3, sy - 1, 7, 1, C.yellow);
    person(sx - 1, sy - 1, C.blue, '#c68a5c', 0, air > 1);
    R(1464, 90, 2, 42, C.steel); R(1458, 80, 2, 16, '#f2f0ff'); R(1450, 94, 8, 1, '#ff7a2a');
    R(1451, 95, 1, 4, '#cdd'); R(1454, 95, 1, 4, '#cdd'); R(1457, 95, 1, 4, '#cdd');
    var p = (t % 3.2) / 1.3;
    if (p < 1) R(1418 + p * 35, 118 - 4 * 34 * p * (1 - p) - p * 22, 3, 3, '#ff8a3a');
    else if (p < 1.5) R(1453, 96 + (p - 1) * 70, 3, 3, '#ff8a3a');
    person(1414, FEET - 1, C.pink, '#7a4a2f', 0, p < 0.3);
    sign('THE BOWL', 1348, 76, C.green, on);
  }

  function arcade(on) {
    R(1492, 62, 132, 70, '#160e3c'); R(1490, 58, 136, 5, C.pink);
    R(1500, 92, 84, 30, '#080820'); R(1500, 92, 84, 1, C.violet);
    var pal = [C.cyan, C.pink, C.green, C.yellow, C.violet, '#ffffff'];
    for (var c = 0; c < 3; c++) {
      var x = 1506 + c * 27;
      R(x, 98, 17, 24, '#27226e'); R(x + 2, 98, 13, 2, C.yellow);
      R(x + 3, 102, 11, 8, pal[Math.floor(t * 5 + c * 3.7) % pal.length]);
      R(x + 5 + (Math.floor(t * 8 + c) % 5), 104 + (Math.floor(t * 6 + c * 2) % 4), 2, 2, '#07071a');
      R(x + 4, 113, 2, 2, C.pink); R(x + 10, 113, 3, 1, '#cfd6ff');
    }
    person(1540, 122, C.green, '#e0b08a', t * 4, false);
    R(1594, 104, 20, 28, '#0b3a55'); R(1594, 104, 20, 1, C.cyan);
    if (t % 1.4 < 0.9) PIX.drawText(ctx, 'OPEN', 1593, 94, C.green, 1);
    var word = 'ARCADE';
    R(1513, 66, 76, 20, '#07071a');
    for (var i = 0; i < word.length; i++) {
      ctx.globalAlpha = on || Math.floor(t * 5) % word.length !== i ? 1 : 0.35;
      PIX.drawText(ctx, word.charAt(i), 1517 + i * 12, 69, NEON[(i + Math.floor(t * 1.5)) % NEON.length], 2);
    }
    ctx.globalAlpha = 1;
  }

  function p2(on) {
    R(1710, 36, 2, 96, C.steel); R(1704, 56, 14, 1, C.steel); R(1706, 76, 10, 1, C.steel); R(1702, 100, 18, 1, C.steel);
    R(1710, 33, 2, 3, t % 1 < 0.5 ? '#ff5555' : '#4a1515');
    var ring = (t * 8) % 18;
    ctx.globalAlpha = 1 - ring / 18;
    R(1711 - ring, 40, 1, 2, C.yellow); R(1711 + ring, 40, 1, 2, C.yellow);
    ctx.globalAlpha = 1;
    R(1660, 100, 44, 32, '#101844'); R(1658, 97, 48, 4, C.yellow);
    R(1666, 106, 32, 20, '#07071a');
    PIX.drawIcon(ctx, 'mail', 1676, 110, C.cyan, 1);
    sign('PLAYER 2', 1655, 76, C.yellow, on);
  }

  var DRAW = { story: dock, play: lab, loadout: shop, bosses: arena, certs: hall, music: stage, sports: bowl, arcade: arcade, contact: p2 };

  /* ── frame ───────────────────────────────────────────────────────────── */

  function draw() {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    var g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#05051a'); g.addColorStop(0.62, '#1a0f4e'); g.addColorStop(0.83, '#3a1766'); g.addColorStop(1, '#07071a');
    ctx.fillStyle = g; ctx.fillRect(0, 0, viewW, H);

    var c1 = Math.round(cam * 0.08);
    for (var i = 0; i < stars.length; i++) {
      var st = stars[i], sx = st.x - c1;
      if (sx < 0 || sx > viewW) continue;
      ctx.globalAlpha = 0.35 + 0.65 * Math.abs(Math.sin(t * (0.6 + st.b) + st.p));
      R(sx, st.y, 1, 1, st.b > 0.86 ? C.cyan : '#ffffff');
    }
    ctx.globalAlpha = 1;
    var moonX = viewW * 0.78 - c1 * 0.5;
    for (var my = -9; my <= 9; my++) { var mh = Math.sqrt(81 - my * my) | 0; R(moonX - mh, 26 + my, mh * 2, 1, '#e8e4ff'); }
    R(moonX - 4, 22, 3, 2, '#c9c2f0'); R(moonX + 2, 29, 4, 3, '#c9c2f0');
    var sky = (t * 22) % (viewW + 200) - 100;
    R(sky, 44, 3, 1, C.pink); R(sky - 3, 44, 2, 1, '#5a2a4a'); R(viewW - sky * 0.7, 58, 3, 1, C.cyan);

    ctx.setTransform(1, 0, 0, 1, -Math.round(cam * 0.25), 0);
    far.forEach(function (b) {
      R(b.x, 132 - b.h - 14, b.w, b.h + 14, '#120f3a');
      for (var k = 0; k < 8; k++) if (hash(b.s, k) > 0.62) R(b.x + 2 + (hash(b.s + 1, k) * (b.w - 5) | 0), 132 - b.h - 10 + (hash(b.s + 2, k) * b.h | 0), 2, 1, '#34307e');
    });
    ctx.setTransform(1, 0, 0, 1, -Math.round(cam * 0.5), 0);
    mid.forEach(function (b) {
      R(b.x, 132 - b.h, b.w, b.h, '#1a1552');
      R(b.x, 132 - b.h, b.w, 1, '#2c2580');
      for (var k = 0; k < 10; k++) if (hash(b.s, k + Math.floor(t * 0.2 + b.n * 5)) > 0.5) R(b.x + 2 + (hash(b.s + 3, k) * (b.w - 5) | 0), 132 - b.h + 3 + (hash(b.s + 4, k) * (b.h - 6) | 0), 2, 2, k % 4 ? '#5a4bd0' : NEON[b.s % NEON.length]);
      if (b.n > 0.7) R(b.x + 3, 132 - b.h - 3, b.w - 6, 2, NEON[b.s % NEON.length]);
    });

    ctx.setTransform(1, 0, 0, 1, -Math.round(cam), 0);
    R(0, 132, W, 9, '#23204f'); R(0, 132, W, 1, '#3d3888'); R(0, 140, W, 1, '#0b0b20'); R(0, 141, W, 19, '#0e0d26');
    for (var dx = 220; dx < W; dx += 26) R(dx, 150, 11, 1, '#3b3870');
    zones.forEach(function (z) {
      ctx.globalAlpha = 0.09; R(z.x - 16, 142, 32, 18, z.color); ctx.globalAlpha = 1;
    });
    zones.forEach(function (z) { if (DRAW[z.id]) DRAW[z.id](z === active); });

    walkers.forEach(function (p) {
      if (p.board) R(p.x - 2, FEET, 7, 1, '#e8e8f0');
      person(p.x, FEET - (p.board ? 0 : 0), p.c, p.skin, p.board ? 0 : t * 7 + p.x, false);
      R(p.x + (p.v > 0 ? 2 : 0), FEET - 6, 1, 1, p.c);
    });

    /* me, on a board */
    var x = Math.round(me.x), d = me.dir, moving = Math.abs(me.tx - me.x) > 0.6 || me.key;
    var push = moving && Math.floor(t * 6) % 2 === 0;
    R(x - 5, FEET, 11, 1, C.yellow); R(x - 4, FEET + 1, 2, 1, '#ffffff'); R(x + 3, FEET + 1, 2, 1, '#ffffff');
    R(x - 2, FEET - 5, 2, 5, '#1c1c3c'); R(x + 1 - (push ? d * 2 : 0), FEET - 5, 2, 5, '#1c1c3c');
    R(x - 3, FEET - 12, 6, 7, '#2f6bff'); R(x - 3, FEET - 12, 6, 1, '#6a9bff'); R(x - 1, FEET - 11, 2, 2, '#f2f0ff');
    R(x + (d > 0 ? 3 : -4), FEET - 11, 1, 5, '#2f6bff');
    R(x - 2, FEET - 17, 4, 5, '#7a4a2f'); R(x + (d > 0 ? 1 : -2), FEET - 15, 1, 1, '#17131f');
    R(x - 3, FEET - 21, 6, 5, '#15101c'); R(x - 2, FEET - 22, 4, 1, '#15101c');
    PIX.drawText(ctx, 'JACE', x - 11, FEET - 33, C.yellow, 1);

    if (active && !moving && Math.floor(t * 2.4) % 2 === 0) {
      R(x - 19, FEET - 47, 39, 11, '#ffffff'); R(x - 1, FEET - 36, 3, 2, '#ffffff');
      PIX.drawText(ctx, 'ENTER', x - 14, FEET - 45, '#07071a', 1);
    }

    cars.forEach(function (c) {
      var f = c.v > 0 ? 1 : -1;
      R(c.x, c.lane, 24, 6, c.c); R(c.x + 5, c.lane - 4, 13, 4, c.c); R(c.x + 7, c.lane - 3, 9, 3, '#0a0a24');
      R(c.x + 3, c.lane + 6, 4, 2, '#07071a'); R(c.x + 17, c.lane + 6, 4, 2, '#07071a');
      R(f > 0 ? c.x + 23 : c.x, c.lane + 1, 1, 2, '#ffffff'); R(f > 0 ? c.x : c.x + 23, c.lane + 1, 1, 2, '#ff3333');
      ctx.globalAlpha = 0.18; R(f > 0 ? c.x + 24 : c.x - 14, c.lane + 1, 14, 3, '#ffffff'); ctx.globalAlpha = 1;
    });
  }

  function nearest() {
    for (var i = 0; i < zones.length; i++) if (Math.abs(me.x - zones[i].x) < 24) return zones[i];
    return null;
  }

  function setActive(z) {
    if (z === active) return;
    active = z;
    zones.forEach(function (o) { o.el.classList.toggle('is-here', o === z); });
    if (card.h) {
      card.h.textContent = z ? z.title : HINT.title;
      card.p.textContent = z ? z.line : HINT.line;
      card.a.hidden = !z;
      if (z) { card.a.href = z.href; card.a.textContent = z.cta; }
    }
    if (z && !seen[z.id]) {
      seen[z.id] = 1;
      try { localStorage.setItem('seen', JSON.stringify(Object.keys(seen))); } catch (e) { /* private mode */ }
    }
    if (z) document.dispatchEvent(new CustomEvent('block:visit', { detail: { id: z.id, all: zones.every(function (o) { return seen[o.id]; }) } }));
  }

  function enter() {
    if (!active) return;
    var target = document.querySelector(active.href);
    if (target) target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  }

  function clampCam(v) { return Math.max(0, Math.min(W - viewW, v)); }

  function step(dt) {
    t += dt;
    if (me.key) { me.tx = Math.max(24, Math.min(W - 24, me.x + me.key * 40)); camFree = false; }
    var gap = me.tx - me.x;
    if (Math.abs(gap) > 0.6) {
      me.dir = gap > 0 ? 1 : -1;
      me.x += me.dir * Math.min(Math.abs(gap), 96 * dt);
    }
    if (!camFree) cam += (clampCam(me.x - viewW / 2) - cam) * Math.min(1, dt * 5);
    walkers.forEach(function (p) { p.x += p.v * dt; if (p.x < 226) { p.x = 226; p.v = -p.v; } if (p.x > W - 20) { p.x = W - 20; p.v = -p.v; } });
    cars.forEach(function (c) { c.x += c.v * dt; if (c.x > W + 40) c.x = 190; if (c.x < 190) c.x = W + 40; });
    setActive(Math.abs(me.tx - me.x) < 0.7 ? nearest() : (nearest() || null));
  }

  function fit() {
    var wide = cv.parentNode.clientWidth;
    scale = Math.max(2, Math.min(4, Math.floor(Math.min(wide / 300, window.innerHeight * 0.56 / H))));
    viewW = Math.ceil(wide / scale);
    cv.width = viewW; cv.height = H;
    cv.style.height = (H * scale) + 'px';
    ctx.imageSmoothingEnabled = false;
    cam = clampCam(me.x - viewW / 2);
    draw();
  }

  function goTo(x) {
    me.tx = Math.max(24, Math.min(W - 24, x));
    camFree = false;
    if (reduce) { me.x = me.tx; cam = clampCam(me.x - viewW / 2); step(0); draw(); }
  }

  /* pointer: a click skates there, a drag looks around */
  var drag = null;
  cv.addEventListener('pointerdown', function (e) {
    drag = { x: e.clientX, cam: cam, moved: false };
    cv.setPointerCapture(e.pointerId);
  });
  cv.addEventListener('pointermove', function (e) {
    if (!drag) return;
    var dx = e.clientX - drag.x;
    if (Math.abs(dx) > 6) drag.moved = true;
    if (drag.moved) { camFree = true; cam = clampCam(drag.cam - dx / scale); if (reduce) draw(); }
  });
  cv.addEventListener('pointerup', function (e) {
    if (!drag) return;
    var was = drag; drag = null;
    if (was.moved) return;
    var r = cv.getBoundingClientRect();
    var wx = cam + (e.clientX - r.left) / scale;
    var hit = null;
    zones.forEach(function (z) { if (Math.abs(wx - z.x) < z.w / 2) hit = z; });
    if (hit && hit === active && Math.abs(me.x - hit.x) < 2) { enter(); return; }
    goTo(hit ? hit.x : wx);
  });
  cv.addEventListener('pointercancel', function () { drag = null; });

  cv.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') { me.key = -1; e.preventDefault(); }
    else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') { me.key = 1; e.preventDefault(); }
    else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); enter(); }
    if (reduce && me.key) { goTo(me.x + me.key * 60); me.key = 0; }
  });
  cv.addEventListener('keyup', function (e) {
    if (/^(ArrowLeft|ArrowRight|a|d|A|D)$/.test(e.key)) { me.key = 0; me.tx = me.x; }
  });
  cv.addEventListener('blur', function () { me.key = 0; });

  zones.forEach(function (z) {
    z.a.addEventListener('click', function (e) {
      if (active === z && Math.abs(me.x - z.x) < 2) return;      /* second click follows the link */
      e.preventDefault();
      goTo(z.x);
    });
  });

  var rt;
  window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(fit, 120); });
  fit();
  step(0); draw();

  if (!reduce) {
    var running = false, visible = true, last = 0;
    var frame = function (ts) {
      if (!running) return;
      var dt = last ? Math.min(0.05, (ts - last) / 1000) : 0;
      last = ts;
      step(dt); draw();
      requestAnimationFrame(frame);
    };
    var setRunning = function () {
      var want = visible && !document.hidden;
      if (want === running) return;
      running = want; last = 0;
      if (running) requestAnimationFrame(frame);
    };
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) { visible = en[0].isIntersecting; setRunning(); }, { threshold: 0.02 }).observe(cv);
    }
    document.addEventListener('visibilitychange', setRunning);
    setRunning();
  }
})();
