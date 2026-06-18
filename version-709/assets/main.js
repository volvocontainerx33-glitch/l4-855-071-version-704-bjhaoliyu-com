(function () {
    function $(selector, root) {
        return (root || document).querySelector(selector);
    }

    function $all(selector, root) {
        return Array.prototype.slice.call((root || document).querySelectorAll(selector));
    }

    function text(value) {
        return (value || '').toString().toLowerCase();
    }

    var menuButton = $('[data-menu-toggle]');
    var mobilePanel = $('[data-mobile-panel]');
    if (menuButton && mobilePanel) {
        menuButton.addEventListener('click', function () {
            mobilePanel.classList.toggle('open');
        });
    }

    var backTop = $('[data-back-top]');
    if (backTop) {
        window.addEventListener('scroll', function () {
            if (window.scrollY > 320) {
                backTop.classList.add('show');
            } else {
                backTop.classList.remove('show');
            }
        });
        backTop.addEventListener('click', function () {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    var hero = $('[data-hero]');
    if (hero) {
        var slides = $all('[data-hero-slide]', hero);
        var dots = $all('[data-hero-dot]', hero);
        var prev = $('[data-hero-prev]', hero);
        var next = $('[data-hero-next]', hero);
        var index = 0;
        var timer = null;

        function show(target) {
            if (!slides.length) {
                return;
            }
            index = (target + slides.length) % slides.length;
            slides.forEach(function (slide, i) {
                slide.classList.toggle('active', i === index);
            });
            dots.forEach(function (dot, i) {
                dot.classList.toggle('active', i === index);
            });
        }

        function start() {
            stop();
            timer = window.setInterval(function () {
                show(index + 1);
            }, 5200);
        }

        function stop() {
            if (timer) {
                window.clearInterval(timer);
                timer = null;
            }
        }

        if (prev) {
            prev.addEventListener('click', function () {
                show(index - 1);
                start();
            });
        }
        if (next) {
            next.addEventListener('click', function () {
                show(index + 1);
                start();
            });
        }
        dots.forEach(function (dot) {
            dot.addEventListener('click', function () {
                show(Number(dot.getAttribute('data-hero-dot')) || 0);
                start();
            });
        });
        hero.addEventListener('mouseenter', stop);
        hero.addEventListener('mouseleave', start);
        show(0);
        start();
    }

    var cardInput = $('[data-card-filter]');
    var chipWrap = $('[data-filter-chips]');
    if (cardInput || chipWrap) {
        var activeChip = '';
        var cards = $all('[data-filter-card]');

        function applyCardFilter() {
            var q = text(cardInput ? cardInput.value : '');
            var c = text(activeChip);
            cards.forEach(function (card) {
                var haystack = text([
                    card.getAttribute('data-title'),
                    card.getAttribute('data-region'),
                    card.getAttribute('data-type'),
                    card.getAttribute('data-year'),
                    card.getAttribute('data-tags')
                ].join(' '));
                var ok = (!q || haystack.indexOf(q) !== -1) && (!c || haystack.indexOf(c) !== -1);
                card.classList.toggle('hidden-by-filter', !ok);
            });
        }

        if (cardInput) {
            cardInput.addEventListener('input', applyCardFilter);
        }
        if (chipWrap) {
            $all('[data-filter-value]', chipWrap).forEach(function (button, i) {
                if (i === 0) {
                    button.classList.add('active');
                }
                button.addEventListener('click', function () {
                    $all('[data-filter-value]', chipWrap).forEach(function (item) {
                        item.classList.remove('active');
                    });
                    button.classList.add('active');
                    activeChip = button.getAttribute('data-filter-value') || '';
                    applyCardFilter();
                });
            });
        }
    }

    var globalInput = $('[data-global-search]');
    var globalSubmit = $('[data-global-submit]');
    var globalResults = $('[data-search-results]');
    if (globalInput && globalResults && typeof siteMovies !== 'undefined') {
        var params = new URLSearchParams(window.location.search);
        var initial = params.get('q') || '';
        globalInput.value = initial;

        function escapeHtml(value) {
            return (value || '').toString()
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#39;');
        }

        function renderSearch(query) {
            var q = text(query);
            var rows = siteMovies.filter(function (item) {
                var haystack = text([item.title, item.region, item.type, item.year, item.genre, item.tags, item.oneLine].join(' '));
                return !q || haystack.indexOf(q) !== -1;
            }).slice(0, 120);

            if (!rows.length) {
                globalResults.innerHTML = '<div class="search-empty">没有找到匹配内容</div>';
                return;
            }

            globalResults.innerHTML = rows.map(function (item) {
                return '<article class="movie-card compact-card">' +
                    '<a class="card-link" href="' + escapeHtml(item.url) + '">' +
                    '<div class="card-cover">' +
                    '<img src="' + escapeHtml(item.cover) + '" alt="' + escapeHtml(item.title) + '" loading="lazy">' +
                    '<span class="card-year">' + escapeHtml(item.year) + '</span>' +
                    '<span class="card-play">▶</span>' +
                    '</div>' +
                    '<div class="card-body">' +
                    '<h2>' + escapeHtml(item.title) + '</h2>' +
                    '<p>' + escapeHtml(item.oneLine) + '</p>' +
                    '<div class="card-meta"><span>' + escapeHtml(item.region) + '</span><span>' + escapeHtml(item.type) + '</span></div>' +
                    '</div>' +
                    '</a>' +
                    '</article>';
            }).join('');
        }

        function performSearch() {
            renderSearch(globalInput.value);
        }

        globalInput.addEventListener('input', performSearch);
        if (globalSubmit) {
            globalSubmit.addEventListener('click', performSearch);
        }
        $all('[data-global-chip]').forEach(function (button) {
            button.addEventListener('click', function () {
                $all('[data-global-chip]').forEach(function (item) {
                    item.classList.remove('active');
                });
                button.classList.add('active');
                globalInput.value = button.getAttribute('data-global-chip') || '';
                performSearch();
            });
        });
        renderSearch(initial);
    }

    var video = $('[data-video-player]');
    if (video) {
        var playButton = $('[data-play-button]');
        var playerMessage = $('[data-player-message]');
        var streamUrl = video.getAttribute('data-stream');
        var prepared = false;
        var hlsInstance = null;

        function setMessage(message) {
            if (playerMessage) {
                playerMessage.textContent = message || '';
            }
        }

        function prepareVideo() {
            if (prepared || !streamUrl) {
                return;
            }
            prepared = true;
            if (video.canPlayType('application/vnd.apple.mpegurl')) {
                video.src = streamUrl;
            } else if (window.Hls && window.Hls.isSupported()) {
                hlsInstance = new window.Hls({ enableWorker: true, lowLatencyMode: false });
                hlsInstance.loadSource(streamUrl);
                hlsInstance.attachMedia(video);
                hlsInstance.on(window.Hls.Events.ERROR, function (event, data) {
                    if (data && data.fatal) {
                        setMessage('播放加载失败，请稍后再试');
                    }
                });
            } else {
                video.src = streamUrl;
            }
        }

        function playVideo() {
            prepareVideo();
            if (playButton) {
                playButton.classList.add('is-hidden');
            }
            var action = video.play();
            if (action && action.catch) {
                action.catch(function () {
                    setMessage('点击视频控件开始播放');
                });
            }
        }

        if (playButton) {
            playButton.addEventListener('click', playVideo);
        }
        video.addEventListener('play', function () {
            if (playButton) {
                playButton.classList.add('is-hidden');
            }
            setMessage('');
        });
        video.addEventListener('click', function () {
            if (video.paused) {
                playVideo();
            }
        });
        video.addEventListener('error', function () {
            setMessage('播放加载失败，请稍后再试');
        });
        window.addEventListener('beforeunload', function () {
            if (hlsInstance) {
                hlsInstance.destroy();
            }
        });
    }
})();
