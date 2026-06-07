// viz_title.js — Interactive title: phyllotaxis dot cloud reacts to mouse cursor
(function () {
    var _dots  = null;
    var _lastW = null;
    var _lastH = null;

    var _FIELDS = [
        { r: 70,  g: 130, b: 210, pct: 0.25 }, // Social Sciences
        { r: 60,  g: 170, b: 110, pct: 0.30 }, // Applied Sciences
        { r: 210, g: 90,  b: 120, pct: 0.22 }, // Arts & Humanities
        { r: 230, g: 155, b: 50,  pct: 0.23 }  // Natural Sciences
    ];
    var _TOTAL  = 180;
    var _REPEL  = 90;  // repel radius px

    function initDots(W, H, cx, cy) {
        var cloudR  = Math.min(W, H) * 0.29;
        var golden  = Math.PI * (3 - Math.sqrt(5));
        var dots    = [];
        var fi      = 0;
        var inField = 0;
        var fieldN  = Math.round(_FIELDS[0].pct * _TOTAL);

        for (var i = 0; i < _TOTAL; i++) {
            if (inField >= fieldN && fi < _FIELDS.length - 1) {
                fi++;
                fieldN  = Math.round(_FIELDS[fi].pct * _TOTAL);
                inField = 0;
            }
            var angle = i * golden;
            var r     = cloudR * Math.sqrt((i + 0.5) / _TOTAL);
            var hx    = cx + Math.cos(angle) * r;
            var hy    = cy + Math.sin(angle) * r;
            dots.push({
                hx: hx, hy: hy,
                x: hx + (Math.random() - 0.5) * 40,
                y: hy + (Math.random() - 0.5) * 40,
                vx: 0, vy: 0,
                r: Math.random() * 2 + 2.5,
                c: _FIELDS[fi]
            });
            inField++;
        }
        return dots;
    }

    window.VizTitle = {
        draw: function (p, manager, ai, progress) {
            var W  = manager.width  || 600;
            var H  = manager.height || 520;
            var ox = manager.offsetX || 0;
            var oy = manager.offsetY || 0;
            var cx = ox + W / 2;
            var cy = oy + H * 0.52;

            if (!_dots || _lastW !== W || _lastH !== H) {
                _dots  = initDots(W, H, W / 2, H * 0.52);
                _lastW = W; _lastH = H;
            }

            var elapsed = p.millis() / 1000;

            // White background
            p.background(255);

            // ── Dot cloud: spring + mouse repulsion ──
            var mx = p.mouseX - ox;
            var my = p.mouseY - oy;

            _dots.forEach(function (d) {
                // Cursor repulsion
                var dx = d.x - mx;
                var dy = d.y - my;
                var dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < _REPEL && dist > 0.5) {
                    var force = (_REPEL - dist) / _REPEL * 3.2;
                    d.vx += (dx / dist) * force;
                    d.vy += (dy / dist) * force;
                }
                // Spring back home
                d.vx += (d.hx - d.x) * 0.045;
                d.vy += (d.hy - d.y) * 0.045;
                // Damping
                d.vx *= 0.80;
                d.vy *= 0.80;
                d.x  += d.vx;
                d.y  += d.vy;
            });

            // Draw subtle connecting lines between nearby dots
            for (var a = 0; a < _dots.length; a++) {
                for (var b = a + 1; b < _dots.length; b++) {
                    var ddx  = _dots[a].x - _dots[b].x;
                    var ddy  = _dots[a].y - _dots[b].y;
                    var ddist = Math.sqrt(ddx * ddx + ddy * ddy);
                    if (ddist < 38) {
                        var al = (1 - ddist / 38) * 28;
                        p.stroke(180, 180, 200, al);
                        p.strokeWeight(0.6);
                        p.line(ox + _dots[a].x, oy + _dots[a].y,
                               ox + _dots[b].x, oy + _dots[b].y);
                    }
                }
            }

            // Draw dots — scale up and brighten when near cursor
            p.noStroke();
            _dots.forEach(function (d) {
                var dx = d.x - mx, dy = d.y - my;
                var dist = Math.sqrt(dx * dx + dy * dy);
                var proximity = dist < _REPEL ? (1 - dist / _REPEL) : 0;
                var drawR  = d.r * (1 + proximity * 3.0);
                var coreA  = Math.round(200 + proximity * 55);
                var glowA  = Math.round(40  + proximity * 120);
                var glowR  = drawR * (2.5 + proximity * 1.5);
                // outer glow
                p.fill(d.c.r, d.c.g, d.c.b, glowA);
                p.circle(ox + d.x, oy + d.y, glowR);
                // solid core
                p.fill(d.c.r, d.c.g, d.c.b, coreA);
                p.circle(ox + d.x, oy + d.y, drawR * 2);
            });

            // ── Title block (top area above dots) ──
            var titleY = oy + H * 0.11;
            p.noStroke();
            p.fill(18, 18, 18);
            p.textAlign(p.CENTER, p.CENTER);
            p.textSize(Math.min(44, W * 0.075));
            p.textStyle(p.BOLD);
            p.text('Students & ChatGPT', cx, titleY);
            p.textStyle(p.NORMAL);

            p.fill(100, 100, 110);
            p.textSize(Math.min(17, W * 0.030));
            p.text('A Global Perspective', cx, titleY + Math.min(44, W * 0.075) * 0.85);

            // ── Legend (4 field colors, centered below title) ──
            var legendLabels = ['Social Sciences', 'Applied Sciences', 'Arts & Humanities', 'Natural Sciences'];
            var legendY = titleY + Math.min(36, W * 0.065) * 0.85 + 22;
            var totalLegW = 0;
            var dotS = 10, dotGap = 5, lblGap = 16;
            // measure
            p.textSize(13);
            legendLabels.forEach(function (lbl) { totalLegW += dotS + dotGap + p.textWidth(lbl) + lblGap; });
            totalLegW -= lblGap;
            var lx = cx - totalLegW / 2;
            legendLabels.forEach(function (lbl, i) {
                var c = _FIELDS[i];
                p.noStroke();
                p.fill(c.r, c.g, c.b);
                p.circle(lx + dotS / 2, legendY, dotS);
                p.fill(80, 80, 90);
                p.textAlign(p.LEFT, p.CENTER);
                p.textSize(13);
                p.text(lbl, lx + dotS + dotGap, legendY);
                lx += dotS + dotGap + p.textWidth(lbl) + lblGap;
            });

            // ── Animated stat counters ──
            var se = Math.min(1, elapsed / 1.8);
            se = se * se * (3 - 2 * se);

            var stats = [
                { val: 23218, label: 'students surveyed' },
                { val: 149,   label: 'countries' },
                { val: 174,   label: 'questions' }
            ];
            var stripY = oy + H * 0.84;
            var colW   = W / 3;
            stats.forEach(function (s, i) {
                var sx  = ox + colW * i + colW / 2;
                var num = Math.round(s.val * se);
                var fmt = num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');

                p.noStroke();
                p.fill(22, 22, 28);
                p.textAlign(p.CENTER, p.CENTER);
                p.textSize(Math.min(26, W * 0.044));
                p.textStyle(p.BOLD);
                p.text(fmt, sx, stripY);
                p.textStyle(p.NORMAL);

                p.fill(130, 130, 145);
                p.textSize(12);
                p.text(s.label, sx, stripY + 20);
            });

            // ── "hover to interact" hint — below stats ──
            p.fill(80, 80, 90);
            p.textAlign(p.CENTER, p.CENTER);
            p.textSize(17);
            p.text('hover over the dots to interact · each dot = a student', cx, stripY + 42);

        }
    };
})();
