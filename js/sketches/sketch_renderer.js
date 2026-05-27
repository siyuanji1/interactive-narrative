// sketch_renderer.js

// Responsible for rendering the main visualization based on the current active index
(function () {
    window.Renderer = {

        setData: function (manager) {
            manager.offsetX = (manager.margin && manager.margin.left) || 20;
            manager.offsetY = (manager.margin && manager.margin.top) || 0;
            manager.data = [];

            return DataLoader.loadJSON('data/survey_data.json').then(function (d) {
                manager._surveyData = d;
                if (window.VizFieldSort) window.VizFieldSort._particles = null;
            }).catch(function (err) {
                console.error('Failed to load survey_data.json', err);
            });
        },

        draw: function (p, manager, ai, progress) {

            if (ai === 0) {
                window.VizTitle.draw(p, manager, ai, progress);
                return;
            }

            if (ai === 1) {
                window.VizFieldSort && window.VizFieldSort.draw(p, manager, ai, progress);
                return;
            }

            if (ai === 6  || ai === 9) {
                window.VizProgressColor.draw(p, manager, ai, progress);
                return;
            }

            if ((ai >= 4 && ai < 6)) {
                window.VizScatter.draw(p, manager, ai, progress);
                return;
            }

            if (ai === 7) {
                window.VizBar.draw(p, manager, ai, progress);
                return;
            }
        }
    };
})();
