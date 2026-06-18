(function () {
  var toggle = document.querySelector('[data-menu-toggle]');
  var menu = document.querySelector('[data-mobile-menu]');

  if (toggle && menu) {
    toggle.addEventListener('click', function () {
      menu.classList.toggle('is-open');
    });
  }

  var hero = document.querySelector('[data-hero]');
  if (hero) {
    var slides = Array.prototype.slice.call(hero.querySelectorAll('.hero-slide'));
    var dots = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-dot]'));
    var current = 0;

    function showHero(index) {
      current = (index + slides.length) % slides.length;
      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle('is-active', slideIndex === current);
      });
      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle('is-active', dotIndex === current);
      });
    }

    dots.forEach(function (dot, index) {
      dot.addEventListener('click', function () {
        showHero(index);
      });
    });

    if (slides.length > 0) {
      showHero(0);
      setInterval(function () {
        showHero(current + 1);
      }, 5000);
    }
  }

  document.querySelectorAll('[data-local-filter]').forEach(function (panel) {
    var keyword = panel.querySelector('[data-filter-keyword]');
    var year = panel.querySelector('[data-filter-year]');
    var cards = Array.prototype.slice.call(document.querySelectorAll('[data-card]'));
    var empty = document.querySelector('[data-empty-state]');

    function applyFilter() {
      var q = (keyword && keyword.value ? keyword.value : '').trim().toLowerCase();
      var selectedYear = year && year.value ? year.value : '';
      var visibleCount = 0;

      cards.forEach(function (card) {
        var title = card.getAttribute('data-title') || '';
        var cardYear = card.getAttribute('data-year') || '';
        var region = (card.getAttribute('data-region') || '').toLowerCase();
        var type = (card.getAttribute('data-type') || '').toLowerCase();
        var matchedKeyword = !q || title.indexOf(q) >= 0 || region.indexOf(q) >= 0 || type.indexOf(q) >= 0;
        var matchedYear = !selectedYear || cardYear === selectedYear;
        var visible = matchedKeyword && matchedYear;

        card.style.display = visible ? '' : 'none';
        if (visible) {
          visibleCount += 1;
        }
      });

      if (empty) {
        empty.classList.toggle('is-visible', visibleCount === 0);
      }
    }

    if (keyword) {
      keyword.addEventListener('input', applyFilter);
    }
    if (year) {
      year.addEventListener('change', applyFilter);
    }
  });

  document.querySelectorAll('.js-video-player').forEach(function (shell) {
    var button = shell.querySelector('.play-overlay');
    var video = shell.querySelector('video');
    var message = shell.querySelector('.player-message');
    var src = shell.getAttribute('data-src');
    var hlsInstance = null;
    var initialized = false;

    function setMessage(text) {
      if (message) {
        message.textContent = text || '';
      }
    }

    function attachSource() {
      if (!video || !src || initialized) {
        return;
      }
      initialized = true;
      video.crossOrigin = 'anonymous';

      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = src;
        setMessage('正在连接播放源');
        return;
      }

      if (window.Hls && window.Hls.isSupported()) {
        hlsInstance = new window.Hls({
          enableWorker: true,
          lowLatencyMode: false,
          backBufferLength: 90
        });
        hlsInstance.loadSource(src);
        hlsInstance.attachMedia(video);
        hlsInstance.on(window.Hls.Events.MANIFEST_PARSED, function () {
          setMessage('播放源已就绪');
        });
        hlsInstance.on(window.Hls.Events.ERROR, function (event, data) {
          if (data && data.fatal) {
            setMessage('播放源连接失败，请刷新页面后重试');
            if (hlsInstance) {
              hlsInstance.destroy();
              hlsInstance = null;
            }
            initialized = false;
          }
        });
        return;
      }

      video.src = src;
      setMessage('当前浏览器将尝试直接播放 m3u8 源');
    }

    function startVideo() {
      attachSource();
      var playPromise = video.play();
      shell.classList.add('is-playing');
      if (playPromise && typeof playPromise.catch === 'function') {
        playPromise.catch(function () {
          shell.classList.remove('is-playing');
          setMessage('浏览器阻止了自动播放，请再次点击播放按钮');
        });
      }
    }

    if (button && video) {
      button.addEventListener('click', startVideo);
      video.addEventListener('play', function () {
        shell.classList.add('is-playing');
      });
      video.addEventListener('pause', function () {
        shell.classList.remove('is-playing');
      });
    }
  });

  var searchPage = document.querySelector('[data-search-page]');
  if (searchPage && window.MOVIE_SEARCH_DATA) {
    var input = searchPage.querySelector('[data-search-input]');
    var category = searchPage.querySelector('[data-search-category]');
    var year = searchPage.querySelector('[data-search-year]');
    var clear = searchPage.querySelector('[data-search-clear]');
    var results = document.querySelector('[data-search-results]');
    var title = document.querySelector('[data-search-title]');
    var params = new URLSearchParams(window.location.search);

    function cardHtml(movie) {
      var tags = movie.tags.slice(0, 3).map(function (tag) {
        return '<span>' + escapeHtml(tag) + '</span>';
      }).join('');
      return '' +
        '<article class="movie-card" data-card>' +
          '<a class="poster-link" href="' + escapeAttr(movie.url) + '" aria-label="观看' + escapeAttr(movie.title) + '">' +
            '<img src="' + escapeAttr(movie.cover) + '" alt="' + escapeAttr(movie.title) + '" loading="lazy" onerror="this.classList.add(\'poster-missing\')">' +
            '<span class="poster-fallback">' + escapeHtml(movie.title) + '</span>' +
            '<span class="movie-badge">' + escapeHtml(String(movie.year)) + '</span>' +
            '<span class="play-mini">▶</span>' +
          '</a>' +
          '<div class="movie-card-body">' +
            '<div class="movie-meta"><span>' + escapeHtml(movie.region) + '</span><span>' + escapeHtml(movie.type) + '</span><span>' + escapeHtml(movie.rating) + '分</span></div>' +
            '<h3><a href="' + escapeAttr(movie.url) + '">' + escapeHtml(movie.title) + '</a></h3>' +
            '<p>' + escapeHtml(movie.oneLine) + '</p>' +
            '<div class="tag-row">' + tags + '</div>' +
          '</div>' +
        '</article>';
    }

    function escapeHtml(value) {
      return String(value || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    }

    function escapeAttr(value) {
      return escapeHtml(value);
    }

    function runSearch() {
      var q = (input.value || '').trim().toLowerCase();
      var selectedCategory = category.value || '';
      var selectedYear = year.value || '';
      var matched = window.MOVIE_SEARCH_DATA.filter(function (movie) {
        var text = [movie.title, movie.region, movie.type, movie.genre, movie.oneLine].concat(movie.tags).join(' ').toLowerCase();
        var okKeyword = !q || text.indexOf(q) >= 0;
        var okCategory = !selectedCategory || movie.category === selectedCategory;
        var okYear = !selectedYear || String(movie.year) === selectedYear;
        return okKeyword && okCategory && okYear;
      }).slice(0, 96);

      results.innerHTML = matched.length ? matched.map(cardHtml).join('') : '<p class="empty-state is-visible">未找到符合条件的影片</p>';
      title.textContent = q || selectedCategory || selectedYear ? '搜索结果' : '推荐内容';
    }

    if (params.get('q')) {
      input.value = params.get('q');
    }

    input.addEventListener('input', runSearch);
    category.addEventListener('change', runSearch);
    year.addEventListener('change', runSearch);
    clear.addEventListener('click', function () {
      input.value = '';
      category.value = '';
      year.value = '';
      runSearch();
    });
    runSearch();
  }
})();
