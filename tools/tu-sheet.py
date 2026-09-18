#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Đổi danh sách thành viên (Google Sheet) -> data/thanh-vien.json cho Bảng vàng.

CÁCH DÙNG
---------
1. Mở sheet "37FTU | DANH SÁCH THÀNH VIÊN CÁC THẾ HỆ".
   Thêm một cột tên **QUÊ** (ghi tên huyện cũ: Yên Thành, Diễn Châu, TP Vinh...).
2. Mỗi tab (một nhiệm kỳ) bấm File -> Download -> CSV, cất vào
   thư mục `rieng-tu/nhiem-ky/`. Tên file đặt theo nhiệm kỳ: `2025-2026.csv`.
   Thư mục `rieng-tu/` đã bị .gitignore chặn, không lên GitHub.
3. Chạy:  python tools/tu-sheet.py
4. Xem `data/thanh-vien.json` rồi mở lại trang bản đồ.

FILE CSV CẦN CÓ CÁC CỘT (thừa cột khác cũng không sao, script bỏ qua):
   HỌ TÊN | GEN | CHỨC VỤ | BAN | QUÊ

RIÊNG TƯ — đọc kỹ
-----------------
`data/thanh-vien.json` nằm trong repo công khai, ai cũng đọc được. Nên script:
  * KHÔNG bao giờ chép số điện thoại, email, ngày sinh, mã sinh viên, lớp.
  * Chỉ ghi tên của người từng giữ chức trong BCH (Phó ban trở lên).
    Thành viên thường chỉ được đếm vào con số tổng, không nêu tên.
    Muốn nêu tên thêm ai thì ghi tên họ vào rieng-tu/cho-phep-neu-ten.txt
    (mỗi dòng một tên) — nghĩa là người đó đã đồng ý.
