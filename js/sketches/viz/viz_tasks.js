// viz_tasks.js — Horizontal bar chart for Q18 task usage frequencies
(function () {
    window.VizTasks = {

        draw: function (p, manager, ai, progress) {
            if (!manager._surveyData) return;
            var q18 = manager._surveyData.q18;
            var W = manager.width || 600;
            var H = manager.height || 520;
            var ox = manager.offsetX || 0;
            var oy = manager.offsetY || 0;

            var labels = q18.labels;
            var cols = q18.cols;
            var avgs = q18.avgs;

            // header
            p.noStroke();
            p.fill(30);
            p.textAlign(p.CENTER, p.TOP);
            p.textSize(13);
            p.text('How Students Use ChatGPT', ox + W / 2, oy + 8);
            p.textSize(9);
            p.fill(100);
            p.text('Average frequency (1 = Never → 5 = Always)', ox + W / 2, oy + 24);

            var n = labels.length;
            var topPad = 42;
            var botPad = 20;
            var available = H - topPad - botPad;
            var rowH = available / n;
            var barLeft = ox + 130;
            var barMaxW = W - 150;
            var maxScale = 5;

            // scale ticks
            p.stroke(220);
            p.strokeWeight(1);
            for (var t = 1; t <= 5; t++) {
                var tx = barLeft + (t / maxScale) * barMaxW;
                p.line(tx, oy + topPad, tx, oy + topPad + available);
                p.noStroke();
                p.fill(160);
                p.textAlign(p.CENTER, p.BOTTOM);
                p.textSize(8);
                p.text(t, tx, oy + topPad);
                p.stroke(220);
                p.strokeWeight(1);
            }

            var hovered = -1;
            var mx = p.mouseX, my = p.mouseY;

            for (var i = 0; i < n; i++) {
                var val = avgs[cols[i]] || 0;
                var bw = (val / maxScale) * barMaxW;
                var y = oy + topPad + i * rowH;
                var barY = y + rowH * 0.15;
                var barHt = rowH * 0.7;

                var isHov = (mx >= barLeft && mx <= barLeft + bw && my >= barY && my <= barY + barHt);
                if (isHov) hovered = i;

                // color by usage level
                var t = (val - 1) / 4;
                var r = Math.round(60 + t * 160);
                var g = Math.round(120 + t * 100);
                var bl = Math.round(210 - t * 80);

                p.noStroke();
                p.fill(r, g, bl, isHov ? 240 : 200);
                p.rect(barLeft, barY, bw, barHt, 2);

                // label
                p.fill(30);
                p.textAlign(p.RIGHT, p.CENTER);
                p.textSize(Math.min(10, rowH * 0.55));
                p.text(labels[i], barLeft - 4, y + rowH / 2);

                // value label
                p.fill(isHov ? 30 : 80);
                p.textAlign(p.LEFT, p.CENTER);
                p.textSize(9);
                p.text(val.toFixed(2), barLeft + bw + 3, y + rowH / 2);
            }
        }
    };
})();
