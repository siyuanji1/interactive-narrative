// viz_field_bar_final.js
// Simple grouped bar chart: % Curious vs % Anxious by field
// Replaces VizParallel at section index 4

window.VizParallel = (function () {

  const FIELDS = [
    { key: 'Applied Sciences',        curious: 55.0, anxious: 10.2, color: [55, 138, 221] },
    { key: 'Social Sciences',         curious: 50.3, anxious: 10.5, color: [150, 100, 200] },
    { key: 'Natural & Life Sciences', curious: 52.7, anxious: 12.5, color: [29,  158, 117] },
    { key: 'Arts & Humanities',       curious: 47.8, anxious: 13.4, color: [210,  80,  80] },
  ];

  const C_COL = [34, 139, 34];
  const A_COL = [210, 60,  60];

  let margin, plotW, plotH, ox, oy, lastP = null;
  let hoveredField = null;

  function computeLayout(p) {
    margin = { top: 70, right: 40, bottom: 90, left: 60 };
    plotW  = p.width  - margin.left - margin.right;
    plotH  = p.height - margin.top  - margin.bottom;
    ox     = margin.left;
    oy     = margin.top;
  }

  function groupX(fi) {
    const groupW = plotW / FIELDS.length;
    return ox + fi * groupW + groupW / 2;
  }

  function barX(fi, bi) {
    const groupW = plotW / FIELDS.length;
    const barW   = groupW * 0.28;
    const cx     = groupX(fi);
    return { x: cx + (bi === 0 ? -barW * 0.6 : barW * 0.6), w: barW };
  }

  function yPos(val) { return oy + plotH - (val / 70) * plotH; }

  function drawGrid(p) {
    [0, 20, 40, 60].forEach(v => {
      p.stroke(0, 0, 0, v === 0 ? 80 : 15);
      p.strokeWeight(v === 0 ? 1.5 : 1);
      p.line(ox, yPos(v), ox + plotW, yPos(v));
      p.noStroke(); p.fill(140); p.textSize(10);
      p.textAlign(p.RIGHT, p.CENTER);
      p.text(v + '%', ox - 6, yPos(v));
    });
    p.noStroke(); p.fill(120); p.textSize(11);
    p.textAlign(p.CENTER, p.TOP);
    p.text('% of students feeling this emotion "Often" or "Always"', ox + plotW/2, oy + plotH + 52);
  }

  function drawBars(p) {
    FIELDS.forEach((f, fi) => {
      const isHov = hoveredField === f.key;
      const alpha = hoveredField ? (isHov ? 255 : 60) : 210;

      [
        { val: f.curious, col: C_COL, bi: 0 },
        { val: f.anxious, col: A_COL, bi: 1 },
      ].forEach(({ val, col, bi }) => {
        const { x, w } = barX(fi, bi);
        const y = yPos(val);
        const h = oy + plotH - y;
        const [r, g, b] = col;

        p.noStroke(); p.fill(r, g, b, alpha);
        p.rect(x - w/2, y, w, h, 3, 3, 0, 0);

        p.fill(r, g, b, alpha);
        p.textAlign(p.CENTER, p.BOTTOM);
        p.textSize(isHov ? 13 : 11);
        p.textStyle(isHov ? p.BOLD : p.NORMAL);
        p.text(val.toFixed(0) + '%', x, y - 3);
        p.textStyle(p.NORMAL);
      });

      // field label
      const cx = groupX(fi);
      p.noStroke(); p.fill(isHov ? 20 : 60, alpha);
      p.textAlign(p.CENTER, p.TOP);
      p.textSize(isHov ? 13 : 11);
      p.textStyle(isHov ? p.BOLD : p.NORMAL);
      const name = f.key === 'Natural & Life Sciences' ? ['Natural &', 'Life Sciences'] :
                   f.key === 'Arts & Humanities'       ? ['Arts &', 'Humanities'] : [f.key];
      name.forEach((line, li) => p.text(line, cx, oy + plotH + 10 + li * 16));
      p.textStyle(p.NORMAL);
    });
  }

  function drawLegend(p) {
    const items = [
      { label: 'Curious (Often/Always)', col: C_COL },
      { label: 'Anxious (Often/Always)', col: A_COL },
    ];
    let lx = ox, ly = oy - 36;
    items.forEach(({ label, col }) => {
      const [r,g,b] = col;
      p.noStroke(); p.fill(r,g,b);
      p.rect(lx, ly - 6, 14, 14, 2);
      p.fill(50); p.textSize(11); p.textAlign(p.LEFT, p.CENTER);
      p.text(label, lx + 18, ly + 1);
      lx += p.textWidth(label) + 36;
    });
  }

  function drawAnnotations(p) {
    // Applied Sciences: highlight gap
    const { x: cx0 } = barX(0, 0);
    const { x: cx1 } = barX(0, 1);
    const midX = (cx0 + cx1) / 2;
    const y1 = yPos(FIELDS[0].curious);
    const y2 = yPos(FIELDS[0].anxious);

    p.stroke(34, 139, 34, 120); p.strokeWeight(1);
    p.drawingContext.setLineDash([3, 3]);
    p.line(midX + barX(0,0).w/2, y1, midX + barX(0,0).w/2, y2);
    p.drawingContext.setLineDash([]);
    p.noStroke(); p.fill(34, 100, 34, 160); p.textSize(9);
    p.textAlign(p.LEFT, p.CENTER); p.textStyle(p.ITALIC);
    p.text('44pt gap', midX + barX(0,0).w/2 + 4, (y1+y2)/2);
    p.textStyle(p.NORMAL);
  }

  function checkHover(p) {
    hoveredField = null;
    FIELDS.forEach((f, fi) => {
      const cx = groupX(fi);
      const groupW = plotW / FIELDS.length;
      if (p.mouseX > cx - groupW/2 && p.mouseX < cx + groupW/2 &&
          p.mouseY > oy && p.mouseY < oy + plotH) {
        hoveredField = f.key;
      }
    });
  }

  return {
    draw: function (p, manager, ai, progress) {
      if (ai !== 4) return;
      if (lastP !== p) { lastP = p; computeLayout(p); }
      checkHover(p);
      p.background(255);
      drawGrid(p);
      drawLegend(p);
      drawBars(p);
      drawAnnotations(p);
      p.fill(160); p.noStroke(); p.textSize(9);
      p.textAlign(p.RIGHT, p.BOTTOM);
      p.text('Q32l & Q32j · n=15,734', ox + plotW, oy + plotH + 78);
    }
  };
})();
