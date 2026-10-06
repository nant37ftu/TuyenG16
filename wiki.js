/* ============================================================
   NGHỆ WIKI — mỗi lần mở đúng một mục, bấm bên trái thì đổi.
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
      ? '<span class="wk-cho wk-cho-kiem">anh chị đã kiểm</span>'
      : '<span class="wk-cho">chưa kiểm xong</span>';

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
      (t.nguon ? '<p class="wk-xe-nguon">Anh chị xem ở: ' + an(t.nguon) + '</p>' : '') +
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
        ' trong sổ tay. Em biết nhà xe mô thì nhắn fanpage giúp anh chị nha.</p>';
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
          cn.textContent = 'Mục “Về quê” anh chị xem lại lần cuối ngày ' +
            d.cap_nhat.split('-').reverse().join('/') + '. Thấy chỗ mô sai thì nhắn, anh chị sửa ngay.';
        }
      })
      .catch(function () {
        var hop = $('#wk-bang-xe');
        if (hop) {
          hop.innerHTML = '<p class="wk-trong-rong">Chưa tải được danh sách tuyến xe. ' +
            'Em thử tải lại trang giúp anh chị nha.</p>';
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
            : '<p class="wk-mon-cho trong">chưa có quán — em biết chỗ ngon thì mách anh chị với</p>') +
        '</div>';
      }).join('');
    }

    if (window.DU_LIEU_MON_AN && window.DU_LIEU_MON_AN.mon) {
      ve(window.DU_LIEU_MON_AN);
    } else {
      fetch('data/mon-an.json').then(function (r) { return r.json(); }).then(ve).catch(function () {});
    }
  }

  /* ---------------- Mỗi lần một mục ---------------- */
  var LIEN = [], MUC = [], dang_tim = false;

  function lenDau() {
    // đổi mục thì kéo hẳn lên đầu trang, khỏi cắt ngang tiêu đề
    if (window.scrollY > 0) window.scrollTo(0, 0);
  }

  function veMucTiep(id) {
    var o = $('#wk-tiep');
    if (!o) return;
    var i = MUC.indexOf(id);
    var sau = i >= 0 && i < MUC.length - 1 ? MUC[i + 1] : null;
    if (!sau) { o.hidden = true; return; }
    var ten = LIEN[i + 1] ? LIEN[i + 1].getAttribute('data-ten') : sau;
    o.hidden = false;
    o.innerHTML = '<span>Đọc tiếp cho đủ bộ</span>' +
      '<a href="#' + sau + '" data-muc="' + sau + '">' + an(ten) + ' →</a>';
    o.querySelector('a').addEventListener('click', function (e) {
      e.preventDefault();
      moMuc(sau, true);
    });
  }

  function moMuc(id, cuon) {
    if (MUC.indexOf(id) < 0) id = MUC[0];

    MUC.forEach(function (m) {
      var el = document.getElementById(m);
      if (el) el.hidden = (m !== id);
    });
    LIEN.forEach(function (a) {
      var o = a.getAttribute('data-muc') === id;
      a.classList.toggle('dang-o-day', o);
      if (o) { a.setAttribute('aria-current', 'true'); } else { a.removeAttribute('aria-current'); }
    });

    veMucTiep(id);

    if (history.replaceState) {
      history.replaceState(null, '', '#' + id);
    } else {
      location.hash = id;
    }

    if (cuon) lenDau();
  }

  function chonMuc() {
    LIEN = [].slice.call(document.querySelectorAll('#wk-menu a'));
    MUC = LIEN.map(function (a) { return a.getAttribute('data-muc'); })
              .filter(function (m) { return document.getElementById(m); });
    if (!MUC.length) return;

    LIEN.forEach(function (a) {
      a.addEventListener('click', function (e) {
        e.preventDefault();
        var o = $('#wk-o-tim');
        if (o && o.value) { o.value = ''; thoiTim(); }
        moMuc(a.getAttribute('data-muc'), true);
      });
    });

    window.addEventListener('hashchange', function () {
      if (dang_tim) return;
      moMuc((location.hash || '').slice(1), true);
    });

    // vào trang (kể cả link chia sẻ kèm #cho-o) thì luôn bắt đầu từ đầu trang,
    // để em thấy bìa rồi mới tới mục, khỏi bị trình duyệt nhảy lung tung
    // Mục bị ẩn lúc tải nên trình duyệt chưa nhảy tới #... được; khi JS mở mục
    // ra thì nó mới nhảy, nên phải kéo lại đầu trang thêm vài nhịp nữa.
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    moMuc((location.hash || '').slice(1), false);
    window.scrollTo(0, 0);
    setTimeout(function () { window.scrollTo(0, 0); }, 0);
    setTimeout(function () { window.scrollTo(0, 0); }, 150);
  }

  /* ---------------- Tìm trong cả sổ tay ---------------- */
  function thoiTim() {
    dang_tim = false;
    document.querySelectorAll('.wk-an-tim').forEach(function (k) { k.classList.remove('wk-an-tim'); });
    var bao = $('#wk-bao-tim'); if (bao) bao.remove();
    var khong = $('#wk-khong-thay'); if (khong) khong.remove();
    var tiep = $('#wk-tiep'); if (tiep) tiep.hidden = false;
    moMuc((location.hash || '').slice(1), false);
  }

  function tim() {
    var o = $('#wk-o-tim');
    if (!o) return;
    var hen = null;

    o.addEventListener('input', function () {
      clearTimeout(hen);
      hen = setTimeout(function () {
        var tu = o.value.trim().toLowerCase();

        if (!tu) { thoiTim(); return; }

        // đang tìm thì mở hết các mục ra, không thì tìm được mà không thấy
        dang_tim = true;
        MUC.forEach(function (m) {
          var el = document.getElementById(m);
          if (el) el.hidden = false;
        });
        var tiep = $('#wk-tiep'); if (tiep) tiep.hidden = true;

        var con = 0;
        document.querySelectorAll('[data-tim]').forEach(function (k) {
          var hop = k.getAttribute('data-tim').indexOf(tu) >= 0;
          k.classList.toggle('wk-an-tim', !hop);
          if (hop) con++;
        });

        // mục nào không còn khối nào khớp thì ẩn luôn cho đỡ rối
        document.querySelectorAll('.wk-muc').forEach(function (m) {
          var coKhoi = m.querySelectorAll('[data-tim]').length;
          var conLai = m.querySelectorAll('[data-tim]:not(.wk-an-tim)').length;
          m.classList.toggle('wk-an-tim', coKhoi > 0 && conLai === 0);
        });

        var bao = $('#wk-bao-tim');
        if (!bao) {
          bao = document.createElement('div');
          bao.id = 'wk-bao-tim';
          bao.className = 'wk-bao-tim';
          $('#wk-chinh').prepend(bao);
        }
        bao.innerHTML = '<span></span><button type="button">Xem lại cả sổ tay</button>';
        bao.querySelector('span').textContent = con
          ? 'Đang tìm “' + o.value.trim() + '” trong cả sổ tay — thấy ' + con + ' chỗ.'
          : 'Đang tìm “' + o.value.trim() + '” trong cả sổ tay.';
        bao.querySelector('button').addEventListener('click', function () {
          o.value = '';
          thoiTim();
        });

        var cu = $('#wk-khong-thay');
        if (cu) cu.remove();
        if (!con) {
          var p = document.createElement('p');
          p.id = 'wk-khong-thay';
          p.className = 'wk-khong-thay';
          p.textContent = 'Chưa thấy “' + o.value.trim() + '” trong sổ tay. ' +
            'Chắc anh chị chưa viết tới — em nhắn fanpage một tiếng, anh chị bổ sung nha.';
          bao.after(p);
        }
      }, 140);
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    demNguoc();
    napXe();
    veMonQue();
    chonMuc();
    tim();
  });
})();
