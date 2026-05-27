// viz_usage.js — Usage stats: ever used gauge + usage extent distribution
(function () {
    window.VizUsage = {

        draw: function (p, manager, ai, progress) {
            if (!manager._surveyData) return;
            var data = manager._surveyData;
            var W = manager.width || 600;
            var H = manager.height || 520;
            var ox = manager.offsetX || 0;
            var oy = manager.offsetY || 0;

            var eu = data.ever_used;
            var total = (eu[1] || 0) + (eu[2] || 0);
            var usedPct = (eu[1] || 0) / total;

            // header
            p.noStroke();
            p.fill(30);
            p.textAlign(p.CENTER, p.TOP);
            p.textSize(13);
            p.text('ChatGPT Adoption Among Students', ox + W / 2, oy + 8);

            // big arc gauge — "% who used ChatGPT"
            var gx = ox + W / 2;
            var gy = oy + H * 0.35;
            var gr = Math.min(W * 0.22, H * 0.28, 100);

            // background arc
            p.stroke(220);
            p.strokeWeight(14);
            p.noFill();
            p.arc(gx, gy, gr * 2, gr * 2, Math.PI, 0);

            // filled arc
            p.stroke(60, 160, 230);
            p.strokeWeight(14);
            p.noFill();
            var sweep = usedPct * Math.PI;
            p.arc(gx, gy, gr * 2, gr * 2, Math.PI, Math.PI + sweep);

            // center text
            p.noStroke();
            p.fill(30);
            p.textAlign(p.CENTER, p.CENTER);
            p.textSize(32);
            p.text(Math.round(usedPct * 100) + '%', gx, gy + gr * 0.1);
            p.textSize(11);
            p.text('have used ChatGPT', gx, gy + gr * 0.35);

            // Usage extent bar chart below
            var uc = data.usage_counts;
            var labels = ['Rarely', 'Occasionally', 'Moderately', 'Considerably', 'Extensively'];
            var vals = [uc[1] || 0, uc[2] || 0, uc[3] || 0, uc[4] || 0, uc[5] || 0];
            var usersTotal = vals.reduce(function (s, v) { return s + v; }, 0);
            var maxVal = Math.max.apply(null, vals);

            var barTop = gy + gr * 0.65;
            var barH = Math.min((H - (barTop - oy) - 30) / labels.length, 30);
            var barMaxW = W * 0.55;
            var barLeft = ox + W * 0.22;

            var colors = [
                [160, 200, 240],
                [90, 170, 230],
                [60, 140, 210],
                [40, 110, 190],
                [20, 80, 160]
            ];

            p.noStroke();
            p.textAlign(p.RIGHT, p.CENTER);
            p.textSize(10);

            for (var i = 0; i < labels.length; i++) {
                var y = barTop + i * barH + barH / 2;
                p.fill(60);
                p.text(labels[i], barLeft - 6, y);

                var bw = (vals[i] / maxVal) * barMaxW;
                p.fill(colors[i][0], colors[i][1], colors[i][2]);
                p.rect(barLeft, y - barH * 0.38, bw, barH * 0.76, 2);

                p.fill(60);
                p.textAlign(p.LEFT, p.CENTER);
                p.text(Math.round(vals[i] / usersTotal * 100) + '%', barLeft + bw + 4, y);
                p.textAlign(p.RIGHT, p.CENTER);
            }
        }
    };
})();
