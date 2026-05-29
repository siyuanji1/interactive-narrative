window.VizEmotionLine = (function () {

  const USAGE_ORDER = ['Rarely','Occasionally','Moderately','Considerably','Extensively'];
  const FIELDS = ['Applied Sciences','Social Sciences','Arts & Humanities','Natural & Life Sciences'];

  let rawData = null, aggData = {}, activeField = 'All';
  let margin, plotW, plotH, ox, oy, lastP = null, buttons = [];
  const minPct = -5, maxPct = 35;

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

  function drawGrid(p) {
    [0,10,20,30].forEach(v=>{
      p.stroke(v===0?80:0, v===0?80:0, v===0?80:0, v===0?160:22);
      p.strokeWeight(v===0?2:1);
      p.line(ox,yPos(v),ox+plotW,yPos(v));
    });
    USAGE_ORDER.forEach((_,i)=>{
      p.stroke(0,0,0,18); p.strokeWeight(1);
      p.line(xPos(i),oy,xPos(i),oy+plotH);
    });
  }

  function drawBand(p, data, key, color) {
    const [r,g,b] = color;
    // CI band using half-SD from line_pct_data (we'll use ±5% as visual band)
    const bandW = 5; // visual width in % units
    p.noStroke(); p.fill(r,g,b,35);
    p.beginShape();
    USAGE_ORDER.forEach((u,i)=>{
      const v=(data[u]&&data[u][key]!=null)?data[u][key]:0;
      p.vertex(xPos(i), yPos(v+bandW));
    });
    USAGE_ORDER.slice().reverse().forEach((u,i)=>{
      const v=(data[u]&&data[u][key]!=null)?data[u][key]:0;
      p.vertex(xPos(USAGE_ORDER.length-1-i), yPos(v-bandW));
    });
    p.endShape(p.CLOSE);
  }

  function drawLine(p, data, key, color, label, labelNote, labelOffsetY) {
    const [r,g,b] = color;
    // band
    drawBand(p, data, key, color);
    // line
    p.stroke(r,g,b,230); p.strokeWeight(3); p.noFill();
    p.beginShape();
    USAGE_ORDER.forEach((u,i)=>{
      const v=data[u]?data[u][key]:null;
      if(v==null) return;
      p.vertex(xPos(i),yPos(v));
    });
    p.endShape();
    // dots
    USAGE_ORDER.forEach((u,i)=>{
      const v=data[u]?data[u][key]:null;
      if(v==null) return;
      p.fill(r,g,b); p.noStroke();
      p.circle(xPos(i),yPos(v),10);
    });
    // right label
    const lastU=USAGE_ORDER[USAGE_ORDER.length-1];
    const lastV=data[lastU]?data[lastU][key]:null;
    if(lastV!=null){
      const lx=xPos(USAGE_ORDER.length-1)+14;
      const ly=yPos(lastV)+labelOffsetY;
      const actualY=yPos(lastV);
      if(Math.abs(ly-actualY)>3){
        p.stroke(r,g,b,80); p.strokeWeight(1);
        p.line(xPos(USAGE_ORDER.length-1)+6,actualY,lx,ly);
      }
      p.fill(r,g,b); p.noStroke();
      p.textAlign(p.LEFT,p.CENTER); p.textSize(13);
      p.text(label+' '+(lastV>=0?'+':'')+lastV.toFixed(0)+'%',lx,ly);
      p.textSize(10); p.fill(r,g,b,160); p.textStyle(p.ITALIC);
      p.text(labelNote,lx,ly+16); p.textStyle(p.NORMAL);
    }
  }

  function drawAxes(p) {
    p.noStroke();
    [0,10,20,30].forEach(v=>{
      p.fill(80); p.textSize(10); p.textAlign(p.RIGHT,p.CENTER);
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
    p.text('← starting point',ox+4,yPos(0)-10);
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
      const data=aggData[activeField];
      p.background(255);
      drawGrid(p);
      drawAxes(p);
      if(data){
        drawLine(p,data,'curious',[34,139,34],'Curious','rose strongly',-20);
        drawLine(p,data,'anxious',[210,60,60],'Anxious','barely moved',20);
      }
      drawButtons(p);
    }
  };
})();
