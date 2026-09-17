-- ============================================================
-- 37FTU — Tuyển thành viên Gen 16
-- Chạy toàn bộ file này trong Supabase → SQL Editor → New query → Run
-- ============================================================

-- ---------- 1. Bảng nhận đơn ứng tuyển ----------
create table if not exists public.g16_ung_vien (
  id                uuid primary key default gen_random_uuid(),
  tao_luc           timestamptz not null default now(),

  ho_ten            text not null,
  ngay_sinh         date,
  mssv              text not null,
  khoa              text,
  khoa_vien         text,
  sdt               text not null,
  email             text not null,
  facebook          text,
  que               text,

  nv1               text,
  nv2               text,
  ly_do             text,
  diem_manh         text,
  biet_qua          text,
  nguoi_gioi_thieu  text,

  the_he            text default 'Gen 16',
  nguon             jsonb,          -- utm_source / utm_medium / utm_campaign / ref
  gui_luc           timestamptz,
  trang_thai        text default 'moi',   -- moi | qua_ho_so | pv | teamwork | trung_tuyen | truot
  ghi_chu_btc       text
);

create index if not exists g16_ung_vien_tao_luc_idx on public.g16_ung_vien (tao_luc desc);
create index if not exists g16_ung_vien_que_idx     on public.g16_ung_vien (que);

-- Bật khoá hàng: mặc định không ai đọc/sửa được
alter table public.g16_ung_vien enable row level security;

-- Khách vãng lai (khoá anon trên trang web) CHỈ được nộp đơn, không được đọc lại
drop policy if exists "ai cung nop don duoc" on public.g16_ung_vien;
create policy "ai cung nop don duoc"
  on public.g16_ung_vien for insert
  to anon
  with check (true);

-- Ban tổ chức đọc/sửa sau khi đăng nhập Supabase (mời tài khoản trong Authentication → Users)
drop policy if exists "btc doc duoc" on public.g16_ung_vien;
create policy "btc doc duoc"
  on public.g16_ung_vien for select
  to authenticated
  using (true);

drop policy if exists "btc sua duoc" on public.g16_ung_vien;
create policy "btc sua duoc"
  on public.g16_ung_vien for update
  to authenticated
  using (true) with check (true);

-- LƯU Ý: KHÔNG tạo policy select cho anon. Nếu mở, mọi người vào được
-- số điện thoại và email của toàn bộ ứng viên chỉ bằng trình duyệt.


-- ---------- 2. Bảng cho Bản đồ người Nghệ ----------
-- Chỉ chứa dữ liệu công khai được: tên hiển thị, quê, thế hệ.
-- Tuyệt đối không đưa sđt/email/mssv vào bảng này.
create table if not exists public.thanh_vien_que (
  id        bigint generated always as identity primary key,
  ten       text,           -- để trống nếu người đó không muốn hiện tên
  que       text not null,  -- 'Yên Thành'
  que_id    text not null,  -- 'yen-thanh' (trùng id trong data/nghe-an.json)
  the_he    text,           -- 'G15'
  hien_ten  boolean default false
);

alter table public.thanh_vien_que enable row level security;

drop policy if exists "ai cung xem ban do duoc" on public.thanh_vien_que;
create policy "ai cung xem ban do duoc"
  on public.thanh_vien_que for select
  to anon
  using (true);

-- Ví dụ thêm dữ liệu:
-- insert into public.thanh_vien_que (ten, que, que_id, the_he, hien_ten)
-- values ('Nguyễn Văn A', 'Yên Thành', 'yen-thanh', 'G15', true);


-- ---------- 3. Xem nhanh cho BTC ----------
-- Đơn theo từng kênh truyền thông (để biết kênh nào ra ứng viên)
create or replace view public.g16_theo_kenh as
select
  coalesce(nguon->>'utm_source', 'khong_ro') as kenh,
  coalesce(nguon->>'utm_campaign', '-')      as chien_dich,
  count(*)                                   as so_don
