/* =====================================================================
   HIỆU ỨNG TRANG — 37FTU
   Thuần JS, không thư viện. Nguyên tắc:
     1. Không bao giờ được để nội dung ẩn vĩnh viễn. CSS không ẩn sẵn thứ gì;
        JS ẩn đi thì JS phải có đường hiện lại kể cả khi hiệu ứng không chạy
        (trình duyệt cũ, tab chạy nền, máy đang treo khung hình). Mọi cái ẩn
        đều có hẹn giờ mở, và có chốt chặn cuối ở dungChotChan().
     2. Ai bật "giảm chuyển động" trong hệ điều hành thì không chạy gì hết.
     3. Không đụng vào layout — chỉ transform và opacity, để trình duyệt
        không phải tính lại bố cục mỗi khung hình.
   ===================================================================== */
(function () {
  'use strict';

  var IT = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var CO_IO = 'IntersectionObserver' in window;

  /* ------------------------------------------------------------------
     1. HIỆN DẦN KHI CUỘN TỚI
     ------------------------------------------------------------------ */

  // Những thứ đáng cho hiện dần. Cố ý không quét bừa cả trang:
  // chữ trong đoạn văn mà nhấp nháy thì đọc rất mệt.
  var CAN_HIEN = [
    'section > .khung > h2',
    'section > .khung > .nhan',
    'section > .khung > .dan-de',
    'section > .hep > h2',
    '.so-lieu .khung > div',
    '.the', '.sc', '.lt-buoc', '.anh-o', '.ch-o',
    '.luoi > *', '.bon-t > *', '.lo-trinh > *'
  ].join(',');

  var theoDoi = null;
  var daTungHien = false;   // IntersectionObserver đã bắn lần nào chưa

  function hien(el) {
    el.classList.add('hd-vao');
  }

  /* Chốt chặn: có máy không chạy IntersectionObserver, có lúc trình duyệt treo
     khung hình vì tab đang ở nền. Nếu sau 2 giây mà chưa có gì hiện ra thì coi
     như hiệu ứng hỏng — bỏ hết, trả nội dung về trạng thái đọc được. */
  function dungChotChan() {
    setTimeout(function () {
      if (daTungHien) return;
      if (theoDoi) theoDoi.disconnect();
      var ds = document.querySelectorAll('.hd');
      for (var i = 0; i < ds.length; i++) {
        ds[i].style.transitionDelay = '';
        hien(ds[i]);
      }
    }, 2000);
  }

  function danhDau(el, i) {
    if (el.dataset.hd) return;
    el.dataset.hd = '1';
    el.classList.add('hd');
    // các phần tử cùng một hàng thì lệch nhau một nhịp ngắn cho đỡ khô
    if (i) el.style.transitionDelay = Math.min(i, 6) * 60 + 'ms';
    theoDoi.observe(el);
  }

  function quet(goc) {
    var ds = (goc || document).querySelectorAll(CAN_HIEN);
    var cha = null, dem = 0;
    for (var i = 0; i < ds.length; i++) {
      // đếm lại từ đầu mỗi khi sang một khối cha khác
      if (ds[i].parentNode !== cha) { cha = ds[i].parentNode; dem = 0; }
      danhDau(ds[i], dem++);
    }
  }

  function dungHienDan() {
    if (IT || !CO_IO) return;
    theoDoi = new IntersectionObserver(function (muc) {
      muc.forEach(function (m) {
        if (!m.isIntersecting) return;
        daTungHien = true;
        hien(m.target);
        theoDoi.unobserve(m.target);
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 });

    quet(document);
    dungChotChan();

    // app.js đổ nội dung vào sau, nên phải nghe ngóng thêm
    if ('MutationObserver' in window) {
      // Số đếm lên cũng sinh ra mutation (đổi textContent mỗi khung hình), nên
      // phải gộp lại, không thì quét cả trang mấy chục lần cho một lần đếm.
      var hen = 0;
      var mo = new MutationObserver(function () {
        if (hen) return;
        hen = setTimeout(function () { hen = 0; quet(document); }, 120);
      });
      mo.observe(document.body, { childList: true, subtree: true });
      setTimeout(function () { mo.disconnect(); clearTimeout(hen); }, 6000);
    }
  }

  /* ------------------------------------------------------------------
     2. SỐ ĐẾM LÊN
     '2011' -> đếm tới 2011. '300+' -> đếm tới 300 rồi thêm lại dấu +.
     ------------------------------------------------------------------ */

  function demLen(el) {
    var tho = (el.textContent || '').trim();
    var so = parseInt(tho.replace(/\D/g, ''), 10);
    if (!so || so > 100000) return;
    var duoi = tho.replace(/[\d.,\s]/g, '');   // giữ lại '+', '/21'…
    var batDau = 0;
    var dai = so > 500 ? 1100 : 900;

    el.textContent = '0' + duoi;
    function buoc(t) {
      if (!batDau) batDau = t;
      var r = Math.min(1, (t - batDau) / dai);
      var m = 1 - Math.pow(1 - r, 3);           // chậm dần về cuối
      el.textContent = Math.round(so * m).toLocaleString('vi-VN') + duoi;
      if (r < 1) requestAnimationFrame(buoc);
      else el.textContent = tho;                 // trả lại đúng chữ gốc
    }
    requestAnimationFrame(buoc);
  }

  function dungDemSo() {
    if (IT || !CO_IO) return;
    var ob = new IntersectionObserver(function (muc) {
      muc.forEach(function (m) {
        if (!m.isIntersecting) return;
        ob.unobserve(m.target);   // đếm một lần thôi, cuộn lên cuộn xuống không đếm lại
        demLen(m.target);
      });
    }, { threshold: 0.6 });

    function gan() {
      document.querySelectorAll('.so-lieu .khung > div > b, .nn-so > div > b').forEach(function (b) {
        if (b.dataset.dem) return;
        b.dataset.dem = '1';
        ob.observe(b);
      });
    }
    gan();
    setTimeout(gan, 400);
    setTimeout(gan, 1500);
  }

  /* ------------------------------------------------------------------
     3. THANH TRÊN CÙNG — đổ bóng khi đã cuộn khỏi đỉnh trang
     ------------------------------------------------------------------ */

  function dungThanhTren() {
    var dinh = document.querySelector('.dinh');
    if (!dinh) return;
    var dang = false;
    function xem() {
      var can = window.pageYOffset > 12;
      if (can !== dang) { dang = can; dinh.classList.toggle('dinh-cuon', can); }
    }
    xem();
    window.addEventListener('scroll', xem, { passive: true });
  }

  /* ------------------------------------------------------------------
     4. MỞ ĐẦU — chữ ở hero vào lần lượt
     ------------------------------------------------------------------ */

  function dungHero() {
    if (IT) return;
    var hero = document.querySelector('.hero .khung, .nn-dau .khung');
    if (!hero) return;
    var con = hero.children;
    for (var i = 0; i < con.length; i++) {
      (function (el, cham) {
        el.classList.add('hd');
        // Cố ý dùng setTimeout chứ không dùng requestAnimationFrame: rAF bị
        // treo khi tab chạy nền, mà treo rAF nghĩa là tiêu đề trang biến mất.
        setTimeout(function () { hien(el); }, cham);
      })(con[i], i * 90 + 80);
    }
  }

  /* ------------------------------------------------------------------ */

  function chay() {
    dungThanhTren();
    dungHero();
    dungHienDan();
    dungDemSo();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', chay);
  } else {
    chay();
  }
})();
