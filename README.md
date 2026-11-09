# e-clinic — Hệ thống đặt lịch khám và quản lý hàng đợi phòng khám

Hệ thống quản lý phòng khám đa khoa có **đặt lịch khám theo ca, điều phối hàng đợi theo số thứ tự và nhắc lịch tự động**. Bệnh nhân tự đặt lịch và xem số thứ tự đang chờ trên web, bác sĩ duyệt lịch hẹn và gọi khám tại phòng, worker gửi email nhắc lịch hẹn mỗi sáng.

> Tài liệu phạm vi chi tiết: [`PROJECT-BRIEF.md`](./PROJECT-BRIEF.md) · Chỉ số DORA: [`docs/dora.md`](./docs/dora.md)

## Trạng thái

Buổi 1 — Khởi động dự án (Nấc 1: Máy local, chạy bằng tay).

## Công nghệ

| Thành phần | Lựa chọn |
|---|---|
| Backend | NestJS 11 + Prisma 6 (Node.js 22) — `apps/api` |
| Frontend | Next.js 16 (React 19 + Tailwind CSS 4) — `apps/web` |
| CSDL | MySQL 8.4 |
| Cache / hàng đợi | Redis 7 |
| Email | SMTP — Mailpit khi phát triển |
| Quản lý gói | **npm workspaces** |

MySQL, Redis, Adminer và Mailpit chạy bằng Docker; API, worker và web chạy trực tiếp trên máy để hot-reload nhanh.

```
e-clinic/
├── apps/
│   ├── api/        NestJS: REST API + worker (cron 7:00, xuất CSV)  → http://localhost:4000/api (Swagger: /api/docs)
│   └── web/        Next.js + Tailwind CSS                           → http://localhost:3000
├── docs/
│   ├── dora.md          Bảng theo dõi 4 chỉ số DORA (Buổi 1, 14, 21)
│   └── MIGRATION.md     Ghi chú kiến trúc và bản đồ route API
├── specs/               Đặc tả kỹ thuật qua các buổi
├── docker-compose.yml   mysql:8.4 (:3307) · redis:7 (:6379) · adminer (:8080) · mailpit (:8025)
├── package.json         npm workspaces
├── PROJECT-BRIEF.md     Tài liệu chốt phạm vi dự án
├── LICENSE              Giấy phép MIT
└── .env.example         MỘT file env cho toàn bộ dự án
```

## Yêu cầu

- Node.js **22+** và npm 10+
- Docker + Docker Compose v2 (`docker compose`)

## Chạy lần đầu

```bash
cp .env.example .env        # đổi JWT_SECRET và ENCRYPTION_KEY thành chuỗi ngẫu nhiên dài
npm install                 # cài gói cho cả api và web (tự chạy prisma generate)
npm run infra:up            # MySQL + Redis + Adminer + Mailpit
npm run db:migrate          # tạo bảng từ schema Prisma
npm run db:seed             # vai trò, 8 ca khám, chuyên khoa, danh bạ y tế quốc gia, tài khoản admin
npm run dev                 # chạy api + web cùng lúc
```

Đăng nhập thử (lấy từ `.env` và dữ liệu seed):

| Vai trò | Tài khoản / Mã đối chiếu | Mật khẩu |
|---|---|---|
| Quản trị | `admin@eclinic.local` | `Admin@12345` |
| Bác sĩ | Đăng ký với mã nhân viên `NV-1` / `CCHN-1` (CCCD `000000000001`) | Do bác sĩ đặt khi đăng ký |
| Bệnh nhân | Tự đăng ký tại `/auth/register` | Do bệnh nhân đặt khi đăng ký |

Email gửi ra trong môi trường dev **không đi ra ngoài**; xem tại Mailpit: http://localhost:8025  
Quản lý CSDL trực quan qua Adminer: http://localhost:8080 (Server: `db`, User: `root`, Password: `root`, DB: `e_clinic_db`)

## Lệnh thường dùng

| Lệnh | Tác dụng |
|---|---|
| `npm run dev` | Chạy api + web cùng lúc |
| `npm run dev:api` / `npm run dev:web` | Chạy riêng từng phần |
| `npm run build` | Build toàn bộ |
| `npm run lint` | Kiểm tra mã nguồn TypeScript (`tsc --noEmit`) |
| `npm run test` | Chạy test |
| `npm run db:migrate` | Tạo và áp dụng migration sau khi sửa `schema.prisma` |
| `npm run db:seed` | Nạp dữ liệu mẫu |
| `npm run db:studio` | Mở Prisma Studio |
| `npm run db:reset` | Xoá CSDL → migrate → seed |
| `npm run infra:up` / `npm run infra:down` | Bật / tắt MySQL, Redis, Adminer, Mailpit |
| `npm run infra:reset` | Xoá volume và khởi động lại từ đầu |

Chạy lệnh trong một workspace cụ thể: `npm run <script> -w @eclinic/api`.

## Biến môi trường chính

Xem đầy đủ trong [`.env.example`](./.env.example).

