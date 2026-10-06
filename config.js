/* ============================================================
   CẤU HÌNH CHUNG — Ban tổ chức sửa file này, không cần đụng code
   ============================================================ */
window.CAU_HINH = {
  // --- Kết nối Supabase để nhận đơn ---
  // Để trống -> trang chạy ở CHẾ ĐỘ THỬ: đơn chỉ lưu tạm trong trình duyệt.
  // Xem hướng dẫn lấy 2 giá trị này trong README.md
  //
  // Khoá dưới đây là "publishable key" — sinh ra để lộ trong code chạy ở máy
  // người dùng, ai xem mã nguồn trang cũng thấy. Nó CHỈ an toàn khi RLS trong
  // sql/schema.sql đã chạy: anon chỉ được ghi đơn, không đọc lại được đơn của
  // người khác. Đổi khoá khi cần: Supabase -> Settings -> API Keys.
  SUPABASE_URL: 'https://qiwfknocgwcptjmjdpmc.supabase.co',
  SUPABASE_ANON_KEY: 'sb_publishable_hifh_GhvmKJM35AMwCs2nA_-2lvSiLk',
  BANG_UNG_VIEN: 'g16_ung_vien',
  BANG_BAN_DO_DANG_KY: 'ban_do_dang_ky',  // bản đồ đang tạm ngưng, xem chú thích cuối file

  // --- Phương án dự phòng: nếu chưa kịp dựng Supabase, điền link Google Form ---
  LINK_FORM_DU_PHONG: '',

  // --- Mốc thời gian (BTC sửa cho đúng lịch G16) ---
  HAN_NOP_DON: '2026-10-20T23:59:59+07:00', // dùng cho đồng hồ đếm ngược
  DANG_MO_DON: true,                        // false -> ẩn form, hiện thông báo đã đóng

  // --- Intro mở đầu trang chủ (xem mục 14 trong README) ---
  // 'b'   -> vén cỏ: hai vạt cỏ rẽ ra hai bên, bướm bay lên
  // 'c'   -> dựng chữ: "Nghệ Sĩ Nhí" bật ra từng tiếng
  // 'tat' -> bỏ hẳn intro
  // Xem thử nhanh không cần sửa file: thêm ?intro=b hoặc ?intro=c vào địa chỉ.
  INTRO: 'c',

  // --- Liên hệ ---
  FANPAGE: 'https://www.facebook.com/svna.ftu',
  EMAIL: 'nant.37ftu@gmail.com',
  HOTLINE: ''             // vd: '0912 345 678 (Ban Nhân sự)'

  // Bản đồ người Nghệ (ban-do.html + admin.html) TẠM NGƯNG từ 06/10/2026: file đã
  // chuyển ra rieng-tu/ban-do/, không còn trên web. Hai dòng BANG_BAN_DO_DANG_KY và
  // bảng Supabase vẫn giữ nguyên để bật lại cho nhanh — xem mục 5 trong README.
};
