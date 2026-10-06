/* =====================================================================
   INTRO MỞ ĐẦU TRANG CHỦ
   Chạy ngay khi trình duyệt đọc tới thẻ script này (nằm ngay đầu <body>),
   tức là trước khi vẽ phần còn lại của trang — nhờ vậy không bị loé hero
   lên một nhịp rồi mới che lại.

   Chọn bản nào: CAU_HINH.INTRO trong config.js ('b' | 'c' | 'tat').
   Xem thử nhanh: thêm ?intro=b, ?intro=c hoặc ?intro=tat vào địa chỉ.

   Ba điều luôn giữ, đừng bỏ:
     1. Chỉ chạy một lần mỗi phiên (sessionStorage) — khách quay lại
        trang chủ giữa chừng không phải ngồi xem lại.
     2. Máy bật "giảm chuyển động" thì bỏ hẳn intro.
     3. Bấm / gõ phím / lăn chuột là vào thẳng, không phải chờ hết.
   ===================================================================== */
(function () {
  'use strict';

  var KHOA = '37ftu_intro_xong';
  var CH = window.CAU_HINH || {};
  var goc = document.documentElement;

  function thamSo(ten) {
    var m = new RegExp('[?&]' + ten + '=([^&]*)').exec(location.search);
    return m ? decodeURIComponent(m[1]) : '';
  }

  var tuDiaChi = thamSo('intro').toLowerCase();
  var ban = (tuDiaChi || CH.INTRO || '').toLowerCase();

  if (ban === 'tat' || ban === 'off' || ban === '') return;
  if (ban !== 'b' && ban !== 'c') ban = 'b';

  // Gõ ?intro= là cố ý xem thử, nên bỏ qua hai cửa dưới đây
  var xemThu = !!tuDiaChi;

  if (!xemThu) {
    var it = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)');
    if (it && it.matches) return;
    try {
      if (sessionStorage.getItem(KHOA) === '1') return;
    } catch (e) {}
  }

  var hop = document.getElementById('intro');
  var mau = document.getElementById('mau-intro-' + ban);
  if (!hop || !mau) return;

  hop.appendChild(mau.content.cloneNode(true));

  var nut = document.createElement('button');
  nut.type = 'button';
  nut.className = 'intro-bo-qua';
  nut.textContent = 'Bỏ qua';
  hop.appendChild(nut);

  hop.hidden = false;
  goc.classList.add('co-intro', 'intro-' + ban);
  if (xemThu) goc.classList.add('intro-xem-thu');

  var xong = false;

  function ketThuc() {
    if (xong) return;
    xong = true;
    clearTimeout(hanGio);
    try { sessionStorage.setItem(KHOA, '1'); } catch (e) {}

    goc.classList.add('intro-tan');
    setTimeout(function () {
      goc.classList.remove('co-intro', 'intro-' + ban, 'intro-tan', 'intro-xem-thu');
      if (hop.parentNode) hop.parentNode.removeChild(hop);
    }, 360);
  }

  // Bản C ít lớp hơn nên kết thúc sớm hơn một chút
  var hanGio = setTimeout(ketThuc, ban === 'c' ? 1250 : 1400);

  nut.addEventListener('click', ketThuc);
  ['pointerdown', 'keydown', 'wheel', 'touchstart'].forEach(function (loai) {
    window.addEventListener(loai, ketThuc, { once: true, passive: true });
  });

  // Mở tab khác rồi quay lại thì hoạt hình đã chạy xong từ đời nào, vào luôn
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) ketThuc();
  });
})();
