(function () {
  function qs(selector, context) {
    return (context || document).querySelector(selector);
  }

  function qsa(selector, context) {
    return Array.prototype.slice.call((context || document).querySelectorAll(selector));
  }

  function initMobileMenu() {
    var button = qs('.mobile-menu-button');
    var nav = qs('.main-nav');
    if (!button || !nav) {
      return;
    }

    button.addEventListener('click', function () {
      var isOpen = nav.classList.toggle('open');
      button.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });
  }

  function initImageFallback() {
    qsa('img').forEach(function (image) {
      image.addEventListener('error', function () {
        var poster = image.closest('.poster-shell');
        var slide = image.closest('.hero-slide');
        image.style.opacity = '0';
        if (poster) {
          poster.classList.add('has-missing-image');
        }
        if (slide) {
          slide.classList.add('image-missing');
        }
      });
    });
  }

  function initCarousel() {
    var carousel = qs('[data-carousel]');
    if (!carousel) {
      return;
    }

    var slides = qsa('.hero-slide', carousel);
    var dots = qsa('[data-go-slide]', carousel);
    var prev = qs('[data-carousel-prev]', carousel);
    var next = qs('[data-carousel-next]', carousel);
    var index = 0;
    var timer = null;

    function show(nextIndex) {
      if (!slides.length) {
        return;
      }
      index = (nextIndex + slides.length) % slides.length;
      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle('active', slideIndex === index);
      });
      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle('active', dotIndex === index);
      });
    }

    function restart() {
      window.clearInterval(timer);
      timer = window.setInterval(function () {
        show(index + 1);
      }, 5000);
    }

    if (prev) {
      prev.addEventListener('click', function () {
        show(index - 1);
        restart();
      });
    }

    if (next) {
      next.addEventListener('click', function () {
        show(index + 1);
        restart();
      });
    }

    dots.forEach(function (dot) {
      dot.addEventListener('click', function () {
        show(Number(dot.getAttribute('data-go-slide') || 0));
        restart();
      });
    });

    show(0);
    restart();
  }

  function initPageFilters() {
    qsa('.page-filter-input, .page-filter-select').forEach(function (control) {
      control.addEventListener('input', applyPageFilters);
      control.addEventListener('change', applyPageFilters);
    });
  }

  function applyPageFilters() {
    var targetSelector = this.getAttribute('data-filter-target');
    var grid = qs(targetSelector);
    if (!grid) {
      return;
    }

    var controls = qsa('[data-filter-target="' + targetSelector + '"]');
    var cards = qsa('.movie-card', grid);

    cards.forEach(function (card) {
      var visible = true;

      controls.forEach(function (control) {
        var value = (control.value || '').trim().toLowerCase();
        if (!value) {
          return;
        }

        if (control.classList.contains('page-filter-input')) {
          var blob = (card.getAttribute('data-search') || '').toLowerCase();
          visible = visible && blob.indexOf(value) !== -1;
          return;
        }

        var field = control.getAttribute('data-filter-field');
        var fieldValue = (card.getAttribute('data-' + field) || '').toLowerCase();
        visible = visible && fieldValue.indexOf(value) !== -1;
      });

      card.classList.toggle('is-hidden-by-filter', !visible);
    });
  }

  function initGlobalSearch() {
    var input = qs('#global-search-input');
    var resultBox = qs('#search-results');
    var summary = qs('#search-summary');
    if (!input || !resultBox || !summary || !window.MOVIE_INDEX) {
      return;
    }

    var params = new URLSearchParams(window.location.search);
    var q = params.get('q') || '';
    if (q) {
      input.value = q;
    }

    var region = qs('#global-region-filter');
    var type = qs('#global-type-filter');
    var button = qs('#global-search-button');

    function cardTemplate(movie) {
      var safeTitle = escapeHtml(movie.title || '');
      var safeLine = escapeHtml(movie.oneLine || '');
      var safeRegion = escapeHtml(movie.region || '');
      var safeYear = escapeHtml(movie.year || '');
      var safeType = escapeHtml(movie.type || '');
      var safeGenre = escapeHtml(movie.genre || '');
      var safeRating = escapeHtml(movie.rating || '');
      var safeViews = escapeHtml(movie.views || '');

      return [
        '<article class="movie-card">',
        '  <a class="poster-shell" href="' + movie.url + '" aria-label="观看' + safeTitle + '">',
        '    <img src="' + movie.cover + '" alt="' + safeTitle + '" loading="lazy">',
        '    <span class="poster-badge">' + safeRating + '</span>',
        '    <span class="poster-play">▶</span>',
        '  </a>',
        '  <div class="movie-card-body">',
        '    <div class="movie-meta-line"><span>' + safeRegion + '</span><span>' + safeYear + '</span></div>',
        '    <h3><a href="' + movie.url + '">' + safeTitle + '</a></h3>',
        '    <p>' + safeLine + '</p>',
        '    <div class="card-tags"><span>' + safeType + '</span><span>' + safeGenre.split(/[，,\/、]/)[0] + '</span></div>',
        '    <div class="card-foot"><span>详情播放</span><span>' + safeViews + '热度</span></div>',
        '  </div>',
        '</article>'
      ].join('');
    }

    function runSearch() {
      var keyword = (input.value || '').trim().toLowerCase();
      var regionValue = (region && region.value || '').trim().toLowerCase();
      var typeValue = (type && type.value || '').trim().toLowerCase();

      var results = window.MOVIE_INDEX.filter(function (movie) {
        var blob = [
          movie.title,
          movie.region,
          movie.type,
          movie.year,
          movie.genre,
          movie.tags,
          movie.oneLine
        ].join(' ').toLowerCase();
        var matchedKeyword = keyword ? blob.indexOf(keyword) !== -1 : true;
        var matchedRegion = regionValue ? String(movie.region || '').toLowerCase().indexOf(regionValue) !== -1 : true;
        var matchedType = typeValue ? String(movie.type || '').toLowerCase().indexOf(typeValue) !== -1 : true;
        return matchedKeyword && matchedRegion && matchedType;
      }).slice(0, 96);

      if (!keyword && !regionValue && !typeValue) {
        resultBox.innerHTML = '';
        summary.textContent = '请输入关键词或使用筛选条件。';
        return;
      }

      summary.textContent = '共匹配 ' + results.length + ' 条结果，最多展示 96 条。';
      resultBox.innerHTML = results.map(cardTemplate).join('');
      initImageFallback();
    }

    function escapeHtml(value) {
      return String(value).replace(/[&<>"]/g, function (character) {
        return {
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;'
        }[character];
      });
    }

    [input, region, type].forEach(function (control) {
      if (!control) {
        return;
      }
      control.addEventListener('input', runSearch);
      control.addEventListener('change', runSearch);
    });

    if (button) {
      button.addEventListener('click', runSearch);
    }

    runSearch();
  }

  document.addEventListener('DOMContentLoaded', function () {
    initMobileMenu();
    initImageFallback();
    initCarousel();
    initPageFilters();
    initGlobalSearch();
  });
}());
