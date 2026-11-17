/* Jace Griffith — the block
 *
 * Everything here is enhancement. With this file removed the page still reads
 * top to bottom, and the list under the street still links to every part.
 * The street itself lives in world.js; the pixel lettering in pix.js; the
 * lists you can edit in me.js.
 */
(function () {
  'use strict';

  var root = document.documentElement;
  root.classList.add('js');

  var reduce = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  var fine = !!(window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches);
  var hasIO = 'IntersectionObserver' in window;
  var SVGNS = 'http://www.w3.org/2000/svg';
  var PIX = window.PIX;

  function $(sel, el) { return (el || document).querySelector(sel); }
  function $$(sel, el) { return Array.prototype.slice.call((el || document).querySelectorAll(sel)); }
  function load(key) { try { return localStorage.getItem(key); } catch (e) { return null; } }
  function save(key, val) { try { localStorage.setItem(key, val); } catch (e) { /* private mode */ } }
  function loadList(key) { try { return JSON.parse(load(key) || '[]') || []; } catch (e) { return []; } }
  function fmt(n) { return n.toLocaleString('en-US'); }
  function pct(hit, n) { return (n ? hit / n * 100 : 0).toFixed(1) + '%'; }

  if (PIX) PIX.apply(document);

  /* ── toast, XP, achievements ─────────────────────────────────────────── */

  var toast = $('#toast'), toastTimer;
  function say(small, big) {
    if (!toast) return;
    toast.textContent = '';
    var s = document.createElement('small'); s.textContent = small;
    var b = document.createElement('b'); b.textContent = big;
    toast.appendChild(s); toast.appendChild(b);
    toast.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.classList.remove('is-on'); }, 3000);
  }

  var xp = parseInt(load('xp') || '0', 10) || 0;
  var xpBox = $('#xp'), xpLv = $('#xpLv'), xpFill = $('#xpFill');
  function level() { return 1 + Math.floor(xp / 100); }
  function paintXP() {
    if (xpLv) xpLv.textContent = 'LV ' + level();
    if (xpFill) xpFill.style.width = (xp % 100) + '%';
  }
  function addXP(n) {
    var before = level();
    xp += n; save('xp', String(xp));
    paintXP();
    if (level() > before) {
      say('Level up', 'You hit level ' + level());
      if (xpBox) { xpBox.classList.remove('is-up'); void xpBox.offsetWidth; xpBox.classList.add('is-up'); }
    }
  }
  paintXP();

  var achBtn = $('#achBtn'), achList = $('#achList'), achCount = $('#achCount');
  var achItems = $$('#achList li');
  var got = loadList('ach');

  function paintAch() {
    achItems.forEach(function (li) { li.classList.toggle('is-got', got.indexOf(li.getAttribute('data-ach')) >= 0); });
    if (achCount) achCount.textContent = got.filter(function (id) { return $('#achList li[data-ach="' + id + '"]'); }).length + '/' + achItems.length;
  }
  function unlock(id) {
    if (got.indexOf(id) >= 0) return;
    var li = $('#achList li[data-ach="' + id + '"]');
    if (!li) return;
    got.push(id);
    save('ach', JSON.stringify(got));
    paintAch();
    addXP(40);
    say('Achievement unlocked', $('b', li).textContent);
    if (achBtn) { achBtn.classList.remove('is-bump'); void achBtn.offsetWidth; achBtn.classList.add('is-bump'); }
  }
  paintAch();

  if (achBtn && achList) {
    var setOpen = function (open) { achList.hidden = !open; achBtn.setAttribute('aria-expanded', String(open)); };
    achBtn.addEventListener('click', function () { setOpen(achList.hidden); });
    document.addEventListener('click', function (e) { if (!achList.hidden && !$('#ach').contains(e.target)) setOpen(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !achList.hidden) { setOpen(false); achBtn.focus(); } });
  }

  document.addEventListener('block:visit', function (e) { if (e.detail && e.detail.all) unlock('explorer'); });

  /* ── radio groups: arrow keys move, like the native control ──────────── */

  function radioGroup(group, onPick) {
    var buttons = $$('[role="radio"]', group);
    function mark(btn) {
      buttons.forEach(function (b) { var on = b === btn; b.setAttribute('aria-checked', String(on)); b.tabIndex = on ? 0 : -1; });
    }
    function pick(btn, focus) { mark(btn); if (focus) btn.focus(); onPick(btn); }
    buttons.forEach(function (b, i) {
      b.tabIndex = b.getAttribute('aria-checked') === 'true' ? 0 : -1;
      b.addEventListener('click', function () { pick(b, false); });
      b.addEventListener('keydown', function (e) {
        var step = (e.key === 'ArrowRight' || e.key === 'ArrowDown') ? 1 : (e.key === 'ArrowLeft' || e.key === 'ArrowUp') ? -1 : 0;
        if (!step) return;
        e.preventDefault();
        pick(buttons[(i + step + buttons.length) % buttons.length], true);
      });
    });
    return { mark: mark, buttons: buttons };
  }

  /* ── current section in the bar ──────────────────────────────────────── */

  if (hasIO) {
    var navLinks = {};
    $$('.bar__nav a[href^="#"]').forEach(function (a) { navLinks[a.getAttribute('href').slice(1)] = a; });
    var seen = {};
    var navObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { seen[e.target.id] = e.isIntersecting; });
      var current = Object.keys(navLinks).filter(function (id) { return seen[id]; }).pop();
      Object.keys(navLinks).forEach(function (id) {
        var on = id === current;
        navLinks[id].classList.toggle('is-current', on);
        if (on) navLinks[id].setAttribute('aria-current', 'true'); else navLinks[id].removeAttribute('aria-current');
      });
    }, { rootMargin: '-30% 0px -60% 0px' });
    Object.keys(navLinks).forEach(function (id) { var el = document.getElementById(id); if (el) navObs.observe(el); });
  }

  /* ── sprite cursor: a pixel pointer with a bot that tags along ───────── */

  var sprite = $('#sprite');
  var chomp = function () {};
  if (sprite && PIX && fine && !reduce) (function () {
    var ARROW = ['#........', '##.......', '###......', '####.....', '#####....', '######...', '#######..', '####.....', '#.##.....', '..##.....', '...##....', '...##....'];
    var ptr = document.createElementNS(SVGNS, 'svg');
    ptr.setAttribute('viewBox', '0 0 9 12'); ptr.setAttribute('class', 'sprite__ptr'); ptr.setAttribute('shape-rendering', 'crispEdges');
    var d = '';
    ARROW.forEach(function (row, y) { for (var x = 0; x < row.length; x++) if (row.charAt(x) === '#') d += 'M' + x + ' ' + y + 'h1v1h-1z'; });
    var path = document.createElementNS(SVGNS, 'path'); path.setAttribute('d', d); path.setAttribute('fill', 'currentColor');
    ptr.appendChild(path);
    var bot = PIX.iconSVG('bot'); bot.setAttribute('class', 'sprite__bot');
    sprite.appendChild(bot); sprite.appendChild(ptr);

    var on = load('sprite') !== 'off';
    var toggle = $('#curToggle');
    var px = -100, py = -100, bx = -100, by = -100, raf = 0;

    function paint() {
      root.classList.toggle('has-sprite', on);
      if (toggle) { toggle.textContent = 'Sprite cursor: ' + (on ? 'on' : 'off'); toggle.setAttribute('aria-pressed', String(on)); }
    }
    function tick() {
      bx += (px + 12 - bx) * 0.22; by += (py + 14 - by) * 0.22;
      bot.style.transform = 'translate(' + bx.toFixed(1) + 'px,' + by.toFixed(1) + 'px)';
      raf = (Math.abs(px + 12 - bx) + Math.abs(py + 14 - by) > 0.4) ? requestAnimationFrame(tick) : 0;
    }
    document.addEventListener('pointermove', function (e) {
      if (!on || e.pointerType !== 'mouse') return;
      px = e.clientX; py = e.clientY;
      ptr.style.transform = 'translate(' + px + 'px,' + py + 'px)';
      sprite.classList.remove('is-out');
      var t = e.target && e.target.closest ? e.target.closest('a, button, [role="radio"], [role="switch"], canvas, .gate[data-sw], .gem, .pcard') : null;
      sprite.classList.toggle('is-link', !!t);
      if (!raf) raf = requestAnimationFrame(tick);
    }, { passive: true });
    document.addEventListener('pointerleave', function () { sprite.classList.add('is-out'); });
    document.documentElement.addEventListener('mouseleave', function () { sprite.classList.add('is-out'); });
    if (toggle) toggle.addEventListener('click', function () { on = !on; save('sprite', on ? 'on' : 'off'); paint(); });

    chomp = function () {
      sprite.classList.remove('is-chomp'); void sprite.offsetWidth; sprite.classList.add('is-chomp');
      setTimeout(function () { sprite.classList.remove('is-chomp'); }, 300);
    };
    paint();
  })();
  else if ($('#curToggle')) $('#curToggle').hidden = true;

  /* ── gems scattered down the page ────────────────────────────────────── */

  var gems = $$('.gem');
  if (gems.length && PIX) (function () {
    var have = loadList('gems');
    function grab(g) {
      var id = g.getAttribute('data-gem');
      if (have.indexOf(id) >= 0) return;
      have.push(id); save('gems', JSON.stringify(have));
      g.classList.add('is-got');
      chomp(); addXP(15);
      if (have.length >= gems.length) unlock('loot');
      else say('Gem', have.length + ' of ' + gems.length + ' found');
    }
    gems.forEach(function (g) {
      g.appendChild(PIX.iconSVG('gem'));
      if (have.indexOf(g.getAttribute('data-gem')) >= 0) g.classList.add('is-got');
      g.addEventListener('pointerenter', function () { grab(g); });
      g.addEventListener('click', function () { grab(g); });
    });
  })();

  /* ── player card: tilt toward the pointer ────────────────────────────── */

  var pcard = $('#pcard');
  if (pcard && fine && !reduce) {
    var inner = $('.pcard__in', pcard);
    pcard.addEventListener('pointermove', function (e) {
      var r = pcard.getBoundingClientRect();
      var u = (e.clientX - r.left) / r.width - 0.5, v = (e.clientY - r.top) / r.height - 0.5;
      inner.style.setProperty('--ry', (u * 16).toFixed(1) + 'deg');
      inner.style.setProperty('--rx', (-v * 14).toFixed(1) + 'deg');
      inner.style.setProperty('--sx', (100 - (u + 0.5) * 100).toFixed(0) + '%');
      inner.style.setProperty('--so', '1');
    });
    pcard.addEventListener('pointerleave', function () {
      inner.style.setProperty('--ry', '0deg'); inner.style.setProperty('--rx', '0deg'); inner.style.setProperty('--so', '0');
    });
  }

  /* ── the attack log, counted once ────────────────────────────────────────
   * field-data.js is red-team-simulator/results/attack_log.jsonl packed four
   * characters per line: technique index (2, base36), target index, outcome.
   */

  var RUN = window.ATTACK_RUN;
  var N = RUN ? RUN.log.length / 4 : 0;
  var tally = RUN ? RUN.targets.map(function () { return { n: 0, hit: 0 }; }) : [];
  var total = { n: N, hit: 0 };
  for (var q = 0; q < N; q++) {
    var tq = +RUN.log.charAt(q * 4 + 2);
    tally[tq].n++;
    if (RUN.log.charAt(q * 4 + 3) === '1') { tally[tq].hit++; total.hit++; }
  }
  var GUARD = [0, 1, 2].map(function (i) { return tally[i] || [{ n: 461, hit: 46 }, { n: 461, hit: 11 }, { n: 201, hit: 2 }][i]; });

  /* ── agent lab: defend the agent ─────────────────────────────────────────
   * Requests and attacks ride a winding track through three gates to the
   * agent. Each gate's odds are a published measurement:
   *   Rules      catch 16.2% of attacks, wrongly stop 2.1% of requests
   *   LLM judge  takes the total to about 62% caught, about 4% wrongly stopped
   *   Guardrail  the share of attacks that land, from the attack log
   * A bare model shrugs off most attacks on its own; the log says how many.
   */

  var game = $('#game');
  if (game && $('#board')) (function () {
    var board = $('#board'), marksG = $('#marks'), fxG = $('#fx');
    var P = [[70, 80], [900, 80], [900, 190], [180, 190], [180, 300], [1030, 300]];
    var cum = [0];
    for (var i = 1; i < P.length; i++) cum.push(cum[i - 1] + Math.abs(P[i][0] - P[i - 1][0]) + Math.abs(P[i][1] - P[i - 1][1]));
    var TOTAL = cum[cum.length - 1];
    function at(d) {
      for (var k = 1; k < P.length; k++) {
        if (d <= cum[k] || k === P.length - 1) {
          var t = Math.max(0, Math.min(1, (d - cum[k - 1]) / (cum[k] - cum[k - 1])));
          return [P[k - 1][0] + (P[k][0] - P[k - 1][0]) * t, P[k - 1][1] + (P[k][1] - P[k - 1][1]) * t];
        }
      }
      return P[0];
    }
    var G = { rules: 260, judge: 570, guard: 1300, agent: 2190 };
    var ODDS = { rules: 0.162, rulesFA: 0.021, judge: 0.547, judgeFA: 0.019 };
    var bare = GUARD[0].hit / GUARD[0].n;
    function guardBlock(g) { return g ? 1 - (GUARD[g].hit / GUARD[g].n) / bare : 0; }

    var st = { rules: true, judge: false, guard: 0 };
    try {
      var saved = JSON.parse(load('def') || 'null');
      if (saved && typeof saved.rules === 'boolean') { st.rules = saved.rules; st.judge = !!saved.judge; st.guard = saved.guard === 1 || saved.guard === 2 ? saved.guard : 0; }
    } catch (e) { /* ignore */ }

    var run, marks = [], seeding = false, spawnT = 0, overTimer;
    var el = { served: $('#stServed'), blocked: $('#stBlocked'), eaten: $('#stEaten'), leaked: $('#stLeaked'), fa: $('#stFalse'),
               hearts: $('#hearts'), over: $('#gameOver'), overLine: $('#overLine'), say: $('#gameSay'), guardName: $('#guardName') };
    var hearts = [];
    if (PIX && el.hearts) for (var h = 0; h < 3; h++) { var hv = PIX.iconSVG('heart'); el.hearts.appendChild(hv); hearts.push(hv); }
    if (PIX && $('#agentFace')) {
      var face = PIX.iconSVG('bot');
      face.setAttribute('width', 50); face.setAttribute('height', 50);
      $('#agentFace').appendChild(face);
    }

    function reset() {
      run = { hearts: 3, served: 0, blocked: 0, eaten: 0, leaked: 0, fa: 0, time: 0, over: false };
      marks.forEach(function (m) { marksG.removeChild(m.el); });
      marks = []; spawnT = 0;
      if (el.over) el.over.hidden = true;
      clearTimeout(overTimer);
      seeding = true;
      for (var s = 0; s < 150; s++) step(0.1);
      seeding = false;
      run.time = 0;
      hud();
    }

    function hud() {
      el.served.textContent = run.served; el.blocked.textContent = run.blocked; el.eaten.textContent = run.eaten;
      el.leaked.textContent = run.leaked; el.fa.textContent = run.fa;
      hearts.forEach(function (hv, i2) { hv.classList.toggle('is-gone', i2 >= run.hearts); });
    }

    function pop(x, y, color) {
      if (seeding || reduce) return;
      var c = document.createElementNS(SVGNS, 'circle');
      c.setAttribute('cx', x); c.setAttribute('cy', y); c.setAttribute('r', 12);
      c.setAttribute('class', 'pop'); c.style.setProperty('--c', color);
      fxG.appendChild(c);
      setTimeout(function () { if (c.parentNode) fxG.removeChild(c); }, 460);
    }
    function kill(m, color) {
      var p = at(m.d);
      pop(p[0], p[1], color);
      marksG.removeChild(m.el);
      marks.splice(marks.indexOf(m), 1);
    }

    function spawn() {
      var atk = Math.random() < Math.min(0.46, 0.3 + run.time / 300);
      var g = document.createElementNS(SVGNS, 'g');
      var r = document.createElementNS(SVGNS, 'rect');
      r.setAttribute('x', -8); r.setAttribute('y', -8); r.setAttribute('width', 16); r.setAttribute('height', 16);
      r.setAttribute('rx', atk ? 1 : 4);
      if (atk) r.setAttribute('transform', 'rotate(45)');
      g.setAttribute('class', atk ? 'mk mk--atk' : 'mk');
      g.appendChild(r); marksG.appendChild(g);
      marks.push({ d: 0, atk: atk, el: g, wait: 0, judging: false, done: false });
    }

    function hit() {
      run.leaked++;
      if (seeding) return;
      run.hearts--;
      game.classList.add('is-hit');
      setTimeout(function () { game.classList.remove('is-hit'); }, 320);
      if (run.hearts <= 0) {
        run.over = true;
        if (el.overLine) el.overLine.textContent = 'It served ' + fmt(run.served) + ' requests first. Switch on a defense, or eat faster.';
        if (el.over) el.over.hidden = false;
        overTimer = setTimeout(reset, 9000);
      }
    }

    function judgeVerdict(m) {
      m.judging = false;
      if (m.atk && Math.random() < ODDS.judge) { if (!seeding) run.blocked++; kill(m, '#35c8ff'); return true; }
      if (!m.atk && Math.random() < ODDS.judgeFA) { if (!seeding) run.fa++; kill(m, '#35c8ff'); return true; }
      return false;
    }

    function step(dt) {
      if (run.over) return;
      run.time += dt; spawnT += dt;
      var gap = Math.max(0.5, 0.78 - run.time / 400);
      if (spawnT >= gap) { spawnT = 0; spawn(); }

      for (var k = marks.length - 1; k >= 0; k--) {
        var m = marks[k];
        if (m.wait > 0) {
          m.wait -= dt;
          if (m.wait <= 0 && m.judging && judgeVerdict(m)) continue;
          if (m.wait > 0) continue;
        }
        var prev = m.d;
        m.d += 122 * dt;
        function crossed(g2) { return prev < g2 && m.d >= g2; }

        if (st.rules && crossed(G.rules)) {
          if (m.atk && Math.random() < ODDS.rules) { if (!seeding) run.blocked++; kill(m, '#a26bff'); continue; }
          if (!m.atk && Math.random() < ODDS.rulesFA) { if (!seeding) run.fa++; kill(m, '#a26bff'); continue; }
        }
        if (st.judge && crossed(G.judge)) { m.d = G.judge; m.wait = 0.75; m.judging = true; }
        if (st.guard && m.atk && crossed(G.guard) && Math.random() < guardBlock(st.guard)) { if (!seeding) run.blocked++; kill(m, '#ff4fa3'); continue; }
        if (crossed(G.agent)) {
          if (m.atk) {
            if (Math.random() < bare) { kill(m, '#ffffff'); hit(); } else { if (!seeding) run.blocked++; kill(m, '#9d99cc'); }
            continue;
          }
          m.done = true; m.el.setAttribute('class', 'mk mk--done');
          if (!seeding) run.served++;
        }
        if (m.d >= TOTAL) { marksG.removeChild(m.el); marks.splice(k, 1); }
      }
    }

    function draw() {
      for (var k = 0; k < marks.length; k++) {
        var p = at(marks[k].d);
        marks[k].x = p[0]; marks[k].y = p[1];
        marks[k].el.setAttribute('transform', 'translate(' + p[0].toFixed(1) + ' ' + p[1].toFixed(1) + ')');
      }
      hud();
    }

    /* the cursor eats attacks */
    var pt = board.createSVGPoint ? board.createSVGPoint() : null;
    function eat(e) {
      if (!pt || run.over) return;
      var ctm = board.getScreenCTM();
      if (!ctm) return;
      pt.x = e.clientX; pt.y = e.clientY;
      var loc = pt.matrixTransform(ctm.inverse());
      var reach = e.pointerType === 'mouse' ? 26 : 44;
      for (var k = marks.length - 1; k >= 0; k--) {
        var m = marks[k];
        if (!m.atk || m.x === undefined) continue;
        if (Math.abs(m.x - loc.x) < reach && Math.abs(m.y - loc.y) < reach) {
          run.eaten++; kill(m, '#ffd447');
          chomp(); addXP(5); unlock('eater');
        }
      }
    }
    board.addEventListener('pointermove', eat);
    board.addEventListener('pointerdown', eat);

    /* controls */
    var GNAME = ['none', 'Bedrock Guardrails', 'NeMo Guardrails'];
    var guardGroup = radioGroup($('#guardSel'), function (b) { st.guard = +b.getAttribute('data-g'); apply(true); });

    function sentence() {
      var s;
      if (st.rules && st.judge) s = 'Rules plus an LLM judge: about 62% of attacks are caught before they reach the model. The price is the wait at the judge, and the odd false alarm.';
      else if (st.rules) s = 'Rules only: instant, but they catch about 1 attack in 6.';
      else if (st.judge) s = 'Judge with no rules in front: it catches about half, and every single request waits for it.';
      else s = 'No filters at all. Everything walks straight up to the model.';
      if (st.guard === 1) s += ' Bedrock Guardrails cut what lands by about ' + Math.round(guardBlock(1) * 100) + '%.';
      else if (st.guard === 2) s += ' NeMo Guardrails cut what lands by about ' + Math.round(guardBlock(2) * 100) + '%.';
      else s += ' With no guardrail, a bare model lets about 1 attack in 10 land. Start eating.';
      return s;
    }

    function apply(user) {
      $('#swRules').setAttribute('aria-checked', String(st.rules));
      $('#swJudge').setAttribute('aria-checked', String(st.judge));
      $('#gRules').classList.toggle('is-off', !st.rules);
      $('#gJudge').classList.toggle('is-off', !st.judge);
      $('#gGuard').classList.toggle('is-off', !st.guard);
      if (el.guardName) el.guardName.textContent = st.guard ? (st.guard === 1 ? 'Bedrock' : 'NeMo') : 'none';
      $('#gGuard').setAttribute('aria-label', 'Guardrail: ' + GNAME[st.guard]);
      guardGroup.mark(guardGroup.buttons[st.guard]);
      if (el.say) el.say.textContent = sentence();
      if (user) {
        save('def', JSON.stringify(st));
        if (!st.rules && !st.judge && !st.guard) unlock('hard');
      }
    }
    function flip(k) {
      if (k === 'guard') st.guard = (st.guard + 1) % 3; else st[k] = !st[k];
      apply(true);
    }
    $('#swRules').addEventListener('click', function () { flip('rules'); });
    $('#swJudge').addEventListener('click', function () { flip('judge'); });
    $$('.gate[data-sw]', board).forEach(function (g) { g.addEventListener('click', function () { flip(g.getAttribute('data-sw')); }); });
    if ($('#retry')) $('#retry').addEventListener('click', reset);

    apply(false);
    reset(); draw();

    if (!reduce) {
      var running = false, visible = false, last = 0;
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
      if (hasIO) new IntersectionObserver(function (en) { visible = en[0].isIntersecting; setRunning(); }, { threshold: 0.1 }).observe(game);
      else visible = true;
      document.addEventListener('visibilitychange', setRunning);
      setRunning();
    }
  })();

  /* ── loadout: pick a slot, read the item ─────────────────────────────── */

  var inv = $('#inv'), invPanel = $('#invPanel');
  if (inv && invPanel && PIX) (function () {
    var slots = $$('.slot', inv);
    function pick(btn, user) {
      slots.forEach(function (s) { s.setAttribute('aria-pressed', String(s === btn)); });
      invPanel.textContent = '';
      invPanel.style.setProperty('--c', getComputedStyle(btn).color);
      var ico = document.createElement('div'); ico.className = 'inv__ico';
      ico.appendChild(PIX.iconSVG(btn.getAttribute('data-ico')));
      var h = document.createElement('h3'); h.textContent = $('span', btn).textContent;
      var d = btn.parentNode.querySelector('.slot__d').cloneNode(true);
      invPanel.appendChild(ico); invPanel.appendChild(h); invPanel.appendChild(d);
      if (user) unlock('inspect');
    }
    slots.forEach(function (s) { s.addEventListener('click', function () { pick(s, true); }); });
    pick(slots[0], false);
  })();

  /* ── boss-fight switches ─────────────────────────────────────────────── */

  $$('[data-selector]').forEach(function (boss) {
    var glasses = $('.glasses', boss), tubes = $$('.glass__tube i', boss);
    function setPos(pos) {
      boss.setAttribute('data-pos', pos);
      if (glasses) glasses.setAttribute('data-pos', pos);
      tubes.forEach(function (i) { i.style.width = i.getAttribute('data-w').split(',')[pos] + '%'; });
    }
    radioGroup($('.seg', boss), function (b) { setPos(+b.getAttribute('data-pos')); });
    setPos(0);
  });

  /* ── the attack grid: one square per line of the log ─────────────────── */

  var canvas = $('#attackField');
  if (RUN && canvas && canvas.getContext) (function () {
    var B36 = '0123456789abcdefghijklmnopqrstuvwxyz';
    var ctx = canvas.getContext('2d');
    var tip = $('#fieldTip');
    var selected = -1, hover = -1, L = null;
    var NAMES = ['Bedrock, bare', 'Bedrock + Bedrock Guardrails', 'Bedrock + NeMo Guardrails', 'Claude', 'Azure OpenAI', 'Aria', 'Firewall'];

    function rec(i) {
      var o = i * 4;
      return { tech: RUN.techs[B36.indexOf(RUN.log.charAt(o)) * 36 + B36.indexOf(RUN.log.charAt(o + 1))],
               target: +RUN.log.charAt(o + 2), hit: RUN.log.charAt(o + 3) === '1' };
    }
    function measure() {
      var w = canvas.clientWidth;
      if (!w) return null;
      var cell = w > 620 ? 8 : (w > 420 ? 6 : 5), gap = w > 420 ? 3 : 2, pad = w > 420 ? 14 : 10;
      var stepPx = cell + gap;
      var cols = Math.max(16, Math.floor((w - pad * 2 + gap) / stepPx));
      return { w: w, pad: pad, cell: cell, step: stepPx, cols: cols, h: Math.ceil(N / cols) * stepPx - gap + pad * 2,
               dpr: Math.min(window.devicePixelRatio || 1, 2) };
    }
    function paint() {
      if (!L) return;
      ctx.setTransform(L.dpr, 0, 0, L.dpr, 0, 0);
      ctx.clearRect(0, 0, L.w, L.h);
      for (var pass = 0; pass < 2; pass++) {
        for (var i = 0; i < N; i++) {
          var hit = RUN.log.charAt(i * 4 + 3) === '1';
          if ((pass === 1) !== hit) continue;
          var on = selected < 0 || selected === +RUN.log.charAt(i * 4 + 2);
          ctx.globalAlpha = on ? 1 : 0.18;
          ctx.shadowBlur = hit && on ? 9 : 0; ctx.shadowColor = '#ff4fa3';
          ctx.fillStyle = hit ? '#ff6fb5' : '#2d2d68';
          ctx.fillRect(L.pad + (i % L.cols) * L.step, L.pad + Math.floor(i / L.cols) * L.step, L.cell, L.cell);
        }
      }
      ctx.shadowBlur = 0; ctx.globalAlpha = 1;
      if (hover >= 0) {
        ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.5;
        ctx.strokeRect(L.pad + (hover % L.cols) * L.step - 2, L.pad + Math.floor(hover / L.cols) * L.step - 2, L.cell + 4, L.cell + 4);
      }
    }
    function relayout() {
      var m = measure();
      if (!m) return;
      L = m;
      canvas.style.height = L.h + 'px';
      canvas.width = Math.round(L.w * L.dpr); canvas.height = Math.round(L.h * L.dpr);
      paint();
    }
    function readout() {
      var s = selected < 0 ? total : tally[selected];
      $('#rtN').textContent = fmt(s.n); $('#rtHit').textContent = fmt(s.hit); $('#rtRate').textContent = pct(s.hit, s.n);
    }
    radioGroup($('#manifold'), function (b) { selected = +b.getAttribute('data-target'); readout(); paint(); unlock('red'); });

    function clear() { if (hover === -1) return; hover = -1; if (tip) tip.classList.remove('is-on'); paint(); }
    function point(e) {
      if (!L || !tip) return;
      var r = canvas.getBoundingClientRect();
      var x = e.clientX - r.left - L.pad, y = e.clientY - r.top - L.pad;
      var col = Math.floor(x / L.step), i = Math.floor(y / L.step) * L.cols + col;
      if (!(x >= 0 && y >= 0 && col < L.cols && i >= 0 && i < N)) { clear(); return; }
      if (i !== hover) {
        hover = i;
        var d = rec(i);
        tip.textContent = '';
        var b = document.createElement('b'); b.textContent = d.tech[1];
        var line = document.createElement('span'); line.textContent = NAMES[d.target] + ' · ' + d.tech[2] + ' severity';
        var verdict = document.createElement('span');
        verdict.className = d.hit ? 'v-hit' : 'v-blk'; verdict.textContent = d.hit ? 'Got through' : 'Blocked';
        tip.appendChild(b); tip.appendChild(line); tip.appendChild(document.createElement('br')); tip.appendChild(verdict);
        tip.classList.add('is-on');
        paint();
      }
      var tw = tip.offsetWidth || 220;
      tip.style.left = Math.max(0, Math.min(L.w - tw, e.clientX - r.left - tw / 2)) + 'px';
      tip.style.top = (e.clientY - r.top - tip.offsetHeight - 14) + 'px';
    }
    canvas.addEventListener('pointermove', point);
    canvas.addEventListener('pointerdown', point);
    canvas.addEventListener('pointerleave', function (e) { if (e.pointerType === 'mouse') clear(); });

    var rt;
    window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(relayout, 140); });
    relayout(); readout();
  })();

  /* ── off the clock: built from the lists in me.js ────────────────────── */

  var ME = window.ME || {};
  function chips(host, names) {
    host.textContent = '';
    names.forEach(function (name, i) {
      var b = document.createElement('button');
      b.type = 'button'; b.setAttribute('role', 'radio'); b.setAttribute('aria-checked', String(i === 0));
      b.textContent = name; b.setAttribute('data-i', i);
      host.appendChild(b);
    });
  }

  var sportsBox = $('#sports'), boardNow = $('#boardNow');
  if (sportsBox && boardNow) (function () {
    var list = (ME.sports && ME.sports.length) ? ME.sports : ['Basketball', 'Hockey', 'Football', 'Tennis', 'Skateboarding'];
    chips(sportsBox, list);
    boardNow.textContent = list[0];
    var hands = true, i = 0;
    var group = radioGroup(sportsBox, function (b) { boardNow.textContent = b.textContent; i = group.buttons.indexOf(b); hands = false; });
    if (!reduce) setInterval(function () {
      if (!hands || document.hidden) return;
      i = (i + 1) % group.buttons.length;
      group.mark(group.buttons[i]);
      boardNow.textContent = group.buttons[i].textContent;
    }, 2600);
  })();

  var eq = $('#eq'), genresBox = $('#genres');
  if (eq && genresBox) (function () {
    var FEEL = {
      heavy:  { speed: 11,  base: 0.42, amp: 0.58, jag: 2.9, bass: 0,    color: '#ffffff' },
      bass:   { speed: 3.2, base: 0.16, amp: 0.5,  jag: 0.8, bass: 0.8,  color: '#7dffb8' },
      bounce: { speed: 5.2, base: 0.3,  amp: 0.6,  jag: 1.1, bass: 0.2,  color: '#7fe6ff' },
      chill:  { speed: 2.3, base: 0.3,  amp: 0.4,  jag: 0.5, bass: 0,    color: '#ffd447' },
      wild:   { speed: 8,   base: 0.25, amp: 0.75, jag: 4.3, bass: 0.4,  color: '#ffb3e6' }
    };
    var list = (ME.genres && ME.genres.length) ? ME.genres : [{ name: 'Metal', feel: 'heavy' }, { name: 'Rap', feel: 'bass' }, { name: 'Pop', feel: 'bounce' }, { name: 'Country', feel: 'chill' }];
    chips(genresBox, list.map(function (g) { return g.name; }));

    var BARS = 20, bars = [];
    for (var b = 0; b < BARS; b++) { var bar = document.createElement('i'); eq.appendChild(bar); bars.push(bar); }
    var cur = FEEL[list[0].feel] || FEEL.bounce;

    function draw(t) {
      for (var i = 0; i < BARS; i++) {
        var wave = Math.abs(Math.sin(t * cur.speed * 0.5 + i * cur.jag)) * (0.55 + 0.45 * Math.sin(t * cur.speed * 0.23 + i * 0.7));
        var kick = cur.bass * Math.max(0, 1 - i / 6) * Math.pow(Math.abs(Math.sin(t * cur.speed * 0.5)), 6);
        var hgt = Math.max(0.06, Math.min(1, cur.base * 0.5 + cur.amp * wave + kick));
        bars[i].style.transform = 'scaleY(' + hgt.toFixed(3) + ')';
        bars[i].style.background = cur.color;
      }
    }
    radioGroup(genresBox, function (btn) {
      cur = FEEL[list[+btn.getAttribute('data-i')].feel] || FEEL.bounce;
      if (reduce) draw(1.3);
      unlock('dj');
    });

    draw(1.3);
    if (!reduce) {
      var on = false, visible = false;
      var frame = function (ts) { if (!on) return; draw(ts / 1000); requestAnimationFrame(frame); };
      var setOn = function () {
        var want = visible && !document.hidden;
        if (want === on) return;
        on = want;
        if (on) requestAnimationFrame(frame);
      };
      if (hasIO) new IntersectionObserver(function (en) { visible = en[0].isIntersecting; setOn(); }, { threshold: 0.1 }).observe(eq);
      else visible = true;
      document.addEventListener('visibilitychange', setOn);
      setOn();
    }
  })();

  /* ── off the clock: the cheat code ───────────────────────────────────── */

  (function () {
    var SEQ = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
    var pos = 0;
    var dots = $$('#padDots i'), msg = $('#padMsg');
    function paint() { dots.forEach(function (d, i) { d.classList.toggle('is-on', i < pos); }); }
    function feed(key, fromPad) {
      var k = key.length === 1 ? key.toLowerCase() : key;
      if (k === SEQ[pos]) pos++;
      else if (k === 'ArrowUp' && pos === 2) pos = 2;
      else pos = (k === SEQ[0]) ? 1 : 0;
      if (fromPad || pos > 2) paint();
      if (pos === SEQ.length) {
        var on = root.classList.toggle('rgb');
        if (msg) msg.textContent = on ? 'RGB mode on. Enter it again to turn it off.' : 'RGB mode off.';
        unlock('cheat');
        setTimeout(function () { pos = 0; paint(); }, 900);
      }
    }
    $$('#pad button').forEach(function (b) {
      b.addEventListener('click', function () {
        b.classList.add('is-hit');
        setTimeout(function () { b.classList.remove('is-hit'); }, 140);
        feed(b.getAttribute('data-k'), true);
      });
    });
    document.addEventListener('keydown', function (e) {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.target && e.target.id === 'world') return;       /* the street has its own arrow keys */
      feed(e.key, false);
    });
  })();

  /* ── copy the address ────────────────────────────────────────────────── */

  var copyBtn = $('#copyMail');
  if (copyBtn) {
    var copyLabel = $('#copyLabel');
    var selectAddr = function () {
      var range = document.createRange();
      range.selectNodeContents($('#mailLink'));
      var sel = window.getSelection();
      sel.removeAllRanges(); sel.addRange(range);
    };
    copyBtn.addEventListener('click', function () {
      var addr = $('#mailLink').textContent.trim();
      var done = function (ok) {
        copyLabel.textContent = ok ? 'Copied' : 'Press Ctrl+C to copy';
        setTimeout(function () { copyLabel.textContent = 'Copy address'; }, 2200);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(addr).then(function () { done(true); }, function () { selectAddr(); done(false); });
      } else { selectAddr(); done(false); }
    });
  }
})();
