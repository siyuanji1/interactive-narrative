window.VizConclusion = (function () {

  const FINDINGS = [
    { kind:'dots',   big:'7 in 10',    small:'students have used AI',         col:[40,140,80]  },
    { kind:'blocks', big:'4 fields',   small:'each use it differently',       col:[50,100,180] },
    { kind:'lines',  big:'+24% / +3%', small:'curiosity rises, anxiety flat', col:[14,116,144] },
    { kind:'bar',    big:'Faster',     small:'not necessarily deeper',        col:[190,120,20] },
    { kind:'arrows', big:'It depends', small:'on your field',                 col:[180,60,90]  },
  ];
  const FIELD_COLS = [[40,140,80],[50,100,180],[180,60,90],[190,120,20]];
  const INTRO = 'Five findings, one story.';
  const TAKEAWAY_1 = 'AI makes learning easier,';
  const TAKEAWAY_2 = 'but not necessarily students stronger.';
  const TAKEAWAY_3 = 'The payoff depends not on whether you use it, but how.';

  const INTRO_IN=1300, INTRO_HOLD=1500, INTRO_OUT=800;
  const CARD_IN=1100, CARD_STAGGER=1150, HOLD=2200, FADE_OUT=1100, TAKE_IN=2400;

  let animStart = null, lastAi = null;

  function easeOut(t){ return 1-Math.pow(1-t,3); }
  function easeInOut(t){ return t<0.5?2*t*t:1-Math.pow(-2*t+2,2)/2; }
  function easeOutBack(t){ const c1=1.70158,c3=c1+1; return 1+c3*Math.pow(t-1,3)+c1*Math.pow(t-1,2); }
  function clamp(v){ return Math.min(1,Math.max(0,v)); }

  function drawIntro(p, t, cx, cy){
    let a=1;
    if(t<INTRO_IN) a=easeOut(t/INTRO_IN);
    else if(t>INTRO_IN+INTRO_HOLD) a=1-easeInOut(clamp((t-INTRO_IN-INTRO_HOLD)/INTRO_OUT));
    const slide=(1-easeOut(clamp(t/INTRO_IN)))*20;
    p.textAlign(p.CENTER,p.CENTER);
    p.fill(20,20,20,a*255); p.textSize(Math.min(42,p.width*0.052)); p.textStyle(p.BOLD);
    p.text(INTRO,cx,cy+slide);
    if(t>INTRO_IN*0.5){
      const uw=easeOut(clamp((t-INTRO_IN*0.5)/900))*140;
      p.stroke(14,116,144,a*255); p.strokeWeight(3);
      p.line(cx-uw/2,cy+46,cx+uw/2,cy+46); p.noStroke();
    }
  }

  function drawIcon(p, f, cx, cy, appear, ga){
    const ip=easeOut(clamp(appear/CARD_IN));
    const A=255*clamp(appear/CARD_IN)*ga;
    p.push();
    if(f.kind==='dots'){
      const r=6, gap=17, perRow=5;
      for(let k=0;k<10;k++){
        const col=k%perRow, row=Math.floor(k/perRow);
        const dx=cx-2*gap+col*gap, dy=cy-8+row*gap;
        const filled = k < Math.round(ip*7);
        if(filled){ p.noStroke(); p.fill(f.col[0],f.col[1],f.col[2],A); }
        else { p.noFill(); p.stroke(200,200,200,A); p.strokeWeight(1.5); }
        p.circle(dx,dy,r*2);
      }
    } else if(f.kind==='blocks'){
      const w=16,h=26,gap=8;
      p.rectMode(p.CENTER);
      for(let k=0;k<4;k++){
        const kp=easeOutBack(clamp((ip*1.3)-(k*0.18)));
        if(kp<=0) continue;
        const bx=cx-2*(w+gap)+k*(w+gap)+w/2;
        p.noStroke(); p.fill(FIELD_COLS[k][0],FIELD_COLS[k][1],FIELD_COLS[k][2],A);
        p.rect(bx,cy,w*kp,h*kp,3);
      }
      p.rectMode(p.CORNER);
    } else if(f.kind==='lines'){
      const x0=cx-26, x1=cx+26, y0=cy+14;
      p.stroke(14,116,144,A); p.strokeWeight(2.5); p.noFill();
      p.line(x0,y0, x0+(x1-x0)*ip, y0-28*ip);
      p.stroke(190,50,110,A); p.strokeWeight(2.5);
      p.line(x0,y0, x0+(x1-x0)*ip, y0-3*ip);
      p.noStroke();
      p.fill(14,116,144,A); p.circle(x0+(x1-x0)*ip, y0-28*ip, 6);
      p.fill(190,50,110,A); p.circle(x0+(x1-x0)*ip, y0-3*ip, 6);
    } else if(f.kind==='bar'){
      const bw=58, bh=8, bx=cx-bw/2;
      p.noStroke(); p.fill(225,225,225,A);
      p.rect(bx,cy-9,bw,bh,4); p.rect(bx,cy+5,bw,bh,4);
      p.fill(f.col[0],f.col[1],f.col[2],A);
      p.rect(bx,cy-9,bw*ip,bh,4);
      p.fill(170,175,185,A);
      p.rect(bx,cy+5,bw*0.45*ip,bh,4);
    } else if(f.kind==='arrows'){
      const up=easeOut(clamp(ip));
      p.stroke(40,140,80,A); p.strokeWeight(3); p.noFill();
      p.line(cx-14,cy+10, cx-14,cy+10-20*up);
      p.line(cx-14,cy+10-20*up, cx-19,cy+10-20*up+6);
      p.line(cx-14,cy+10-20*up, cx-9,cy+10-20*up+6);
      p.stroke(180,60,90,A);
      p.line(cx+14,cy-10, cx+14,cy-10+20*up);
      p.line(cx+14,cy-10+20*up, cx+9,cy-10+20*up-6);
      p.line(cx+14,cy-10+20*up, cx+19,cy-10+20*up-6);
      p.noStroke();
    }
    p.pop();
  }

  function drawCards(p, t, cx, cy){
    const n=FINDINGS.length;
    const usableH=p.height*0.78;
    const spacing=usableH/n;
    const startY=cy-usableH/2+spacing/2;
    const iconX=cx-300;
    const textX=cx-150;
    const cardsEndLocal=CARD_STAGGER*(n-1)+CARD_IN+HOLD;
    let globalAlpha=1;
    if(t>cardsEndLocal) globalAlpha=1-easeInOut(clamp((t-cardsEndLocal)/FADE_OUT));

    FINDINGS.forEach((f,i)=>{
      const appear=t-i*CARD_STAGGER;
      if(appear<0) return;
      const prog=easeOut(clamp(appear/CARD_IN));
      const y=startY+i*spacing;
      const slide=(1-prog)*28;
      const a=prog*255*globalAlpha;
      const yy=y+slide;

      drawIcon(p, f, iconX, yy, appear, globalAlpha);

      p.fill(28,28,28,a); p.textSize(26); p.textStyle(p.BOLD);
      p.textAlign(p.LEFT,p.BASELINE);
      p.text(f.big, textX, yy);
      p.fill(115,115,115,a); p.textSize(14.5); p.textStyle(p.NORMAL);
      p.text(f.small, textX, yy+22);
    });
  }

  function drawTakeaway(p, t, cx, cy){
    const p1=easeOut(clamp(t/TAKE_IN));
    const p2=easeOut(clamp((t-700)/TAKE_IN));
    const p3=easeOut(clamp((t-1500)/TAKE_IN));
    p.textAlign(p.CENTER,p.CENTER);
    p.fill(28,28,28,p1*255); p.textSize(Math.min(34,p.width*0.044)); p.textStyle(p.BOLD);
    p.text(TAKEAWAY_1,cx,cy-58+(1-p1)*15);
    p.fill(14,116,144,p2*255); p.textSize(Math.min(34,p.width*0.044)); p.textStyle(p.BOLD);
    p.text(TAKEAWAY_2,cx,cy-10+(1-p2)*15);
    p.fill(115,115,115,p3*255); p.textSize(17); p.textStyle(p.NORMAL);
    p.text(TAKEAWAY_3,cx,cy+58+(1-p3)*15);
  }

  return {
    draw: function (p, manager, ai, progress) {
      if (ai !== 7) return;
      if (lastAi !== ai) { lastAi = ai; animStart = Date.now(); }

      const t = animStart ? Date.now() - animStart : 0;
      const cx = p.width/2, cy = p.height/2;

      const introEnd = INTRO_IN+INTRO_HOLD+INTRO_OUT;
      const cardsStart = introEnd;
      const cardsEnd = cardsStart+CARD_STAGGER*(FINDINGS.length-1)+CARD_IN+HOLD;
      const fadeEnd = cardsEnd+FADE_OUT;

      p.background(255);
      if (t < introEnd) drawIntro(p, t, cx, cy);
      else if (t < fadeEnd) drawCards(p, t-cardsStart, cx, cy);
      else drawTakeaway(p, t-fadeEnd, cx, cy);
    }
  };
})();