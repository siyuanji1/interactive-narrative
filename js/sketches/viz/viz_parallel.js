// viz_dumbbell.js - Dumbbell chart: Curious vs Anxious gap by field
// Replaces VizParallel at section index 4

window.VizParallel = (function () {

  // Sorted by gap descending (curious - anxious)
  const FIELDS = [
    { key: 'Applied Sciences',        curious: 55.0, anxious: 10.2 },
    { key: 'Natural & Life Sciences', curious: 52.7, anxious: 12.5 },
    { key: 'Social Sciences',         curious: 50.3, anxious: 10.5 },
    { key: 'Arts & Humanities',       curious: 47.8, anxious: 13.4 },
  ];

  const C_COL = [34, 139, 34];   // curious green
  const A_COL = [210,  60,  60]; // anxious red

  let margin, plotW, plotH, ox, oy, lastP = null;
  let hoveredRow = null;

  function computeLayout(p) {
    margin = { top: 60, right: 160, bottom: 50, left: 180 };
    plotW  = p.width  - margin.left - margin.right;
    plotH  = p.height - margin.top  - margin.bottom;
    ox     = margin.left;
    oy     = margin.top;
  }

  function xPos(val) {
    return ox + ((val - 0) / 70) * plotW;
  }

  function yPos(idx) {
    const rowH = plotH / (FIELDS.length + 1);
    return oy + rowH * (idx + 1);
  }

  function drawGrid(p) {
    [0, 10, 20, 30, 40, 50, 60, 70].forEach(v => {
      p.stroke(0, 0, 0, v === 0 ? 80 : 15);
      p.strokeWeight(v === 0 ? 1.5 : 1);
      p.line(xPos(v), oy, xPos(v), oy + plotH);
      p.noStroke(); p.fill(140); p.textSize(10);
      p.textAlign(p.CENTER, p.TOP);
      p.text(v + '%', xPos(v), oy + plotH + 8);
    });
  }

  function drawRows(p) {
    FIELDS.forEach((f, i) => {
      const y = yPos(i);
      const xC = xPos(f.curious);
      const xA = xPos(f.anxious);
      const isHov = hoveredRow === i;
      const alpha = hoveredRow !== null ? (isHov ? 255 : 60) : 210;
      const gap = f.curious - f.anxious;

      // connecting line
      p.stroke(180, isHov ? 180 : 200, isHov ? 180 : 200, alpha * 0.6);
      p.strokeWeight(isHov ? 3 : 2);
      p.line(xA, y, xC, y);

      // gap label in middle of line
      const midX = (xA + xC) / 2;
      if (isHov || hoveredRow === null) {
        p.noStroke(); p.fill(80, 80, 80, alpha);
        p.textAlign(p.CENTER, p.BOTTOM);
        p.textSize(isHov ? 12 : 10);
        p.textStyle(isHov ? p.BOLD : p.NORMAL);
        p.text('gap: ' + gap.toFixed(1) + '%', midX, y - 6);
        p.textStyle(p.NORMAL);
      }

      // curious dot (right, green)
      const [cr,cg,cb] = C_COL;
      p.noStroke(); p.fill(cr,cg,cb,alpha);
      p.circle(xC, y, isHov ? 18 : 13);

      // anxious dot (left, red)
      const [ar,ag,ab] = A_COL;
      p.fill(ar,ag,ab,alpha);
      p.circle(xA, y, isHov ? 18 : 13);

      // value labels
      p.textAlign(p.LEFT, p.CENTER); p.textSize(11);
      p.fill(cr,cg,cb,alpha);
      p.text(f.curious.toFixed(1)+'%', xC + 10, y);

      p.textAlign(p.RIGHT, p.CENTER);
      p.fill(ar,ag,ab,alpha);
      p.text(f.anxious.toFixed(1)+'%', xA - 10, y);

      // field label on left
      p.noStroke(); p.fill(isHov ? 30 : 60, alpha);
      p.textAlign(p.RIGHT, p.CENTER);
      p.textSize(isHov ? 13 : 12);
      p.textStyle(isHov ? p.BOLD : p.NORMAL);
      p.text(f.key, ox - 14, y);
      p.textStyle(p.NORMAL);

      // subtle row highlight on hover
      if (isHov) {
        p.noStroke(); p.fill(240, 248, 255, 80);
        p.rect(ox - 10, y - 20, plotW + 20, 40, 4);
      }
    });
  }

  function drawLegend(p) {
    const items = [
      { label: 'Curious (Often/Always)', col: C_COL },
      { label: 'Anxious (Often/Always)', col: A_COL },
    ];
    let lx = ox, ly = oy - 30;
    items.forEach(item => {
      const [r,g,b] = item.col;
      p.noStroke(); p.fill(r,g,b);
      p.circle(lx + 6, ly, 12);
      p.fill(50); p.textSize(11); p.textAlign(p.LEFT, p.CENTER);
      p.text(item.label, lx + 16, ly);
      lx += p.textWidth(item.label) + 36;
    });
  }

  function drawAnnotations(p) {
    // annotation for Applied Sciences (largest gap)
    const y0 = yPos(0);
    p.noStroke(); p.fill(34,120,34,170);
    p.textSize(10); p.textAlign(p.LEFT, p.CENTER);
    p.textStyle(p.ITALIC);
    p.text('← largest gap', xPos(55) + 14, y0 + 16);

    // annotation for Arts & Humanities (smallest gap, highest anxious)
    const y3 = yPos(3);
    p.fill(180,60,60,170);
    p.textAlign(p.LEFT, p.CENTER);
    p.text('← smallest gap + highest anxiety', xPos(47.8) + 14, y3 + 16);
    p.textStyle(p.NORMAL);

    // x axis title
    p.fill(120); p.textSize(11); p.textAlign(p.CENTER, p.BOTTOM);
    p.text('% of students feeling this emotion Often or Always', ox + plotW/2, oy + plotH + 44);
  }

  function checkHover(p) {
    hoveredRow = null;
    FIELDS.forEach((f, i) => {
      const y = yPos(i);
      if (p.mouseY > y - 22 && p.mouseY < y + 22 && p.mouseX > ox - 10 && p.mouseX < ox + plotW + 10) {
        hoveredRow = i;
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
      drawRows(p);
      drawAnnotations(p);

      p.fill(160); p.noStroke(); p.textSize(9);
      p.textAlign(p.RIGHT, p.BOTTOM);
      p.text('Real data · Q32l & Q32j · n=15,734', ox + plotW, oy + plotH + 44);
    }
  };
})();
