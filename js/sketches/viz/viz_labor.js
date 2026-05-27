// viz_labor.js — Grouped bars for Q30 labor market perceptions
(function () {
    window.VizLabor = {

        draw: function (p, manager, ai, progress) {
            if (!manager._surveyData) return;
            var q30 = manager._surveyData.q30;
            var W = manager.width || 600;
            var H = manager.height || 520;
            var ox = manager.offsetX || 0;
            var oy = manager.offsetY || 0;

            var labels = q30.labels;
            var cols = q30.cols;
            var avgs = q30.avgs;
            var n = labels.length;

            // header
            p.noStroke();
            p.fill(30);
            p.textAlign(p.CENTER, p.TOP);
            p.textSize(13);
            p.text('ChatGPT & the Future of Work', ox + W / 2, oy + 8);
            p.textSize(9);
            p.fill(100);
            p.text('Agreement that ChatGPT will… (1 = Strongly Disagree → 5 = Strongly Agree)', ox + W / 2, oy + 24);

            var topPad = 42;
            var botPad = 16;
            var available = H - topPad - botPad;
            var rowH = available / n;
            var barLeft = ox + 155;
            var barMaxW = W - 175;
            var midX = barLeft + barMaxW / 2;
            var scale = barMaxW / 4;

            // center line
            p.stroke(200);
            p.strokeWeight(1);
            p.line(midX, oy + topPad, midX, oy + topPad + available);
            p.noStroke();
            p.fill(160);
            p.textAlign(p.CENTER, p.BOTTOM);
            p.textSize(8);
            p.text('Neutral (3)', midX, oy + topPad);

            // positive/negative color: blue = above neutral (optimistic), orange = below (pessimistic)
            var mx = p.mouseX, my = p.mouseY;

            for (var i = 0; i < n; i++) {
                var val = avgs[cols[i]] || 0;
                var bw = (val - 3) * scale;
                var y = oy + topPad + i * rowH;
                var barY = y + rowH * 0.12;
                var barHt = rowH * 0.76;

                var above = val >= 3;
                var isHov = (
                    mx >= Math.min(midX, midX + bw) &&
                    mx <= Math.max(midX, midX + bw) &&
                    my >= barY && my <= barY + barHt
                );

                p.noStroke();
                if (above) {
                    p.fill(isHov ? 40 : 70, isHov ? 160 : 140, isHov ? 240 : 210, isHov ? 240 : 200);
                } else {
                    p.fill(isHov ? 230 : 210, isHov ? 100 : 80, isHov ? 60 : 50, isHov ? 240 : 200);
                }
                var rectX = above ? midX : midX + bw;
                p.rect(rectX, barY, Math.abs(bw), barHt, 2);

                p.fill(30);
                p.textAlign(p.RIGHT, p.CENTER);
                p.textSize(Math.min(9.5, rowH * 0.55));
                var label = labels[i].length > 24 ? labels[i].slice(0, 22) + '…' : labels[i];
                p.text(label, barLeft - 4, y + rowH / 2);

                p.fill(isHov ? 30 : 80);
                p.textAlign(above ? p.LEFT : p.RIGHT, p.CENTER);
                p.textSize(9);
                var vx = above ? midX + Math.abs(bw) + 3 : midX - Math.abs(bw) - 3;
                p.text(val.toFixed(2), vx, y + rowH / 2);
            }
        }
    };
})();
