(function () {
  function ready(fn) {
    if (document.readyState !== 'loading') {
      fn();
    } else {
      document.addEventListener('DOMContentLoaded', fn);
    }
  }

  ready(function () {
    var boxes = Array.prototype.slice.call(document.querySelectorAll('[data-player]'));
    boxes.forEach(function (box) {
      var video = box.querySelector('video');
      var cover = box.querySelector('.player-cover');
      if (!video || !cover) {
        return;
      }

      var stream = video.getAttribute('data-stream');
      var attached = false;

      function attach() {
        if (attached || !stream) {
          return;
        }
        attached = true;
        if (video.canPlayType('application/vnd.apple.mpegurl')) {
          video.src = stream;
        } else if (window.Hls && window.Hls.isSupported()) {
          var hls = new Hls({
            enableWorker: true,
            lowLatencyMode: true
          });
          hls.loadSource(stream);
          hls.attachMedia(video);
          video.hlsInstance = hls;
        } else {
          video.src = stream;
        }
      }

      function play() {
        attach();
        cover.classList.add('is-hidden');
        var action = video.play();
        if (action && typeof action.catch === 'function') {
          action.catch(function () {
            cover.classList.remove('is-hidden');
          });
        }
      }

      cover.addEventListener('click', play);
      video.addEventListener('click', function () {
        if (video.paused) {
          play();
        }
      });
      video.addEventListener('play', function () {
        cover.classList.add('is-hidden');
      });
    });
  });
})();
