// viz_field_sort.js
// NYT-style: cards cluster at bottom, arc through bezier tunnels into field rows
// Cards grouped in sets of 5 (like tally marks) for easy counting
(function () {
    'use strict';

    window.VizFieldSort = {
        _particles: null,
        _initW: null,
        _initH: null,
        _filter: null,
        _prevPressed: false,
        _btns: null,

        _FIELDS: [
            { id: 3, color: [60,  170, 110], short: 'Applied Sciences'  },
            { id: 4, color: [230, 155, 50],  short: 'Natural Sciences'  },
            { id: 2, color: [70,  130, 210], short: 'Social Sciences'   },
            { id: 1, color: [210, 90,  120], short: 'Arts & Humanities' }
        ],

        _CARD:      5,
        _GAP:       2,
        _GRP:       5,   // cards per tally group
        _GGAP:      6,   // extra gap between groups
        _MAX_DELAY: 0.50,

        _init: function (manager) {
            var W  = manager.width  || 600;
            var H  = manager.height || 520;
            var ox = manager.offsetX || 0;
            var oy = manager.offsetY || 0;
            this._initW = W;
            this._initH = H;

            var fu     = manager._surveyData.field_usage;
            var FIELDS = this._FIELDS;
            var CARD   = this._CARD;
            var GAP    = this._GAP;
            var STEP   = CARD + GAP;
            var GRP    = this._GRP;
            var GGAP   = this._GGAP;
            var GRP_W  = GRP * STEP + GGAP; // width of one tally group

            // 100 cards per field: each card = 1% of that field's students
            var particles = [];
            FIELDS.forEach(function (fdef) {
                var fd = fu[fdef.id];
                if (!fd) return;
                var nUsed = Math.round(fd.pct_used);
                var nNot  = 100 - nUsed;
                for (var i = 0; i < nUsed; i++) particles.push({ field: fdef.id, used: true,  color: fdef.color });
                for (var i = 0; i < nNot;  i++) particles.push({ field: fdef.id, used: false, color: fdef.color });
            });

            // Shuffle for mixed cluster start
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

            // Groups per row on each side
            var sideW    = chartW * 0.45;
            var grpsPerRow = Math.max(1, Math.floor((sideW + GGAP) / GRP_W));
            var cpr        = grpsPerRow * GRP; // cards per row
            var rowW       = grpsPerRow * GRP * STEP + (grpsPerRow - 1) * GGAP;

            // Used side ends at midX; not-used side starts at midX
            var usedStartXBase = midX - rowW - 4;
            var notStartXBase  = midX + 20;

            // Phyllotaxis spiral start at bottom-center
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

            var peakY = oy + TOP_PAD * 0.35;

            // End positions — both groups start at the SAME y (first rows aligned)
            FIELDS.forEach(function (fdef, fi) {
                var rowCy   = oy + TOP_PAD + fi * rowH + rowH / 2;
                var usedPts = particles.filter(function (pt) { return pt.field === fdef.id && pt.used;  });
                var notPts  = particles.filter(function (pt) { return pt.field === fdef.id && !pt.used; });

                var usedRows = Math.ceil(usedPts.length / cpr);
                var notRows  = Math.ceil(notPts.length  / cpr);
                var maxRows  = Math.max(usedRows, notRows, 1);

                // startY centers the block vertically in the row band
                var startY = rowCy - (maxRows * STEP) / 2;

                // Vertical-first fill: columns stack top-to-bottom for easier comparison
                usedPts.forEach(function (pt, i) {
                    var col      = Math.floor(i / maxRows);
                    var row      = i % maxRows;
                    var grpInRow = Math.floor(col / GRP);
                    var posInGrp = col % GRP;
                    pt.ex    = usedStartXBase + grpInRow * GRP_W + posInGrp * STEP;
                    pt.ey    = startY + row * STEP;
                    pt.cx    = midX - chartW * 0.22 + (Math.random() - 0.5) * chartW * 0.10;
                    pt.cy    = peakY;
                    pt.delay = Math.random() * 0.50;
                });

                notPts.forEach(function (pt, i) {
                    var col      = Math.floor(i / maxRows);
                    var row      = i % maxRows;
                    var grpInRow = Math.floor(col / GRP);
                    var posInGrp = col % GRP;
                    pt.ex    = notStartXBase + grpInRow * GRP_W + posInGrp * STEP;
                    pt.ey    = startY + row * STEP;
                    pt.cx    = midX + chartW * 0.22 + (Math.random() - 0.5) * chartW * 0.10;
                    pt.cy    = peakY;
                    pt.delay = Math.random() * 0.50;
                });
            });

            // Button positions above chart
            var btnW   = 108;
            var btnH   = 24;
            var usedCX = midX - sideW * 0.5;
            var notCX  = midX + sideW * 0.5;
            var btnY   = oy + TOP_PAD - btnH - 4;
            this._btns = {
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

            // Click handling
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

            // Tunnel arcs (fade as cards arrive)
            var tunnelAlpha = Math.max(0, (1 - t * 1.8) * 80);
            if (tunnelAlpha > 1) {
                p.noFill();
                p.strokeWeight(1.2);
                var startCx = ox + W * 0.5;
                var startCy = oy + H * 0.84;
                var peakY   = oy + TOP_PAD * 0.35;
                FIELDS.forEach(function (fdef, fi) {
                    var c     = fdef.color;
                    var rowCy = oy + TOP_PAD + fi * rowH + rowH / 2;
                    p.stroke(c[0], c[1], c[2], tunnelAlpha);
                    var exU = midX - chartW * 0.22;
                    p.beginShape();
                    for (var s = 0; s <= 1.001; s += 0.03) {
                        var it = 1 - s;
                        p.vertex(it*it*startCx + 2*it*s*exU + s*s*exU,
                                 it*it*startCy + 2*it*s*peakY + s*s*rowCy);
                    }
                    p.endShape();
                    var exN = midX + chartW * 0.22;
                    p.beginShape();
                    for (var s = 0; s <= 1.001; s += 0.03) {
                        var it = 1 - s;
                        p.vertex(it*it*startCx + 2*it*s*exN + s*s*exN,
                                 it*it*startCy + 2*it*s*peakY + s*s*rowCy);
                    }
                    p.endShape();
                });
            }

            // Move particles along bezier arcs
            particles.forEach(function (pt) {
                var lt = Math.max(0, Math.min(1, (t - pt.delay) / (1 - MAX_DELAY)));
                var et = smooth(lt);
                var it = 1 - et;
                pt.x = it*it*pt.sx + 2*it*et*pt.cx + et*et*pt.ex;
                pt.y = it*it*pt.sy + 2*it*et*pt.cy + et*et*pt.ey;
            });

            // Background grid lines
            p.stroke(235);
            p.strokeWeight(1);
            for (var fi = 1; fi < FIELDS.length; fi++) {
                p.line(ox + 4, oy + TOP_PAD + fi * rowH, ox + W - 4, oy + TOP_PAD + fi * rowH);
            }
            var structAlpha = Math.round(Math.min(255, t * 3 * 255));
            p.stroke(200, 200, 200, structAlpha);
            p.strokeWeight(1);
            p.line(midX, oy + TOP_PAD - 8, midX, oy + TOP_PAD + chartH);
            p.noStroke();

            // Particles
            particles.forEach(function (pt) {
                var alpha = 215;
                if (filter !== null) {
                    alpha = ((filter === 'used') ? pt.used : !pt.used) ? 215 : 28;
                }
                var r, g, b;
                if (pt.used) {
                    r = pt.color[0]; g = pt.color[1]; b = pt.color[2];
                } else {
                    // blend field color with grey for not-using-AI cards
                    r = Math.round(pt.color[0] * 0.35 + 195 * 0.65);
                    g = Math.round(pt.color[1] * 0.35 + 195 * 0.65);
                    b = Math.round(pt.color[2] * 0.35 + 195 * 0.65);
                }
                p.fill(r, g, b, alpha);
                p.noStroke();
                p.rect(pt.x - CARD/2, pt.y - CARD/2, CARD, CARD, 1.5);
            });

            // Field labels
            var usedMidX = (chartL + midX) / 2;       // center of Using AI section
            var notMidX  = midX + chartW * 0.25;       // center of Not Using AI section
            FIELDS.forEach(function (fdef, fi) {
                var fd       = fu[fdef.id];
                if (!fd) return;
                var rowCy    = oy + TOP_PAD + fi * rowH + rowH / 2;
                var sepY     = oy + TOP_PAD + (fi + 1) * rowH; // row separator
                var pctY     = sepY - 28; // percentage number above separator
                var lblY     = sepY - 12; // "used AI" / "not using AI" label
                p.noStroke();
                p.fill(fdef.color[0], fdef.color[1], fdef.color[2]);
                p.rect(ox + 6, rowCy - 6, 11, 11, 2);
                p.fill(25);
                p.textAlign(p.LEFT, p.CENTER);
                p.textSize(Math.min(12, rowH * 0.22));
                p.text(fdef.short, ox + 21, rowCy);

                // Using AI percentage — teal to match button
                p.fill(20, 110, 90);
                p.textAlign(p.CENTER, p.CENTER);
                p.textSize(13);
                p.textStyle(p.BOLD);
                p.text(fd.pct_used.toFixed(1) + '%', usedMidX, pctY);
                p.textStyle(p.NORMAL);
                p.fill(20, 110, 90);
                p.textSize(10);
                p.text('using AI', usedMidX, lblY);

                // Not Using AI percentage — gray to match button
                var notPct = (100 - fd.pct_used).toFixed(1);
                p.fill(70, 80, 95);
                p.textAlign(p.CENTER, p.CENTER);
                p.textSize(13);
                p.textStyle(p.BOLD);
                p.text(notPct + '%', notMidX, pctY);
                p.textStyle(p.NORMAL);
                p.fill(70, 80, 95);
                p.textSize(10);
                p.text('not using AI', notMidX, lblY);
            });

            // Filter buttons
            if (btns) {
                var usedOn = filter === 'used';
                var notOn  = filter === 'notused';

                // "Using AI" — teal
                p.noStroke();
                p.fill(usedOn ? 20 : 210, usedOn ? 130 : 240, usedOn ? 110 : 230);
                p.rect(btns.used.x, btns.used.y, btns.used.w, btns.used.h, 5);
                p.fill(usedOn ? 255 : 20, usedOn ? 255 : 110, usedOn ? 255 : 90);
                p.textAlign(p.CENTER, p.CENTER);
                p.textSize(11);
                p.text('Using AI', btns.used.x + btns.used.w / 2, btns.used.y + btns.used.h / 2);

                // "Not Using AI" — slate gray (distinct from all field colors)
                p.noStroke();
                p.fill(notOn ? 80 : 225, notOn ? 90 : 225, notOn ? 105 : 228);
                p.rect(btns.notused.x, btns.notused.y, btns.notused.w, btns.notused.h, 5);
                p.fill(notOn ? 255 : 70, notOn ? 255 : 80, notOn ? 255 : 95);
                p.textAlign(p.CENTER, p.CENTER);
                p.textSize(11);
                p.text('Not Using AI', btns.notused.x + btns.notused.w / 2, btns.notused.y + btns.notused.h / 2);
            }

            // Chart title
            p.noStroke();
            p.fill(20);
            p.textAlign(p.CENTER, p.TOP);
            p.textSize(13);
            p.text('AI Usage Rates Among Students: How Each Major Compares', ox + W / 2, oy + 6);
        }
    };
})();
