// viz_globe.js — Bubble chart of survey responses by country
(function () {
    window.VizGlobe = {
        _data: null,
        _bubbles: null,
        _hovered: -1,

        init: function (manager) {
            if (!manager._surveyData) return;
            var counts = manager._surveyData.country_counts;
            var entries = Object.entries(counts).sort(function (a, b) { return b[1] - a[1]; });
            var maxVal = entries[0][1];
            var minVal = entries[entries.length - 1][1];

            var W = manager.width || 600;
            var H = manager.height || 520;
            var cx = (manager.offsetX || 0) + W / 2;
            var cy = (manager.offsetY || 0) + H / 2;

            var bubbles = [];
            var rng = 42;
            function rand(seed) { rng = (rng * 1664525 + 1013904223) & 0xffffffff; return ((rng >>> 0) / 4294967296); }

            entries.forEach(function (e, i) {
                var t = (e[1] - minVal) / (maxVal - minVal);
                var r = 6 + t * 38;
                var angle = rand(i) * Math.PI * 2;
                var dist = rand(i) * (W * 0.42);
                bubbles.push({
                    name: e[0],
                    count: e[1],
                    r: r,
                    x: cx + Math.cos(angle) * dist,
                    y: cy + Math.sin(angle) * dist,
                    vx: (rand(i) - 0.5) * 0.3,
                    vy: (rand(i) - 0.5) * 0.3,
                    color: [
                        Math.round(60 + t * 160),
                        Math.round(120 + t * 80),
                        Math.round(180 + t * 60)
                    ]
                });
            });

            this._bubbles = bubbles;
        },

        draw: function (p, manager, ai, progress) {
            if (!this._bubbles) this.init(manager);
            if (!this._bubbles) return;

            var bubbles = this._bubbles;
            var W = manager.width || 600;
            var H = manager.height || 520;
            var ox = manager.offsetX || 0;
            var oy = manager.offsetY || 0;
            var cx = ox + W / 2;
            var cy = oy + H / 2;

            // gentle physics repulsion
            for (var i = 0; i < bubbles.length; i++) {
                var b = bubbles[i];
                b.x += b.vx;
                b.y += b.vy;
                // attract toward center
                b.vx += (cx - b.x) * 0.001;
                b.vy += (cy - b.y) * 0.001;
                b.vx *= 0.98;
                b.vy *= 0.98;
                // wall bounce
                var pad = b.r + 4;
                if (b.x < ox + pad) { b.vx += 0.3; }
                if (b.x > ox + W - pad) { b.vx -= 0.3; }
                if (b.y < oy + pad) { b.vy += 0.3; }
                if (b.y > oy + H - pad) { b.vy -= 0.3; }
            }

            // check hover
            var mx = p.mouseX, my = p.mouseY;
            var hovI = -1;
            for (var i = 0; i < bubbles.length; i++) {
                var b = bubbles[i];
                if (Math.hypot(mx - b.x, my - b.y) < b.r) { hovI = i; break; }
            }
            this._hovered = hovI;

            // draw bubbles
            p.noStroke();
            for (var i = 0; i < bubbles.length; i++) {
                var b = bubbles[i];
                var isHov = (i === hovI);
                p.fill(b.color[0], b.color[1], b.color[2], isHov ? 240 : 180);
                p.ellipse(b.x, b.y, b.r * 2, b.r * 2);
                if (b.r > 18 || isHov) {
                    p.fill(isHov ? 255 : 30);
                    p.textAlign(p.CENTER, p.CENTER);
                    p.textSize(isHov ? 11 : Math.max(7, b.r * 0.45));
                    var label = b.name.length > 12 ? b.name.slice(0, 10) + '…' : b.name;
                    p.text(label, b.x, b.y);
                }
            }

            // tooltip for hovered bubble
            if (hovI >= 0) {
                var b = bubbles[hovI];
                var tx = Math.min(b.x + b.r + 5, ox + W - 140);
                var ty = Math.max(b.y - 25, oy + 4);
                p.fill(30, 30, 30, 220);
                p.rect(tx, ty, 135, 36, 4);
                p.fill(255);
                p.textAlign(p.LEFT, p.CENTER);
                p.textSize(11);
                p.text(b.name, tx + 6, ty + 10);
                p.textSize(10);
                p.text(b.count.toLocaleString() + ' responses', tx + 6, ty + 24);
            }

            // title
            p.fill(30);
            p.noStroke();
            p.textAlign(p.CENTER, p.TOP);
            p.textSize(12);
            p.text('149 countries · ' + (manager._surveyData ? manager._surveyData.total_responses.toLocaleString() : '') + ' students', cx, oy + 6);
        }
    };
})();
