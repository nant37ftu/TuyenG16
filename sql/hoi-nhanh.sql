-- ============================================================
-- 37FTU — Bảng nhận câu hỏi "Hỏi nhanh" trong Nghệ Wiki
-- Mở Supabase → SQL Editor → New query → Dán toàn bộ nội dung file này → Bấm "Run"
-- ============================================================

-- 1. Tạo bảng g16_hoi_nhanh (tất cả các trường nhập đều là text, không bắt buộc)
create table if not exists public.g16_hoi_nhanh (
  id        uuid primary key default gen_random_uuid(),
  tao_luc   timestamptz not null default now(),
  ho_ten    text,       -- 1. Họ và tên
  thac_mac  text,       -- 2. Thắc mắc của em
  sdt       text,       -- 3. Số điện thoại
  facebook  text        -- 4. Link facebook
);

-- Index sắp xếp theo thời gian gửi mới nhất
create index if not exists g16_hoi_nhanh_tao_luc_idx on public.g16_hoi_nhanh (tao_luc desc);

-- 2. Bật Row Level Security (RLS) để bảo vệ dữ liệu
alter table public.g16_hoi_nhanh enable row level security;

-- 3. Cho phép khách vãng lai gửi câu hỏi vào bảng (insert) qua Supabase anon key
drop policy if exists "ai cung gui hoi nhanh duoc" on public.g16_hoi_nhanh;
create policy "ai cung gui hoi nhanh duoc"
  on public.g16_hoi_nhanh for insert
  to anon
  with check (true);

-- 4. Chỉ Ban tổ chức (đã có trong bảng btc_quan_tri) mới đọc được dữ liệu câu hỏi
drop policy if exists "btc doc hoi nhanh" on public.g16_hoi_nhanh;
create policy "btc doc hoi nhanh"
  on public.g16_hoi_nhanh for select
  to authenticated
  using ((select public.la_btc()));

-- 5. Cấp quyền truy cập
grant insert on public.g16_hoi_nhanh to anon;
grant select, delete on public.g16_hoi_nhanh to authenticated;
