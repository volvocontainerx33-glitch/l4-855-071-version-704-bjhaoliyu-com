(function () {
  function ready(callback) {
    if (document.readyState !== "loading") {
      callback();
      return;
    }
    document.addEventListener("DOMContentLoaded", callback);
  }

  ready(function () {
    var toggle = document.querySelector(".nav-toggle");
    var mobileNav = document.querySelector(".mobile-nav");

    if (toggle && mobileNav) {
      toggle.addEventListener("click", function () {
        var open = mobileNav.classList.toggle("is-open");
        toggle.setAttribute("aria-expanded", open ? "true" : "false");
      });
    }

    var slides = Array.prototype.slice.call(document.querySelectorAll(".hero-slide"));
    var dots = Array.prototype.slice.call(document.querySelectorAll(".hero-dots button"));
    var active = 0;

    function showSlide(index) {
      if (!slides.length) {
        return;
      }
      active = (index + slides.length) % slides.length;
      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle("is-active", slideIndex === active);
      });
      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle("is-active", dotIndex === active);
        dot.setAttribute("aria-current", dotIndex === active ? "true" : "false");
      });
    }

    if (slides.length) {
      dots.forEach(function (dot, index) {
        dot.addEventListener("click", function () {
          showSlide(index);
        });
      });
      window.setInterval(function () {
        showSlide(active + 1);
      }, 6500);
    }

    var filterRoot = document.querySelector("[data-filter-root]");
    if (filterRoot) {
      var queryInput = filterRoot.querySelector("[data-filter-query]");
      var regionSelect = filterRoot.querySelector("[data-filter-region]");
      var typeSelect = filterRoot.querySelector("[data-filter-type]");
      var yearSelect = filterRoot.querySelector("[data-filter-year]");
      var cards = Array.prototype.slice.call(filterRoot.querySelectorAll(".filter-card"));
      var empty = filterRoot.querySelector(".no-results");
      var params = new URLSearchParams(window.location.search);
      var initialQuery = params.get("q") || "";

      if (queryInput && initialQuery) {
        queryInput.value = initialQuery;
      }

      function matches(card) {
        var query = queryInput ? queryInput.value.trim().toLowerCase() : "";
        var region = regionSelect ? regionSelect.value : "";
        var type = typeSelect ? typeSelect.value : "";
        var year = yearSelect ? yearSelect.value : "";
        var text = card.getAttribute("data-search") || "";
        var regionText = card.getAttribute("data-region") || "";
        var typeText = card.getAttribute("data-type") || "";
        var yearText = card.getAttribute("data-year") || "";

        if (query && text.indexOf(query) === -1) {
          return false;
        }
        if (region && regionText.indexOf(region) === -1) {
          return false;
        }
        if (type && typeText !== type) {
          return false;
        }
        if (year && yearText !== year) {
          return false;
        }
        return true;
      }

      function applyFilter() {
        var shown = 0;
        cards.forEach(function (card) {
          var visible = matches(card);
          card.style.display = visible ? "" : "none";
          if (visible) {
            shown += 1;
          }
        });
        if (empty) {
          empty.classList.toggle("is-visible", shown === 0);
        }
      }

      [queryInput, regionSelect, typeSelect, yearSelect].forEach(function (control) {
        if (!control) {
          return;
        }
        control.addEventListener("input", applyFilter);
        control.addEventListener("change", applyFilter);
      });

      var filterForm = filterRoot.querySelector(".filter-bar");
      if (filterForm) {
        filterForm.addEventListener("submit", function (event) {
          event.preventDefault();
          applyFilter();
        });
      }

      applyFilter();
    }
  });
})();
