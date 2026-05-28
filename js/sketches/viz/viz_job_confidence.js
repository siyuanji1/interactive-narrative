// viz_job_confidence.js - slope chart: job confidence (Q12) by AI usage level and field
// Low AI users (left, x=1) vs High AI users (right, x=2), one line per field

var _jcFields = [
    { id: 3, name: 'Applied Sciences',  r: 60,  g: 170, b: 110, low: 3.10, high: 3.62 },
    { id: 2, name: 'Social Sciences',   r: 70,  g: 130, b: 210, low: 3.00, high: 3.20 },
    { id: 4, name: 'Natural Sciences',  r: 230, g: 155, b: 50,  low: 2.67, high: 2.80 },
    { id: 1, name: 'Arts & Humanities', r: 210, g: 90,  b: 120, low: 2.42, high: 2.08 }
];

window.VizJobConfidence = {
    draw: function (p, manager, ai, progress) {
        var W  = manager.width  || 600;
        var H  = manager.height || 520;
        var ox = manager.offsetX || 0;
        var oy = manager.offsetY || 0;

        var t    = Math.max(0, Math.min(1, progress));
        var ease = t * t * (3 - 2 * t);

        // Chart area
        var padL   = ox + 72;
        var padR   = ox + W - 110;
        var padT   = oy + 52;
        var padB   = oy + H - 80;
        var cW     = padR - padL;
        var cH     = padB - padT;

        // Y scale: 1.5 to 4.5
        var yMin = 1.5;
        var yMax = 4.5;
        function yp(v) { return padB - cH * (v - yMin) / (yMax - yMin); }

        // X positions mapped to the 0.5-2.5 scale shown in screenshot
        function xp(v) { return padL + cW * (v - 0.5) / 2.0; }
        var xLow  = xp(1.0);
        var xHigh = xp(2.0);

        // Chart border
        p.noFill();
        p.stroke(210, 210, 210);
        p.strokeWeight(1);
        p.rect(padL, padT, cW, cH);

        // Horizontal grid lines and y-axis labels
        var yTicks = [2.0, 2.5, 3.0, 3.5, 4.0];
        for (var gi = 0; gi < yTicks.length; gi++) {
            var gv = yTicks[gi];
            var gy = yp(gv);
            p.stroke(225, 225, 225);
            p.strokeWeight(0.8);
            p.line(padL, gy, padR, gy);
            p.noStroke();
            p.fill(150, 150, 150);
            p.textAlign(p.RIGHT, p.CENTER);
            p.textSize(10);
            p.text(gv.toFixed(1), padL - 7, gy);
        }

        // Y-axis title (rotated)
        p.push();
        p.translate(ox + 13, padT + cH / 2);
        p.rotate(-Math.PI / 2);
        p.noStroke();
        p.fill(110, 110, 110);
        p.textAlign(p.CENTER, p.CENTER);
        p.textSize(9);
        p.text('Job confidence (Q12)', 0, 0);
        p.pop();

        // X-axis tick marks and numeric labels
        var xTicks = [0.5, 1.0, 1.5, 2.0, 2.5];
        for (var xi = 0; xi < xTicks.length; xi++) {
            var xv = xTicks[xi];
            var gx = xp(xv);
            p.stroke(200, 200, 200);
            p.strokeWeight(0.8);
            p.line(gx, padB, gx, padB + 4);
            p.noStroke();
            p.fill(150, 150, 150);
            p.textAlign(p.CENTER, p.TOP);
            p.textSize(10);
            p.text(xv.toFixed(1), gx, padB + 6);
        }

        // Column header labels
        p.noStroke();
        p.fill(80, 80, 80);
        p.textAlign(p.CENTER, p.BOTTOM);
        p.textSize(10);
        p.text('Low AI users', xLow,  padT - 6);
        p.text('High AI users', xHigh, padT - 6);

        // Lines and dots — animate each line growing from left to right
        for (var fi = 0; fi < _jcFields.length; fi++) {
            var fd  = _jcFields[fi];
            var yL  = yp(fd.low);
            var yH  = yp(fd.high);

            // Stagger lines slightly so they don't all appear at once
            var startT = fi * 0.08;
            var lt = Math.max(0, Math.min(1, (ease - startT) / (1 - startT)));
            var lx2 = xLow  + (xHigh - xLow) * lt;
            var ly2 = yL    + (yH   - yL)   * lt;

            p.stroke(fd.r, fd.g, fd.b, Math.round(210 * Math.min(1, ease * 3)));
            p.strokeWeight(2.2);
            p.line(xLow, yL, lx2, ly2);

            // Left dot (fades in immediately)
            var da = Math.round(255 * Math.min(1, ease * 4));
            p.noStroke();
            p.fill(fd.r, fd.g, fd.b, da);
            p.circle(xLow, yL, 11);

            // Right dot (appears when line reaches it)
            if (lt >= 0.97) {
                var ra = Math.round(255 * Math.min(1, (lt - 0.97) / 0.03));
                p.fill(fd.r, fd.g, fd.b, ra);
                p.circle(xHigh, yH, 11);

                // Field label to the right
                p.fill(fd.r, fd.g, fd.b, ra);
                p.textAlign(p.LEFT, p.CENTER);
                p.textSize(10);
                p.text(fd.name, xHigh + 10, yH);
            }
        }

        // Chart title
        p.noStroke();
        p.fill(20, 20, 20);
        p.textAlign(p.CENTER, p.TOP);
        p.textSize(15);
        p.textStyle(p.BOLD);
        p.text('Job confidence gap', ox + W / 2, oy + 12);
        p.textStyle(p.NORMAL);
    }
};