"""

import csv
import hashlib
import io
import json
import os
import re
import sys
import unicodedata
from collections import OrderedDict

GOC = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
THU_MUC_CSV = os.path.join(GOC, 'rieng-tu', 'nhiem-ky')
FILE_CHO_PHEP = os.path.join(GOC, 'rieng-tu', 'cho-phep-neu-ten.txt')
FILE_QUE = os.path.join(GOC, 'rieng-tu', 'que.csv')
FILE_RA = os.path.join(GOC, 'data', 'thanh-vien.json')

# ---------------------------------------------------------------- tiện ích

def khong_dau(s):
    """Bỏ dấu tiếng Việt để so khớp cho dễ."""
    s = unicodedata.normalize('NFD', s or '')
    s = ''.join(c for c in s if unicodedata.category(c) != 'Mn')
    return s.replace('đ', 'd').replace('Đ', 'D').lower().strip()


def gon(s):
    return re.sub(r'\s+', ' ', (s or '').strip())


# 21 huyện/thị/thành trước sáp nhập 2025 — khớp với data/nghe-an.json
HUYEN = OrderedDict([
    ('vinh', 'TP Vinh'), ('cua-lo', 'TX Cửa Lò'), ('thai-hoa', 'TX Thái Hoà'),
    ('hoang-mai', 'TX Hoàng Mai'), ('quynh-luu', 'Quỳnh Lưu'),
    ('dien-chau', 'Diễn Châu'), ('yen-thanh', 'Yên Thành'),
    ('do-luong', 'Đô Lương'), ('thanh-chuong', 'Thanh Chương'),
    ('nam-dan', 'Nam Đàn'), ('hung-nguyen', 'Hưng Nguyên'),
    ('nghi-loc', 'Nghi Lộc'), ('nghia-dan', 'Nghĩa Đàn'), ('tan-ky', 'Tân Kỳ'),
    ('anh-son', 'Anh Sơn'), ('con-cuong', 'Con Cuông'), ('tuong-duong', 'Tương Dương'),
    ('ky-son', 'Kỳ Sơn'), ('que-phong', 'Quế Phong'), ('quy-chau', 'Quỳ Châu'),
    ('quy-hop', 'Quỳ Hợp'),
])

# vài cách viết tắt hay gặp khi nhập tay
BIET_DANH = {
    'tp vinh': 'vinh', 'thanh pho vinh': 'vinh', 'vinh': 'vinh',
    'tx cua lo': 'cua-lo', 'cua lo': 'cua-lo',
    'tx thai hoa': 'thai-hoa', 'thai hoa': 'thai-hoa',
    'tx hoang mai': 'hoang-mai', 'hoang mai': 'hoang-mai',
    'quy hop': 'quy-hop', 'quy chau': 'quy-chau', 'que phong': 'que-phong',
    'do luong': 'do-luong', 'nam dan': 'nam-dan', 'tan ky': 'tan-ky',
}
for _id, _ten in HUYEN.items():
    BIET_DANH[khong_dau(_ten)] = _id
    BIET_DANH[khong_dau(_ten).replace('tp ', '').replace('tx ', '')] = _id


def doc_que(v):
    """'Yên Thành' / 'yen thanh' / 'Huyện Yên Thành' -> 'yen-thanh'. Không rõ -> ''."""
    k = khong_dau(v)
    k = re.sub(r'^(huyen|thi xa|thanh pho|tp|tx|h\.)\s*', '', k).strip()
    return BIET_DANH.get(k, '')


# ------------------------------------------------- chức vụ -> cấp bậc

# Thứ tự trong danh sách này là thứ tự ĐEM RA SO KHỚP, không phải thứ tự bậc.
# 'Phó chủ tịch' phải đứng trước 'Chủ tịch', không thì chuỗi 'chu tich' nằm sẵn
# trong 'pho chu tich' sẽ nuốt mất, phó chủ tịch hoá thành chủ tịch hết.
BAC = [
    (4, 'Phó chủ tịch',  ('pho chu tich',),        'Ban Lãnh đạo'),
    (5, 'Chủ tịch',      ('chu tich',),            'Ban Lãnh đạo'),
    (3, 'Trưởng ban',    ('truong ban', 'doi truong'), 'Ban Chấp hành'),
    (3, 'Uỷ viên BCH',   ('uy vien bch',),         'Ban Chấp hành'),
    (2, 'Phó ban',       ('pho ban',),             'Ban Chấp hành'),
    (1, 'Thành viên',    ('thanh vien',),          'Thành viên'),
]


def doc_chuc_vu(v):
    """Trả về (bac, ten_chuc_vu, nhom, la_sang_lap)."""
    k = khong_dau(v)
    sang_lap = 'co-founder' in k or 'co founder' in k
    for bac, ten, tu_khoa, nhom in BAC:
        if any(t in k for t in tu_khoa):
            return bac, ten, nhom, sang_lap
    return 0, gon(v), 'Thành viên', sang_lap


def doc_ban(v):
    """'Ban Đối Ngoại' / 'đối ngoại' -> 'Đối ngoại'."""
    k = khong_dau(v).replace('ban ', '', 1).strip()
    if 'to chuc' in k:
        return 'Tổ chức'
    if 'doi ngoai' in k:
        return 'Đối ngoại'
    if 'truyen thong' in k:
        return 'Truyền thông'
    return gon(v)


def doc_gen(v):
    # Có ô ghi nhầm khoá ('K60') vào cột GEN. CLB mới tới Gen 16, nên số nào
    # lớn hơn 30 chắc chắn không phải gen — bỏ, coi như không biết.
    m = re.search(r'(\d+)', str(v or ''))
    if not m:
        return 0
    n = int(m.group(1))
    return n if 1 <= n <= 30 else 0


def khoa_nhiem_ky(nk):
    """'2011-2014' -> 2011, để xếp thứ tự thời gian."""
    m = re.search(r'(\d{4})', nk)
    return int(m.group(1)) if m else 0


# ---------------------------------------------------------------- đọc CSV

def doc_het_csv():
    if not os.path.isdir(THU_MUC_CSV):
        sys.exit('Chưa có thư mục %s — xem hướng dẫn ở đầu file này.' % THU_MUC_CSV)
    dong = []
    for ten_file in sorted(os.listdir(THU_MUC_CSV)):
        if not ten_file.lower().endswith('.csv'):
            continue
        nk = os.path.splitext(ten_file)[0]
        with io.open(os.path.join(THU_MUC_CSV, ten_file), encoding='utf-8-sig', newline='') as f:
            for r in csv.DictReader(f):
                # chuẩn hoá tên cột: bỏ dấu, bỏ khoảng trắng thừa
                r = {khong_dau(k): v for k, v in r.items() if k}
                ten = gon(r.get('ho ten') or r.get('ho va ten') or '')
                if not ten:
                    continue
                dong.append({
                    'nk': nk,
                    'ten': ten,
                    'gen': doc_gen(r.get('gen')),
                    'chuc_vu': gon(r.get('chuc vu')),
                    'ban': doc_ban(r.get('ban')),
                    'que': doc_que(r.get('que')),
                    'que_tho': gon(r.get('que')),
                })
    return dong


def doc_que_bo_sung():
    """
    Nguồn quê thứ hai: rieng-tu/que.csv (cột HỌ TÊN, GEN, QUÊ).

    Dùng khi chưa kịp thêm cột QUÊ vào sheet gốc — điền riêng file này nhanh hơn
    vì chỉ phải điền mỗi người một lần, thay vì lặp lại ở từng nhiệm kỳ.
    """
    if not os.path.isfile(FILE_QUE):
        return {}
    ra = {}
    with io.open(FILE_QUE, encoding='utf-8-sig', newline='') as f:
        for r in csv.DictReader(f):
            r = {khong_dau(k): v for k, v in r.items() if k}
            ten = gon(r.get('ho ten') or r.get('ho va ten') or '')
            que = doc_que(r.get('que'))
            if ten and que:
                ra[khong_dau(ten) + '|' + str(doc_gen(r.get('gen')))] = que
    return ra


def viet_mau_que(moi_nguoi):
    """Chưa có rieng-tu/que.csv thì đẻ sẵn một bản trống cho BTC điền."""
    thieu = [p for p in moi_nguoi if not p['que']]
    if not thieu:
        return
    with io.open(FILE_QUE, 'w', encoding='utf-8-sig', newline='') as f:
        w = csv.writer(f)
        w.writerow(['HỌ TÊN', 'GEN', 'CHỨC VỤ', 'NHIỆM KỲ', 'QUÊ'])
        for p in sorted(thieu, key=lambda x: (-x['bac'], khong_dau(x['ten']))):
            w.writerow([p['ten'], p['gen'], p['chuc_vu'],
                        p['nhiem_ky_dau'] + ' → ' + p['nhiem_ky_cuoi'], ''])
    print('\n  → Đã tạo %s với %d dòng trống.' % (FILE_QUE, len(thieu)))
    print('    Mở bằng Excel/Google Sheet, điền cột QUÊ (tên huyện cũ), lưu lại')
    print('    dạng CSV rồi chạy lại script này. Tên huyện hợp lệ:')
    print('      ' + ', '.join(HUYEN.values()))


def canh_bao_trung_ten(moi_nguoi):
    """
    Cùng tên nhưng khác gen thì script coi là hai người. Đôi khi đúng (hai khoá
    khác nhau trùng tên), đôi khi chỉ là sheet ghi gen không thống nhất. Không
    đoán được, nên in ra để BTC tự soát.
    """
    theo_ten = {}
    for p in moi_nguoi:
        theo_ten.setdefault(khong_dau(p['ten']), []).append(p)
    ngo = {k: v for k, v in theo_ten.items() if len(v) > 1}
    if not ngo:
        return
    print('\n  ⚠ %d tên xuất hiện ở nhiều gen — script đang tính là nhiều người.' % len(ngo))
    print('    Nếu thật ra là một người thì sửa cột GEN trong sheet cho thống nhất:')
    for v in list(ngo.values())[:10]:
        print('      %s — gen %s' % (v[0]['ten'], ', '.join(str(x['gen']) for x in v)))


def doc_cho_phep():
    if not os.path.isfile(FILE_CHO_PHEP):
        return set()
    with io.open(FILE_CHO_PHEP, encoding='utf-8') as f:
        return {khong_dau(d) for d in f if d.strip() and not d.startswith('#')}


# ---------------------------------------------------------------- gom người

def gom(dong, cho_phep):
    """Một người = một (tên, gen). Trùng tên khác gen là hai người khác nhau."""
    nguoi = OrderedDict()
    for d in dong:
        ma = khong_dau(d['ten']) + '|' + str(d['gen'])
        p = nguoi.setdefault(ma, {
            'ma': ma, 'ten': d['ten'], 'gen': d['gen'], 'que': '',
            'hanh_trinh': [], 'sang_lap': False,
        })
        if d['que'] and not p['que']:
            p['que'] = d['que']
        bac, ten_cv, nhom, sang_lap = doc_chuc_vu(d['chuc_vu'])
        if sang_lap:
            p['sang_lap'] = True
        p['hanh_trinh'].append({
            'nk': d['nk'], 'bac': bac, 'chuc_vu': ten_cv, 'nhom': nhom, 'ban': d['ban'],
        })

    ra = []
    for p in nguoi.values():
        # Sheet đôi khi ghi một người hai dòng trong cùng một nhiệm kỳ (sinh hoạt
        # hai ban). Giữ lại dòng có chức vụ cao nhất của nhiệm kỳ đó thôi.
        theo_nk = {}
        for b in p['hanh_trinh']:
            cu = theo_nk.get(b['nk'])
            if cu is None or b['bac'] > cu['bac']:
                theo_nk[b['nk']] = b
        ht = sorted(theo_nk.values(), key=lambda x: khoa_nhiem_ky(x['nk']))
        # bỏ hai dòng liền nhau y hệt nhau (cùng chức vụ, cùng ban)
        rut = []
        for b in ht:
            if rut and rut[-1]['chuc_vu'] == b['chuc_vu'] and rut[-1]['ban'] == b['ban']:
                rut[-1]['nk_den'] = b['nk']
                continue
            b = dict(b)
            b['nk_den'] = b['nk']
            rut.append(b)
        dinh = max(ht, key=lambda x: x['bac'])
        bans = [b['ban'] for b in ht if b['ban']]
        ra.append({
            'ma': p['ma'],
            'ten': p['ten'],
            'gen': p['gen'],
            'que': p['que'],
            'bac': dinh['bac'],
            'chuc_vu': ('Đồng sáng lập · ' + dinh['chuc_vu']) if p['sang_lap'] else dinh['chuc_vu'],
            'nhom': 'Sáng lập' if p['sang_lap'] else dinh['nhom'],
            'ban': dinh['ban'] or (bans[-1] if bans else ''),
            'nhiem_ky_dau': rut[0]['nk'],
            'nhiem_ky_cuoi': rut[-1]['nk_den'],
            'so_nhiem_ky': len(ht),
            'nhiem_ky': [b['nk'] for b in ht],
            'hanh_trinh': [
                {'nk': b['nk'] if b['nk'] == b['nk_den'] else b['nk'].split('-')[0] + '–' + b['nk_den'].split('-')[-1],
                 'chuc_vu': b['chuc_vu'], 'ban': b['ban']}
                for b in rut
            ],
            'thanh_tich': [],   # BTC tự điền, xem README
            'loi_nhan': '',     # một câu nhắn cho khoá sau, BTC tự điền
            'lien_he': '',      # chỉ nhận link http(s), để trống nếu chưa xin phép
            'cong_khai': p['sang_lap'] or dinh['bac'] >= 2 or khong_dau(p['ten']) in cho_phep,
        })
    return ra


# ---------------------------------------------------------------- xuất file

def doc_file_cu():
    """Bản data/thanh-vien.json hiện có — có thể đã được sửa tay ở admin.html."""
    if not os.path.isfile(FILE_RA):
        return {}
    try:
        with io.open(FILE_RA, encoding='utf-8') as f:
            return json.load(f)
    except (ValueError, OSError):
        print('  ! data/thanh-vien.json hỏng, bỏ qua bản cũ — mọi chỗ sửa tay sẽ mất.')
        return {}


def bam(ma):
    """Phải khớp y hệt hàm bam() trong admin.js: SHA-256 của mã, dạng hex."""
    return hashlib.sha256(ma.encode('utf-8')).hexdigest()


def doc_an_ma(v):
    """an_ma bản cũ là mảng mã băm, bản mới là {mã băm: quê}. Đọc được cả hai."""
    if not v:
        return {}
    if isinstance(v, list):
        return {h: '' for h in v}
    return dict(v)


# Ba ô này sheet không có — chỉ admin.html điền. Có thì luôn giữ.
CHI_ADMIN = ('thanh_tich', 'loi_nhan', 'lien_he')


def hop_nhat(moi_nguoi, cu):
    """
    Trộn số liệu mới từ sheet với chỗ BTC đã sửa tay ở admin.html.

      * Ô nào nằm trong `sua_tay` của người đó  -> giữ bản sửa tay.
      * thành tích, lời nhắn, link liên hệ     -> luôn giữ (sheet không có).
      * Quê: sheet có thì lấy sheet, trừ khi đã sửa tay; sheet trống thì giữ quê cũ.
      * Người có mã băm nằm trong `an_ma`       -> đã bị gỡ tên, không nêu tên lại,
        nhưng vẫn đếm vào tổng: an_ma giữ kèm quê của họ lúc bị gỡ.
      * Người thêm tay ở admin (mã 'tay-...')   -> giữ nguyên, sheet không biết họ.
    """
    cu_theo_ma = {p.get('ma'): p for p in cu.get('nguoi', []) if p.get('ma')}
    an_ma = doc_an_ma(cu.get('an_ma'))
    bi_go = []
    for p in moi_nguoi:
        old = cu_theo_ma.get(p['ma'])
        if old:
            sua = old.get('sua_tay') or []
            for k in sua:
                if k in old:
                    p[k] = old[k]
            for k in CHI_ADMIN:
                if old.get(k):
                    p[k] = old[k]
            if not p['que'] and old.get('que'):
                p['que'] = old['que']
            if sua:
                p['sua_tay'] = list(sua)
        h = bam(p['ma'])
        p['bi_go'] = h in an_ma
        if p['bi_go'] and not p['que'] and an_ma[h] in HUYEN:
            p['que'] = an_ma[h]   # quê lúc bị gỡ — để còn đếm vào tổng
        if p['bi_go'] and p['cong_khai']:
            bi_go.append(p)
    them_tay = [p for p in cu.get('nguoi', []) if str(p.get('ma', '')).startswith('tay-')]
    return bi_go, them_tay


# thứ tự nhóm khi xếp: người sáng lập, rồi Ban Lãnh đạo, rồi Ban Chấp hành
THU_TU_NHOM = {'Sáng lập': 0, 'Ban Lãnh đạo': 1, 'Ban Chấp hành': 2, 'Thành viên': 3}


def cong_vao(so, q, gen, n=1):
    o = so.setdefault(q, {'ten': HUYEN[q], 'tong': 0, 'theo_the_he': {}})
    o['tong'] += n
    if gen:
        k = 'G%d' % gen
        o['theo_the_he'][k] = o['theo_the_he'].get(k, 0) + n


def main():
    dong = doc_het_csv()
    cho_phep = doc_cho_phep()
    moi_nguoi = gom(dong, cho_phep)

    # quê lấy từ sheet gốc trước; thiếu thì lấy tiếp ở rieng-tu/que.csv
    bo_sung = doc_que_bo_sung()
    for p in moi_nguoi:
        if not p['que']:
            p['que'] = bo_sung.get(p['ma'], '')

    cu = doc_file_cu()
    bi_go, them_tay = hop_nhat(moi_nguoi, cu)

    # Người được nêu tên trên trang; còn lại chỉ góp vào con số tổng
    cong_khai = [p for p in moi_nguoi if p['cong_khai'] and not p['bi_go']] + them_tay
    khong_ten = [p for p in moi_nguoi if (not p['cong_khai'] or p['bi_go']) and p['que']]

    dem_khong_ten = OrderedDict()
    for p in khong_ten:
        o = dem_khong_ten.setdefault(p['que'], {'tong': 0, 'theo_the_he': {}})
        o['tong'] += 1
        if p['gen']:
            k = 'G%d' % p['gen']
            o['theo_the_he'][k] = o['theo_the_he'].get(k, 0) + 1

    # số liệu bản đồ = người có tên + người không nêu tên; admin ghi đè thì theo ghi đè
    ghi_de = cu.get('ghi_de_tong') or {}
    so_lieu = OrderedDict()
    for p in cong_khai:
        if p.get('que') in HUYEN:
            cong_vao(so_lieu, p['que'], p.get('gen'))
    for q, d in dem_khong_ten.items():
        o = so_lieu.setdefault(q, {'ten': HUYEN[q], 'tong': 0, 'theo_the_he': {}})
        o['tong'] += d['tong']
        for k, n in d['theo_the_he'].items():
            o['theo_the_he'][k] = o['theo_the_he'].get(k, 0) + n
    for q, n in ghi_de.items():
        if q in HUYEN:
            so_lieu.setdefault(q, {'ten': HUYEN[q], 'tong': 0, 'theo_the_he': {}})['tong'] = n
    cho_biet_que = sum(1 for p in cong_khai if p.get('que')) + len(khong_ten)

    # khớp xepNguoi() trong ban-do.js
    cong_khai.sort(key=lambda p: (THU_TU_NHOM.get(p.get('nhom'), 9), -p.get('bac', 0),
                                  -len(p.get('thanh_tich') or []),
                                  -p.get('so_nhiem_ky', 0),
                                  -khoa_nhiem_ky(p.get('nhiem_ky_cuoi') or ''),
                                  khong_dau(p.get('ten', ''))))
    for p in cong_khai:
        p.pop('cong_khai', None)
        p.pop('bi_go', None)

    ra = OrderedDict([
        ('_doc', 'File này sinh ra từ tools/tu-sheet.py và được sửa tiếp ở admin.html. '
                 'Chạy lại script KHÔNG làm mất chỗ đã sửa tay (xem sua_tay, an_ma). '
                 'Chỉ nêu tên người từng giữ chức trong BCH; thành viên thường chỉ được '
                 'đếm vào số tổng. Tuyệt đối không có số điện thoại, email, ngày sinh '
                 'hay mã sinh viên ở đây.'),
        ('nguon', '37FTU | DANH SÁCH THÀNH VIÊN CÁC THẾ HỆ'),
        ('cap_nhat', __import__('datetime').date.today().isoformat()),
        ('la_du_lieu_mau', False),
        ('tong_thanh_vien', len(moi_nguoi) + len(them_tay)),
        ('da_biet_que', cho_biet_que),
        ('so_lieu', so_lieu),
    ])
    if dem_khong_ten:
        ra['dem_khong_ten'] = dem_khong_ten
    if ghi_de:
        ra['ghi_de_tong'] = ghi_de
    an_ma = doc_an_ma(cu.get('an_ma'))
    if an_ma:
        ra['an_ma'] = an_ma
    ra['nguoi'] = cong_khai

    with io.open(FILE_RA, 'w', encoding='utf-8', newline='\n') as f:
        json.dump(ra, f, ensure_ascii=False, indent=1)

    so_sua_tay = sum(1 for p in cong_khai if p.get('sua_tay'))
    print('Đã đọc   : %d dòng, %d nhiệm kỳ' % (len(dong), len({d['nk'] for d in dong})))
    print('Gom lại  : %d người' % len(moi_nguoi))
    print('Nêu tên  : %d người (BCH trở lên hoặc đã đồng ý)' % len(cong_khai))
    print('Có quê   : %d người, %d huyện' % (cho_biet_que, len(so_lieu)))
    if cu:
        print('Giữ lại  : chỗ sửa tay của %d người, %d người thêm tay ở admin'
              % (so_sua_tay, len(them_tay)))
    if bi_go:
        print('Đã gỡ tên: %d người (theo admin.html) — vẫn đếm vào tổng, không nêu tên:'
              % len(bi_go))
        for p in bi_go:
            print('      %s — G%s' % (p['ten'], p['gen']))
    if cho_biet_que < len(moi_nguoi):
        print('')
        print('  ! Còn %d người chưa biết quê — bản đồ chưa đếm được họ.'
              % (len(moi_nguoi) - cho_biet_que))
        if not os.path.isfile(FILE_QUE):
            viet_mau_que(moi_nguoi)
        else:
            print('    Gán quê ở admin.html, hoặc điền cột QUÊ trong %s rồi chạy lại.' % FILE_QUE)
    canh_bao_trung_ten(moi_nguoi)
    thieu = sorted({d['que_tho'] for d in dong if d['que_tho'] and not d['que']})
    if thieu:
        print('\n  ⚠ Không hiểu mấy giá trị quê sau, sửa lại trong sheet cho khớp tên huyện:')
        for t in thieu[:20]:
            print('      %r' % t)
    print('\nGhi xong : %s' % FILE_RA)


if __name__ == '__main__':
    main()
