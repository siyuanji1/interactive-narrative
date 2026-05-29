window.VizLollipop = (function () {

  const SKILLS = [
    { label: 'Study efficiency',   score: 3.584, type: 'productivity', q: 'Q26e' },
    { label: 'Assignment quality', score: 3.545, type: 'productivity', q: 'Q26j' },
    { label: 'Meeting deadlines',  score: 3.539, type: 'productivity', q: 'Q26i' },
    { label: 'Analytical skills',  score: 3.227, type: 'thinking',     q: 'Q29d' },
    { label: 'Creativity',         score: 3.124, type: 'thinking',     q: 'Q29f' },
    { label: 'Critical thinking',  score: 3.037, type: 'thinking',     q: 'Q29e' },
  ];

  const PROD_COL  = [29, 158, 117];
  const THINK_COL = [224, 75,  74];
  const NEUTRAL   = 3;
  const X_MIN = 1, X_MAX = 5;

  let margin, plotW, plotH, ox, oy, lastP = null;
  let hoveredItem = null;

  function computeLayout(p) {
    margin = { top: 80, right: 100, bottom: 80, left: 200 };
    plotW  = p.width  - margin.left - margin.right;
    plotH  = p.height - margin.top  - margin.bottom;
    ox     = margin.left;
    oy     = margin.top;
  }

  function xPos(v) { return ox + ((v - X_MIN) / (X_MAX - X_MIN)) * plotW; }

  function yPos(i) {
    // Extra space between group 2 and 3 for separator
    const baseRowH = plotH / 7.5;
    if (i < 3) return oy + baseRowH * (i + 0.8);
    return oy + baseRowH * (i + 1.8); // push thinking group down
  }

  function drawBackgroundZones(p) {
    const nx = xPos(NEUTRAL);
    p.noStroke();
    p.fill(29, 158, 117, 10);
    p.rect(nx, oy - 10, ox + plotW - nx, plotH + 20);
    p.fill(224, 75, 74, 6);
    p.rect(ox, oy - 10, nx - ox, plotH + 20);

    p.textSize(10); p.textAlign(p.LEFT, p.TOP);
    p.fill(29, 158, 117, 130);
    p.text('AI helps ↑', nx + 8, oy - 6);
    p.textAlign(p.RIGHT, p.TOP);
    p.fill(224, 75, 74, 130);
    p.text('↓ neutral', nx - 8, oy - 6);
  }

  function drawGrid(p) {
    [1, 2, 3, 4, 5].forEach(v => {
      const x = xPos(v);
      p.stroke(v === NEUTRAL ? 80 : 0, v === NEUTRAL ? 80 : 0, v === NEUTRAL ? 80 : 0,
               v === NEUTRAL ? 160 : 15);
      p.strokeWeight(v === NEUTRAL ? 2 : 1);
      p.line(x, oy - 10, x, oy + plotH);
      p.noStroke(); p.fill(130); p.textSize(11);
      p.textAlign(p.CENTER, p.TOP);
      p.text(v, x, oy + plotH + 10);
    });
    p.fill(80); p.textSize(10); p.textAlign(p.CENTER, p.TOP);
    p.text('Neutral (3)', xPos(NEUTRAL), oy + plotH + 26);
    p.fill(120); p.textSize(11); p.textAlign(p.CENTER, p.TOP);
    p.text('"ChatGPT can improve my..." (1=Strongly disagree → 5=Strongly agree)', ox + plotW/2, oy + plotH + 46);
  }

  function drawSeparator(p) {
    const sepY = (yPos(2) + yPos(3)) / 2;
    p.stroke(180); p.strokeWeight(1);
    p.drawingContext.setLineDash([5, 5]);
    p.line(ox - 190, sepY, ox + plotW + 80, sepY);
    p.drawingContext.setLineDash([]);
  }

  function drawGroupBadges(p) {
    // Left-side colored badges instead of overlapping text
    const prodMidY = (yPos(0) + yPos(2)) / 2;
    const thinkMidY = (yPos(3) + yPos(5)) / 2;

    const badgeW = 16, badgeH = 60;

    // Productivity badge
    p.noStroke(); p.fill(...PROD_COL, 180);
    p.rect(ox - 196, prodMidY - badgeH/2, badgeW, badgeH, 3);
    p.push();
    p.translate(ox - 196 + badgeW/2, prodMidY);
    p.rotate(-p.HALF_PI);
    p.fill(255); p.textSize(9); p.textAlign(p.CENTER, p.CENTER);
    p.text('PRODUCTIVITY', 0, 0);
    p.pop();

    // Thinking badge
    p.noStroke(); p.fill(...THINK_COL, 180);
    p.rect(ox - 196, thinkMidY - badgeH/2, badgeW, badgeH, 3);
    p.push();
    p.translate(ox - 196 + badgeW/2, thinkMidY);
    p.rotate(-p.HALF_PI);
    p.fill(255); p.textSize(9); p.textAlign(p.CENTER, p.CENTER);
    p.text('THINKING', 0, 0);
    p.pop();
  }

  function drawLollipops(p) {
    const nx = xPos(NEUTRAL);

    SKILLS.forEach((sk, i) => {
      const y   = yPos(i);
      const x   = xPos(sk.score);
      const col = sk.type === 'productivity' ? PROD_COL : THINK_COL;
      const [r,g,b] = col;
      const isHov = hoveredItem === i;
      const alpha = hoveredItem !== null ? (isHov ? 255 : 50) : 210;

      // row hover highlight
      if (isHov) {
        p.noStroke(); p.fill(r, g, b, 8);
        p.rect(ox - 190, y - 22, plotW + 270, 44, 4);
      }

      // stem
      p.stroke(r, g, b, alpha * 0.7);
      p.strokeWeight(isHov ? 2.5 : 1.8);
      p.line(nx, y, x, y);

      // dot
      p.noStroke(); p.fill(r, g, b, alpha);
      p.circle(x, y, isHov ? 20 : 14);

      // score label
      p.fill(r, g, b, alpha);
      p.textAlign(p.LEFT, p.CENTER);
      p.textSize(isHov ? 13 : 12);
      p.textStyle(isHov ? p.BOLD : p.NORMAL);
      p.text(sk.score.toFixed(2), x + 14, y);
      p.textStyle(p.NORMAL);

      // skill label
      p.noStroke(); p.fill(isHov ? 20 : 60, alpha);
      p.textAlign(p.RIGHT, p.CENTER);
      p.textSize(isHov ? 13 : 12);
      p.textStyle(isHov ? p.BOLD : p.NORMAL);
      p.text(sk.label, ox - 12, y);
      p.textStyle(p.NORMAL);

      // hover tooltip
      if (isHov) {
        const tw = 190, th = 46, pad = 8;
        const tx = Math.min(x + 36, ox + plotW - tw - 4);
        const ty = y - th/2;
        p.fill(30, 30, 36, 220); p.stroke(80); p.strokeWeight(1);
        p.rect(tx, ty, tw, th, 6);
        p.noStroke(); p.fill(255); p.textSize(11); p.textAlign(p.LEFT, p.TOP);
        p.text(sk.label, tx+pad, ty+pad);
        p.fill(r,g,b); p.textSize(11);
        p.text('Score: ' + sk.score.toFixed(3) + ' (' + sk.q + ')', tx+pad, ty+pad+18);
      }
    });
  }

  function drawGapAnnotation(p) {
    const prodAvg  = SKILLS.filter(s=>s.type==='productivity').reduce((a,s)=>a+s.score,0)/3;
    const thinkAvg = SKILLS.filter(s=>s.type==='thinking').reduce((a,s)=>a+s.score,0)/3;
    const gap = prodAvg - thinkAvg;

    const rx = ox + plotW + 16;
    const y0 = yPos(0), y5 = yPos(5);
    const prodMidY = (yPos(0)+yPos(2))/2;
    const thinkMidY = (yPos(3)+yPos(5))/2;

    p.stroke(140); p.strokeWeight(1);
    p.line(rx, y0 - 10, rx, y5 + 10);
    p.line(rx, prodMidY, rx+8, prodMidY);
    p.line(rx, thinkMidY, rx+8, thinkMidY);

    p.noStroke(); p.fill(60); p.textSize(10);
    p.textAlign(p.LEFT, p.CENTER); p.textStyle(p.BOLD);
    p.text('avg gap', rx+12, (prodMidY+thinkMidY)/2 - 8);
    p.textStyle(p.NORMAL);
    p.fill(100); p.textSize(10);
    p.text('+' + gap.toFixed(2) + ' pts', rx+12, (prodMidY+thinkMidY)/2 + 8);
  }

  function drawLegend(p) {
    const items = [
      { label: 'Productivity skills (AI helps more)', col: PROD_COL },
      { label: 'Thinking skills (AI helps less)',     col: THINK_COL },
    ];
    let lx = ox, ly = oy - 50;
    items.forEach(item => {
      const [r,g,b] = item.col;
      p.noStroke(); p.fill(r,g,b); p.circle(lx+6, ly, 13);
      p.fill(50); p.textSize(11); p.textAlign(p.LEFT, p.CENTER);
      p.text(item.label, lx+18, ly);
      lx += p.textWidth(item.label) + 38;
    });
  }

  function checkHover(p) {
    hoveredItem = null;
    SKILLS.forEach((_, i) => {
      const y = yPos(i);
      if (p.mouseY > y-20 && p.mouseY < y+20 && p.mouseX > ox-190 && p.mouseX < ox+plotW+80) {
        hoveredItem = i;
      }
    });
  }

  return {
    draw: function (p, manager, ai, progress) {
      if (ai !== 5) return;
      if (lastP !== p) { lastP = p; computeLayout(p); }
      checkHover(p);
      p.background(255);
      drawBackgroundZones(p);
      drawGrid(p);
      drawSeparator(p);
      drawGroupBadges(p);
      drawLollipops(p);
      drawGapAnnotation(p);
      drawLegend(p);
      p.fill(160); p.noStroke(); p.textSize(9);
      p.textAlign(p.RIGHT, p.BOTTOM);
      p.text('Real data · Q26 & Q29 · n=15,734', ox+plotW, oy+plotH+68);
    }
  };
})();
