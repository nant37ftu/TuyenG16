-- ============================================================
-- 37FTU G16 — Dashboard Thống Kê Đơn Nội Bộ (Bản Chuẩn Từng Khối)
-- ============================================================

create or replace function public.lay_thong_ke_don_noi_bo(mat_ma_nhap text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_tong_don  int := 0;
  v_hom_nay   int := 0;
  v_hom_qua   int := 0;
  v_theo_ngay jsonb := '[]'::jsonb;
  v_theo_ban  jsonb := '[]'::jsonb;
  v_theo_que  jsonb := '[]'::jsonb;
begin
  -- 1. Kiểm tra mật mã nội bộ
  if mat_ma_nhap is null or trim(mat_ma_nhap) <> '37ftu@g16' then
    return jsonb_build_object(
      'hop_le', false,
      'loi', 'Mật mã nội bộ không chính xác.'
    );
  end if;

  -- 2. Đếm tổng số đơn
  select count(*) into v_tong_don
  from public.g16_ung_vien;

  -- 3. Số đơn hôm nay (theo giờ VN UTC+7)
  select count(*) into v_hom_nay
  from public.g16_ung_vien
  where (tao_luc at time zone 'Asia/Ho_Chi_Minh')::date = (now() at time zone 'Asia/Ho_Chi_Minh')::date;

  -- 4. Số đơn hôm qua (theo giờ VN UTC+7)
  select count(*) into v_hom_qua
  from public.g16_ung_vien
  where (tao_luc at time zone 'Asia/Ho_Chi_Minh')::date = ((now() at time zone 'Asia/Ho_Chi_Minh')::date - 1);

  -- 5. Thống kê theo ngày
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'ngay_raw', t.ngay_raw,
        'ngay', t.ngay_hien_thi,
        'ngay_day_du', t.ngay_day_du,
        'so_don', t.so_don
      )
      order by t.ngay_raw asc
    ),
    '[]'::jsonb
  ) into v_theo_ngay
  from (
    select
      to_char(tao_luc at time zone 'Asia/Ho_Chi_Minh', 'YYYY-MM-DD') as ngay_raw,
      to_char(tao_luc at time zone 'Asia/Ho_Chi_Minh', 'DD/MM') as ngay_hien_thi,
      to_char(tao_luc at time zone 'Asia/Ho_Chi_Minh', 'DD/MM/YYYY') as ngay_day_du,
      count(*) as so_don
    from public.g16_ung_vien
    group by 1, 2, 3
  ) t;

  -- 6. Thống kê theo Ban (Nguyện vọng 1)
  select coalesce(
    jsonb_agg(
      jsonb_build_object('ban', b.ban, 'so_don', b.so_don)
      order by b.so_don desc
    ),
    '[]'::jsonb
  ) into v_theo_ban
  from (
    select
      coalesce(nullif(trim(nv1), ''), 'Chưa chọn ban') as ban,
      count(*) as so_don
    from public.g16_ung_vien
    group by 1
  ) b;

  -- 7. Thống kê theo Quê quán / Khu vực
  select coalesce(
    jsonb_agg(
      jsonb_build_object('que', q.que, 'so_don', q.so_don)
      order by q.so_don desc
    ),
    '[]'::jsonb
  ) into v_theo_que
  from (
    select
      coalesce(nullif(trim(que), ''), 'Khác') as que,
      count(*) as so_don
    from public.g16_ung_vien
    group by 1
    limit 10
  ) q;

  -- 8. Trả về kết quả tổng hợp
  return jsonb_build_object(
    'hop_le', true,
    'tong_don', v_tong_don,
    'hom_nay', v_hom_nay,
    'hom_qua', v_hom_qua,
    'theo_ngay', v_theo_ngay,
    'theo_ban', v_theo_ban,
    'theo_que', v_theo_que,
    'cap_nhat_luc', to_char(now() at time zone 'Asia/Ho_Chi_Minh', 'HH24:MI:SS DD/MM/YYYY')
  );
end;
$$;

-- Cấp quyền gọi hàm cho web
revoke all on function public.lay_thong_ke_don_noi_bo(text) from public;
grant execute on function public.lay_thong_ke_don_noi_bo(text) to anon, authenticated;
