// viz_title.js — Full-bleed title card
(function () {
    window.VizTitle = {
        draw: function (p, manager, ai, progress) {
            var W = manager.width || 600;
            var H = manager.height || 520;
            var ox = manager.offsetX || 0;
            var oy = manager.offsetY || 0;
            var cx = ox + W / 2;
            var cy = oy + H / 2;

            p.push();
            p.noStroke();

            // Background gradient blocks
            for (var i = 0; i < H; i++) {
                var t = i / H;
                p.fill(
                    p.lerp(20, 60, t),
                    p.lerp(60, 120, t),
                    p.lerp(120, 200, t)
                );
                p.rect(ox, oy + i, W, 1);
            }

            // Title
            p.fill(255);
            p.textAlign(p.CENTER, p.CENTER);
            p.textSize(Math.min(36, W * 0.065));
            p.text('Students & ChatGPT', cx, cy - H * 0.13);

            p.textSize(Math.min(18, W * 0.032));
            p.fill(200, 230, 255);
            p.text('A Global Perspective', cx, cy - H * 0.04);

            // Stats strip
            p.fill(255, 255, 255, 30);
            p.rect(ox + 20, cy + H * 0.07, W - 40, H * 0.18, 8);

            p.fill(255);
            p.textSize(Math.min(28, W * 0.05));
            p.textAlign(p.CENTER, p.CENTER);

            var stats = [
                { val: '23,218', label: 'students' },
                { val: '149', label: 'countries' },
                { val: '174', label: 'questions' }
            ];
            var colW = (W - 40) / 3;
            stats.forEach(function (s, i) {
                var sx = ox + 20 + colW * i + colW / 2;
                var sy = cy + H * 0.13;
                p.fill(255);
                p.textSize(Math.min(24, W * 0.042));
                p.text(s.val, sx, sy - 8);
                p.textSize(Math.min(10, W * 0.018));
                p.fill(180, 220, 255);
                p.text(s.label, sx, sy + 14);
            });

            // scroll cue
            p.fill(255, 255, 255, 160);
            p.textSize(10);
            p.textAlign(p.CENTER, p.BOTTOM);
            p.text('scroll to explore ↓', cx, oy + H - 12);

            p.pop();
        }
    };
})();