| Biến | Ý nghĩa |
|---|---|
| `DATABASE_URL` | Chuỗi kết nối MySQL (host port `3307` để tránh đụng cổng `3306` trên máy) |
| `REDIS_URL` | Chuỗi kết nối Redis (`redis://localhost:6379`) |
| `JWT_SECRET`, `JWT_EXPIRES_IN` | Ký và hạn token đăng nhập |
| `ENCRYPTION_KEY` | Khoá mã hoá AES-GCM cho 2FA TOTP |
| `MAIL_HOST`, `MAIL_PORT`, `MAIL_FROM` | SMTP (dev: Mailpit `localhost:1025`) |
| `UPLOAD_DIR` | Thư mục lưu ảnh tải lên (mặc định `./uploads`) |
| `REMINDER_CRON` | Giờ chạy worker nhắc lịch (mặc định `0 7 * * *`, múi giờ `Asia/Ho_Chi_Minh`) |
| `NEXT_PUBLIC_API_URL` | Địa chỉ API cho frontend (`http://localhost:4000/api`) |
| `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD` | Tài khoản quản trị tạo khi seed |

## Vai trò và quyền

| Vai trò | Quyền chính |
|---|---|
| Bệnh nhân | Tìm chuyên khoa/bác sĩ/dịch vụ, đặt lịch khám, xem số thứ tự đang chờ và bệnh án **của chính mình**, nhận email nhắc lịch, đánh giá bác sĩ |
| Bác sĩ | Đăng ký lịch trực, xác nhận/từ chối lịch hẹn, gọi bệnh nhân tiếp theo trong hàng đợi, ghi nhận vắng mặt, lập bệnh án và đơn thuốc |
| Quản trị | Quản lý chuyên khoa, dịch vụ, ca khám và hồ sơ bác sĩ; duyệt lịch trực; xem thống kê tháng và xuất báo cáo CSV |

## Quy tắc nghiệp vụ

- Bác sĩ chỉ nhận lịch hẹn vào những ca trực đã được quản trị phê duyệt (`approved`).
- Số thứ tự hàng đợi (`queue_number`) được cấp riêng theo từng bác sĩ trong từng ngày bằng giao dịch có khoá (`SELECT ... FOR UPDATE`).
- Khi gọi khám mà bệnh nhân vắng mặt lần 1 (`absent_count = 1`), hệ thống đẩy xuống cuối hàng đợi; vắng mặt lần 2 (`absent_count >= 2`) thì tự động huỷ lịch hẹn.
- Ảnh tải lên (ảnh đại diện, icon chuyên khoa, ảnh dịch vụ): tối đa **2MB**, chỉ nhận **JPG/PNG**.

## Tác vụ nền

Worker chạy **7:00 mỗi sáng**:

1. Gửi email nhắc lịch cho bệnh nhân có lịch khám vào ngày hôm sau.
2. Tự động huỷ các lịch hẹn đã qua ngày nhưng chưa được xác nhận.

Khi quản trị bấm **"Xuất báo cáo tháng"**, worker sinh tệp CSV rồi gửi email báo khi xong.

## Redis dùng để làm gì

- Đếm số bệnh nhân đang chờ trong hàng đợi của từng bác sĩ trong ngày, cập nhật khi đặt lịch/mời khám/hoàn tất để trang xem số thứ tự không phải đếm lại trong CSDL mỗi lần.
- Cache danh mục chuyên khoa và dịch vụ khám, làm mới khi quản trị sửa.
- Hàng đợi cho worker (nhắc lịch hẹn, xuất CSV).

## Tính năng MVP

1. Đăng ký bệnh nhân, đăng ký bác sĩ (đối chiếu mã nhân viên & chứng chỉ hành nghề), đăng nhập và phân quyền ba vai trò
2. Quản trị thêm/sửa/ẩn chuyên khoa, dịch vụ khám, ca khám cố định và tải ảnh icon/dịch vụ
3. Bác sĩ đăng ký lịch trực theo ca; quản trị phê duyệt lịch trực và gán phòng khám
4. Bệnh nhân đặt lịch khám theo chuyên khoa – bác sĩ – dịch vụ – ca trực đã duyệt và nhận số thứ tự
5. Bác sĩ xác nhận lịch hẹn, gọi khám theo hàng đợi (vắng lần 1 đẩy xuống cuối hàng, vắng lần 2 tự huỷ lịch) và ghi bệnh án
6. Worker gửi email nhắc lịch khám trước 1 ngày vào 7:00 sáng hằng ngày
7. Bệnh nhân theo dõi số thứ tự trực tuyến, xem lịch sử bệnh án và đánh giá bác sĩ sau khi khám
8. Quản trị xem thống kê tháng và xuất báo cáo CSV

## Ngoài phạm vi

Thanh toán trực tuyến · khám bệnh qua video call (telemedicine) · đầu đọc thẻ BHYT phần cứng · quản lý kho thuốc/nhà thuốc · nhắc lịch qua SMS/Zalo · đa chi nhánh · ứng dụng mobile.

## Xử lý sự cố

- **Cổng bị chiếm**: đổi `MYSQL_HOST_PORT` (mặc định 3307) hoặc `REDIS_HOST_PORT` trong `.env`, rồi `npm run infra:up` lại.
- **Không kết nối được CSDL**: kiểm tra `docker compose ps`; container `eclinic-mysql` phải ở trạng thái `healthy`.
- **Muốn làm sạch dữ liệu**: `npm run infra:reset` rồi `npm run db:migrate && npm run db:seed`.

## Thành viên

| Họ tên | MSSV | Vai trò sprint 1 |
|---|---|---|
| Lưu Long Hải | 21211TT0522 | Ops owner |
| Ngô Đức Hải | 24211TT4856 | Dev owner |
