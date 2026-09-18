/* =====================================================================
   TRANG SỬA DỮ LIỆU — 37FTU

   Sửa bảng rồi bấm "Lưu lên web" là trang ban-do.html đổi ngay. Dữ liệu nằm
   ở Supabase, bảng trang_du_lieu, dòng khoa = 'ban-do' (sql/schema.sql mục 7).

   Ai mở trang này cũng XEM được — dữ liệu vốn công khai trên bản đồ. Muốn
   LƯU thì phải đăng nhập bằng tài khoản có tên trong bảng btc_quan_tri. Chốt
   chặn nằm ở Supabase (RLS), không nằm ở file này: sửa code ở đây không mở
   được quyền ghi.

   Chưa nối Supabase (config.js trống), hoặc Supabase chưa chạy schema mới, thì
   lui về cách cũ: sửa → Khác → Tải bản sao → chép đè data/thanh-vien.json →
   đẩy lên GitHub.

   Hai người cùng sửa: mỗi lần lưu, Supabase tự tăng số phiên bản. Lưu kèm điều
   kiện "trên web vẫn là bản tôi đang dựa vào" — ai lưu chen vào giữa thì người
   sau được hỏi lại chứ không đè mất. Mỗi bản lưu đều nằm lại trong Lịch sử.

   Bản nháp giữ trong localStorage của máy này, đóng tab không mất.

   SỐNG CHUNG VỚI tools/tu-sheet.py
   Script đó đọc bản đang chạy trên web, trộn với sheet, ghi ra file; nạp file
   đó vào đây rồi Lưu. Để lần chạy script sau không xoá mất công sửa ở đây, mỗi
   người mang theo:
     sua_tay  — danh sách ô đã sửa tay; script gặp là giữ nguyên, không ghi đè
     an_ma    — { mã băm SHA-256: quê } của người đã bị gỡ tên; script gặp
                thì không nêu tên lại, nhưng vẫn đếm họ vào tổng của quê đó
   Băm chứ không ghi tên: dữ liệu công khai, người đã xin gỡ tên thì tên không
   được nằm lại trong đó dưới dạng đọc được.
   ===================================================================== */