from public.g16_ung_vien
group by 1, 2
order by so_don desc;

-- Đơn theo quê (đối chiếu với bản đồ)
create or replace view public.g16_theo_que as
select que, count(*) as so_don
from public.g16_ung_vien
group by que
order by so_don desc;


-- ---------- 4. Danh bạ người Nghệ (phần mở rộng của bảng ở mục 2) ----------
-- Những cột này hiện công khai trên trang Danh bạ. Ai đọc trang cũng đọc được.
-- => CHỈ điền thông tin người đó đã đồng ý cho hiện. Không sđt, không email, không mssv.
alter table public.thanh_vien_que add column if not exists truong_thpt text;
alter table public.thanh_vien_que add column if not exists khoa_hoc    text;   -- 'K62'
alter table public.thanh_vien_que add column if not exists nganh       text;
alter table public.thanh_vien_que add column if not exists ban         text;   -- 'Ban Truyền thông'
alter table public.thanh_vien_que add column if not exists gioi_thieu  text;   -- một dòng tự giới thiệu
alter table public.thanh_vien_que add column if not exists lien_he     text;   -- link Facebook, chỉ link http(s)
alter table public.thanh_vien_que add column if not exists cong_khai   boolean default true;

create index if not exists thanh_vien_que_que_idx    on public.thanh_vien_que (que_id);
create index if not exists thanh_vien_que_truong_idx on public.thanh_vien_que (truong_thpt);


-- ---------- 5. Người tự xin thêm tên vào bản đồ ----------
-- Trang ban-do.html gửi vào đây. BTC duyệt rồi mới chép sang thanh_vien_que.
-- Khách chỉ được GỬI, không được đọc lại danh sách người khác đã gửi.
create table if not exists public.ban_do_dang_ky (
  id           bigint generated always as identity primary key,
  tao_luc      timestamptz not null default now(),

  ten          text not null,
  que          text,
  que_id       text not null,
  truong_thpt  text,
  khoa_hoc     text,
  nganh        text,
  the_he       text,
  gioi_thieu   text,
  lien_he      text,

  dong_y       boolean default false,   -- người đó bấm đồng ý công khai
  gui_luc      timestamptz,
  da_duyet     boolean default false,
  ghi_chu_btc  text
);

alter table public.ban_do_dang_ky enable row level security;

drop policy if exists "ai cung xin them ten duoc" on public.ban_do_dang_ky;
create policy "ai cung xin them ten duoc"
  on public.ban_do_dang_ky for insert
  to anon
  with check (dong_y = true);

drop policy if exists "btc doc dang ky" on public.ban_do_dang_ky;
create policy "btc doc dang ky"
  on public.ban_do_dang_ky for select
  to authenticated
  using (true);

drop policy if exists "btc sua dang ky" on public.ban_do_dang_ky;
create policy "btc sua dang ky"
  on public.ban_do_dang_ky for update
  to authenticated
  using (true) with check (true);

-- KHÔNG mở select cho anon ở bảng này: người gửi chưa được duyệt thì chưa nên
-- lộ tên và link Facebook cho cả internet.

-- Duyệt xong thì chép sang danh bạ công khai:
-- insert into public.thanh_vien_que (ten, que, que_id, the_he, truong_thpt, khoa_hoc, nganh, gioi_thieu, lien_he, cong_khai)
-- select ten, que, que_id, the_he, truong_thpt, khoa_hoc, nganh, gioi_thieu, lien_he, true
-- from public.ban_do_dang_ky where id = 123;
-- update public.ban_do_dang_ky set da_duyet = true where id = 123;


-- ---------- 6. Xem nhanh danh bạ ----------
create or replace view public.ban_do_cho_duyet as
select id, tao_luc, ten, que, truong_thpt, khoa_hoc, the_he, lien_he
from public.ban_do_dang_ky
where da_duyet = false
order by tao_luc desc;
