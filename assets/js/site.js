(function () {
  function ready(fn) {
    if (document.readyState !== 'loading') {
      fn();
    } else {
      document.addEventListener('DOMContentLoaded', fn);
    }
  }

  ready(function () {
    var navButton = document.querySelector('.nav-toggle');
    var navLinks = document.querySelector('.nav-links');
    if (navButton && navLinks) {
      navButton.addEventListener('click', function () {
        navLinks.classList.toggle('is-open');
      });
    }

    var hero = document.querySelector('[data-hero]');
    if (hero) {
      var slides = Array.prototype.slice.call(hero.querySelectorAll('.hero-slide'));
      var dots = Array.prototype.slice.call(hero.querySelectorAll('.hero-dot'));
      var index = 0;
      var timer = null;

      function show(next) {
        index = (next + slides.length) % slides.length;
        slides.forEach(function (slide, i) {
          slide.classList.toggle('is-active', i === index);
        });
        dots.forEach(function (dot, i) {
          dot.classList.toggle('is-active', i === index);
        });
      }

      function start() {
        timer = window.setInterval(function () {
          show(index + 1);
        }, 5000);
      }

      function restart() {
        if (timer) {
          window.clearInterval(timer);
        }
        start();
      }

      var prev = hero.querySelector('.hero-control.prev');
      var next = hero.querySelector('.hero-control.next');
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
          show(Number(dot.getAttribute('data-slide')) || 0);
          restart();
        });
      });
      start();
    }

    var catalog = document.querySelector('[data-catalog]');
    var input = document.querySelector('.catalog-search');
    var filterButtons = Array.prototype.slice.call(document.querySelectorAll('[data-filter]'));
    if (catalog) {
      var cards = Array.prototype.slice.call(catalog.querySelectorAll('.movie-card'));
      var activeFilter = 'all';

      function normalize(value) {
        return String(value || '').toLowerCase();
      }

      function applyFilter() {
        var keyword = input ? normalize(input.value) : '';
        cards.forEach(function (card) {
          var haystack = normalize([
            card.getAttribute('data-title'),
            card.getAttribute('data-region'),
            card.getAttribute('data-year'),
            card.getAttribute('data-genre'),
            card.getAttribute('data-tags'),
            card.getAttribute('data-type')
          ].join(' '));
          var typeText = normalize(card.getAttribute('data-type') + ' ' + card.getAttribute('data-genre'));
          var matchesText = !keyword || haystack.indexOf(keyword) !== -1;
          var matchesFilter = activeFilter === 'all' || typeText.indexOf(normalize(activeFilter)) !== -1;
          card.style.display = matchesText && matchesFilter ? '' : 'none';
        });
      }

      if (input) {
        var params = new URLSearchParams(window.location.search);
        var query = params.get('q');
        if (query) {
          input.value = query;
        }
        input.addEventListener('input', applyFilter);
      }

      filterButtons.forEach(function (button) {
        button.addEventListener('click', function () {
          filterButtons.forEach(function (item) {
            item.classList.remove('is-active');
          });
          button.classList.add('is-active');
          activeFilter = button.getAttribute('data-filter') || 'all';
          applyFilter();
        });
      });

      applyFilter();
    }
  });
})();
