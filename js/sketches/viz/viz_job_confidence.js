// viz_job_confidence.js - CI interval slope chart: job confidence (Q12) by AI usage and field
// Each field: Q1–Q3 bar + mean dot at Low AI (left) and High AI (right) columns
// Connecting lines show direction of change between groups

var _jcFields = [
    { id: 3, name: 'Applied Sciences',  r: 60,  g: 170, b: 110,
      low:  { mean: 3.10, q1: 2.62, q3: 3.58 },
      high: { mean: 3.62, q1: 3.14, q3: 4.10 } },
    { id: 2, name: 'Social Sciences',   r: 70,  g: 130, b: 210,
      low:  { mean: 3.00, q1: 2.48, q3: 3.52 },
      high: { mean: 3.20, q1: 2.68, q3: 3.72 } },
    { id: 4, name: 'Natural Sciences',  r: 230, g: 155, b: 50,
      low:  { mean: 2.67, q1: 2.15, q3: 3.20 },
      high: { mean: 2.80, q1: 2.28, q3: 3.32 } },
    { id: 1, name: 'Arts & Humanities', r: 210, g: 90,  b: 120,
      low:  { mean: 2.42, q1: 1.90, q3: 2.95 },
      high: { mean: 2.08, q1: 1.58, q3: 2.60 } }
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
        var padL = ox + 68;
        var padR = ox + W - 86;
        var padT = oy + 52;
        var padB = oy + H - 52;
        var cW   = padR - padL;
        var cH   = padB - padT;

        // Y scale: 1.0 to 5.0
        var yMin = 1.0, yMax = 5.0;
        function yp(v) { return padB - cH * (v - yMin) / (yMax - yMin); }

        // X column centers
        var xLow  = padL + cW * 0.30;
        var xHigh = padL + cW * 0.70;

        // Per-field jitter so 4 CI bars don't overlap within each column
        var jitter = [-21, -7, 7, 21];

        // Grid lines and Y-axis labels
        var yTicks = [1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 4.5, 5.0];
        for (var gi = 0; gi < yTicks.length; gi++) {
            var gv = yTicks[gi];
            var gy = yp(gv);
            p.stroke(232, 232, 232);
            p.strokeWeight(0.8);
            p.line(padL - 4, gy, padR, gy);
            p.noStroke();
            p.fill(160, 160, 160);
            p.textAlign(p.RIGHT, p.CENTER);
            p.textSize(9);
            p.text(gv.toFixed(1), padL - 10, gy);
        }

        // Y-axis title (rotated)
        p.push();
        p.translate(ox + 14, padT + cH / 2);
        p.rotate(-Math.PI / 2);
        p.noStroke();
        p.fill(130, 130, 130);
        p.textAlign(p.CENTER, p.CENTER);
        p.textSize(9);
        p.text('Job confidence (Q12, 1–5 scale)', 0, 0);
        p.pop();

        // Column guide lines (dashed)
        p.drawingContext.setLineDash([5, 5]);
        p.stroke(215, 215, 215);
        p.strokeWeight(1);
        p.line(xLow,  padT, xLow,  padB);
        p.line(xHigh, padT, xHigh, padB);
        p.drawingContext.setLineDash([]);

        // Column headers
        p.noStroke();
        p.fill(55, 55, 55);
        p.textAlign(p.CENTER, p.BOTTOM);
        p.textSize(11);
        p.textStyle(p.BOLD);
        p.text('Low AI users',  xLow,  padT - 6);
        p.text('High AI users', xHigh, padT - 6);
        p.textStyle(p.NORMAL);

        // Animation phases:
        //   ease 0.00 – 0.25 : left CI bars + mean dots fade in
        //   ease 0.20 – 0.50 : connecting lines grow
        //   ease 0.45 – 0.70 : right CI bars + mean dots + labels fade in
        var capW = 11;
        var dotR = 6;

        for (var fi = 0; fi < _jcFields.length; fi++) {
            var fd = _jcFields[fi];
            var jx = jitter[fi];
            var xlL = xLow  + jx;
            var xlH = xHigh + jx;

            // Phase 1: left CI
            var p1  = Math.min(1, ease / 0.25);
            var da1 = Math.round(215 * p1);
            if (da1 > 0) {
                p.stroke(fd.r, fd.g, fd.b, da1);
                p.strokeWeight(1.6);
                p.line(xlL, yp(fd.low.q1), xlL, yp(fd.low.q3));
                p.line(xlL - capW / 2, yp(fd.low.q1), xlL + capW / 2, yp(fd.low.q1));
                p.line(xlL - capW / 2, yp(fd.low.q3), xlL + capW / 2, yp(fd.low.q3));
                p.noStroke();
                p.fill(fd.r, fd.g, fd.b, da1);
                p.circle(xlL, yp(fd.low.mean), dotR * 2);
                // Mean value to the left of each low dot
                p.textAlign(p.RIGHT, p.CENTER);
                p.textSize(9);
                p.textStyle(p.BOLD);
                p.text(fd.low.mean.toFixed(2), xlL - dotR - 4, yp(fd.low.mean));
                p.textStyle(p.NORMAL);
            }

            // Phase 2: connecting line grows left → right
            var p2 = Math.max(0, Math.min(1, (ease - 0.20) / 0.30));
            if (p2 > 0) {
                var lx2 = xlL + (xlH - xlL) * p2;
                var ly2 = yp(fd.low.mean) + (yp(fd.high.mean) - yp(fd.low.mean)) * p2;
                p.stroke(fd.r, fd.g, fd.b, Math.round(170 * p2));
                p.strokeWeight(1.8);
                p.line(xlL, yp(fd.low.mean), lx2, ly2);
            }

            // Phase 3: right CI + label
            var p3  = Math.max(0, Math.min(1, (ease - 0.45) / 0.25));
            var da3 = Math.round(215 * p3);
            if (da3 > 0) {
                p.stroke(fd.r, fd.g, fd.b, da3);
                p.strokeWeight(1.6);
                p.line(xlH, yp(fd.high.q1), xlH, yp(fd.high.q3));
                p.line(xlH - capW / 2, yp(fd.high.q1), xlH + capW / 2, yp(fd.high.q1));
                p.line(xlH - capW / 2, yp(fd.high.q3), xlH + capW / 2, yp(fd.high.q3));
                p.noStroke();
                p.fill(fd.r, fd.g, fd.b, da3);
                p.circle(xlH, yp(fd.high.mean), dotR * 2);

                // Field name above, mean value below the high dot
                p.fill(fd.r, fd.g, fd.b, da3);
                p.textAlign(p.LEFT, p.CENTER);
                p.textSize(10);
                p.text(fd.name, xlH + 14, yp(fd.high.mean) - 7);
                p.textStyle(p.BOLD);
                p.textSize(9);
                p.text(fd.high.mean.toFixed(2), xlH + 14, yp(fd.high.mean) + 5);
                p.textStyle(p.NORMAL);
            }
        }

        // Legend annotation
        p.noStroke();
        p.fill(155, 155, 155);
        p.textAlign(p.CENTER, p.TOP);
        p.textSize(9);
        p.text('Bars = Q1–Q3 range   ·   Dot = mean', ox + W / 2, padB + 10);

        // Chart title
        p.noStroke();
        p.fill(20, 20, 20);
        p.textAlign(p.CENTER, p.TOP);
        p.textSize(14);
        p.textStyle(p.BOLD);
        p.text('How AI Usage Will Affect Your Job Confidence?', ox + W / 2, oy + 12);
        p.textStyle(p.NORMAL);
    }
};
