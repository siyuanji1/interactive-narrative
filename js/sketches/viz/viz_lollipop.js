// viz_lollipop.js
// Lollipop chart: perceived skill outcomes from using ChatGPT
// Green = productivity skills (high), Red = thinking skills (low)
// Active at section index 5

window.VizLollipop = (function () {

  let rawData = null;
  let margin, plotW, plotH, ox, oy;
  let lastP = null;
  let hoveredItem = null;

  const PRODUCTIVITY_COLOR = [29, 158, 117];  // teal/green
  const THINKING_COLOR     = [224,  75,  74];  // coral/red

  function loadData(callback) {
    if (rawData !== null) { callback(); return; }
    fetch('data/lollipop_data.json')
      .then(r => r.json())
      .then(data => { rawData = data; callback(); })
      .catch(err => { console.error('lollipop_data.json failed', err); rawData = []; callback(); });
  }

  function computeLayout(p) {
    margin = { top: 60, right: 60, bottom: 80, left: 180 };
    plotW  = p.width  - margin.left - margin.right;
    plotH  = p.height - margin.top  - margin.bottom;
    ox     = margin.left;
    oy     = margin.top;
  }

  function drawGrid(p) {
    p.stroke(0, 0, 0, 20); // 干净的半透明黑网格线
    p.strokeWeight(1);
    for (let v = 1; v <= 5; v += 0.5) {
      const x = ox + ((v - 1) / 4) * plotW;
      p.line(x, oy, x, oy + plotH);
    }
    // neutral line at 3
    const neutralX = ox + ((3 - 1) / 4) * plotW;
    p.stroke(0, 0, 0, 60); // 明显的基准线
    p.strokeWeight(1.5);
    p.line(neutralX, oy - 10, neutralX, oy + plotH + 10);
    p.noStroke();
    p.fill(80); // 深灰色基准线文字
    p.textSize(10);
    p.textAlign(p.CENTER, p.TOP);
    p.text('Neutral (3)', neutralX, oy + plotH + 8);
  }

  function drawAxes(p) {
    p.noStroke();
    p.textSize(11);
    p.fill(60); // 刻度数字
    p.textAlign(p.CENTER, p.TOP);
    [1, 2, 3, 4, 5].forEach(v => {
      const x = ox + ((v - 1) / 4) * plotW;
      p.text(v, x, oy + plotH + 28);
    });
    p.textSize(12);
    p.fill(100); // X轴标题
    p.textAlign(p.CENTER, p.TOP);
    p.text('"ChatGPT can improve my..." (1=Strongly disagree → 5=Strongly agree)', ox + plotW / 2, oy + plotH + 46);
  }

  function drawLollipops(p) {
    if (!rawData) return;
    const rowH = plotH / rawData.length;

    rawData.forEach((d, i) => {
      const y    = oy + (i + 0.5) * rowH;
      const x    = ox + ((d.score - 1) / 4) * plotW;
      const baseX = ox + ((3 - 1) / 4) * plotW;
      const col  = d.type === 'productivity' ? PRODUCTIVITY_COLOR : THINKING_COLOR;
      const [r, g, b] = col;
      const isHov = hoveredItem === i;

      // stem
      p.stroke(r, g, b, isHov ? 255 : 160);
      p.strokeWeight(isHov ? 2.5 : 1.5);
      p.line(baseX, y, x, y);

      // dot
      p.noStroke();
      p.fill(r, g, b, isHov ? 255 : 200);
      p.circle(x, y, isHov ? 18 : 13);

      // skill label
      p.fill(isHov ? 0 : 50); // 悬停纯黑，默认深灰
      p.textSize(12);
      p.textAlign(p.RIGHT, p.CENTER);
      p.text(d.skill, ox - 10, y);

      // score label
      p.fill(r, g, b);
      p.textSize(11);
      p.textAlign(d.score >= 3 ? p.LEFT : p.RIGHT, p.CENTER);
      p.text(d.score.toFixed(2), d.score >= 3 ? x + 12 : x - 12, y);
    });
  }

  function drawLegend(p) {
    const items = [
      { label: 'Productivity skills (AI helps more)', color: PRODUCTIVITY_COLOR },
      { label: 'Thinking skills (AI helps less)',     color: THINKING_COLOR     },
    ];
    let lx = ox, ly = oy - 28;
    items.forEach(item => {
      const [r,g,b] = item.color;
      p.fill(r,g,b); p.noStroke();
      p.circle(lx + 5, ly, 10);
      p.fill(60); // 图例深灰字
      p.textSize(11);
      p.textAlign(p.LEFT, p.CENTER);
      p.text(item.label, lx + 14, ly);
      lx += p.textWidth(item.label) + 36;
    });
  }

  function checkHover(p) {
    hoveredItem = null;
    if (!rawData) return;
    const rowH = plotH / rawData.length;
    rawData.forEach((d, i) => {
      const y = oy + (i + 0.5) * rowH;
      const x = ox + ((d.score - 1) / 4) * plotW;
      if (p.dist(p.mouseX, p.mouseY, x, y) < 14) hoveredItem = i;
    });
  }

  function drawTooltip(p, i) {
    const d    = rawData[i];
    const rowH = plotH / rawData.length;
    const y    = oy + (i + 0.5) * rowH;
    const x    = ox + ((d.score - 1) / 4) * plotW;
    const col  = d.type === 'productivity' ? PRODUCTIVITY_COLOR : THINKING_COLOR;
    const [r,g,b] = col;

    const tw = 220, th = 52, pad = 8;
    let tx = x + 14, ty = y - th / 2;
    if (tx + tw > p.width - 10) tx = x - tw - 14;
    if (ty < 4) ty = 4;

    // 高质感浅色提示框
    p.fill(248, 248, 250, 240);
    p.stroke(200); p.strokeWeight(1);
    p.rect(tx, ty, tw, th, 6);
    p.noStroke();
    p.textAlign(p.LEFT, p.TOP);
    
    p.textSize(12); p.fill(40); // 修复了这里的崩溃隐患
    p.text(d.skill, tx + pad, ty + pad);
    p.textSize(11); p.fill(r,g,b);
    p.text('Score: ' + d.score.toFixed(2) + ' / 5  (' + (d.type === 'productivity' ? 'productivity' : 'thinking') + ')', tx + pad, ty + pad + 18);
    p.fill(110);
    p.text('Based on ' + (d.type === 'productivity' ? 'Q26' : 'Q29') + ' · n=15,734', tx + pad, ty + pad + 32);
  }

  return {
    draw: function (p, manager, ai, progress) {
      if (ai !== 5) return;

      if (rawData === null) {
        loadData(() => { computeLayout(p); lastP = p; });
        p.background(255); // Loading背景纯白
        p.fill(120); p.noStroke();
        p.textAlign(p.CENTER, p.CENTER); p.textSize(14);
        p.text('Loading...', p.width/2, p.height/2);
        return;
      }

      if (lastP !== p) { lastP = p; computeLayout(p); }

      checkHover(p);

      p.background(255); // 主背景纯白
      drawGrid(p);
      drawAxes(p);
      drawLollipops(p);
      drawLegend(p);
      if (hoveredItem !== null) drawTooltip(p, hoveredItem);
    }
  };
})();