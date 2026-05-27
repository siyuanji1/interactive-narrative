// viz_emotions.js — Radar chart for Q32 emotions while using ChatGPT
(function () {
    window.VizEmotions = {

        draw: function (p, manager, ai, progress) {
            if (!manager._surveyData) return;
            var q32 = manager._surveyData.q32;
            var W = manager.width || 600;
            var H = manager.height || 520;
            var ox = manager.offsetX || 0;
            var oy = manager.offsetY || 0;

            var labels = q32.labels;
            var cols = q32.cols;
            var avgs = q32.avgs;
            var n = labels.length;

            // positive/negative emotion grouping for color
            var positive = new Set(['Q32b','Q32e','Q32g','Q32h','Q32i','Q32k','Q32l','Q32m']);

            // header
            p.noStroke();
            p.fill(30);
            p.textAlign(p.CENTER, p.TOP);
            p.textSize(13);
            p.text('Emotions While Using ChatGPT', ox + W / 2, oy + 8);
            p.textSize(9);
            p.fill(100);
            p.text('Average frequency (1 = Never → 5 = Always)', ox + W / 2, oy + 24);

            var cx = ox + W / 2;
            var cy = oy + H * 0.48;
            var maxR = Math.min(W, H) * 0.35;
            var minScale = 1, maxScale = 5;

            // draw grid rings
            for (var ring = 1; ring <= 4; ring++) {
                var rr = (ring / 4) * maxR;
                p.noFill();
                p.stroke(220);
                p.strokeWeight(1);
                p.ellipse(cx, cy, rr * 2, rr * 2);
                p.noStroke();
                p.fill(180);
                p.textAlign(p.LEFT, p.CENTER);
                p.textSize(8);
                p.text((ring + 1).toFixed(0), cx + rr + 2, cy);
            }

            // draw axes and labels
            for (var i = 0; i < n; i++) {
                var angle = (i / n) * Math.PI * 2 - Math.PI / 2;
                var ax = cx + Math.cos(angle) * maxR;
                var ay = cy + Math.sin(angle) * maxR;

                p.stroke(210);
                p.strokeWeight(1);
                p.line(cx, cy, ax, ay);

                // label
                var lx = cx + Math.cos(angle) * (maxR + 18);
                var ly = cy + Math.sin(angle) * (maxR + 14);
                var isPos = positive.has(cols[i]);
                p.noStroke();
                p.fill(isPos ? 40 : 160, isPos ? 130 : 60, isPos ? 100 : 60);
                p.textAlign(p.CENTER, p.CENTER);
                p.textSize(Math.min(9, maxR * 0.11));
                p.text(labels[i], lx, ly);
            }

            // draw data polygon
            p.noStroke();
            var polyPts = [];
            for (var i = 0; i < n; i++) {
                var angle = (i / n) * Math.PI * 2 - Math.PI / 2;
                var val = avgs[cols[i]] || 1;
                var r = ((val - minScale) / (maxScale - minScale)) * maxR;
                polyPts.push([cx + Math.cos(angle) * r, cy + Math.sin(angle) * r]);
            }

            p.fill(80, 160, 220, 60);
            p.stroke(80, 160, 220, 180);
            p.strokeWeight(2);
            p.beginShape();
            polyPts.forEach(function (pt) { p.vertex(pt[0], pt[1]); });
            p.endShape(p.CLOSE);

            // draw points
            p.noStroke();
            for (var i = 0; i < n; i++) {
                var isPos = positive.has(cols[i]);
                p.fill(isPos ? 60 : 210, isPos ? 180 : 80, isPos ? 120 : 80);
                p.ellipse(polyPts[i][0], polyPts[i][1], 7, 7);
            }

            // legend
            var ly = oy + H - 18;
            p.noStroke();
            p.fill(60, 180, 120);
            p.rect(ox + W / 2 - 80, ly - 5, 10, 10, 2);
            p.fill(30);
            p.textAlign(p.LEFT, p.CENTER);
            p.textSize(9);
            p.text('Positive emotion', ox + W / 2 - 67, ly);

            p.fill(210, 80, 80);
            p.rect(ox + W / 2 + 20, ly - 5, 10, 10, 2);
            p.fill(30);
            p.text('Negative emotion', ox + W / 2 + 33, ly);
        }
    };
})();
