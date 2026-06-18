(function () {
  var menuButton = document.querySelector('.menu-button');
  var mobileNav = document.querySelector('.mobile-nav');

  if (menuButton && mobileNav) {
    menuButton.addEventListener('click', function () {
      var opened = mobileNav.hasAttribute('hidden');
      if (opened) {
        mobileNav.removeAttribute('hidden');
        menuButton.setAttribute('aria-expanded', 'true');
      } else {
        mobileNav.setAttribute('hidden', '');
        menuButton.setAttribute('aria-expanded', 'false');
      }
    });
  }

  document.querySelectorAll('[data-carousel]').forEach(function (carousel) {
    var slides = Array.prototype.slice.call(carousel.querySelectorAll('.hero-slide'));
    var dots = Array.prototype.slice.call(carousel.querySelectorAll('.hero-dots button'));
    var previous = carousel.querySelector('.hero-prev');
    var next = carousel.querySelector('.hero-next');
    var current = 0;
    var timer = null;

    function show(index) {
      if (!slides.length) {
        return;
      }
      current = (index + slides.length) % slides.length;
      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle('is-active', slideIndex === current);
      });
      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle('is-active', dotIndex === current);
      });
    }

    function startTimer() {
      if (timer) {
        window.clearInterval(timer);
      }
      timer = window.setInterval(function () {
        show(current + 1);
      }, 5000);
    }

    if (previous) {
      previous.addEventListener('click', function () {
        show(current - 1);
        startTimer();
      });
    }

    if (next) {
      next.addEventListener('click', function () {
        show(current + 1);
        startTimer();
      });
    }

    dots.forEach(function (dot, index) {
      dot.addEventListener('click', function () {
        show(index);
        startTimer();
      });
    });

    show(0);
    startTimer();
  });

  document.querySelectorAll('[data-filter-area]').forEach(function (area) {
    var input = area.querySelector('[data-filter-input]');
    var yearSelect = area.querySelector('[data-year-filter]');
    var list = document.querySelector('[data-filter-list]');
    var empty = document.querySelector('[data-empty-state]');

    function applyFilter() {
      if (!list) {
        return;
      }
      var keyword = input ? input.value.trim().toLowerCase() : '';
      var year = yearSelect ? yearSelect.value : '';
      var visible = 0;
      list.querySelectorAll('.movie-card').forEach(function (card) {
        var haystack = (card.getAttribute('data-search') || '').toLowerCase();
        var cardYear = card.getAttribute('data-year') || '';
        var matched = (!keyword || haystack.indexOf(keyword) !== -1) && (!year || cardYear === year);
        card.hidden = !matched;
        if (matched) {
          visible += 1;
        }
      });
      if (empty) {
        empty.hidden = visible !== 0;
      }
    }

    if (input) {
      input.addEventListener('input', applyFilter);
    }
    if (yearSelect) {
      yearSelect.addEventListener('change', applyFilter);
    }
  });

  var player = document.getElementById('moviePlayer');
  if (player) {
    var shell = player.closest('.player-shell');
    var playButton = shell ? shell.querySelector('.player-start') : null;
    var streamUrl = player.getAttribute('data-stream');
    var attached = false;
    var hlsInstance = null;

    function attachStream() {
      if (attached || !streamUrl) {
        return;
      }
      if (player.canPlayType('application/vnd.apple.mpegurl')) {
        player.src = streamUrl;
        attached = true;
        return;
      }
      if (window.Hls && window.Hls.isSupported()) {
        hlsInstance = new window.Hls({
          enableWorker: true,
          lowLatencyMode: false
        });
        hlsInstance.loadSource(streamUrl);
        hlsInstance.attachMedia(player);
        attached = true;
      }
    }

    function startPlayback(event) {
      if (event) {
        event.preventDefault();
        event.stopPropagation();
      }
      attachStream();
      var promise = player.play();
      if (promise && typeof promise.then === 'function') {
        promise.then(function () {
          if (shell) {
            shell.classList.add('is-playing');
          }
        }).catch(function () {
          if (shell) {
            shell.classList.add('is-playing');
          }
        });
      } else if (shell) {
        shell.classList.add('is-playing');
      }
    }

    if (playButton) {
      playButton.addEventListener('click', startPlayback);
    }
    if (shell) {
      shell.addEventListener('click', function (event) {
        if (event.target === player) {
          return;
        }
        startPlayback(event);
      });
    }
    player.addEventListener('play', function () {
      if (shell) {
        shell.classList.add('is-playing');
      }
    });
    player.addEventListener('pause', function () {
      if (shell && player.currentTime === 0) {
        shell.classList.remove('is-playing');
      }
    });
    player.addEventListener('loadedmetadata', function () {
      if (player.paused && shell) {
        shell.classList.remove('is-playing');
      }
    });
    window.addEventListener('pagehide', function () {
      if (hlsInstance) {
        hlsInstance.destroy();
      }
    });
  }
})();
