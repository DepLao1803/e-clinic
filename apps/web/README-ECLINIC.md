# E-Clinic — Biến thể từ Tailwind Admin (Next.js)

Dự án gốc là template quản trị Tailwind Admin (Next.js + shadcn/ui). Bản này thêm
toàn bộ module nghiệp vụ cho phòng khám trực tuyến **E-Clinic** với 3 vai trò:
Quản trị, Bác sĩ, Bệnh nhân — theo đúng mô tả nghiệp vụ bạn cung cấp, có bổ sung
thêm một số chức năng hợp lý.

> Toàn bộ dữ liệu hiện là **mock data** (`src/lib/eclinic/mock-data.ts`) để dựng
> giao diện hoạt động ngay. Khi làm backend thật, chỉ cần thay các hàm đọc/ghi
> mảng mock bằng lời gọi API/DB tương ứng — cấu trúc dữ liệu (types) đã được
> định nghĩa sẵn để dùng làm schema.

## Cấu trúc thư mục chức năng mới

```
src/app/(DashboardLayout)/eclinic/
  admin/
    specialties/       Quản lý chuyên khoa (thêm/sửa/xoá/khôi phục/thùng rác/bật-tắt)
    services/           Quản lý dịch vụ theo chuyên khoa (giá, thời lượng)
    schedule-slots/     Quản lý ca khám cố định (mỗi ca 60 phút)
    doctor-shifts/      Duyệt lịch trực do bác sĩ tự đăng ký
    doctors/            Danh sách bác sĩ, khoá/mở tài khoản
    patients/           Danh sách bệnh nhân
  doctor/
    shift-register/     Bác sĩ đăng ký lịch trực (mặc định thứ 7), chờ duyệt
    appointments/       Xác nhận lịch hẹn của bệnh nhân (đọc triệu chứng trước khi duyệt)
    queue/               Hàng đợi khám: mời khám / khám xong / xử lý không đến
    patients/            Danh sách bệnh nhân đã đặt lịch với bác sĩ
    reviews/             Xem đánh giá từ bệnh nhân
  patient/
    booking/             Đặt lịch khám: chọn khoa → bác sĩ → dịch vụ → ca khám → triệu chứng
    queue/                Xem số thứ tự & thời gian chờ ước tính
    history/              Hồ sơ đã khám
    reviews/               Đánh giá bác sĩ sau khi khám xong

src/lib/eclinic/mock-data.ts     Toàn bộ types + dữ liệu mẫu dùng chung
src/app/components/eclinic/      StatusBadge, PageHeader dùng chung
```

Đăng nhập (`/auth/login`) có 3 tab vai trò (Bệnh nhân / Bác sĩ / Quản trị); bác sĩ
và quản trị đăng nhập thêm bằng mã nhân viên / mã quản trị. Đăng ký (`/auth/register`)
chỉ tạo tài khoản bệnh nhân (SĐT, CCCD, thẻ BHYT...) đúng như mô tả — quản trị/bác sĩ
muốn đi khám thì đăng ký như bệnh nhân.

## Ý tưởng cho bài toán "hàng đợi" (mục còn thiếu ý tưởng trong mô tả gốc)

Đã hiện thực trong `eclinic/doctor/queue`:

1. **Gọi lần lượt theo số thứ tự** — bác sĩ bấm "Mời khám" cho người kế tiếp,
   chỉ 1 người ở trạng thái "Đang khám" tại một thời điểm.
2. **Không đến → tự động đẩy xuống cuối hàng** — nếu bệnh nhân được gọi mà
   không có mặt, hệ thống gán lại STT lớn nhất + 1 (chuyển xuống cuối), đồng
   thời tăng biến đếm "số lần vắng"; bác sĩ có thể mời người tiếp theo ngay,
   tránh để trống thời gian khám.
3. **Tự động huỷ sau N lần vắng** (mặc định 2 lần) — chống việc một người giữ
   chỗ nhưng liên tục không đến làm nghẽn hàng đợi.
4. **Ước tính thời gian chờ** — dựa trên thời gian khám trung bình/bệnh nhân
   (mặc định 12 phút, có thể cấu hình theo dịch vụ), hiển thị cho cả bác sĩ
   (danh sách chờ) và bệnh nhân (trang xem số thứ tự) để mọi người chủ động
   thời gian, giảm lãng phí.
5. Gợi ý mở rộng khi làm backend thật: gửi thông báo (SMS/push) trước khi tới
   lượt N phút; cho phép bệnh nhân "check-in" tại quầy để xác nhận có mặt thay
   vì chỉ dựa vào bác sĩ; thống kê thời gian khám thực tế để tinh chỉnh lại
   ước tính theo từng bác sĩ/dịch vụ.

## Các chức năng đã bổ sung thêm ngoài mô tả gốc

- **Thùng rác & khôi phục** cho chuyên khoa/dịch vụ/ca khám (đã có trong mô tả,
  đã hiện thực đủ 6 thao tác: thêm/xoá/sửa/khôi phục/thùng rác/bật-tắt).
