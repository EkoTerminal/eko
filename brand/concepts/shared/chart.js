// Shared, deterministic chart drawing for the concept boards (no data, no network).
// Each concept styles it differently; the helpers only produce geometry.
(function () {
  function rng(seed) {
    let s = seed >>> 0;
    return () => ((s = (s * 1664525 + 1013904223) >>> 0), s / 4294967296);
  }

  /** Random-walk OHLC with a gentle dip then recovery; the "signal" candle sits near the end. */
  function series(n = 48, seed = 46630, base = 100) {
    const r = rng(seed);
    const out = [];
    let p = base;
    for (let i = 0; i < n; i++) {
      const t = i / n;
      const drift = t < 0.55 ? -0.9 : t < 0.78 ? -0.1 : 0.7;
      const o = p;
      const c = o + drift + (r() - 0.5) * 3.6;
      out.push({ o, c, h: Math.max(o, c) + r() * 1.8, l: Math.min(o, c) - r() * 1.8, v: 0.3 + r() * 0.7 });
      p = c;
    }
    return out;
  }

  /**
   * candlesSVG({ w, h, n, seed, up, down, wick, grid, style, volume, pad, glow, signalAt })
   * style: 'candle' | 'hollow' | 'bar' | 'area' | 'dots'
   * Returns { svg, pt(i, price) → [x, y], data } so concepts can pin signals exactly.
   */
  function candlesSVG(o = {}) {
    const { w = 800, h = 360, n = 48, seed = 46630, up = '#2de39e', down = '#ff5a4f', wick, grid = 'rgba(255,255,255,.06)', style = 'candle', volume = false, pad = 18, glow = false, lineColor, areaFrom, areaTo, strokeW = 1.6, radius = 1.5 } = o;
    const d = series(n, seed);
    const volH = volume ? h * 0.18 : 0;
    const hi = Math.max(...d.map((k) => k.h));
    const lo = Math.min(...d.map((k) => k.l));
    const y = (v) => pad + ((hi - v) / (hi - lo)) * (h - pad * 2 - volH);
    const step = (w - pad * 2) / n;
    const x = (i) => pad + i * step + step / 2;
    let s = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">`;
    if (glow) s += `<defs><filter id="g${seed}" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>`;
    if (grid) for (let i = 1; i < 5; i++) s += `<line x1="0" x2="${w}" y1="${(h - volH) * (i / 5)}" y2="${(h - volH) * (i / 5)}" stroke="${grid}" stroke-width="1"/>`;
    if (style === 'area' || style === 'line') {
      const pts = d.map((k, i) => `${x(i).toFixed(1)},${y(k.c).toFixed(1)}`).join(' ');
      if (style === 'area') {
        s += `<defs><linearGradient id="a${seed}" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="${areaFrom || up}" stop-opacity=".45"/><stop offset="1" stop-color="${areaTo || up}" stop-opacity="0"/></linearGradient></defs>`;
        s += `<polygon points="${x(0)},${h - volH} ${pts} ${x(n - 1)},${h - volH}" fill="url(#a${seed})"/>`;
      }
      s += `<polyline points="${pts}" fill="none" stroke="${lineColor || up}" stroke-width="${strokeW + 1}" stroke-linejoin="round" stroke-linecap="round" ${glow ? `filter="url(#g${seed})"` : ''}/>`;
    } else {
      d.forEach((k, i) => {
        const isUp = k.c >= k.o;
        const col = isUp ? up : down;
        const top = y(Math.max(k.o, k.c));
        const bh = Math.max(2, Math.abs(y(k.o) - y(k.c)));
        const bw = style === 'bar' ? 2 : step * 0.62;
        if (style === 'dots') {
          s += `<circle cx="${x(i)}" cy="${y(k.c)}" r="${step * 0.26}" fill="${col}"/>`;
          return;
        }
        s += `<line x1="${x(i)}" x2="${x(i)}" y1="${y(k.h)}" y2="${y(k.l)}" stroke="${wick || col}" stroke-width="${strokeW}"/>`;
        if (style === 'bar') {
          s += `<line x1="${x(i) - step * 0.3}" x2="${x(i)}" y1="${y(k.o)}" y2="${y(k.o)}" stroke="${col}" stroke-width="${strokeW}"/><line x1="${x(i)}" x2="${x(i) + step * 0.3}" y1="${y(k.c)}" y2="${y(k.c)}" stroke="${col}" stroke-width="${strokeW}"/>`;
        } else if (style === 'hollow' && isUp) {
          s += `<rect x="${x(i) - bw / 2}" y="${top}" width="${bw}" height="${bh}" rx="${radius}" fill="none" stroke="${col}" stroke-width="${strokeW}"/>`;
        } else {
          s += `<rect x="${x(i) - bw / 2}" y="${top}" width="${bw}" height="${bh}" rx="${radius}" fill="${col}" ${glow ? `filter="url(#g${seed})"` : ''}/>`;
        }
      });
    }
    if (volume) d.forEach((k, i) => (s += `<rect x="${x(i) - step * 0.31}" y="${h - k.v * volH}" width="${step * 0.62}" height="${k.v * volH}" fill="${k.c >= k.o ? up : down}" opacity=".28"/>`));
    s += '</svg>';
    return { svg: s, data: d, pt: (i, v) => [x(i), y(v)], step, w, h };
  }

  /** Mount a chart into an element and return helpers. The element's box defines w/h unless given. */
  function mountChart(el, opts = {}) {
    const r = el.getBoundingClientRect();
    const c = candlesSVG({ w: Math.round(opts.w || r.width), h: Math.round(opts.h || r.height), ...opts });
    el.innerHTML = c.svg;
    el.style.position = el.style.position || 'relative';
    return c;
  }

  window.SOS = { rng, series, candlesSVG, mountChart };
})();
