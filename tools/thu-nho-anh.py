# -*- coding: utf-8 -*-
"""Thu nho may anh dang to gap hang chuc lan cho hien thi.

Giu NGUYEN ten file de khong phai sua cho nao tro toi chung. Co nhan
them gap doi so voi co hien thi that, de man hinh net cao van ro.
"""
import os
import unicodedata
from PIL import Image

GOC = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "assets")
chuan = lambda s: unicodedata.normalize("NFC", s).lower()

# (duong dan tuong doi trong assets, be ngang moi, chat luong jpg)
VIEC = [
    ("buom-1.png", 280, None),
    ("buom-2.png", 280, None),
    ("img/hanh-trinh-mhx.jpg", 560, 82),
    ("img/hanh-trinh-tet.jpg", 560, 82),
    ("img/hanh-trinh-tap-huan.jpg", 560, 82),
    ("img/hanh-trinh-gieo-mam.jpg", 560, 82),
    ("img/hanh-trinh-cho-em-mo.jpg", 560, 82),
    ("img/hanh-trinh-noi-bo.jpg", 560, 82),
]

tong_truoc = tong_sau = 0
for ten, rong, chat in VIEC:
    duong = os.path.join(GOC, ten.replace("/", os.sep))
    if not os.path.isfile(duong):
        print("khong thay:", ten)
        continue

    truoc = os.path.getsize(duong)
    im = Image.open(duong)
    cu = "%dx%d" % (im.size)

    # anh bu'o'm phan lon la vung trong suot -> cat sat truoc roi moi thu nho
    if im.mode in ("RGBA", "LA"):
        bb = im.split()[-1].getbbox()
        if bb:
            im = im.crop(bb)

    if im.width > rong:
        im = im.resize((rong, round(im.height * rong / im.width)), Image.LANCZOS)

    if chat:
        im.convert("RGB").save(duong, "JPEG", quality=chat, optimize=True, progressive=True)
    else:
        im.save(duong, "PNG", optimize=True)

    sau = os.path.getsize(duong)
    tong_truoc += truoc
    tong_sau += sau
    print("%-32s %-11s -> %-10s %6.0fKB -> %5.0fKB" %
          (ten, cu, "%dx%d" % im.size, truoc / 1024, sau / 1024))

print()
print("Tong: %.0f KB -> %.0f KB (bot %.0f KB, con %.0f%%)" %
      (tong_truoc / 1024, tong_sau / 1024, (tong_truoc - tong_sau) / 1024,
       tong_sau * 100.0 / tong_truoc))
