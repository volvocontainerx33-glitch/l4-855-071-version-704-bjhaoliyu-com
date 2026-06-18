(function () {
  function qs(selector, scope) {
    return (scope || document).querySelector(selector);
  }

  function qsa(selector, scope) {
    return Array.prototype.slice.call((scope || document).querySelectorAll(selector));
  }

  var searchToggle = qs(".search-toggle");
  var searchPanel = qs("[data-search-panel]");
  if (searchToggle && searchPanel) {
    searchToggle.addEventListener("click", function () {
      searchPanel.classList.toggle("open");
      var input = qs("input", searchPanel);
      if (searchPanel.classList.contains("open") && input) {
        input.focus();
      }
    });
  }

  var menuToggle = qs(".menu-toggle");
  var mobileNav = qs("[data-mobile-nav]");
  if (menuToggle && mobileNav) {
    menuToggle.addEventListener("click", function () {
      mobileNav.classList.toggle("open");
    });
  }

  function normalize(value) {
    return String(value || "").trim().toLowerCase();
  }

  function applyFilter(form) {
    var input = qs("[data-filter-input]", form);
    var select = qs("[data-filter-select]", form);
    var grid = qs("[data-card-grid]");
    var empty = qs("[data-empty-state]");
    if (!grid) {
      return;
    }
    var query = normalize(input && input.value);
    var type = normalize(select && select.value);
    var visible = 0;
    qsa("[data-movie-card]", grid).forEach(function (card) {
      var text = normalize(card.getAttribute("data-text"));
      var genre = normalize(card.getAttribute("data-genre"));
      var matchedQuery = !query || text.indexOf(query) !== -1;
      var matchedType = !type || genre.indexOf(type) !== -1 || text.indexOf(type) !== -1;
      var matched = matchedQuery && matchedType;
      card.classList.toggle("is-hidden", !matched);
      if (matched) {
        visible += 1;
      }
    });
    if (empty) {
      empty.classList.toggle("show", visible === 0);
    }
  }

  qsa("[data-local-filter]").forEach(function (form) {
    var input = qs("[data-filter-input]", form);
    var select = qs("[data-filter-select]", form);
    var params = new URLSearchParams(window.location.search);
    var query = params.get("q");
    if (query && input) {
      input.value = query;
    }
    if (input) {
      input.addEventListener("input", function () {
        applyFilter(form);
      });
    }
    if (select) {
      select.addEventListener("change", function () {
        applyFilter(form);
      });
    }
    applyFilter(form);
  });
})();

function initMoviePlayer(streamUrl) {
  var video = document.getElementById("moviePlayer");
  var overlay = document.getElementById("playOverlay");
  if (!video || !streamUrl) {
    return;
  }
  var attached = false;
  function attach() {
    if (attached) {
      return;
    }
    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = streamUrl;
    } else if (window.Hls && window.Hls.isSupported()) {
      var hls = new window.Hls({
        enableWorker: true,
        lowLatencyMode: false
      });
      hls.loadSource(streamUrl);
      hls.attachMedia(video);
    } else {
      video.src = streamUrl;
    }
    attached = true;
  }
  function start() {
    attach();
    if (overlay) {
      overlay.classList.add("is-hidden");
    }
    var play = video.play();
    if (play && typeof play.catch === "function") {
      play.catch(function () {
        if (overlay) {
          overlay.classList.remove("is-hidden");
        }
      });
    }
  }
  if (overlay) {
    overlay.addEventListener("click", start);
  }
  video.addEventListener("click", function () {
    if (video.paused) {
      start();
    }
  });
  video.addEventListener("play", function () {
    if (overlay) {
      overlay.classList.add("is-hidden");
    }
  });
}
