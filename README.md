# 37FTU — Bộ trang web của CLB

Năm trang web tĩnh, không cần server, không tốn tiền hosting:

| Trang | File | Dùng để làm gì |
|---|---|---|
| Tuyển thành viên Gen 16 | `index.html` | Giới thiệu CLB, lộ trình tuyển, nhận đơn ứng tuyển |
| Người Nghệ ở Ngoại thương | `ban-do.html` | Bản đồ 21 huyện — bấm vào quê là thấy những người đi trước cùng quê |
| Trắc nghiệm hợp ban nào | `quiz.html` | Mini game lan toả, cho ra ảnh kết quả để đăng story |
| Hôm nay ăn chi? | `an-gi.html` | Máy quay chọn món, có món xứ Nghệ cho hôm nào nhớ nhà |
| Góc game bàn trực | `game.html` | Bắt lươn xứ Nghệ + Giọng Nghệ tốc độ, có bảng xếp hạng tại bàn |

Thêm một trang cho BTC: **`admin.html`** — bảng sửa trực tiếp tên, quê, chức vụ, thành
tích… của người hiện trên bản đồ, bấm **Lưu lên web** là trang đổi ngay (mục 5). Không có
trong menu, phải đăng nhập tài khoản BTC mới lưu được.

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

Sửa câu hỏi trắc nghiệm: mở `quiz.js`, phần `CAU_HOI` ở đầu file. Mỗi đáp án có
`d: [Tổ chức, Truyền thông, Đối ngoại]` là điểm cộng cho từng ban.

### Góp ý thẳng vào từng khối — thêm `?gopy=1`

Không muốn tự sửa, chỉ muốn chỉ chỗ cho người sửa: thêm `?gopy=1` vào cuối địa chỉ trang
bất kỳ, ví dụ `ban-do.html?gopy=1`. Rê chuột thấy từng khối nội dung viền nét đứt; bấm
vào khối nào là mở ô ghi chú ngay dưới khối đó (`Ctrl+Enter` lưu, `Esc` đóng). Sang trang
khác vẫn ở chế độ góp ý cho tới khi bấm **Tắt**.

Ghi chú gom về bảng nhỏ ở góc màn hình và tab *Góp ý đã ghi* trong `admin.html`. Bấm
**Chép tất cả** rồi dán vào khung chat — mỗi dòng có sẵn tên trang và tên khối, người
sửa biết đúng chỗ. Ghi chú chỉ nằm trong trình duyệt của người ghi, không gửi đi đâu.

---

## 3. Nối Supabase để nhận đơn (15 phút)

Chưa nối thì trang vẫn chạy ở **chế độ thử**: đơn chỉ lưu tạm trong trình duyệt của
người nộp, BTC không nhận được gì. Bắt buộc phải làm bước này trước khi công bố.

