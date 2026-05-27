// sketch_renderer.js
// Loads survey data and routes activeIndex to the correct visualization.
(function () {
    window.Renderer = {

        setData: function (manager) {
            manager.offsetX = (manager.margin && manager.margin.left) || 20;
            manager.offsetY = (manager.margin && manager.margin.top) || 0;
            manager.data = [];

            return DataLoader.loadJSON('data/survey_data.json').then(function (d) {
                manager._surveyData = d;
                // Reset cached state so re-inits pick up fresh canvas sizes
                if (window.VizGlobe)      window.VizGlobe._bubbles    = null;
                if (window.VizFieldSort)  window.VizFieldSort._particles = null;
            }).catch(function (err) {
                console.error('Failed to load survey_data.json', err);
            });
        },

        draw: function (p, manager, ai, progress) {
            switch (ai) {
                case 0:  // Title card
                    window.VizTitle      && window.VizTitle.draw(p, manager, ai, progress);
                    break;
                case 1:  // Global reach bubble chart
                    window.VizGlobe      && window.VizGlobe.draw(p, manager, ai, progress);
                    break;
                case 2:  // Demographics donuts
                    window.VizDemographics && window.VizDemographics.draw(p, manager, ai, progress);
                    break;
                case 3:  // Adoption gauge + usage extent bars
                    window.VizUsage      && window.VizUsage.draw(p, manager, ai, progress);
                    break;
                case 4:  // NYT-style field sort (scroll-animated)
                    window.VizFieldSort  && window.VizFieldSort.draw(p, manager, ai, progress);
                    break;
                case 5:  // Task usage (Q18)
                    window.VizTasks      && window.VizTasks.draw(p, manager, ai, progress);
                    break;
                case 6:  // Ethical concerns (Q22)
                case 7:  // Learning outcomes (Q26)
                case 8:  // Satisfaction (Q24)
                    window.VizAttitudes  && window.VizAttitudes.draw(p, manager, ai, progress);
                    break;
                case 9:  // Labor market (Q30)
                    window.VizLabor      && window.VizLabor.draw(p, manager, ai, progress);
                    break;
                case 10: // Emotions radar (Q32)
                    window.VizEmotions   && window.VizEmotions.draw(p, manager, ai, progress);
                    break;
                default:
                    window.VizTitle      && window.VizTitle.draw(p, manager, ai, progress);
            }
        }
    };
})();
