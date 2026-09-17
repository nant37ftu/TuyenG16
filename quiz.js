/* Trắc nghiệm "Em hợp ban nào ở 37FTU?"
   BTC muốn sửa câu hỏi thì sửa mảng CAU_HOI bên dưới: mỗi lựa chọn cộng điểm
   cho 3 ban theo thứ tự [Tổ chức, Truyền thông, Đối ngoại]. */
(function () {
  'use strict';
  var CH = window.CAU_HINH || {};
  var ND = window.NOI_DUNG || {};
  var BAN = ['Ban Tổ chức', 'Ban Truyền thông', 'Ban Đối ngoại'];

  var CAU_HOI = [
    { hoi: 'Nhóm sắp đi tình nguyện. Việc đầu tiên em nghĩ tới là gì?', dap: [
      { chu: 'Lên danh sách đồ cần mang và chia việc cho từng người', d: [2, 0, 0] },
      { chu: 'Nghĩ xem chuyến này kể lại trên fanpage thế nào cho hay', d: [0, 2, 0] },
      { chu: 'Hỏi mấy anh chị quen xem có xin được tài trợ gì không', d: [0, 0, 2] }
    ]},
    { hoi: 'Làm bài nhóm, em thường là người...', dap: [
      { chu: 'Giữ deadline, nhắc cả nhóm chạy đúng tiến độ', d: [2, 0, 0] },
      { chu: 'Làm slide, lo phần nhìn cho đẹp', d: [0, 2, 0] },
      { chu: 'Đứng lên thuyết trình và đỡ câu hỏi', d: [0, 1, 2] }
    ]},
    { hoi: 'Thứ em mở nhiều nhất trên điện thoại?', dap: [
      { chu: 'Ghi chú, lịch, danh sách việc cần làm', d: [2, 0, 0] },
      { chu: 'Thư viện ảnh và mấy app chỉnh ảnh, dựng video', d: [0, 2, 0] },
      { chu: 'Tin nhắn — danh bạ dài dằng dặc', d: [0, 0, 2] }
    ]},
    { hoi: 'Chương trình còn thiếu 2 triệu mà sát ngày rồi. Em làm gì?', dap: [
      { chu: 'Ngồi rà lại dự trù, cắt hạng mục chưa thật cần', d: [2, 0, 0] },
      { chu: 'Viết một bài kêu gọi thật thà, đăng lên nhờ mọi người chung tay', d: [0, 2, 1] },
      { chu: 'Nhắn cho chục quán, doanh nghiệp quen xin tài trợ hiện vật', d: [0, 0, 2] }
    ]},
    { hoi: 'Em thấy sướng nhất khi nào?', dap: [
      { chu: 'Khi mọi thứ chạy đúng y như kế hoạch đã vạch', d: [2, 0, 0] },
      { chu: 'Khi bài mình làm được nhiều người chia sẻ', d: [0, 2, 0] },
      { chu: 'Khi chốt được cái hẹn theo đuổi cả tháng trời', d: [0, 0, 2] }
    ]},
    { hoi: 'Bạn bè hay nhờ em việc gì?', dap: [
      { chu: 'Sắp xếp, tổ chức, cầm trịch hộ', d: [2, 0, 0] },
      { chu: 'Viết hộ caption, làm hộ cái ảnh', d: [0, 2, 0] },
      { chu: 'Đi nói chuyện hộ, hỏi hộ người ta', d: [0, 0, 2] }
    ]},
    { hoi: 'Đang chạy chương trình thì mất điện. Phản xạ của em?', dap: [
      { chu: 'Lôi phương án B ra chạy ngay', d: [2, 0, 0] },
      { chu: 'Rút điện thoại quay lại, kiểu gì cũng thành tư liệu hay', d: [0, 2, 0] },
      { chu: 'Ra chỗ khách mời, giữ không khí cho khỏi nguội', d: [0, 0, 2] }
    ]},
    { hoi: 'Em tự thấy mình là người...', dap: [
      { chu: 'Kỹ tính, nhớ chi tiết, ghét sai sót', d: [2, 0, 0] },
      { chu: 'Nhiều ý tưởng, hay nghĩ linh tinh mà ra cái hay', d: [0, 2, 0] },
      { chu: 'Dạn người, gặp ai cũng bắt chuyện được', d: [0, 0, 2] }
    ]},
    { hoi: 'Nhắn cho người ta mà bị đọc rồi để đó. Em sẽ...', dap: [
      { chu: 'Ghi vào việc cần làm, mai nhắc lại đúng lịch', d: [2, 0, 1] },
      { chu: 'Thôi, để dành sức làm việc khác cho đỡ mệt', d: [0, 2, 0] },
      { chu: 'Nhắn tiếp, không thì gọi thẳng cho nhanh', d: [0, 0, 2] }
    ]},
    { hoi: 'Hết nhiệm kỳ, em muốn tên mình gắn với điều gì?', dap: [
      { chu: 'Một chiến dịch chạy trơn tru từ đầu đến cuối', d: [2, 0, 0] },
      { chu: 'Một video khiến người xem rưng rưng', d: [0, 2, 0] },
      { chu: 'Một bản hợp tác mang về nguồn lực thật cho Đội', d: [0, 0, 2] }
    ]}
  ];

  var $ = function (s) { return document.querySelector(s); };
  var an = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };

  var i = 0;              // câu đang hỏi
  var chon = [];          // lựa chọn của người chơi

  function veCau() {
    var c = CAU_HOI[i];
    $('#q-dem').textContent = 'Câu ' + (i + 1) + '/' + CAU_HOI.length;
    $('#q-thanh-chay').style.width = ((i) / CAU_HOI.length * 100) + '%';
    $('#q-cau').textContent = c.hoi;
    var hop = $('#q-dap-an');
    hop.innerHTML = '';
    c.dap.forEach(function (d, k) {
      var b = document.createElement('button');
      b.innerHTML = '<b>' + 'ABC'[k] + '</b><span>' + an(d.chu) + '</span>';
      b.addEventListener('click', function () {
        chon[i] = k;
        if (i < CAU_HOI.length - 1) { i++; veCau(); } else { veKetQua(); }
      });
      hop.appendChild(b);
    });
    $('#q-quay-lai').hidden = i === 0;
  }

  function tinhDiem() {
    var d = [0, 0, 0];
    chon.forEach(function (k, idx) {
      if (k == null) return;
      CAU_HOI[idx].dap[k].d.forEach(function (v, j) { d[j] += v; });
    });
    return d;
  }

  function veKetQua() {
    $('#man-hoi').hidden = true;
    $('#man-ket-qua').hidden = false;
    $('#q-thanh-chay').style.width = '100%';

    var d = tinhDiem();
    var tong = d[0] + d[1] + d[2] || 1;
    var thuTu = [0, 1, 2].sort(function (a, b) { return d[b] - d[a]; });
    var nhat = thuTu[0];
    var ten = BAN[nhat];
    var thongTin = (ND.cac_ban || []).filter(function (b) { return b.ten === ten; })[0] || {};

    $('#kq-ten').textContent = ten;
    $('#kq-biet-danh').textContent = thongTin.biet_danh || '';
    $('#kq-mo-ta').textContent = (thongTin.hop_voi ? thongTin.hop_voi + ' ' : '') + (thongTin.mo_ta || '');

    $('#kq-thanh').innerHTML = BAN.map(function (b, j) {
      var pt = Math.round(d[j] / tong * 100);
      return '<div class="d"><span>' + an(b) + '</span>' +
        '<span class="t"><i style="width:' + pt + '%"></i></span>' +
        '<span class="s">' + pt + '%</span></div>';
    }).join('');

    $('#kq-hoc').innerHTML = (thongTin.hoc_duoc && thongTin.hoc_duoc.length)
      ? '<b>Vào ban này em học được</b><ul>' + thongTin.hoc_duoc.map(function (h) { return '<li>' + an(h) + '</li>'; }).join('') + '</ul>'
      : '';

    $('#kq-nop').href = 'index.html?nv1=' + encodeURIComponent(ten) + '#nop-don';
    veAnh(ten, thongTin.biet_danh || '', d, tong);
  }

  /* ---------- Ảnh kết quả để đăng story ---------- */
  function veAnh(ten, bietDanh, d, tong) {
    var cv = $('#anh-kq');
    var x = cv.getContext('2d');
    var W = cv.width, H = cv.height;

    // Safari cũ và vài máy Android chưa có roundRect -> vẽ chữ nhật thường cho chắc
    if (!x.roundRect) {
      x.roundRect = function (rx, ry, rw, rh) { this.rect(rx, ry, rw, rh); return this; };
    }

    var nen = x.createLinearGradient(0, 0, W, H);
    nen.addColorStop(0, '#FA501E');
    nen.addColorStop(1, '#A82F0D');
    x.fillStyle = nen;
    x.fillRect(0, 0, W, H);

    // vài vòng tròn mờ cho đỡ phẳng
    x.globalAlpha = 0.09;
    x.fillStyle = '#fff';
    [[880, 220, 260], [180, 1180, 320], [980, 1080, 150]].forEach(function (c) {
      x.beginPath(); x.arc(c[0], c[1], c[2], 0, Math.PI * 2); x.fill();
    });
    x.globalAlpha = 1;

    var chu = function (t, y, size, weight, mau, font) {
      x.fillStyle = mau || '#fff';
      x.font = (weight || 700) + ' ' + size + 'px ' + (font || '"Be Vietnam Pro", system-ui, sans-serif');
      x.textAlign = 'center';
      x.fillText(t, W / 2, y);
    };

    // logo vẽ sau khi ảnh tải xong (bỏ qua nếu trình duyệt chặn)
    var lg = new Image();
    lg.onload = function () {
      try {
        x.save();
        x.beginPath();
        x.arc(W / 2, 200, 70, 0, Math.PI * 2);
        x.fillStyle = '#fff';
        x.fill();
        x.clip();
        x.drawImage(lg, W / 2 - 66, 134, 132, 132);
        x.restore();
      } catch (e) {}
    };
    lg.src = 'assets/logo.png';

    chu('37FTU · TUYỂN THÀNH VIÊN ' + (ND.the_he || '').toUpperCase(), 330, 30, 700, 'rgba(255,255,255,.85)');
    chu('Mình hợp với', 430, 46, 500, 'rgba(255,255,255,.9)');

    // tên ban, tách 2 dòng cho vừa khung
    var phan = ten.split(' ');
    var d1 = phan[0], d2 = phan.slice(1).join(' ');
    chu(d1, 530, 70, 800, '#fff', '"Bricolage Grotesque", "Be Vietnam Pro", sans-serif');
    chu(d2, 620, 92, 800, '#fff', '"Bricolage Grotesque", "Be Vietnam Pro", sans-serif');
    if (bietDanh) chu('“' + bietDanh + '”', 690, 34, 600, 'rgba(255,255,255,.88)');

    // ba thanh tỉ lệ
    var y0 = 820;
    BAN.forEach(function (b, j) {
      var pt = Math.round(d[j] / tong * 100);
      var y = y0 + j * 96;
      x.textAlign = 'left';
      x.fillStyle = 'rgba(255,255,255,.92)';
      x.font = '600 32px "Be Vietnam Pro", sans-serif';
      x.fillText(b, 150, y);
      x.textAlign = 'right';
      x.fillText(pt + '%', W - 150, y);
      x.fillStyle = 'rgba(255,255,255,.25)';
      x.beginPath(); x.roundRect(150, y + 18, W - 300, 16, 8); x.fill();
      x.fillStyle = '#fff';
      x.beginPath(); x.roundRect(150, y + 18, (W - 300) * pt / 100, 16, 8); x.fill();
    });

    x.textAlign = 'center';
    chu('Còn em thì sao?', 1140, 44, 700, '#fff');
    chu('Làm thử tại trang tuyển thành viên 37FTU', 1200, 30, 500, 'rgba(255,255,255,.85)');
    chu(location.host || '37FTU', 1260, 30, 700, 'rgba(255,255,255,.95)');
  }

  function taiAnh() {
    var cv = $('#anh-kq');
    try {
      var a = document.createElement('a');
      a.download = '37ftu-ket-qua.png';
      a.href = cv.toDataURL('image/png');
      a.click();
    } catch (e) {
      // xảy ra khi mở bằng file:// — trên hosting thật thì không gặp
      alert('Trình duyệt chặn tải ảnh khi mở trực tiếp từ máy. Em chụp màn hình tạm nhé, ' +
        'hoặc mở trang qua đường link của CLB.');
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    var lh = $('#chan-lien-he-q');
    if (lh) {
      if (CH.FANPAGE) lh.innerHTML += '<div><a href="' + an(CH.FANPAGE) + '" target="_blank" rel="noopener">Fanpage 37FTU</a></div>';
      if (CH.EMAIL) lh.innerHTML += '<div><a href="mailto:' + an(CH.EMAIL) + '">' + an(CH.EMAIL) + '</a></div>';
    }

    $('#bat-dau').addEventListener('click', function () {
      $('#man-dau').hidden = true;
      $('#man-hoi').hidden = false;
      i = 0; chon = [];
      veCau();
      $('#man-hoi').scrollIntoView({ behavior: 'smooth', block: 'center' });
    });

    $('#q-quay-lai').addEventListener('click', function () {
      if (i > 0) { i--; veCau(); }
    });

    $('#kq-lam-lai').addEventListener('click', function () {
      $('#man-ket-qua').hidden = true;
      $('#man-hoi').hidden = false;
      i = 0; chon = [];
      veCau();
    });

    $('#kq-tai').addEventListener('click', taiAnh);
  });
})();
