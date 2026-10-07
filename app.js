/* 37FTU Gen 16 — logic trang tuyển thành viên
   Không dùng framework: chỉ cần mở file hoặc đẩy lên hosting tĩnh là chạy. */
(function () {
  'use strict';
  var CH = window.CAU_HINH || {};
  var ND = window.NOI_DUNG || {};
  var $ = function (s) { return document.querySelector(s); };
  var el = function (tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  };
  var an = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };

  /* ---------------- Đổ nội dung từ noi-dung.js ---------------- */
  function veNoiDung() {
    document.title = '37FTU · Nghệ Sĩ Nhí — Tuyển thành viên ' + (ND.the_he || 'Gen 16');
    var ht = $('#hero-tieu-de');
    if (ht && !ht.querySelector('.chu-nghe') && ND.tieu_de) {
      ht.textContent = ND.tieu_de;
    }
    if (ND.phu_de && $('#hero-phu')) $('#hero-phu').textContent = ND.phu_de;
    var chip = $('#chip-chu');
    if (chip) chip.textContent = (CH.DANG_MO_DON ? 'Đang mở đơn · ' : 'Đã đóng đơn · ') + (ND.the_he || 'Gen 16') + ' · Nghệ Sĩ Nhí';

    var sl = $('#so-lieu');
    (ND.so_lieu || []).forEach(function (x) {
      sl.appendChild(el('div', '', '<b>' + an(x.so) + '</b><span>' + an(x.nhan) + '</span>'));
    });

    var gt = $('#gia-tri');
    (ND.gia_tri || []).forEach(function (x, i) {
      var t = el('div', 'the');
      t.setAttribute('data-so', '0' + (i + 1));
      t.innerHTML = '<h3>' + an(x.ten) + '</h3><p>' + x.mo_ta + '</p>';
      gt.appendChild(t);
    });

    var bt = $('#bon-t');

if (bt) {
  (ND.quy_tac_4t || []).forEach(function (x) {
    bt.appendChild(
      el('div', '', '<b>' + an(x.chu) + '</b><span>' + an(x.y) + '</span>')
    );
  });
}

    var cb = $('#cac-ban-luoi');
    (ND.cac_ban || []).forEach(function (b) {
      var hoc = (b.hoc_duoc || []).map(function (h) { return '<li>' + an(h) + '</li>'; }).join('');
      var hinhHtml = b.anh ? '<div class="ban-anh-wrap"><img class="ban-anh" src="' + an(b.anh) + '" alt="' + an(b.ten) + '"></div>' : '';
      cb.appendChild(el('div', 'the ban',
        '<span class="biet-danh">' + an(b.biet_danh || '') + '</span>' +
        hinhHtml +
        '<h3>' + an(b.ten) + '</h3>' +
        '<p class="tom-tat">' + an(b.tom_tat || '') + '</p>' +
        '<p>' + an(b.mo_ta || '') + '</p>' +
        (hoc ? '<ul>' + hoc + '</ul>' : '') +
        '<div class="hop-voi">' + an(b.hop_voi || '') + '</div>'));
    });

    var nd = $('#nhan-duoc');
    (ND.nhan_duoc || []).forEach(function (x) {
      nd.appendChild(el('div', 'the', '<h3>' + an(x.ten) + '</h3><p>' + an(x.mo_ta) + '</p>'));
    });

    var lt = $('#lo-trinh-danh-sach');
    (ND.vong_tuyen || []).forEach(function (v, i) {
      lt.appendChild(el('div', 'buoc',
        '<div class="so">' + (i + 1) + '</div>' +
        '<div><div class="khi">' + an(v.thoi_gian) + '</div><h3>' + an(v.ten) + '</h3><p>' + an(v.mo_ta) + '</p></div>'));
    });

    var ch = $('#cau-hoi-ds');
    (ND.cau_hoi || []).forEach(function (c) {
      ch.appendChild(el('details', '', '<summary>' + an(c.hoi) + '</summary><p>' + an(c.dap) + '</p>'));
    });

    var lh = $('#chan-lien-he');
    if (CH.FANPAGE) lh.appendChild(el('div', '', '<a href="' + an(CH.FANPAGE) + '" target="_blank" rel="noopener">Fanpage 37FTU</a>'));
    if (CH.EMAIL) lh.appendChild(el('div', '', '<a href="mailto:' + an(CH.EMAIL) + '">' + an(CH.EMAIL) + '</a>'));
    if (CH.HOTLINE) lh.appendChild(el('div', '', an(CH.HOTLINE)));
    $('#nut-fanpage').href = CH.FANPAGE || '#';

    // Ban cho ô nguyện vọng
    (ND.cac_ban || []).forEach(function (b) {
      $('#nv1').appendChild(new Option(b.ten, b.ten));
      $('#nv2').appendChild(new Option(b.ten, b.ten));
    });
    (ND.kenh_biet_den || []).forEach(function (k) {
      $('#biet_qua').appendChild(new Option(k, k));
    });
  }

  /* ---------------- Danh sách quê (lấy từ dữ liệu bản đồ) ---------------- */
  function veQue() {
    var sel = $('#que');
    fetch('data/nghe-an.json')
      .then(function (r) { return r.json(); })
      .then(function (bd) {
        (bd.units || []).forEach(function (u) { sel.appendChild(new Option(u.name, u.name)); });
        sel.appendChild(new Option('Nơi khác (ngoài Nghệ An)', 'Nơi khác'));
      })
      .catch(function () {
        // Mở bằng file:// thì fetch có thể bị chặn — vẫn cho nhập tay
        var o = document.createElement('input');
        o.id = 'que'; o.name = 'que'; o.placeholder = 'Ví dụ: Yên Thành';
        sel.parentNode.replaceChild(o, sel);
      });
  }

  /* ---------------- Đếm ngược ---------------- */
  function demNguoc() {
    var han = CH.HAN_NOP_DON ? new Date(CH.HAN_NOP_DON) : null;
    if (!han || isNaN(han)) return;
    var hop = $('#dem-nguoc'), chu = $('#dem-chu');
    function ve() {
      var con = han - new Date();
      if (con <= 0) {
        hop.hidden = true;
        chu.textContent = 'Đã hết hạn đăng kí ' + ND.the_he + '. Hẹn em mùa sau nhé!';
        return;
      }
      hop.hidden = false;
      var g = Math.floor(con / 1000);
      $('#dn-ngay').textContent = Math.floor(g / 86400);
      $('#dn-gio').textContent = String(Math.floor(g / 3600) % 24).padStart(2, '0');
      $('#dn-phut').textContent = String(Math.floor(g / 60) % 60).padStart(2, '0');
      $('#dn-giay').textContent = String(g % 60).padStart(2, '0');
      chu.textContent = 'Còn lại để đăng kí — Hạn cuối điền đơn: ' + han.toLocaleString('vi-VN', {
  day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
});
      setTimeout(ve, 1000);
    }
    ve();
  }

  /* ---------------- Ghi nhớ nguồn truy cập (UTM) ---------------- */
  function nguonTruyCap() {
    var p = new URLSearchParams(location.search);
    var moi = {};
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'ref'].forEach(function (k) {
      if (p.get(k)) moi[k] = p.get(k).slice(0, 80);
    });
    var cu = {};
    try { cu = JSON.parse(localStorage.getItem('g16_nguon') || '{}'); } catch (e) {}
    if (Object.keys(moi).length) {
      moi.tham_lan_dau = cu.tham_lan_dau || new Date().toISOString();
      try { localStorage.setItem('g16_nguon', JSON.stringify(moi)); } catch (e) {}
      return moi;
    }
    if (!cu.tham_lan_dau) {
      cu.tham_lan_dau = new Date().toISOString();
      cu.referrer = document.referrer ? document.referrer.slice(0, 200) : '';
      try { localStorage.setItem('g16_nguon', JSON.stringify(cu)); } catch (e) {}
    }
    return cu;
  }

  /* ---------------- Kiểm tra và gửi đơn ---------------- */
  var QUY_TAC = {
    ho_ten: function (v) { return !!v.trim(); },
    mssv: function (v) { return v.trim().length >= 6; },
    khoa: function (v) { return !!v; },
    ngay_sinh: function (v) { var d = new Date(v + 'T00:00:00'); return /^\d{4}-\d{2}-\d{2}$/.test(v) && !isNaN(d.getTime()) && d <= new Date(); },
    sdt: function (v) { return !!v.trim(); },
    email: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()); },
    facebook: function (v) { return v.trim().length >= 5; },
    que: function (v) { return !!v.trim(); },
    nv1: function (v) { return !!v; },
    biet_qua: function (v) { return !!v; }
  };

  function datLoi(ten, co) {
    var o = document.querySelector('[data-truong="' + ten + '"]');
    if (o) o.classList.toggle('co-loi', !!co);
  }

  function layDuLieu() {
    var d = {};
    ['ho_ten', 'ngay_sinh', 'mssv', 'khoa', 'khoa_vien', 'sdt', 'email', 'facebook', 'que',
      'nv1', 'nv2', 'ly_do', 'diem_manh', 'biet_qua', 'nguoi_gioi_thieu', 'cau_hoi'].forEach(function (k) {
      var n = document.getElementById(k);
      d[k] = n ? String(n.value || '').trim() : '';
    });
    // Giữ tương thích bảng hiện có; lưu riêng từng câu trả lời trong nguon ở dưới.
    d.diem_manh = 'Ba tính từ: ' + document.getElementById('ba_tinh_tu').value.trim() + '\n\nTrải nghiệm ngoại khóa: ' + document.getElementById('trai_nghiem').value.trim();
    return d;
  }

  function kiemTra(d) {
    var hong = [];
    Object.keys(QUY_TAC).forEach(function (k) {
      var ok = QUY_TAC[k](d[k] || '');
      datLoi(k, !ok);
      if (!ok) hong.push(k);
    });
    var nv2Hong = d.nv2 && d.nv2 === d.nv1;
    datLoi('nv2', nv2Hong);
    if (nv2Hong) hong.push('nv2');
    var chuaDongY = !document.getElementById('dong_y').checked;
    datLoi('dong_y', chuaDongY);
    if (chuaDongY) hong.push('dong_y');
    return hong;
  }

  function thongBao(loai, html) {
    var hop = $('#tb-he-thong');
    hop.innerHTML = '<div class="thong-bao ' + loai + '">' + html + '</div>';
  }

  /* Khoá publishable (sb_publishable_…) không phải JWT: chỉ gửi ở header apikey —
     gửi cả ở Authorization: Bearer thì Supabase coi là JWT hỏng và từ chối.
     Khoá anon kiểu cũ là JWT (bắt đầu bằng eyJ) thì gửi thêm Authorization như xưa. */
  function dauSupabase() {
    var k = CH.SUPABASE_ANON_KEY || '';
    var h = { 'Content-Type': 'application/json', apikey: k, Prefer: 'return=minimal' };
    if (/^eyJ/.test(k)) h.Authorization = 'Bearer ' + k;
    return h;
  }

  function guiSupabase(ban_ghi) {
    return fetch(CH.SUPABASE_URL.replace(/\/$/, '') + '/rest/v1/' + (CH.BANG_UNG_VIEN || 'g16_ung_vien'), {
      method: 'POST',
      headers: dauSupabase(),
      body: JSON.stringify(ban_ghi)
    }).then(function (r) {
      if (!r.ok) return r.text().then(function (t) { throw new Error(t || ('HTTP ' + r.status)); });
      return true;
    });
  }

  function luuTam(ban_ghi) {
    var ds = [];
    try { ds = JSON.parse(localStorage.getItem('g16_don_thu') || '[]'); } catch (e) {}
    ds.push(ban_ghi);
    try { localStorage.setItem('g16_don_thu', JSON.stringify(ds)); } catch (e) {}
  }

  function gan() {
    var form = $('#don');
    var nut = $('#nut-gui');
    var coBackend = !!(CH.SUPABASE_URL && CH.SUPABASE_ANON_KEY);

    if (!CH.DANG_MO_DON) {
      form.hidden = true;
      thongBao('tb-cho', 'Đợt nhận đơn ' + an(ND.the_he || '') + ' đã khép lại. Em theo dõi fanpage để đón mùa tuyển tiếp theo nhé.');
      return;
    }
    if (!coBackend) {
      thongBao('tb-cho', '<b>Chế độ thử:</b> trang chưa nối với Supabase nên đơn chỉ lưu tạm trong trình duyệt này. ' +
        'BTC xem hướng dẫn nối trong README.md trước khi công bố.' +
        (CH.LINK_FORM_DU_PHONG ? ' Hoặc dùng <a href="' + an(CH.LINK_FORM_DU_PHONG) + '" target="_blank" rel="noopener">form dự phòng</a>.' : ''));
    }

    var lyDo = document.getElementById('ly_do');
    lyDo.addEventListener('input', function () {
      var demChu = $('#dem-chu-ly-do');
      if (demChu) demChu.textContent = lyDo.value.trim().length;
    });

    // Tự động xoá cảnh báo lỗi ngay khi người dùng điền dữ liệu hợp lệ
    function xoaLoiKhiNhap(e) {
      var el = e.target;
      var hop = el.closest('[data-truong]');
      if (!hop) return;
      var ten = hop.getAttribute('data-truong');
      if (!ten) return;

      if (ten === 'dong_y') {
        if (el.checked) datLoi('dong_y', false);
        return;
      }
      if (ten === 'nv2') {
        var nv1Val = (document.getElementById('nv1') || {}).value || '';
        if (!el.value || el.value !== nv1Val) datLoi('nv2', false);
        return;
      }
      if (QUY_TAC[ten]) {
        if (QUY_TAC[ten](el.value || '')) datLoi(ten, false);
      } else {
        datLoi(ten, false);
      }
    }
    form.addEventListener('input', xoaLoiKhiNhap);
    form.addEventListener('change', xoaLoiKhiNhap);

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var d = layDuLieu();
      var hong = kiemTra(d);
      if (hong.length) {
        var o = document.querySelector('[data-truong="' + hong[0] + '"]');
        if (o) { o.scrollIntoView({ behavior: 'smooth', block: 'center' }); var i = o.querySelector('input,select,textarea'); if (i) i.focus({ preventScroll: true }); }
        thongBao('tb-loi', 'Còn ' + hong.length + ' ô chưa hợp lệ, em xem lại nhé.');
        return;
      }
      $('#tb-he-thong').innerHTML = '';

      var ban_ghi = Object.assign({}, d, {
        the_he: ND.the_he || 'Gen 16',
        nguon: Object.assign({}, nguonTruyCap(), { cau_tra_loi: {
          ba_tinh_tu: document.getElementById('ba_tinh_tu').value.trim(),
          trai_nghiem: document.getElementById('trai_nghiem').value.trim()
        } }),
        gui_luc: new Date().toISOString(),
        trang_thai: 'moi'
      });

      nut.disabled = true;
      nut.textContent = 'Đang gửi...';

      var xong = function () {
        $('#email-xac-nhan').textContent = d.email;
        if (window.ChuyenCanh) {
          ChuyenCanh.doiMan(form, $('#man-xong'));
        } else {
          form.hidden = true;
          $('#man-xong').hidden = false;
        }
        $('#man-xong').scrollIntoView({ behavior: 'smooth', block: 'center' });
      };

      if (!coBackend) { luuTam(ban_ghi); setTimeout(xong, 400); return; }

      guiSupabase(ban_ghi).then(xong).catch(function (err) {
        nut.disabled = false;
        nut.textContent = 'Gửi đơn ứng tuyển';
        luuTam(ban_ghi);
        thongBao('tb-loi', 'Gửi chưa được (' + an(String(err.message).slice(0, 120)) + '). ' +
          'Đơn của em đã lưu tạm trên máy, em thử lại sau ít phút hoặc nhắn cho fanpage giúp anh chị nhé.');
      });
    });
  }

  /* Đến từ trang trắc nghiệm: điền sẵn nguyện vọng 1 cho đỡ phải chọn lại */
  function nhanNguyenVong() {
    var nv = new URLSearchParams(location.search).get('nv1');
    if (!nv) return;
    var sel = document.getElementById('nv1');
    var co = [].slice.call(sel.options).some(function (o) { return o.value === nv; });
    if (!co) return;
    sel.value = nv;
    // nối thêm, không đè lên thông báo chế độ thử nếu có
    $('#tb-he-thong').insertAdjacentHTML('beforeend',
      '<div class="thong-bao tb-cho">Anh chị điền sẵn nguyện vọng 1 là <b>' + an(nv) + '</b> theo kết quả ' +
      'trắc nghiệm của em. Em đổi lại thoải mái nếu thấy chưa đúng.</div>');
  }

document.addEventListener('DOMContentLoaded', function () {
  veNoiDung();
  veQue();
  demNguoc();
  nguonTruyCap();
  gan();
  nhanNguyenVong();

  // Carousel hành trình
  var carousel = document.getElementById('hanh-trinh-carousel');
  var prev = document.querySelector('.carousel-prev');
  var next = document.querySelector('.carousel-next');

  if (carousel && prev && next) {

    next.addEventListener('click', function () {
      carousel.scrollBy({
        left: carousel.clientWidth * 0.85,
        behavior: 'smooth'
      });
    });

    prev.addEventListener('click', function () {
      carousel.scrollBy({
        left: -carousel.clientWidth * 0.85,
        behavior: 'smooth'
      });
    });

  }
});
})();
