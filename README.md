# 37FTU — Bộ trang web của CLB

Năm trang web tĩnh, không cần server, không tốn tiền hosting:

| Trang | File | Dùng để làm gì |
|---|---|---|
| Tuyển thành viên Gen 16 | `index.html` | Giới thiệu CLB, lộ trình tuyển, nhận đơn ứng tuyển |
| Người Nghệ ở Ngoại thương | `ban-do.html` | Bản đồ 21 huyện + **danh bạ** người cùng quê, cùng trường cấp ba |
| Trắc nghiệm hợp ban nào | `quiz.html` | Mini game lan toả, cho ra ảnh kết quả để đăng story |
| Hôm nay ăn chi? | `an-gi.html` | Máy quay chọn món, có món xứ Nghệ cho hôm nào nhớ nhà |
| Góc game bàn trực | `game.html` | Bắt lươn xứ Nghệ + Giọng Nghệ tốc độ, có bảng xếp hạng tại bàn |

`index.html` là trang của **mùa tuyển**. Bốn trang còn lại sống độc lập, hết mùa
tuyển vẫn dùng được — đặc biệt là `ban-do.html`, thứ đáng giữ qua nhiều nhiệm kỳ nhất.

---

## 1. Chạy thử trên máy

Mở thẳng file bằng trình duyệt cũng xem được, nhưng bản đồ và trang ăn chi sẽ không
nạp được dữ liệu (trình duyệt chặn đọc file). Cách đúng — mở Terminal ở thư mục này và chạy:

```bash
python -m http.server 5196
```

Rồi vào `http://localhost:5196`.

---

## 2. Sửa nội dung — không cần biết code

**`noi-dung.js`** — toàn bộ chữ trên trang tuyển: tiêu đề, giá trị cốt lõi, mô tả 3 ban,
5 bước của lộ trình tuyển, câu hỏi thường gặp. Sửa chữ trong dấu nháy là trang tự đổi.

**`config.js`** — các thiết lập:

| Thiết lập | Ý nghĩa |
|---|---|
| `HAN_NOP_DON` | Hạn chót, dùng cho đồng hồ đếm ngược. Nhớ sửa cho đúng lịch G16 |
| `DANG_MO_DON` | `false` thì form ẩn đi, hiện thông báo đã đóng |
| `FANPAGE`, `EMAIL`, `HOTLINE` | Thông tin liên hệ ở chân trang |
| `SUPABASE_URL`, `SUPABASE_ANON_KEY` | Nối với nơi lưu đơn, xem mục 3 |
| `BANG_UNG_VIEN` | Bảng nhận đơn ứng tuyển |
| `BANG_BAN_DO_DANG_KY` | Bảng nhận người tự xin thêm tên vào bản đồ |
| `LINK_FORM_DU_PHONG` | Link Google Form, phòng khi chưa kịp dựng Supabase |
| `BAN_DO_DUNG_SUPABASE` | `true` = bản đồ đọc số liệu thật từ Supabase thay vì file json |

Sửa câu hỏi trắc nghiệm: mở `quiz.js`, phần `CAU_HOI` ở đầu file. Mỗi đáp án có
`d: [Tổ chức, Truyền thông, Đối ngoại]` là điểm cộng cho từng ban.

---

## 3. Nối Supabase để nhận đơn (15 phút)

Chưa nối thì trang vẫn chạy ở **chế độ thử**: đơn chỉ lưu tạm trong trình duyệt của
người nộp, BTC không nhận được gì. Bắt buộc phải làm bước này trước khi công bố.

