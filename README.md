# thu-vien-so — Hệ thống quản lý thư viện

Hệ thống quản lý thư viện khoa có **mượn trả, tính phí phạt và nhắc hạn tự động**. Thủ thư lập phiếu mượn/trả trên máy, độc giả tự tra cứu sách còn hay hết, worker gửi email nhắc hạn mỗi sáng.

> Tài liệu phạm vi chi tiết: [`PROJECT-BRIEF.md`](./PROJECT-BRIEF.md)

## Công nghệ

| Thành phần | Lựa chọn |
|---|---|
| Backend | NestJS (Node.js 22) — `apps/api` |
| Frontend | React + Vite — `apps/web` |
| CSDL | PostgreSQL 16 |
| Cache / hàng đợi | Redis 7 |
| Email | SMTP — Mailpit khi phát triển |
| Quản lý gói | **npm workspaces** |

PostgreSQL, Redis và Mailpit chạy bằng Docker; API, worker và web chạy trực tiếp trên máy để hot-reload nhanh.

```
thu-vien-so/
├── apps/
│   ├── api/        NestJS: REST API + worker (cron 7:00, xuất CSV)  → http://localhost:4000/api
│   └── web/        React + Vite                                      → http://localhost:5173
├── uploads/        Ảnh bìa, ảnh đại diện (dev; không commit)
├── docker-compose.yml   postgres:16 (:5433) · redis:7 (:6379) · mailpit (:8025)
├── package.json         npm workspaces
├── PROJECT-BRIEF.md
└── .env.example         MỘT file env cho toàn bộ dự án
```

## Yêu cầu

- Node.js **22+** và npm 10+
- Docker + Docker Compose

## Chạy lần đầu

```bash
cp .env.example .env        # đổi JWT_SECRET thành chuỗi ngẫu nhiên dài
npm install                 # cài gói cho cả api và web
npm run infra:up            # PostgreSQL + Redis + Mailpit
npm run db:migrate          # tạo bảng từ schema
npm run db:seed             # vai trò, thể loại, tài khoản quản trị, dữ liệu mẫu
npm run dev                 # chạy api + worker + web cùng lúc
```

Đăng nhập thử (lấy từ `.env`):

| Vai trò | Email | Mật khẩu |
|---|---|---|
| Quản trị | `admin@thuvien.local` | `Admin@12345` |

Tài khoản thủ thư do quản trị tạo trong hệ thống. Độc giả tự đăng ký tại trang đăng ký.

Email gửi ra trong môi trường dev **không đi ra ngoài**; xem tại Mailpit: http://localhost:8025

## Lệnh thường dùng

| Lệnh | Tác dụng |
|---|---|
| `npm run dev` | Chạy api + worker + web |
| `npm run dev:api` / `dev:worker` / `dev:web` | Chạy riêng từng phần |
| `npm run build` | Build toàn bộ |
| `npm run lint` | Kiểm tra mã nguồn |
| `npm run test` | Chạy test |
| `npm run db:migrate` | Tạo và áp dụng migration sau khi sửa schema |
| `npm run db:seed` | Nạp dữ liệu mẫu |
| `npm run db:reset` | Xoá CSDL → migrate → seed |
| `npm run infra:up` / `infra:down` | Bật / tắt PostgreSQL, Redis, Mailpit |
| `npm run infra:reset` | Xoá volume và khởi động lại từ đầu |

Chạy lệnh trong một workspace cụ thể: `npm run <script> -w apps/api`.

## Biến môi trường chính

Xem đầy đủ trong `.env.example`.

| Biến | Ý nghĩa |
|---|---|
| `DATABASE_URL` | Chuỗi kết nối PostgreSQL (host port `5433`) |
| `REDIS_URL` | Chuỗi kết nối Redis |
| `JWT_SECRET`, `JWT_EXPIRES_IN` | Ký và hạn token đăng nhập |
| `MAIL_HOST`, `MAIL_PORT`, `MAIL_FROM` | SMTP (dev: Mailpit `localhost:1025`) |
| `UPLOAD_DIR` | Thư mục lưu ảnh tải lên |
| `LOAN_DAYS`, `MAX_BOOKS_PER_LOAN`, `FINE_PER_DAY` | Hạn mượn (14), số cuốn tối đa (3), phạt/ngày/cuốn (2000) |
| `REMINDER_CRON` | Giờ chạy worker (mặc định `0 7 * * *`, múi giờ `Asia/Ho_Chi_Minh`) |
| `VITE_API_URL` | Địa chỉ API cho frontend |
| `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD` | Tài khoản quản trị tạo khi seed |

