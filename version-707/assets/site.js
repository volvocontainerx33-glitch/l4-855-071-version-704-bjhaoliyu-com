(function () {
  var menuButton = document.querySelector('[data-menu-button]');
  var mobileNav = document.querySelector('[data-mobile-nav]');

  if (menuButton && mobileNav) {
    menuButton.addEventListener('click', function () {
      mobileNav.classList.toggle('open');
    });
  }

  var hero = document.querySelector('[data-hero]');

  if (hero) {
    var slides = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-slide]'));
    var dots = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-dot]'));
    var prev = hero.querySelector('[data-hero-prev]');
    var next = hero.querySelector('[data-hero-next]');
    var index = 0;
    var timer = null;

    function setSlide(nextIndex) {
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

    function startTimer() {
      clearInterval(timer);
      timer = setInterval(function () {
        setSlide(index + 1);
      }, 5200);
    }

    if (prev) {
      prev.addEventListener('click', function () {
        setSlide(index - 1);
        startTimer();
      });
    }

    if (next) {
      next.addEventListener('click', function () {
        setSlide(index + 1);
        startTimer();
      });
    }

    dots.forEach(function (dot) {
      dot.addEventListener('click', function () {
        setSlide(Number(dot.getAttribute('data-hero-dot')) || 0);
        startTimer();
      });
    });

    setSlide(0);
    startTimer();
  }

  var searchInput = document.getElementById('movieSearch');
  var searchResults = document.getElementById('searchResults');
  var searchTitle = document.getElementById('searchTitle');
  var clearSearch = document.querySelector('[data-clear-search]');

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function renderCard(movie) {
    var tags = (movie.tags || []).slice(0, 3).map(function (tag) {
      return '<span>' + escapeHtml(tag) + '</span>';
    }).join('');

    return [
      '<article class="video-card">',
      '  <a href="' + escapeHtml(movie.url) + '" class="card-link">',
      '    <div class="poster-frame">',
      '      <img src="' + escapeHtml(movie.cover) + '" alt="' + escapeHtml(movie.title) + '" loading="lazy" onerror="this.remove();">',
      '      <span class="quality-badge">高清</span>',
      '      <span class="score-badge">' + escapeHtml(movie.rating) + '</span>',
      '    </div>',
      '    <div class="card-body">',
      '      <div class="card-meta">',
      '        <span>' + escapeHtml(movie.region) + '</span>',
      '        <span>' + escapeHtml(movie.year) + '</span>',
      '        <span>' + escapeHtml(movie.duration) + '</span>',
      '      </div>',
      '      <h2>' + escapeHtml(movie.title) + '</h2>',
      '      <p>' + escapeHtml(movie.oneLine) + '</p>',
      '      <div class="tag-row">' + tags + '</div>',
      '    </div>',
      '  </a>',
      '</article>'
    ].join('\n');
  }

  function performSearch() {
    if (!searchInput || !searchResults || !window.MOVIE_INDEX) {
      return;
    }

    var query = searchInput.value.trim().toLowerCase();
    var list = window.MOVIE_INDEX.filter(function (movie) {
      if (!query) {
        return true;
      }

      return [
        movie.title,
        movie.region,
        movie.type,
        movie.year,
        movie.genre,
        (movie.tags || []).join(' '),
        movie.oneLine
      ].join(' ').toLowerCase().indexOf(query) !== -1;
    }).slice(0, query ? 120 : 48);

    searchResults.innerHTML = list.map(renderCard).join('\n');

    if (searchTitle) {
      searchTitle.textContent = query ? '搜索结果：' + list.length + ' 条' : '推荐结果';
    }
  }

  if (searchInput) {
    searchInput.addEventListener('input', performSearch);
  }

  if (clearSearch && searchInput) {
    clearSearch.addEventListener('click', function () {
      searchInput.value = '';
      performSearch();
      searchInput.focus();
    });
  }
})();
