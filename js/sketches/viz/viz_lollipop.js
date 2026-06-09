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
  const THINK_COL = [196, 121, 38];   // strong amber
  const NEUTRAL   = 3;
  const X_MIN = 1, X_MAX = 5;
  const ANIM_DURATION = 1000;
  const STAGGER = 120;

  let margin, plotW, plotH, ox, oy, lastP = null;
  let animStart = null, lastAi = null;

  function easeOut(t){ return 1 - Math.pow(1-t, 3); }

  function computeLayout(p) {
    margin = { top: 130, right: 210, bottom: 110, left: 200 };
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

  // group annotations: one for the top (productivity) block, one for the bottom (thinking) block
  function drawGroupAnnotations(p) {
    const prodAvg = (3.584+3.545+3.539)/3;
    const thinkAvg = (3.227+3.124+3.037)/3;
    const ax = ox + plotW + 18;

    // productivity block annotation — aligned with the middle of the top 3 rows
    const prodY = (yPos(0) + yPos(2)) / 2;
    p.noStroke(); p.textAlign(p.LEFT, p.CENTER);
    p.fill(PROD_COL[0],PROD_COL[1],PROD_COL[2]); p.textSize(15); p.textStyle(p.BOLD);
    p.text('Productivity', ax, prodY - 12);
    p.text('avg ' + prodAvg.toFixed(2), ax, prodY + 8);
    p.fill(110); p.textStyle(p.ITALIC); p.textSize(11);
    p.text('clearly above neutral', ax, prodY + 28);

    // thinking block annotation — aligned with the middle of the bottom 3 rows
    const thinkY = (yPos(3) + yPos(5)) / 2;
    p.noStroke(); p.textStyle(p.BOLD);
    p.fill(THINK_COL[0],THINK_COL[1],THINK_COL[2]); p.textSize(15);
    p.text('Thinking', ax, thinkY - 12);
    p.text('avg ' + thinkAvg.toFixed(2), ax, thinkY + 8);
    p.fill(110); p.textStyle(p.ITALIC); p.textSize(11);
    p.text('barely above neutral', ax, thinkY + 28);
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

      if (t > 0) {
        p.stroke(r,g,b,160); p.strokeWeight(2.4);
        p.line(nx, y, x, y);
      }
      if (t > 0) {
        p.noStroke(); p.fill(r,g,b,235);
        p.circle(x, y, dotR);
      }

      p.fill(r,g,b,235); p.textAlign(p.LEFT,p.CENTER);
      p.textSize(13); p.textStyle(p.NORMAL);
      p.text(sk.score.toFixed(2), xFull+16, y);

      p.noStroke(); p.fill(60);
      p.textAlign(p.RIGHT,p.CENTER);
      p.textSize(12);
      p.text(sk.label, ox-12, y);
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

  return {
    draw: function (p, manager, ai, progress) {
      if (ai !== 5) return;

      if (lastAi !== ai) {
        lastAi = ai;
        animStart = Date.now();
      }

      if (lastP !== p) { lastP = p; computeLayout(p); }
      p.background(255);

      p.fill(30); p.noStroke(); p.textAlign(p.LEFT, p.TOP);
      p.textSize(14); p.textStyle(p.BOLD);
      p.text('AI boosts everyday productivity more than deeper thinking skills', ox, 12);
      p.textStyle(p.NORMAL);
      p.fill(140); p.textSize(11); p.textStyle(p.ITALIC); p.textAlign(p.LEFT,p.TOP);
      p.text('Score 3 = neutral; further right = AI helps more.', ox, 34);
      p.textStyle(p.NORMAL);

      drawGrid(p);
      drawLollipops(p);
      drawGroupAnnotations(p);
      drawLegend(p);
    }
  };
})();
