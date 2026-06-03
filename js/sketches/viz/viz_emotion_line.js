window.VizEmotionLine = (function () {

  const USAGE_ORDER = ['Rarely','Occasionally','Moderately','Considerably','Extensively'];
  const FIELDS = ['Applied Sciences','Social Sciences','Arts & Humanities','Natural & Life Sciences'];

  // field button colors (matching the field palette)
  const FIELD_COLORS = {
    'All':                     [90, 90, 110],
    'Applied Sciences':        [40, 140, 80],
    'Social Sciences':         [50, 100, 180],
    'Arts & Humanities':       [180, 60, 90],
    'Natural & Life Sciences': [190, 120, 20],
  };

  // emotion line colors: teal vs orange (colorblind-safe, high contrast)
  const CURIOUS_COL = [14, 116, 144];   // deep teal
  const ANXIOUS_COL = [217, 119, 6];    // warm orange

  let rawData = null, aggData = {}, activeField = 'All';
  let margin, plotW, plotH, ox, oy, lastP = null, buttons = [];
  let animStart = null, lastAi = null;
  const ANIM_DURATION = 1200;
  const minPct = -10, maxPct = 40;

  function loadData(cb) {
    if (rawData !== null) { cb(); return; }
    fetch('data/line_pct_data.json').then(r=>r.json()).then(d=>{rawData=d;buildAgg();cb();}).catch(()=>{rawData=[];cb();});
  }

  function buildAgg() {
    aggData = {};
    rawData.forEach(d=>{
      if(!aggData[d.field]) aggData[d.field]={};
      if(!aggData[d.field][d.usage]) aggData[d.field][d.usage]={};
      aggData[d.field][d.usage][d.emotion]=d.pct_change;
    });
  }

  function computeLayout(p) {
    margin={top:60,right:140,bottom:80,left:75};
    plotW=p.width-margin.left-margin.right;
    plotH=p.height-margin.top-margin.bottom-50;
    ox=margin.left; oy=margin.top;
  }

  function buildButtons(p) {
    buttons=[];
    const labels=['All',...FIELDS], bw=160,bh=28,gap=8;
    let bx=ox, by=oy+plotH+margin.bottom-10;
    labels.forEach(label=>{
      if(bx+bw>p.width-10){bx=ox;by+=bh+gap;}
      buttons.push({label,x:bx,y:by,w:bw,h:bh}); bx+=bw+gap;
    });
  }

  function xPos(i){return ox+(i/(USAGE_ORDER.length-1))*plotW;}
  function yPos(v){return oy+plotH-((v-minPct)/(maxPct-minPct))*plotH;}

  function easeOut(t){ return 1 - Math.pow(1-t, 3); }

  function drawGrid(p) {
    [-10,0,10,20,30,40].forEach(v=>{
      if(v<minPct||v>maxPct) return;
      p.stroke(v===0?80:0,v===0?80:0,v===0?80:0,v===0?160:18);
      p.strokeWeight(v===0?2:1);
      p.line(ox,yPos(v),ox+plotW,yPos(v));
    });
    USAGE_ORDER.forEach((_,i)=>{p.stroke(0,0,0,18);p.strokeWeight(1);p.line(xPos(i),oy,xPos(i),oy+plotH);});
  }

  function drawAxes(p) {
    p.noStroke();
    [-10,0,10,20,30,40].forEach(v=>{
      if(v<minPct||v>maxPct) return;
      p.fill(v===0?60:100); p.textSize(10); p.textAlign(p.RIGHT,p.CENTER);
      p.text((v>0?'+':'')+v+'%',ox-8,yPos(v));
    });
    p.push(); p.translate(14,oy+plotH/2); p.rotate(-p.HALF_PI);
    p.textAlign(p.CENTER,p.CENTER); p.textSize(11); p.fill(100);
    p.text('Change from baseline (Rarely = 0%)',0,0); p.pop();
    p.textAlign(p.CENTER,p.TOP); p.textSize(11); p.fill(60);
    USAGE_ORDER.forEach((l,i)=>p.text(l,xPos(i),oy+plotH+10));
    // NOTE: "AI usage level (Q15)" label removed — moved to citation text in index.html
  }

  // draw the "All" reference line in light gray (background comparison)
  function drawReferenceLines(p) {
    if (activeField === 'All') return;
    const ref = aggData['All'];
    if (!ref) return;
    ['curious','anxious'].forEach(key=>{
      p.stroke(190,190,190,180); p.strokeWeight(2); p.noFill();
      p.beginShape();
      USAGE_ORDER.forEach((u,i)=>{
        const val = ref[u]?ref[u][key]:null;
        if(val==null) return;
        p.vertex(xPos(i),yPos(val));
      });
      p.endShape();
    });
    // label for the gray reference
    const lastU = USAGE_ORDER[USAGE_ORDER.length-1];
    const cv = ref[lastU]?ref[lastU]['curious']:null;
    if(cv!=null){
      p.fill(170); p.noStroke(); p.textSize(9); p.textStyle(p.ITALIC);
      p.textAlign(p.LEFT,p.CENTER);
      p.text('(all fields avg)', xPos(USAGE_ORDER.length-1)+12, yPos(cv)-12);
      p.textStyle(p.NORMAL);
    }
  }

  function drawLines(p, animProg) {
    const data = aggData[activeField];
    if (!data) return;
    const totalPoints = USAGE_ORDER.length - 1;

    const EMOTIONS = [
      { key: 'curious', label: 'Curious', color: CURIOUS_COL, dashed: false },
      { key: 'anxious', label: 'Anxious', color: ANXIOUS_COL, dashed: true  },
    ];

    const lastU = USAGE_ORDER[USAGE_ORDER.length-1];

    EMOTIONS.forEach(em=>{
      const [r,g,b]=em.color;

      // line style: curious = bold solid, anxious = dashed
      if(em.dashed){
        p.drawingContext.setLineDash([6,6]);
        p.strokeWeight(2.5);
      } else {
        p.drawingContext.setLineDash([]);
        p.strokeWeight(4);
      }
      p.stroke(r,g,b,235); p.noFill();
      p.beginShape();
      for(let i=0; i<USAGE_ORDER.length; i++){
        const u = USAGE_ORDER[i];
        const val = data[u]?data[u][em.key]:null;
        if(val==null) continue;
        if(i===0){ p.vertex(xPos(i),yPos(val)); continue; }
        const segProg = Math.min(1, Math.max(0, animProg * totalPoints - (i-1)));
        const prevVal = data[USAGE_ORDER[i-1]]?data[USAGE_ORDER[i-1]][em.key]:null;
        if(prevVal==null) continue;
        const interpX = p.lerp(xPos(i-1), xPos(i), segProg);
        const interpY = p.lerp(yPos(prevVal), yPos(val), segProg);
        p.vertex(interpX, interpY);
        if(segProg < 1) break;
      }
      p.endShape();
      p.drawingContext.setLineDash([]);

      // dots
      USAGE_ORDER.forEach((u,i)=>{
        const val=data[u]?data[u][em.key]:null;
        if(val==null) return;
        const dotProg = animProg * totalPoints - (i-1);
        if(i===0 || dotProg >= 1){
          p.fill(r,g,b); p.noStroke(); p.circle(xPos(i),yPos(val),9);
        }
      });

      // end label
      if(animProg >= 1){
        const lastVal = data[lastU]?data[lastU][em.key]:null;
        if(lastVal!=null){
          const lx=xPos(USAGE_ORDER.length-1)+12;
          const actualY=yPos(lastVal);
          p.fill(r,g,b); p.noStroke();
          p.textAlign(p.LEFT,p.CENTER); p.textSize(12); p.textStyle(p.BOLD);
          p.text(em.label+' '+(lastVal>=0?'+':'')+lastVal.toFixed(0)+'%',lx,actualY);
          p.textStyle(p.NORMAL);
          p.textSize(9); p.fill(r,g,b,150); p.textStyle(p.ITALIC);
          if(em.key==='curious') p.text('rose strongly',lx,actualY+13);
          if(em.key==='anxious') p.text('barely moved',lx,actualY+13);
          p.textStyle(p.NORMAL);
        }
      }
    });
  }

  function drawLegend(p) {
    const items=[
      {label:'Curious', col:CURIOUS_COL, dashed:false},
      {label:'Anxious', col:ANXIOUS_COL, dashed:true},
    ];
    let lx=ox, ly=oy-32;
    items.forEach(item=>{
      const [r,g,b]=item.col;
      p.stroke(r,g,b);
      p.strokeWeight(item.dashed?2.5:4);
      if(item.dashed) p.drawingContext.setLineDash([5,5]);
      p.line(lx,ly,lx+22,ly);
      p.drawingContext.setLineDash([]);
      p.fill(r,g,b); p.noStroke(); p.circle(lx+11,ly,8);
      p.fill(50); p.textSize(11); p.textAlign(p.LEFT,p.CENTER);
      p.text(item.label,lx+30,ly); lx+=p.textWidth(item.label)+56;
    });
  }

  function drawButtons(p) {
    buttons.forEach(b=>{
      const active=b.label===activeField;
      const [r,g,b2]=FIELD_COLORS[b.label]||[90,90,110];
      if(active){
        p.fill(r,g,b2); p.stroke(r,g,b2);
      } else {
        p.fill(255); p.stroke(r,g,b2,180);
      }
      p.strokeWeight(1.5);
      p.rect(b.x,b.y,b.w,b.h,4);
      p.fill(active?255:[r,g,b2]); p.noStroke();
      if(!active){ p.fill(r,g,b2); }
      p.textAlign(p.CENTER,p.CENTER); p.textSize(11); p.textStyle(p.BOLD);
      p.text(b.label,b.x+b.w/2,b.y+b.h/2);
      p.textStyle(p.NORMAL);
    });
  }

  return {
    draw: function(p, manager, ai, progress) {
      if(ai!==3) return;

      if(lastAi !== ai){
        lastAi = ai;
        animStart = Date.now();
      }

      if(rawData===null){
        loadData(()=>{computeLayout(p);buildButtons(p);lastP=p;animStart=Date.now();});
        p.background(255); p.fill(120); p.noStroke();
        p.textAlign(p.CENTER,p.CENTER); p.textSize(14);
        p.text('Loading...',p.width/2,p.height/2); return;
      }
      if(lastP!==p){lastP=p;computeLayout(p);buildButtons(p);}

      if(p.mouseIsPressed){
        const prevField = activeField;
        buttons.forEach(b=>{
          if(p.mouseX>b.x&&p.mouseX<b.x+b.w&&p.mouseY>b.y&&p.mouseY<b.y+b.h) activeField=b.label;
        });
        if(activeField !== prevField) animStart = Date.now();
      }

      const elapsed = animStart ? Date.now() - animStart : ANIM_DURATION;
      const rawT = Math.min(1, elapsed / ANIM_DURATION);
      const animProg = easeOut(rawT);

      p.background(255);
      drawGrid(p); drawAxes(p);
      drawReferenceLines(p);
      drawLines(p, animProg); drawLegend(p); drawButtons(p);
    }
  };
})();