/* =====================================================================
   CHẾ ĐỘ GÓP Ý — 37FTU

   Mở bất kỳ trang nào với đuôi ?gopy=1 là bật. Mỗi khối nội dung được
   khoanh nét đứt; bấm vào khối nào thì ghi chú thẳng vào khối đó. Ghi chú
   nằm trong localStorage của máy này, gom về tab "Góp ý" trong admin.html,
   bấm một nút là chép ra dán vào khung chat.

   Vì sao làm kiểu này chứ không làm form gửi về máy chủ: trang này tĩnh,
   không có backend để nhận; mà dựng backend chỉ để nhận góp ý thì tốn hơn
   giá trị nó mang lại. Chép–dán là đủ, và không đẩy gì ra khỏi máy.

   Tắt: bỏ ?gopy=1 khỏi địa chỉ, hoặc bấm nút Tắt trong bảng góp ý.
   ===================================================================== */
(function () {
  'use strict';

  var KHOA = '37ftu_gop_y';

  function doc() {
    try { return JSON.parse(localStorage.getItem(KHOA) || '[]'); } catch (e) { return []; }
  }
  function ghi(ds) {
    try { localStorage.setItem(KHOA, JSON.stringify(ds)); } catch (e) {}
  }

  // admin.html dùng ba hàm này để hiện lại và xoá bớt
  window.GOPY = {
    doc: doc,
    bo: function (i) { var ds = doc(); ds.splice(i, 1); ghi(ds); },
    xoaHet: function () { ghi([]); }
  };

  /* Bật khi có ?gopy=1, và nhớ luôn cho những trang sau trong cùng phiên,
     để đi qua lại giữa các trang khỏi phải gõ lại đuôi. */
  var BAT = /[?&]gopy=1/.test(location.search);
  try {
    if (BAT) sessionStorage.setItem('37ftu_gopy_bat', '1');
    else if (sessionStorage.getItem('37ftu_gopy_bat') === '1') BAT = true;
  } catch (e) {}
  if (!BAT) return;

  var TEN_TRANG = (location.pathname.split('/').pop() || 'index.html').replace(/\.html$/, '');

  /* Những khối đáng góp ý. Cố ý không lấy từng chữ một: góp ý vào cả khối
     thì người đọc lại hiểu ngay đang nói chỗ nào. */
  var CHON = [
    'header.dinh', 'section', 'footer',
    '.the', '.sc', '.lt-buoc', '.bd-map', '.bd-panel',
    '.so-lieu .khung > div', '.nn-so > div', '.o-dem'
  ].join(',');

  function chuGon(el, toiDa) {
    var t = (el.innerText || '').trim().replace(/\s+/g, ' ');
    return t.length > toiDa ? t.slice(0, toiDa) + '…' : t;
  }

  /* Cái nhãn này là thứ mình đọc lại sau, nên phải đủ để mò ra đúng chỗ:
     ưu tiên id, rồi tới tiêu đề gần nhất, cuối cùng mới tới mấy chữ đầu. */
  function nhanCua(el) {
    if (el.id) return '#' + el.id;
    var h = el.querySelector('h1,h2,h3,.ten,.xh-dau,b');
    if (h && h.innerText.trim()) return chuGon(h, 42);
    var lop = (el.className || '').toString().split(/\s+/)[0];
    var chu = chuGon(el, 30);
    return chu ? chu : (lop ? '.' + lop : el.tagName.toLowerCase());
  }

  var dangMo = null;

  function dongForm() {
    if (dangMo) { dangMo.remove(); dangMo = null; }
    document.querySelectorAll('.gy-dang-chon').forEach(function (x) {
      x.classList.remove('gy-dang-chon');
    });
  }

  function moForm(el) {
    dongForm();
    el.classList.add('gy-dang-chon');
    var nhan = nhanCua(el);

    var hop = document.createElement('div');
    hop.className = 'gy-form';
    hop.innerHTML =
      '<div class="gy-form-dau">Góp ý cho: <b></b></div>' +
      '<textarea rows="3" placeholder="Muốn đổi gì ở khối này?"></textarea>' +
      '<div class="gy-form-nut">' +
      '<button type="button" class="nut nut-chinh" data-luu>Ghi lại</button>' +
      '<button type="button" class="nut nut-vien" data-huy>Bỏ qua</button>' +
      '</div>';
    hop.querySelector('b').textContent = nhan;

    // chèn ngay dưới khối để khỏi phải đoán toạ độ
    el.parentNode.insertBefore(hop, el.nextSibling);
    dangMo = hop;
    var o = hop.querySelector('textarea');
    o.focus();

    hop.addEventListener('click', function (e) { e.stopPropagation(); });
    hop.querySelector('[data-huy]').addEventListener('click', dongForm);
    hop.querySelector('[data-luu]').addEventListener('click', function () {
      var chu = o.value.trim();
      if (!chu) { o.focus(); return; }
      var ds = doc();
      ds.push({ trang: TEN_TRANG, nhan: nhan, chu: chu, luc: Date.now() });
      ghi(ds);
      dongForm();
      veBang();
    });
    o.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') dongForm();
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) hop.querySelector('[data-luu]').click();
    });
  }

  /* ---------------- bảng nổi góc màn hình ---------------- */

  var bang;

  function veBang() {
    var ds = doc();
    bang.querySelector('[data-so]').textContent = ds.length;
    var ol = bang.querySelector('ol');
    ol.innerHTML = ds.slice(-4).reverse().map(function (g) {
      return '<li><b>' + g.nhan.replace(/</g, '&lt;') + '</b>' +
        (g.chu.length > 52 ? g.chu.slice(0, 52).replace(/</g, '&lt;') + '…' : g.chu.replace(/</g, '&lt;')) +
        '</li>';
    }).join('');
  }

  function dungBang() {
    bang = document.createElement('div');
    bang.className = 'gy-bang';
    bang.innerHTML =
      '<div class="gy-bang-dau"><b>Chế độ góp ý</b>' +
      '<span class="gy-bang-so"><span data-so>0</span> ghi chú</span></div>' +
      '<p class="gy-bang-chu">Bấm vào khối nội dung bất kỳ để ghi chú vào đúng chỗ đó.</p>' +
      '<ol></ol>' +
      '<div class="gy-bang-nut">' +
      '<button type="button" class="nut nut-chinh" data-chep>Chép tất cả</button>' +
      '<a class="nut nut-vien" href="admin.html">Mở bảng quản trị</a>' +
      '<button type="button" class="nut nut-vien" data-tat>Tắt</button>' +
      '</div>';
    document.body.appendChild(bang);

    bang.addEventListener('click', function (e) { e.stopPropagation(); });

    bang.querySelector('[data-chep]').addEventListener('click', function () {
      var ds = doc();
      if (!ds.length) { alert('Chưa ghi chú gì cả.'); return; }
      var chu = 'GÓP Ý TRANG 37FTU\n\n' + ds.map(function (g, i) {
        return (i + 1) + '. [' + g.trang + ' › ' + g.nhan + ']\n   ' + g.chu;
      }).join('\n\n');
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(chu).then(function () {
          alert('Đã chép ' + ds.length + ' góp ý. Dán vào khung chat là được.');
        }, function () { window.prompt('Chép đoạn này:', chu); });
      } else {
        window.prompt('Chép đoạn này:', chu);
      }
    });

    bang.querySelector('[data-tat]').addEventListener('click', function () {
      try { sessionStorage.removeItem('37ftu_gopy_bat'); } catch (e) {}
      location.href = location.pathname + location.hash;
    });

    veBang();
  }

  function dungBat() {
    document.body.classList.add('gy-bat');
    document.querySelectorAll(CHON).forEach(function (el) {
      if (el.closest('.gy-bang') || el.closest('.gy-form')) return;
      if (el.dataset.gyDaGan) return;   // quét lượt hai, đừng gắn chồng listener
      el.dataset.gyDaGan = '1';
      el.classList.add('gy-khoi');
      el.addEventListener('click', function (e) {
        // để link và nút vẫn bấm được bình thường
        if (e.target.closest('a,button,input,select,textarea,label')) return;
        e.preventDefault();
        e.stopPropagation();
        moForm(el);
      });
    });
    document.addEventListener('click', dongForm);
  }

  function chay() {
    dungBang();
    dungBat();
    // app.js/ban-do.js đổ nội dung vào sau, quét thêm một lượt nữa
    setTimeout(dungBat, 900);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', chay);
  } else {
    chay();
  }
})();
