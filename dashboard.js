/* ============================================================
   LOGIC DASHBOARD TIẾN ĐỘ ĐƠN G16 — 37FTU
   Bảo mật bằng mật mã nội bộ, tự động cập nhật thời gian thực
   ============================================================ */

(function () {
  'use strict';

  var CH = window.CAU_HINH || {};
  var KHOA_LUU_PASS = '37ftu_dashboard_pass';

  // Khai báo biểu đồ toàn cục để hủy và vẽ lại khi cập nhật dữ liệu
  var bieuDoNgay = null;
  var bieuDoBan = null;
  var matMaHienTai = '';
  var timerTuDongLamMoi = null;

  var $ = function (id) { return document.getElementById(id); };

  /* ------------------- Xử lý Header Supabase ------------------- */
  function layHeaderSupabase() {
    var k = CH.SUPABASE_ANON_KEY || '';
    var h = {
      'Content-Type': 'application/json',
      'apikey': k
    };
    if (/^eyJ/.test(k)) {
      h['Authorization'] = 'Bearer ' + k;
    }
    return h;
  }

  /* ------------------- Hiển thị Toast ------------------- */
  function baoToast(thongDiep) {
    var toast = $('db-toast');
    if (!toast) return;
    toast.textContent = thongDiep;
    toast.style.display = 'block';
    setTimeout(function () {
      toast.style.display = 'none';
    }, 2500);
  }

  /* ------------------- Gọi Supabase RPC ------------------- */
  function goiApiThongKe(matMa) {
    if (!CH.SUPABASE_URL || !CH.SUPABASE_ANON_KEY) {
      return Promise.reject(new Error('Chưa cấu hình SUPABASE_URL hoặc SUPABASE_ANON_KEY trong file config.js'));
    }

    var url = CH.SUPABASE_URL.replace(/\/+$/, '') + '/rest/v1/rpc/lay_thong_ke_don_noi_bo';
    return fetch(url, {
      method: 'POST',
      headers: layHeaderSupabase(),
      body: JSON.stringify({ mat_ma_nhap: matMa })
    }).then(function (r) {
      if (!r.ok) {
        return r.text().then(function (txt) {
          throw new Error('Lỗi máy chủ (' + r.status + '): ' + (txt || 'Vui lòng kiểm tra lại hàm trên Supabase'));
        });
      }
      return r.json();
    });
  }

  /* ------------------- Vẽ Biểu đồ ------------------- */
  function veBieuDo(data) {
    var theoNgay = data.theo_ngay || [];
    var theoBan = data.theo_ban || [];

    // 1. Biểu đồ theo ngày (Cột + Đường xu hướng)
    var ctxNgay = $('chart-theo-ngay');
    if (ctxNgay) {
      if (bieuDoNgay) bieuDoNgay.destroy();

      var nhanNgay = theoNgay.map(function (x) { return x.ngay; });
      var soDonNgay = theoNgay.map(function (x) { return x.so_don; });

      // Tính tổng tích lũy dồn
      var tichLuy = [];
      var tongDonDau = 0;
      soDonNgay.forEach(function (v) {
        tongDonDau += v;
        tichLuy.push(tongDonDau);
      });

      bieuDoNgay = new Chart(ctxNgay, {
        data: {
          labels: nhanNgay.length ? nhanNgay : ['Chưa có đơn'],
          datasets: [
            {
              type: 'bar',
              label: 'Đơn trong ngày',
              data: soDonNgay.length ? soDonNgay : [0],
              backgroundColor: 'rgba(250, 80, 30, 0.85)',
              borderRadius: 6,
              order: 2
            },
            {
              type: 'line',
              label: 'Tổng tích lũy',
              data: tichLuy.length ? tichLuy : [0],
              borderColor: '#10B981',
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              borderWidth: 2.5,
              tension: 0.3,
              fill: false,
              pointRadius: 4,
              pointBackgroundColor: '#10B981',
              order: 1
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'top',
              labels: { font: { family: 'Be Vietnam Pro', size: 12 } }
            },
            tooltip: {
              padding: 10,
              titleFont: { family: 'Be Vietnam Pro' },
              bodyFont: { family: 'Be Vietnam Pro' }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: { precision: 0 }
            }
          }
        }
      });
    }

    // 2. Biểu đồ theo Ban (Doughnut)
    var ctxBan = $('chart-theo-ban');
    if (ctxBan) {
      if (bieuDoBan) bieuDoBan.destroy();

      var nhanBan = theoBan.map(function (x) { return x.ban; });
      var soDonBan = theoBan.map(function (x) { return x.so_don; });
      var bangMau = [
        '#FA501E', // Cam 37FTU
        '#2563EB', // Xanh dương
        '#10B981', // Xanh lá
        '#F59E0B', // Vàng cam
        '#8B5CF6', // Tím
        '#EC4899', // Hồng
        '#64748B'  // Xám
      ];

      bieuDoBan = new Chart(ctxBan, {
        type: 'doughnut',
        data: {
          labels: nhanBan.length ? nhanBan : ['Chưa có dữ liệu'],
          datasets: [{
            data: soDonBan.length ? soDonBan : [1],
            backgroundColor: bangMau.slice(0, Math.max(nhanBan.length, 1)),
            borderWidth: 2,
            borderColor: '#FFFFFF'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                boxWidth: 12,
                font: { family: 'Be Vietnam Pro', size: 12 },
                padding: 14
              }
            }
          },
          cutout: '62%'
        }
      });
    }
  }

  /* ------------------- Đổ dữ liệu lên Dashboard ------------------- */
  function doDuLieu(d) {
    // KPI Cards
    var tongDon = d.tong_don || 0;
    var homNay = d.hom_nay || 0;
    var homQua = d.hom_qua || 0;

    $('kpi-tong-don').textContent = tongDon;
    $('kpi-hom-nay').textContent = homNay;
    $('kpi-hom-qua').textContent = homQua;

    // So sánh hôm nay với hôm qua
    var chenhLech = homNay - homQua;
    var hopSoSanh = $('kpi-so-sanh');
    if (chenhLech > 0) {
      hopSoSanh.innerHTML = '<span class="tang">▲ Tăng +' + chenhLech + '</span> so với hôm qua';
    } else if (chenhLech < 0) {
      hopSoSanh.innerHTML = '<span class="giam">▼ Giảm ' + chenhLech + '</span> so với hôm qua';
    } else {
      hopSoSanh.innerHTML = 'Bằng số lượng hôm qua';
    }

    // Ban hot nhất
    var theoBan = d.theo_ban || [];
    if (theoBan.length && theoBan[0].so_don > 0) {
      $('kpi-ban-hot').textContent = theoBan[0].ban;
      $('kpi-ban-hot-so').textContent = theoBan[0].so_don + ' đơn đăng ký (' + Math.round((theoBan[0].so_don / Math.max(tongDon, 1)) * 100) + '%)';
    } else {
      $('kpi-ban-hot').textContent = '—';
      $('kpi-ban-hot-so').textContent = 'Chưa có đơn';
    }

    // Cập nhật lúc
    $('cap-nhat-chu').textContent = 'Cập nhật: ' + (d.cap_nhat_luc || new Date().toLocaleTimeString('vi-VN'));

    // Bảng chi tiết theo ngày
    var theoNgay = (d.theo_ngay || []).slice().reverse(); // Ngày mới nhất lên đầu bảng
    var thanNgay = $('than-bang-ngay');
    $('dem-so-ngay').textContent = theoNgay.length + ' ngày ghi nhận';

    if (!theoNgay.length) {
      thanNgay.innerHTML = '<tr><td colspan="3" style="text-align:center; padding: 20px; color:#94a3b8;">Chưa có đơn nào</td></tr>';
    } else {
      var htmlNgay = '';
      theoNgay.forEach(function (n) {
        var tyLe = Math.round((n.so_don / Math.max(tongDon, 1)) * 100);
        htmlNgay += '<tr>' +
          '<td><b>' + (n.ngay_day_du || n.ngay) + '</b></td>' +
          '<td><b>' + n.so_don + '</b> đơn</td>' +
          '<td>' +
            '<div class="thanh-ti-le">' +
              '<div class="thanh-chay"><div class="thanh-ruot" style="width: ' + tyLe + '%;"></div></div>' +
              '<span>' + tyLe + '%</span>' +
            '</div>' +
          '</td>' +
        '</tr>';
      });
      thanNgay.innerHTML = htmlNgay;
    }

    // Bảng chi tiết theo quê / khu vực
    var theoQue = d.theo_que || [];
    var thanQue = $('than-bang-que');
    if (!theoQue.length) {
      thanQue.innerHTML = '<tr><td colspan="3" style="text-align:center; padding: 20px; color:#94a3b8;">Chưa có dữ liệu quê quán</td></tr>';
    } else {
      var htmlQue = '';
      theoQue.forEach(function (q) {
        var tyLeQ = Math.round((q.so_don / Math.max(tongDon, 1)) * 100);
        htmlQue += '<tr>' +
          '<td><b>' + q.que + '</b></td>' +
          '<td><b>' + q.so_don + '</b></td>' +
          '<td>' +
            '<div class="thanh-ti-le">' +
              '<div class="thanh-chay"><div class="thanh-ruot" style="width: ' + tyLeQ + '%;"></div></div>' +
              '<span>' + tyLeQ + '%</span>' +
            '</div>' +
          '</td>' +
        '</tr>';
      });
      thanQue.innerHTML = htmlQue;
    }

    // Vẽ biểu đồ
    veBieuDo(d);
  }

  /* ------------------- Xử lý Mở Khóa & Tải dữ liệu ------------------- */
  function moDashboard(matMa, laLuuPass) {
    var nutMo = $('nut-mo-khoa');
    var loiHop = $('khoa-loi');

    if (nutMo) {
      nutMo.disabled = true;
      nutMo.querySelector('span').textContent = 'Đang kiểm tra…';
    }
    if (loiHop) loiHop.style.display = 'none';

    goiApiThongKe(matMa)
      .then(function (res) {
        if (!res || !res.hop_le) {
          throw new Error((res && res.loi) || 'Mật mã nội bộ không chính xác.');
        }

        // Đăng nhập thành công!
        matMaHienTai = matMa;
        if (laLuuPass) {
          try { localStorage.setItem(KHOA_LUU_PASS, matMa); } catch (e) {}
        }

        // Chuyển màn hình
        $('khoa-man-hinh').style.display = 'none';
        $('db-wrap').style.display = 'block';

        // Đổ dữ liệu
        doDuLieu(res);

        // Bật tự động làm mới mỗi 60 giây
        if (timerTuDongLamMoi) clearInterval(timerTuDongLamMoi);
        timerTuDongLamMoi = setInterval(function () {
          lamMoiDuLieu(true);
        }, 60000);
      })
      .catch(function (err) {
        if (loiHop) {
          loiHop.textContent = err.message || 'Không thể xác thực mật mã';
          loiHop.style.display = 'block';
        }
        // Xóa pass cũ nếu bị đổi pass
        try { localStorage.removeItem(KHOA_LUU_PASS); } catch (e) {}
      })
      .finally(function () {
        if (nutMo) {
          nutMo.disabled = false;
          nutMo.querySelector('span').textContent = 'Mở Dashboard';
        }
      });
  }

  /* ------------------- Làm mới dữ liệu ------------------- */
  function lamMoiDuLieu(ngam) {
    if (!matMaHienTai) return;
    var nut = $('nut-lam-moi');
    if (!ngam && nut) nut.classList.add('dang-quay');

    goiApiThongKe(matMaHienTai)
      .then(function (res) {
        if (res && res.hop_le) {
          doDuLieu(res);
          if (!ngam) baoToast('Đã cập nhật số liệu mới nhất!');
        }
      })
      .catch(function (e) {
        console.error('Lỗi làm mới:', e);
        if (!ngam) baoToast('Lỗi cập nhật: ' + e.message);
      })
      .finally(function () {
        if (!ngam && nut) nut.classList.remove('dang-quay');
      });
  }

  /* ------------------- Gán sự kiện ------------------- */
  function khoiTao() {
    // 1. Kiểm tra mật mã từ URL params (?pass=... hoặc ?token=...)
    var thamSo = new URLSearchParams(window.location.search);
    var passUrl = thamSo.get('pass') || thamSo.get('token');

    // 2. Kiểm tra mật mã lưu trong máy
    var passLuu = '';
    try { passLuu = localStorage.getItem(KHOA_LUU_PASS) || ''; } catch (e) {}

    var passCanDung = (passUrl || passLuu || '').trim();
    if (passCanDung) {
      $('pass-input').value = passCanDung;
      moDashboard(passCanDung, !passUrl); // Nếu pass từ URL thì không tự lưu đè trừ khi submit form
    }

    // Submit form nhập pass
    var formKhoa = $('form-khoa');
    if (formKhoa) {
      formKhoa.addEventListener('submit', function (e) {
        e.preventDefault();
        var val = $('pass-input').value.trim();
        var nho = $('nho-pass').checked;
        if (!val) {
          var lh = $('khoa-loi');
          lh.textContent = 'Vui lòng nhập mật mã nội bộ!';
          lh.style.display = 'block';
          return;
        }
        moDashboard(val, nho);
      });
    }

    // Nút hiện/ẩn mật mã
    var nutHienPass = $('nut-hien-pass');
    var oPass = $('pass-input');
    if (nutHienPass && oPass) {
      nutHienPass.addEventListener('click', function () {
        if (oPass.type === 'password') {
          oPass.type = 'text';
          nutHienPass.textContent = '🙈';
        } else {
          oPass.type = 'password';
          nutHienPass.textContent = '👁️';
        }
      });
    }

    // Nút làm mới
    var nutLamMoi = $('nut-lam-moi');
    if (nutLamMoi) {
      nutLamMoi.addEventListener('click', function () {
        lamMoiDuLieu(false);
      });
    }

    // Nút sao chép link gửi team
    var nutCopy = $('nut-copy-link');
    if (nutCopy) {
      nutCopy.addEventListener('click', function () {
        var urlChiaSe = window.location.origin + window.location.pathname + '?pass=' + encodeURIComponent(matMaHienTai);
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(urlChiaSe).then(function () {
            baoToast('Đã chép link truy cập nhanh vào bộ nhớ tạm!');
          });
        } else {
          prompt('Sao chép link dưới đây để gửi cho các bạn trong team:', urlChiaSe);
        }
      });
    }

    // Nút khóa / đăng xuất
    var nutDangXuat = $('nut-dang-xuat');
    if (nutDangXuat) {
      nutDangXuat.addEventListener('click', function () {
        try { localStorage.removeItem(KHOA_LUU_PASS); } catch (e) {}
        if (timerTuDongLamMoi) clearInterval(timerTuDongLamMoi);
        matMaHienTai = '';
        $('pass-input').value = '';
        $('db-wrap').style.display = 'none';
        $('khoa-man-hinh').style.display = 'flex';
      });
    }
  }

  // Khởi chạy khi DOM sẵn sàng
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', khoiTao);
  } else {
    khoiTao();
  }
})();
