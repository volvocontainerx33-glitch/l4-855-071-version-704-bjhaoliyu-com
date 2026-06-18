(function () {
  function initMobileMenu() {
    var button = document.querySelector('[data-menu-button]');
    var nav = document.querySelector('[data-mobile-nav]');
    if (!button || !nav) {
      return;
    }
    button.addEventListener('click', function () {
      nav.classList.toggle('is-open');
    });
  }

  function initHero() {
    var hero = document.querySelector('[data-hero]');
    if (!hero) {
      return;
    }
    var slides = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-slide]'));
    var dots = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-dot]'));
    var previous = hero.querySelector('[data-hero-prev]');
    var next = hero.querySelector('[data-hero-next]');
    var index = 0;
    var timer = null;

    function show(nextIndex) {
      if (!slides.length) {
        return;
      }
      index = (nextIndex + slides.length) % slides.length;
      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle('is-active', slideIndex === index);
      });
      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle('is-active', dotIndex === index);
      });
    }

    function autoplay() {
      clearInterval(timer);
      timer = setInterval(function () {
        show(index + 1);
      }, 5000);
    }

    if (previous) {
      previous.addEventListener('click', function () {
        show(index - 1);
        autoplay();
      });
    }

    if (next) {
      next.addEventListener('click', function () {
        show(index + 1);
        autoplay();
      });
    }

    dots.forEach(function (dot, dotIndex) {
      dot.addEventListener('click', function () {
        show(dotIndex);
        autoplay();
      });
    });

    show(0);
    autoplay();
  }

  function initStaticFilters() {
    var searchInput = document.querySelector('[data-filter-search]');
    var yearSelect = document.querySelector('[data-filter-year]');
    var regionSelect = document.querySelector('[data-filter-region]');
    var count = document.querySelector('[data-filter-count]');
    var cards = Array.prototype.slice.call(document.querySelectorAll('[data-movie-card]'));
    var empty = document.querySelector('[data-empty-state]');

    if (!cards.length || (!searchInput && !yearSelect && !regionSelect)) {
      return;
    }

    function apply() {
      var query = searchInput ? searchInput.value.trim().toLowerCase() : '';
      var year = yearSelect ? yearSelect.value : '';
      var region = regionSelect ? regionSelect.value : '';
      var visible = 0;

      cards.forEach(function (card) {
        var text = [
          card.getAttribute('data-title'),
          card.getAttribute('data-year'),
          card.getAttribute('data-region'),
          card.getAttribute('data-genre')
        ].join(' ').toLowerCase();
        var matchesQuery = !query || text.indexOf(query) !== -1;
        var matchesYear = !year || card.getAttribute('data-year') === year;
        var matchesRegion = !region || card.getAttribute('data-region') === region;
        var show = matchesQuery && matchesYear && matchesRegion;
        card.classList.toggle('hidden-by-filter', !show);
        if (show) {
          visible += 1;
        }
      });

      if (count) {
        count.textContent = '共 ' + visible + ' 部';
      }
      if (empty) {
        empty.classList.toggle('is-visible', visible === 0);
      }
    }

    [searchInput, yearSelect, regionSelect].forEach(function (control) {
      if (control) {
        control.addEventListener('input', apply);
        control.addEventListener('change', apply);
      }
    });

    apply();
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function initSearchPage() {
    var form = document.querySelector('[data-search-page]');
    var results = document.querySelector('[data-search-results]');
    var count = document.querySelector('[data-search-count]');
    if (!form || !results || !window.SEARCH_MOVIES) {
      return;
    }

    var input = form.querySelector('[data-search-input]');
    var year = form.querySelector('[data-search-year]');
    var region = form.querySelector('[data-search-region]');
    var type = form.querySelector('[data-search-type]');

    function card(movie) {
      return [
        '<article class="movie-card">',
        '  <a href="./' + escapeHtml(movie.file) + '" aria-label="' + escapeHtml(movie.title) + '">',
        '    <div class="poster-wrap">',
        '      <img src="' + escapeHtml(movie.cover) + '" alt="' + escapeHtml(movie.title) + '" loading="lazy">',
        '    </div>',
        '    <div class="card-body">',
        '      <div class="meta-line"><span>' + escapeHtml(movie.region) + '</span><span>' + escapeHtml(movie.year) + '</span></div>',
        '      <h3>' + escapeHtml(movie.title) + '</h3>',
        '      <p>' + escapeHtml(movie.one_line) + '</p>',
        '      <div class="meta-line muted"><span>' + escapeHtml(movie.genre) + '</span><span>★ ' + escapeHtml(movie.rating) + '</span></div>',
        '    </div>',
        '  </a>',
        '</article>'
      ].join('');
    }

    function render() {
      var query = input.value.trim().toLowerCase();
      var yearValue = year.value;
      var regionValue = region.value;
      var typeValue = type.value;
      var matches = window.SEARCH_MOVIES.filter(function (movie) {
        var text = [movie.title, movie.region, movie.type, movie.year, movie.genre, movie.tags, movie.one_line].join(' ').toLowerCase();
        return (!query || text.indexOf(query) !== -1) &&
          (!yearValue || String(movie.year) === yearValue) &&
          (!regionValue || String(movie.region) === regionValue) &&
          (!typeValue || String(movie.type) === typeValue);
      });
      count.textContent = '共 ' + matches.length + ' 部';
      results.innerHTML = matches.slice(0, 240).map(card).join('');
      if (matches.length > 240) {
        results.insertAdjacentHTML('beforeend', '<div class="content-card"><strong>已显示前 240 条结果，请继续输入关键词缩小范围。</strong></div>');
      }
      if (!matches.length) {
        results.innerHTML = '<div class="empty-state is-visible">没有找到匹配影片</div>';
      }
    }

    [input, year, region, type].forEach(function (control) {
      control.addEventListener('input', render);
      control.addEventListener('change', render);
    });

    render();
  }

  window.initMoviePlayer = function (source) {
    var video = document.querySelector('[data-movie-video]');
    var overlay = document.querySelector('[data-player-overlay]');
    var started = false;
    var hlsInstance = null;

    if (!video || !source) {
      return;
    }

    function playVideo() {
      var playPromise = video.play();
      if (playPromise && typeof playPromise.catch === 'function') {
        playPromise.catch(function () {});
      }
    }

    function start() {
      if (overlay) {
        overlay.classList.add('is-hidden');
      }
      if (started) {
        playVideo();
        return;
      }
      started = true;

      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = source;
        video.addEventListener('loadedmetadata', playVideo, { once: true });
        playVideo();
        return;
      }

      if (window.Hls && window.Hls.isSupported()) {
        hlsInstance = new window.Hls({ enableWorker: true });
        hlsInstance.loadSource(source);
        hlsInstance.attachMedia(video);
        hlsInstance.on(window.Hls.Events.MANIFEST_PARSED, playVideo);
        return;
      }

      video.src = source;
      playVideo();
    }

    if (overlay) {
      overlay.addEventListener('click', start);
    }

    video.addEventListener('click', function () {
      if (!started) {
        start();
      }
    });

    window.addEventListener('beforeunload', function () {
      if (hlsInstance) {
        hlsInstance.destroy();
      }
    });
  };

  document.addEventListener('DOMContentLoaded', function () {
    initMobileMenu();
    initHero();
    initStaticFilters();
    initSearchPage();
  });
})();
