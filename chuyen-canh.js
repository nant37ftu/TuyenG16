/* =====================================================================
   CHUYỂN CẢNH — hai hàm dùng chung cho mọi trang

     ChuyenCanh.hien(el)            khối el vừa đổi nội dung -> cho nó trôi lên
     ChuyenCanh.doiMan(cu, moi)     màn cu mờ đi rồi màn moi trôi lên thay chỗ

   Cả hai đều tự bỏ qua khi máy bật "giảm chuyển động", và nếu vì lý do gì
   file này không nạp được thì mấy chỗ gọi tới đều có đường lui chạy như cũ.
   ===================================================================== */
(function () {
  'use strict';

  function itChuyenDong() {
    return !!(window.matchMedia &&
              window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }

  // Gỡ class ra rồi gắn lại thì hoạt hình mới chạy lại từ đầu; phải đọc
  // offsetWidth ở giữa để ép trình duyệt tính lại, không thì nó gộp hai
  // thao tác làm một và chẳng có gì xảy ra.
  function chayLai(el, lop) {
    if (!el) return;
    el.classList.remove(lop);
    void el.offsetWidth;
    el.classList.add(lop);
  }

  window.ChuyenCanh = {
    hien: function (el) {
      if (!el || itChuyenDong()) return;
      chayLai(el, 'cc-hien');
    },

    doiMan: function (cu, moi) {
      if (!moi) return;

      function mo() {
        if (cu) {
          cu.hidden = true;
          cu.classList.remove('cc-tan');
        }
        moi.hidden = false;
        if (!itChuyenDong()) chayLai(moi, 'cc-hien');
      }

      if (!cu || cu.hidden || itChuyenDong()) { mo(); return; }

      chayLai(cu, 'cc-tan');
      setTimeout(mo, 150);
    }
  };
})();