- **Khoá/mở tài khoản bác sĩ** phía quản trị.
- **Đánh giá bác sĩ** hai chiều: bệnh nhân gửi đánh giá sau khi khám xong,
  bác sĩ xem lại đánh giá + điểm trung bình.
- **Số lần vắng mặt** hiển thị cạnh tên bệnh nhân trong hàng đợi để bác sĩ/lễ
  tân lưu ý.
- **Trang xem số thứ tự cho bệnh nhân** với trạng thái trực quan (đang chờ /
  đến lượt) và số người phía trước.

## Nâng cấp giao diện (đợt 1)

Đã bổ sung 3 trang **Tổng quan (Dashboard)** phong cách bảng điều khiển y tế
(thẻ chỉ số nổi bật, biểu đồ ApexCharts, danh sách nhanh) cho cả 3 vai trò,
lấy cảm hứng từ mẫu Doclinic:

- `eclinic/patient/dashboard` — banner chào mừng, số lịch hẹn/đã khám, biểu đồ
  lượt khám 6 tháng, lịch hẹn kế tiếp, hồ sơ khám gần đây.
- `eclinic/doctor/dashboard` — số lịch chờ xác nhận/hàng đợi/đã khám, đánh giá
  trung bình, biểu đồ bệnh nhân theo ca, trạng thái lịch trực, danh sách chờ
  xác nhận.
- `eclinic/admin/dashboard` — thẻ chỉ số toàn hệ thống (lịch hẹn, bác sĩ, bệnh
  nhân, doanh thu ước tính), biểu đồ lịch hẹn theo tuần, tỉ lệ khám theo
  chuyên khoa, lịch trực chờ duyệt, danh sách bác sĩ.

Component dùng chung mới: `src/app/components/eclinic/StatCard.tsx`. Sidebar
đã thêm mục "Tổng quan" đầu tiên trong từng nhóm vai trò, trỏ tới các trang
trên.

Đây là đợt nâng cấp đầu tiên trong nhiều đợt — các trang chức năng còn lại
(danh sách, bảng quản lý, form...) sẽ được làm đẹp/đầy đủ hơn ở các đợt sau.

## Nâng cấp giao diện (đợt 2)

- **Đặt lịch khám (patient/booking)**: chuyển sang dạng wizard 3 bước trực
  quan (chọn chuyên khoa bằng thẻ icon → chọn bác sĩ bằng thẻ avatar+đánh giá
  → chọn dịch vụ/ngày/ca) kèm sidebar tóm tắt lịch hẹn dính (sticky) bên phải.
- **Số thứ tự (patient/queue)**: vòng tròn STT lớn, dải avatar hàng đợi hiện
  vị trí của bạn, khối thông báo "đến lượt" nổi bật hơn.
- **Hàng đợi khám (doctor/queue)**: thêm 3 thẻ chỉ số nhanh phía trên, thẻ
  "đang khám" và danh sách chờ dùng avatar + badge số lần vắng rõ ràng hơn.
- **Xác nhận lịch hẹn (doctor/appointments)**: danh sách chờ xác nhận chuyển
  từ bảng sang dạng thẻ (card) dễ đọc triệu chứng hơn, có badge đếm số lịch
  mới; lịch sử xử lý giữ dạng bảng có avatar.
- **Danh sách bác sĩ (admin/doctors)**: chuyển từ bảng sang lưới thẻ bác sĩ
  (avatar, chuyên khoa, đánh giá, liên hệ, nút khoá/mở khoá).
- **Quản lý chuyên khoa (admin/specialties)**: form thêm/sửa dính (sticky),
  đếm số mục trong thùng rác ngay trên nút, icon chuyên khoa trong bảng.
- **Toàn bộ các trang còn lại**: sửa lỗi đệm (padding) bị lặp hai lớp
  (`CardBox` vốn đã có `p-6`) và thêm hiệu ứng hover cho các hàng bảng, giúp
  giao diện đồng nhất và chuyên nghiệp hơn trên toàn bộ site.

Còn lại cho các đợt sau: dịch vụ/ca khám/duyệt lịch trực (admin), bệnh nhân
của tôi + đánh giá + đăng ký lịch trực (doctor), hồ sơ đã khám + đánh giá
(patient), và trang đăng nhập/đăng ký.

## Nâng cấp giao diện (đợt 3 — hoàn tất toàn bộ)

- **Admin**: Quản lý dịch vụ, ca khám (chuyển sang dạng thẻ), duyệt lịch trực
  — đều thêm form sticky, icon, avatar bác sĩ, đếm số mục trong thùng rác.
  Danh sách bệnh nhân thêm avatar + badge giới tính/BHYT.
- **Bác sĩ**: Bệnh nhân của tôi (avatar), Đánh giá (khối tổng điểm + biểu đồ
  phân bố sao + avatar từng nhận xét), Đăng ký lịch trực (form sticky).
