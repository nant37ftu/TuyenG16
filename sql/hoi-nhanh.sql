-- ============================================================
-- 37FTU — Bảng nhận câu hỏi & Dashboard "Hỏi nhanh" (Nghệ Wiki)
-- Mở Supabase → SQL Editor → New query → Dán toàn bộ file này → Bấm "Run"
-- Đã mở quyền công khai (PUBLIC) để nhân sự xem danh sách và cập nhật trạng thái trả lời
-- ============================================================

-- 1. Tạo bảng g16_hoi_nhanh (nếu chưa có)
create table if not exists public.g16_hoi_nhanh (
  id            uuid primary key default gen_random_uuid(),
  tao_luc       timestamptz not null default now(),
  ho_ten        text,       -- 1. Họ và tên
  thac_mac      text,       -- 2. Thắc mắc của em
  sdt           text,       -- 3. Số điện thoại
  facebook      text,       -- 4. Link facebook
  trang_thai    text default 'chua_tra_loi', -- 'chua_tra_loi' | 'da_tra_loi'
  tra_loi       text,       -- Ghi chú phản hồi / câu trả lời
  nguoi_tra_loi text,       -- Tên nhân sự phụ trách giải đáp
  cap_nhat_luc  timestamptz -- Thời điểm cập nhật gần nhất
);

-- Bổ sung các cột mới nếu bảng đã tạo từ trước
alter table public.g16_hoi_nhanh add column if not exists trang_thai text default 'chua_tra_loi';
alter table public.g16_hoi_nhanh add column if not exists tra_loi text;
alter table public.g16_hoi_nhanh add column if not exists nguoi_tra_loi text;
alter table public.g16_hoi_nhanh add column if not exists cap_nhat_luc timestamptz;

-- Index sắp xếp theo thời gian gửi mới nhất
create index if not exists g16_hoi_nhanh_tao_luc_idx on public.g16_hoi_nhanh (tao_luc desc);
create index if not exists g16_hoi_nhanh_trang_thai_idx on public.g16_hoi_nhanh (trang_thai);

-- 2. Bật Row Level Security (RLS)
alter table public.g16_hoi_nhanh enable row level security;

-- 3. Cho phép khách vãng lai gửi câu hỏi vào bảng (insert) qua Supabase anon key
drop policy if exists "ai cung gui hoi nhanh duoc" on public.g16_hoi_nhanh;
create policy "ai cung gui hoi nhanh duoc"
  on public.g16_hoi_nhanh for insert
  to anon
  with check (true);

-- 4. Cho phép nhân sự xem danh sách câu hỏi trên Dashboard (select công khai)
drop policy if exists "btc doc hoi nhanh" on public.g16_hoi_nhanh;
drop policy if exists "public xem duoc hoi nhanh" on public.g16_hoi_nhanh;
create policy "public xem duoc hoi nhanh"
  on public.g16_hoi_nhanh for select
  to anon, authenticated
  using (true);

-- 5. Cho phép nhân sự cập nhật trạng thái đã trả lời và ghi chú phản hồi (update công khai)
drop policy if exists "public cap nhat hoi nhanh" on public.g16_hoi_nhanh;
create policy "public cap nhat hoi nhanh"
  on public.g16_hoi_nhanh for update
  to anon, authenticated
  using (true)
  with check (true);

-- 6. Cấp quyền truy cập cho anon và authenticated
grant select, insert, update on public.g16_hoi_nhanh to anon, authenticated;
