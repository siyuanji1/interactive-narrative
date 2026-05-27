// viz_demographics.js — Donut charts for gender, study level, field of study
(function () {
    window.VizDemographics = {

        _drawDonut: function (p, cx, cy, r, slices, title) {
            var total = slices.reduce(function (s, sl) { return s + sl.val; }, 0);
            var start = -Math.PI / 2;
            var inner = r * 0.52;

            p.push();
            p.noStroke();
            slices.forEach(function (sl) {
                var sweep = (sl.val / total) * Math.PI * 2;
                p.fill(sl.color[0], sl.color[1], sl.color[2]);
                p.arc(cx, cy, r * 2, r * 2, start, start + sweep, p.PIE);
                start += sweep;
            });
            // inner circle (donut hole)
            p.fill(255);
            p.ellipse(cx, cy, inner * 2, inner * 2);

            // title in center
            p.fill(30);
            p.textAlign(p.CENTER, p.CENTER);
            p.textSize(10);
            p.text(title, cx, cy);
            p.pop();

            // legend
            var legendY = cy + r + 10;
            var legendX = cx - r;
            p.push();
            p.textAlign(p.LEFT, p.CENTER);
            p.textSize(9);
            slices.forEach(function (sl, i) {
                var lx = legendX + (i % 2) * (r + 4);
                var ly = legendY + Math.floor(i / 2) * 14;
                p.fill(sl.color[0], sl.color[1], sl.color[2]);
                p.noStroke();
                p.rect(lx, ly - 4, 8, 8, 1);
                p.fill(30);
                var pct = Math.round(sl.val / total * 100);
                p.text(sl.label + ' ' + pct + '%', lx + 11, ly);
            });
            p.pop();
        },

        draw: function (p, manager, ai, progress) {
            if (!manager._surveyData) return;
            var data = manager._surveyData;
            var W = manager.width || 600;
            var H = manager.height || 520;
            var ox = manager.offsetX || 0;
            var oy = manager.offsetY || 0;

            var gc = data.gender_counts;
            var genderSlices = [
                { label: 'Female', val: gc[2] || 0, color: [220, 120, 160] },
                { label: 'Male',   val: gc[1] || 0, color: [80, 150, 210] },
                { label: 'Other',  val: (gc[3] || 0) + (gc[4] || 0), color: [160, 180, 80] }
            ];

            var lc = data.level_counts;
            var levelSlices = [
                { label: 'Undergrad',  val: lc[1] || 0, color: [100, 180, 240] },
                { label: 'Postgrad',   val: lc[2] || 0, color: [255, 160, 60] },
                { label: 'Doctoral',   val: lc[3] || 0, color: [140, 100, 220] }
            ];

            var fc = data.field_counts;
            var fieldSlices = [
                { label: 'Social Sci', val: fc[2] || 0, color: [60, 180, 140] },
                { label: 'Applied Sci',val: fc[3] || 0, color: [240, 130, 60] },
                { label: 'Arts/Hum',   val: fc[1] || 0, color: [200, 80, 100] },
                { label: 'Natural Sci',val: fc[4] || 0, color: [100, 160, 80] }
            ];

            var r = Math.min(W / 6, H / 4, 75);
            var spacing = W / 3;

            // section header
            p.fill(30);
            p.noStroke();
            p.textAlign(p.CENTER, p.TOP);
            p.textSize(13);
            p.text('Survey Participants', ox + W / 2, oy + 8);

            var cy = oy + H * 0.38;

            this._drawDonut(p, ox + spacing * 0.5, cy, r, genderSlices, 'Gender');
            this._drawDonut(p, ox + spacing * 1.5, cy, r, levelSlices, 'Study Level');
            this._drawDonut(p, ox + spacing * 2.5, cy, r, fieldSlices, 'Field');
        }
    };
})();
