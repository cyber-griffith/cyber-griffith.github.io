/* Hand-drawn pixels: a 5x7 lettering set and a handful of 12x12 icons.
 * Nothing here is an image file. Every letter and icon is a little bitmap
 * typed out by hand, so it can be drawn into SVG or onto a canvas at any size.
 */
(function () {
  'use strict';

  var F = {
    'A': '01110 10001 10001 11111 10001 10001 10001',
    'B': '11110 10001 10001 11110 10001 10001 11110',
    'C': '01110 10001 10000 10000 10000 10001 01110',
    'D': '11110 10001 10001 10001 10001 10001 11110',
    'E': '11111 10000 10000 11110 10000 10000 11111',
    'F': '11111 10000 10000 11110 10000 10000 10000',
    'G': '01110 10001 10000 10111 10001 10001 01110',
    'H': '10001 10001 10001 11111 10001 10001 10001',
    'I': '11111 00100 00100 00100 00100 00100 11111',
    'J': '00111 00010 00010 00010 00010 10010 01100',
    'K': '10001 10010 10100 11000 10100 10010 10001',
    'L': '10000 10000 10000 10000 10000 10000 11111',
    'M': '10001 11011 10101 10101 10001 10001 10001',
    'N': '10001 11001 10101 10011 10001 10001 10001',
    'O': '01110 10001 10001 10001 10001 10001 01110',
    'P': '11110 10001 10001 11110 10000 10000 10000',
    'Q': '01110 10001 10001 10001 10101 10010 01101',
    'R': '11110 10001 10001 11110 10100 10010 10001',
    'S': '01111 10000 10000 01110 00001 00001 11110',
    'T': '11111 00100 00100 00100 00100 00100 00100',
    'U': '10001 10001 10001 10001 10001 10001 01110',
    'V': '10001 10001 10001 10001 10001 01010 00100',
    'W': '10001 10001 10001 10101 10101 11011 10001',
    'X': '10001 10001 01010 00100 01010 10001 10001',
    'Y': '10001 10001 01010 00100 00100 00100 00100',
    'Z': '11111 00001 00010 00100 01000 10000 11111',
    '0': '01110 10001 10011 10101 11001 10001 01110',
    '1': '00100 01100 00100 00100 00100 00100 01110',
    '2': '01110 10001 00001 00010 00100 01000 11111',
    '3': '11110 00001 00001 01110 00001 00001 11110',
    '4': '10001 10001 10001 11111 00001 00001 00001',
    '5': '11111 10000 11110 00001 00001 10001 01110',
    '6': '01110 10000 10000 11110 10001 10001 01110',
    '7': '11111 00001 00010 00100 00100 00100 00100',
    '8': '01110 10001 10001 01110 10001 10001 01110',
    '9': '01110 10001 10001 01111 00001 00001 01110',
    '.': '00000 00000 00000 00000 00000 00000 00100',
    ',': '00000 00000 00000 00000 00000 00100 01000',
    ':': '00000 00100 00000 00000 00000 00100 00000',
    '!': '00100 00100 00100 00100 00100 00000 00100',
    '?': '01110 10001 00001 00010 00100 00000 00100',
    '/': '00001 00001 00010 00100 01000 10000 10000',
    '+': '00000 00100 00100 11111 00100 00100 00000',
    '-': '00000 00000 00000 11111 00000 00000 00000',
    '&': '01100 10010 10100 01000 10101 10010 01101',
    '%': '11001 11010 00010 00100 01000 01011 10011',
    "'": '00100 00100 00000 00000 00000 00000 00000',
    ' ': '00000 00000 00000 00000 00000 00000 00000'
  };
  var GLYPH = {};
  Object.keys(F).forEach(function (c) { GLYPH[c] = F[c].split(' '); });

  var ICONS = {
    bot: [
      '....#..#....', '....#..#....', '..########..', '.#........#.', '.#.##..##.#.', '.#.##..##.#.',
      '.#........#.', '.#..####..#.', '.#........#.', '..########..', '...#....#...', '..##....##..'],
    gear: [
      '....####....', '.#..####..#.', '.##########.', '..###..###..', '####....####', '####....####',
      '####....####', '####....####', '..###..###..', '.##########.', '.#..####..#.', '....####....'],
    sword: [
      '.........###', '........####', '.......####.', '......####..', '.....####...', '#...####....',
      '##.####.....', '.#####......', '..###.......', '.#####......', '##...##.....', '#.....#.....'],
    shield: [
      '############', '############', '##........##', '##...##...##', '##...##...##', '##.######.##',
      '##.######.##', '.#...##...#.', '.##..##..##.', '..##....##..', '...######...', '....####....'],
    book: [
      '.#######....', '.#.....#....', '.#.###.#....', '.#.....#....', '.#.###.####.', '.#....#....#',
      '.#.##.#....#', '.#....#....#', '.######....#', '.......####.', '..........##', '...........#'],
    check: [
      '############', '#..........#', '#.........##', '#........###', '#.......###.', '#.#....###.#',
      '#.##..###..#', '#.######...#', '#..####....#', '#...##.....#', '#..........#', '############'],
    chart: [
      '#...........', '#.........##', '#.........##', '#......##.##', '#......##.##', '#...##.##.##',
      '#...##.##.##', '#.#.##.##.##', '#.#.##.##.##', '#.#.##.##.##', '#...........', '############'],
    scroll: [
      '.##########.', '#..........#', '#.########.#', '.#........#.', '.#.######.#.', '.#........#.',
      '.#.######.#.', '.#........#.', '.#.####...#.', '#..........#', '#.########.#', '.##########.'],
    cloud: [
      '............', '.....###....', '...#######..', '..#########.', '.###########', '############',
      '############', '.##########.', '............', '..#..#..#...', '.#..#..#....', '............'],
    bug: [
      '..#......#..', '...#....#...', '...######...', '..########..', '#.##.##.##.#', '.##########.',
      '..########..', '###.####.###', '..########..', '.#.######.#.', '#...####...#', '............'],
    heart: [
      '............', '..###..###..', '.##########.', '############', '############', '############',
      '.##########.', '..########..', '...######...', '....####....', '.....##.....', '............'],
    gem: [
      '............', '....####....', '...######...', '..########..', '.##########.', '############',
      '.##########.', '..########..', '...######...', '....####....', '.....##.....', '............'],
    trophy: [
      '..########..', '############', '#.########.#', '#.########.#', '.#.######.#.', '..########..',
      '...######...', '....####....', '.....##.....', '.....##.....', '...######...', '..########..'],
    mail: [
      '............', '############', '##........##', '#.#......#.#', '#..#....#..#', '#...#..#...#',
      '#....##....#', '#..........#', '#..........#', '############', '............', '............']
  };

  var NS = 'http://www.w3.org/2000/svg';

  /* horizontal runs keep the rect count down */
  function runs(rows, on, emit) {
    for (var y = 0; y < rows.length; y++) {
      var row = rows[y], x = 0;
      while (x < row.length) {
        if (row.charAt(x) !== on) { x++; continue; }
        var start = x;
        while (x < row.length && row.charAt(x) === on) x++;
        emit(start, y, x - start);
      }
    }
  }

  function wordSVG(word) {
    var svg = document.createElementNS(NS, 'svg');
    var w = word.length * 6 - 1;
    svg.setAttribute('viewBox', '0 0 ' + w + ' 7');
    svg.setAttribute('class', 'pixw');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('shape-rendering', 'crispEdges');
    svg.style.aspectRatio = w + ' / 7';
    var d = '';
    for (var i = 0; i < word.length; i++) {
      var g = GLYPH[word.charAt(i)] || GLYPH['?'];
      (function (ox) {
        runs(g, '1', function (x, y, len) { d += 'M' + (ox + x) + ' ' + y + 'h' + len + 'v1h-' + len + 'z'; });
      })(i * 6);
    }
    var p = document.createElementNS(NS, 'path');
    p.setAttribute('d', d);
    p.setAttribute('fill', 'currentColor');
    svg.appendChild(p);
    return svg;
  }

  function iconSVG(name) {
    var rows = ICONS[name] || ICONS.gem;
    var svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', '0 0 12 12');
    svg.setAttribute('class', 'pixi');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('shape-rendering', 'crispEdges');
    var d = '';
    runs(rows, '#', function (x, y, len) { d += 'M' + x + ' ' + y + 'h' + len + 'v1h-' + len + 'z'; });
    var p = document.createElementNS(NS, 'path');
    p.setAttribute('d', d);
    p.setAttribute('fill', 'currentColor');
    svg.appendChild(p);
    return svg;
  }

  /* swap the text of every [data-pix] element for pixel lettering, one svg
     per word so lines still wrap; the real text stays as the label */
  function apply(root) {
    var els = (root || document).querySelectorAll('[data-pix]');
    Array.prototype.forEach.call(els, function (el) {
      var text = el.textContent.replace(/\s+/g, ' ').trim();
      if (!text) return;
      el.setAttribute('aria-label', text);
      if (!el.getAttribute('role') && !/^(H[1-6]|A|BUTTON)$/.test(el.tagName)) el.setAttribute('role', 'img');
      el.textContent = '';
      text.toUpperCase().split(' ').forEach(function (word) { el.appendChild(wordSVG(word)); });
      el.classList.add('pix');
    });
    var ics = (root || document).querySelectorAll('[data-ico]');
    Array.prototype.forEach.call(ics, function (el) {
      if (el.querySelector('.pixi')) return;
      el.insertBefore(iconSVG(el.getAttribute('data-ico')), el.firstChild);
    });
  }

  /* canvas versions, used by the block */
  function drawText(ctx, str, x, y, color, scale) {
    scale = scale || 1;
    ctx.fillStyle = color;
    str = str.toUpperCase();
    for (var i = 0; i < str.length; i++) {
      var g = GLYPH[str.charAt(i)] || GLYPH['?'];
      (function (ox) {
        runs(g, '1', function (gx, gy, len) { ctx.fillRect(ox + gx * scale, y + gy * scale, len * scale, scale); });
      })(x + i * 6 * scale);
    }
  }
  function textWidth(str, scale) { return (str.length * 6 - 1) * (scale || 1); }
  function drawIcon(ctx, name, x, y, color, scale) {
    scale = scale || 1;
    ctx.fillStyle = color;
    runs(ICONS[name] || ICONS.gem, '#', function (gx, gy, len) { ctx.fillRect(x + gx * scale, y + gy * scale, len * scale, scale); });
  }

  window.PIX = { apply: apply, wordSVG: wordSVG, iconSVG: iconSVG, drawText: drawText, textWidth: textWidth, drawIcon: drawIcon };
})();
