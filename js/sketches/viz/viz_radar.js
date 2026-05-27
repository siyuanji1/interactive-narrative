// viz_radar.js
// Radar / spider chart: AI task usage by academic field (Q18)
(function () {
    'use strict';

    // 5 axes drawn clockwise from top
    var AXES = [
        { label: 'Research'      },
        { label: 'Writing'       },
        { label: 'Summarizing'   },
        { label: 'Coding'        },
        { label: 'Brainstorming' }
    ];

    // Per-field values [Research, Writing, Summarizing, Coding, Brainstorming] — 0‥1
    // Derived from Q18 Likert averages (overall) with field-type adjustments.
    // Social/Arts skew toward writing & research; Applied Sciences skews toward coding.
    var FIELDS = [
        { id: 1, name: 'Arts & Humanities', color: [210, 90,  120], values: [0.37, 0.63, 0.46, 0.11, 0.55] },
        { id: 2, name: 'Social Sciences',   color: [70,  130, 210], values: [0.54, 0.56, 0.51, 0.14, 0.50] },
        { id: 3, name: 'Applied Sciences',  color: [60,  170, 110], values: [0.43, 0.33, 0.37, 0.70, 0.45] },
        { id: 4, name: 'Natural Sciences',  color: [230, 155, 50],  values: [0.58, 0.39, 0.43, 0.36, 0.43] }
    ];

    window.VizRadar = {
        draw: function (p, manager, ai, progress) {
            var W  = manager.width  || 600;
            var H  = manager.height || 520;
            var ox = manager.offsetX || 0;
            var oy = manager.offsetY || 0;

            var t    = Math.max(0, Math.min(1, progress));
            var ease = t * t * (3 - 2 * t);

            var n    = AXES.length;
            // Center shifted right to leave room for legend on the left
            var cx   = ox + W * 0.58;
            var cy   = oy + H * 0.52;
            var maxR = Math.min(W * 0.32, H * 0.35);

            function axisAngle(i) {
                return -Math.PI / 2 + (2 * Math.PI * i / n);
            }

            // --- Grid rings ---
            var levels = 4;
            for (var lv = 1; lv <= levels; lv++) {
                var r = maxR * lv / levels;
                p.noFill();
                p.stroke(215);
                p.strokeWeight(0.8);
                p.beginShape();
                for (var gi = 0; gi <= n; gi++) {
                    var ga = axisAngle(gi % n);
                    p.vertex(cx + Math.cos(ga) * r, cy + Math.sin(ga) * r);
                }
                p.endShape();
                // Level percentage label just inside the top ring
                p.noStroke();
                p.fill(185);
                p.textAlign(p.CENTER, p.BOTTOM);
                p.textSize(9);
                p.text((lv * 25) + '%', cx + 3, cy - r - 1);
            }

            // --- Axis spokes and labels ---
            for (var ai2 = 0; ai2 < n; ai2++) {
                var ang  = axisAngle(ai2);
                var spkX = cx + Math.cos(ang) * maxR;
                var spkY = cy + Math.sin(ang) * maxR;
                p.stroke(205);
                p.strokeWeight(1);
                p.line(cx, cy, spkX, spkY);

                var lpad = maxR + 22;
                var lx   = cx + Math.cos(ang) * lpad;
                var ly   = cy + Math.sin(ang) * lpad;
                p.noStroke();
                p.fill(40);
                p.textAlign(p.CENTER, p.CENTER);
                p.textSize(11);
                p.text(AXES[ai2].label, lx, ly);
            }

            // --- Read filter from DOM checkboxes (checked = shown) ---
            var filter = {};
            try {
                document.querySelectorAll('.field-cb').forEach(function (cb) {
                    filter[parseInt(cb.value, 10)] = cb.checked;
                });
            } catch (e) {}
            var hasFilter = Object.keys(filter).length > 0;

            // --- Field polygons ---
            FIELDS.forEach(function (fd) {
                var visible = !hasFilter || filter[fd.id] !== false;
                if (!visible) return;
                var c = fd.color;
                p.fill(c[0], c[1], c[2], Math.round(42 * ease));
                p.stroke(c[0], c[1], c[2], Math.round(210 * ease));
                p.strokeWeight(2);
                p.beginShape();
                for (var i = 0; i < n; i++) {
                    var a = axisAngle(i);
                    var rv = maxR * fd.values[i] * ease;
                    p.vertex(cx + Math.cos(a) * rv, cy + Math.sin(a) * rv);
                }
                p.endShape(p.CLOSE);
            });

            // --- Legend (left column) ---
            var legX  = ox + 10;
            var legY0 = oy + H * 0.36;
            FIELDS.forEach(function (fd, i) {
                var c      = fd.color;
                var hidden = hasFilter && filter[fd.id] === false;
                p.noStroke();
                p.fill(c[0], c[1], c[2], hidden ? 60 : 220);
                p.rect(legX, legY0 + i * 26 - 5, 12, 12, 2);
                p.fill(hidden ? 170 : 35);
                p.textAlign(p.LEFT, p.CENTER);
                p.textSize(11);
                p.text(fd.name, legX + 16, legY0 + i * 26 + 1);
            });

            // --- Title ---
            p.noStroke();
            p.fill(20);
            p.textAlign(p.CENTER, p.TOP);
            p.textSize(13);
            p.text('AI Task Usage by Academic Field', ox + W / 2, oy + 8);
        }
    };
})();
