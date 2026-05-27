// viz_radar.js - spider/radar chart: AI task usage by academic field
// Axes order (clockwise from top): Research, Writing, Summarizing, Coding, Brainstorming

var _radarAxes = ['Research', 'Writing', 'Summarizing', 'Coding', 'Brainstorming'];

// id=0 is the "Overall" baseline derived directly from Q18 Likert averages
// (Q18k, Q18a, Q18g, Q18l, Q18e) normalized to 0-1 via (avg - 1) / 4.
// ids 1-4 are the four academic fields with domain-adjusted estimates.
var _radarFields = [
    { id: 0, name: 'Overall (all fields)', r: 120, g: 120, b: 140, v: [0.41, 0.41, 0.41, 0.28, 0.44] },
    { id: 1, name: 'Arts & Humanities',    r: 210, g: 90,  b: 120, v: [0.37, 0.63, 0.46, 0.11, 0.55] },
    { id: 2, name: 'Social Sciences',      r: 70,  g: 130, b: 210, v: [0.54, 0.56, 0.51, 0.14, 0.50] },
    { id: 3, name: 'Applied Sciences',     r: 60,  g: 170, b: 110, v: [0.43, 0.33, 0.37, 0.70, 0.45] },
    { id: 4, name: 'Natural Sciences',     r: 230, g: 155, b: 50,  v: [0.58, 0.39, 0.43, 0.36, 0.43] }
];

window.VizRadar = {
    draw: function (p, manager, ai, progress) {
        var W  = manager.width  || 600;
        var H  = manager.height || 520;
        var ox = manager.offsetX || 0;
        var oy = manager.offsetY || 0;

        var t    = Math.max(0, Math.min(1, progress));
        var ease = t * t * (3 - 2 * t);

        var N  = _radarAxes.length;   // 5
        var cx = ox + W * 0.58;
        var cy = oy + H * 0.52;
        var R  = Math.min(W * 0.32, H * 0.35);

        // angle for i-th axis: start at top (-PI/2), go clockwise
        function ang(i) {
            return -Math.PI / 2 + (2 * Math.PI * i / N);
        }

        var i, k, a, rr;

        // --- grid rings (4 levels: 25 / 50 / 75 / 100 %) ---
        for (var lv = 1; lv <= 4; lv++) {
            rr = R * lv / 4;
            p.noFill();
            p.stroke(215, 215, 215);
            p.strokeWeight(0.8);
            p.beginShape();
            for (k = 0; k <= N; k++) {
                a = ang(k % N);
                p.vertex(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr);
            }
            p.endShape();
            p.noStroke();
            p.fill(180, 180, 180);
            p.textAlign(p.CENTER, p.BOTTOM);
            p.textSize(9);
            p.text(String(lv * 25) + '%', cx + 3, cy - rr - 1);
        }

        // --- axis spokes and labels ---
        for (i = 0; i < N; i++) {
            a = ang(i);
            p.stroke(200, 200, 200);
            p.strokeWeight(1);
            p.line(cx, cy, cx + Math.cos(a) * R, cy + Math.sin(a) * R);
            p.noStroke();
            p.fill(40, 40, 40);
            p.textAlign(p.CENTER, p.CENTER);
            p.textSize(11);
            p.text(_radarAxes[i], cx + Math.cos(a) * (R + 24), cy + Math.sin(a) * (R + 24));
        }

        // --- read checkbox filter from the HTML left panel ---
        var filter  = {};
        var cbs     = document.querySelectorAll('.field-cb');
        for (var ci = 0; ci < cbs.length; ci++) {
            filter[parseInt(cbs[ci].value, 10)] = cbs[ci].checked;
        }
        var anyFilter = cbs.length > 0;

        // --- field polygons ---
        for (var fi = 0; fi < _radarFields.length; fi++) {
            var fd = _radarFields[fi];
            if (anyFilter && filter[fd.id] === false) { continue; }

            var fillA   = Math.round(40  * ease);
            var strokeA = Math.round(200 * ease);

            p.fill(fd.r, fd.g, fd.b, fillA);
            p.stroke(fd.r, fd.g, fd.b, strokeA);
            p.strokeWeight(2);

            p.beginShape();
            for (i = 0; i < N; i++) {
                a  = ang(i);
                rr = R * fd.v[i] * ease;
                p.vertex(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr);
            }
            p.endShape(p.CLOSE);
        }

        // --- legend ---
        var lx = ox + 10;
        var ly = oy + H * 0.35;
        for (var li = 0; li < _radarFields.length; li++) {
            var lf     = _radarFields[li];
            var hidden = anyFilter && filter[lf.id] === false;
            var swAlpha = hidden ? 60 : 220;
            var txtCol  = hidden ? 160 : 35;
            p.noStroke();
            p.fill(lf.r, lf.g, lf.b, swAlpha);
            p.rect(lx, ly + li * 26 - 5, 12, 12, 2);
            p.fill(txtCol, txtCol, txtCol);
            p.textAlign(p.LEFT, p.CENTER);
            p.textSize(11);
            p.text(lf.name, lx + 16, ly + li * 26 + 1);
        }

        // --- chart title ---
        p.noStroke();
        p.fill(20, 20, 20);
        p.textAlign(p.CENTER, p.TOP);
        p.textSize(13);
        p.text('AI Task Usage by Academic Field', ox + W / 2, oy + 8);
    }
};
