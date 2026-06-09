window.VizLollipop = (function () {

  const SKILLS = [
    { label: 'Study efficiency',   score: 3.584, type: 'productivity', q: 'Q26e' },
    { label: 'Assignment quality', score: 3.545, type: 'productivity', q: 'Q26j' },
    { label: 'Meeting deadlines',  score: 3.539, type: 'productivity', q: 'Q26i' },
    { label: 'Analytical skills',  score: 3.227, type: 'thinking',     q: 'Q29d' },
    { label: 'Creativity',         score: 3.124, type: 'thinking',     q: 'Q29f' },
    { label: 'Critical thinking',  score: 3.037, type: 'thinking',     q: 'Q29e' },
  ];

  const PROD_COL  = [37, 99, 142];    // strong blue
  const THINK_COL = [196, 121, 38];   // strong amber (clear contrast vs blue)
  const NEUTRAL   = 3;
  const X_MIN = 1, X_MAX = 5;
  const ANIM_DURATION = 1000;
  const STAGGER = 120;

  let margin, plotW, plotH, ox, oy, lastP = null;
  let hoveredItem = null;
  let animStart = null, lastAi = null;

  function easeOut(t){ return 1 - Math.pow(1-t, 3); }

  function computeLayout(p) {
    margin = { top: 150, right: 180, bottom: 110, left: 200 };
    plotW  = p.width  - margin.left - margin.right;
    plotH  = p.height - margin.top  - margin.bottom;
    ox     = margin.left;
    oy     = margin.top;
  }

  function xPos(v) { return ox + ((v - X_MIN) / (X_MAX - X_MIN)) * plotW; }

  function yPos(i) {
    const baseRowH = plotH / 7.5;
    if (i < 3) return oy + baseRowH * (i + 0.8);
    return oy + baseRowH * (i + 1.8);
  }

  function drawGrid(p) {
    [1, 2, 3, 4, 5].forEach(v => {
      const x = xPos(v);
      p.stroke(v===NEUTRAL?80:0,v===NEUTRAL?80:0,v===NEUTRAL?80:0,v===NEUTRAL?160:15);
      p.strokeWeight(v===NEUTRAL?2:1);
      p.line(x, oy-10, x, oy+plotH);
      p.noStroke(); p.fill(130); p.textSize(11);
      p.textAlign(p.CENTER, p.TOP);
      p.text(v, x, oy+plotH+10);
    });
    p.fill(80); p.textSize(11); p.textAlign(p.CENTER, p.TOP);
    p.text('Neutral (3)', xPos(NEUTRAL), oy+plotH+28);
  }

  function drawSeparator(p) {
    const sepY = (yPos(2) + yPos(3)) / 2;
    p.stroke(180); p.strokeWeight(1);
    p.drawingContext.setLineDash([5, 5]);
    p.line(ox - 10, sepY, ox + plotW, sepY);
    p.drawingContext.setLineDash([]);
  }

  function drawGapAnnotation(p) {
    const prodAvg = (3.584+3.545+3.539)/3;
    const thinkAvg = (3.227+3.124+3.037)/3;
    const sepY = (yPos(2)+yPos(3))/2;
    p.noStroke(); p.textAlign(p.LEFT, p.CENTER);
    p.fill(PROD_COL[0],PROD_COL[1],PROD_COL[2]); p.textSize(11); p.textStyle(p.BOLD);
    p.text('Productivity avg '+prodAvg.toFixed(2), ox+plotW+15, sepY-12);
    p.fill(THINK_COL[0],THINK_COL[1],THINK_COL[2]);
    p.text('Thinking avg '+thinkAvg.toFixed(2), ox+plotW+15, sepY+6);
    p.fill(100); p.textStyle(p.NORMAL); p.textSize(10);
    p.text('all thinking skills sit near neutral', ox+plotW+15, sepY+24);
    p.textStyle(p.NORMAL);
  }

  function drawLollipops(p) {
    const nx = xPos(NEUTRAL);
    const elapsed = animStart ? Date.now() - animStart : ANIM_DURATION * 10;

    SKILLS.forEach((sk, i) => {
      const itemDelay = i * STAGGER;
      const itemElapsed = Math.max(0, elapsed - itemDelay);
      const t = easeOut(Math.min(1, itemElapsed / ANIM_DURATION));

      const y     = yPos(i);
      const xFull = xPos(sk.score);
      const x     = p.lerp(nx, xFull, t);
      const dotR  = p.lerp(0, 16, t);

      const col = sk.type === 'productivity' ? PROD_COL : THINK_COL;
      const [r,g,b] = col;
      const isHov = hoveredItem === i;
      const alpha = hoveredItem !== null ? (isHov ? 255 : 60) : 230;

      if (isHov) {
        p.noStroke(); p.fill(r,g,b,12);
        p.rect(ox-10, y-26, plotW+130, 52, 4);
      }

      if (t > 0) {
        p.stroke(r,g,b,alpha*0.7); p.strokeWeight(isHov?3:2.4);
        p.line(nx, y, x, y);
      }

      if (t > 0) {
        p.noStroke(); p.fill(r,g,b,alpha);
        p.circle(x, y, isHov ? 22 : dotR);
      }

      p.fill(r,g,b,alpha); p.textAlign(p.LEFT,p.CENTER);
      p.textSize(isHov?14:12); p.textStyle(isHov?p.BOLD:p.NORMAL);
      p.text(sk.score.toFixed(2), xFull+16, y);
      p.textStyle(p.NORMAL);

      p.noStroke(); p.fill(isHov?20:60, alpha);
      p.textAlign(p.RIGHT,p.CENTER);
      p.textSize(isHov?13:12); p.textStyle(isHov?p.BOLD:p.NORMAL);
      p.text(sk.label, ox-12, y);
      p.textStyle(p.NORMAL);

      if (isHov) {
        const tw=255, th=78, pad=10;
        const diff = sk.score - NEUTRAL;
        const interp = diff >= 0.5 ? 'clearly above neutral' :
                       diff >= 0.2 ? 'modestly above neutral' :
                                     'barely above neutral';
        const tx = ox + plotW * 0.72;
        const ty = oy + plotH - th - 10;
        p.fill(30,30,36,238); p.stroke(80); p.strokeWeight(1);
        p.rect(tx,ty,tw,th,6);
        p.noStroke();
        p.fill(255); p.textSize(13); p.textStyle(p.BOLD); p.textAlign(p.LEFT,p.TOP);
        p.text(sk.label, tx+pad, ty+pad);
        p.textStyle(p.NORMAL);
        p.fill(210); p.textSize(11);
        p.text('Score '+sk.score.toFixed(2)+'  ('+(diff>=0?'+':'')+diff.toFixed(2)+' vs neutral)', tx+pad, ty+pad+20);
        // brighter version of the series color so it's readable on dark bg
        p.fill(Math.min(255,r+90), Math.min(255,g+90), Math.min(255,b+90));
        p.text(interp, tx+pad, ty+pad+38);
        p.fill(150); p.textSize(9);
        p.text(sk.q, tx+pad, ty+pad+56);
      }
    });
  }

  function drawLegend(p) {
    const items = [
      { label: 'Productivity skills (AI helps more)', col: PROD_COL  },
      { label: 'Thinking skills (AI helps less)',     col: THINK_COL },
    ];
    const ly = oy + plotH + 78;
    p.textSize(11);
    let totalW = 0;
    items.forEach(({label}) => { totalW += p.textWidth(label) + 50; });
    let lx = ox + (plotW - totalW)/2;
    if(lx < ox) lx = ox;
    items.forEach(({ label, col }) => {
      const [r,g,b] = col;
      p.noStroke(); p.fill(r,g,b); p.circle(lx+7, ly, 13);
      p.fill(50); p.textSize(11); p.textAlign(p.LEFT, p.CENTER);
      p.text(label, lx+18, ly);
      lx += p.textWidth(label) + 50;
    });
  }

  function checkHover(p) {
    hoveredItem = null;
    SKILLS.forEach((_, i) => {
      const y = yPos(i);
      if (p.mouseY>y-22 && p.mouseY<y+22 && p.mouseX>ox-10 && p.mouseX<ox+plotW+100)
        hoveredItem = i;
    });
  }

  return {
    draw: function (p, manager, ai, progress) {
      if (ai !== 5) return;

      if (lastAi !== ai) {
        lastAi = ai;
        animStart = Date.now();
      }

      if (lastP !== p) { lastP = p; computeLayout(p); }
      checkHover(p);
      p.background(255);

      p.fill(30); p.noStroke(); p.textAlign(p.LEFT, p.TOP);
      p.textSize(14); p.textStyle(p.BOLD);
      p.text('AI boosts everyday productivity more than deeper thinking skills', ox, 12);
      p.textStyle(p.NORMAL);
      p.fill(140); p.textSize(11); p.textStyle(p.ITALIC); p.textAlign(p.LEFT,p.TOP);
      p.text('Hover any dot for details. Score 3 = neutral; further right = AI helps more.', ox, 34);
      p.textStyle(p.NORMAL);

      drawGrid(p);
      drawSeparator(p);
      drawLollipops(p);
      drawGapAnnotation(p);
      drawLegend(p);
    }
  };
})();
