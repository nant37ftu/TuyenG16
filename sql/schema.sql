-- ============================================================
-- 37FTU — Tuyển thành viên Gen 16
-- Chạy toàn bộ file này trong Supabase → SQL Editor → New query → Run
--
-- Chạy lại bao nhiêu lần cũng được: bảng đã có thì giữ nguyên dữ liệu,
-- chỉ cập nhật quyền và tạo thêm phần còn thiếu. Bản cũ trước 18/09/2026
-- có hai lỗ hổng (xem mục 0 và mục 3) — ai đã chạy bản cũ thì chạy lại file này.
-- ============================================================


-- ---------- 0. Ai là Ban tổ chức ----------
-- Supabase mặc định cho BẤT KỲ AI tự đăng ký tài khoản bằng khoá công khai trên
-- trang. Nên "đã đăng nhập" KHÔNG có nghĩa là người của BTC. Quyền đọc đơn và
-- sửa dữ liệu trang chỉ dành cho tài khoản có tên trong bảng dưới — cách thêm
-- người ở mục 8 cuối file.
create table if not exists public.btc_quan_tri (
  user_id   uuid primary key references auth.users (id) on delete cascade,
  email     text not null,
  ten       text,                          -- tên hiện trong "Lịch sử lưu", vd 'Trí'
  them_luc  timestamptz not null default now()
);

alter table public.btc_quan_tri enable row level security;
-- Không có policy nào: qua API không ai đọc hay sửa được bảng này, kể cả BTC.
-- Chỉ sửa trong SQL Editor.
revoke all on table public.btc_quan_tri from anon, authenticated;

-- Người đang gọi có phải BTC không. security definer để đọc được bảng trên.
create or replace function public.la_btc()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.btc_quan_tri
    where user_id = (select auth.uid())
  );
$$;

revoke all on function public.la_btc() from public;
grant execute on function public.la_btc() to anon, authenticated;


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

-- Khách vãng lai (khoá công khai trên trang web) CHỈ được nộp đơn, không được đọc lại
drop policy if exists "ai cung nop don duoc" on public.g16_ung_vien;
create policy "ai cung nop don duoc"
  on public.g16_ung_vien for insert
  to anon
  with check (true);

-- Chỉ BTC (có tên trong btc_quan_tri) mới đọc/sửa được đơn
drop policy if exists "btc doc duoc" on public.g16_ung_vien;
create policy "btc doc duoc"
  on public.g16_ung_vien for select
  to authenticated
  using ((select public.la_btc()));

drop policy if exists "btc sua duoc" on public.g16_ung_vien;
create policy "btc sua duoc"
  on public.g16_ung_vien for update
  to authenticated
  using ((select public.la_btc())) with check ((select public.la_btc()));

-- LƯU Ý: KHÔNG tạo policy select cho anon. Nếu mở, mọi người vào được
-- số điện thoại và email của toàn bộ ứng viên chỉ bằng trình duyệt.


-- ---------- 2. Bảng cũ cho bản đồ (không còn dùng) ----------
-- Bản đồ giờ đọc từ bảng trang_du_lieu ở mục 7. Bảng này giữ lại cho khỏi mất
-- dữ liệu nếu đã lỡ nhập. Tuyệt đối không đưa sđt/email/mssv vào đây.
create table if not exists public.thanh_vien_que (
  id        bigint generated always as identity primary key,
  ten       text,
  que       text not null,
  que_id    text not null,
  the_he    text,
  hien_ten  boolean default false
);

alter table public.thanh_vien_que enable row level security;

drop policy if exists "ai cung xem ban do duoc" on public.thanh_vien_que;
create policy "ai cung xem ban do duoc"
  on public.thanh_vien_que for select
  to anon
  using (true);

alter table public.thanh_vien_que add column if not exists truong_thpt text;
alter table public.thanh_vien_que add column if not exists khoa_hoc    text;
alter table public.thanh_vien_que add column if not exists nganh       text;
alter table public.thanh_vien_que add column if not exists ban         text;
alter table public.thanh_vien_que add column if not exists gioi_thieu  text;
alter table public.thanh_vien_que add column if not exists lien_he     text;
alter table public.thanh_vien_que add column if not exists cong_khai   boolean default true;

create index if not exists thanh_vien_que_que_idx    on public.thanh_vien_que (que_id);
create index if not exists thanh_vien_que_truong_idx on public.thanh_vien_que (truong_thpt);


