# PROJECT-BRIEF

## Tên dự án
`e-clinic` — Hệ thống quản lý phòng khám có đặt lịch, hàng đợi khám và đánh giá bác sĩ

## Bài toán
Phòng khám hiện quản lý lịch khám bằng cách bệnh nhân gọi điện hoặc xếp hàng trực tiếp tại quầy, nên xảy ra tình trạng bệnh nhân chờ lâu không rõ đến lượt mình chưa, bác sĩ không biết trước ai sẽ đến khám và triệu chứng gì, còn quản trị không có số liệu để sắp xếp nhân sự hợp lý theo ca. Hệ thống này cho phép bệnh nhân tự đặt lịch và theo dõi số thứ tự online, bác sĩ xác nhận lịch hẹn trước khi khám để tránh bị phá bởi các lượt đặt ảo, và quản trị quản lý chuyên khoa, dịch vụ, ca khám cùng lịch trực của bác sĩ.

## Người dùng và vai trò
| Vai trò | Họ làm gì trong hệ thống |
|---|---|
| Bệnh nhân | Đăng ký bằng SĐT/CCCD/thẻ BHYT, đặt lịch khám theo chuyên khoa và bác sĩ, xem số thứ tự hàng đợi, xem hồ sơ đã khám, đánh giá bác sĩ sau khi khám xong |
| Bác sĩ | Đăng ký lịch trực (chờ duyệt), xác nhận hoặc từ chối lịch hẹn bệnh nhân đặt, mời bệnh nhân vào khám theo hàng đợi, xem đánh giá của mình. Bác sĩ cũng có thể đăng ký khám như một bệnh nhân |
| Quản trị | Quản lý chuyên khoa và dịch vụ (thêm/sửa/xoá/khôi phục/bật-tắt), quản lý ca khám cố định, duyệt lịch trực của bác sĩ, quản lý tài khoản bác sĩ và xem danh sách bệnh nhân, xem thống kê tổng quan phòng khám |

## Năm yếu tố bắt buộc
| Yếu tố | Trong dự án này cụ thể là gì |
|---|---|
| Xác thực & phân quyền | Đăng nhập bằng SĐT hoặc CCCD + mật khẩu (bác sĩ/quản trị nhập thêm mã). Ba vai trò quyền tách bạch: bệnh nhân chỉ xem lịch/hồ sơ của mình; bác sĩ chỉ duyệt/khám lịch của mình; quản trị tạo tài khoản và duyệt lịch trực |
| CRUD có quan hệ dữ liệu | Chuyên khoa (1) — Dịch vụ (n). Bác sĩ thuộc một Chuyên khoa. Lịch hẹn thuộc một Bệnh nhân, một Bác sĩ, một Dịch vụ và một Ca khám, có số thứ tự, trạng thái. Đánh giá thuộc một Lịch hẹn đã khám xong |
| Upload tệp | Ảnh đại diện (bác sĩ, bệnh nhân, quản trị), icon chuyên khoa và ảnh dịch vụ (nhận JPG/PNG, tối đa 2MB). **Sử dụng giải pháp lưu trữ thật (Object Storage như AWS S3 / MinIO) để lưu file lâu dài**, không lưu tạm bằng base64 |
| Tác vụ nền | Worker kiểm tra hàng đợi mỗi 5 phút (đẩy người vắng mặt > 10 phút xuống cuối). Worker chạy mỗi sáng 7:00 gửi email nhắc lịch hẹn. Quản trị xuất báo cáo tháng thì worker sinh tệp CSV và gửi email |
| Cache / đếm | Đếm số bệnh nhân đang chờ trong hàng đợi realtime theo ngày (Redis) để trang "Số thứ tự" không phải truy vấn CSDL liên tục. Cache danh mục chuyên khoa và dịch vụ đang bật |

## Tính năng tối thiểu (MVP)
1. Đăng ký, đăng nhập, phân quyền 3 vai trò và quản lý hồ sơ cá nhân (kèm tính năng tải ảnh đại diện).
2. Quản trị quản lý danh mục (chuyên khoa, dịch vụ, ca khám) và phê duyệt lịch trực của bác sĩ.
3. Bệnh nhân đặt lịch khám (chọn chuyên khoa, bác sĩ, ca khám) và Bác sĩ duyệt/từ chối lịch.
4. Quản lý hàng đợi realtime: bác sĩ thao tác mời khám/hoàn thành; bệnh nhân theo dõi STT trực tiếp.
5. Worker tự động đẩy hàng đợi (vắng mặt > 10 phút), gửi email nhắc lịch sáng và xuất CSV báo cáo.
6. Bệnh nhân xem lại hồ sơ bệnh án cá nhân và đánh giá bác sĩ sau khi khám xong.
7. Quản trị xem bảng điều khiển thống kê tổng quan (lượt khám, bác sĩ, chuyên khoa).

## Phạm vi CẮT BỎ
- **Không** thanh toán viện phí trực tuyến (thu phí tại quầy, hệ thống chỉ ghi nhận).
- **Không** kê đơn thuốc hoặc quản lý dược điện tử.
- **Không** khám từ xa qua video call.
- **Không** tích hợp với cổng bảo hiểm y tế (chỉ lưu thông tin thẻ BHYT).
- **Không** nhắc lịch qua SMS hoặc Zalo (chỉ dùng email).
- **Không** đa phòng khám, đa chi nhánh.
- **Không** cho bệnh nhân tự huỷ/đổi lịch sau khi bác sĩ đã duyệt (phải liên hệ quầy).
- **Không** ứng dụng mobile riêng (chỉ dùng web responsive).

## Ngăn xếp dự kiến
| Thành phần | Lựa chọn | Lý do một dòng |
|---|---|---|
| Backend | Next.js API Routes (Deploy bằng Docker) | Chạy chung repo với frontend; cấu hình Docker độc lập để chạy Next.js server và worker ngầm ổn định |
| Frontend | Next.js + Tailwind CSS | Tận dụng được template có sẵn, phát triển UI nhanh gọn |
| CSDL | PostgreSQL 16 | Cần khoá ngoại chặt chẽ và giao dịch (transaction) khi cấp số thứ tự |
| Cache / hàng đợi | Redis 7 | Xử lý đếm hàng đợi realtime và làm message broker cho cron jobs |
| Gửi email | SMTP (Mailpit khi dev) | Tiêu chuẩn chung, dễ đổi sang nhà cung cấp thật khi lên production |

## Thành viên
- Lưu Long Hải — 21211TT0522
- Ngô Đức Hải — 24211TT2856

---
*Duyệt ngày: ___ / ___ / 2026. Giảng viên: Nguyễn Huy Hoàng*