1. Vào [supabase.com](https://supabase.com) → đăng ký miễn phí → **New project**.
   Chọn region Singapore cho nhanh. Nhớ lưu mật khẩu database.
2. Vào **SQL Editor** → **New query** → dán toàn bộ nội dung `sql/schema.sql` → **Run**.
3. Vào **Project Settings → API**, copy:
   - `Project URL` → dán vào `SUPABASE_URL`
   - `anon public` key → dán vào `SUPABASE_ANON_KEY`
4. Mở lại trang, dòng cảnh báo "Chế độ thử" biến mất là xong. Nộp thử một đơn để kiểm tra.

> **Dự án của CLB đã có sẵn.** `SUPABASE_URL` trong `config.js` đã điền:
> `https://qiwfknocgwcptjmjdpmc.supabase.co`. Chỉ còn thiếu `SUPABASE_ANON_KEY`.
>
> Làm đúng thứ tự này, đừng đảo:
> 1. Chạy `sql/schema.sql` trong **SQL Editor** trước — file này bật RLS, khoá không cho
>    người ngoài đọc đơn ứng viên.
> 2. Rồi mới dán `anon public` key vào `config.js`.
>
> Khoá `anon` sinh ra để lộ trong code chạy ở máy người dùng, **nhưng nó chỉ an toàn
> khi RLS đã bật**. Repo này công khai, nên dán key vào trước khi chạy schema là mở
> toang bảng đơn cho cả internet đọc. Nếu lỡ làm ngược, vào Supabase bấm
> **Settings → API → Rotate anon key** rồi làm lại.

**Xem đơn đã nhận:** Supabase → **Table Editor** → bảng `g16_ung_vien`.
Nút **Export → CSV** để tải về mở bằng Excel.

Ba bảng xem nhanh đã tạo sẵn trong **SQL Editor**:
- `g16_theo_kenh` — mỗi kênh truyền thông mang về bao nhiêu đơn
- `g16_theo_que` — ứng viên đến từ huyện nào
- `ban_do_cho_duyet` — những người vừa xin thêm tên vào bản đồ, chờ duyệt

---

## 4. Đo xem kênh nào ra ứng viên

Khi đăng bài, đừng dùng link trần. Gắn thêm đuôi đánh dấu nguồn:

```
https://ten-mien-cua-clb/?utm_source=fanpage&utm_campaign=ttv-g16
https://ten-mien-cua-clb/?utm_source=tiktok&utm_campaign=ttv-g16
https://ten-mien-cua-clb/?utm_source=group-nghean&utm_campaign=ttv-g16
https://ten-mien-cua-clb/?ref=linh-k64      (link riêng của từng bạn đi phát tờ rơi)
```

Trang tự ghi nhớ nguồn và gửi kèm khi ứng viên nộp đơn. Hết mùa tuyển, mở
`g16_theo_kenh` là biết nên dồn sức vào đâu cho mùa sau.

---

## 5. Người Nghệ ở Ngoại thương — bản đồ và danh bạ

Trang này trả lời hai câu mà người Nghệ gặp nhau bao giờ cũng hỏi: *quê mô* và
*học trường mô*. Nó có ba phần:

- **Bản đồ** — 21 huyện/thành/thị tô màu theo số người, lọc theo thế hệ.
- **Danh bạ** — ai là ai: tên, thế hệ, khoá, quê, **trường cấp ba**, ngành, một dòng
  tự giới thiệu và link Facebook để nhắn. Ai khai quê + trường cấp ba của mình thì
  danh bạ tự đẩy người **cùng trường**, **cùng quê** lên đầu.
- **Thêm tên em** — người ngoài tự xin vào danh bạ, BTC duyệt rồi mới hiện.

### Thay dữ liệu thật

Hiện đang chạy **dữ liệu mẫu** (có dòng cảnh báo vàng trên trang).

**Cách 1 — sửa file** `data/thanh-vien.json`:

```json
{
  "la_du_lieu_mau": false,
  "so_lieu": {
    "yen-thanh": { "ten": "Yên Thành", "tong": 34, "theo_the_he": { "G14": 8, "G15": 10 } }
  },
  "goi_y_truong": ["THPT Phan Đăng Lưu", "THPT Bắc Yên Thành"],
  "thanh_vien": [
    {
      "ten": "Nguyễn Thị Hà", "que_id": "yen-thanh", "the_he": "G15",
      "truong_thpt": "THPT Phan Đăng Lưu", "khoa_hoc": "K62",
      "nganh": "Kinh tế đối ngoại", "ban": "Ban Truyền thông",
      "gioi_thieu": "Chụp ảnh cho CLB từ ngày chưa biết chỉnh màu.",
      "lien_he": "https://facebook.com/...", "cong_khai": true
    }
  ]
}
```

- Mã huyện (`yen-thanh`, `dien-chau`…) lấy trong `data/nghe-an.json`.
- `so_lieu` là con số trên bản đồ, `thanh_vien` là danh bạ. Hai phần độc lập:
  có thể có 34 người Yên Thành trên bản đồ nhưng chỉ 5 người đồng ý hiện tên.
- `cong_khai: false` thì người đó không xuất hiện trong danh bạ.
- Đổi `la_du_lieu_mau` thành `false` là dòng cảnh báo biến mất.

**Cách 2 — lấy từ Supabase:** đổ danh sách vào bảng `thanh_vien_que` (đã tạo sẵn trong
`schema.sql`), rồi đặt `BAN_DO_DUNG_SUPABASE: true` trong `config.js`.

### Duyệt người tự thêm tên

Người lạ gửi form ở cuối trang → vào bảng `ban_do_dang_ky`, **chưa hiện lên trang**.
BTC mở `ban_do_cho_duyet` trong SQL Editor, đọc, thấy ổn thì chép sang `thanh_vien_que`
(câu lệnh mẫu đã ghi sẵn cuối `sql/schema.sql`).

> **Ba điều không được quên.** Danh bạ là trang công khai, ai vào cũng đọc được.
> 1. Chỉ đưa lên tên của người **đã đồng ý**.
> 2. Tuyệt đối không đặt số điện thoại, email hay mã sinh viên vào `thanh_vien_que`
>    hay `data/thanh-vien.json`. Link liên hệ chỉ nhận link Facebook do chính người đó đưa.
> 3. Ai nhắn xin gỡ tên thì gỡ ngay, không hỏi lý do.

---

## 6. Hôm nay ăn chi?

Máy quay chọn món cho những hôm không biết ăn gì. Lọc theo bữa, túi tiền và kiểu món
(món quê / món thường / ăn vặt). Hết món khớp thì trang **tự nới điều kiện** và nói rõ
đã nới cái gì, chứ không chặn người ta lại.

Sửa danh sách trong `data/mon-an.json`:

```json
{ "ten": "Cháo lươn Vinh", "icon": "🍲", "kieu": "que", "gia": 35,
  "buoi": ["sang","trua","toi"],
  "mo_ta": "Nóng, cay, thơm nghệ.",
  "goi_y_cho": "Quán quen của CLB ở ngõ ..." }
```

- `gia` tính bằng nghìn đồng, chỉ dùng để lọc túi tiền.
- `kieu`: `que` | `pho-thong` | `vat`.
- `buoi`: `sang`, `trua`, `chieu`, `toi`, `dem`.
- `goi_y_cho` để trống thì trang không hiện dòng địa chỉ. **Chỉ điền quán mà CLB thật sự
  đã ăn và muốn giới thiệu** — đừng chép địa chỉ trên mạng vào.
- `ly_do` ở cuối file là mấy câu chốt hài hước, thêm bớt thoải mái.

---

## 7. Góc game bàn trực

Mở `game.html` trên laptop hoặc iPad đặt ở bàn trực. Hai trò:

- **Bắt lươn xứ Nghệ** — 45 giây, chạm vào lươn được điểm, chạm nhầm bèo bị trừ.
- **Giọng Nghệ tốc độ** — 10 từ địa phương, mỗi câu 6 giây, trả lời nhanh được nhiều điểm.
  Sửa bộ từ trong `game.js`, phần `TU` ở đầu file: `['mô', 'đâu', 'Em quê mô?']`.

Bảng xếp hạng lưu **ngay trong trình duyệt của máy đó**, không gửi đi đâu cả. Nghĩa là
mỗi máy một bảng riêng — đúng cho bàn trực. Đầu mỗi buổi bấm "Xoá bảng này" để làm lại từ đầu.

**Mã QR:** đặt một file ảnh tên `assets/qr.png` (QR trỏ về trang tuyển thành viên) thì
màn hình kết thúc sẽ hiện mã cho người chơi quét. Không có file đó thì trang tự bỏ phần
mã đi, chỉ còn nút bấm — không vỡ gì cả.

Nút ⛶ góc trên bên phải để chạy toàn màn hình. Nút 🔊 để tắt tiếng khi bàn trực đông.

---

## 8. Đưa lên mạng

Mã nguồn nằm ở **<https://github.com/nant37ftu/TuyenG16>**, nhánh `main`.

**GitHub Pages** — không tốn đồng nào, hợp với trang tĩnh như bộ này:
vào repo → **Settings → Pages** → mục *Build and deployment*, chọn
*Deploy from a branch* → nhánh `main`, thư mục `/ (root)` → **Save**.
Chờ khoảng một phút, trang chạy ở `https://nant37ftu.github.io/TuyenG16/`.

**Vercel** nếu muốn gắn tên miền riêng của CLB: vào [vercel.com](https://vercel.com) →
đăng nhập bằng GitHub → **Import** repo này → Deploy. Sau đó mỗi lần đẩy code lên
`main` là trang tự cập nhật.

### Sửa xong thì đẩy lên thế nào

```bash
git add -A
git commit -m "Sửa mốc thời gian G16"
git push
```

Máy khác muốn lấy về: `git clone https://github.com/nant37ftu/TuyenG16.git`

`.gitignore` đã chặn sẵn thư mục `rieng-tu/` và các file `*.local.js` — cần ghi chú
nội bộ hay để tạm thứ gì không muốn công khai thì bỏ vào đó.

---

## 9. Cần làm trước khi công bố

- [ ] Sửa `HAN_NOP_DON` và 5 mốc thời gian trong `noi-dung.js` cho đúng lịch G16
- [ ] Nối Supabase và **nộp thử một đơn**, kiểm tra thấy dữ liệu trong Table Editor
- [ ] Điền `FANPAGE`, `EMAIL`, `HOTLINE` trong `config.js`
- [ ] Thay dữ liệu bản đồ + danh bạ, hoặc tạm ẩn trang bản đồ nếu chưa kịp thống kê
- [ ] Hỏi từng người trong danh bạ xem có đồng ý hiện tên và link Facebook không
- [ ] Đặt `assets/qr.png` nếu định mang game ra bàn trực
- [ ] Đổi ảnh trong `assets/img/` nếu muốn dùng ảnh mùa mới
- [ ] Đọc lại toàn bộ chữ một lượt trên điện thoại
- [ ] Hẹn một bạn trong Ban Truyền thông tiếp quản bộ này cho mùa G17

---

## 10. Về dữ liệu cá nhân

Đơn ứng tuyển có họ tên, số điện thoại, email, mã sinh viên — là dữ liệu cá nhân theo
Nghị định 13/2023/NĐ-CP. Ba nguyên tắc:

1. File `sql/schema.sql` đã khoá sẵn: người ngoài **chỉ gửi được đơn, không đọc được đơn**.
   Đừng tự thêm quyền `select` cho `anon` ở bảng `g16_ung_vien` và `ban_do_dang_ky`.
2. Chỉ người trong BTC được cấp tài khoản Supabase. Không chuyển file CSV ứng viên ra ngoài Đội.
3. Xong mùa tuyển thì xoá dữ liệu của ứng viên không trúng, hoặc hỏi lại nếu muốn giữ cho mùa sau.

Danh bạ ở `ban-do.html` là chỗ dễ sai nhất vì nó **công khai theo thiết kế**. Đọc kỹ ba
điều ở mục 5 trước khi đưa tên ai lên đó.

---

## 11. Cấu trúc thư mục

```
web/
├── index.html          trang tuyển thành viên Gen 16
├── ban-do.html         bản đồ + danh bạ người Nghệ
├── quiz.html           trắc nghiệm hợp ban nào
├── an-gi.html          hôm nay ăn chi
├── game.html           góc game bàn trực
├── config.js           ⚙ thiết lập (BTC sửa)
├── noi-dung.js         ✍ toàn bộ chữ trang tuyển (BTC sửa)
├── app.js              xử lý form, đếm ngược, đo nguồn truy cập
├── ban-do.js           vẽ bản đồ, danh bạ, form thêm tên
├── quiz.js             câu hỏi + vẽ ảnh kết quả
├── an-gi.js            máy quay chọn món
├── game.js             hai trò chơi + bảng xếp hạng
├── styles.css          giao diện chung
├── ban-do.css, quiz.css, an-gi.css, game.css
├── data/
│   ├── nghe-an.json    ranh giới 21 huyện (không cần sửa)
│   ├── thanh-vien.json số người theo quê + danh bạ (BTC thay dữ liệu thật)
│   └── mon-an.json     danh sách món ăn (BTC thêm bớt)
├── sql/schema.sql      chạy một lần trong Supabase
└── assets/             logo, ảnh, và qr.png nếu có
```

Nguồn ranh giới hành chính: bộ dữ liệu mở dvhcvn, theo 21 huyện/thành/thị trước đợt
sắp xếp đơn vị hành chính năm 2025 — cách người Nghệ vẫn quen gọi tên quê mình.
