// viz_field_sort.js
// NYT-style: cards cluster at bottom, arc through bezier tunnels into field rows
(function () {
    'use strict';

    window.VizFieldSort = {
        _particles: null,
        _initW: null,
        _initH: null,
        _filter: null,       // null | 'used' | 'notused'
        _prevPressed: false,
        _btns: null,

        _FIELDS: [
            { id: 2, color: [70,  130, 210], short: 'Social Sciences'   },
            { id: 3, color: [60,  170, 110], short: 'Applied Sciences'  },
            { id: 1, color: [210, 90,  120], short: 'Arts & Humanities' },
            { id: 4, color: [230, 155, 50],  short: 'Natural Sciences'  }
        ],

        _CARD:      7,
        _GAP:       3,
        _MAX_DELAY: 0.35,

        _init: function (manager) {
            var W  = manager.width  || 600;
            var H  = manager.height || 520;
            var ox = manager.offsetX || 0;
            var oy = manager.offsetY || 0;
            this._initW = W;
            this._initH = H;

            var fu     = manager._surveyData.field_usage;
            var FIELDS = this._FIELDS;
            var STEP   = this._CARD + this._GAP;

            // Build ~120 proportional particles
            var TOTAL      = 120;
            var grandTotal = [1, 2, 3, 4].reduce(function (s, id) {
                return s + (fu[id] ? fu[id].total : 0);
            }, 0);

            var particles = [];
            FIELDS.forEach(function (fdef) {
                var fd = fu[fdef.id];
                if (!fd) return;
                var n     = Math.max(6, Math.round(TOTAL * fd.total / grandTotal));
                var nUsed = Math.round(n * fd.pct_used / 100);
                var nNot  = n - nUsed;
                for (var i = 0; i < nUsed; i++) particles.push({ field: fdef.id, used: true,  color: fdef.color });
                for (var i = 0; i < nNot;  i++) particles.push({ field: fdef.id, used: false, color: fdef.color });
            });

            // Shuffle for a mixed cluster start
            for (var i = particles.length - 1; i > 0; i--) {
                var j   = Math.floor(Math.random() * (i + 1));
                var tmp = particles[i]; particles[i] = particles[j]; particles[j] = tmp;
            }

            // Layout constants
            var LABEL_W = 118;
            var TOP_PAD = 68;
            var BOT_PAD = 18;
            var chartL  = ox + LABEL_W;
            var chartW  = W - LABEL_W - 8;
            var chartH  = H - TOP_PAD - BOT_PAD;
            var midX    = chartL + chartW * 0.5;
            var rowH    = chartH / FIELDS.length;

            // Start: phyllotaxis spiral at bottom-center
            var startCx = ox + W * 0.5;
            var startCy = oy + H * 0.84;
            var maxR    = Math.min(W, H) * 0.11;
            var golden  = Math.PI * (3 - Math.sqrt(5));
            particles.forEach(function (pt, i) {
                var angle = i * golden;
                var r     = maxR * Math.sqrt((i + 0.5) / particles.length);
                pt.sx = startCx + Math.cos(angle) * r;
                pt.sy = startCy + Math.sin(angle) * r;
                pt.x  = pt.sx;
                pt.y  = pt.sy;
            });

            // End positions: rows by field, used on left of midX, not-used on right
            FIELDS.forEach(function (fdef, fi) {
                var rowCy   = oy + TOP_PAD + fi * rowH + rowH / 2;
                var usedPts = particles.filter(function (pt) { return pt.field === fdef.id && pt.used;  });
                var notPts  = particles.filter(function (pt) { return pt.field === fdef.id && !pt.used; });

                var usedCols   = Math.max(1, Math.floor((chartW * 0.46) / STEP));
                var usedStartX = midX - usedCols * STEP;
                var usedStartY = rowCy - (Math.ceil(usedPts.length / usedCols) * STEP) / 2;
                usedPts.forEach(function (pt, i) {
                    pt.ex = usedStartX + (i % usedCols) * STEP + 2;
                    pt.ey = usedStartY + Math.floor(i / usedCols) * STEP;
                    // bezier control point: arcs up then lands at destination row
                    pt.cx    = midX - chartW * 0.18 + (Math.random() - 0.5) * chartW * 0.12;
                    pt.cy    = oy + TOP_PAD + fi * rowH + rowH * 0.15;
                    pt.delay = Math.random() * 0.35;
                });

                var notCols   = Math.max(1, Math.floor((chartW * 0.46) / STEP));
                var notStartX = midX + 4;
                var notStartY = rowCy - (Math.ceil(notPts.length / notCols) * STEP) / 2;
                notPts.forEach(function (pt, i) {
                    pt.ex = notStartX + (i % notCols) * STEP;
                    pt.ey = notStartY + Math.floor(i / notCols) * STEP;
                    pt.cx    = midX + chartW * 0.18 + (Math.random() - 0.5) * chartW * 0.12;
                    pt.cy    = oy + TOP_PAD + fi * rowH + rowH * 0.15;
                    pt.delay = Math.random() * 0.35;
                });
            });

            // Button positions (sit just above the chart area)
            var btnW    = 100;
            var btnH    = 24;
            var usedCX  = chartL + chartW * 0.25;
            var notCX   = midX   + chartW * 0.25;
            var btnY    = oy + TOP_PAD - btnH - 4;
            this._btns  = {
                used:    { x: usedCX - btnW / 2, y: btnY, w: btnW, h: btnH },
                notused: { x: notCX  - btnW / 2, y: btnY, w: btnW, h: btnH }
            };

            this._particles   = particles;
            this._filter      = null;
            this._prevPressed = false;
        },

        draw: function (p, manager, ai, progress) {
            if (!manager._surveyData) return;
            var W  = manager.width  || 600;
            var H  = manager.height || 520;
            var ox = manager.offsetX || 0;
            var oy = manager.offsetY || 0;

            if (!this._particles || this._initW !== W || this._initH !== H) {
                this._init(manager);
            }

            var particles = this._particles;
            var FIELDS    = this._FIELDS;
            var fu        = manager._surveyData.field_usage;
            var STEP      = this._CARD + this._GAP;
            var CARD      = this._CARD;
            var MAX_DELAY = this._MAX_DELAY;
            var filter    = this._filter;
            var btns      = this._btns;

            var LABEL_W = 118;
            var TOP_PAD = 68;
            var BOT_PAD = 18;
            var chartL  = ox + LABEL_W;
            var chartW  = W - LABEL_W - 8;
            var chartH  = H - TOP_PAD - BOT_PAD;
            var midX    = chartL + chartW * 0.5;
            var rowH    = chartH / FIELDS.length;

            var t = Math.max(0, Math.min(1, progress));
            function smooth(x) { return x * x * (3 - 2 * x); }

            // --- Click handling ---
            var pressed = p.mouseIsPressed;
            if (pressed && !this._prevPressed && btns) {
                var mx = p.mouseX, my = p.mouseY;
                var b = btns.used;
                if (mx >= b.x && mx <= b.x + b.w && my >= b.y && my <= b.y + b.h) {
                    this._filter = (this._filter === 'used') ? null : 'used';
                }
                b = btns.notused;
                if (mx >= b.x && mx <= b.x + b.w && my >= b.y && my <= b.y + b.h) {
                    this._filter = (this._filter === 'notused') ? null : 'notused';
                }
                filter = this._filter;
            }
            this._prevPressed = pressed;

            // --- Tunnel paths (faint arcs, fade out as cards arrive) ---
            var tunnelAlpha = Math.max(0, (1 - t * 2.8) * 55);
            if (tunnelAlpha > 1) {
                p.noFill();
                p.strokeWeight(1.5);
                var startCx = ox + W * 0.5;
                var startCy = oy + H * 0.84;
                FIELDS.forEach(function (fdef, fi) {
                    var c      = fdef.color;
                    var rowCy  = oy + TOP_PAD + fi * rowH + rowH / 2;
                    var ctrlY  = oy + TOP_PAD + fi * rowH + rowH * 0.15;

                    p.stroke(c[0], c[1], c[2], tunnelAlpha);

                    // Used-side arch
                    var exU = midX - chartW * 0.18;
                    var cxU = midX - chartW * 0.18;
                    p.beginShape();
                    for (var s = 0; s <= 1.001; s += 0.04) {
                        var it = 1 - s;
                        p.vertex(
                            it*it*startCx + 2*it*s*cxU  + s*s*exU,
                            it*it*startCy + 2*it*s*ctrlY + s*s*rowCy
                        );
                    }
                    p.endShape();

                    // Not-used-side arch
                    var exN = midX + chartW * 0.18;
                    var cxN = midX + chartW * 0.18;
                    p.beginShape();
                    for (var s = 0; s <= 1.001; s += 0.04) {
                        var it = 1 - s;
                        p.vertex(
                            it*it*startCx + 2*it*s*cxN  + s*s*exN,
                            it*it*startCy + 2*it*s*ctrlY + s*s*rowCy
                        );
                    }
                    p.endShape();
                });
            }

            // --- Move particles along bezier arcs ---
            particles.forEach(function (pt) {
                var lt = Math.max(0, Math.min(1, (t - pt.delay) / (1 - MAX_DELAY)));
                var et = smooth(lt);
                var it = 1 - et;
                pt.x = it*it*pt.sx + 2*it*et*pt.cx + et*et*pt.ex;
                pt.y = it*it*pt.sy + 2*it*et*pt.cy + et*et*pt.ey;
            });

            // --- Background structure (fades in with progress) ---
            var structAlpha = Math.round(Math.min(255, t * 3 * 255));

            p.stroke(235);
            p.strokeWeight(1);
            for (var fi = 1; fi < FIELDS.length; fi++) {
                p.line(ox + 4, oy + TOP_PAD + fi * rowH, ox + W - 4, oy + TOP_PAD + fi * rowH);
            }
            p.stroke(200, 200, 200, structAlpha);
            p.strokeWeight(1);
            p.line(midX, oy + TOP_PAD - 8, midX, oy + TOP_PAD + chartH);
            p.noStroke();

            // --- Particles ---
            particles.forEach(function (pt) {
                var alpha = 215;
                if (filter !== null) {
                    alpha = ((filter === 'used') ? pt.used : !pt.used) ? 215 : 28;
                }
                p.fill(pt.color[0], pt.color[1], pt.color[2], alpha);
                p.noStroke();
                p.rect(pt.x - CARD/2, pt.y - CARD/2, CARD, CARD, 1.5);
            });

            // --- Field labels ---
            FIELDS.forEach(function (fdef, fi) {
                var fd    = fu[fdef.id];
                if (!fd) return;
                var rowCy = oy + TOP_PAD + fi * rowH + rowH / 2;
                p.noStroke();
                p.fill(fdef.color[0], fdef.color[1], fdef.color[2]);
                p.rect(ox + 6, rowCy - 14, 10, 10, 2);
                p.fill(25);
                p.textAlign(p.LEFT, p.CENTER);
                p.textSize(Math.min(11, rowH * 0.2));
                p.text(fdef.short, ox + 20, rowCy - 9);
                p.fill(80, 80, 80, structAlpha);
                p.textSize(10);
                p.text(fd.pct_used.toFixed(1) + '% used', ox + 20, rowCy + 7);
            });

            // --- Clickable filter buttons ---
            if (btns) {
                var usedOn = filter === 'used';
                var notOn  = filter === 'notused';

                // Using AI button
                p.noStroke();
                p.fill(usedOn ? 45 : 220, usedOn ? 155 : 242, usedOn ? 90 : 228);
                p.rect(btns.used.x, btns.used.y, btns.used.w, btns.used.h, 5);
                p.fill(usedOn ? 255 : 30, usedOn ? 255 : 110, usedOn ? 255 : 60);
                p.textAlign(p.CENTER, p.CENTER);
                p.textSize(11);
                p.text('Using AI', btns.used.x + btns.used.w / 2, btns.used.y + btns.used.h / 2);

                // Not Using AI button
                p.noStroke();
                p.fill(notOn ? 200 : 252, notOn ? 55 : 228, notOn ? 55 : 228);
                p.rect(btns.notused.x, btns.notused.y, btns.notused.w, btns.notused.h, 5);
                p.fill(notOn ? 255 : 170, notOn ? 255 : 45, notOn ? 255 : 45);
                p.textAlign(p.CENTER, p.CENTER);
                p.textSize(11);
                p.text('Not Using AI', btns.notused.x + btns.notused.w / 2, btns.notused.y + btns.notused.h / 2);
            }

            // --- Page title ---
            p.noStroke();
            p.fill(20);
            p.textAlign(p.CENTER, p.TOP);
            p.textSize(13);
            p.text('AI Usage Rates Among Students: How Each Major Compares', ox + W / 2, oy + 6);
        }
    };
})();
