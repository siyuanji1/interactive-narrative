window.VizEmotionLine = (function () {

  const USAGE_ORDER = ['Rarely','Occasionally','Moderately','Considerably','Extensively'];
  const FIELDS = ['Applied Sciences','Social Sciences','Arts & Humanities','Natural & Life Sciences'];

  const FIELD_COLORS = {
    'All':                     [90, 90, 110],
    'Applied Sciences':        [40, 140, 80],
    'Social Sciences':         [50, 100, 180],
    'Arts & Humanities':       [180, 60, 90],
    'Natural & Life Sciences': [190, 120, 20],
  };

  const CURIOUS_COL = [14, 116, 144];   // deep teal
  const ANXIOUS_COL = [120, 70, 160];   // purple (distinct from discipline colors)

  let rawData = null, aggData = {}, activeField = 'All';
  let margin, plotW, plotH, ox, oy, lastP = null, buttons = [];
  let animStart = null, lastAi = null;
  let wasPressed = false;
  const ANIM_DURATION = 1100;
  const minPct = -8, maxPct = 30;

  function loadData(cb) {
    if (rawData !== null) { cb(); return; }
    fetch('data/line_pct_data.json').then(r=>r.json()).then(d=>{rawData=d;buildAgg();cb();}).catch(()=>{rawData=[];cb();});
  }

  function buildAgg() {
    aggData = {};
    rawData.forEach(d=>{
      if(!aggData[d.field]) aggData[d.field]={};
      if(!aggData[d.field][d.usage]) aggData[d.field][d.usage]={};
      aggData[d.field][d.usage][d.emotion]={pct:d.pct_change, lo:d.ci_low, hi:d.ci_high, mean:d.mean, n:d.n};
    });
  }

  function computeLayout(p) {
    margin={top:92,right:185,bottom:155,left:78};
    plotW=p.width-margin.left-margin.right;
    plotH=p.height-margin.top-margin.bottom;
    ox=margin.left; oy=margin.top;
  }

  function buildButtons(p) {
    buttons=[];
    const labels=['All',...FIELDS], bw=158,bh=26,gap=8;
    let bx=ox, by=oy+plotH+78;
    labels.forEach(label=>{
      if(bx+bw>p.width-10){bx=ox;by+=bh+gap;}
      buttons.push({label,x:bx,y:by,w:bw,h:bh}); bx+=bw+gap;
    });
  }

  function yPos(v){return oy+plotH-((v-minPct)/(maxPct-minPct))*plotH;}
  function groupX(i){return ox+(i+0.5)*(plotW/USAGE_ORDER.length);}

  function easeOut(t){ return 1 - Math.pow(1-t, 3); }
  function getVal(data, u, key){ return data[u] && data[u][key] ? data[u][key] : null; }

  function drawGrid(p) {
    [-5,0,5,10,15,20,25,30].forEach(v=>{
      if(v<minPct||v>maxPct) return;
      p.stroke(v===0?80:0,v===0?80:0,v===0?80:0,v===0?160:18);
      p.strokeWeight(v===0?2:1);
      p.line(ox,yPos(v),ox+plotW,yPos(v));
    });
  }

  function drawAxes(p) {
    p.noStroke();
    [-5,0,5,10,15,20,25,30].forEach(v=>{
      if(v<minPct||v>maxPct) return;
      p.fill(v===0?60:110); p.textSize(10); p.textAlign(p.RIGHT,p.CENTER);
      p.text((v>0?'+':'')+v+'%',ox-8,yPos(v));
    });
    p.push(); p.translate(15,oy+plotH/2); p.rotate(-p.HALF_PI);
    p.textAlign(p.CENTER,p.CENTER); p.textSize(11); p.fill(80);
    p.text('Change in how often felt (vs. lightest AI users)',0,0); p.pop();
    p.textAlign(p.CENTER,p.TOP); p.textSize(11); p.fill(60);
    USAGE_ORDER.forEach((l,i)=>{
      const label = (l === 'Rarely') ? 'Rarely\n(baseline)' : l;
      p.text(label, groupX(i), oy+plotH+10);
    });
    p.textSize(10); p.fill(130); p.textStyle(p.ITALIC); p.textAlign(p.CENTER,p.TOP);
    p.text('Baseline = lightest users\' average (curious 3.06 / anxious 2.03 on a 1\u20135 scale)', ox+plotW/2, oy+plotH+46);
    p.textStyle(p.NORMAL);
  }

  function drawBars(p, animProg) {
    const data = aggData[activeField];
    if (!data) return;
    const groupW = plotW/USAGE_ORDER.length;
    const barW = Math.min(32, groupW*0.26);
    const gap = 7;
    const zeroY = yPos(0);

    const EMOTIONS = [
      { key:'curious', col:CURIOUS_COL, side:-1, label:'Curious' },
      { key:'anxious', col:ANXIOUS_COL, side: 1, label:'Anxious' },
    ];

    USAGE_ORDER.forEach((u,i)=>{
      const gx = groupX(i);
      EMOTIONS.forEach(em=>{
        const d = getVal(data,u,em.key); if(!d) return;
        const full = d.pct;
        const val = full*animProg;
        const bx = gx + em.side*(gap/2) + (em.side<0 ? -barW : 0);
        const yv = yPos(val);
        const h = Math.abs(yv - zeroY);
        const top = val>=0 ? yv : zeroY;
        const [r,g,b]=em.col;

        p.noStroke();
        p.fill(r,g,b, 230);
        p.rect(bx, top, barW, Math.max(h,0), 3);

        // value label on top of each bar (always visible, fades in with animation)
        if(animProg > 0.6 && Math.abs(full) > 0.3){
          p.fill(r,g,b, 255*Math.min(1,(animProg-0.6)/0.4));
          p.textAlign(p.CENTER, full>=0?p.BOTTOM:p.TOP);
          p.textSize(10); p.textStyle(p.BOLD);
          const fullYv2 = yPos(full);
          p.text((full>=0?'+':'')+full.toFixed(0)+'%', bx+barW/2, full>=0?fullYv2-3:fullYv2+3);
          p.textStyle(p.NORMAL);
        }
      });
    });
  }

  function drawEndLabels(p, animProg){
    if(animProg < 1) return;
    const data = aggData[activeField];
    if(!data) return;
    const last = USAGE_ORDER.length-1;
    const cd = getVal(data,USAGE_ORDER[last],'curious');
    const ad = getVal(data,USAGE_ORDER[last],'anxious');
    const lx = ox+plotW+8;
    if(cd){
      p.fill(CURIOUS_COL[0],CURIOUS_COL[1],CURIOUS_COL[2]); p.noStroke();
      p.textAlign(p.LEFT,p.CENTER); p.textSize(12); p.textStyle(p.BOLD);
      p.text('Curious '+(cd.pct>=0?'+':'')+cd.pct.toFixed(0)+'%', lx, yPos(cd.pct));
      p.textSize(9); p.fill(CURIOUS_COL[0],CURIOUS_COL[1],CURIOUS_COL[2],150); p.textStyle(p.ITALIC);
      p.text('rose strongly', lx, yPos(cd.pct)+13);
    }
    if(ad){
      p.fill(ANXIOUS_COL[0],ANXIOUS_COL[1],ANXIOUS_COL[2]); p.noStroke();
      p.textAlign(p.LEFT,p.CENTER); p.textSize(12); p.textStyle(p.BOLD);
      p.text('Anxious '+(ad.pct>=0?'+':'')+ad.pct.toFixed(0)+'%', lx, yPos(ad.pct));
      p.textSize(9); p.fill(ANXIOUS_COL[0],ANXIOUS_COL[1],ANXIOUS_COL[2],150); p.textStyle(p.ITALIC);
      p.text('barely moved', lx, yPos(ad.pct)+13);
    }
    p.textStyle(p.NORMAL);
  }

  function drawLegend(p) {
    const items=[
      {label:'Curious', col:CURIOUS_COL},
      {label:'Anxious', col:ANXIOUS_COL},
    ];
    let lx=ox, ly=oy-34;
    items.forEach(item=>{
      const [r,g,b]=item.col;
      p.noStroke(); p.fill(r,g,b); p.rect(lx,ly-7,16,14,3);
      p.fill(50); p.textSize(11); p.textAlign(p.LEFT,p.CENTER);
      p.text(item.label,lx+24,ly); lx+=p.textWidth(item.label)+64;
    });
    p.fill(140); p.noStroke(); p.textSize(11); p.textStyle(p.ITALIC);
    p.text('values shown above each bar', lx, ly);
    p.textStyle(p.NORMAL);
  }

  function drawButtons(p) {
    buttons.forEach(b=>{
      const active=b.label===activeField;
      const [r,g,b2]=FIELD_COLORS[b.label]||[90,90,110];
      if(active){ p.fill(r,g,b2); p.stroke(r,g,b2); }
      else { p.fill(255); p.stroke(r,g,b2,180); }
      p.strokeWeight(1.5);
      p.rect(b.x,b.y,b.w,b.h,4);
      p.noStroke();
      if(active) p.fill(255); else p.fill(r,g,b2);
      p.textAlign(p.CENTER,p.CENTER); p.textSize(11); p.textStyle(p.BOLD);
      p.text(b.label,b.x+b.w/2,b.y+b.h/2);
      p.textStyle(p.NORMAL);
    });
  }

  return {
    draw: function(p, manager, ai, progress) {
      if(ai!==3) return;
      if(lastAi !== ai){ lastAi = ai; animStart = Date.now(); }

      if(rawData===null){
        loadData(()=>{computeLayout(p);buildButtons(p);lastP=p;animStart=Date.now();});
        p.background(255); p.fill(120); p.noStroke();
        p.textAlign(p.CENTER,p.CENTER); p.textSize(14);
        p.text('Loading...',p.width/2,p.height/2); return;
      }
      if(lastP!==p){lastP=p;computeLayout(p);buildButtons(p);}

      // click-edge detection for buttons (fires once per press)
      const inCanvas = p.mouseX>=0 && p.mouseX<=p.width && p.mouseY>=0 && p.mouseY<=p.height;
      if(p.mouseIsPressed && !wasPressed && inCanvas){
        const prevField = activeField;
        buttons.forEach(b=>{
          if(p.mouseX>b.x&&p.mouseX<b.x+b.w&&p.mouseY>b.y&&p.mouseY<b.y+b.h) activeField=b.label;
        });
        if(activeField !== prevField) animStart = Date.now();
      }
      wasPressed = p.mouseIsPressed;
      // clear hover when mouse leaves canvas

      const elapsed = animStart ? Date.now() - animStart : ANIM_DURATION;
      const animProg = easeOut(Math.min(1, elapsed / ANIM_DURATION));

      p.background(255);
      p.fill(30); p.noStroke(); p.textAlign(p.LEFT, p.TOP);
      p.textSize(14); p.textStyle(p.BOLD);
      p.text('Heavier AI users feel far more curious, but no more anxious', ox, 10);
      p.textStyle(p.NORMAL);

      drawGrid(p); drawAxes(p);
      drawBars(p, animProg);
      drawEndLabels(p, animProg);
      drawLegend(p); drawButtons(p);
    }
  };
})();
