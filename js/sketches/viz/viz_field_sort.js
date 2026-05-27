// viz_field_sort.js
// NYT-style flowing particle sort: student cards start mixed, then sort
// into "Using AI" vs "Not Using AI" by academic field as the user scrolls.
(function () {
    'use strict';

    window.VizFieldSort = {
        _particles: null,
        _initW: null,
        _initH: null,

        _FIELDS: [
            { id: 2, color: [70, 130, 210],  short: 'Social Sciences'   },
            { id: 3, color: [60, 170, 110],  short: 'Applied Sciences'  },
            { id: 1, color: [210, 90, 120],  short: 'Arts & Humanities' },
            { id: 4, color: [230, 155, 50],  short: 'Natural Sciences'  }
        ],

        _CARD: 7,
        _GAP: 3,

        _init: function (manager) {
            var W = manager.width || 600;
            var H = manager.height || 520;
            var ox = manager.offsetX || 0;
            var oy = manager.offsetY || 0;
            this._initW = W;
            this._initH = H;

            var fu = manager._surveyData.field_usage;
            var FIELDS = this._FIELDS;
            var STEP = this._CARD + this._GAP;

            // Build proportional particle list (120 total)
            var TOTAL = 120;
            var grandTotal = [1, 2, 3, 4].reduce(function (s, id) {
                return s + (fu[id] ? fu[id].total : 0);
            }, 0);

            var particles = [];
            FIELDS.forEach(function (fdef) {
                var fd = fu[fdef.id];
                if (!fd) return;
                var n = Math.max(6, Math.round(TOTAL * fd.total / grandTotal));
                var nUsed = Math.round(n * fd.pct_used / 100);
                var nNot = n - nUsed;
                for (var i = 0; i < nUsed; i++) {
                    particles.push({ field: fdef.id, used: true, color: fdef.color });
                }
                for (var i = 0; i < nNot; i++) {
                    particles.push({ field: fdef.id, used: false, color: fdef.color });
                }
            });

            // Shuffle for natural mixed start
            for (var i = particles.length - 1; i > 0; i--) {
                var j = Math.floor(Math.random() * (i + 1));
                var tmp = particles[i]; particles[i] = particles[j]; particles[j] = tmp;
            }

            // --- Start positions: phyllotaxis spiral centered in canvas ---
            var startCx = ox + W / 2;
            var startCy = oy + H * 0.5;
            var maxR = Math.min(W, H) * 0.28;
            var golden = Math.PI * (3 - Math.sqrt(5));
            particles.forEach(function (pt, i) {
                var angle = i * golden;
                var r = maxR * Math.sqrt((i + 0.5) / particles.length);
                pt.sx = startCx + Math.cos(angle) * r;
                pt.sy = startCy + Math.sin(angle) * r;
                pt.x = pt.sx;
                pt.y = pt.sy;
            });

            // --- End positions: horizontal rows by field ---
            var LABEL_W = 118;
            var TOP_PAD = 62;
            var BOT_PAD = 18;
            var chartL = ox + LABEL_W;
            var chartW = W - LABEL_W - 8;
            var chartH = H - TOP_PAD - BOT_PAD;
            var midX = chartL + chartW * 0.5;
            var nRows = FIELDS.length;
            var rowH = chartH / nRows;

            FIELDS.forEach(function (fdef, fi) {
                var rowCy = oy + TOP_PAD + fi * rowH + rowH / 2;
                var usedPts = particles.filter(function (p) { return p.field === fdef.id && p.used; });
                var notPts  = particles.filter(function (p) { return p.field === fdef.id && !p.used; });

                // Used: pack rightward from left, right-justified to midX
                var usedCols = Math.max(1, Math.floor((chartW * 0.46) / STEP));
                var usedRows = Math.ceil(usedPts.length / usedCols);
                var usedStartX = midX - usedCols * STEP;
                var usedStartY = rowCy - (usedRows * STEP) / 2;
                usedPts.forEach(function (pt, i) {
                    pt.ex = usedStartX + (i % usedCols) * STEP + 2;
                    pt.ey = usedStartY + Math.floor(i / usedCols) * STEP;
                });

                // Not-used: pack leftward from right
                var notCols = Math.max(1, Math.floor((chartW * 0.46) / STEP));
                var notRows = Math.ceil(notPts.length / notCols);
                var notStartX = midX + 4;
                var notStartY = rowCy - (notRows * STEP) / 2;
                notPts.forEach(function (pt, i) {
                    pt.ex = notStartX + (i % notCols) * STEP;
                    pt.ey = notStartY + Math.floor(i / notCols) * STEP;
                });
            });

            this._particles = particles;
        },

        draw: function (p, manager, ai, progress) {
            if (!manager._surveyData) return;
            var W = manager.width || 600;
            var H = manager.height || 520;
            var ox = manager.offsetX || 0;
            var oy = manager.offsetY || 0;

            if (!this._particles || this._initW !== W || this._initH !== H) {
                this._init(manager);
            }

            var particles = this._particles;
            var FIELDS    = this._FIELDS;
            var fu        = manager._surveyData.field_usage;
            var STEP      = this._CARD + this._GAP;

            var LABEL_W = 118;
            var TOP_PAD = 62;
            var BOT_PAD = 18;
            var chartL  = ox + LABEL_W;
            var chartW  = W - LABEL_W - 8;
            var chartH  = H - TOP_PAD - BOT_PAD;
            var midX    = chartL + chartW * 0.5;
            var rowH    = chartH / FIELDS.length;

            // Ease progress
            var t = Math.max(0, Math.min(1, progress));
            function smooth(x) { return x * x * (3 - 2 * x); }
            var ease = smooth(t);

            // Animate particles toward end positions
            particles.forEach(function (pt) {
                pt.x = pt.sx + (pt.ex - pt.sx) * ease;
                pt.y = pt.sy + (pt.ey - pt.sy) * ease;
            });

            // === DRAW BACKGROUND STRUCTURE ===
            var structAlpha = Math.round(Math.min(255, ease * 3 * 255));

            // Row separators
            p.stroke(235);
            p.strokeWeight(1);
            for (var fi = 1; fi < FIELDS.length; fi++) {
                var ry = oy + TOP_PAD + fi * rowH;
                p.line(ox + 4, ry, ox + W - 4, ry);
            }

            // Center divider
            p.stroke(200, 200, 200, structAlpha);
            p.strokeWeight(1);
            p.line(midX, oy + TOP_PAD - 8, midX, oy + TOP_PAD + chartH);

            p.noStroke();

            // Column headers
            var headerAlpha = structAlpha;
            p.textAlign(p.CENTER, p.BOTTOM);
            p.textSize(12);
            p.fill(50, 150, 90, headerAlpha);
            p.text('Using AI', chartL + (midX - chartL) / 2, oy + TOP_PAD - 6);
            p.fill(200, 75, 75, headerAlpha);
            p.text('Not Using AI', midX + (chartL + chartW - midX) / 2, oy + TOP_PAD - 6);

            // === DRAW PARTICLES ===
            var CARD = this._CARD;
            particles.forEach(function (pt) {
                p.fill(pt.color[0], pt.color[1], pt.color[2], 215);
                p.noStroke();
                p.rect(pt.x - CARD / 2, pt.y - CARD / 2, CARD, CARD, 1.5);
            });

            // === FIELD LABELS (left side) ===
            FIELDS.forEach(function (fdef, fi) {
                var fd = fu[fdef.id];
                if (!fd) return;
                var rowCy = oy + TOP_PAD + fi * rowH + rowH / 2;

                // Color swatch
                p.noStroke();
                p.fill(fdef.color[0], fdef.color[1], fdef.color[2]);
                p.rect(ox + 6, rowCy - 14, 10, 10, 2);

                // Field name
                p.fill(25);
                p.textAlign(p.LEFT, p.CENTER);
                p.textSize(Math.min(11, rowH * 0.2));
                p.text(fdef.short, ox + 20, rowCy - 9);

                // Percentage labels (fade in)
                p.fill(80, 80, 80, structAlpha);
                p.textSize(10);
                p.text(fd.pct_used.toFixed(1) + '% used', ox + 20, rowCy + 7);
            });

            // === PAGE TITLE ===
            p.noStroke();
            p.fill(20);
            p.textAlign(p.CENTER, p.TOP);
            p.textSize(13);
            p.text('AI Usage Rates Among Students: How Each Major Compares', ox + W / 2, oy + 8);
        }
    };
})();
