// sketch_renderer.js
(function () {
    window.Renderer = {

        setData: function (manager) {
            manager.offsetX = (manager.margin && manager.margin.left) || 20;
            manager.offsetY = (manager.margin && manager.margin.top) || 0;
            manager.data = [];
            return Promise.resolve(manager.data);
        },

        draw: function (p, manager, ai, progress) {

            if (ai === 0 || ai === 1) {
                window.VizTitle.draw(p, manager, ai, progress);
                return;
            }

            if (ai === 3) {
                window.VizEmotionLine.draw(p, manager, ai, progress);
                return;
            }

            if (ai === 4) {
                window.VizParallel.draw(p, manager, ai, progress);
                return;
            }

            if (ai === 5) {
                window.VizLollipop.draw(p, manager, ai, progress);
                return;
            }

            if (ai === 6 || ai === 9) {
                window.VizProgressColor.draw(p, manager, ai, progress);
                return;
            }

            if (ai === 7) {
                window.VizBar.draw(p, manager, ai, progress);
                return;
            }
        }
    };
})();