# PROJECT-BRIEF

## Tên dự án
`e-clinic` — Hệ thống đặt lịch khám và quản lý hàng đợi phòng khám

## Bài toán
Phòng khám hiện nhận đặt lịch qua điện thoại và ghi số thứ tự bằng giấy, khiến bệnh nhân phải đến sớm ngồi chờ mà không biết khi nào tới lượt, còn lễ tân phải gọi điện nhắc lịch từng người. Hệ thống này cho phép bệnh nhân tự đặt lịch khám theo ca trực của bác sĩ và xem số thứ tự trực tuyến, tự động gửi email nhắc lịch hẹn mỗi sáng, đồng thời giúp bác sĩ điều phối hàng đợi khám ngay trên máy.

## Người dùng và vai trò
| Vai trò | Họ làm gì trong hệ thống |
|---|---|
| Bệnh nhân | Tìm chuyên khoa/bác sĩ/dịch vụ, đặt lịch khám, xem số thứ tự đang chờ, nhận email nhắc lịch, xem bệnh án và đánh giá bác sĩ |
| Bác sĩ | Đăng ký lịch trực, xác nhận lịch hẹn, gọi bệnh nhân tiếp theo trong hàng đợi, ghi nhận vắng mặt, lập bệnh án và đơn thuốc |
| Quản trị | Quản lý chuyên khoa, dịch vụ, ca khám và hồ sơ bác sĩ; duyệt lịch trực; xem thống kê tháng và xuất báo cáo CSV |

## Năm yếu tố bắt buộc
| Yếu tố | Trong dự án này cụ thể là gì |
|---|---|
| Xác thực & phân quyền | Đăng nhập bằng email/SĐT và mật khẩu (JWT, hỗ trợ 2FA TOTP). Ba vai trò tách bạch: bệnh nhân chỉ xem và huỷ lịch hẹn của chính mình; bác sĩ chỉ điều phối hàng đợi và bệnh án thuộc ca mình phụ trách; chỉ quản trị được duyệt lịch trực và quản lý danh mục |
| CRUD có quan hệ dữ liệu | Chuyên khoa (1) — Dịch vụ (n) và Bác sĩ (n). Bác sĩ đăng ký Lịch trực theo Ca khám. Lịch hẹn thuộc một Bệnh nhân, gắn với Bác sĩ, Ca khám và nhiều Dịch vụ, sinh ra Số thứ tự hàng đợi, Bệnh án và Đánh giá |
| Upload tệp | Ảnh đại diện người dùng/bác sĩ, icon chuyên khoa và ảnh minh hoạ dịch vụ (tối đa 2MB, chỉ nhận JPG/PNG) |
| Tác vụ nền | Worker chạy mỗi sáng 7:00: gửi email nhắc lịch cho các lịch hẹn diễn ra vào ngày hôm sau, và tự động huỷ các lịch hẹn quá ngày chưa xác nhận. Quản trị bấm "Xuất báo cáo tháng" thì worker sinh tệp CSV và gửi email khi xong |
| Cache / đếm | Đếm số bệnh nhân đang chờ trong hàng đợi của mỗi bác sĩ trong ngày (Redis), cập nhật khi đặt lịch/mời khám/hoàn tất để màn hình tra cứu hàng đợi không phải đếm lại trong CSDL mỗi lần. Cache danh mục chuyên khoa và dịch vụ khám, làm mới khi quản trị sửa |

## Tính năng tối thiểu (MVP)
1. Đăng ký bệnh nhân, đăng ký bác sĩ (đối chiếu mã nhân viên & chứng chỉ hành nghề), đăng nhập và phân quyền ba vai trò
2. Quản trị thêm/sửa/ẩn chuyên khoa, dịch vụ khám, ca khám cố định và tải ảnh icon/dịch vụ
3. Bác sĩ đăng ký lịch trực theo ca; quản trị phê duyệt lịch trực và gán phòng khám
4. Bệnh nhân đặt lịch khám theo chuyên khoa – bác sĩ – dịch vụ – ca trực đã duyệt và nhận số thứ tự
5. Bác sĩ xác nhận lịch hẹn, gọi khám theo hàng đợi (vắng lần 1 đẩy xuống cuối hàng, vắng lần 2 tự huỷ lịch) và ghi bệnh án
6. Worker gửi email nhắc lịch khám trước 1 ngày vào 7:00 sáng hàng ngày
7. Bệnh nhân theo dõi số thứ tự trực tuyến, xem lịch sử bệnh án và đánh giá bác sĩ sau khi khám
8. Quản trị xem thống kê tháng (tổng lượt khám, bác sĩ đông bệnh nhân, tỷ lệ huỷ/vắng) và xuất báo cáo CSV qua worker

## Phạm vi CẮT BỎ
- **Không** thanh toán phí khám hoặc viện phí trực tuyến. Bệnh nhân đóng phí tại quầy lễ tân
- **Không** khám bệnh từ xa qua video call hoặc chat trực tuyến (telemedicine)
- **Không** tích hợp phần cứng đọc thẻ BHYT hoặc cổng giám định BHYT quốc gia thật
- **Không** quản lý kho thuốc, nhà thuốc hoặc xuất nhập tồn dược phẩm
- **Không** gửi nhắc lịch qua SMS hoặc Zalo. Chỉ gửi qua email
- **Không** quản lý đa chi nhánh hoặc chuỗi nhiều phòng khám
- **Không** làm ứng dụng mobile native (iOS/Android)

## Ngăn xếp dự kiến
| Thành phần | Lựa chọn | Lý do một dòng |
|---|---|---|
| Backend | NestJS (Node.js 22) + Prisma | Đã quen dùng, hỗ trợ sẵn module, guard phân quyền và migration với Prisma |
| Frontend | Next.js (React + Tailwind CSS) | Đã dùng trong đồ án trước, dựng nhanh giao diện cho 3 vai trò |
| CSDL | MySQL 8.4 | Đã học trong môn CSDL, cần khoá ngoại và giao dịch (`FOR UPDATE`) khi cấp số thứ tự |
| Cache / hàng đợi | Redis 7 | Mặc định của môn |
| Quản lý gói | npm (workspaces: `apps/api`, `apps/web`) | Đi kèm Node.js, không cần cài thêm |
| Môi trường dev | Docker Compose cho MySQL, Redis, Adminer, Mailpit; API và web chạy trên máy, dùng cổng mặc định | Hot-reload nhanh, dựng lại môi trường bằng một lệnh |
| Gửi email | SMTP; Mailpit khi phát triển, nhà cung cấp có mức miễn phí khi lên production | Chốt nhà cung cấp ở buổi 12 |

## Thành viên
- Lưu Long Hải — 21211TT0522 — Ops owner sprint 1
- Ngô Đức Hải — 24211TT4856 — Dev owner sprint 1

---
*Duyệt ngày: ___ / ___ / 2026. Giảng viên: NGUYỄN HUY HOÀNG*
