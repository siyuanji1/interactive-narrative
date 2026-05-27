// viz_emotion_line.js
// Line chart: emotion scores across AI usage levels, one line per emotion
// Shows: anxiety stays flat, curiosity rises with AI usage
// Active at section index 3

window.VizEmotionLine = (function () {

  const USAGE_ORDER = ['Rarely','Occasionally','Moderately','Considerably','Extensively'];

  const EMOTIONS = [
    { key: 'anxious', label: 'Anxious', color: [224, 75,  74],  dash: true  },
    { key: 'bored',   label: 'Bored',   color: [150,150,150],  dash: true  },
    { key: 'hopeful', label: 'Hopeful', color: [186,117, 23],  dash: false },
    { key: 'curious', label: 'Curious', color: [ 99,153, 34],  dash: false },
  ];

  const FIELDS = ['Applied Sciences','Social Sciences','Arts & Humanities','Natural & Life Sciences'];

  let rawData    = null;
  let aggData    = {};   // aggData[field][usage] = {anxious, curious, hopeful, bored}
  let activeField = 'All';
  let margin, plotW, plotH, ox, oy;
  let lastP = null;
  let buttons = [];

  // ── load ─────────────────────────────────────────────────────────────────
  function loadData(callback) {
    if (rawData !== null) { callback(); return; }
    fetch('data/line_data.json')
      .then(r => r.json())
      .then(data => {
        rawData = data;
        buildAgg();
        callback();
      })
      .catch(err => { console.error('line_data.json failed', err); rawData = []; callback(); });
  }

  function buildAgg() {
    aggData = { All: {} };
    FIELDS.forEach(f => aggData[f] = {});

    // per-field aggregation already done in Python
    rawData.forEach(d => {
      aggData[d.field][d.usage] = {
        anxious: d.anxious,
        curious: d.curious,
        hopeful: d.hopeful,
        bored:   d.bored
      };
    });

    // "All" = average across fields per usage level
    USAGE_ORDER.forEach(u => {
      const vals = { anxious:[], curious:[], hopeful:[], bored:[] };
      FIELDS.forEach(f => {
        if (aggData[f][u]) {
          Object.keys(vals).forEach(k => vals[k].push(aggData[f][u][k]));
        }
      });
      aggData['All'][u] = {};
      Object.keys(vals).forEach(k => {
        aggData['All'][u][k] = vals[k].reduce((a,b)=>a+b,0) / vals[k].length;
      });
    });
  }

  // ── layout ────────────────────────────────────────────────────────────────
  function computeLayout(p) {
    margin = { top: 60, right: 30, bottom: 90, left: 60 };
    plotW  = p.width  - margin.left - margin.right;
    plotH  = p.height - margin.top  - margin.bottom - 50; // room for buttons
    ox     = margin.left;
    oy     = margin.top;
  }

  function buildButtons(p) {
    buttons = [];
    const labels = ['All', ...FIELDS];
    const bw = 140, bh = 28, gap = 8;
    let bx = ox;
    let by = oy + plotH + margin.bottom - 10;
    labels.forEach(label => {
      if (bx + bw > p.width - 10) { bx = ox; by += bh + gap; }
      buttons.push({ label, x: bx, y: by, w: bw, h: bh });
      bx += bw + gap;
    });
  }

  // ── draw ──────────────────────────────────────────────────────────────────
  function drawGrid(p) {
    p.stroke(255,255,255,18);
    p.strokeWeight(1);
    for (let v = 1; v <= 5; v++) {
      const y = oy + plotH - ((v-1)/(5-1)) * plotH;
      p.line(ox, y, ox+plotW, y);
    }
    USAGE_ORDER.forEach((_, i) => {
      const x = ox + (i/(USAGE_ORDER.length-1)) * plotW;
      p.line(x, oy, x, oy+plotH);
    });
  }

  function drawAxes(p) {
    p.noStroke();
    p.textAlign(p.CENTER, p.TOP);
    p.textSize(11);
    p.fill(160);
    USAGE_ORDER.forEach((label,i) => {
      const x = ox + (i/(USAGE_ORDER.length-1)) * plotW;
      p.text(label, x, oy+plotH+10);
    });
    p.textSize(12);
    p.fill(120);
    p.text('AI usage level (Q15)', ox+plotW/2, oy+plotH+32);

    p.textAlign(p.RIGHT, p.CENTER);
    p.textSize(11);
    p.fill(160);
    for (let v = 1; v <= 5; v++) {
      const y = oy + plotH - ((v-1)/(5-1)) * plotH;
      p.text(v, ox-8, y);
    }
    p.push();
    p.translate(12, oy+plotH/2);
    p.rotate(-p.HALF_PI);
    p.textAlign(p.CENTER,p.CENTER);
    p.textSize(11);
    p.fill(120);
    p.text('Emotion score (1–5)', 0, 0);
    p.pop();
  }

  function drawLines(p) {
    const data = aggData[activeField];
    if (!data) return;

    EMOTIONS.forEach(em => {
      const [r,g,b] = em.color;
      p.stroke(r,g,b, em.key === 'anxious' ? 255 : 200);
      p.strokeWeight(em.key === 'anxious' ? 3 : 2);
      p.noFill();

      // dashed simulation
      const pts = USAGE_ORDER.map((u,i) => {
        const val = data[u] ? data[u][em.key] : null;
        if (val === null) return null;
        return {
          x: ox + (i/(USAGE_ORDER.length-1)) * plotW,
          y: oy + plotH - ((val-1)/(5-1)) * plotH
        };
      }).filter(Boolean);

      if (em.dash) {
        for (let i = 0; i < pts.length-1; i++) {
          drawDashedLine(p, pts[i].x, pts[i].y, pts[i+1].x, pts[i+1].y, 8, 5);
        }
      } else {
        p.beginShape();
        pts.forEach(pt => p.vertex(pt.x, pt.y));
        p.endShape();
      }

      // dots + labels
      pts.forEach((pt,i) => {
        p.fill(r,g,b);
        p.noStroke();
        p.circle(pt.x, pt.y, 8);
        if (i === pts.length-1) {
          p.textAlign(p.LEFT, p.CENTER);
          p.textSize(11);
          p.text(em.label + ' ' + (data[USAGE_ORDER[i]][em.key]).toFixed(2), pt.x+8, pt.y);
        }
      });
    });
  }

  function drawDashedLine(p, x1, y1, x2, y2, dashLen, gapLen) {
    const d = p.dist(x1,y1,x2,y2);
    const steps = d / (dashLen+gapLen);
    const dx = (x2-x1)/steps, dy = (y2-y1)/steps;
    const ddx = dx*dashLen/(dashLen+gapLen), ddy = dy*dashLen/(dashLen+gapLen);
    let cx=x1, cy=y1;
    for (let i=0; i<steps; i++) {
      p.line(cx, cy, cx+ddx, cy+ddy);
      cx += dx; cy += dy;
    }
  }

  function drawLegend(p) {
    const items = EMOTIONS;
    let lx = ox, ly = oy - 30;
    items.forEach(em => {
      const [r,g,b] = em.color;
      p.stroke(r,g,b);
      p.strokeWeight(2);
      if (em.dash) {
        drawDashedLine(p, lx, ly, lx+20, ly, 6, 4);
      } else {
        p.line(lx, ly, lx+20, ly);
      }
      p.fill(r,g,b);
      p.noStroke();
      p.circle(lx+10, ly, 7);
      p.fill(200);
      p.textSize(11);
      p.textAlign(p.LEFT, p.CENTER);
      p.text(em.label, lx+24, ly);
      lx += p.textWidth(em.label) + 50;
    });
  }

  function drawButtons(p) {
    buttons.forEach(b => {
      const active = b.label === activeField;
      p.fill(active ? 255 : 50);
      p.stroke(active ? 255 : 100);
      p.strokeWeight(1);
      p.rect(b.x, b.y, b.w, b.h, 4);
      p.fill(active ? 0 : 180);
      p.noStroke();
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(10);
      p.text(b.label, b.x+b.w/2, b.y+b.h/2);
    });
  }

  // ── public ────────────────────────────────────────────────────────────────
  return {
    draw: function (p, manager, ai, progress) {
      if (ai !== 3) return;

      if (rawData === null) {
        loadData(() => { computeLayout(p); buildButtons(p); lastP = p; });
        p.background(18,18,22);
        p.fill(120); p.noStroke();
        p.textAlign(p.CENTER,p.CENTER); p.textSize(14);
        p.text('Loading...', p.width/2, p.height/2);
        return;
      }

      if (lastP !== p) {
        lastP = p;
        computeLayout(p);
        buildButtons(p);
      }

      // click detection
      if (p.mouseIsPressed) {
        buttons.forEach(b => {
          if (p.mouseX > b.x && p.mouseX < b.x+b.w &&
              p.mouseY > b.y && p.mouseY < b.y+b.h) {
            activeField = b.label;
          }
        });
      }

      p.background(18,18,22);
      drawGrid(p);
      drawAxes(p);
      drawLines(p);
      drawLegend(p);
      drawButtons(p);
    }
  };
})();