- **Bệnh nhân**: Hồ sơ khám bệnh chuyển sang dạng timeline dọc, Đánh giá bác
  sĩ thêm avatar bác sĩ cho từng lượt đánh giá.
- **Đăng nhập / Đăng ký**: thiết kế lại hoàn toàn theo bố cục split-screen —
  panel trái là banner gradient giới thiệu E-Clinic kèm điểm nổi bật, panel
  phải là form (giữ nguyên toàn bộ logic chọn vai trò, các trường nhập liệu).

Đến đây, toàn bộ ~18 trang của cả 3 vai trò (Bệnh nhân/Bác sĩ/Quản trị) cùng
trang đăng nhập/đăng ký đã được nâng cấp giao diện đồng bộ theo phong cách
bảng điều khiển y tế hiện đại.

## Nâng cấp đợt 4 — Upload ảnh (icon chuyên khoa, avatar, ảnh dịch vụ)

Bổ sung tính năng **tải ảnh lên** (yêu cầu bắt buộc "Upload tệp" trong
PROJECT-BRIEF): chỉ nhận JPG/PNG, tối đa 2MB, xem trước ngay khi chọn.

- **Component dùng chung mới**: `src/app/components/eclinic/ImageUpload.tsx`
  — click hoặc kéo-thả để chọn ảnh, validate định dạng/dung lượng, nút
  Đổi ảnh/Xoá. Vì dự án chưa có backend, ảnh được đọc thành base64 bằng
  `FileReader` để xem trước/lưu tạm trong state của trang (session hiện tại).
  Khi nối API thật, chỉ cần thay `onChange` để upload file lên server/object
  storage rồi lưu URL trả về, không cần đổi UI.
- **Mở rộng kiểu dữ liệu** (`src/lib/eclinic/mock-data.ts`): thêm
  `Specialty.iconUrl`, `Service.imageUrl`, `Patient.avatarUrl`
  (`Doctor.avatar` đã có sẵn từ trước nhưng chưa được dùng, nay đã nối vào
  giao diện).
- **Quản lý chuyên khoa**: form thêm/sửa có upload icon riêng cho từng
  chuyên khoa; nếu không chọn ảnh sẽ dùng icon mặc định như cũ. Icon hiển thị
  trong bảng danh sách và trong thẻ chọn chuyên khoa ở trang Đặt lịch khám.
- **Quản lý dịch vụ**: form thêm/sửa có upload ảnh minh hoạ dịch vụ, hiển thị
  thumbnail trong bảng danh sách.
- **Quản lý bác sĩ**: trước đây chỉ có nút khoá/mở khoá, **chưa có form thêm
  bác sĩ** — nay đã bổ sung dialog "Thêm bác sĩ" / "Sửa" đầy đủ (họ tên, mã
  nhân viên, chuyên khoa, SĐT, email, ảnh đại diện). Avatar thật hiển thị ở
  thẻ bác sĩ, danh sách duyệt lịch trực, trang đặt lịch, dashboard...
  thay vì chỉ chữ cái đầu tên như trước.
- **Trang "Hồ sơ cá nhân"** (mới, cho cả 3 vai trò — mô tả gốc yêu cầu nhưng
  trước đây chưa có trang riêng):
  `/eclinic/patient/profile`, `/eclinic/doctor/profile`,
  `/eclinic/admin/profile` — xem/sửa thông tin cá nhân kèm upload avatar,
  đã thêm vào sidebar mỗi vai trò.
- **Avatar bệnh nhân/bác sĩ đã upload** giờ hiển thị nhất quán ở tất cả các
  nơi có liên quan: danh sách bệnh nhân (admin/bác sĩ), duyệt lịch trực,
  hàng đợi, lịch sử khám, đánh giá, xác nhận lịch hẹn...

### Giới hạn cần lưu ý
- Vì chưa có backend/CSDL thật, ảnh tải lên chỉ tồn tại trong bộ nhớ trình
  duyệt của phiên làm việc hiện tại (base64 trong React state) — tải lại
  trang sẽ mất. Khi làm backend thật (theo `PROJECT-BRIEF-eclinic.md`), thay
  bằng upload file thật lên server (multipart/form-data) hoặc object storage,
  lưu URL vào CSDL.
- Trang "Hồ sơ cá nhân" và nút "Lưu thay đổi" hiện cũng chỉ demo phía client,
  chưa gọi API.

## Việc còn lại khi triển khai thật

- Kết nối backend/DB thật (Postgres/MySQL...), thay mock-data bằng API.
- Xác thực & phân quyền thật (JWT/session theo 3 vai trò).
- Chặn trùng lịch (1 bác sĩ – 1 ca chỉ tối đa N bệnh nhân theo cấu hình).
- Thông báo realtime (WebSocket) cho hàng đợi thay vì tải lại trang.
- Thanh toán/hoá đơn (nếu cần).
