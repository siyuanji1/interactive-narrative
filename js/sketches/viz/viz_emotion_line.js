window.VizEmotionLine = (function () {

  const USAGE_ORDER = ['Rarely','Occasionally','Moderately','Considerably','Extensively'];
  const FIELDS = ['Applied Sciences','Social Sciences','Arts & Humanities','Natural & Life Sciences'];

  let rawData = null, aggData = {}, activeField = 'All';
  let margin, plotW, plotH, ox, oy, lastP = null, buttons = [];
  let animStart = null, lastAi = null;
  const ANIM_DURATION = 1200; // ms
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
    const labels=['All',...FIELDS], bw=140,bh=28,gap=8;
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
    p.textSize(12); p.fill(100);
    p.text('AI usage level (Q15)',ox+plotW/2,oy+plotH+32);
  }

  function drawLines(p, animProg) {
    const data = aggData[activeField];
    if (!data) return;
    const totalPoints = USAGE_ORDER.length - 1;

    const EMOTIONS = [
      { key: 'curious', label: 'Curious', color: [34, 139, 34] },
      { key: 'anxious', label: 'Anxious', color: [210, 60, 60] },
    ];

    const lastU = USAGE_ORDER[USAGE_ORDER.length-1];

    EMOTIONS.forEach(em=>{
      const [r,g,b]=em.color;

      p.stroke(r,g,b,230); p.strokeWeight(3); p.noFill();
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
          p.textAlign(p.LEFT,p.CENTER); p.textSize(12);
          p.text(em.label+' '+(lastVal>=0?'+':'')+lastVal.toFixed(0)+'%',lx,actualY);
          p.textSize(9); p.fill(r,g,b,150); p.textStyle(p.ITALIC);
          if(em.key==='curious') p.text('rose strongly',lx,actualY+13);
          if(em.key==='anxious') p.text('barely moved',lx,actualY+13);
          p.textStyle(p.NORMAL);
        }
      }
    });
  }

  function drawLegend(p) {
    const items=[{label:'Curious',col:[34,139,34]},{label:'Anxious',col:[210,60,60]}];
    let lx=ox, ly=oy-32;
    items.forEach(item=>{
      const [r,g,b]=item.col;
      p.stroke(r,g,b); p.strokeWeight(3); p.line(lx,ly,lx+20,ly);
      p.fill(r,g,b); p.noStroke(); p.circle(lx+10,ly,8);
      p.fill(50); p.textSize(11); p.textAlign(p.LEFT,p.CENTER);
      p.text(item.label,lx+26,ly); lx+=p.textWidth(item.label)+48;
    });
  }

  function drawButtons(p) {
    buttons.forEach(b=>{
      const active=b.label===activeField;
      p.fill(active?60:245); p.stroke(active?60:200); p.strokeWeight(1);
      p.rect(b.x,b.y,b.w,b.h,4);
      p.fill(active?255:70); p.noStroke();
      p.textAlign(p.CENTER,p.CENTER); p.textSize(10);
      p.text(b.label,b.x+b.w/2,b.y+b.h/2);
    });
  }

  return {
    draw: function(p, manager, ai, progress) {
      if(ai!==3) return;

      // reset animation when section becomes active
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
        if(activeField !== prevField) animStart = Date.now(); // replay on field change
      }

      const elapsed = animStart ? Date.now() - animStart : ANIM_DURATION;
      const rawT = Math.min(1, elapsed / ANIM_DURATION);
      const animProg = easeOut(rawT);

      p.background(255);
      drawGrid(p); drawAxes(p); drawLines(p, animProg); drawLegend(p); drawButtons(p);
    }
  };
})();