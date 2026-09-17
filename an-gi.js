/* Hôm nay ăn chi? — máy quay chọn món của 37FTU */
(function () {
  'use strict';
  var $ = function (s) { return document.querySelector(s); };
  var an = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };

  var MON = [], LY_DO = [];
  var LOC = { buoi: 'auto', tien: '', kieu: '' };
  var KQ = null, dangQuay = false, tieng = true;
  var lichSu = [];
  var K_LS = '37ftu_an_gi_lich_su', K_TIENG = '37ftu_an_gi_tieng';

  var NHOM = {
    buoi: [
      { v: 'auto', t: 'Theo giờ' }, { v: 'sang', t: 'Sáng' }, { v: 'trua', t: 'Trưa' },
      { v: 'chieu', t: 'Chiều' }, { v: 'toi', t: 'Tối' }, { v: 'dem', t: 'Khuya' }
    ],
    tien: [
      { v: '', t: 'Kệ' }, { v: 'duoi-25', t: 'Dưới 25k' },
      { v: '25-50', t: '25–50k' }, { v: 'tren-50', t: 'Trên 50k' }
    ],
    kieu: [
      { v: '', t: 'Gì cũng được' }, { v: 'que', t: 'Món quê' },
      { v: 'pho-thong', t: 'Món thường' }, { v: 'vat', t: 'Ăn vặt' }
    ]
  };

  var CHAO = {
    sang: ['Dậy chưa em', 'Sáng ni ăn chi?'],
    trua: ['Đói chưa', 'Trưa ni ăn chi?'],
    chieu: ['Nghỉ tay tí', 'Chiều ni ăn chi?'],
    toi: ['Xong việc chưa', 'Tối ni ăn chi?'],
    dem: ['Khuya rồi đó', 'Giờ ni còn ăn chi?']
  };

  function buoiHienTai() {
    var h = new Date().getHours();
    if (h < 10) return 'sang';
    if (h < 14) return 'trua';
    if (h < 17) return 'chieu';
    if (h < 22) return 'toi';
    return 'dem';
  }
  function buoiDangChon() { return LOC.buoi === 'auto' ? buoiHienTai() : LOC.buoi; }

  /* ---------------- Tiếng tách tách ---------------- */
  var actx = null;
  function tach(cao) {
    if (!tieng) return;
    try {
      if (!actx) actx = new (window.AudioContext || window.webkitAudioContext)();
      if (actx.state === 'suspended') actx.resume();
      var o = actx.createOscillator(), g = actx.createGain();
      o.type = 'triangle';
      o.frequency.value = cao || 680;
      g.gain.setValueAtTime(0.055, actx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.0001, actx.currentTime + 0.06);
      o.connect(g); g.connect(actx.destination);
      o.start(); o.stop(actx.currentTime + 0.07);
    } catch (e) {}
  }
  function keng() {
    if (!tieng) return;
    [660, 880, 1170].forEach(function (f, i) { setTimeout(function () { tach(f); }, i * 85); });
  }

  /* ---------------- Lọc món ---------------- */
  function hopTien(m) {
    if (LOC.tien === 'duoi-25') return m.gia < 25;
    if (LOC.tien === '25-50') return m.gia >= 25 && m.gia <= 50;
    if (LOC.tien === 'tren-50') return m.gia > 50;
    return true;
  }
  function locMon() {
    var b = buoiDangChon();
    return MON.filter(function (m) {
      if (LOC.kieu && m.kieu !== LOC.kieu) return false;
      if (!hopTien(m)) return false;
      return (m.buoi || []).indexOf(b) >= 0;
    });
  }

  /* Không có món nào khớp hết thì nới dần điều kiện thay vì chặn người ta lại —
     đứng giữa trưa mà bấm không được thì còn bực hơn lúc chưa vào trang. */
  function locNoi() {
    var ds = locMon();
    if (ds.length) return { ds: ds, noi: '' };
    var theoKieu = MON.filter(function (m) { return !LOC.kieu || m.kieu === LOC.kieu; });
    var d2 = theoKieu.filter(hopTien);
    if (d2.length) return { ds: d2, noi: 'buoi' };
    if (theoKieu.length) return { ds: theoKieu, noi: 'tien' };
    return { ds: MON, noi: 'kieu' };
  }

  var TEN_BUOI = { sang: 'sáng', trua: 'trưa', chieu: 'chiều', toi: 'tối', dem: 'khuya' };

  function capNhatDem() {
    var kq = locNoi();
    var nut = $('#ag-bam');
    var n = kq.ds.length;
    nut.disabled = (n === 0);
    if (n === 0) { $('#ag-bam-phu').textContent = 'chưa đọc được danh sách món'; return; }
    if (!kq.noi) {
      $('#ag-bam-phu').innerHTML = 'còn <b>' + n + '</b> món hợp ý em';
    } else if (kq.noi === 'buoi') {
      $('#ag-bam-phu').innerHTML = 'buổi ' + TEN_BUOI[buoiDangChon()] +
        ' không có món nào — anh lấy cả ngày, <b>' + n + '</b> món';
    } else if (kq.noi === 'tien') {
      $('#ag-bam-phu').innerHTML = 'khoảng tiền này không có món — anh bỏ qua túi tiền, <b>' + n + '</b> món';
    } else {
      $('#ag-bam-phu').innerHTML = 'không có món nào như rứa — anh lấy đại trong <b>' + n + '</b> món';
    }
  }

  /* ---------------- Chip lọc ---------------- */
  function veChip() {
    Object.keys(NHOM).forEach(function (nhom) {
      var hop = document.querySelector('.ag-chip[data-nhom="' + nhom + '"]');
      NHOM[nhom].forEach(function (x) {
        var b = document.createElement('button');
        b.type = 'button';
        b.textContent = x.t;
        b.setAttribute('aria-pressed', LOC[nhom] === x.v ? 'true' : 'false');
        b.addEventListener('click', function () {
          LOC[nhom] = x.v;
          hop.querySelectorAll('button').forEach(function (n) { n.setAttribute('aria-pressed', 'false'); });
          b.setAttribute('aria-pressed', 'true');
          tach(520);
          capNhatDem();
          veKheChoDoi();
        });
        hop.appendChild(b);
      });
    });
  }

  /* ---------------- Máy quay ---------------- */
  function oHtml(m) {
    return '<div class="ag-o"><i>' + an(m.icon || '🍽️') + '</i><div><b>' + an(m.ten) + '</b>' +
      '<small>' + an(m.gia) + 'k · ' + an(m.kieu === 'que' ? 'món quê' : m.kieu === 'vat' ? 'ăn vặt' : 'món thường') + '</small></div></div>';
  }

  function veKheChoDoi() {
    if (dangQuay) return;
    var ds = locNoi().ds;
    var cuon = $('#ag-cuon');
    cuon.style.transition = 'none';
    cuon.style.transform = 'translateY(0)';
    cuon.innerHTML = ds.length
      ? oHtml(ds[Math.floor(Math.random() * ds.length)])
      : '<div class="ag-o"><i>🤷</i><div><b>Chưa có món nào</b><small>nới bộ lọc ra chút</small></div></div>';
  }

  function chonMon(ds) {
    // tránh trùng 3 món vừa ăn cho đỡ nhàm
    var vua = lichSu.slice(0, 3).map(function (x) { return x.ten; });
    var con = ds.filter(function (m) { return vua.indexOf(m.ten) < 0; });
    var kho = con.length ? con : ds;
    return kho[Math.floor(Math.random() * kho.length)];
  }

  function quay() {
    if (dangQuay) return;
    var ds = locNoi().ds;
    if (!ds.length) return;
    dangQuay = true;
    KQ = chonMon(ds);

    var may = document.querySelector('.ag-may');
    var cuon = $('#ag-cuon');
    var khe = $('#ag-khe');
    may.classList.add('dang-quay');
    $('#ag-kq').hidden = true;
    $('#ag-bam').disabled = true;

    // Dựng dải: một mớ món ngẫu nhiên rồi tới món kết quả
    var dai = [];
    var n = 16 + Math.floor(Math.random() * 6);
    for (var i = 0; i < n; i++) dai.push(ds[Math.floor(Math.random() * ds.length)]);
    dai.push(KQ);
    cuon.innerHTML = dai.map(oHtml).join('');

    var cao = khe.clientHeight || 126;
    var dich = (dai.length - 1) * cao;

    cuon.style.transition = 'none';
    cuon.style.transform = 'translateY(0)';
    void cuon.offsetHeight; // ép trình duyệt vẽ lại trước khi chạy
    var giay = 2.3 + Math.random() * 0.5;
    cuon.style.transition = 'transform ' + giay + 's cubic-bezier(.12,.66,.12,1)';
    cuon.style.transform = 'translateY(-' + dich + 'px)';

    // Tiếng tách theo đúng nhịp cuộn: đọc vị trí thật của dải
    var truoc = -1;
    (function doi() {
      if (!dangQuay) return;
      var y = 0;
      try {
        var tr = getComputedStyle(cuon).transform;
        if (tr && tr !== 'none') y = Math.abs(parseFloat(tr.split(',')[5]));
      } catch (e) {}
      var idx = Math.round(y / cao);
      if (idx !== truoc) { truoc = idx; tach(620 + (idx % 3) * 70); }
      requestAnimationFrame(doi);
    })();

    setTimeout(function () {
      dangQuay = false;
      may.classList.remove('dang-quay');
      $('#ag-bam').disabled = false;
      hienKetQua(KQ);
      keng();
    }, giay * 1000 + 60);
  }

  function hienKetQua(m) {
    var b = buoiDangChon();
    if ((m.buoi || []).indexOf(b) < 0) b = (m.buoi || ['trua'])[0];
    var tenBuoi = { sang: 'bữa sáng', trua: 'bữa trưa', chieu: 'buổi chiều', toi: 'bữa tối', dem: 'khuya' }[b];
    $('#kq-icon').textContent = m.icon || '🍽️';
    $('#kq-ten').textContent = m.ten;
    $('#kq-chip').innerHTML = [
      'khoảng ' + m.gia + 'k',
      tenBuoi,
      m.kieu === 'que' ? 'đặc sản xứ Nghệ' : m.kieu === 'vat' ? 'ăn vặt' : 'món quen'
    ].map(function (x) { return '<span>' + an(x) + '</span>'; }).join('');
    $('#kq-mota').textContent = m.mo_ta || '';
    $('#kq-ly-do').textContent = LY_DO.length ? LY_DO[Math.floor(Math.random() * LY_DO.length)] : '';
    var cho = $('#kq-cho');
    if (m.goi_y_cho) { cho.hidden = false; cho.textContent = '📍 ' + m.goi_y_cho; }
    else cho.hidden = true;

    var the = document.querySelector('.ag-kq-the');
    the.classList.remove('da-chot');
    $('#kq-chep').textContent = 'Chép để gửi vào nhóm';
    $('#ag-kq').hidden = false;
    // chạy lại hoạt ảnh vào
    the.style.animation = 'none'; void the.offsetHeight; the.style.animation = '';
    if (navigator.vibrate) { try { navigator.vibrate(18); } catch (e) {} }
    $('#ag-kq').scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  /* ---------------- Chốt + pháo giấy ---------------- */
  function phao() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var hop = $('#ag-phao');
    var mau = ['#FA501E', '#FFB84D', '#FFE9E0', '#FF8A5B', '#FFFFFF'];
    for (var i = 0; i < 46; i++) {
      var s = document.createElement('i');
      s.style.left = Math.random() * 100 + '%';
      s.style.background = mau[i % mau.length];
      s.style.animationDuration = (1.5 + Math.random() * 1.3) + 's';
      s.style.animationDelay = (Math.random() * 0.35) + 's';
      s.style.transform = 'rotate(' + Math.random() * 360 + 'deg)';
      hop.appendChild(s);
    }
    setTimeout(function () { hop.innerHTML = ''; }, 3200);
  }

  function chot() {
    if (!KQ) return;
    lichSu.unshift({ ten: KQ.ten, icon: KQ.icon, luc: Date.now() });
    lichSu = lichSu.slice(0, 8);
    try { localStorage.setItem(K_LS, JSON.stringify(lichSu)); } catch (e) {}
    veLichSu();
    document.querySelector('.ag-kq-the').classList.add('da-chot');
    $('#kq-chot').textContent = 'Rứa là chốt nha!';
    phao(); keng();
    if (navigator.vibrate) { try { navigator.vibrate([15, 40, 25]); } catch (e) {} }
  }

  function veLichSu() {
    var hop = $('#ag-lich-su');
    if (!lichSu.length) { hop.hidden = true; return; }
    hop.hidden = false;
    $('#ag-ls-hang').innerHTML = lichSu.map(function (x) {
      return '<span>' + an(x.icon || '🍽️') + ' ' + an(x.ten) + '</span>';
    }).join('');
  }

  function chep() {
    if (!KQ) return;
    var chu = 'Hôm ni tau ăn ' + KQ.ten + '. ' + (KQ.mo_ta || '') + ' — chọn bởi "Hôm nay ăn chi?" của 37FTU';
    var xong = function () {
      $('#kq-chep').textContent = 'Đã chép rồi đó!';
      setTimeout(function () { $('#kq-chep').textContent = 'Chép để gửi vào nhóm'; }, 2200);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(chu).then(xong, tayChep);
    } else tayChep();
    function tayChep() {
      try {
        var t = document.createElement('textarea');
        t.value = chu; t.style.position = 'fixed'; t.style.opacity = '0';
        document.body.appendChild(t); t.select();
        document.execCommand('copy');
        document.body.removeChild(t);
        xong();
      } catch (e) {
        $('#kq-chep').textContent = 'Máy không cho chép, em tự gõ giúp nhé';
      }
    }
  }

  /* ---------------- Lắc điện thoại ---------------- */
  function nghenLac() {
    var mocThoiGian = 0;
    window.addEventListener('devicemotion', function (e) {
      var a = e.accelerationIncludingGravity;
      if (!a) return;
      var manh = Math.abs(a.x || 0) + Math.abs(a.y || 0) + Math.abs(a.z || 0);
      var gio = Date.now();
      if (manh > 34 && gio - mocThoiGian > 1400) { mocThoiGian = gio; quay(); }
    });
  }

  /* ---------------- Khởi động ---------------- */
  function chao() {
    var b = buoiHienTai();
    $('#ag-chao').textContent = CHAO[b][0];
    $('#ag-hoi').textContent = CHAO[b][1];
  }

  document.addEventListener('DOMContentLoaded', function () {
    chao();
    try { tieng = localStorage.getItem(K_TIENG) !== '0'; } catch (e) {}
    $('#nut-tieng').setAttribute('aria-pressed', tieng ? 'true' : 'false');
    $('#nut-tieng').textContent = tieng ? '🔊' : '🔇';
    $('#nut-tieng').addEventListener('click', function () {
      tieng = !tieng;
      try { localStorage.setItem(K_TIENG, tieng ? '1' : '0'); } catch (e) {}
      this.setAttribute('aria-pressed', tieng ? 'true' : 'false');
      this.textContent = tieng ? '🔊' : '🔇';
      tach(760);
    });

    try { lichSu = JSON.parse(localStorage.getItem(K_LS) || '[]'); } catch (e) { lichSu = []; }
    veLichSu();

    $('#ag-bam').addEventListener('click', function () {
      // iOS đòi hỏi xin phép cảm biến ngay trong một cú chạm của người dùng
      var DM = window.DeviceMotionEvent;
      if (DM && typeof DM.requestPermission === 'function' && !window.__daXinLac) {
        window.__daXinLac = true;
        DM.requestPermission().then(function (kq) { if (kq === 'granted') nghenLac(); }).catch(function () {});
      }
      quay();
    });
    $('#kq-quay').addEventListener('click', function () {
      quay();
      document.querySelector('.ag-may').scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
    $('#kq-chot').addEventListener('click', chot);
    $('#kq-chep').addEventListener('click', chep);
    $('#ag-xoa').addEventListener('click', function () {
      lichSu = [];
      try { localStorage.removeItem(K_LS); } catch (e) {}
      veLichSu();
    });
    document.addEventListener('keydown', function (e) {
      if (e.code === 'Space' && e.target === document.body) { e.preventDefault(); quay(); }
    });
    var DM2 = window.DeviceMotionEvent;
    if (DM2 && typeof DM2.requestPermission !== 'function') nghenLac();

    fetch('data/mon-an.json').then(function (r) { return r.json(); }).then(function (d) {
      MON = d.mon || [];
      LY_DO = d.ly_do || [];
      veChip();
      capNhatDem();
      veKheChoDoi();
    }).catch(function () {
      $('#ag-bam-phu').textContent = 'không đọc được danh sách món — chạy trang qua web server nhé';
      $('#ag-bam').disabled = true;
    });
  });
})();
