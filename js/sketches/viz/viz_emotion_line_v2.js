window.VizEmotionLine = (function () {

  const USAGE_ORDER = ['Rarely','Occasionally','Moderately','Considerably','Extensively'];
  const EMOTIONS = [
    { key: 'curious', label: 'Curious', color: [34, 139, 34]  },
    { key: 'hopeful', label: 'Hopeful', color: [186, 117, 23] },
    { key: 'bored',   label: 'Bored',   color: [160,160,160]  },
    { key: 'anxious', label: 'Anxious', color: [210, 60,  60] },
  ];
  const FIELDS = ['Applied Sciences','Social Sciences','Arts & Humanities','Natural & Life Sciences'];

  let rawData = null, aggData = {}, activeField = 'All';
  let margin, plotW, plotH, ox, oy, lastP = null, buttons = [];
  const minPct = -20, maxPct = 55;

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
    margin={top:70,right:170,bottom:90,left:75};
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

  function drawGrid(p) {
    [-20,-10,0,10,20,30,40,50].forEach(v=>{
      if(v<minPct||v>maxPct) return;
      p.stroke(v===0?60:0,v===0?60:0,v===0?60:0,v===0?140:20);
      p.strokeWeight(v===0?2:1);
      p.line(ox,yPos(v),ox+plotW,yPos(v));
    });
    USAGE_ORDER.forEach((_,i)=>{p.stroke(0,0,0,18);p.strokeWeight(1);p.line(xPos(i),oy,xPos(i),oy+plotH);});
  }

  function drawGapShading(p) {
    const data=aggData[activeField]; if(!data) return;
    p.noStroke(); p.fill(34,139,34,22);
    p.beginShape();
    USAGE_ORDER.forEach((u,i)=>{ const v=data[u]?data[u]['curious']:0; p.vertex(xPos(i),yPos(v||0)); });
    USAGE_ORDER.slice().reverse().forEach((u,i)=>{ const v=data[u]?data[u]['anxious']:0; p.vertex(xPos(USAGE_ORDER.length-1-i),yPos(v||0)); });
    p.endShape(p.CLOSE);
    const midU=USAGE_ORDER[3];
    if(data[midU]){
      const cy=data[midU]['curious']||0, ay=data[midU]['anxious']||0;
      p.fill(34,120,34,140); p.noStroke();
      p.textAlign(p.CENTER,p.CENTER); p.textSize(10); p.textStyle(p.ITALIC);
      p.text('growing gap',xPos(3),(yPos(cy)+yPos(ay))/2); p.textStyle(p.NORMAL);
    }
  }

  function drawAxes(p) {
    p.noStroke();
    p.fill(60); p.textSize(11); p.textAlign(p.RIGHT,p.CENTER);
    p.text('0% baseline',ox-8,yPos(0));
    [-10,10,20,30,40,50].forEach(v=>{
      if(v<minPct||v>maxPct) return;
      p.fill(100); p.textSize(10); p.textAlign(p.RIGHT,p.CENTER);
      p.text((v>0?'+':'')+v+'%',ox-8,yPos(v));
    });
    p.push(); p.translate(14,oy+plotH/2); p.rotate(-p.HALF_PI);
    p.textAlign(p.CENTER,p.CENTER); p.textSize(11); p.fill(100);
    p.text('Change from baseline (Rarely = 0%)',0,0); p.pop();
    p.textAlign(p.CENTER,p.TOP); p.textSize(11); p.fill(60);
    USAGE_ORDER.forEach((l,i)=>p.text(l,xPos(i),oy+plotH+10));
    p.textSize(12); p.fill(100);
    p.text('AI usage level (Q15)',ox+plotW/2,oy+plotH+32);
    p.fill(80); p.textSize(10); p.textAlign(p.LEFT,p.CENTER);
    p.text('← all emotions start here',ox+6,yPos(0)-11);
  }

  function drawLines(p) {
    const data=aggData[activeField]; if(!data) return;
    const lastU=USAGE_ORDER[USAGE_ORDER.length-1];

    // Get last values and sort descending
    const withVals = EMOTIONS.map(em=>({
      em, val: data[lastU]?(data[lastU][em.key]??null):null
    })).filter(x=>x.val!==null).sort((a,b)=>b.val-a.val);

    // Assign fixed evenly-spaced label positions in right margin
    // Spread across middle 60% of plot height to avoid top/bottom edges
    const LABEL_SPACING = 28;
    const totalH = (withVals.length - 1) * LABEL_SPACING;
    const startY = oy + plotH/2 - totalH/2;
    const labelY = {};
    withVals.forEach(({em}, idx) => {
      labelY[em.key] = startY + idx * LABEL_SPACING;
    });

    // Draw lines and dots
    EMOTIONS.forEach(em=>{
      const [r,g,b]=em.color;
      const isKey=em.key==='curious'||em.key==='anxious';
      p.stroke(r,g,b,isKey?240:140); p.strokeWeight(isKey?3:1.5); p.noFill();
      p.beginShape();
      USAGE_ORDER.forEach((u,i)=>{
        const val=data[u]?data[u][em.key]:null;
        if(val==null) return;
        p.vertex(xPos(i),yPos(val));
      });
      p.endShape();
      USAGE_ORDER.forEach((u,i)=>{
        const val=data[u]?data[u][em.key]:null;
        if(val==null) return;
        p.fill(r,g,b,isKey?240:140); p.noStroke();
        p.circle(xPos(i),yPos(val),isKey?9:6);
      });
    });

    // Draw labels with connector lines
    EMOTIONS.forEach(em=>{
      const [r,g,b]=em.color;
      const val=data[lastU]?(data[lastU][em.key]??null):null;
      if(val==null || labelY[em.key]==null) return;
      const isKey=em.key==='curious'||em.key==='anxious';
      const lx=xPos(USAGE_ORDER.length-1)+14;
      const ly=labelY[em.key];
      const actualY=yPos(val);

      // connector
      p.stroke(r,g,b,90); p.strokeWeight(1);
      p.line(xPos(USAGE_ORDER.length-1)+5, actualY, lx-2, ly);

      // label
      p.fill(r,g,b); p.noStroke();
      p.textAlign(p.LEFT,p.CENTER); p.textSize(isKey?12:11);
      p.text(em.label+' '+(val>=0?'+':'')+val.toFixed(0)+'%', lx, ly);

      if(em.key==='anxious'){
        p.textSize(9); p.fill(r,g,b,150); p.textStyle(p.ITALIC);
        p.text('barely moved',lx,ly+13); p.textStyle(p.NORMAL);
      }
      if(em.key==='curious'){
        p.textSize(9); p.fill(r,g,b,150); p.textStyle(p.ITALIC);
        p.text('rose strongly',lx,ly+13); p.textStyle(p.NORMAL);
      }
    });
  }

  function drawLegend(p) {
    let lx=ox, ly=oy-38;
    EMOTIONS.forEach(em=>{
      const [r,g,b]=em.color, isKey=em.key==='curious'||em.key==='anxious';
      p.stroke(r,g,b); p.strokeWeight(isKey?3:1.5); p.line(lx,ly,lx+20,ly);
      p.fill(r,g,b); p.noStroke(); p.circle(lx+10,ly,isKey?8:6);
      p.fill(50); p.textSize(11); p.textAlign(p.LEFT,p.CENTER);
      p.text(em.label,lx+26,ly); lx+=p.textWidth(em.label)+48;
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
    draw: function(p,manager,ai,progress) {
      if(ai!==3) return;
      if(rawData===null){
        loadData(()=>{computeLayout(p);buildButtons(p);lastP=p;});
        p.background(255); p.fill(120); p.noStroke();
        p.textAlign(p.CENTER,p.CENTER); p.textSize(14);
        p.text('Loading...',p.width/2,p.height/2); return;
      }
      if(lastP!==p){lastP=p;computeLayout(p);buildButtons(p);}
      if(p.mouseIsPressed){
        buttons.forEach(b=>{
          if(p.mouseX>b.x&&p.mouseX<b.x+b.w&&p.mouseY>b.y&&p.mouseY<b.y+b.h) activeField=b.label;
        });
      }
      p.background(255);
      drawGrid(p); drawGapShading(p); drawAxes(p); drawLines(p); drawLegend(p); drawButtons(p);
    }
  };
})();
