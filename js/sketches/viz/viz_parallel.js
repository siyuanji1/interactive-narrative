// viz_parallel.js
// Parallel coordinates: emotion profiles by field
// % of students who feel each emotion "Often" or "Always"
// Active at section index 4

window.VizParallel = (function () {

  const EMOTIONS = ['curious','hopeful','calm','bored','anxious'];
  const EMOTION_LABELS = ['Curious','Hopeful','Calm','Bored','Anxious'];

  const FIELDS = [
    { key: 'Applied Sciences',        color: [55,  138, 221], dash: false },
    { key: 'Social Sciences',         color: [212,  83, 126], dash: false },
    { key: 'Arts & Humanities',       color: [186, 117,  23], dash: true  },
    { key: 'Natural & Life Sciences', color: [ 29, 158, 117], dash: false },
  ];

  let rawData  = null;
  let margin, plotW, plotH, ox, oy;
  let lastP    = null;
  let hoveredField = null;

  // ── load ──────────────────────────────────────────────────────────────────
  function loadData(callback) {
    if (rawData !== null) { callback(); return; }
    fetch('data/parallel_data.json')
      .then(r => r.json())
      .then(data => { rawData = data; callback(); })
      .catch(err => { console.error('parallel_data.json failed', err); rawData = {}; callback(); });
  }

  function computeLayout(p) {
    margin = { top: 60, right: 120, bottom: 70, left: 60 };
    plotW  = p.width  - margin.left - margin.right;
    plotH  = p.height - margin.top  - margin.bottom;
    ox     = margin.left;
    oy     = margin.top;
  }

  // ── draw ──────────────────────────────────────────────────────────────────
  function xPos(i) {
    return ox + (i / (EMOTIONS.length - 1)) * plotW;
  }

  function yPos(val) {
    // val is 0–100 (percent)
    return oy + plotH - (val / 60) * plotH;
  }

  function drawAxes(p) {
    // vertical axis lines
    EMOTIONS.forEach((_, i) => {
      const x = xPos(i);
      p.stroke(255, 255, 255, 30);
      p.strokeWeight(1);
      p.line(x, oy, x, oy + plotH);

      // tick marks 0,20,40,60
      for (let v = 0; v <= 60; v += 20) {
        const y = yPos(v);
        p.stroke(255, 255, 255, 15);
        p.line(ox, y, ox + plotW, y);
        if (i === 0) {
          p.noStroke();
          p.fill(120);
          p.textSize(10);
          p.textAlign(p.RIGHT, p.CENTER);
          p.text(v + '%', ox - 6, y);
        }
      }

      // emotion label
      p.noStroke();
      p.fill(180);
      p.textSize(12);
      p.textAlign(p.CENTER, p.BOTTOM);
      p.text(EMOTION_LABELS[i], x, oy - 10);
    });

    // y axis label
    p.push();
    p.translate(14, oy + plotH / 2);
    p.rotate(-p.HALF_PI);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(11);
    p.fill(120);
    p.text('% feeling this emotion Often or Always', 0, 0);
    p.pop();
  }

  function drawLines(p) {
    if (!rawData) return;

    FIELDS.forEach(f => {
      const data = rawData[f.key];
      if (!data) return;

      const [r, g, b] = f.color;
      const isHov = hoveredField === f.key;
      const alpha = hoveredField ? (isHov ? 255 : 40) : 200;

      p.stroke(r, g, b, alpha);
      p.strokeWeight(isHov ? 3.5 : 2);
      p.noFill();

      const pts = EMOTIONS.map((em, i) => ({
        x: xPos(i),
        y: yPos(data[em] || 0)
      }));

      if (f.dash && !isHov) {
        for (let i = 0; i < pts.length - 1; i++) {
          drawDashed(p, pts[i].x, pts[i].y, pts[i+1].x, pts[i+1].y, 8, 5);
        }
      } else {
        p.beginShape();
        pts.forEach(pt => p.vertex(pt.x, pt.y));
        p.endShape();
      }

      // dots
      pts.forEach((pt, i) => {
        p.fill(r, g, b, alpha);
        p.noStroke();
        p.circle(pt.x, pt.y, isHov ? 10 : 7);

        // value labels on hover
        if (isHov) {
          p.fill(255);
          p.textSize(11);
          p.textAlign(p.CENTER, p.BOTTOM);
          p.text((data[EMOTIONS[i]] || 0).toFixed(1) + '%', pt.x, pt.y - 8);
        }
      });

      // field label at end of line
      const last = pts[pts.length - 1];
      p.noStroke();
      p.fill(r, g, b, alpha);
      p.textSize(11);
      p.textAlign(p.LEFT, p.CENTER);
      p.text(f.key, last.x + 8, last.y);
    });
  }

  function drawDashed(p, x1, y1, x2, y2, dLen, gLen) {
    const d = p.dist(x1, y1, x2, y2);
    const steps = d / (dLen + gLen);
    const dx = (x2-x1)/steps, dy = (y2-y1)/steps;
    const ddx = dx*dLen/(dLen+gLen), ddy = dy*dLen/(dLen+gLen);
    let cx=x1, cy=y1;
    for (let i=0; i<steps; i++) {
      p.line(cx, cy, cx+ddx, cy+ddy);
      cx+=dx; cy+=dy;
    }
  }

  function drawLegend(p) {
    let lx = ox, ly = oy + plotH + 36;
    FIELDS.forEach(f => {
      const [r,g,b] = f.color;
      const isHov = hoveredField === f.key;
      p.stroke(r,g,b); p.strokeWeight(2);
      p.line(lx, ly, lx+20, ly);
      p.fill(r,g,b); p.noStroke();
      p.circle(lx+10, ly, 8);
      p.fill(isHov ? 255 : 180);
      p.textSize(11);
      p.textAlign(p.LEFT, p.CENTER);
      p.text(f.key, lx+26, ly);
      lx += p.textWidth(f.key) + 42;
    });
  }

  function checkHover(p) {
    hoveredField = null;
    if (!rawData) return;
    FIELDS.forEach(f => {
      const data = rawData[f.key];
      if (!data) return;
      EMOTIONS.forEach((em, i) => {
        const x = xPos(i);
        const y = yPos(data[em] || 0);
        if (p.dist(p.mouseX, p.mouseY, x, y) < 14) {
          hoveredField = f.key;
        }
      });
    });
  }

  // ── public ────────────────────────────────────────────────────────────────
  return {
    draw: function (p, manager, ai, progress) {
      if (ai !== 4) return;

      if (rawData === null) {
        loadData(() => { computeLayout(p); lastP = p; });
        p.background(18,18,22);
        p.fill(120); p.noStroke();
        p.textAlign(p.CENTER, p.CENTER); p.textSize(14);
        p.text('Loading...', p.width/2, p.height/2);
        return;
      }

      if (lastP !== p) { lastP = p; computeLayout(p); }

      checkHover(p);

      p.background(18,18,22);
      drawAxes(p);
      drawLines(p);
      drawLegend(p);
    }
  };
})();
