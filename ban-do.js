/* Người Nghệ ở Ngoại thương — bản đồ theo quê + form thêm tên | 37FTU */
(function () {
  'use strict';
  var CH = window.CAU_HINH || {};
  var $ = function (s) { return document.querySelector(s); };
  var NS = 'http://www.w3.org/2000/svg';
  var an = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };
  /* Chỉ nhận link http(s) — chặn javascript: và các kiểu link lạ khác */
  function linkSach(u) {
    u = String(u || '').trim();
    return /^https?:\/\/[^\s]+$/i.test(u) ? u : '';
  }
  function khongDau(s) {
    return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase();
  }

  var BANDO = null;        // { width, height, units: [...] }
  var DULIEU = null;       // nội dung data/thanh-vien.json
  var NGUOI = [];          // người được nêu tên (đã lọc quyền công khai)
  var LOC = 'tat-ca';      // thế hệ đang lọc trên bản đồ
  var DANG_CHON = null;    // id huyện đang chọn

  var THANG = ['#FFF3EC', '#FFE9E0', '#FFC9B3', '#FB9A76', '#FA501E', '#A82F0D'];

  function tenHuyen(id) {
    var u = (BANDO && BANDO.units || []).filter(function (x) { return x.id === id; })[0];
    return u ? u.name : id;
  }

  function soCua(id) {
    var o = DULIEU && DULIEU.so_lieu && DULIEU.so_lieu[id];
    if (!o) return 0;
    if (LOC === 'tat-ca') return o.tong || 0;
    return (o.theo_the_he && o.theo_the_he[LOC]) || 0;
  }

  function theHeCua(p) { return p.gen ? 'G' + p.gen : ''; }

  /* Lớp màu theo cấp bậc — Sáng lập vàng, Lãnh đạo cam, Chấp hành xanh */
  function lopNhom(p) {
    return p.nhom === 'Sáng lập' ? 'ng-sl'
      : p.nhom === 'Ban Lãnh đạo' ? 'ng-ld'
      : p.nhom === 'Ban Chấp hành' ? 'ng-ch' : 'ng-tv';
  }

  function cacTheHe() {
    var t = {};
    Object.keys((DULIEU && DULIEU.so_lieu) || {}).forEach(function (id) {
      Object.keys(DULIEU.so_lieu[id].theo_the_he || {}).forEach(function (g) { t[g] = 1; });
    });
    NGUOI.forEach(function (p) { var g = theHeCua(p); if (g) t[g] = 1; });
    return Object.keys(t).sort(function (a, b) {
      return (parseInt(a.replace(/\D/g, ''), 10) || 0) - (parseInt(b.replace(/\D/g, ''), 10) || 0);
    });
  }

  /* Năm của nhiệm kỳ gần nhất — dùng để xếp người mới rời ghế lên trước */
  function namCuoi(p) {
    var m = /(\d{4})/.exec(String(p.nhiem_ky_cuoi || ''));
    return m ? parseInt(m[1], 10) : 0;
  }

  /* Thứ tự trong một huyện: Sáng lập → Ban Lãnh đạo → Ban Chấp hành → Thành viên,
     cùng nhóm thì chức cao trước, rồi người gắn bó lâu, rồi người gần đây.
     Phải khớp THU_TU_NHOM trong tools/tu-sheet.py — sửa cấp bậc ở admin là đổi thứ tự. */
  var THU_TU_NHOM = { 'Sáng lập': 0, 'Ban Lãnh đạo': 1, 'Ban Chấp hành': 2, 'Thành viên': 3 };
  function hangNhom(p) {
    return THU_TU_NHOM.hasOwnProperty(p.nhom) ? THU_TU_NHOM[p.nhom] : 9;
  }
  function xepNguoi(a, b) {
    var d = hangNhom(a) - hangNhom(b);
    if (d) return d;
    d = (b.bac || 0) - (a.bac || 0);
    if (d) return d;
    d = (b.thanh_tich || []).length - (a.thanh_tich || []).length;
    if (d) return d;
    d = (b.so_nhiem_ky || 0) - (a.so_nhiem_ky || 0);
    if (d) return d;
    d = namCuoi(b) - namCuoi(a);
    if (d) return d;
    return String(a.ten).localeCompare(String(b.ten), 'vi');
  }

  function mauCho(so, max) {
    if (!so) return THANG[0];
    var r = so / (max || 1);
    if (r <= 0.12) return THANG[1];
    if (r <= 0.3) return THANG[2];
    if (r <= 0.55) return THANG[3];
    if (r <= 0.8) return THANG[4];
    return THANG[5];
  }

  /* =====================================================================
     BẢN ĐỒ
     ===================================================================== */
  function veBanDo() {
    var svg = $('#bd-svg');
    svg.setAttribute('viewBox', '0 0 ' + BANDO.width + ' ' + BANDO.height);
    svg.innerHTML = '';

    var gVung = document.createElementNS(NS, 'g');
    var gChu = document.createElementNS(NS, 'g');
    svg.appendChild(gVung);
    svg.appendChild(gChu);

    BANDO.units.forEach(function (u) {
      var p = document.createElementNS(NS, 'path');
      p.setAttribute('d', u.d);
      p.setAttribute('data-id', u.id);
      p.setAttribute('tabindex', '0');
      p.setAttribute('role', 'button');
      gVung.appendChild(p);
      u._path = p;

      // Rê chuột không hiện hộp gì cả — chỉ đổi màu vùng. Muốn xem thì bấm.
      p.addEventListener('click', function () { chon(u.id); });
      p.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); chon(u.id); }
      });

      try { u._dt = p.getBBox().width * p.getBBox().height; } catch (e) { u._dt = 0; }
    });

    veNhan(gChu);
    veTimQue();
    toMau();
  }

  /* Ghi tên huyện lên bản đồ. Vùng đồng bằng ven biển nhỏ và sát nhau nên phải
     bỏ bớt nhãn chồng lên nhau — huyện rộng được ưu tiên giữ tên, huyện bị bỏ
     hiện tên khi được bấm chọn. */
  function veNhan(gChu) {
    gChu.innerHTML = '';
    var svg = $('#bd-svg');
    var diem = svg.createSVGPoint ? svg.createSVGPoint() : null;
    var daDat = [];
    var cao = 24, rongMoiKyTu = 7.2, dem = 6;
    BANDO.units.slice()
      .sort(function (a, b) { return (b._dt || 0) - (a._dt || 0); })
      .forEach(function (u) {
        if (!u.c) { u._text = null; return; }
        // Huyện hình lưỡi liềm (Quỳnh Lưu, Nghi Lộc...) có trọng tâm rơi ra ngoài đất liền
        if (diem && u._path.isPointInFill) {
          diem.x = u.c[0]; diem.y = u.c[1];
          try { if (!u._path.isPointInFill(diem)) { u._text = null; return; } } catch (e) {}
        }
        var rong = u.name.length * rongMoiKyTu + dem;
        var hop = { x1: u.c[0] - rong / 2, x2: u.c[0] + rong / 2, y1: u.c[1] - cao / 2, y2: u.c[1] + cao / 2 };
        var dungDo = daDat.some(function (h) {
          return !(hop.x2 < h.x1 || hop.x1 > h.x2 || hop.y2 < h.y1 || hop.y1 > h.y2);
        });
        if (dungDo) { u._text = null; return; }
        daDat.push(hop);
        var t = document.createElementNS(NS, 'text');
        t.setAttribute('x', u.c[0]);
        t.setAttribute('y', u.c[1]);
        t.setAttribute('text-anchor', 'middle');
        t.textContent = u.name;
        gChu.appendChild(t);
        u._text = t;
      });
  }

  function veTimQue() {
    var sel = document.getElementById('tim-que');
    if (!sel || sel.options.length > 1) return;
    BANDO.units.forEach(function (u) { sel.appendChild(new Option(u.name, u.id)); });
    sel.addEventListener('change', function () {
      if (!sel.value) return;
      chon(sel.value);
      var u = BANDO.units.filter(function (x) { return x.id === sel.value; })[0];
      if (u && u._path) {
        u._path.classList.add('dang-chon');
        if (window.matchMedia('(min-width:1000px)').matches) {
          $('#bd-svg').scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    });
  }

  function toMau() {
    var max = 0;
    BANDO.units.forEach(function (u) { max = Math.max(max, soCua(u.id)); });
    var tong = 0;
    BANDO.units.forEach(function (u) {
      var so = soCua(u.id);
      tong += so;
      var m = mauCho(so, max);
      u._path.setAttribute('fill', m);
      u._path.setAttribute('aria-label', u.name + ': ' + so + ' người');
      if (u._text) u._text.classList.toggle('nhat', m === THANG[4] || m === THANG[5]);
    });
    $('#tong-so').textContent = tong;
    $('#bd-phu').textContent = LOC === 'tat-ca'
      ? '21 huyện, thành, thị · theo tên đơn vị hành chính cũ'
      : 'đang xem riêng thế hệ ' + LOC;
    veXepHang();
  }

  function veXepHang() {
    var ds = BANDO.units.map(function (u) { return { u: u, so: soCua(u.id) }; })
      .filter(function (x) { return x.so > 0; })
      .sort(function (a, b) { return b.so - a.so; })
      .slice(0, 8);
    var max = ds.length ? ds[0].so : 1;
    var hop = $('#xep-hang');
    hop.innerHTML = '<div class="xh-dau">Quê đông người nhất</div>';
    if (!ds.length) {
      hop.innerHTML += '<p style="color:var(--muc-nhat);font-size:.92rem;margin:0">Chưa có số liệu cho thế hệ này.</p>';
      return;
    }
    ds.forEach(function (x, i) {
      var b = document.createElement('button');
      b.className = 'xh-dong';
      b.innerHTML = '<span class="xh-hang">' + (i + 1) + '</span>' +
        '<span><span class="xh-ten">' + an(x.u.name) + '</span>' +
        '<span class="xh-thanh" style="width:' + Math.max(6, Math.round(x.so / max * 100)) + '%;margin-top:4px;display:block"></span></span>' +
        '<span class="xh-so">' + x.so + '</span>';
      b.addEventListener('click', function () { chon(x.u.id); });
      hop.appendChild(b);
    });
  }

  /* Huyện nhỏ bị bỏ nhãn: khi được chọn thì ghi tên đè lên cho thấy rõ đang ở đâu */
  function nhanDangChon(u) {
    var svg = $('#bd-svg');
    var cu = svg.querySelector('#nhan-dang-chon');
    if (cu) cu.remove();
    if (!u || !u.c || u._text) return;
    var t = document.createElementNS(NS, 'text');
    t.id = 'nhan-dang-chon';
    t.setAttribute('x', u.c[0]);
    t.setAttribute('y', u.c[1]);
    t.setAttribute('text-anchor', 'middle');
    t.textContent = u.name;
    svg.appendChild(t);
  }

  function nguoiCuaQue(id) {
    return NGUOI.filter(function (p) {
      return p.que === id && (LOC === 'tat-ca' || theHeCua(p) === LOC);
    }).sort(xepNguoi);
  }

  function chon(id) {
    DANG_CHON = id;
    BANDO.units.forEach(function (u) { u._path.classList.toggle('dang-chon', u.id === id); });
    var u = BANDO.units.filter(function (x) { return x.id === id; })[0];
    if (!u) return;
    nhanDangChon(u);
    var o = (DULIEU.so_lieu || {})[id] || { tong: 0, theo_the_he: {} };
    var so = soCua(id);
    var ten_loai = u.kind === 'thanh-pho' ? 'Thành phố' : u.kind === 'thi-xa' ? 'Thị xã' : 'Huyện';

    var html = '<div class="ct-dau"><div>' +
      '<div class="ct-loai">' + ten_loai + '</div>' +
      '<div class="ct-ten">' + an(u.name) + '</div></div>' +
      '<button class="ct-dong" id="dong-ct" aria-label="Đóng">×</button></div>';

    if (so > 0) {
      html += '<div class="ct-so"><b>' + so + '</b><span>người con ' + an(u.name) + ' ở Ngoại thương' +
        (LOC === 'tat-ca' ? '' : ' (thế hệ ' + an(LOC) + ')') + '</span></div>';
      var theo = o.theo_the_he || {};
      var gs = Object.keys(theo).sort(function (x, y) {
        return (parseInt(x.replace(/\D/g, ''), 10) || 0) - (parseInt(y.replace(/\D/g, ''), 10) || 0);
      });
      var maxG = Math.max.apply(null, gs.map(function (g) { return theo[g]; }).concat([1]));
      if (gs.length) {
        html += '<div class="ct-cot"><div class="xh-dau">Theo thế hệ</div>';
        gs.forEach(function (g) {
          html += '<div class="d"><span class="g">' + an(g) + '</span>' +
            '<span class="t"><i style="width:' + Math.round(theo[g] / maxG * 100) + '%"></i></span>' +
            '<span class="xh-so">' + theo[g] + '</span></div>';
        });
        html += '</div>';
      }

      var ds = nguoiCuaQue(id);
      if (ds.length) {
        html += '<div class="ct-nguoi"><div class="xh-dau">Những người đi trước</div>' +
          '<div id="ds-nguoi">' + ds.slice(0, 6).map(theNhoNguoi).join('') + '</div></div>' +
          (ds.length > 6
            ? '<button class="nut nut-vien ct-xem-them" id="xem-them-nguoi" style="width:100%;margin-top:14px">' +
              'Xem thêm ' + (ds.length - 6) + ' người ' + an(u.name) + '</button>'
            : '');
      } else {
        html += '<div class="ct-trong"><p>Có người quê ' + an(u.name) + ' đấy, nhưng chưa ai ' +
          'trong số họ để lại tên. Em là người đầu tiên nhé?</p>' +
          '<a class="nut nut-chinh" href="#them-ten">Thêm tên em</a></div>';
      }
    } else {
      html += '<div class="ct-trong"><p>Chưa ghi nhận ai quê ' + an(u.name) + ' trong ' +
        (LOC === 'tat-ca' ? 'danh sách này' : 'thế hệ ' + an(LOC)) +
        '. Em có muốn là người đầu tiên đặt tên quê mình lên bản đồ không?</p>' +
        '<a class="nut nut-chinh" href="#them-ten">Thêm tên em</a></div>';
    }

    $('#panel-rong').hidden = true;
    var ct = $('#panel-chi-tiet');
    ct.hidden = false;
    ct.innerHTML = html;
    $('#dong-ct').addEventListener('click', function () {
      DANG_CHON = null;
      BANDO.units.forEach(function (x) { x._path.classList.remove('dang-chon'); });
      nhanDangChon(null);
      ct.hidden = true;
      $('#panel-rong').hidden = false;
    });
    var nutThem = $('#xem-them-nguoi');
    if (nutThem) nutThem.addEventListener('click', function () {
      $('#ds-nguoi').innerHTML = nguoiCuaQue(id).map(theNhoNguoi).join('');
      nutThem.remove();
    });

    if (window.matchMedia('(max-width:999px)').matches) {
      $('#panel').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  function veBoLoc() {
    var hop = $('#bo-loc');
    var ds = [{ id: 'tat-ca', ten: 'Tất cả thế hệ' }].concat(cacTheHe().map(function (g) {
      return { id: g, ten: g };
    }));
    ds.forEach(function (x) {
      var b = document.createElement('button');
      b.textContent = x.ten;
      b.setAttribute('aria-pressed', x.id === LOC ? 'true' : 'false');
      b.addEventListener('click', function () {
        LOC = x.id;
        hop.querySelectorAll('button').forEach(function (n) { n.setAttribute('aria-pressed', 'false'); });
        b.setAttribute('aria-pressed', 'true');
        toMau();
        if (DANG_CHON) chon(DANG_CHON);
      });
      hop.appendChild(b);
    });
  }

  /* =====================================================================
     NGƯỜI TRONG HUYỆN — thẻ từng người trong khung bên phải
     ===================================================================== */
  function chuDau(ten) {
    var t = String(ten || '?').trim().split(/\s+/);
    return (t[t.length - 1][0] || '?').toUpperCase();
  }

  /* Thẻ một người trong khung chi tiết huyện. Thành tích, lời nhắn, link do BTC
     điền ở admin.html — ai có thì thẻ dài thêm, không có thì chỉ một dòng. */
  function theNhoNguoi(p) {
    var tt = (p.thanh_tich || []).filter(Boolean);
    var lk = linkSach(p.lien_he);
    var them = '';
    if (tt.length || p.loi_nhan || lk) {
      them = '<div class="ng-nho-them">' +
        (tt.length ? '<ul class="ng-tt">' + tt.map(function (x) { return '<li>' + an(x) + '</li>'; }).join('') + '</ul>' : '') +
        (p.loi_nhan ? '<p class="ng-ln">“' + an(p.loi_nhan) + '”</p>' : '') +
        (lk ? '<a class="ng-lk" href="' + an(lk) + '" target="_blank" rel="noopener noreferrer nofollow">Kết nối qua Facebook ↗</a>' : '') +
        '</div>';
    }
    return '<div class="ng-nho ' + lopNhom(p) + '">' +
      '<span class="ng-chu ng-chu-nho">' + an(chuDau(p.ten)) + '</span>' +
      '<span class="ng-nho-chu"><b>' + an(p.ten) + '</b>' +
      '<span>' + [p.chuc_vu, p.ban && ('Ban ' + p.ban)].filter(Boolean).map(an).join(' · ') + '</span></span>' +
      '<span class="ng-nho-gen">' + an(theHeCua(p)) + '</span>' +
      them +
      '</div>';
  }

  /* Đổ danh sách huyện vào hai ô chọn: tìm nhanh trên bản đồ và ô trong form */
  function dungOChonQue() {
    var selTt = $('#tt-que');
    BANDO.units.forEach(function (u) {
      if (selTt) selTt.appendChild(new Option(u.name, u.id));
    });
  }

  /* =====================================================================
     FORM "THÊM TÊN EM"
     ===================================================================== */
  var QUY_TAC = {
    ten: function (v) { return v.trim().length >= 3 && v.trim().indexOf(' ') > 0; },
    que_id: function (v) { return !!v; },
    truong_thpt: function (v) { return v.trim().length >= 3; },
    khoa_hoc: function (v) { return v.trim().length >= 2; },
    lien_he: function (v) { return !v.trim() || !!linkSach(v); },
    dong_y: function (v, el) { return el.checked; }
  };

  function oCua(ten) { return document.querySelector('.o[data-o="' + ten + '"]'); }

  function kiemTra(bao) {
    var loi = 0;
    Object.keys(QUY_TAC).forEach(function (k) {
      var el = document.querySelector('[name="' + k + '"]');
      var o = oCua(k);
      if (!el || !o) return;
      var ok = QUY_TAC[k](el.value || '', el);
      o.classList.toggle('co-loi', !ok && bao);
      if (!ok) loi++;
    });
    return loi;
  }

  function guiSupabase(du) {
    var url = (CH.SUPABASE_URL || '').replace(/\/$/, '');
    var bang = CH.BANG_BAN_DO_DANG_KY || 'ban_do_dang_ky';
    if (!url || !CH.SUPABASE_ANON_KEY) return Promise.reject(new Error('chua-noi'));
    return fetch(url + '/rest/v1/' + bang, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: CH.SUPABASE_ANON_KEY,
        Authorization: 'Bearer ' + CH.SUPABASE_ANON_KEY,
        Prefer: 'return=minimal'
      },
      body: JSON.stringify(du)
    }).then(function (r) {
      if (!r.ok) return r.text().then(function (t) { throw new Error(t || ('HTTP ' + r.status)); });
      return true;
    });
  }

  function luuTam(du) {
    try {
      var ds = JSON.parse(localStorage.getItem('37ftu_ban_do_tam') || '[]');
      ds.push(du);
      localStorage.setItem('37ftu_ban_do_tam', JSON.stringify(ds));
    } catch (e) {}
  }

  function dungForm() {
    var form = $('#form-ban-do');
    if (!form) return;
    var thu = !(CH.SUPABASE_URL && CH.SUPABASE_ANON_KEY);
    if (thu) {
      $('#tb-ban-do').innerHTML = '<div class="thong-bao tb-cho">' +
        '<b>Chế độ thử.</b> Chưa nối Supabase nên tên gửi ở đây chỉ lưu tạm trong máy em, ' +
        'ban tổ chức chưa nhận được. Xem README.md mục 3.</div>';
    }

    Object.keys(QUY_TAC).forEach(function (k) {
      var el = document.querySelector('[name="' + k + '"]');
      if (el) el.addEventListener('blur', function () { kiemTra(true); });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var loi = kiemTra(true);
      if (loi) {
        var dau = document.querySelector('.o.co-loi');
        if (dau) dau.scrollIntoView({ behavior: 'smooth', block: 'center' });
        $('#tb-ban-do').innerHTML = '<div class="thong-bao tb-loi">Còn ' + loi + ' ô chưa hợp lệ, em xem lại giúp anh chị.</div>';
        return;
      }
      var du = {
        ten: $('#tt-ten').value.trim(),
        que_id: $('#tt-que').value,
        que: tenHuyen($('#tt-que').value),
        truong_thpt: $('#tt-truong').value.trim(),
        khoa_hoc: $('#tt-khoa').value.trim(),
        nganh: $('#tt-nganh').value.trim(),
        the_he: $('#tt-the-he').value.trim(),
        gioi_thieu: $('#tt-gioi-thieu').value.trim(),
        lien_he: linkSach($('#tt-lien-he').value),
        dong_y: true,
        gui_luc: new Date().toISOString()
      };
      var nut = $('#nut-them');
      nut.disabled = true;
      nut.textContent = 'Đang gửi…';
      guiSupabase(du).catch(function () { luuTam(du); }).then(function () {
        form.hidden = true;
        $('#tb-ban-do').innerHTML = '';
        $('#tt-xong').hidden = false;
        $('#tt-xem-que').addEventListener('click', function () { chon(du.que_id); });
        $('#tt-xong').scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
    });
  }

  /* =====================================================================
     NẠP DỮ LIỆU
     ===================================================================== */
  function napSoLieu() {
    if (CH.BAN_DO_DUNG_SUPABASE && CH.SUPABASE_URL && CH.SUPABASE_ANON_KEY) {
      return fetch(CH.SUPABASE_URL.replace(/\/$/, '') + '/rest/v1/thanh_vien_que?select=*', {
        headers: { apikey: CH.SUPABASE_ANON_KEY, Authorization: 'Bearer ' + CH.SUPABASE_ANON_KEY }
      }).then(function (r) { return r.json(); }).then(function (rows) {
        var so = {};
        rows.forEach(function (r) {
          var id = r.que_id;
          if (!id) return;
          so[id] = so[id] || { ten: r.que || id, tong: 0, theo_the_he: {} };
          so[id].tong += 1;
          if (r.the_he) so[id].theo_the_he[r.the_he] = (so[id].theo_the_he[r.the_he] || 0) + 1;
        });
        return { la_du_lieu_mau: false, so_lieu: so, thanh_vien: rows };
      });
    }
    return fetch('data/thanh-vien.json').then(function (r) { return r.json(); });
  }

  function loi(msg) {
    $('#canh-bao-mau').innerHTML = '<div class="bao-mau">' + an(msg) + '</div>';
  }

  function veSoTong() {
    var tongNguoi = 0;
    Object.keys(DULIEU.so_lieu || {}).forEach(function (id) { tongNguoi += (DULIEU.so_lieu[id].tong || 0); });
    var soQue = Object.keys(DULIEU.so_lieu || {}).filter(function (id) { return DULIEU.so_lieu[id].tong > 0; }).length;
    var nk = {};
    NGUOI.forEach(function (p) { (p.nhiem_ky || []).forEach(function (x) { nk[x] = 1; }); });
    var soNk = Object.keys(nk).length;
    var o = [
      [DULIEU.tong_thanh_vien || tongNguoi, 'thành viên đã đi qua 37FTU'],
      [soNk, 'nhiệm kỳ đã ghi lại được'],
      [NGUOI.length, 'người đã có tên trên bản đồ'],
      [soQue + '/21', 'huyện, thành, thị đã có tên']
    ];
    $('#nn-so').innerHTML = o.map(function (x) {
      return '<div><b>' + an(x[0]) + '</b><span>' + an(x[1]) + '</span></div>';
    }).join('');
  }

  function chanTrang() {
    var h = [];
    if (CH.FANPAGE) h.push('<div><a href="' + an(CH.FANPAGE) + '" target="_blank" rel="noopener">Fanpage 37FTU</a></div>');
    if (CH.EMAIL) h.push('<div><a href="mailto:' + an(CH.EMAIL) + '">' + an(CH.EMAIL) + '</a></div>');
    var el = $('#chan-lien-he-bd');
    if (el) el.innerHTML = h.join('');
  }

  document.addEventListener('DOMContentLoaded', function () {
    chanTrang();
    Promise.all([
      fetch('data/nghe-an.json').then(function (r) { return r.json(); }),
      napSoLieu()
    ]).then(function (kq) {
      BANDO = kq[0];
      DULIEU = kq[1] || { so_lieu: {} };
      NGUOI = (DULIEU.nguoi || DULIEU.thanh_vien || []).filter(function (p) {
        return p && p.ten && p.cong_khai !== false;
      });
      if (DULIEU.la_du_lieu_mau) {
        loi('Số liệu đang hiển thị là DỮ LIỆU MẪU để xem thử giao diện. Ban tổ chức thay bằng danh sách thật (data/thanh-vien.json) trước khi công bố.');
      } else if (!Object.keys(DULIEU.so_lieu || {}).length) {
        loi('Đã có ' + NGUOI.length + ' người thật trong dữ liệu, nhưng CHƯA AI ĐƯỢC GÁN QUÊ ' +
            'nên bản đồ còn trống. Mở admin.html để gán quê cho từng người.');
      }
      veBoLoc();
      veBanDo();
      dungOChonQue();
      veSoTong();
      dungForm();
    }).catch(function (e) {
      loi('Không nạp được dữ liệu bản đồ. Nếu em đang mở trực tiếp bằng file:// thì hãy chạy qua một web server (xem README.md). Chi tiết: ' + e.message);
    });
  });
})();
