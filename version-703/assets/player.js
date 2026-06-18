(function () {
  function initMoviePlayer(wrapper) {
    var video = wrapper.querySelector('video');
    var startButton = wrapper.querySelector('.player-start');
    var status = wrapper.querySelector('.player-status');
    var source = wrapper.getAttribute('data-hls');
    var hls = null;
    var loaded = false;

    if (!video || !startButton || !source) {
      return;
    }

    function setStatus(message) {
      if (status) {
        status.textContent = message;
      }
    }

    function loadSource() {
      if (loaded) {
        return;
      }

      if (window.Hls && window.Hls.isSupported()) {
        hls = new window.Hls({
          enableWorker: true,
          lowLatencyMode: false
        });
        hls.loadSource(source);
        hls.attachMedia(video);
        hls.on(window.Hls.Events.MANIFEST_PARSED, function () {
          setStatus('播放源加载完成。');
        });
        hls.on(window.Hls.Events.ERROR, function (eventName, data) {
          if (data && data.fatal) {
            setStatus('播放源加载异常，请刷新页面后重试。');
          }
        });
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = source;
        setStatus('使用浏览器原生 HLS 播放。');
      } else {
        setStatus('当前浏览器需要加载 HLS 播放组件后播放。');
      }

      loaded = true;
    }

    function playVideo() {
      loadSource();
      var promise = video.play();
      if (promise && typeof promise.catch === 'function') {
        promise.catch(function () {
          setStatus('浏览器阻止了自动播放，请再次点击播放按钮。');
          wrapper.classList.remove('is-playing');
        });
      }
      wrapper.classList.add('is-playing');
    }

    startButton.addEventListener('click', playVideo);
    video.addEventListener('play', function () {
      wrapper.classList.add('is-playing');
    });
    video.addEventListener('pause', function () {
      wrapper.classList.remove('is-playing');
    });
    video.addEventListener('ended', function () {
      wrapper.classList.remove('is-playing');
    });
    video.addEventListener('click', function () {
      if (video.paused) {
        playVideo();
      } else {
        video.pause();
      }
    });

    window.addEventListener('beforeunload', function () {
      if (hls) {
        hls.destroy();
      }
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    Array.prototype.slice.call(document.querySelectorAll('.movie-player')).forEach(initMoviePlayer);
  });
}());
