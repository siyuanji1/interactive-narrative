// sections.js
// Orchestrator: loads data, starts the p5 sketch, and wires scroll -> visual state

(function () {
    function displayData() {

        // Configuration: defaults, then window.ScrollDemoConfig, then data-attributes on the container
        var defaults = {
            containerSelector: '#graphic',
            stepSelector: '.step',
            visSelector: '#vis',
            showAt: 0,
            // trigger: where on the viewport a step becomes "active".
            // 'center' => when the step reaches the vertical center of the viewport
            // 'top' => when the step reaches the top (small offset)
            trigger: 'top',
            visHiddenClass: 'vis-hidden',
            visVisibleClass: 'vis-visible'
        };

        var cfg = Object.assign({}, defaults, window.ScrollDemoConfig || {});
        // allow data- attributes on container to override
        try {
            var containerEl = document.querySelector(cfg.containerSelector);
            if (containerEl && containerEl.dataset) {
                if (containerEl.dataset.showAt) cfg.showAt = parseInt(containerEl.dataset.showAt, 10) || cfg.showAt;
                if (containerEl.dataset.trigger) cfg.trigger = containerEl.dataset.trigger;
                if (containerEl.dataset.stepSelector) cfg.stepSelector = containerEl.dataset.stepSelector;
                if (containerEl.dataset.visSelector) cfg.visSelector = containerEl.dataset.visSelector;
                if (containerEl.dataset.visHiddenClass) cfg.visHiddenClass = containerEl.dataset.visHiddenClass;
                if (containerEl.dataset.visVisibleClass) cfg.visVisibleClass = containerEl.dataset.visVisibleClass;
            }
        } catch (e) { /* ignore */ }

        // Ensure the vis element starts hidden according to configured class
        // If showAt is 0 we want the visual visible immediately, so only
        // add the hidden class when showAt > 0.
        try {
            var visStartEl = document.querySelector(cfg.visSelector);
            if (visStartEl && (cfg.showAt || 0) > 0) {
                visStartEl.classList.add(cfg.visHiddenClass);
            }
        } catch (e) { }

        // Start p5 sketch with retries if startP5 isn't defined yet.
        (function callStartP5WithRetry(attempts) {
            attempts = typeof attempts === 'number' ? attempts : 3;
            if (typeof startP5 === 'function') {
                try {
                    console.log('sections: calling startP5 (attempts left)', attempts);
                    var api = startP5();

                    // If the returned API exposes a `ready` promise, wait for it
                    // to resolve before exposing the API globally. This ensures
                    // consumers of `window.__sketchAPI` see the populated data.
                    if (api && api.ready && typeof api.ready.then === 'function') {
                        api.ready.then(function () {
                            try {
                                if (api && api.setState) window.__sketchAPI = api;
                                window.__sections_startCalled = true;
                                console.log('sections: startP5 ready and api exposed');
                            } catch (e) {
                                console.error('sections: error exposing api after ready', e);
                            }
                        }).catch(function (err) {
                            console.error('sections: startP5 ready promise rejected', err);
                            if (api && api.setState) window.__sketchAPI = api;
                        });
                    } else {
                        if (api && api.setState) {
                            window.__sketchAPI = api;
                        }
                        window.__sections_startCalled = true;
                        console.log('sections: startP5 invoked successfully');
                    }

                    // Create scroller and wire up events (using configured selectors)
                    var ScrollerCtor = window.Scroller;
                    if (!ScrollerCtor) {
                        console.error('sections: Scroller not available');
                        return;
                    }
                    var sc = new ScrollerCtor(cfg.containerSelector, cfg.stepSelector, cfg.trigger);
                    window.__scroller = sc;
                    console.log('sections: scroller created, steps=', sc.steps.length);

                    // create VisualController to show/hide #vis when appropriate
                    var VisualControllerCtor = window.VisualController;
                    var visualController = null;
                    if (VisualControllerCtor) {
                        visualController = new VisualControllerCtor({ visSelector: cfg.visSelector, showAt: cfg.showAt });
                    }

                    function pinActiveInner(index) {
                        var sectionsEl = document.querySelector('#sections');
                        var r = sectionsEl ? sectionsEl.getBoundingClientRect() : null;
                        document.querySelectorAll('.step').forEach(function (el, i) {
                            var inner = el.querySelector('.step-inner');
                            if (!inner) return;
                            if (i === index && r) {
                                inner.classList.add('is-fixed');
                                inner.style.left      = r.left + 'px';
                                inner.style.width     = r.width + 'px';
                                inner.style.top       = '50%';
                                inner.style.transform = 'translateY(-50%)';
                            } else {
                                inner.classList.remove('is-fixed');
                                inner.style.left      = '';
                                inner.style.width     = '';
                                inner.style.top       = '';
                                inner.style.transform = '';
                            }
                        });
                    }

                    window.addEventListener('resize', function () {
                        if (sc.currentIndex !== undefined && sc.currentIndex >= 0) {
                            pinActiveInner(sc.currentIndex);
                        }
                    });

                    sc.on('active', function (index) {
                        // highlight active step, gently dim others (NYT-style)
                        document.querySelectorAll('.step').forEach(function (el, i) {
                            el.style.opacity = (i === index) ? '1' : '0';
                        });
                        pinActiveInner(index);

                        // apply layout class from data-layout attribute
                        var graphic = document.querySelector('#graphic');
                        if (graphic) {
                            graphic.classList.remove('layout-full-text', 'layout-full-viz');
                            var layout = sc.steps[index] && sc.steps[index].dataset && sc.steps[index].dataset.layout;
                            if (layout) graphic.classList.add('layout-' + layout);
                            requestAnimationFrame(function () {
                                if (window.__sketchAPI && window.__sketchAPI.p5 &&
                                    typeof window.__sketchAPI.p5.windowResized === 'function') {
                                    window.__sketchAPI.p5.windowResized();
                                }
                            });
                        }

                        // Determine if the active step defines a custom active-index
                        var mappedIndex = index;
                        try {
                            var stepEl = (sc.steps && sc.steps[index]) ? sc.steps[index] : document.querySelectorAll(cfg.stepSelector)[index];
                            if (stepEl && stepEl.dataset && stepEl.dataset.activeIndex !== undefined) {
                                var parsed = parseInt(stepEl.dataset.activeIndex, 10);
                                if (!isNaN(parsed)) mappedIndex = parsed;
                            }
                        } catch (e) { /* ignore and fall back to raw index */ }

                        // update sketch state via returned API if available (use mappedIndex)
                        if (window.__sketchAPI && window.__sketchAPI.setState) {
                            window.__sketchAPI.setState({ activeIndex: mappedIndex });
                        }

                        // let visual controller decide whether to show/hide (give it the mapped index)
                        if (visualController) visualController.handleActive(mappedIndex);
                    });

                    var _autoAdvanced = false;
                    var _autoLock = false;
                    var _autoAdvanced21 = false;
                    var _autoLock21 = false;
                    var _autoAdvanced2 = false;
                    var _autoLock2 = false;
                    var _autoAdvanced3 = false;
                    var _autoLock3 = false;
                    var _autoAdvanced5 = false;
                    var _autoLock5 = false;
                    sc.on('progress', function (index, progress) {
                        // Map index to any per-section activeIndex so the sketch receives
                        // a consistent activeIndex value during progress updates.
                        var mappedIndex = index;
                        try {
                            var stepEl = (sc.steps && sc.steps[index]) ? sc.steps[index] : document.querySelectorAll(cfg.stepSelector)[index];
                            if (stepEl && stepEl.dataset && stepEl.dataset.activeIndex !== undefined) {
                                var parsed = parseInt(stepEl.dataset.activeIndex, 10);
                                if (!isNaN(parsed)) mappedIndex = parsed;
                            }
                        } catch (e) { /* ignore */ }

                        // Auto-advance from section 0 at 60% progress.
                        // Only reset the flag when user scrolls back to near the top of section 0,
                        // so the smooth-scroll animation doesn't re-trigger it.
                        if (mappedIndex === 0) {
                            if (progress < 0.05) _autoAdvanced = false;
                            if (progress >= 0.60 && !_autoAdvanced && !_autoLock) {
                                _autoAdvanced = true;
                                _autoLock = true;
                                var nextStep = sc.steps && sc.steps[1];
                                if (nextStep) nextStep.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                setTimeout(function () { _autoLock = false; }, 1000);
                            }
                        }

                        // Auto-advance from section 21 at 60% progress
                        if (mappedIndex === 21) {
                            if (progress < 0.05) _autoAdvanced21 = false;
                            if (progress >= 0.60 && !_autoAdvanced21 && !_autoLock21) {
                                _autoAdvanced21 = true;
                                _autoLock21 = true;
                                var steps21 = sc.steps || [];
                                for (var si = 0; si < steps21.length; si++) {
                                    if (steps21[si].dataset && parseInt(steps21[si].dataset.activeIndex, 10) === 21) {
                                        var ns21 = steps21[si + 1];
                                        if (ns21) ns21.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                        break;
                                    }
                                }
                                setTimeout(function () { _autoLock21 = false; }, 1000);
                            }
                        }

                        // Auto-advance from section 2 at 50% progress
                        if (mappedIndex === 2) {
                            if (progress < 0.05) _autoAdvanced2 = false;
                            if (progress >= 0.35 && !_autoAdvanced2 && !_autoLock2) {
                                _autoAdvanced2 = true;
                                _autoLock2 = true;
                                var steps2 = sc.steps || [];
                                for (var si2 = 0; si2 < steps2.length; si2++) {
                                    if (steps2[si2].dataset && parseInt(steps2[si2].dataset.activeIndex, 10) === 2) {
                                        var ns2 = steps2[si2 + 1];
                                        if (ns2) ns2.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                        break;
                                    }
                                }
                                setTimeout(function () { _autoLock2 = false; }, 1000);
                            }
                        }

                        // Auto-advance from section 3 at 40% progress
                        if (mappedIndex === 3) {
                            if (progress < 0.05) _autoAdvanced3 = false;
                            if (progress >= 0.40 && !_autoAdvanced3 && !_autoLock3) {
                                _autoAdvanced3 = true;
                                _autoLock3 = true;
                                var steps3 = sc.steps || [];
                                for (var si3 = 0; si3 < steps3.length; si3++) {
                                    if (steps3[si3].dataset && parseInt(steps3[si3].dataset.activeIndex, 10) === 3) {
                                        var ns3 = steps3[si3 + 1];
                                        if (ns3) ns3.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                        break;
                                    }
                                }
                                setTimeout(function () { _autoLock3 = false; }, 1000);
                            }
                        }

                        // Auto-advance from section 5 at 40% progress
                        if (mappedIndex === 5) {
                            if (progress < 0.05) _autoAdvanced5 = false;
                            if (progress >= 0.40 && !_autoAdvanced5 && !_autoLock5) {
                                _autoAdvanced5 = true;
                                _autoLock5 = true;
                                var steps5 = sc.steps || [];
                                for (var si5 = 0; si5 < steps5.length; si5++) {
                                    if (steps5[si5].dataset && parseInt(steps5[si5].dataset.activeIndex, 10) === 5) {
                                        var ns5 = steps5[si5 + 1];
                                        if (ns5) ns5.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                        break;
                                    }
                                }
                                setTimeout(function () { _autoLock5 = false; }, 1000);
                            }
                        }

                        if (window.__sketchAPI && window.__sketchAPI.setState) {
                            window.__sketchAPI.setState({ progress: progress, activeIndex: mappedIndex });
                        }
                        if (visualController) visualController.handleProgress(mappedIndex, progress);
                    });

                } catch (err) {
                    console.error('sections: startP5 threw an error', err);
                }
            } else if (attempts > 0) {
                console.warn('sections: startP5 not ready, retrying in 200ms (attempts left)', attempts);
                setTimeout(function () { callStartP5WithRetry(attempts - 1); }, 200);
            } else {
                console.error('sections: startP5 not available after retries — p5 visual will not start');
            }
        })(3);
    }

    // run on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', displayData);
    } else {
        displayData();
    }
})();
