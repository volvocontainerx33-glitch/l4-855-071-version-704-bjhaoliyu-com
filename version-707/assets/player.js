(function () {
  function setupPlayer(player) {
    var video = player.querySelector('video');
    var start = player.querySelector('[data-player-start]');
    var toggle = player.querySelector('[data-player-toggle]');
    var mute = player.querySelector('[data-player-mute]');
    var fullscreen = player.querySelector('[data-player-fullscreen]');
    var source = video ? video.getAttribute('data-src') : '';
    var attached = false;
    var hls = null;

    if (!video || !source) {
      return;
    }

    function attachSource() {
      if (attached) {
        return;
      }

      attached = true;

      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = source;
        return;
      }

      if (window.Hls && window.Hls.isSupported()) {
        hls = new window.Hls({
          enableWorker: true,
          lowLatencyMode: true
        });
        hls.loadSource(source);
        hls.attachMedia(video);
        return;
      }

      video.src = source;
    }

    function playVideo() {
      attachSource();
      var promise = video.play();

      if (promise && typeof promise.catch === 'function') {
        promise.catch(function () {
          player.classList.remove('is-playing');
        });
      }
    }

    function togglePlay() {
      if (video.paused) {
        playVideo();
      } else {
        video.pause();
      }
    }

    video.addEventListener('click', togglePlay);

    if (start) {
      start.addEventListener('click', playVideo);
    }

    if (toggle) {
      toggle.addEventListener('click', togglePlay);
    }

    if (mute) {
      mute.addEventListener('click', function () {
        video.muted = !video.muted;
        mute.textContent = video.muted ? '取消静音' : '静音';
      });
    }

    if (fullscreen) {
      fullscreen.addEventListener('click', function () {
        if (video.requestFullscreen) {
          video.requestFullscreen();
        } else if (video.webkitEnterFullscreen) {
          video.webkitEnterFullscreen();
        }
      });
    }

    video.addEventListener('play', function () {
      player.classList.add('is-playing');
      if (toggle) {
        toggle.textContent = '暂停';
      }
    });

    video.addEventListener('pause', function () {
      player.classList.remove('is-playing');
      if (toggle) {
        toggle.textContent = '播放';
      }
    });

    video.addEventListener('ended', function () {
      player.classList.remove('is-playing');
      if (hls && hls.destroy) {
        hls.destroy();
        hls = null;
        attached = false;
      }
    });

    attachSource();
  }

  document.querySelectorAll('[data-player]').forEach(setupPlayer);
})();
