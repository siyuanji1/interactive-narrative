// viz_ratio.js - Curious/Anxious ratio by field
// Simple horizontal bar showing how many times more curious than anxious
// Replaces VizParallel at section index 4

window.VizParallel = (function () {

  const FIELDS = [
    { key: 'Applied Sciences',        curious: 55.0, anxious: 10.2 },
    { key: 'Natural & Life Sciences', curious: 52.7, anxious: 12.5 },
    { key: 'Social Sciences',         curious: 50.3, anxious: 10.5 },
    { key: 'Arts & Humanities',       curious: 47.8, anxious: 13.4 },
  ].map(f => ({ ...f, ratio: f.curious / f.anxious }))
   .sort((a, b) => b.ratio - a.ratio);

  const MAX_RATIO = 6;
  let margin, plotW, plotH, ox, oy, lastP = null;
  let hoveredRow = null;

  function computeLayout(p) {
    margin = { top: 80, right: 80, bottom: 70, left: 210 };
    plotW  = p.width  - margin.left - margin.right;
    plotH  = p.height - margin.top  - margin.bottom;
    ox     = margin.left;
    oy     = margin.top;
  }

  function xPos(v) { return ox + (v / MAX_RATIO) * plotW; }
  function yPos(i) {
    const rowH = plotH / (FIELDS.length + 1);
    return oy + rowH * (i + 1);
  }

  function drawGrid(p) {
    [1, 2, 3, 4, 5, 6].forEach(v => {
      const x = xPos(v);
      p.stroke(v === 1 ? 80 : 0, v === 1 ? 80 : 0, v === 1 ? 80 : 0, v === 1 ? 140 : 18);
      p.strokeWeight(v === 1 ? 2 : 1);
      p.line(x, oy - 20, x, oy + plotH);
      p.noStroke(); p.fill(140); p.textSize(11);
      p.textAlign(p.CENTER, p.TOP);
      p.text(v + 'x', x, oy + plotH + 10);
    });

    // baseline label
    p.fill(80); p.textSize(10); p.textAlign(p.CENTER, p.TOP);
    p.text('equal', xPos(1), oy + plotH + 26);

    // x axis title
    p.fill(120); p.textSize(12); p.textAlign(p.CENTER, p.TOP);
    p.text('Curious ÷ Anxious ratio', ox + plotW / 2, oy + plotH + 44);
  }

  function drawBars(p) {
    FIELDS.forEach((f, i) => {
      const y    = yPos(i);
      const x    = xPos(f.ratio);
      const x1   = xPos(1);
      const isHov = hoveredRow === i;
      const isTop = i === 0;
      const isBot = i === FIELDS.length - 1;
      const alpha = hoveredRow !== null ? (isHov ? 255 : 60) : 200;

      // color: top = strong green, bottom = muted red, others = blue-ish
      let r, g, b;
      if (isTop)      { r=34;  g=139; b=34;  }
      else if (isBot) { r=210; g=60;  b=60;  }
      else            { r=55;  g=138; b=221; }

      // row hover highlight
      if (isHov) {
        p.noStroke(); p.fill(r, g, b, 10);
        p.rect(ox - 200, y - 26, plotW + 270, 52, 4);
      }

      // bar from 1x to ratio
      p.noStroke(); p.fill(r, g, b, alpha * 0.25);
      p.rect(x1, y - (isHov ? 16 : 12), x - x1, isHov ? 32 : 24, 3);

      // bar outline
      p.stroke(r, g, b, alpha * 0.5);
      p.strokeWeight(1);
      p.noFill();
      p.rect(x1, y - (isHov ? 16 : 12), x - x1, isHov ? 32 : 24, 3);

      // end dot
      p.noStroke(); p.fill(r, g, b, alpha);
      p.circle(x, y, isHov ? 22 : 16);

      // ratio label inside/after dot
      p.fill(255); p.textAlign(p.CENTER, p.CENTER);
      p.textSize(isHov ? 13 : 11);
      p.textStyle(p.BOLD);
      p.text(f.ratio.toFixed(1) + 'x', x, y);
      p.textStyle(p.NORMAL);

      // field label
      p.noStroke(); p.fill(isHov ? 20 : 50, alpha);
      p.textAlign(p.RIGHT, p.CENTER);
      p.textSize(isHov ? 14 : 13);
      p.textStyle(isHov ? p.BOLD : p.NORMAL);
      p.text(f.key, ox - 14, y);
      p.textStyle(p.NORMAL);

      // annotation for extremes
      if (isTop) {
        p.fill(34, 120, 34, 170); p.textSize(10);
        p.textAlign(p.LEFT, p.CENTER);
        p.textStyle(p.ITALIC);
        p.text('most curious relative to anxious', x + 18, y);
        p.textStyle(p.NORMAL);
      }
      if (isBot) {
        p.fill(180, 50, 50, 170); p.textSize(10);
        p.textAlign(p.LEFT, p.CENTER);
        p.textStyle(p.ITALIC);
        p.text('highest anxiety relative to curiosity', x + 18, y);
        p.textStyle(p.NORMAL);
      }

      // hover detail
      if (isHov) {
        p.noStroke(); p.fill(60); p.textSize(11);
        p.textAlign(p.LEFT, p.CENTER);
        p.text(
          f.curious.toFixed(0) + '% curious  ÷  ' + f.anxious.toFixed(0) + '% anxious  =  ' + f.ratio.toFixed(2) + 'x',
          ox - 200, y + 32
        );
      }
    });
  }

  function drawTitle(p) {
    p.noStroke(); p.fill(40); p.textSize(14);
    p.textAlign(p.LEFT, p.TOP); p.textStyle(p.BOLD);
    p.text('How many times more curious than anxious?', ox, oy - 52);
    p.textStyle(p.NORMAL);
    p.fill(120); p.textSize(11);
    p.text('Ratio of students feeling Curious vs Anxious "Often or Always" · real data · n=15,734', ox, oy - 30);
  }

  function checkHover(p) {
    hoveredRow = null;
    FIELDS.forEach((_, i) => {
      const y = yPos(i);
      if (p.mouseY > y - 28 && p.mouseY < y + 28 && p.mouseX > ox - 200 && p.mouseX < ox + plotW + 80) {
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
      drawTitle(p);
      drawGrid(p);
      drawBars(p);
    }
  };
})();
