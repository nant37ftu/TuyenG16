/* ============================================================
   NGHỆ WIKI — vẽ nội dung, lọc, tìm kiếm, điều hướng bên trái
   Dữ liệu tuyến xe nằm ở data/wiki-xe.json (BTC sửa file đó).
   Món ăn dùng chung window.DU_LIEU_MON_AN của trang "Ăn chi".
   ============================================================ */
(function () {
  'use strict';

  var CH = window.CAU_HINH || {};
  var $ = function (s) { return document.querySelector(s); };

  function an(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /* ---------------- Đếm ngược hạn nộp đơn ---------------- */
  function demNguoc() {
    var o1 = $('#wk-dem'), o2 = $('#wk-dem-2');
    if (!o1 && !o2) return;
    var han = CH.HAN_NOP_DON ? new Date(CH.HAN_NOP_DON) : null;

    function ve() {
      var chu;
      if (!han || isNaN(han)) {
        chu = 'Đang mở đơn Gen 16';
      } else {
        var con = han - new Date();
        if (con <= 0) {
          chu = 'Đợt nhận đơn đã khép lại';
        } else {
          var ngay = Math.floor(con / 86400000);
          var gio = Math.floor(con / 3600000) % 24;
          chu = ngay > 0
            ? 'Còn ' + ngay + ' ngày ' + gio + ' giờ để nộp đơn'
            : 'Còn ' + gio + ' giờ cuối để nộp đơn';
        }
      }
      if (o1) o1.textContent = chu;
      if (o2) o2.textContent = chu;
      setTimeout(ve, 60000);
    }
    ve();
  }

  /* ---------------- Mục "Về quê" ---------------- */
  var XE = { tuyen: [], loc: 'tat-ca' };

  function theTuyen(t) {
    var cho = t.da_kiem
      ? '<span class="wk-cho wk-cho-kiem">đã kiểm</span>'
      : '<span class="wk-cho wk-cho-chua">chưa kiểm xong</span>';

    var so = [
      ['Loại xe', t.loai_xe],
      ['Giá tham khảo', t.gia],
      ['Đi mất', t.thoi_gian],
      ['Tổng đài', t.hotline]
    ].filter(function (x) { return x[1]; }).map(function (x) {
      return '<div><span>' + an(x[0]) + '</span><b>' + an(x[1]) + '</b></div>';
    }).join('');

    return '<article class="wk-xe" data-tim="' + an((t.ten + ' ' + (t.den || []).join(' ') + ' ' + (t.ghi_chu || '')).toLowerCase()) + '">' +
      '<div class="wk-xe-dau"><span class="wk-xe-ten">' + an(t.ten) + '</span>' + cho + '</div>' +
      (so ? '<div class="wk-xe-so">' + so + '</div>' : '') +
      (t.ghi_chu ? '<p class="wk-xe-ghi">' + an(t.ghi_chu) + '</p>' : '') +
      (t.canh_bao ? '<p class="wk-xe-canh"><span aria-hidden="true">⚠️</span><span>' + an(t.canh_bao) + '</span></p>' : '') +
      '<div class="wk-xe-nut">' +
        (t.web ? '<a class="nut nut-chinh" href="' + an(t.web) + '" target="_blank" rel="noopener">Đặt vé ở ' + an(t.web_nhan || t.web) + ' ↗</a>' : '') +
        (t.hotline ? '<a class="nut nut-vien" href="tel:' + an(String(t.hotline).replace(/\s/g, '')) + '">Gọi ' + an(t.hotline) + '</a>' : '') +
      '</div>' +
      (t.nguon ? '<p class="wk-xe-nguon">Nguồn: ' + an(t.nguon) + '</p>' : '') +
    '</article>';
  }

  function veTuyen() {
    var hop = $('#wk-bang-xe');
    if (!hop) return;
    var ds = XE.tuyen.filter(function (t) {
      return XE.loc === 'tat-ca' || (t.den || []).indexOf(XE.loc) >= 0;
    });
    hop.innerHTML = ds.length
      ? ds.map(theTuyen).join('')
      : '<p class="wk-trong-rong">Chưa có tuyến nào về ' + an(XE.loc) +
        ' trong sổ tay. Em biết nhà xe nào thì nhắn fanpage giúp anh chị nhé.</p>';
  }

  function veChipDen() {
    var hop = $('#wk-chip-den');
    if (!hop) return;
    var noi = ['tat-ca'];
    XE.tuyen.forEach(function (t) {
      (t.den || []).forEach(function (d) { if (noi.indexOf(d) < 0) noi.push(d); });
    });
    hop.innerHTML = noi.map(function (d) {
      return '<button type="button" data-den="' + an(d) + '" aria-pressed="' +
        (d === XE.loc) + '">' + (d === 'tat-ca' ? 'Tất cả' : an(d)) + '</button>';
    }).join('');
    hop.querySelectorAll('button').forEach(function (b) {
      b.addEventListener('click', function () {
        XE.loc = b.getAttribute('data-den');
        veChipDen();
        veTuyen();
      });
    });
  }

  function napXe() {
    fetch('data/wiki-xe.json')
      .then(function (r) { return r.json(); })
      .then(function (d) {
        XE.tuyen = d.tuyen || [];
        veChipDen();
        veTuyen();

        var ben = $('#wk-ben-xe');
        if (ben) {
          ben.innerHTML = (d.ben_xe || []).map(function (b) {
            return '<li><b>' + an(b.ten) + '</b>' + (b.ghi_chu ? ' — ' + an(b.ghi_chu) : '') + '</li>';
          }).join('');
        }

        var bs = $('#wk-dang-bo-sung');
        if (bs) {
          bs.innerHTML = (d.dang_bo_sung || []).map(function (x) {
            return '<li>' + an(x) + '</li>';
          }).join('');
        }

        var cn = $('#wk-cap-nhat');
        if (cn && d.cap_nhat) {
          cn.textContent = 'Mục “Về quê” cập nhật ngày ' +
            d.cap_nhat.split('-').reverse().join('/') + '. Thấy sai thì nhắn anh chị sửa ngay.';
        }
      })
      .catch(function () {
        var hop = $('#wk-bang-xe');
        if (hop) {
          hop.innerHTML = '<p class="wk-trong-rong">Chưa tải được danh sách tuyến xe. ' +
            'Em thử tải lại trang giúp anh chị nhé.</p>';
        }
      });
  }

  /* ---------------- Món quê ---------------- */
  function veMonQue() {
    var hop = $('#wk-mon-que');
    if (!hop) return;

    function ve(dl) {
      var ds = (dl.mon || []).filter(function (m) { return m.kieu === 'que'; });
      hop.innerHTML = ds.map(function (m) {
        var cho = (m.goi_y_cho || '').trim();
        return '<div class="wk-mon" data-tim="' + an((m.ten + ' ' + (m.mo_ta || '')).toLowerCase()) + '">' +
          '<div class="wk-mon-ten">' + an(m.icon || '') + ' ' + an(m.ten) + '</div>' +
          (m.mo_ta ? '<p class="wk-mon-mota">' + an(m.mo_ta) + '</p>' : '') +
          (cho
            ? '<p class="wk-mon-cho">📍 ' + an(cho) + '</p>'
            : '<p class="wk-mon-cho trong">chưa có quán, em biết chỗ ngon thì mách anh chị</p>') +
        '</div>';
      }).join('');
    }

    if (window.DU_LIEU_MON_AN && window.DU_LIEU_MON_AN.mon) {
      ve(window.DU_LIEU_MON_AN);
    } else {
      fetch('data/mon-an.json').then(function (r) { return r.json(); }).then(ve).catch(function () {});
    }
  }

  /* ---------------- Điều hướng bên trái ---------------- */
  function theoDoiMuc() {
    var lien = [].slice.call(document.querySelectorAll('#wk-menu a'));
    var muc = lien.map(function (a) { return document.getElementById(a.getAttribute('data-muc')); })
                  .filter(Boolean);
    if (!muc.length) return;

    // Tính theo vị trí cuộn chứ không dùng IntersectionObserver: máy nào bật
    // "giảm chuyển động" hoặc treo vòng lặp vẽ thì observer không bắn, mục sẽ
    // không bao giờ sáng lên.
    var dang_cho = false;

    function cham() {
      dang_cho = false;
      var moc = window.scrollY + 140;        // vạch ngắm ngay dưới thanh đầu trang
      var chon = muc[0];
      muc.forEach(function (m) {
        if (m.getBoundingClientRect().top + window.scrollY <= moc) chon = m;
      });
      lien.forEach(function (a) {
        a.classList.toggle('dang-o-day', a.getAttribute('data-muc') === chon.id);
      });
    }

    function hen() {
      if (dang_cho) return;
      dang_cho = true;
      setTimeout(cham, 80);
    }

    window.addEventListener('scroll', hen, { passive: true });
    window.addEventListener('resize', hen);

    // Bấm vào mục thì sáng ngay, khỏi chờ cuộn xong
    lien.forEach(function (a) {
      a.addEventListener('click', function () {
        lien.forEach(function (b) { b.classList.toggle('dang-o-day', b === a); });
      });
    });

    cham();
  }

  /* ---------------- Tìm trong wiki ---------------- */
  function tim() {
    var o = $('#wk-o-tim');
    if (!o) return;
    var hen = null;

    o.addEventListener('input', function () {
      clearTimeout(hen);
      hen = setTimeout(function () {
        var tu = o.value.trim().toLowerCase();
        var khoi = [].slice.call(document.querySelectorAll('[data-tim]'));

        if (!tu) {
          khoi.forEach(function (k) { k.classList.remove('wk-an-tim'); });
          document.querySelectorAll('.wk-muc').forEach(function (m) { m.classList.remove('wk-an-tim'); });
          var bao = $('#wk-khong-thay');
          if (bao) bao.remove();
          return;
        }

        var con = 0;
        khoi.forEach(function (k) {
          var hop = k.getAttribute('data-tim').indexOf(tu) >= 0;
          k.classList.toggle('wk-an-tim', !hop);
          if (hop) con++;
        });

        // mục nào không còn khối nào khớp thì ẩn luôn cho đỡ rối
        document.querySelectorAll('.wk-muc').forEach(function (m) {
          var co = m.querySelectorAll('[data-tim]:not(.wk-an-tim)').length;
          var coKhoi = m.querySelectorAll('[data-tim]').length;
          m.classList.toggle('wk-an-tim', coKhoi > 0 && co === 0);
        });

        var cu = $('#wk-khong-thay');
        if (cu) cu.remove();
        if (!con) {
          var p = document.createElement('p');
          p.id = 'wk-khong-thay';
          p.className = 'wk-khong-thay';
          p.textContent = 'Không thấy “' + o.value.trim() + '” trong sổ tay. ' +
            'Có thể anh chị chưa viết tới — nhắn fanpage để anh chị bổ sung nhé.';
          $('#wk-chinh').prepend(p);
        }
      }, 140);
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    demNguoc();
    napXe();
    veMonQue();
    theoDoiMuc();
    tim();
  });
})();
