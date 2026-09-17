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
    document.title = '37FTU tuyển thành viên ' + (ND.the_he || '');
    if (ND.tieu_de) $('#hero-tieu-de').textContent = ND.tieu_de;
    if (ND.phu_de) $('#hero-phu').textContent = ND.phu_de;
    $('#chip-chu').textContent = (CH.DANG_MO_DON ? 'Đang mở đơn · ' : 'Đã đóng đơn · ') + (ND.the_he || '');

    var sl = $('#so-lieu');
    (ND.so_lieu || []).forEach(function (x) {
      sl.appendChild(el('div', '', '<b>' + an(x.so) + '</b><span>' + an(x.nhan) + '</span>'));
    });

    var gt = $('#gia-tri');
    (ND.gia_tri || []).forEach(function (x, i) {
      var t = el('div', 'the');
      t.setAttribute('data-so', '0' + (i + 1));
      t.innerHTML = '<h3>' + an(x.ten) + '</h3><p>' + an(x.mo_ta) + '</p>';
      gt.appendChild(t);
    });

    var bt = $('#bon-t');
    (ND.quy_tac_4t || []).forEach(function (x) {
      bt.appendChild(el('div', '', '<b>' + an(x.chu) + '</b><span>' + an(x.y) + '</span>'));
    });

    var cb = $('#cac-ban-luoi');
    (ND.cac_ban || []).forEach(function (b) {
      var hoc = (b.hoc_duoc || []).map(function (h) { return '<li>' + an(h) + '</li>'; }).join('');
      cb.appendChild(el('div', 'the ban',
        '<span class="biet-danh">' + an(b.biet_danh || '') + '</span>' +
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

    var lt = $('#lo-trinh');
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
        chu.textContent = 'Đã hết hạn nộp đơn ' + ND.the_he + '. Hẹn em mùa sau nhé!';
        return;
      }
      hop.hidden = false;
      var g = Math.floor(con / 1000);
      $('#dn-ngay').textContent = Math.floor(g / 86400);
      $('#dn-gio').textContent = String(Math.floor(g / 3600) % 24).padStart(2, '0');
      $('#dn-phut').textContent = String(Math.floor(g / 60) % 60).padStart(2, '0');
      $('#dn-giay').textContent = String(g % 60).padStart(2, '0');
      chu.textContent = 'còn lại để nộp đơn — hạn chót ' + han.toLocaleString('vi-VN', {
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
    ho_ten: function (v) { return v.trim().length >= 3 && v.trim().indexOf(' ') > 0; },
    mssv: function (v) { return v.trim().length >= 6; },
    khoa: function (v) { return !!v; },
    khoa_vien: function (v) { return v.trim().length >= 2; },
    sdt: function (v) { return /^(0|\+84)\d{8,10}$/.test(v.replace(/[\s.\-()]/g, '')); },
    email: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()); },
    facebook: function (v) { return v.trim().length >= 5; },
    que: function (v) { return !!v.trim(); },
    nv1: function (v) { return !!v; },
    ly_do: function (v) { return v.trim().length >= 80; },
    biet_qua: function (v) { return !!v; }
  };

  function datLoi(ten, co) {
    var o = document.querySelector('[data-truong="' + ten + '"]');
    if (o) o.classList.toggle('co-loi', !!co);
  }

  function layDuLieu() {
    var d = {};
    ['ho_ten', 'ngay_sinh', 'mssv', 'khoa', 'khoa_vien', 'sdt', 'email', 'facebook', 'que',
      'nv1', 'nv2', 'ly_do', 'diem_manh', 'biet_qua', 'nguoi_gioi_thieu'].forEach(function (k) {
      var n = document.getElementById(k);
      d[k] = n ? String(n.value || '').trim() : '';
    });
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

  function guiSupabase(ban_ghi) {
    return fetch(CH.SUPABASE_URL.replace(/\/$/, '') + '/rest/v1/' + (CH.BANG_UNG_VIEN || 'g16_ung_vien'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': CH.SUPABASE_ANON_KEY,
        'Authorization': 'Bearer ' + CH.SUPABASE_ANON_KEY,
        'Prefer': 'return=minimal'
      },
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
      $('#dem-chu-ly-do').textContent = lyDo.value.trim().length;
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var d = layDuLieu();
      var hong = kiemTra(d);
      if (hong.length) {
        var o = document.querySelector('[data-truong="' + hong[0] + '"]');
        if (o) { o.scrollIntoView({ behavior: 'smooth', block: 'center' }); var i = o.querySelector('input,select,textarea'); if (i) i.focus({ preventScroll: true }); }
        thongBao('tb-loi', 'Còn ' + hong.length + ' ô chưa hợp lệ, em xem lại giúp nhé.');
        return;
      }
      $('#tb-he-thong').innerHTML = '';

      var ban_ghi = Object.assign({}, d, {
        the_he: ND.the_he || 'Gen 16',
        nguon: nguonTruyCap(),
        gui_luc: new Date().toISOString(),
        trang_thai: 'moi'
      });

      nut.disabled = true;
      nut.textContent = 'Đang gửi...';

      var xong = function () {
        form.hidden = true;
        $('#email-xac-nhan').textContent = d.email;
        $('#man-xong').hidden = false;
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
  });
})();
