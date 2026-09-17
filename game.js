/* Góc game bàn trực — 37FTU
   Trò 1: Bắt lươn xứ Nghệ (canvas)
   Trò 2: Giọng Nghệ tốc độ (đoán nghĩa từ địa phương) */
(function () {
  'use strict';
  var $ = function (s) { return document.querySelector(s); };
  var an = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };
  var TEN_TRO = { luon: 'Bắt lươn xứ Nghệ', giong: 'Giọng Nghệ tốc độ' };
  var K_BXH = '37ftu_game_bxh', K_TEN = '37ftu_game_ten', K_TIENG = '37ftu_game_tieng';
  var tieng = true, TEN = '', TRO = 'luon';

  /* ================= Tiếng ================= */
  var actx = null;
  function beep(f, dai, loai) {
    if (!tieng) return;
    try {
      if (!actx) actx = new (window.AudioContext || window.webkitAudioContext)();
      if (actx.state === 'suspended') actx.resume();
      var o = actx.createOscillator(), g = actx.createGain();
      o.type = loai || 'triangle';
      o.frequency.value = f;
      g.gain.setValueAtTime(0.06, actx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.0001, actx.currentTime + (dai || 0.09));
      o.connect(g); g.connect(actx.destination);
      o.start(); o.stop(actx.currentTime + (dai || 0.09) + 0.02);
    } catch (e) {}
  }
  function rung(x) { if (navigator.vibrate) { try { navigator.vibrate(x); } catch (e) {} } }

  /* ================= Bảng xếp hạng ================= */
  function docBxh() {
    try { return JSON.parse(localStorage.getItem(K_BXH) || '{}'); } catch (e) { return {}; }
  }
  function bangHtml(tro, noiBat) {
    var ds = (docBxh()[tro] || []);
    var h = '<div class="bxh-hop"><h3>' + an(TEN_TRO[tro]) + '</h3>';
    if (!ds.length) h += '<p class="bxh-trong">Chưa ai chơi. Em mở hàng đi.</p>';
    else h += ds.map(function (x, i) {
      var toi = noiBat && x.ten === noiBat.ten && x.diem === noiBat.diem && x.luc === noiBat.luc;
      return '<div class="bxh-dong' + (toi ? ' toi' : '') + '"><em>' + (i + 1) + '</em><b>' +
        an(x.ten) + '</b><span>' + x.diem + '</span></div>';
    }).join('');
    h += '<button class="bxh-xoa" data-xoa="' + tro + '" type="button">Xoá bảng này</button></div>';
    return h;
  }
  function veBxhChung(noiBat) {
    var el = $('#bxh-chung');
    el.className = 'gm-bxh doi';
    el.innerHTML = bangHtml('luon') + bangHtml('giong');
    ganXoa(el, function () { veBxhChung(); });
  }
  function ganXoa(goc, sau) {
    goc.querySelectorAll('[data-xoa]').forEach(function (b) {
      b.addEventListener('click', function () {
        var t = b.getAttribute('data-xoa');
        var bx = docBxh(); delete bx[t];
        try { localStorage.setItem(K_BXH, JSON.stringify(bx)); } catch (e) {}
        sau();
      });
    });
  }

  /* ================= Chuyển màn ================= */
  var MAN = ['man-chon', 'man-ten', 'man-luon', 'man-giong', 'man-xong'];
  function moMan(id) {
    MAN.forEach(function (m) { document.getElementById(m).hidden = (m !== id); });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /* =====================================================================
     TRÒ 1 — BẮT LƯƠN
     ===================================================================== */
  var L = null;
  function luonBatDau() {
    var cv = $('#luon-canvas');
    var ctx = cv.getContext('2d');
    var boc = cv.parentElement;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var W = 0, H = 0;

    function coLai() {
      W = boc.clientWidth;
      H = Math.max(260, Math.min(Math.round(W * 0.6), Math.round(window.innerHeight * 0.58)));
      cv.width = W * dpr; cv.height = H * dpr;
      cv.style.height = H + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    coLai();
    window.addEventListener('resize', coLai);

    L = {
      cv: cv, ctx: ctx, diem: 0, giay: 45, luon: [], beo: [], hieu: [], song: [],
      combo: 1, lanCuoi: 0, xong: false, dungLai: false, coLai: coLai
    };
    for (var i = 0; i < 5; i++) {
      L.song.push({ y: Math.random(), a: 6 + Math.random() * 10, p: Math.random() * 6.28, v: 0.15 + Math.random() * 0.3 });
    }

    $('#luon-diem').textContent = '0';
    $('#luon-giay').textContent = '45';
    $('#luon-thanh').style.width = '100%';
    $('#luon-thanh').classList.remove('gap');
    $('#luon-combo').hidden = true;

    cv.onpointerdown = function (e) {
      if (L.dungLai || L.xong) return;
      var r = cv.getBoundingClientRect();
      cham(e.clientX - r.left, e.clientY - r.top);
    };

    // đếm 3-2-1 rồi mới chạy
    var dv = $('#luon-dem-vao');
    dv.hidden = false;
    L.dungLai = true;
    var n = 3;
    dv.textContent = n;
    beep(520, .12);
    var dem = setInterval(function () {
      n--;
      if (n > 0) { dv.textContent = n; beep(520, .12); }
      else {
        clearInterval(dem);
        dv.textContent = 'Bắt!';
        beep(880, .18);
        setTimeout(function () { dv.hidden = true; L.dungLai = false; chay(); }, 420);
      }
    }, 700);

    function themLuon() {
      var trai = Math.random() < 0.5;
      var kho = 1 + (45 - L.giay) / 45;       // càng về sau càng nhanh
      L.luon.push({
        x: trai ? -70 : W + 70,
        y: 40 + Math.random() * (H - 80),
        huong: trai ? 1 : -1,
        v: (84 + Math.random() * 52) * kho,
        pha: Math.random() * 6.28,
        dai: 46 + Math.random() * 26,
        bien: 7 + Math.random() * 7,
        day: 8 + Math.random() * 4
      });
    }
    function themBeo() {
      L.beo.push({
        x: Math.random() * (W - 60) + 30,
        y: -40,
        v: 20 + Math.random() * 26,
        xoay: Math.random() * 6.28,
        r: 18 + Math.random() * 9
      });
    }

    function diemLuon(l, t) {   // toạ độ một đoạn thân lươn
      return {
        x: l.x - l.huong * t * l.dai,
        y: l.y + Math.sin(l.pha + t * 3.1) * l.bien
      };
    }

    function cham(x, y) {
      // lươn trước, bèo sau
      for (var i = L.luon.length - 1; i >= 0; i--) {
        var l = L.luon[i];
        for (var t = 0; t <= 1.001; t += 0.14) {
          var p = diemLuon(l, t);
          if ((p.x - x) * (p.x - x) + (p.y - y) * (p.y - y) < 26 * 26) {
            batDuoc(l, i, x, y);
            return;
          }
        }
      }
      for (var j = L.beo.length - 1; j >= 0; j--) {
        var b = L.beo[j];
        if ((b.x - x) * (b.x - x) + (b.y - y) * (b.y - y) < (b.r + 8) * (b.r + 8)) {
          L.beo.splice(j, 1);
          L.diem = Math.max(0, L.diem - 5);
          L.combo = 1;
          $('#luon-combo').hidden = true;
          L.hieu.push({ x: x, y: y, chu: '−5 bèo!', t: 0, mau: '#FF8A7A' });
          $('#luon-diem').textContent = L.diem;
          beep(180, .18, 'sawtooth'); rung(60);
          return;
        }
      }
      L.combo = 1;
      $('#luon-combo').hidden = true;
      L.hieu.push({ x: x, y: y, chu: 'hụt!', t: 0, mau: 'rgba(255,255,255,.55)' });
      beep(240, .07);
    }

    function batDuoc(l, i, x, y) {
      L.luon.splice(i, 1);
      var gio = performance.now();
      L.combo = (gio - L.lanCuoi < 1300) ? Math.min(5, L.combo + 1) : 1;
      L.lanCuoi = gio;
      var d = 10 * L.combo;
      L.diem += d;
      $('#luon-diem').textContent = L.diem;
      L.hieu.push({ x: x, y: y, chu: '+' + d, t: 0, mau: '#FFD27A' });
      L.song.push({ y: y / H, a: 4, p: 0, v: .4 });
      if (L.song.length > 9) L.song.shift();
      if (L.combo > 1) {
        var c = $('#luon-combo');
        c.hidden = false;
        c.textContent = 'x' + L.combo + ' liên tiếp!';
      }
      beep(560 + L.combo * 110, .1); rung(25);
    }

    /* ---- vẽ ---- */
    function ve() {
      var g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#123A2E');
      g.addColorStop(1, '#0B221C');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);

      ctx.strokeStyle = 'rgba(255,255,255,.055)';
      ctx.lineWidth = 2;
      L.song.forEach(function (s) {
        ctx.beginPath();
        for (var x = 0; x <= W; x += 14) {
          var yy = s.y * H + Math.sin(x / 46 + s.p) * s.a;
          if (x === 0) ctx.moveTo(x, yy); else ctx.lineTo(x, yy);
        }
        ctx.stroke();
      });

      L.beo.forEach(function (b) {
        ctx.save();
        ctx.translate(b.x, b.y);
        ctx.rotate(b.xoay);
        for (var k = 0; k < 5; k++) {
          ctx.beginPath();
          ctx.ellipse(Math.cos(k * 1.26) * b.r * .55, Math.sin(k * 1.26) * b.r * .55,
            b.r * .5, b.r * .34, k * 1.26, 0, 6.29);
          ctx.fillStyle = k % 2 ? '#3E8E5A' : '#4FA96B';
          ctx.fill();
        }
        ctx.beginPath();
        ctx.arc(0, 0, b.r * .28, 0, 6.29);
        ctx.fillStyle = '#9BD4A4'; ctx.fill();
        ctx.restore();
      });

      L.luon.forEach(function (l) {
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = '#6E4322';
        ctx.lineWidth = l.day;
        ctx.beginPath();
        for (var t = 0; t <= 1.001; t += 0.1) {
          var p = diemLuon(l, t);
          if (t === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y);
        }
        ctx.stroke();
        ctx.strokeStyle = 'rgba(255,196,120,.45)';
        ctx.lineWidth = l.day * .32;
        ctx.stroke();
        var d = diemLuon(l, 0);
        ctx.beginPath();
        ctx.arc(d.x, d.y, l.day * .62, 0, 6.29);
        ctx.fillStyle = '#7C4B25'; ctx.fill();
        ctx.beginPath();
        ctx.arc(d.x + l.huong * 2, d.y - 2, 1.7, 0, 6.29);
        ctx.fillStyle = '#120C0A'; ctx.fill();
      });

      L.hieu.forEach(function (h) {
        ctx.globalAlpha = Math.max(0, 1 - h.t / .9);
        ctx.fillStyle = h.mau;
        ctx.font = '800 20px "Be Vietnam Pro", system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(h.chu, h.x, h.y - h.t * 46);
        ctx.globalAlpha = 1;
      });
    }

    /* ---- vòng lặp ---- */
    var truoc = performance.now(), gomSinh = 0, gomBeo = 0;
    function chay() {
      truoc = performance.now();
      requestAnimationFrame(vong);
    }
    function vong(gio) {
      if (L.xong) return;
      var dt = Math.min((gio - truoc) / 1000, 0.05);
      truoc = gio;
      if (!L.dungLai) {
        L.giay -= dt;
        if (L.giay <= 0) { L.giay = 0; return ketThuc(); }
        $('#luon-giay').textContent = Math.ceil(L.giay);
        $('#luon-thanh').style.width = (L.giay / 45 * 100) + '%';
        $('#luon-thanh').classList.toggle('gap', L.giay <= 10);

        gomSinh -= dt;
        if (gomSinh <= 0) {
          if (L.luon.length < 7) themLuon();   // đông quá thì bắt dễ, chẳng còn gì vui
          gomSinh = Math.max(0.34, 0.7 - (45 - L.giay) / 120);
        }
        gomBeo -= dt;
        if (gomBeo <= 0) { themBeo(); gomBeo = 1.7 + Math.random() * 1.6; }

        L.luon.forEach(function (l) { l.x += l.huong * l.v * dt; l.pha += dt * 5.4; });
        L.luon = L.luon.filter(function (l) { return l.x > -160 && l.x < W + 160; });
        L.beo.forEach(function (b) { b.y += b.v * dt; b.xoay += dt * .5; });
        L.beo = L.beo.filter(function (b) { return b.y < H + 60; });
        L.song.forEach(function (s) { s.p += s.v * dt * 3; });
        L.hieu.forEach(function (h) { h.t += dt; });
        L.hieu = L.hieu.filter(function (h) { return h.t < .9; });
        if (L.combo > 1 && gio - L.lanCuoi > 1300) {
          L.combo = 1; $('#luon-combo').hidden = true;
        }
      }
      ve();
      requestAnimationFrame(vong);
    }

    function ketThuc() {
      L.xong = true;
      window.removeEventListener('resize', coLai);
      cv.onpointerdown = null;
      xongTro('luon', L.diem);
    }
  }

  /* =====================================================================
     TRÒ 2 — GIỌNG NGHỆ TỐC ĐỘ
     ===================================================================== */
  var TU = [
    ['mô', 'đâu', 'Em quê mô?'],
    ['tê', 'kia', 'Đứng bên tê đường.'],
    ['răng', 'sao', 'Răng rứa em?'],
    ['rứa', 'thế, vậy', 'Rứa à?'],
    ['chi', 'gì', 'Ăn chi chưa?'],
    ['ni', 'này', 'Bựa ni trời đẹp.'],
    ['nớ', 'ấy, đó', 'Cái nớ của ai?'],
    ['nỏ', 'không', 'Nỏ biết mô.'],
    ['chộ', 'thấy', 'Tau nỏ chộ chi cả.'],
    ['ngái', 'xa', 'Nhà em có ngái không?'],
    ['mần', 'làm', 'Mần răng chừ?'],
    ['nhác', 'lười', 'Thằng nớ nhác lắm.'],
    ['trốc', 'đầu', 'Đau trốc quá.'],
    ['cẳng', 'chân', 'Mỏi cẳng rồi.'],
    ['đọi', 'bát', 'Ăn thêm đọi nữa.'],
    ['cươi', 'sân', 'Ra cươi phơi lúa.'],
    ['nác', 'nước', 'Cho xin ngụm nác.'],
    ['tru', 'trâu', 'Đi chăn tru.'],
    ['trấy', 'quả, trái', 'Trấy cam ngọt lắm.'],
    ['túi', 'tối', 'Túi ni đi mô?'],
    ['khun', 'khôn', 'Đứa ni khun lắm.'],
    ['bổ', 'ngã', 'Coi chừng bổ chừ.'],
    ['ả', 'chị', 'Ả đi mô rồi?'],
    ['eng', 'anh', 'Eng ơi, chờ với!'],
    ['su', 'sâu', 'Nác su lắm, đừng xuống.'],
    ['đàng', 'đường', 'Ra đàng cái đã.'],
    ['bựa', 'bữa, ngày', 'Bựa qua em ở mô?'],
    ['choa', 'chúng tao', 'Choa đi trước hè.']
  ];
  var G = null;

  function tron(a) {
    a = a.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function giongBatDau() {
    G = { cau: tron(TU).slice(0, 10), i: 0, diem: 0, dung: 0, hen: null, raf: null };
    $('#giong-diem').textContent = '0';
    veCau();
  }

  function veCau() {
    if (G.i >= G.cau.length) return xongTro('giong', G.diem);
    var c = G.cau[G.i];
    $('#giong-cau').textContent = (G.i + 1) + '/10';
    $('#giong-tu').textContent = c[0];
    $('#giong-vd').textContent = '“' + c[2] + '”';
    $('#giong-bao').hidden = true;

    var sai = tron(TU.filter(function (x) { return x[1] !== c[1]; })).slice(0, 3).map(function (x) { return x[1]; });
    var dap = tron([c[1]].concat(sai));
    var hop = $('#giong-dap');
    hop.innerHTML = '';
    dap.forEach(function (d) {
      var b = document.createElement('button');
      b.type = 'button';
      b.textContent = d;
      b.addEventListener('click', function () { traLoi(d, b); });
      hop.appendChild(b);
    });

    // đồng hồ 6 giây
    var het = performance.now() + 6000;
    G.het = het;
    var thanh = $('#giong-thanh');
    thanh.classList.remove('gap');
    cancelAnimationFrame(G.raf);
    (function nhip() {
      var con = het - performance.now();
      if (con <= 0) { thanh.style.width = '0%'; return traLoi(null, null); }
      thanh.style.width = (con / 6000 * 100) + '%';
      thanh.classList.toggle('gap', con < 2000);
      G.raf = requestAnimationFrame(nhip);
    })();
  }

  function traLoi(chon, nut) {
    cancelAnimationFrame(G.raf);
    var c = G.cau[G.i];
    var dung = chon === c[1];
    var con = Math.max(0, G.het - performance.now());
    var them = dung ? 100 + Math.round(con / 1000) * 20 : 0;
    G.diem += them;
    if (dung) G.dung++;
    $('#giong-diem').textContent = G.diem;

    var hop = $('#giong-dap');
    hop.querySelectorAll('button').forEach(function (b) {
      b.disabled = true;
      if (b.textContent === c[1]) b.classList.add('dung');
    });
    if (nut && !dung) nut.classList.add('sai');

    var bao = $('#giong-bao');
    bao.hidden = false;
    bao.className = 'gm-bao ' + (dung ? 'tot' : 'te');
    bao.textContent = dung
      ? 'Chuẩn! +' + them + ' điểm'
      : (chon === null ? 'Hết giờ rồi — ' : 'Chưa đúng — ') + '“' + c[0] + '” là “' + c[1] + '”';
    beep(dung ? 780 : 200, dung ? .1 : .2, dung ? 'triangle' : 'sawtooth');
    rung(dung ? 20 : 60);

    G.i++;
    clearTimeout(G.hen);
    G.hen = setTimeout(veCau, 1250);
  }

  /* =====================================================================
     KẾT THÚC MỘT LƯỢT
     ===================================================================== */
  function loiKhen(tro, diem) {
    if (tro === 'luon') {
      if (diem >= 400) return ['🏆', 'Tay lươn có nghề!'];
      if (diem >= 250) return ['🔥', 'Nhanh tay ra phết.'];
      if (diem >= 120) return ['🙂', 'Cũng được đó chứ.'];
      return ['🫣', 'Lươn nó trơn lắm, thông cảm.'];
    }
    var d = G ? G.dung : 0;
    if (d >= 9) return ['🏆', 'Nghệ xịn, không lẫn đi mô được!'];
    if (d >= 7) return ['🔥', 'Nghe giọng là biết dân mình.'];
    if (d >= 4) return ['🙂', 'Nghệ pha — về quê ăn Tết là lên tay ngay.'];
    return ['🫣', 'Ra Hà Nội lâu quá rồi phải không?'];
  }

  function xongTro(tro, diem) {
    var moc = { ten: TEN, diem: diem, luc: Date.now() };
    var b = docBxh();
    b[tro] = (b[tro] || []).concat([moc]).sort(function (x, y) { return y.diem - x.diem; }).slice(0, 8);
    try { localStorage.setItem(K_BXH, JSON.stringify(b)); } catch (e) {}
    var hang = b[tro].map(function (x) { return x.luc; }).indexOf(moc.luc);

    var k = loiKhen(tro, diem);
    $('#xong-icon').textContent = k[0];
    $('#xong-tro').textContent = TEN_TRO[tro];
    $('#xong-loi').textContent = k[1];
    $('#xong-diem').textContent = diem;
    $('#xong-hang').textContent = hang >= 0
      ? TEN + ' đang đứng hạng ' + (hang + 1) + ' ở bàn trực hôm nay.'
      : TEN + ' chưa lọt vào 8 người dẫn đầu, chơi lại một lượt nữa đi.';

    var el = $('#bxh-tro');
    el.className = 'gm-bxh';
    el.innerHTML = bangHtml(tro, moc);
    ganXoa(el, function () { el.innerHTML = bangHtml(tro, moc); ganXoa(el, function () {}); });

    beep(660, .12); setTimeout(function () { beep(880, .16); }, 120);
    moMan('man-xong');
  }

  /* =====================================================================
     KHỞI ĐỘNG
     ===================================================================== */
  function batDauTro() {
    if (TRO === 'luon') { moMan('man-luon'); luonBatDau(); }
    else { moMan('man-giong'); giongBatDau(); }
  }

  document.addEventListener('DOMContentLoaded', function () {
    try { tieng = localStorage.getItem(K_TIENG) !== '0'; } catch (e) {}
    var nt = $('#gm-tieng');
    nt.setAttribute('aria-pressed', tieng ? 'true' : 'false');
    nt.textContent = tieng ? '🔊' : '🔇';
    nt.addEventListener('click', function () {
      tieng = !tieng;
      try { localStorage.setItem(K_TIENG, tieng ? '1' : '0'); } catch (e) {}
      nt.setAttribute('aria-pressed', tieng ? 'true' : 'false');
      nt.textContent = tieng ? '🔊' : '🔇';
      beep(760, .1);
    });

    $('#gm-toan').addEventListener('click', function () {
      try {
        if (!document.fullscreenElement) document.documentElement.requestFullscreen();
        else document.exitFullscreen();
      } catch (e) {}
    });

    // QR: chỉ hiện khi ban tổ chức đặt sẵn file assets/qr.png
    var qr = $('#qr-anh');
    function qrHong() {
      if (qr.parentNode) qr.remove();
      $('#qr-chu').textContent = 'Gen 16 đang mở đơn. Mở trang tuyển thành viên trên điện thoại của em.';
    }
    qr.addEventListener('load', function () { qr.hidden = false; });
    qr.addEventListener('error', qrHong);
    // ảnh có thể đã tải xong (hoặc đã lỗi) trước khi kịp gắn hai hàm trên
    if (qr.complete) { if (qr.naturalWidth) qr.hidden = false; else qrHong(); }

    document.querySelectorAll('.gm-tro').forEach(function (b) {
      b.addEventListener('click', function () {
        TRO = b.getAttribute('data-tro');
        $('#ten-tro').textContent = TEN_TRO[TRO];
        try { $('#o-ten').value = localStorage.getItem(K_TEN) || ''; } catch (e) {}
        moMan('man-ten');
        setTimeout(function () { $('#o-ten').focus(); }, 120);
      });
    });

    $('#form-ten').addEventListener('submit', function (e) {
      e.preventDefault();
      TEN = ($('#o-ten').value || '').trim().slice(0, 18) || 'Khách ở bàn trực';
      try { localStorage.setItem(K_TEN, TEN); } catch (e) {}
      batDauTro();
    });

    $('#xong-lai').addEventListener('click', batDauTro);

    document.querySelectorAll('[data-ve]').forEach(function (b) {
      b.addEventListener('click', function () {
        if (L) { L.xong = true; window.removeEventListener('resize', L.coLai); }
        if (G) { cancelAnimationFrame(G.raf); clearTimeout(G.hen); }
        veBxhChung();
        moMan('man-chon');
      });
    });

    veBxhChung();
  });
})();
