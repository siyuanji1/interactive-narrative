// viz_attitudes.js — Diverging or horizontal bar chart for Likert-scale attitude questions
// Used for ethical concerns (Q22), learning outcomes (Q26), and satisfaction (Q24)
(function () {
    window.VizAttitudes = {

        _drawLikertBars: function (p, manager, qData, title, subtitle, colorA, colorB) {
            var W = manager.width || 600;
            var H = manager.height || 520;
            var ox = manager.offsetX || 0;
            var oy = manager.offsetY || 0;

            var labels = qData.labels;
            var cols = qData.cols;
            var avgs = qData.avgs;
            var n = labels.length;

            // header
            p.noStroke();
            p.fill(30);
            p.textAlign(p.CENTER, p.TOP);
            p.textSize(13);
            p.text(title, ox + W / 2, oy + 8);
            p.textSize(9);
            p.fill(100);
            p.text(subtitle, ox + W / 2, oy + 24);

            var topPad = 42;
            var botPad = 16;
            var available = H - topPad - botPad;
            var rowH = available / n;
            var barLeft = ox + 160;
            var barMaxW = W - 180;
            var midX = barLeft + barMaxW / 2; // center = 3.0
            var scale = barMaxW / 4;          // 1–5 range → full width

            // center line at 3.0
            p.stroke(200);
            p.strokeWeight(1);
            p.line(midX, oy + topPad, midX, oy + topPad + available);
            p.noStroke();
            p.fill(160);
            p.textAlign(p.CENTER, p.BOTTOM);
            p.textSize(8);
            p.text('Neutral (3)', midX, oy + topPad);

            var mx = p.mouseX, my = p.mouseY;

            for (var i = 0; i < n; i++) {
                var val = avgs[cols[i]] || 0;
                var bw = (val - 3) * scale;
                var y = oy + topPad + i * rowH;
                var barY = y + rowH * 0.12;
                var barHt = rowH * 0.76;

                var isHov = (
                    mx >= Math.min(midX, midX + bw) - 2 &&
                    mx <= Math.max(midX, midX + bw) + 2 &&
                    my >= barY && my <= barY + barHt
                );

                var above = val >= 3;
                var c = above ? colorA : colorB;
                p.noStroke();
                p.fill(c[0], c[1], c[2], isHov ? 240 : 200);
                var rectX = above ? midX : midX + bw;
                p.rect(rectX, barY, Math.abs(bw), barHt, 2);

                // label
                p.fill(30);
                p.textAlign(p.RIGHT, p.CENTER);
                p.textSize(Math.min(9.5, rowH * 0.55));
                var label = labels[i].length > 25 ? labels[i].slice(0, 23) + '…' : labels[i];
                p.text(label, barLeft - 4, y + rowH / 2);

                // value
                p.fill(isHov ? 30 : 80);
                p.textAlign(above ? p.LEFT : p.RIGHT, p.CENTER);
                p.textSize(9);
                var vx = above ? midX + Math.abs(bw) + 3 : midX - Math.abs(bw) - 3;
                p.text(val.toFixed(2), vx, y + rowH / 2);
            }
        },

        draw: function (p, manager, ai, progress) {
            if (!manager._surveyData) return;
            var data = manager._surveyData;

            if (ai === 6) {
                // Q22 ethical concerns (section index 6)
                this._drawLikertBars(p, manager, data.q22,
                    'Ethical Concerns About ChatGPT',
                    'Agreement (1 = Strongly Disagree → 5 = Strongly Agree)',
                    [230, 100, 80], [80, 160, 220]);
            } else if (ai === 7) {
                // Q26 learning outcomes (section index 7)
                this._drawLikertBars(p, manager, data.q26,
                    'ChatGPT Can Improve Learning Outcomes',
                    'Agreement (1 = Strongly Disagree → 5 = Strongly Agree)',
                    [60, 170, 120], [200, 100, 80]);
            } else if (ai === 8) {
                // Q24 satisfaction (section index 8)
                this._drawLikertBars(p, manager, data.q24,
                    'Student Satisfaction with ChatGPT',
                    'Agreement (1 = Strongly Disagree → 5 = Strongly Agree)',
                    [80, 150, 230], [200, 120, 60]);
            }
        }
    };
})();