-- ---------- 3. Người tự xin thêm tên vào bản đồ ----------
-- Form cuối trang ban-do.html gửi vào đây. Khách chỉ được GỬI, không được đọc
-- lại danh sách người khác đã gửi.
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
  using ((select public.la_btc()));

drop policy if exists "btc sua dang ky" on public.ban_do_dang_ky;
create policy "btc sua dang ky"
  on public.ban_do_dang_ky for update
  to authenticated
  using ((select public.la_btc())) with check ((select public.la_btc()));

-- KHÔNG mở select cho anon ở bảng này: người gửi chưa được duyệt thì chưa nên
-- lộ tên và link Facebook cho cả internet.


-- ---------- 4. Bảng xem nhanh cho BTC ----------
-- security_invoker = true: view chạy bằng quyền của NGƯỜI ĐANG XEM, nên vẫn bị
-- RLS ở trên chặn. Thiếu dòng này thì view chạy bằng quyền chủ sở hữu, lách qua
-- RLS — ai có khoá công khai cũng đọc được danh sách chờ duyệt (lỗi của bản cũ).
create or replace view public.g16_theo_kenh
with (security_invoker = true) as
select
  coalesce(nguon->>'utm_source', 'khong_ro') as kenh,
  coalesce(nguon->>'utm_campaign', '-')      as chien_dich,
  count(*)                                   as so_don
from public.g16_ung_vien
group by 1, 2
order by so_don desc;

create or replace view public.g16_theo_que
with (security_invoker = true) as
select que, count(*) as so_don
from public.g16_ung_vien
group by que
order by so_don desc;

create or replace view public.ban_do_cho_duyet
with (security_invoker = true) as
select id, tao_luc, ten, que, truong_thpt, khoa_hoc, the_he, lien_he
from public.ban_do_dang_ky
where da_duyet = false
order by tao_luc desc;

alter view public.g16_theo_kenh    set (security_invoker = true);
alter view public.g16_theo_que     set (security_invoker = true);
alter view public.ban_do_cho_duyet set (security_invoker = true);

-- Ba view này chỉ để xem trong SQL Editor, không cần mở qua API cho khách.
revoke all on public.g16_theo_kenh, public.g16_theo_que, public.ban_do_cho_duyet from anon;


-- ---------- 5. Duyệt người xin thêm tên ----------
-- Xem danh sách chờ:   select * from public.ban_do_cho_duyet;
-- Thấy ổn thì thêm người đó trong admin.html (+ Thêm một người) rồi đánh dấu:
-- update public.ban_do_dang_ky set da_duyet = true where id = 123;


-- ---------- 6. (để trống — số mục giữ như bản cũ cho khỏi lệch README) ----------


-- ---------- 7. Dữ liệu trang, sửa thẳng trên web ở admin.html ----------
-- Mỗi dòng là trọn một bộ dữ liệu của một trang, dạng JSON. Hiện có:
--   khoa = 'ban-do'  ->  y hệt nội dung data/thanh-vien.json
-- Ai cũng ĐỌC được (vốn là dữ liệu công khai trên trang). Chỉ BTC GHI được.
create table if not exists public.trang_du_lieu (
  khoa       text primary key,
  du_lieu    jsonb not null check (jsonb_typeof(du_lieu) = 'object'),
  phien_ban  integer not null default 1,
  cap_nhat   timestamptz not null default now()
);

alter table public.trang_du_lieu enable row level security;

drop policy if exists "ai cung doc duoc" on public.trang_du_lieu;
create policy "ai cung doc duoc"
  on public.trang_du_lieu for select
  to anon, authenticated
  using (true);

drop policy if exists "btc them duoc" on public.trang_du_lieu;
create policy "btc them duoc"
  on public.trang_du_lieu for insert
  to authenticated
  with check ((select public.la_btc()));

drop policy if exists "btc sua duoc" on public.trang_du_lieu;
create policy "btc sua duoc"
  on public.trang_du_lieu for update
  to authenticated
  using ((select public.la_btc())) with check ((select public.la_btc()));

grant select on public.trang_du_lieu to anon, authenticated;
grant insert, update on public.trang_du_lieu to authenticated;
revoke insert, update, delete, truncate on public.trang_du_lieu from anon;
revoke delete, truncate on public.trang_du_lieu from authenticated;