1. Vào [supabase.com](https://supabase.com) → đăng ký miễn phí → **New project**.
   Chọn region Singapore cho nhanh. Nhớ lưu mật khẩu database.
2. Vào **SQL Editor** → **New query** → dán toàn bộ nội dung `sql/schema.sql` → **Run**.
   Chạy lại bao nhiêu lần cũng được, dữ liệu cũ không mất. Bảng kết quả hiện ra cuối
   cùng là phần tự kiểm tra: cả 5 dòng phải có `da_bat_rls = true`.
3. Vào **Project Settings → API Keys**, copy:
   - `Project URL` → dán vào `SUPABASE_URL`
   - `Publishable key` (`sb_publishable_…`) → dán vào `SUPABASE_ANON_KEY`
4. Mở lại trang, dòng cảnh báo "Chế độ thử" biến mất là xong. Nộp thử một đơn để kiểm tra.
5. Tạo tài khoản cho người trong BTC để sửa bản đồ — mục 5, phần *Sửa bằng bảng*.

> **Dự án của CLB đã có sẵn** — `SUPABASE_URL` và khoá publishable trong `config.js`
> đã điền: `https://qiwfknocgwcptjmjdpmc.supabase.co`.
>
> Khoá publishable sinh ra để lộ trong code chạy ở máy người dùng, **nhưng nó chỉ an
> toàn khi `sql/schema.sql` đã chạy**. Repo này công khai, key đã nằm trên mạng — nên
> nếu chưa chạy schema thì chạy ngay.
>
> **Ai đã chạy bản `schema.sql` trước ngày 18/09/2026 thì chạy lại bản mới.** Bản cũ có
> hai lỗ hổng:
> 1. Quyền đọc đơn cấp cho *mọi tài khoản đã đăng nhập*. Mà Supabase mặc định cho bất kỳ
>    ai tự đăng ký tài khoản bằng khoá publishable trên trang — tức là người lạ tự tạo
>    tài khoản là đọc được số điện thoại, email của toàn bộ ứng viên. Bản mới chỉ cho
>    tài khoản có tên trong bảng `btc_quan_tri`.
> 2. Ba bảng xem nhanh (`g16_theo_kenh`, `g16_theo_que`, `ban_do_cho_duyet`) chạy bằng
>    quyền chủ sở hữu nên lách qua RLS — ai có khoá cũng đọc được danh sách người xin
>    thêm tên đang chờ duyệt. Bản mới bắt chúng chạy bằng quyền người xem.
>
> Nếu nghi đã có người lạ vào đọc: Supabase → **Authentication → Users** xem có tài khoản
> nào lạ không, xoá đi; rồi **Settings → API Keys** tạo khoá publishable mới, thay vào
> `config.js`.

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

## 5. Người Nghệ ở Ngoại thương — bản đồ theo quê

Trang này không phải danh bạ tra cứu. Nó trả lời câu người Nghệ gặp nhau bao giờ cũng
hỏi trước — *quê mô* — rồi đưa ra những người đi trước cùng quê, để một em tân sinh
viên biết mình có chỗ bấu víu, và để những người đã dựng nên CLB không bị quên.

Hai phần:

- **Bản đồ** — 21 huyện/thành/thị tô màu theo số người. Rê chuột chỉ làm vùng sáng lên,
  không bật hộp gì. **Bấm vào một huyện** thì khung bên phải hiện tổng số người, chia
  theo thế hệ, rồi thẻ từng người được nêu tên — 6 người đầu, bấm *Xem thêm* ra hết.
  Ai có thành tích, lời nhắn hay link Facebook thì thẻ dài thêm để hiện mấy thứ đó.
- **Thêm tên em** — người ngoài tự xin vào, BTC duyệt rồi mới hiện.

Thứ tự người trong một huyện: **Sáng lập → Ban Lãnh đạo → Ban Chấp hành → Thành viên**.
Cùng nhóm thì chức cao hơn đứng trước, rồi người nhiều thành tích hơn, rồi người gắn bó
nhiều nhiệm kỳ hơn, rồi người gần đây hơn. Đổi *Cấp bậc* của ai trong `admin.html` là
đổi chỗ đứng của người đó.

### Dữ liệu lấy từ Google Sheet

Nguồn là sheet **“37FTU | DANH SÁCH THÀNH VIÊN CÁC THẾ HỆ”** — giữ nguyên chỗ BTC vẫn
làm, không phải nhập lại. Một script đọc sheet rồi sinh ra `data/thanh-vien.json`.

```bash
python tools/tu-sheet.py
```

Quy trình đầy đủ:

1. **Gán quê cho từng người.** Sheet hiện tại **không có cột quê**, nên bản đồ đang
   trống. Hai cách, chọn cách nào cũng được:
   - thêm cột `QUÊ` vào sheet, ghi tên huyện cũ: `Yên Thành`, `Diễn Châu`, `TP Vinh`…
   - hoặc gán thẳng trong `admin.html` (xem bên dưới) — có nút gán cả loạt theo bộ lọc.
2. Mỗi tab (một nhiệm kỳ) bấm **File → Download → CSV**, cất vào `rieng-tu/nhiem-ky/`,
   đặt tên theo nhiệm kỳ: `2025-2026.csv`.
3. Chạy `python tools/tu-sheet.py`. Script lấy **bản đang chạy trên web** (chỗ BTC đã
   sửa ở `admin.html`) làm gốc rồi trộn số liệu mới từ sheet vào — không mất chỗ đã sửa.
   Không có mạng thì nó lấy `data/thanh-vien.json`.
4. Mở `admin.html` → **Khác → Nạp file .json** → chọn `data/thanh-vien.json` vừa sinh ra →
   xem lại → **Lưu lên web**.

Chưa kịp sửa sheet thì điền tạm vào **`rieng-tu/que.csv`** — script tự sinh sẵn file này,
mỗi người một dòng, chỉ phải điền một lần thay vì lặp ở từng nhiệm kỳ. Muốn xem thử
giao diện trước khi có số liệu thật thì đổi tên `rieng-tu/que-VI-DU-de-xem-thu.csv`
thành `que.csv` rồi chạy script — **nhớ xoá đi trước khi công bố, quê trong đó là bịa**.

Script cũng tự soát và báo lại:
- giá trị quê nào nó không hiểu (gõ sai tên huyện),
- tên nào xuất hiện ở nhiều gen — có thể là hai người trùng tên, cũng có thể sheet ghi
  cột GEN không thống nhất (hiện có 18 trường hợp như vậy, đáng soát lại).

Thư mục `rieng-tu/` đã bị `.gitignore` chặn, CSV gốc có số điện thoại và mã sinh viên
nên **không bao giờ lên GitHub**.

### Ai được nêu tên

`data/thanh-vien.json` nằm trong repo công khai. Nên script chỉ chép sang đó:

- **tên, thế hệ, quê, chức vụ, ban, hành trình nhiệm kỳ** — của người từng giữ chức
  từ **Phó ban trở lên** (hiện là 110 người trong tổng 429);
- thành viên thường **chỉ được đếm vào con số tổng**, không nêu tên.

Muốn nêu tên thêm ai thì ghi tên họ vào `rieng-tu/cho-phep-neu-ten.txt`, mỗi dòng một
tên — tức là người đó đã đồng ý.

Script **không bao giờ** chép số điện thoại, email, ngày sinh, mã sinh viên hay lớp.
Muốn sửa gì thì sửa qua `admin.html`.

### Sửa bằng bảng — `admin.html`

Mở `admin.html` — trên mạng là `https://nant37ftu.github.io/TuyenG16/admin.html`. Trang
không có trong menu và đã chặn Google lập chỉ mục.

- **Người** — mỗi người một dòng, bấm thẳng vào ô để sửa: họ tên, gen, quê, chức vụ, cấp
  bậc, ban, nhiệm kỳ, thành tích (nhiều cái thì ngăn bằng dấu `;`), lời nhắn, link
  Facebook (chỉ nhận link `http…` — dán số điện thoại vào là bị bỏ). Lọc theo quê, cấp
  bậc, ban; lọc xong có ô **Gán quê cho tất cả** người đang hiện. Cuối bảng có
  **+ Thêm một người**; nút **×** ở cuối dòng để gỡ tên.
- **Số người theo huyện** — con số bản đồ sẽ hiện. Cột *Ghi đè* dùng khi CLB biết tổng
  thật lớn hơn số trong sheet.
- **Lịch sử lưu** — mỗi lần lưu là một bản, giữ 100 bản gần nhất. Lỡ tay thì mở bản cũ
  ra, bấm **Lưu lên web** là trang quay về bản đó.
- **Góp ý đã ghi** — ghi chú từ chế độ `?gopy=1` (mục 2).

Sửa xong bấm **Lưu lên web** (hoặc `Ctrl+S`) là `ban-do.html` đổi ngay, không cần đụng
GitHub. Chưa lưu thì thay đổi vẫn giữ tạm trong trình duyệt đó, đóng tab không mất;
**Hoàn tác** lùi được 30 bước. Hai người cùng sửa một lúc thì người lưu sau được hỏi lại
chứ không đè mất bản của người kia. Menu **Khác** có *Nạp file .json* (file script vừa
sinh), *Tải bản sao .json* (cất giữ, hoặc chép vào `data/` làm bản dự phòng).

Dữ liệu nằm ở bảng `trang_du_lieu` trên Supabase. Trang bản đồ đọc ở đó trước; Supabase
lỗi hay chậm quá 6 giây thì lấy `data/thanh-vien.json` đi kèm trang — không bao giờ trắng.

**Ai được lưu.** Ai mở `admin.html` cũng xem được bảng (dữ liệu vốn công khai trên bản
đồ). Muốn lưu phải đăng nhập bằng tài khoản có tên trong bảng `btc_quan_tri` — chốt chặn
nằm ở Supabase chứ không ở trang, nên sửa code trang cũng không lách được. Cấp tài khoản
cho một người (người giữ tài khoản Supabase của CLB làm):

1. Supabase → **Authentication → Users → Add user → Create new user**: email + mật khẩu,
   tick **Auto Confirm User**.
2. **SQL Editor**, thay email và tên rồi chạy:

   ```sql
   insert into public.btc_quan_tri (user_id, email, ten)
   select id, email, 'Trí' from auth.users where email = 'email-cua-ban@gmail.com'
   on conflict (user_id) do update set ten = excluded.ten;
   ```

3. Một lần duy nhất: **Authentication → Sign In / Providers** → tắt
   **Allow new users to sign up**, để người lạ không tự tạo tài khoản được.

Gỡ quyền: `delete from public.btc_quan_tri where email = '...';`. Quên mật khẩu: vào
**Authentication → Users**, chọn người đó, đặt lại mật khẩu.

**Sửa ở bảng và chạy lại script không giẫm lên nhau.** `tools/tu-sheet.py` đọc bản đang
chạy trên web trước khi ghi:

| Đã sửa ở `admin.html` | Chạy lại script thì |
|---|---|
| Ô đã sửa tay (ghi trong `sua_tay` của người đó) | giữ bản sửa tay |
| Thành tích, lời nhắn, link | luôn giữ — sheet không có mấy ô này |
| Quê | sheet có thì lấy sheet (trừ ô đã sửa tay), sheet trống thì giữ quê cũ |
| Người bị gỡ tên (nút ×) | không nêu tên lại, vẫn được đếm vào tổng của huyện |
| Người thêm tay (mã `tay-…`) | giữ nguyên |
| Ghi đè tổng theo huyện | giữ nguyên |

Người bị gỡ tên chỉ để lại một mã băm trong `an_ma` để script nhận ra. Mã băm làm từ
tên + gen nên không giấu được với ai đã biết sẵn tên — và tên cũ vẫn nằm trong **lịch sử
commit** của GitHub. Ai đòi xoá hẳn thì phải viết lại lịch sử repo (`git filter-repo`),
nhờ người rành git làm.

### Duyệt người tự thêm tên

Người lạ gửi form ở cuối trang → vào bảng `ban_do_dang_ky`, **chưa hiện lên trang**.
BTC mở `ban_do_cho_duyet` trong SQL Editor, đọc, thấy ổn thì thêm người đó trong
`admin.html` (**+ Thêm một người**), lưu, rồi đánh dấu đã duyệt:
`update public.ban_do_dang_ky set da_duyet = true where id = 123;`

> **Ba điều không được quên.** Đây là trang công khai, ai vào cũng đọc được.
> 1. Chỉ đưa lên tên của người **đã đồng ý**.
> 2. Tuyệt đối không đặt số điện thoại, email hay mã sinh viên vào bảng người ở
>    `admin.html`. Ô liên hệ chỉ nhận link Facebook do chính người đó đưa.
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
- [ ] **Chạy lại `sql/schema.sql` bản mới** — vá hai lỗ hổng của bản cũ (mục 3)
- [ ] Tạo tài khoản BTC, thêm vào `btc_quan_tri`, tắt tự đăng ký (mục 5)
- [ ] **Nộp thử một đơn** trên trang thật, kiểm tra thấy trong Table Editor rồi xoá đơn thử
- [ ] Điền `FANPAGE`, `EMAIL`, `HOTLINE` trong `config.js`
- [ ] **Gán quê cho từng người** — thêm cột QUÊ vào sheet rồi chạy
      `python tools/tu-sheet.py`, hoặc gán trong `admin.html`. Chưa làm thì bản đồ trống (mục 5)
- [ ] Xoá `rieng-tu/que-VI-DU-de-xem-thu.csv` nếu đã dùng nó để xem thử
- [ ] Soát 18 tên bị trùng ở nhiều gen mà script báo ra
- [ ] Hỏi từng người được nêu tên trên bản đồ xem có đồng ý hiện tên, thành tích, link Facebook không
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
2. Chỉ tài khoản có tên trong bảng `btc_quan_tri` mới đọc được đơn — đăng nhập được
   thôi là chưa đủ. Ai rời BTC thì xoá khỏi bảng đó. Không chuyển file CSV ứng viên ra ngoài Đội.
3. Xong mùa tuyển thì xoá dữ liệu của ứng viên không trúng, hoặc hỏi lại nếu muốn giữ cho mùa sau.

Tên người trên `ban-do.html` là chỗ dễ sai nhất vì nó **công khai theo thiết kế**. Đọc kỹ
ba điều ở mục 5 trước khi đưa tên ai lên đó.

---

## 11. Hiệu ứng trang

`hieu-ung.js` lo phần chuyển động cho `index.html` và `ban-do.html`: chữ và thẻ hiện dần
khi cuộn tới, mấy con số ở dải thống kê đếm từ 0 lên, thanh trên cùng đổ bóng khi rời
đỉnh trang, thẻ nhấc nhẹ khi rê chuột.

Ba điều đã tính sẵn, đừng phá:

- **Máy nào bật “giảm chuyển động”** trong cài đặt hệ điều hành thì không chạy hiệu ứng
  nào cả. Đây không phải chuyện làm cho đẹp — có người xem chuyển động là chóng mặt, buồn nôn.
- **Nội dung không bao giờ ẩn vĩnh viễn.** CSS không giấu sẵn thứ gì; chỉ JS giấu, và
  giấu thì phải có đường mở. Sau 2 giây mà chưa có gì hiện ra, `dungChotChan()` bỏ hết
  hiệu ứng, trả trang về trạng thái đọc được. Sửa file này thì giữ nguyên cái chốt đó.
- Chỉ dùng `transform` và `opacity`, không đụng vào chiều cao hay lề, nên trình duyệt
  không phải tính lại bố cục — điện thoại yếu vẫn mượt.

Không thích hiệu ứng thì xoá hai dòng `<script src="hieu-ung.js"></script>` là xong,
trang chạy y nguyên.

---

## 12. Cấu trúc thư mục

```
web/
├── index.html          trang tuyển thành viên Gen 16
├── ban-do.html         bản đồ người Nghệ theo quê
├── admin.html          bảng sửa dữ liệu bản đồ, lưu thẳng lên web (BTC, mục 5)
├── quiz.html           trắc nghiệm hợp ban nào
├── an-gi.html          hôm nay ăn chi
├── game.html           góc game bàn trực
├── config.js           ⚙ thiết lập (BTC sửa)
├── noi-dung.js         ✍ toàn bộ chữ trang tuyển (BTC sửa)
├── app.js              xử lý form, đếm ngược, đo nguồn truy cập
├── ban-do.js           vẽ bản đồ, thẻ người trong huyện, form thêm tên
├── admin.js            bảng sửa, đăng nhập, lưu lên Supabase, lịch sử
├── gop-y.js            chế độ góp ý ?gopy=1 (mục 2)
├── quiz.js             câu hỏi + vẽ ảnh kết quả
├── an-gi.js            máy quay chọn món
├── game.js             hai trò chơi + bảng xếp hạng
├── hieu-ung.js         hiện dần khi cuộn, số đếm lên (xem mục 11)
├── styles.css          giao diện chung
├── ban-do.css, admin.css, quiz.css, an-gi.css, game.css
├── tools/tu-sheet.py   đổi Google Sheet -> data/thanh-vien.json (mục 5)
├── data/
│   ├── nghe-an.json    ranh giới 21 huyện (không cần sửa)
│   ├── thanh-vien.json bản dự phòng khi Supabase lỗi; đầu ra của tools/tu-sheet.py
│   └── mon-an.json     danh sách món ăn (BTC thêm bớt)
├── rieng-tu/           CSV gốc từ sheet — .gitignore chặn, KHÔNG lên GitHub
├── sql/schema.sql      chạy trong Supabase (chạy lại được, không mất dữ liệu)
└── assets/             logo, ảnh, và qr.png nếu có
```

Nguồn ranh giới hành chính: bộ dữ liệu mở dvhcvn, theo 21 huyện/thành/thị trước đợt
sắp xếp đơn vị hành chính năm 2025 — cách người Nghệ vẫn quen gọi tên quê mình.
