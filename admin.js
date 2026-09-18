/* =====================================================================
   TRANG SỬA DỮ LIỆU — 37FTU

   Trang tĩnh, không có máy chủ nào để ghi vào. Nên cách làm là:
     nạp data/thanh-vien.json  ->  sửa trong bảng  ->  tải file mới về
     ->  chép đè vào thư mục data/  ->  đẩy lên GitHub.

   Bản nháp được giữ trong localStorage của chính máy này, đóng tab không
   mất. Nhưng nó KHÔNG phải nơi lưu trữ thật: xoá dữ liệu trình duyệt là
   bay. Sửa xong thì tải file về ngay.

   Trang này ai mở cũng được (nó nằm trong repo công khai), nhưng mở ra
   cũng không đổi được gì trên trang thật — không có đường ghi ngược lại.

   SỐNG CHUNG VỚI tools/tu-sheet.py
   Script đó cũng ghi vào data/thanh-vien.json. Để lần chạy script sau không
   xoá mất công sửa ở đây, mỗi người mang theo:
     sua_tay  — danh sách ô đã sửa tay; script gặp là giữ nguyên, không ghi đè
     an_ma    — { mã băm SHA-256: quê } của người đã bị gỡ tên; script gặp
                thì không nêu tên lại, nhưng vẫn đếm họ vào tổng của quê đó
   Băm chứ không ghi tên: file công khai, người đã xin gỡ tên thì tên không
   được nằm lại trong đó dưới bất kỳ dạng đọc được nào.
   ===================================================================== */
(function () {
  'use strict';

  var $ = function (s) { return document.querySelector(s); };
  var KHOA_NHAP = '37ftu_admin_nhap';

  var GOC = null;      // bản vừa nạp từ file, để so xem có sửa gì không
  var DL = null;       // bản đang sửa
  var HUYEN = [];      // [{id, ten}] — 21 huyện, lấy từ data/nghe-an.json
  var LICH_SU = [];    // để hoàn tác
  var COI_DOI = false;

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

  var henBao = 0;
  function bao(chu) {
    var el = $('#ad-bao');
    el.textContent = chu;
    el.hidden = false;
    clearTimeout(henBao);
    henBao = setTimeout(function () { el.hidden = true; }, 2200);
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
      if (COI_DOI) localStorage.setItem(KHOA_NHAP, JSON.stringify(DL));
      else localStorage.removeItem(KHOA_NHAP);
    } catch (e) { /* trình duyệt chặn localStorage thì thôi, vẫn sửa được */ }
    var tt = $('#trang-thai');
    tt.textContent = COI_DOI ? 'có thay đổi chưa tải về' : 'chưa sửa gì';
    tt.classList.toggle('co-doi', COI_DOI);
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

  function docO(el, p) {
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
      var moi = docO(el, p);
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
     Xuất file
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

  /* Dựng nội dung file data/thanh-vien.json. Trả Promise vì phải băm mã. */
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

      var nguoi = DL.nguoi.filter(function (p) { return p.ten; });
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

  function taiVe() {
    dungFileRa().then(function (chu) {
      var blob = new Blob([chu], { type: 'application/json' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'thanh-vien.json';
      document.body.appendChild(a);
      a.click();
      setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
      bao('Đã tải về — chép đè vào thư mục data/');
    }, function (e) { bao(e.message); });
  }

  function chepJSON() {
    dungFileRa().then(function (chu) {
      if (!(navigator.clipboard && navigator.clipboard.writeText)) throw new Error('khong chep');
      return navigator.clipboard.writeText(chu);
    }).then(function () { bao('Đã chép JSON'); },
      function () { bao('Không chép được — dùng nút Tải file về'); });
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

  function batTab() {
    var nut = document.querySelectorAll('.ad-tab button');
    nut.forEach(function (b) {
      b.addEventListener('click', function () {
        nut.forEach(function (x) { x.setAttribute('aria-selected', x === b ? 'true' : 'false'); });
        ['nguoi', 'huyen', 'gopy'].forEach(function (t) {
          $('#tab-' + t).hidden = t !== b.dataset.tab;
        });
        if (b.dataset.tab === 'gopy') veGopY();
        if (b.dataset.tab === 'huyen') veHuyen();
      });
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

  function chay(dl, huyen) {
    HUYEN = huyen;
    GOC = JSON.stringify(dl);
    DL = JSON.parse(GOC);
    DL.nguoi = DL.nguoi || [];

    // nhặt lại bản nháp lần trước, nếu có
    try {
      var nhap = localStorage.getItem(KHOA_NHAP);
      if (nhap) {
        var cu = JSON.parse(nhap);
        if (cu && cu.nguoi && confirm(
          'Lần trước có sửa dở ' + cu.nguoi.length + ' dòng mà chưa tải file về.\n' +
          'Mở lại bản đang sửa dở đó?\n\n(Bấm Huỷ để bắt đầu lại từ file gốc.)')) {
          DL = cu;
        } else {
          localStorage.removeItem(KHOA_NHAP);
        }
      }
    } catch (e) { /* bỏ qua */ }

    dungBoLoc();
    batTab();
    batSuaNguoi();
    batHangLoat();
    batGopY();
    veNguoi();
    veHuyen();
    veGopY();
    luuNhap();

    $('#nut-tai').addEventListener('click', taiVe);
    $('#nut-chep').addEventListener('click', chepJSON);
    $('#nut-hoan').addEventListener('click', hoanTac);
    $('#them-nguoi').addEventListener('click', themNguoi);
    $('#an-nhac').addEventListener('click', function () { $('#ad-nhac').hidden = true; });

    window.addEventListener('beforeunload', function (e) {
      if (!COI_DOI) return;
      e.preventDefault();
      e.returnValue = '';
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    Promise.all([
      fetch('data/thanh-vien.json').then(function (r) { return r.json(); }),
      fetch('data/nghe-an.json').then(function (r) { return r.json(); })
    ]).then(function (kq) {
      var huyen = (kq[1].units || []).map(function (u) { return { id: u.id, ten: u.name }; })
        .sort(function (a, b) { return a.ten.localeCompare(b.ten, 'vi'); });
      chay(kq[0], huyen);
    }).catch(function (e) {
      $('#trang-thai').textContent = 'không nạp được dữ liệu';
      $('#ad-nhac').innerHTML = '<b>Không mở được dữ liệu.</b> Trang này phải chạy qua web ' +
        'server chứ không mở thẳng bằng file:// — xem README mục 1. Chi tiết: ' + an(e.message);
    });
  });
})();