> `LOAN_DAYS`, `MAX_BOOKS_PER_LOAN` và `FINE_PER_DAY` là giá trị mặc định; quản trị có thể cấu hình lại trong hệ thống.

## Vai trò và quyền

| Vai trò | Quyền chính |
|---|---|
| Độc giả | Tìm sách, xem số bản còn, xem lịch sử mượn và phí phạt **của chính mình**, nhận email nhắc hạn |
| Thủ thư | Quản lý đầu sách và bản sao, lập phiếu mượn/trả, ghi nhận thu phí phạt, tải ảnh bìa. **Không** xoá được đầu sách đã có phiếu mượn |
| Quản trị | Tạo tài khoản thủ thư, xem thống kê tháng, xuất báo cáo CSV, cấu hình hạn mượn và mức phạt |

## Quy tắc nghiệp vụ

- Một phiếu mượn tối đa **3 cuốn**, hạn **14 ngày**.
- Phí phạt quá hạn **2.000đ/ngày/cuốn**; thủ thư ghi nhận đã thu tiền mặt.
- Mỗi đầu sách có nhiều **bản sao**, mỗi bản sao có mã riêng và trạng thái; thủ thư nhập mã bằng tay.
- Ảnh bìa: tối đa **2MB**, chỉ nhận **JPG/PNG**.

## Tác vụ nền

Worker chạy **7:00 mỗi sáng**:

1. Gửi email nhắc cho phiếu sắp đến hạn (còn 2 ngày).
2. Gửi email quá hạn mỗi ngày cho tới khi độc giả trả sách.

Khi quản trị bấm **"Xuất báo cáo tháng"**, worker sinh tệp CSV rồi gửi email báo khi xong.

## Redis dùng để làm gì

- Đếm số bản còn có thể mượn của từng đầu sách, cập nhật khi mượn/trả để trang tìm kiếm không phải đếm lại trong CSDL.
- Cache danh mục thể loại, làm mới khi thủ thư sửa.
- Hàng đợi cho worker (nhắc hạn, xuất CSV).

## Tính năng MVP

1. Đăng ký độc giả, đăng nhập, phân quyền ba vai trò
2. Thủ thư thêm/sửa đầu sách, thêm bản sao, tải ảnh bìa
3. Độc giả tìm sách theo tên/tác giả/thể loại, thấy số bản còn
4. Thủ thư lập phiếu mượn và ghi nhận trả
5. Worker gửi email nhắc trước hạn 2 ngày và email quá hạn hằng ngày
6. Tự tính phí phạt; thủ thư ghi nhận đã thu tiền mặt
7. Độc giả xem lịch sử mượn và phí phạt còn nợ
8. Quản trị xem thống kê tháng và xuất CSV

## Ngoài phạm vi

Đặt trước/giữ chỗ online · thanh toán online · gia hạn online · quét mã vạch bằng camera · nhắc qua SMS/Zalo · đa chi nhánh · tra cứu ISBN tự động · tạp chí/luận văn/tài liệu số · ứng dụng mobile.

## Xử lý sự cố

- **Cổng bị chiếm**: đổi `POSTGRES_HOST_PORT` (mặc định 5433) hoặc `REDIS_HOST_PORT` trong `.env`, rồi `npm run infra:up` lại.
- **Không kết nối được CSDL**: kiểm tra `docker compose ps`; container `db` phải ở trạng thái healthy.
- **Muốn làm sạch dữ liệu**: `npm run infra:reset` rồi `npm run db:migrate && npm run db:seed`.

## Thành viên

| Họ tên | MSSV | Vai trò sprint 1 |
|---|---|---|
| Nguyễn Văn A | 21520001 | Ops owner |
| Trần Thị B | 21520002 | Dev owner |
