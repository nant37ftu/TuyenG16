/* =====================================================================
   NHẠC NỀN 37FTU — PHÁT LIÊN TỤC KHÔNG BỊ NGẮT QUÃNG KHI CHUYỂN TRANG
   Hỗ trợ: index.html, quiz.html, game.html, an-gi.html
   ===================================================================== */
(function () {
  'use strict';

  var K_VI_TRI = '37ftu_nhac_vitri';
  var K_THOI_GIAN = '37ftu_nhac_thoigian';
  var K_TAM_DUNG = '37ftu_nhac_tam_dung';

  // Lấy vị trí đã phát từ trang trước
  function layViTriLuu() {
    try {
      var s = parseFloat(sessionStorage.getItem(K_VI_TRI) || '0');
      var t = parseInt(sessionStorage.getItem(K_THOI_GIAN) || '0', 10);
      if (!isNaN(s) && s > 0) {
        // Bù thêm độ trễ load chuyển trang (nếu chuyển nhanh dưới 6 giây)
        var delta = 0;
        if (t > 0) {
          var diff = (Date.now() - t) / 1000;
          if (diff > 0 && diff < 6) delta = diff;
        }
        return s + delta;
      }
    } catch (e) {}
    return 0;
  }

  var viTriLuu = layViTriLuu();
  var daDatViTri = false;
  var nguoiDungTamDung = false;
  try {
    nguoiDungTamDung = sessionStorage.getItem(K_TAM_DUNG) === '1';
  } catch (e) {}

  function layAudio() {
    var a = document.getElementById('nhac-nen');
    if (!a && document.body) {
      a = document.createElement('audio');
      a.id = 'nhac-nen';
      a.src = 'assets/music.mp3';
      a.autoplay = true;
      a.loop = true;
      a.setAttribute('playsinline', '');
      a.preload = 'auto';
      document.body.appendChild(a);
    }
    return a;
  }

  var audio = layAudio();

  function apDungViTri() {
    if (!audio || daDatViTri || viTriLuu <= 0) return;
    try {
      if (audio.duration && viTriLuu >= audio.duration) {
        viTriLuu = viTriLuu % audio.duration;
      }
      audio.currentTime = viTriLuu;
      daDatViTri = true;
    } catch (e) {}
  }

  if (audio) {
    audio.volume = 1.0;
    apDungViTri();
    audio.addEventListener('loadedmetadata', apDungViTri);
    audio.addEventListener('canplay', apDungViTri);
  }

  function luuViTri() {
    if (!audio || audio.currentTime <= 0) return;
    try {
      sessionStorage.setItem(K_VI_TRI, String(audio.currentTime));
      sessionStorage.setItem(K_THOI_GIAN, String(Date.now()));
    } catch (e) {}
  }

  if (audio) {
    audio.addEventListener('timeupdate', luuViTri);
  }

  window.addEventListener('beforeunload', function () {
    luuViTri();
    if (audio) {
      try { sessionStorage.setItem(K_TAM_DUNG, audio.paused ? '1' : '0'); } catch (e) {}
    }
  });

  window.addEventListener('pagehide', function () {
    luuViTri();
    if (audio) {
      try { sessionStorage.setItem(K_TAM_DUNG, audio.paused ? '1' : '0'); } catch (e) {}
    }
  });

  // Tạo hoặc gắn nút điều khiển đĩa than
  function khoiTaoNut() {
    if (!audio) audio = layAudio();
    if (!audio) return;

    var nut = document.getElementById('nut-nhac-nen');
    if (!nut && document.body) {
      nut = document.createElement('button');
      nut.id = 'nut-nhac-nen';
      nut.className = 'nut-nhac-nen';
      nut.type = 'button';
      nut.setAttribute('aria-label', 'Bật/tắt nhạc nền');
      nut.setAttribute('title', 'Khúc ca 37FTU · Bật/tắt nhạc');
      nut.innerHTML =
        '<span class="dia-nhac"><span class="dia-icon">🎵</span></span>' +
        '<span class="nhac-chu">Khúc ca 37FTU</span>' +
        '<span class="song-nhac" aria-hidden="true"><i></i><i></i><i></i><i></i></span>';
      document.body.appendChild(nut);
    }

    function capNhatGiaoDien(dangPhat) {
      if (!nut) return;
      if (dangPhat) {
        nut.classList.add('dang-phat');
        nut.setAttribute('title', 'Tạm dừng nhạc nền');
      } else {
        nut.classList.remove('dang-phat');
        nut.setAttribute('title', 'Bật nhạc nền 37FTU');
      }
    }

    function phatNhac() {
      if (!audio || nguoiDungTamDung) return;
      audio.volume = 1.0;
      apDungViTri();
      var p = audio.play();
      if (p !== undefined) {
        p.then(function () {
          capNhatGiaoDien(true);
        }).catch(function () {});
      }
    }

    // 1. Thử phát ngay
    phatNhac();

    // 2. Thử lại tự động trong vài giây đầu nếu trình duyệt đang đệm dữ liệu
    var soLanThu = 0;
    var timerThu = setInterval(function () {
      if (nguoiDungTamDung) {
        clearInterval(timerThu);
        return;
      }
      if (!audio.paused) {
        clearInterval(timerThu);
        capNhatGiaoDien(true);
      } else {
        phatNhac();
        soLanThu++;
        if (soLanThu > 15) clearInterval(timerThu);
      }
    }, 250);

    // 3. Tự động phát khi có tín hiệu tự nhiên (di chuột, cuộn, chuyển tab)
    var suKienTuNhien = ['mousemove', 'pointermove', 'scroll', 'wheel', 'touchstart', 'click', 'keydown', 'focus', 'mouseenter'];
    var kichHoatTuNhien = function () {
      if (!nguoiDungTamDung && audio.paused) {
        phatNhac();
      }
    };
    suKienTuNhien.forEach(function (e) {
      window.addEventListener(e, kichHoatTuNhien, { passive: true });
    });

    // 4. Bấm nút để bật/tắt thủ công
    if (nut) {
      nut.addEventListener('click', function (e) {
        e.stopPropagation();
        if (audio.paused) {
          nguoiDungTamDung = false;
          try { sessionStorage.setItem(K_TAM_DUNG, '0'); } catch (err) {}
          phatNhac();
        } else {
          audio.pause();
          nguoiDungTamDung = true;
          try { sessionStorage.setItem(K_TAM_DUNG, '1'); } catch (err) {}
          capNhatGiaoDien(false);
        }
      });
    }

    audio.addEventListener('play', function () { capNhatGiaoDien(true); });
    audio.addEventListener('pause', function () { capNhatGiaoDien(false); });

    if (!audio.paused) {
      capNhatGiaoDien(true);
    }
  }

  // Khởi động UI ngay khi DOM sẵn sàng
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', khoiTaoNut);
  } else {
    khoiTaoNut();
  }
})();