-- Lịch sử: mỗi lần lưu giữ lại một bản, để lỡ tay còn quay lại được.
create table if not exists public.trang_lich_su (
  id         bigint generated always as identity primary key,
  khoa       text not null,
  phien_ban  integer not null,
  du_lieu    jsonb not null,
  so_nguoi   integer generated always as (
               case when jsonb_typeof(du_lieu->'nguoi') = 'array'
                    then jsonb_array_length(du_lieu->'nguoi') end
             ) stored,
  luc        timestamptz not null default now(),
  boi        text
);

create index if not exists trang_lich_su_khoa_idx on public.trang_lich_su (khoa, id desc);

alter table public.trang_lich_su enable row level security;

drop policy if exists "btc xem lich su" on public.trang_lich_su;
create policy "btc xem lich su"
  on public.trang_lich_su for select
  to authenticated
  using ((select public.la_btc()));

grant select on public.trang_lich_su to authenticated;
revoke all on public.trang_lich_su from anon;
revoke insert, update, delete, truncate on public.trang_lich_su from authenticated;

-- Mỗi lần ghi: tự tăng số phiên bản và giờ. Máy người sửa không tự khai được.
create or replace function public.trang_du_lieu_truoc_khi_ghi()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' then
    new.khoa := old.khoa;
    new.phien_ban := old.phien_ban + 1;
  else
    new.phien_ban := 1;
  end if;
  new.cap_nhat := now();
  return new;
end;
$$;

-- Ghi xong: chép một bản vào lịch sử, giữ 100 bản gần nhất.
create or replace function public.trang_du_lieu_sau_khi_ghi()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.trang_lich_su (khoa, phien_ban, du_lieu, boi)
  values (
    new.khoa, new.phien_ban, new.du_lieu,
    coalesce(
      (select coalesce(nullif(b.ten, ''), b.email)
         from public.btc_quan_tri b
        where b.user_id = (select auth.uid())),
      'SQL Editor'
    )
  );

  delete from public.trang_lich_su t
   where t.khoa = new.khoa
     and t.id not in (
       select x.id from public.trang_lich_su x
        where x.khoa = new.khoa
        order by x.id desc
        limit 100
     );
  return null;
end;
$$;

drop trigger if exists trang_du_lieu_truoc on public.trang_du_lieu;
create trigger trang_du_lieu_truoc
  before insert or update on public.trang_du_lieu
  for each row execute function public.trang_du_lieu_truoc_khi_ghi();

drop trigger if exists trang_du_lieu_sau on public.trang_du_lieu;
create trigger trang_du_lieu_sau
  after insert or update on public.trang_du_lieu
  for each row execute function public.trang_du_lieu_sau_khi_ghi();


-- ---------- 8. Cấp quyền sửa cho người trong BTC ----------
-- Bước 1. Supabase → Authentication → Users → Add user → Create new user:
--         điền email + mật khẩu, tick "Auto Confirm User".
-- Bước 2. Chạy câu dưới (bỏ hai dấu -- ở đầu mỗi dòng), thay email và tên:
--
-- insert into public.btc_quan_tri (user_id, email, ten)
-- select id, email, 'Trí' from auth.users where email = 'email-cua-ban@gmail.com'
-- on conflict (user_id) do update set ten = excluded.ten;
--
-- Bước 3. Authentication → Sign In / Providers → tắt "Allow new users to sign up".
--         (Không tắt thì người lạ vẫn tự tạo được tài khoản — không làm gì được
--         vì không có tên trong btc_quan_tri, nhưng tắt đi cho sạch.)
--
-- Xem ai đang có quyền:   select email, ten, them_luc from public.btc_quan_tri;
-- Gỡ quyền một người:     delete from public.btc_quan_tri where email = '...';


-- ---------- 9. Tự kiểm tra ----------
-- Kết quả hiện ngay dưới khung SQL. Đúng khi: cả 5 bảng da_bat_rls = true, và
-- g16_ung_vien, ban_do_dang_ky KHÔNG có dòng nào "SELECT anon".
select
  c.relname        as bang,
  c.relrowsecurity as da_bat_rls,
  coalesce(
    string_agg(p.cmd || ' ' || array_to_string(p.roles, ','), ' | ' order by p.cmd),
    '(không có policy)'
  )                as ai_duoc_lam_gi
from pg_class c
left join pg_policies p
  on p.schemaname = 'public' and p.tablename = c.relname
where c.relnamespace = 'public'::regnamespace
  and c.relname in ('g16_ung_vien', 'ban_do_dang_ky', 'trang_du_lieu',
                    'trang_lich_su', 'btc_quan_tri')
group by c.relname, c.relrowsecurity
order by c.relname;
