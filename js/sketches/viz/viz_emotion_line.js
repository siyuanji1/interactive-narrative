// viz_emotion_line.js
// Line chart: emotion scores across AI usage levels
// CI bands only on Curious and Anxious for clear contrast
// Active at section index 3

window.VizEmotionLine = (function () {

  const USAGE_ORDER = ['Rarely','Occasionally','Moderately','Considerably','Extensively'];

  const EMOTIONS = [
    { key: 'curious', label: 'Curious', color: [34, 139, 34],   showBand: true  },
    { key: 'hopeful', label: 'Hopeful', color: [186, 117, 23],  showBand: false },
    { key: 'bored',   label: 'Bored',   color: [160, 160, 160], showBand: false },
    { key: 'anxious', label: 'Anxious', color: [210, 60,  60],  showBand: true  },
  ];

  const FIELDS = ['Applied Sciences','Social Sciences','Arts & Humanities','Natural & Life Sciences'];

  let rawData    = null;
  let aggData    = {};
  let activeField = 'All';
  let margin, plotW, plotH, ox, oy;
  let lastP = null;
  let buttons = [];

  function loadData(callback) {
    if (rawData !== null) { callback(); return; }
    fetch('data/line_data_ci.json')
      .then(r => r.json())
      .then(data => { rawData = data; buildAgg(); callback(); })
      .catch(err => { console.error('line_data_ci.json failed', err); rawData = []; callback(); });
  }

  function buildAgg() {
    aggData = {};
    rawData.forEach(d => {
      if (!aggData[d.field]) aggData[d.field] = {};
      if (!aggData[d.field][d.usage]) aggData[d.field][d.usage] = {};
      aggData[d.field][d.usage][d.emotion] = { mean: d.mean, ci: d.ci };
    });
  }

  function computeLayout(p) {
    margin = { top: 60, right: 110, bottom: 90, left: 60 };
    plotW  = p.width  - margin.left - margin.right;
    plotH  = p.height - margin.top  - margin.bottom - 50;
    ox     = margin.left;
    oy     = margin.top;
  }

  function buildButtons(p) {
    buttons = [];
    const labels = ['All', ...FIELDS];
    const bw = 140, bh = 28, gap = 8;
    let bx = ox, by = oy + plotH + margin.bottom - 10;
    labels.forEach(label => {
      if (bx + bw > p.width - 10) { bx = ox; by += bh + gap; }
      buttons.push({ label, x: bx, y: by, w: bw, h: bh });
      bx += bw + gap;
    });
  }

  function xPos(i) { return ox + (i / (USAGE_ORDER.length - 1)) * plotW; }
  function yPos(v) { return oy + plotH - ((v - 1) / (5 - 1)) * plotH; }

  function drawGrid(p) {
    p.stroke(0, 0, 0, 20);
    p.strokeWeight(1);
    for (let v = 1; v <= 5; v++) p.line(ox, yPos(v), ox + plotW, yPos(v));
    USAGE_ORDER.forEach((_, i) => p.line(xPos(i), oy, xPos(i), oy + plotH));
  }

  function drawAxes(p) {
    p.noStroke();
    p.textAlign(p.CENTER, p.TOP);
    p.textSize(11);
    p.fill(60);
    USAGE_ORDER.forEach((label, i) => p.text(label, xPos(i), oy + plotH + 10));
    p.textSize(12);
    p.fill(100);
    p.text('AI usage level (Q15)', ox + plotW / 2, oy + plotH + 32);

    p.textAlign(p.RIGHT, p.CENTER);
    p.textSize(11);
    p.fill(60);
    for (let v = 1; v <= 5; v++) p.text(v, ox - 8, yPos(v));

    p.push();
    p.translate(12, oy + plotH / 2);
    p.rotate(-p.HALF_PI);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(11);
    p.fill(100);
    p.text('Emotion score (1–5)', 0, 0);
    p.pop();
  }

  function drawLines(p) {
    const data = aggData[activeField];
    if (!data) return;

    // Draw bands first (behind lines)
    EMOTIONS.forEach(em => {
      if (!em.showBand) return;
      const [r, g, b] = em.color;

      const upper = [], lower = [];
      USAGE_ORDER.forEach((u, i) => {
        if (!data[u] || !data[u][em.key]) return;
        const { mean, ci } = data[u][em.key];
        upper.push({ x: xPos(i), y: yPos(mean + ci) });
        lower.push({ x: xPos(i), y: yPos(mean - ci) });
      });

      p.noStroke();
      p.fill(r, g, b, 55);
      p.beginShape();
      upper.forEach(pt => p.vertex(pt.x, pt.y));
      lower.slice().reverse().forEach(pt => p.vertex(pt.x, pt.y));
      p.endShape(p.CLOSE);
    });

    // Draw all lines
    EMOTIONS.forEach(em => {
      const [r, g, b] = em.color;
      const lineWeight = em.showBand ? 3 : 1.5;
      const alpha = em.showBand ? 240 : 150;

      p.stroke(r, g, b, alpha);
      p.strokeWeight(lineWeight);
      p.noFill();
      p.beginShape();
      USAGE_ORDER.forEach((u, i) => {
        if (!data[u] || !data[u][em.key]) return;
        p.vertex(xPos(i), yPos(data[u][em.key].mean));
      });
      p.endShape();

      // dots
      USAGE_ORDER.forEach((u, i) => {
        if (!data[u] || !data[u][em.key]) return;
        const y = yPos(data[u][em.key].mean);
        p.fill(r, g, b);
        p.noStroke();
        p.circle(xPos(i), y, em.showBand ? 9 : 6);
      });

      // right-side label
      const lastU = USAGE_ORDER[USAGE_ORDER.length - 1];
      if (data[lastU] && data[lastU][em.key]) {
        const lx = xPos(USAGE_ORDER.length - 1) + 12;
        const ly = yPos(data[lastU][em.key].mean);
        p.fill(r, g, b);
        p.noStroke();
        p.textAlign(p.LEFT, p.CENTER);
        p.textSize(12);
        p.textStyle(em.showBand ? p.BOLD : p.NORMAL);
        p.text(em.label, lx, ly);
        p.textStyle(p.NORMAL);
      }
    });
  }

  function drawLegend(p) {
    let lx = ox, ly = oy - 30;
    EMOTIONS.forEach(em => {
      const [r, g, b] = em.color;

      if (em.showBand) {
        p.noStroke();
        p.fill(r, g, b, 55);
        p.rect(lx, ly - 6, 20, 12, 2);
      }

      p.stroke(r, g, b);
      p.strokeWeight(em.showBand ? 3 : 1.5);
      p.line(lx, ly, lx + 20, ly);
      p.fill(r, g, b);
      p.noStroke();
      p.circle(lx + 10, ly, 6);
      p.fill(50);
      p.textSize(11);
      p.textAlign(p.LEFT, p.CENTER);
      p.text(em.label, lx + 26, ly);
      lx += p.textWidth(em.label) + 50;
    });
  }

  function drawButtons(p) {
    buttons.forEach(b => {
      const active = b.label === activeField;
      p.fill(active ? 60 : 245);
      p.stroke(active ? 60 : 200);
      p.strokeWeight(1);
      p.rect(b.x, b.y, b.w, b.h, 4);
      p.fill(active ? 255 : 70);
      p.noStroke();
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(10);
      p.text(b.label, b.x + b.w / 2, b.y + b.h / 2);
    });
  }

  return {
    draw: function (p, manager, ai, progress) {
      if (ai !== 3) return;

      if (rawData === null) {
        loadData(() => { computeLayout(p); buildButtons(p); lastP = p; });
        p.background(255);
        p.fill(120); p.noStroke();
        p.textAlign(p.CENTER, p.CENTER); p.textSize(14);
        p.text('Loading...', p.width / 2, p.height / 2);
        return;
      }

      if (lastP !== p) { lastP = p; computeLayout(p); buildButtons(p); }

      if (p.mouseIsPressed) {
        buttons.forEach(b => {
          if (p.mouseX > b.x && p.mouseX < b.x + b.w &&
              p.mouseY > b.y && p.mouseY < b.y + b.h) {
            activeField = b.label;
          }
        });
      }

      p.background(255);
      drawGrid(p);
      drawAxes(p);
      drawLines(p);
      drawLegend(p);
      drawButtons(p);
    }
  };
})();
