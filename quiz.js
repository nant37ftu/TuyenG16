/* Trắc nghiệm "Em hợp ban nào ở 37FTU?"
   BTC muốn sửa câu hỏi thì sửa mảng CAU_HOI bên dưới: mỗi lựa chọn cộng điểm
   cho 3 ban theo thứ tự [Tổ chức, Truyền thông, Đối ngoại]. */
(function () {
  'use strict';
  var CH = window.CAU_HINH || {};
  var ND = window.NOI_DUNG || {};
  var BAN = ['Ban Tổ chức', 'Ban Truyền thông', 'Ban Đối ngoại'];

  var CAU_HOI = [
    {
      "hoi": "Một nhóm bạn rủ nhau làm chuyến đi 2 ngày 1 đêm. Phần nào khiến em hứng thú nhất?",
      "dap": [
        {
          "chu": "Tìm những địa điểm hay ho, nghĩ xem chuyến đi có thể có những khoảnh khắc gì đáng nhớ.",
          "d": [
            0,
            2,
            0
          ]
        },
        {
          "chu": "Hỏi han kinh nghiệm, tìm những chỗ ăn, ở ổn áp và trao đổi với mọi người để chốt lựa chọn.",
          "d": [
            0,
            0,
            2
          ]
        },
        {
          "chu": "Ghép lịch trình, thời gian và chi phí để chuyến đi vừa vui vừa không “toang”.",
          "d": [
            2,
            0,
            0
          ]
        }
      ]
    },
    {
      "hoi": "Khi bước vào một sự kiện khá đông người, thứ em thường vô thức để ý là...",
      "dap": [
        {
          "chu": "Không khí của sự kiện: hình ảnh, âm nhạc, cách mọi thứ được thể hiện và cảm giác nó mang lại.",
          "d": [
            0,
            2,
            0
          ]
        },
        {
          "chu": "Con người: ai đang nói chuyện với ai, mọi người có thoải mái không và mình có thể làm quen với ai.",
          "d": [
            0,
            1,
            2
          ]
        },
        {
          "chu": "Cách chương trình vận hành: mọi người di chuyển thế nào, có phải chờ lâu không, có đoạn nào hơi rối không.",
          "d": [
            2,
            0,
            0
          ]
        }
      ]
    },
    {
      "hoi": "Nếu được dành một tháng để học thật nghiêm túc một kỹ năng mới, em sẽ hứng thú nhất với...",
      "dap": [
        {
          "chu": "Biến một ý tưởng thành nội dung, hình ảnh hoặc video mà người khác muốn xem.",
          "d": [
            0,
            2,
            0
          ]
        },
        {
          "chu": "Biến một ý tưởng thành kế hoạch và từng bước đưa nó thành hiện thực.",
          "d": [
            2,
            0,
            0
          ]
        },
        {
          "chu": "Giao tiếp, thuyết phục và khiến cuộc trò chuyện với những người chưa quen trở nên tự nhiên.",
          "d": [
            0,
            0,
            2
          ]
        }
      ]
    },
    {
      "hoi": "Cả nhóm rất tâm huyết với một ý tưởng, nhưng sát ngày thực hiện lại xuất hiện vấn đề lớn. Suy nghĩ đầu tiên của em gần với...",
      "dap": [
        {
          "chu": "“Phần nào bắt buộc phải giữ, phần nào có thể thay đổi để mọi thứ vẫn chạy được?”",
          "d": [
            2,
            0,
            0
          ]
        },
        {
          "chu": "“Nếu cách cũ không được, liệu có thể biến nó thành một hướng khác thú vị hơn không?”",
          "d": [
            0,
            2,
            1
          ]
        },
        {
          "chu": "“Mình có thể hỏi hoặc tìm đến ai để có thêm một phương án?”",
          "d": [
            0,
            0,
            2
          ]
        }
      ]
    },
    {
      "hoi": "Nếu được chọn một “siêu năng lực” để mang theo trong mọi dự án, em muốn...",
      "dap": [
        {
          "chu": "Nhìn một mớ công việc hỗn độn và nhanh chóng biết nên bắt đầu từ đâu.",
          "d": [
            2,
            0,
            0
          ]
        },
        {
          "chu": "Nhìn một điều rất bình thường nhưng luôn tìm được cách khiến nó trở nên đáng chú ý.",
          "d": [
            0,
            2,
            0
          ]
        },
        {
          "chu": "Bước vào một căn phòng toàn người lạ nhưng vẫn nhanh chóng tìm được tiếng nói chung.",
          "d": [
            0,
            0,
            2
          ]
        }
      ]
    },
    {
      "hoi": "Một người bạn đưa em xem sản phẩm mà cả nhóm đã làm rất lâu và hỏi: “Mày thấy thế nào?” Em thường chú ý trước đến...",
      "dap": [
        {
          "chu": "Có chi tiết nào chưa hợp lý hoặc khi đưa vào thực tế có thể phát sinh vấn đề không.",
          "d": [
            2,
            0,
            0
          ]
        },
        {
          "chu": "Nó có đủ thú vị, khác biệt và khiến mình muốn xem tiếp không.",
          "d": [
            0,
            2,
            0
          ]
        },
        {
          "chu": "Người nhận/người tham gia sẽ cảm thấy thế nào khi tiếp xúc với nó.",
          "d": [
            0,
            0,
            2
          ]
        }
      ]
    },
    {
      "hoi": "Nếu phải dành cả một buổi chiều cho một trong ba việc, em thấy mình dễ “cuốn” vào việc nào nhất?",
      "dap": [
        {
          "chu": "Ngồi với một đống đầu việc rồi sắp xếp chúng lại cho đến khi mọi thứ bắt đầu rõ ràng.",
          "d": [
            2,
            0,
            0
          ]
        },
        {
          "chu": "Nghĩ một ý tưởng rồi sửa câu chữ, hình ảnh hoặc cách thể hiện đến khi cảm thấy “đúng vibe”.",
          "d": [
            0,
            2,
            0
          ]
        },
        {
          "chu": "Đi gặp hoặc nhắn tin với nhiều người, nghe những câu chuyện và góc nhìn rất khác nhau.",
          "d": [
            0,
            0,
            2
          ]
        }
      ]
    },
    {
      "hoi": "Trong một cuộc thảo luận mà mọi người bắt đầu bất đồng quan điểm, em thường có xu hướng...",
      "dap": [
        {
          "chu": "Tìm xem vấn đề thực sự đang mắc ở đâu rồi kéo mọi người trở lại điều cần giải quyết.",
          "d": [
            2,
            0,
            0
          ]
        },
        {
          "chu": "Thử đặt vấn đề theo một góc khác để xem có hướng nào mọi người chưa nghĩ tới.",
          "d": [
            0,
            2,
            0
          ]
        },
        {
          "chu": "Nghe xem mỗi bên thực sự đang quan tâm điều gì rồi tìm một điểm mà mọi người có thể gặp nhau.",
          "d": [
            0,
            0,
            2
          ]
        }
      ]
    },
    {
      "hoi": "Một hoạt động mà nhóm em chuẩn bị rất kỹ lại không thu hút nhiều người như dự kiến. Điều em muốn biết nhất là...",
      "dap": [
        {
          "chu": "Có khâu nào trong cách triển khai, thời gian hoặc trải nghiệm tham gia chưa hợp lý?",
          "d": [
            2,
            0,
            1
          ]
        },
        {
          "chu": "Có phải cách giới thiệu hoạt động chưa đủ khiến người ta tò mò và muốn tham gia?",
          "d": [
            0,
            2,
            0
          ]
        },
        {
          "chu": "Những người mình từng tiếp cận thực sự nghĩ gì và điều gì khiến họ quyết định tham gia hoặc không?",
          "d": [
            0,
            0,
            2
          ]
        }
      ]
    },
    {
      "hoi": "Một chương trình vừa kết thúc. Trong ba khoảnh khắc sau, điều nào khiến em cảm thấy “đáng” nhất?",
      "dap": [
        {
          "chu": "Nhìn lại từ lúc mọi thứ còn ngổn ngang đến khi từng phần cuối cùng cũng khớp với nhau.",
          "d": [
            2,
            0,
            0
          ]
        },
        {
          "chu": "Thấy mọi người vẫn chụp ảnh, chia sẻ hoặc nhắc lại một chi tiết mà mình đã góp phần tạo nên.",
          "d": [
            0,
            2,
            0
          ]
        },
        {
          "chu": "Thấy những người ban đầu chẳng quen biết nhau giờ có thể trò chuyện, kết nối và muốn tiếp tục đồng hành.",
          "d": [
            0,
            0,
            2
          ]
        }
      ]
    }
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
    if (window.ChuyenCanh) {
      ChuyenCanh.hien($('#q-cau'));
      ChuyenCanh.hien($('#q-dap-an'));
    }
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
    if (window.ChuyenCanh) {
      ChuyenCanh.doiMan($('#man-hoi'), $('#man-ket-qua'));
    } else {
      $('#man-hoi').hidden = true;
      $('#man-ket-qua').hidden = false;
    }
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
      if (window.ChuyenCanh) {
        ChuyenCanh.doiMan($('#man-dau'), $('#man-hoi'));
      } else {
        $('#man-dau').hidden = true;
        $('#man-hoi').hidden = false;
      }
      i = 0; chon = [];
      veCau();
      $('#man-hoi').scrollIntoView({ behavior: 'smooth', block: 'center' });
    });

    $('#q-quay-lai').addEventListener('click', function () {
      if (i > 0) { i--; veCau(); }
    });

    $('#kq-lam-lai').addEventListener('click', function () {
      if (window.ChuyenCanh) {
        ChuyenCanh.doiMan($('#man-ket-qua'), $('#man-hoi'));
      } else {
        $('#man-ket-qua').hidden = true;
        $('#man-hoi').hidden = false;
      }
      i = 0; chon = [];
      veCau();
    });

    $('#kq-tai').addEventListener('click', taiAnh);
  });
})();