(function () {
  'use strict';

  var $ = function (s) { return document.querySelector(s); };
  var KHOA_NHAP = '37ftu_admin_nhap';
  var KHOA_PHIEN = '37ftu_phien';
  var KHOA_EMAIL = '37ftu_email_cuoi';   // để lần sau khỏi gõ lại email
  var KHOA_TRANG = 'ban-do';

  var CH = window.CAU_HINH || {};
  var SB_URL = String(CH.SUPABASE_URL || '').replace(/\/+$/, '');
  var SB_KEY = String(CH.SUPABASE_ANON_KEY || '');
  var CO_WEB = !!(SB_URL && SB_KEY);

  var GOC = null;      // bản vừa nạp, để so xem có sửa gì không
  var DL = null;       // bản đang sửa
  var HUYEN = [];      // [{id, ten}] — 21 huyện, lấy từ data/nghe-an.json
  var LICH_SU = [];    // để hoàn tác
  var COI_DOI = false;

  var PHIEN = null;    // phiên đăng nhập { access_token, refresh_token, expires_at, email }
  var QUYEN = null;    // Supabase trả lời có phải BTC không; null = chưa biết
  var WEB = { nguon: 'file', phien_ban: 0, cap_nhat: null, loi: '' };
  var BAN_GOC = 0;     // phiên bản trên web mà bản đang sửa dựa vào; 0 = web chưa có gì
  var LS_MOI = null;   // dòng mới nhất của tab Lịch sử lưu = bản đang chạy trên web

  var NHOM = ['Sáng lập', 'Ban Lãnh đạo', 'Ban Chấp hành', 'Thành viên'];
  var BAN = ['Tổ chức', 'Đối ngoại', 'Truyền thông'];

  function an(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function khongDau(s) {
    return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase();
  }

  function tenHuyen(id) {
    for (var i = 0; i < HUYEN.length; i++) if (HUYEN[i].id === id) return HUYEN[i].ten;
    return id || '';
  }

  function gio(ts) {
    if (!ts) return '—';
    var d = new Date(ts);
    if (isNaN(d)) return String(ts);
    return d.toLocaleString('vi-VN', {
      hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric'
    });
  }

  var henBao = 0;
  function bao(chu, lau) {
    var el = $('#ad-bao');
    el.textContent = chu;
    el.hidden = false;
    clearTimeout(henBao);
    henBao = setTimeout(function () { el.hidden = true; }, lau || 2400);
  }

  function loi(chu, status) {
    var e = new Error(chu);
    if (status) e.status = status;
    return e;
  }

  /* ---------------------------------------------------------------
     Nói chuyện với Supabase
     --------------------------------------------------------------- */

  /* Khoá publishable (sb_publishable_…) không phải JWT: chỉ gửi ở header apikey.
     Khoá anon kiểu cũ là JWT (bắt đầu bằng eyJ) thì gửi thêm Authorization như xưa. */
  function dau(dungPhien, them) {
    var h = { apikey: SB_KEY };
    if (dungPhien && PHIEN) h.Authorization = 'Bearer ' + PHIEN.access_token;
    else if (/^eyJ/.test(SB_KEY)) h.Authorization = 'Bearer ' + SB_KEY;
    Object.keys(them || {}).forEach(function (k) { h[k] = them[k]; });
    return h;
  }

  function loiDeHieu(status, d) {
    var ma = String((d && (d.error_code || d.code || d.error)) || '');
    var chu = String((d && (d.msg || d.message || d.error_description || d.hint)) || '');
    if (ma === 'invalid_credentials' || ma === 'invalid_grant' || /invalid login/i.test(chu)) {
      return 'Sai email hoặc mật khẩu.';
    }
    if (ma === 'email_not_confirmed') {
      return 'Email này chưa được xác nhận. Người quản trị tick "Auto Confirm User" khi tạo tài khoản.';
    }
    if (ma === 'PGRST202' || (status === 404 && /function/i.test(chu))) {
      return 'Supabase chưa có hàm la_btc — chạy lại sql/schema.sql bản mới.';
    }
    if (ma === 'PGRST205' || ma === '42P01' || (status === 404 && /relation|table|schema cache/i.test(chu))) {
      return 'Supabase chưa có bảng trang_du_lieu — chạy lại sql/schema.sql bản mới.';
    }
    if (ma === '42501' || status === 403) return 'Tài khoản này chưa được cấp quyền sửa.';
    if (status === 401) return 'Phiên đăng nhập đã hết — đăng nhập lại giúp nhé.';
    if (status === 409) return 'Có người vừa lưu cùng lúc.';
    return (chu || ('Lỗi ' + status)).slice(0, 160);
  }

  /* Gọi Supabase, trả JSON. Lỗi HTTP -> Error có .status và câu tiếng Việt.
     Mất mạng -> Error không có .status. */
  function goi(duong, tuy) {
    tuy = tuy || {};
    return fetch(SB_URL + duong, {
      method: tuy.method || 'GET',
      headers: dau(tuy.phien, tuy.headers),
      body: tuy.body == null ? undefined : JSON.stringify(tuy.body),
      cache: 'no-store'
    }).then(function (r) {
      return r.text().then(function (t) {
        var d = null;
        try { d = t ? JSON.parse(t) : null; } catch (e) { d = { message: t }; }
        if (r.ok) return d;
        throw loi(loiDeHieu(r.status, d), r.status);
      });
    });
  }

  function chuLoi(e) {
    return e && e.status ? e.message : 'Không kết nối được Supabase — kiểm tra mạng rồi thử lại.';
  }

  /* ---------- đăng nhập ---------- */

  function docPhien() {
    try {
      var p = JSON.parse(localStorage.getItem(KHOA_PHIEN) || 'null');
      if (p && p.access_token && p.refresh_token) PHIEN = p;
    } catch (e) { /* bỏ qua */ }
  }
  function ghiPhien() {
    try { localStorage.setItem(KHOA_PHIEN, JSON.stringify(PHIEN)); } catch (e) { /* bỏ qua */ }
  }
  function xoaPhien() {
    PHIEN = null;
    QUYEN = null;
    try { localStorage.removeItem(KHOA_PHIEN); } catch (e) { /* bỏ qua */ }
  }

  function nhanPhien(d) {
    if (!d || !d.access_token) throw loi('Supabase không trả về phiên đăng nhập.');
    PHIEN = {
      access_token: d.access_token,
      refresh_token: d.refresh_token,
      expires_at: d.expires_at || (Math.floor(Date.now() / 1000) + (d.expires_in || 3600)),
      email: (d.user && d.user.email) || (PHIEN && PHIEN.email) || ''
    };
    ghiPhien();
    try { if (PHIEN.email) localStorage.setItem(KHOA_EMAIL, PHIEN.email); } catch (e) { /* bỏ qua */ }
    return PHIEN;
  }

  var dangLamMoi = null;
  /* Token sống một giờ. Còn dưới một phút thì xin token mới — một lần thôi,
     dù nhiều chỗ cùng gọi (refresh token dùng hai lần là bị Supabase từ chối). */
  function lamMoiPhien() {
    if (!PHIEN) return Promise.reject(loi('Chưa đăng nhập.', 401));
    if (PHIEN.expires_at - Date.now() / 1000 > 60) return Promise.resolve(PHIEN);
    if (!dangLamMoi) {
      dangLamMoi = goi('/auth/v1/token?grant_type=refresh_token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: { refresh_token: PHIEN.refresh_token }
      }).then(nhanPhien, function (e) {
        if (!e.status) throw e;              // mất mạng: giữ phiên, thử lại sau
        xoaPhien();
        veTaiKhoan();
        veNhac();
        throw loi('Phiên đăng nhập đã hết — đăng nhập lại giúp nhé.', 401);
      }).then(function (p) { dangLamMoi = null; return p; },
        function (e) { dangLamMoi = null; throw e; });
    }
    return dangLamMoi;
  }

  function kiemQuyen() {
    return lamMoiPhien().then(function () {
      return goi('/rest/v1/rpc/la_btc', {
        method: 'POST', phien: true,
        headers: { 'Content-Type': 'application/json' },
        body: {}
      });
    }).then(function (v) {
      QUYEN = v === true;
      veTaiKhoan();
      veNhac();
      return QUYEN;
    });
  }

  function dangNhap(email, mk) {
    return goi('/auth/v1/token?grant_type=password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: { email: email, password: mk }
    }).then(nhanPhien).then(function () {
      // đăng nhập được mà không hỏi được quyền (thiếu hàm la_btc…) thì vẫn cho vào,
      // lúc lưu Supabase sẽ tự chặn nếu không đủ quyền
      return kiemQuyen().catch(function (e) {
        QUYEN = null;
        veTaiKhoan();
        veNhac();
        bao(chuLoi(e), 7000);
        return null;
      });
    });
  }

  function dangXuat() {
    var p = PHIEN;
    xoaPhien();
    if (p && CO_WEB) {
      fetch(SB_URL + '/auth/v1/logout', {
        method: 'POST',
        headers: { apikey: SB_KEY, Authorization: 'Bearer ' + p.access_token }
      }).catch(function () { /* token hết hạn tự nhiên, không sao */ });
    }
    veTaiKhoan();
    veNhac();
    if (!$('#tab-lichsu').hidden) veLichSu();
    bao('Đã đăng xuất');
  }

  /* ---------- đọc / ghi dữ liệu trang ---------- */

  function napTuWeb(nhe) {
    return goi('/rest/v1/trang_du_lieu?khoa=eq.' + KHOA_TRANG +
      '&select=' + (nhe ? 'phien_ban,cap_nhat' : 'du_lieu,phien_ban,cap_nhat'), { phien: !!PHIEN && nhe })
      .then(function (rows) { return (rows && rows[0]) || null; });
  }

  /* Ghi có điều kiện: chỉ ghi nếu trên web vẫn là phiên bản mình dựa vào.
     Trả về { phien_ban, cap_nhat } của bản mới, hoặc null nếu không ghi được
     (có người lưu chen vào, hoặc tài khoản không có quyền — RLS lặng lẽ bỏ qua). */
  function ghiLenWeb(du, banGoc) {
    var dauGhi = { 'Content-Type': 'application/json', Prefer: 'return=representation' };
    if (!banGoc) {
      return goi('/rest/v1/trang_du_lieu?select=phien_ban,cap_nhat', {
        method: 'POST', phien: true, headers: dauGhi,
        body: { khoa: KHOA_TRANG, du_lieu: du }
      }).then(function (rows) { return (rows && rows[0]) || null; }, function (e) {
        if (e.status === 409) return null;   // có người đưa lên trước một nhịp
        throw e;
      });
    }
    return goi('/rest/v1/trang_du_lieu?khoa=eq.' + KHOA_TRANG + '&phien_ban=eq.' + banGoc +
      '&select=phien_ban,cap_nhat', {
        method: 'PATCH', phien: true, headers: dauGhi,
        body: { du_lieu: du }
      }).then(function (rows) { return (rows && rows[0]) || null; });
  }

  function nguoiDaLuu(phienBan) {
    return goi('/rest/v1/trang_lich_su?khoa=eq.' + KHOA_TRANG + '&phien_ban=eq.' + phienBan +
      '&select=boi&order=id.desc&limit=1', { phien: true })
      .then(function (rows) { return (rows && rows[0] && rows[0].boi) || ''; },
        function () { return ''; });
  }

  /* ---------------------------------------------------------------
     Ghi nhớ và hoàn tác
     --------------------------------------------------------------- */

  function nhoDeHoanTac() {
    LICH_SU.push(JSON.stringify(DL));
    if (LICH_SU.length > 30) LICH_SU.shift();
    $('#nut-hoan').disabled = false;
  }

  function hoanTac() {
    if (!LICH_SU.length) return;
    DL = JSON.parse(LICH_SU.pop());
    $('#nut-hoan').disabled = !LICH_SU.length;
    luuNhap();
    veNguoi();
    veHuyen();
    bao('Đã hoàn tác');
  }

  function luuNhap() {
    COI_DOI = JSON.stringify(DL) !== GOC;
    try {
      if (COI_DOI) localStorage.setItem(KHOA_NHAP, JSON.stringify({ ban_goc: BAN_GOC, dl: DL }));
      else localStorage.removeItem(KHOA_NHAP);
    } catch (e) { /* trình duyệt chặn localStorage thì thôi, vẫn sửa được */ }
    veTrangThai();
  }

  function docNhap() {
    try {
      var x = JSON.parse(localStorage.getItem(KHOA_NHAP) || 'null');
      if (x && x.dl && x.dl.nguoi) return x;
      if (x && x.nguoi) return { ban_goc: null, dl: x };   // nháp kiểu cũ, chưa có số phiên bản
    } catch (e) { /* bỏ qua */ }
    return null;
  }

  function veTrangThai() {
    var tt = $('#trang-thai');
    tt.textContent = COI_DOI ? 'có thay đổi chưa lưu'
      : WEB.nguon === 'web' ? 'khớp với bản trên web' : 'chưa sửa gì';
    tt.classList.toggle('co-doi', COI_DOI);
  }

  /* ---------------------------------------------------------------
     Dải nhắc và ô tài khoản
     --------------------------------------------------------------- */

  function veNhac() {
    var h;
    if (!CO_WEB) {
      h = '<b>Chưa nối Supabase</b> (config.js còn trống) nên chưa lưu thẳng lên web được. ' +
        'Sửa xong bấm <b>Khác → Tải bản sao</b>, chép đè vào thư mục <code>data/</code> rồi đẩy lên GitHub.';
    } else if (WEB.loi) {
      h = '<b>Chưa đọc được dữ liệu trên web:</b> ' + an(WEB.loi) +
        ' Đang mở bản trong file <code>data/thanh-vien.json</code> — vẫn sửa và tải bản sao được.';
    } else {
      h = WEB.nguon === 'web'
        ? 'Đang sửa đúng dữ liệu đang chạy trên web — bản số <b>' + an(WEB.phien_ban) +
          '</b>, lưu lúc ' + an(gio(WEB.cap_nhat)) + '.'
        : 'Trên web chưa có dữ liệu — đang mở bản trong file <code>data/thanh-vien.json</code>. ' +
          'Lưu lần đầu là đưa bản này lên.';
      h += !PHIEN ? ' Muốn lưu thì bấm <b>Đăng nhập</b> bằng tài khoản BTC.'
        : QUYEN === false
          ? ' <b>Tài khoản ' + an(PHIEN.email) + ' chưa được cấp quyền sửa</b> — người quản trị ' +
            'Supabase thêm email này vào bảng <code>btc_quan_tri</code> (README mục 5).'
          : ' Sửa xong bấm <b>Lưu lên web</b> (hoặc Ctrl+S) là trang bản đồ đổi ngay. ' +
            'Chưa lưu thì thay đổi vẫn giữ tạm trong trình duyệt này.';
    }
    $('#ad-nhac-chu').innerHTML = h;
  }

  function veTaiKhoan() {
    var o = $('#ad-tk');
    if (!CO_WEB) { o.innerHTML = ''; return; }
    if (!PHIEN) {
      o.innerHTML = '<button class="nut nut-vien" type="button" data-tk="vao">Đăng nhập</button>';
      return;
    }
    var ten = PHIEN.email.split('@')[0];
    o.innerHTML = '<span class="ad-tk-ten' + (QUYEN === false ? ' ad-tk-chua' : '') + '" title="' + an(PHIEN.email) + '">' +
      an(ten) + (QUYEN === false ? ' · chưa có quyền' : '') + '</span>' +
      '<button class="ad-tk-ra" type="button" data-tk="ra">Đăng xuất</button>';
  }

  /* ---------------------------------------------------------------
     Hộp đăng nhập
     --------------------------------------------------------------- */

  var sauDangNhap = null;

  function moDangNhap(tiepTheo, loiTruoc) {
    if (!CO_WEB) return;
    sauDangNhap = tiepTheo || null;
    var hop = $('#hop-dang-nhap');
    $('#dn-loi').textContent = loiTruoc || '';
    $('#dn-loi').hidden = !loiTruoc;
    $('#dn-mk').value = '';
    if (!$('#dn-email').value) {
      try { $('#dn-email').value = localStorage.getItem(KHOA_EMAIL) || ''; } catch (e) { /* bỏ qua */ }
    }
    if (hop.showModal) { if (!hop.open) hop.showModal(); } else hop.setAttribute('open', '');
    setTimeout(function () { ($('#dn-email').value ? $('#dn-mk') : $('#dn-email')).focus(); }, 30);
  }

  function dongDangNhap() {
    var hop = $('#hop-dang-nhap');
    if (hop.close) { if (hop.open) hop.close(); } else hop.removeAttribute('open');
  }

  function batDangNhap() {
    $('#form-dang-nhap').addEventListener('submit', function (e) {
      e.preventDefault();
      var email = $('#dn-email').value.trim();
      var mk = $('#dn-mk').value;
      if (!email || !mk) {
        $('#dn-loi').textContent = 'Điền cả email và mật khẩu nhé.';
        $('#dn-loi').hidden = false;
        ($('#dn-email').value ? $('#dn-mk') : $('#dn-email')).focus();
        return;
      }
      var nut = $('#dn-vao');
      nut.disabled = true;
      nut.textContent = 'Đang vào…';
      $('#dn-loi').hidden = true;
      dangNhap(email, mk).then(function (coQuyen) {
        $('#dn-mk').value = '';
        dongDangNhap();
        if (coQuyen === false) bao('Đăng nhập được, nhưng tài khoản chưa có quyền sửa', 5000);
        else if (coQuyen) bao('Đã đăng nhập');
        var f = sauDangNhap;
        sauDangNhap = null;
        if (f && coQuyen !== false) f();
        if (!$('#tab-lichsu').hidden) veLichSu();
      }).catch(function (err) {
        $('#dn-loi').textContent = chuLoi(err);
        $('#dn-loi').hidden = false;
      }).then(function () {
        nut.disabled = false;
        nut.textContent = 'Đăng nhập';
      });
    });
    $('#dn-huy').addEventListener('click', function () { sauDangNhap = null; dongDangNhap(); });
    $('#ad-tk').addEventListener('click', function (e) {
      var nut = e.target.closest('[data-tk]');
      if (!nut) return;
      if (nut.dataset.tk === 'vao') moDangNhap();
      else dangXuat();
    });
  }

  /* ---------------------------------------------------------------
     Bộ lọc
     --------------------------------------------------------------- */

  function locNguoi() {
    var tu = khongDau($('#loc-tim').value.trim());
    var que = $('#loc-que').value;
    var nhom = $('#loc-nhom').value;
    var ban = $('#loc-ban').value;
    var thieu = $('#loc-thieu-que').checked;

    return DL.nguoi.filter(function (p) {
      if (que && p.que !== que) return false;
      if (nhom && p.nhom !== nhom) return false;
      if (ban && p.ban !== ban) return false;
      if (thieu && p.que) return false;
      if (tu) {
        var kho = khongDau([p.ten, p.chuc_vu, p.ban, p.nhom, tenHuyen(p.que),
          'G' + p.gen, p.loi_nhan].concat(p.thanh_tich || []).join(' '));
        if (kho.indexOf(tu) < 0) return false;
      }
      return true;
    });
  }

  /* ---------------------------------------------------------------
     Vẽ bảng người
     --------------------------------------------------------------- */

  function oChon(ds, dangChon, trong) {
    var h = '<option value="">' + an(trong) + '</option>';
    ds.forEach(function (x) {
      var gt = typeof x === 'string' ? x : x.id;
      var ten = typeof x === 'string' ? x : x.ten;
      h += '<option value="' + an(gt) + '"' + (gt === dangChon ? ' selected' : '') + '>' + an(ten) + '</option>';
    });
    return h;
  }

  function lopBac(nhom) {
    return nhom === 'Sáng lập' ? 'bac-sl'
      : nhom === 'Ban Lãnh đạo' ? 'bac-ld'
      : nhom === 'Ban Chấp hành' ? 'bac-ch' : '';
  }

  function dongNguoi(p, stt) {
    var i = DL.nguoi.indexOf(p);
    var nk = (p.nhiem_ky || []);
    var nkChu = nk.length
      ? (nk.length === 1 ? nk[0] : nk[0].split('-')[0] + '–' + nk[nk.length - 1].split('-').pop())
      : '—';
    return '<tr data-i="' + i + '">' +
      '<td class="o-stt">' + stt + '</td>' +
      '<td class="o-ten"><input type="text" data-o="ten" value="' + an(p.ten) + '" placeholder="Họ tên"></td>' +
      '<td><input type="number" data-o="gen" value="' + an(p.gen || '') + '" min="1" max="30" placeholder="—"></td>' +
      '<td' + (p.que ? '' : ' class="o-thieu"') + '><select data-o="que">' + oChon(HUYEN, p.que, '— chưa rõ —') + '</select></td>' +
      '<td><input type="text" data-o="chuc_vu" value="' + an(p.chuc_vu) + '" placeholder="Chức vụ"></td>' +
      '<td><select data-o="nhom" class="' + lopBac(p.nhom) + '">' + oChon(NHOM, p.nhom, '—') + '</select></td>' +
      '<td><select data-o="ban">' + oChon(BAN, p.ban, '—') + '</select></td>' +
      '<td class="o-nk" title="' + an(nk.join(', ')) + '">' + an(nkChu) + '</td>' +
      '<td><input type="text" data-o="thanh_tich" value="' + an((p.thanh_tich || []).join('; ')) + '" placeholder="Cách nhau bằng dấu ;"></td>' +
      '<td><input type="text" data-o="loi_nhan" value="' + an(p.loi_nhan) + '" placeholder="Một câu cho khoá sau"></td>' +
      '<td><input type="url" data-o="lien_he" value="' + an(p.lien_he) + '" placeholder="https://facebook.com/…"></td>' +
      '<td><button class="o-xoa" type="button" data-xoa="1" title="Gỡ người này khỏi trang">×</button></td>' +
      '</tr>';
  }

  function veNguoi() {
    var ds = locNguoi();
    $('#than-nguoi').innerHTML = ds.map(function (p, i) { return dongNguoi(p, i + 1); }).join('');
    $('#nguoi-trong').hidden = !!ds.length;
    $('#dem-nguoi').textContent = DL.nguoi.length;
    $('#hl-so').textContent = ds.length;
    $('#hang-loat').hidden = !ds.length;
  }

  /* ---------------------------------------------------------------
     Vẽ bảng huyện
     --------------------------------------------------------------- */

  /* Tổng theo huyện = người có tên trong bảng + người không nêu tên
     (thành viên thường, do tools/tu-sheet.py đếm sẵn từ sheet) */
  function demTheoQue() {
    var d = {};
    DL.nguoi.forEach(function (p) { if (p.que) d[p.que] = (d[p.que] || 0) + 1; });
    var k = DL.dem_khong_ten || {};
    Object.keys(k).forEach(function (q) { d[q] = (d[q] || 0) + (k[q].tong || 0); });
    return d;
  }

  function veHuyen() {
    var dem = demTheoQue();
    var gd = DL.ghi_de_tong || {};
    $('#than-huyen').innerHTML = HUYEN.map(function (h) {
      var tu = dem[h.id] || 0;
      var de = gd[h.id];
      return '<tr data-que="' + an(h.id) + '">' +
        '<td style="padding-left:11px;font-weight:600">' + an(h.ten) + '</td>' +
        '<td class="o-so">' + tu + '</td>' +
        '<td><input type="number" data-o="ghi_de" min="0" value="' + (de == null ? '' : an(de)) + '" placeholder="—"></td>' +
        '<td class="o-so"><b>' + (de == null ? tu : de) + '</b></td>' +
        '</tr>';
    }).join('');
  }

  /* ---------------------------------------------------------------
     Bắt sự kiện sửa
     --------------------------------------------------------------- */

  function docO(el) {
    var o = el.dataset.o;
    if (o === 'gen') return { gen: parseInt(el.value, 10) || 0 };
    if (o === 'thanh_tich') {
      return { thanh_tich: el.value.split(';').map(function (x) { return x.trim(); }).filter(Boolean) };
    }
    if (o === 'lien_he') {
      // Chỉ nhận link http(s). Dán số điện thoại hay javascript: vào đây là bỏ.
      var v = el.value.trim();
      return { lien_he: /^https?:\/\/[^\s]+$/i.test(v) ? v : '' };
    }
    var r = {};
    r[o] = el.value.trim();
    return r;
  }

  /* Đánh dấu ô này đã sửa tay, để tools/tu-sheet.py chạy lại không ghi đè */
  function danhDauSuaTay(p, o) {
    p.sua_tay = p.sua_tay || [];
    if (p.sua_tay.indexOf(o) < 0) p.sua_tay.push(o);
  }

  function batSuaNguoi() {
    var than = $('#than-nguoi');

    than.addEventListener('input', function (e) {
      var el = e.target;
      if (!el.dataset || !el.dataset.o) return;
      var tr = el.closest('tr');
      var p = DL.nguoi[+tr.dataset.i];
      if (!p) return;
      nhoDeHoanTac();
      var moi = docO(el);
      Object.keys(moi).forEach(function (k) { p[k] = moi[k]; danhDauSuaTay(p, k); });
      if (el.dataset.o === 'nhom') el.className = lopBac(p.nhom);
      if (el.dataset.o === 'que') {
        el.parentNode.classList.toggle('o-thieu', !p.que);
        veHuyen();
      }
      tr.classList.add('vua-sua');
      luuNhap();
    });

    than.addEventListener('change', function (e) {
      // ô url cần kiểm lại lúc rời ô, nếu bị bỏ thì trả ô về rỗng cho khỏi hiểu nhầm
      var el = e.target;
      if (el.dataset && el.dataset.o === 'lien_he') {
        var tr = el.closest('tr');
        var p = DL.nguoi[+tr.dataset.i];
        if (p && el.value.trim() && !p.lien_he) {
          el.value = '';
          bao('Ô này chỉ nhận link http(s) — đừng dán số điện thoại vào đây');
        }
      }
    });

    than.addEventListener('click', function (e) {
      var nut = e.target.closest('[data-xoa]');
      if (!nut) return;
      var tr = nut.closest('tr');
      var p = DL.nguoi[+tr.dataset.i];
      if (!p) return;
      // Người từ sheet: gỡ TÊN chứ không gỡ NGƯỜI. Người thêm tay ở đây: xoá hẳn —
      // sheet không biết họ, đếm ẩn danh thì lần chạy script sau cũng mất.
      var tuSheet = !!p.ma && p.ma.indexOf('tay-') !== 0;
      var ten = p.ten || 'người này';
      if (!confirm(tuSheet
        ? 'Gỡ "' + ten + '" khỏi trang?\n\n' +
          'Tên sẽ không còn hiện ở đâu nữa, kể cả khi chạy lại tools/tu-sheet.py.\n' +
          'Người đó vẫn được đếm vào con số tổng của huyện, nhưng không nêu tên.'
        : 'Xoá "' + ten + '"?\n\nNgười này được thêm tay ở đây, xoá là mất hẳn.')) return;
      nhoDeHoanTac();
      if (tuSheet) {
        // nhớ mã, để lần chạy script sau không đưa lại
        DL._cho_go = (DL._cho_go || []).filter(function (x) { return x.ma !== p.ma; });
        DL._cho_go.push({ ma: p.ma, que: p.que || '' });
        if (p.que) {
          DL.dem_khong_ten = DL.dem_khong_ten || {};
          var o = DL.dem_khong_ten[p.que] = DL.dem_khong_ten[p.que] || { tong: 0, theo_the_he: {} };
          o.tong += 1;
          if (p.gen) o.theo_the_he['G' + p.gen] = (o.theo_the_he['G' + p.gen] || 0) + 1;
        }
      }
      DL.nguoi.splice(DL.nguoi.indexOf(p), 1);
      luuNhap(); veNguoi(); veHuyen();
      bao(tuSheet ? 'Đã gỡ tên — bấm Hoàn tác nếu nhầm' : 'Đã xoá — bấm Hoàn tác nếu nhầm');
    });

    $('#than-huyen').addEventListener('input', function (e) {
      var el = e.target;
      if (!el.dataset || el.dataset.o !== 'ghi_de') return;
      nhoDeHoanTac();
      DL.ghi_de_tong = DL.ghi_de_tong || {};
      var que = el.closest('tr').dataset.que;
      var v = el.value.trim();
      if (v === '') delete DL.ghi_de_tong[que];
      else DL.ghi_de_tong[que] = Math.max(0, parseInt(v, 10) || 0);
      el.closest('tr').lastElementChild.innerHTML =
        '<b>' + (v === '' ? (demTheoQue()[que] || 0) : DL.ghi_de_tong[que]) + '</b>';
      luuNhap();
    });
  }

  /* ---------------------------------------------------------------
     Gán quê hàng loạt — 429 người mà bấm từng ô thì ngồi cả buổi
     --------------------------------------------------------------- */

  function batHangLoat() {
    var sel = $('#hl-que'), nut = $('#hl-lam');
    sel.addEventListener('change', function () { nut.disabled = !sel.value; });
    nut.addEventListener('click', function () {
      if (!sel.value) return;
      var ds = locNguoi();
      if (!ds.length) return;
      if (!confirm('Gán quê "' + tenHuyen(sel.value) + '" cho ' + ds.length + ' người đang hiện?')) return;
      nhoDeHoanTac();
      ds.forEach(function (p) { p.que = sel.value; danhDauSuaTay(p, 'que'); });
      luuNhap(); veNguoi(); veHuyen();
      bao('Đã gán quê cho ' + ds.length + ' người');
      sel.value = ''; nut.disabled = true;
    });
  }

  /* ---------------------------------------------------------------
     Dựng dữ liệu để lưu / xuất
     --------------------------------------------------------------- */

  /* SHA-256 -> chuỗi hex. Trình duyệt chỉ cho dùng crypto.subtle trên https
     hoặc localhost — đúng hai chỗ trang này chạy. */
  function bam(chu) {
    var buf = new TextEncoder().encode(chu);
    return crypto.subtle.digest('SHA-256', buf).then(function (h) {
      return Array.prototype.map.call(new Uint8Array(h), function (b) {
        return ('0' + b.toString(16)).slice(-2);
      }).join('');
    });
  }

  /* an_ma bản cũ là mảng mã băm, bản mới là { mã băm: quê } — đọc được cả hai */
  function docAnMa(v) {
    if (!v) return {};
    if (Array.isArray(v)) {
      var o = {};
      v.forEach(function (h) { o[h] = ''; });
      return o;
    }
    return JSON.parse(JSON.stringify(v));
  }

  /* Dựng bộ dữ liệu hoàn chỉnh — y hệt dạng data/thanh-vien.json. Trả Promise vì phải băm mã. */
  function dungFileRa() {
    if (!(window.crypto && crypto.subtle)) {
      return Promise.reject(new Error('Trình duyệt không cho băm — mở trang qua https hoặc localhost.'));
    }
    var dem = demTheoQue();
    var gd = DL.ghi_de_tong || {};
    var kt = DL.dem_khong_ten || {};

    // biểu đồ theo thế hệ trong panel huyện: người có tên + người không nêu tên
    var theoGen = {};
    function cong(q, g, n) {
      theoGen[q] = theoGen[q] || {};
      theoGen[q][g] = (theoGen[q][g] || 0) + n;
    }
    DL.nguoi.forEach(function (p) { if (p.que && p.gen) cong(p.que, 'G' + p.gen, 1); });
    Object.keys(kt).forEach(function (q) {
      var t = kt[q].theo_the_he || {};
      Object.keys(t).forEach(function (g) { cong(q, g, t[g]); });
    });

    var so = {};
    HUYEN.forEach(function (h) {
      var tong = gd[h.id] == null ? (dem[h.id] || 0) : gd[h.id];
      if (!tong) return;
      so[h.id] = { ten: h.ten, tong: tong, theo_the_he: theoGen[h.id] || {} };
    });

    var choGo = DL._cho_go || [];
    return Promise.all(choGo.map(function (x) { return bam(x.ma); })).then(function (moiBam) {
      var anMa = docAnMa(DL.an_ma);
      moiBam.forEach(function (h, i) { anMa[h] = choGo[i].que; });

      var nguoi = DL.nguoi.filter(function (p) { return p.ten; }).map(function (p) {
        // chốt lại lần nữa: link lạ (javascript:, số điện thoại…) không bao giờ lên web
        if (p.lien_he && !/^https?:\/\/[^\s]+$/i.test(p.lien_he)) {
          p = JSON.parse(JSON.stringify(p));
          p.lien_he = '';
        }
        return p;
      });
      var ra = {
        _doc: DL._doc,
        nguon: DL.nguon,
        cap_nhat: new Date().toISOString().slice(0, 10),
        la_du_lieu_mau: false,
        tong_thanh_vien: DL.tong_thanh_vien || nguoi.length,
        da_biet_que: nguoi.filter(function (p) { return !!p.que; }).length +
          Object.keys(kt).reduce(function (t, q) { return t + (kt[q].tong || 0); }, 0),
        so_lieu: so,
        dem_khong_ten: Object.keys(kt).length ? kt : undefined,
        ghi_de_tong: Object.keys(gd).length ? gd : undefined,
        an_ma: Object.keys(anMa).length ? anMa : undefined,
        nguoi: nguoi
      };
      return JSON.stringify(ra, null, 1);
    });
  }

  /* ---------------------------------------------------------------
     Lưu lên web
     --------------------------------------------------------------- */

  var DANG_LUU = false;

  function luuLenWeb() {
    if (DANG_LUU) return;
    if (!CO_WEB) { taiVe(); return; }
    if (!PHIEN) { moDangNhap(luuLenWeb); return; }
    if (QUYEN === false) {
      bao('Tài khoản ' + PHIEN.email + ' chưa được cấp quyền sửa', 5000);
      return;
    }
    if (!COI_DOI && WEB.nguon === 'web') { bao('Chưa sửa gì — trên web đã là bản này'); return; }

    DANG_LUU = true;
    var nut = $('#nut-luu');
    nut.disabled = true;
    nut.textContent = 'Đang lưu…';
    var du;
    dungFileRa().then(function (chu) {
      du = JSON.parse(chu);
      return lamMoiPhien();
    }).then(function () {
      return ghiLenWeb(du, BAN_GOC);
    }).then(function (dong) {
      return dong ? thanhCong(du, dong) : vaCham(du);
    }).catch(function (e) {
      if (e.status === 401) {
        xoaPhien();
        veTaiKhoan();
        veNhac();
        moDangNhap(luuLenWeb, e.message);
      } else {
        bao('Chưa lưu được: ' + chuLoi(e), 7000);
      }
    }).then(function () {
      DANG_LUU = false;
      nut.disabled = false;
      nut.textContent = 'Lưu lên web';
    });
  }

  /* Ghi không được mà không báo lỗi: hoặc có người lưu chen vào (số phiên bản
     trên web đã khác), hoặc tài khoản không có quyền (số phiên bản vẫn y nguyên). */
  function vaCham(du) {
    return napTuWeb(true).then(function (hienTai) {
      var daDoi = hienTai ? hienTai.phien_ban !== BAN_GOC : BAN_GOC !== 0;
      if (!daDoi) {
        QUYEN = false;
        veTaiKhoan();
        veNhac();
        throw loi('tài khoản ' + (PHIEN && PHIEN.email) + ' chưa được cấp quyền sửa.', 403);
      }
      var moi = hienTai ? hienTai.phien_ban : 0;
      return nguoiDaLuu(moi).then(function (boi) {
        var ok = confirm('Trong lúc bạn sửa, ' + (boi || 'một người khác') + ' đã lưu bản mới lên web' +
          (hienTai ? ' (bản số ' + moi + ', lúc ' + gio(hienTai.cap_nhat) + ')' : '') + '.\n\n' +
          'OK = vẫn lưu bản của bạn đè lên. Bản của họ vẫn còn trong tab "Lịch sử lưu".\n' +
          'Huỷ = chưa lưu gì, để xem lại.');
        if (!ok) {
          bao('Chưa lưu. Mở tab Lịch sử lưu để xem bản của họ.', 5000);
          return;
        }
        return ghiLenWeb(du, moi).then(function (dong) {
          if (dong) return thanhCong(du, dong);
          throw loi('vẫn chưa lưu được — thử lại sau ít giây.', 409);
        });
      });
    });
  }

  function thanhCong(du, dong) {
    DL = du;
    DL.nguoi = DL.nguoi || [];
    GOC = JSON.stringify(DL);
    BAN_GOC = dong.phien_ban;
    WEB = { nguon: 'web', phien_ban: dong.phien_ban, cap_nhat: dong.cap_nhat, loi: '' };
    luuNhap();
    veNguoi();
    veHuyen();
    veNhac();
    if (!$('#tab-lichsu').hidden) veLichSu();
    bao('Đã lưu lên web (bản số ' + dong.phien_ban + ') — trang bản đồ đã đổi', 5000);
  }

  /* ---------------------------------------------------------------
     Bản sao: tải về, chép, nạp file
     --------------------------------------------------------------- */

  function taiVe() {
    dungFileRa().then(function (chu) {
      var blob = new Blob([chu], { type: 'application/json' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'thanh-vien.json';
      document.body.appendChild(a);
      a.click();
      setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
      bao('Đã tải bản sao thanh-vien.json');
    }, function (e) { bao(e.message); });
  }

  function chepJSON() {
    dungFileRa().then(function (chu) {
      if (!(navigator.clipboard && navigator.clipboard.writeText)) throw new Error('khong chep');
      return navigator.clipboard.writeText(chu);
    }).then(function () { bao('Đã chép JSON'); },
      function () { bao('Không chép được — dùng Tải bản sao'); });
  }

  /* Nạp file thanh-vien.json — thường là file tools/tu-sheet.py vừa sinh ra */
  function napFile(tep) {
    var r = new FileReader();
    r.onload = function () {
      var d;
      try { d = JSON.parse(r.result); } catch (e) { bao('File này không phải JSON hợp lệ', 5000); return; }
      if (!d || typeof d !== 'object' || !Array.isArray(d.nguoi)) {
        bao('File không đúng dạng thanh-vien.json (thiếu danh sách "nguoi")', 5000);
        return;
      }
      if (!confirm('Thay toàn bộ bảng đang sửa bằng file "' + tep.name + '" (' + d.nguoi.length +
        ' người nêu tên)?\n\nTrên web chưa đổi gì cho tới khi bấm Lưu lên web.')) return;
      nhoDeHoanTac();
      DL = d;
      luuNhap(); veNguoi(); veHuyen();
      chuyenTab('nguoi');
      bao('Đã nạp file — xem lại rồi bấm Lưu lên web', 5000);
    };
    r.onerror = function () { bao('Không đọc được file'); };
    r.readAsText(tep, 'utf-8');
  }

  /* ---------------------------------------------------------------
     Lịch sử lưu
     --------------------------------------------------------------- */

  function veLichSu() {
    var than = $('#than-lichsu');
    var trong = $('#ls-trong');
    than.innerHTML = '';
    trong.hidden = false;
    $('#ls-moi-hon').hidden = true;
    if (!CO_WEB) { trong.textContent = 'Chưa nối Supabase nên chưa có lịch sử lưu.'; return; }
    if (!PHIEN) {
      trong.innerHTML = 'Lịch sử chỉ BTC xem được. <button class="nut nut-vien" type="button" data-tk-ls="1">Đăng nhập</button>';
      return;
    }
    trong.textContent = 'Đang tải…';
    lamMoiPhien().then(function () {
      return goi('/rest/v1/trang_lich_su?khoa=eq.' + KHOA_TRANG +
        '&select=id,phien_ban,luc,boi,so_nguoi&order=id.desc&limit=50', { phien: true });
    }).then(function (rows) {
      rows = rows || [];
      LS_MOI = rows[0] || null;
      trong.hidden = !!rows.length;
      if (!rows.length) {
        trong.textContent = QUYEN === false ? 'Tài khoản này chưa có quyền xem lịch sử.' : 'Chưa có lần lưu nào.';
      }
      // Lần lưu nào cũng ghi lịch sử, nên dòng trên cùng chính là bản đang chạy trên web.
      var cuHon = LS_MOI && WEB.nguon === 'web' && LS_MOI.phien_ban !== BAN_GOC;
      $('#ls-moi-hon').hidden = !cuHon;
      if (cuHon) {
        $('#ls-moi-hon').innerHTML = 'Trên web đang là <b>bản số ' + an(LS_MOI.phien_ban) + '</b>' +
          (LS_MOI.boi ? ' của ' + an(LS_MOI.boi) : '') + ', mới hơn bản bạn đang sửa (số ' + an(BAN_GOC) +
          '). Mở bản đó ra để sửa tiếp trên nó.';
      }
      than.innerHTML = rows.map(function (r, i) {
        var dangMo = i === 0 && r.phien_ban === BAN_GOC && !COI_DOI;
        return '<tr>' +
          '<td class="o-so">' + an(r.phien_ban) + '</td>' +
          '<td style="padding-left:11px">' + an(gio(r.luc)) + '</td>' +
          '<td style="padding-left:11px">' + an(r.boi || '—') + '</td>' +
          '<td class="o-so">' + an(r.so_nguoi == null ? '—' : r.so_nguoi) + '</td>' +
          '<td style="padding:6px 11px">' +
            (i === 0 ? '<span class="ls-dang">đang chạy trên web</span> ' : '') +
            (dangMo ? '' : '<button class="nut nut-vien ls-mo" type="button" data-id="' + an(r.id) +
              '" data-pb="' + an(r.phien_ban) + '">Mở bản này</button>') +
          '</td></tr>';
      }).join('');
    }).catch(function (e) {
      if (e.status === 401) { xoaPhien(); veTaiKhoan(); veNhac(); veLichSu(); return; }
      trong.textContent = chuLoi(e);
    });
  }

  function moBanCu(id, pb) {
    if (COI_DOI && !confirm('Đang có thay đổi chưa lưu. Mở bản số ' + pb +
      ' sẽ thay chúng (vẫn bấm Hoàn tác được). Tiếp tục?')) return;
    lamMoiPhien().then(function () {
      return goi('/rest/v1/trang_lich_su?id=eq.' + encodeURIComponent(id) + '&select=du_lieu', { phien: true });
    }).then(function (rows) {
      if (!rows || !rows[0] || !rows[0].du_lieu) throw loi('Không tìm thấy bản này.', 404);
      nhoDeHoanTac();
      DL = rows[0].du_lieu;
      DL.nguoi = DL.nguoi || [];
      // Đã nhìn thấy danh sách, biết bản nào mới nhất — lưu sẽ so với bản mới nhất đó,
      // ai lưu chen vào sau lúc này thì vẫn bị hỏi lại như thường.
      var laMoiNhat = LS_MOI && String(LS_MOI.phien_ban) === String(pb);
      if (LS_MOI) {
        BAN_GOC = LS_MOI.phien_ban;
        WEB = { nguon: 'web', phien_ban: LS_MOI.phien_ban, cap_nhat: LS_MOI.luc, loi: '' };
      }
      if (laMoiNhat) GOC = JSON.stringify(DL);
      luuNhap(); veNguoi(); veHuyen(); veNhac();
      chuyenTab('nguoi');
      bao(laMoiNhat ? 'Đã mở bản mới nhất trên web (số ' + pb + ') — sửa tiếp trên bản này.'
        : 'Đang mở bản số ' + pb + '. Muốn quay về bản này thì bấm Lưu lên web.', 6000);
    }).catch(function (e) { bao(chuLoi(e), 5000); });
  }

  function batLichSu() {
    $('#tab-lichsu').addEventListener('click', function (e) {
      var mo = e.target.closest('.ls-mo');
      if (mo) { moBanCu(mo.dataset.id, mo.dataset.pb); return; }
      if (e.target.closest('[data-tk-ls]')) moDangNhap(veLichSu);
    });
  }

  /* ---------------------------------------------------------------
     Tab góp ý
     --------------------------------------------------------------- */

  function veGopY() {
    var ds = (window.GOPY && window.GOPY.doc()) || [];
    $('#dem-gopy').textContent = ds.length;
    $('#gy-trong').hidden = !!ds.length;
    $('#gy-ds').innerHTML = ds.map(function (g, i) {
      return '<div class="gy-o">' +
        '<div class="gy-dau"><span class="gy-trang">' + an(g.trang) + '</span>' +
        '<span class="gy-moc">' + an(g.nhan) + '</span>' +
        '<span>' + an(new Date(g.luc).toLocaleString('vi-VN')) + '</span></div>' +
        '<div class="gy-chu">' + an(g.chu) + '</div>' +
        '<button class="gy-bo" type="button" data-bo="' + i + '">Bỏ góp ý này</button>' +
        '</div>';
    }).join('');
  }

  function batGopY() {
    $('#gy-ds').addEventListener('click', function (e) {
      var nut = e.target.closest('[data-bo]');
      if (!nut || !window.GOPY) return;
      window.GOPY.bo(+nut.dataset.bo);
      veGopY();
    });
    $('#gy-xoa').addEventListener('click', function () {
      if (!window.GOPY || !confirm('Xoá hết góp ý đã ghi?')) return;
      window.GOPY.xoaHet();
      veGopY();
      bao('Đã xoá hết góp ý');
    });
    $('#gy-chep').addEventListener('click', function () {
      var ds = (window.GOPY && window.GOPY.doc()) || [];
      if (!ds.length) { bao('Chưa có góp ý nào'); return; }
      var chu = ds.map(function (g, i) {
        return (i + 1) + '. [' + g.trang + ' › ' + g.nhan + ']\n   ' + g.chu;
      }).join('\n\n');
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText('GÓP Ý TRANG 37FTU\n\n' + chu)
          .then(function () { bao('Đã chép ' + ds.length + ' góp ý — dán vào khung chat'); },
            function () { bao('Trình duyệt không cho chép'); });
      }
    });
  }

  /* ---------------------------------------------------------------
     Tab
     --------------------------------------------------------------- */

  var CAC_TAB = ['nguoi', 'huyen', 'lichsu', 'gopy'];

  function chuyenTab(t) {
    document.querySelectorAll('.ad-tab button').forEach(function (x) {
      x.setAttribute('aria-selected', x.dataset.tab === t ? 'true' : 'false');
    });
    CAC_TAB.forEach(function (x) { $('#tab-' + x).hidden = x !== t; });
    if (t === 'gopy') veGopY();
    if (t === 'huyen') veHuyen();
    if (t === 'lichsu') veLichSu();
  }

  function batTab() {
    document.querySelectorAll('.ad-tab button').forEach(function (b) {
      b.addEventListener('click', function () { chuyenTab(b.dataset.tab); });
    });
  }

  /* ---------------------------------------------------------------
     Khởi động
     --------------------------------------------------------------- */

  function dungBoLoc() {
    $('#loc-que').innerHTML = '<option value="">Mọi quê</option>' +
      HUYEN.map(function (h) { return '<option value="' + an(h.id) + '">' + an(h.ten) + '</option>'; }).join('');
    $('#hl-que').innerHTML = '<option value="">— Chọn huyện —</option>' +
      HUYEN.map(function (h) { return '<option value="' + an(h.id) + '">' + an(h.ten) + '</option>'; }).join('');
    $('#loc-nhom').innerHTML = '<option value="">Mọi cấp bậc</option>' +
      NHOM.map(function (n) { return '<option value="' + an(n) + '">' + an(n) + '</option>'; }).join('');
    $('#loc-ban').innerHTML = '<option value="">Mọi ban</option>' +
      BAN.map(function (n) { return '<option value="' + an(n) + '">Ban ' + an(n) + '</option>'; }).join('');

    ['#loc-tim', '#loc-que', '#loc-nhom', '#loc-ban', '#loc-thieu-que'].forEach(function (s) {
      $(s).addEventListener('input', veNguoi);
      $(s).addEventListener('change', veNguoi);
    });
  }

  function themNguoi() {
    nhoDeHoanTac();
    DL.nguoi.unshift({
      ma: 'tay-' + Date.now(), ten: '', gen: 0, que: '', bac: 1,
      chuc_vu: 'Thành viên', nhom: 'Thành viên', ban: '',
      nhiem_ky_dau: '', nhiem_ky_cuoi: '', so_nhiem_ky: 0,
      nhiem_ky: [], hanh_trinh: [], thanh_tich: [], loi_nhan: '', lien_he: ''
    });
    // bỏ bộ lọc, không thì người vừa thêm không hiện ra
    $('#loc-tim').value = ''; $('#loc-que').value = '';
    $('#loc-nhom').value = ''; $('#loc-ban').value = '';
    $('#loc-thieu-que').checked = false;
    luuNhap(); veNguoi();
    var o = $('#than-nguoi input[data-o="ten"]');
    if (o) o.focus();
  }

  function batNut() {
    $('#nut-luu').addEventListener('click', luuLenWeb);
    $('#nut-hoan').addEventListener('click', hoanTac);
    $('#them-nguoi').addEventListener('click', themNguoi);
    $('#an-nhac').addEventListener('click', function () { $('#ad-nhac').hidden = true; });

    var menu = $('#ad-them');
    function trongMenu(f) { return function () { menu.open = false; f(); }; }
    $('#nut-tai').addEventListener('click', trongMenu(taiVe));
    $('#nut-chep').addEventListener('click', trongMenu(chepJSON));
    $('#nut-nap').addEventListener('click', trongMenu(function () { $('#o-nap').click(); }));
    $('#o-nap').addEventListener('change', function () {
      var tep = this.files && this.files[0];
      if (tep) napFile(tep);
      this.value = '';
    });
    document.addEventListener('click', function (e) {
      if (menu.open && !e.target.closest('#ad-them')) menu.open = false;
    });

    // Ctrl+S / Cmd+S = Lưu lên web
    document.addEventListener('keydown', function (e) {
      if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        luuLenWeb();
      }
    });

    window.addEventListener('beforeunload', function (e) {
      if (!COI_DOI) return;
      e.preventDefault();
      e.returnValue = '';
    });
  }

  function chay(dl, huyen) {
    HUYEN = huyen;
    GOC = JSON.stringify(dl);
    DL = JSON.parse(GOC);
    DL.nguoi = DL.nguoi || [];

    // nhặt lại bản nháp lần trước, nếu có
    var nhap = docNhap();
    if (nhap) {
      var lech = WEB.nguon === 'web' && nhap.ban_goc != null && nhap.ban_goc !== BAN_GOC;
      if (confirm('Lần trước có sửa dở ' + nhap.dl.nguoi.length + ' dòng mà chưa lưu.\n' +
        'Mở lại bản đang sửa dở đó?' +
        (lech ? '\n\nLưu ý: sau lúc đó đã có người lưu bản mới hơn lên web (bản số ' + BAN_GOC +
          '). Mở bản sửa dở thì lúc lưu sẽ được hỏi lại.' : '') +
        '\n\n(Bấm Huỷ để bắt đầu từ bản ' + (WEB.nguon === 'web' ? 'đang chạy trên web' : 'trong file') + '.)')) {
        DL = nhap.dl;
        if (nhap.ban_goc != null) BAN_GOC = nhap.ban_goc;   // lúc lưu sẽ so với đúng bản nó dựa vào
      } else {
        try { localStorage.removeItem(KHOA_NHAP); } catch (e) { /* bỏ qua */ }
      }
    }

    if (!CO_WEB) $('#nut-luu').textContent = 'Tải file về';

    dungBoLoc();
    batTab();
    batSuaNguoi();
    batHangLoat();
    batGopY();
    batLichSu();
    batDangNhap();
    batNut();
    veNguoi();
    veHuyen();
    veGopY();
    luuNhap();
    veTaiKhoan();
    veNhac();

    if (PHIEN) {
      kiemQuyen().catch(function (e) {
        if (e.status === 401) xoaPhien();
        veTaiKhoan();
        veNhac();
      });
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    docPhien();
    var napFileGoc = fetch('data/thanh-vien.json', { cache: 'no-store' }).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    });
    var napBanDo = fetch('data/nghe-an.json').then(function (r) { return r.json(); });
    var napWeb = CO_WEB
      ? napTuWeb(false).catch(function (e) { return { loi: e }; })
      : Promise.resolve(null);

    Promise.all([napFileGoc.catch(function (e) { return { loiFile: e }; }), napBanDo, napWeb]).then(function (kq) {
      var huyen = (kq[1].units || []).map(function (u) { return { id: u.id, ten: u.name }; })
        .sort(function (a, b) { return a.ten.localeCompare(b.ten, 'vi'); });
      var file = kq[0], web = kq[2], goc;
      if (web && !web.loi && web.du_lieu) {
        goc = web.du_lieu;
        WEB = { nguon: 'web', phien_ban: web.phien_ban, cap_nhat: web.cap_nhat, loi: '' };
        BAN_GOC = web.phien_ban;
      } else {
        if (file.loiFile) throw file.loiFile;
        goc = file;
        WEB = { nguon: 'file', phien_ban: 0, cap_nhat: null, loi: web && web.loi ? chuLoi(web.loi) : '' };
        BAN_GOC = 0;
      }
      chay(goc, huyen);
    }).catch(function (e) {
      $('#trang-thai').textContent = 'không nạp được dữ liệu';
      $('#ad-nhac-chu').innerHTML = '<b>Không mở được dữ liệu.</b> Trang này phải chạy qua web ' +
        'server chứ không mở thẳng bằng file:// — xem README mục 1. Chi tiết: ' + an(e.message);
    });
  });
})();
