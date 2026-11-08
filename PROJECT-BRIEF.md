# PROJECT-BRIEF

## Tên dự án
`thu-vien-so` — Hệ thống quản lý thư viện có mượn trả và nhắc hạn

## Bài toán
Thư viện khoa hiện quản lý mượn trả bằng sổ tay và bảng tính, nên không biết chính xác cuốn nào đang ở đâu, độc giả nào đang quá hạn, và thủ thư phải gọi điện nhắc từng người. Hệ thống này cho phép thủ thư lập phiếu mượn trả trên máy, tự động gửi email nhắc hạn, và cho độc giả tự tra cứu sách còn hay hết mà không cần hỏi.

## Người dùng và vai trò
| Vai trò | Họ làm gì trong hệ thống |
|---|---|
| Độc giả | Tìm sách, xem số bản còn, xem lịch sử mượn và phí phạt của mình, nhận email nhắc hạn |
| Thủ thư | Quản lý đầu sách và bản sao, lập phiếu mượn/trả, ghi nhận thanh toán phí phạt, tải ảnh bìa |
| Quản trị | Quản lý tài khoản thủ thư, xem thống kê tháng, xuất báo cáo, cấu hình hạn mượn và mức phạt |

## Năm yếu tố bắt buộc
| Yếu tố | Trong dự án này cụ thể là gì |
|---|---|
| Xác thực & phân quyền | Đăng nhập bằng email và mật khẩu. Ba vai trò trên với quyền tách bạch: độc giả chỉ xem dữ liệu của chính mình; thủ thư không xoá được đầu sách đã có phiếu mượn; chỉ quản trị tạo được tài khoản thủ thư |
| CRUD có quan hệ dữ liệu | Đầu sách (1) — Bản sao (n): mỗi bản sao có mã riêng và trạng thái. Phiếu mượn thuộc một Độc giả, chứa nhiều Bản sao, có ngày mượn, ngày hẹn trả, ngày trả thật. Phí phạt tính từ Phiếu mượn |
| Upload tệp | Ảnh bìa đầu sách (thủ thư tải lên, tối đa 2MB, chỉ nhận JPG/PNG). Ảnh đại diện độc giả (tuỳ chọn) |
| Tác vụ nền | Worker chạy mỗi sáng 7:00: gửi email nhắc trước hạn 2 ngày, và email quá hạn mỗi ngày cho tới khi trả. Quản trị bấm "Xuất báo cáo tháng" thì worker sinh tệp CSV và gửi email khi xong |
| Cache / đếm | Đếm số bản còn có thể mượn của mỗi đầu sách (Redis), cập nhật khi mượn/trả, để trang tìm kiếm không phải đếm lại trong CSDL mỗi lần. Cache danh mục thể loại, làm mới khi thủ thư sửa |

## Tính năng tối thiểu (MVP)
1. Đăng ký độc giả, đăng nhập, phân quyền ba vai trò
2. Thủ thư thêm/sửa đầu sách, thêm bản sao, tải ảnh bìa
3. Độc giả tìm sách theo tên/tác giả/thể loại, thấy số bản còn
4. Thủ thư lập phiếu mượn (tối đa 3 cuốn, hạn 14 ngày) và ghi nhận trả
5. Worker gửi email nhắc trước hạn 2 ngày và email quá hạn hàng ngày
6. Tự tính phí phạt quá hạn 2.000đ/ngày/cuốn; thủ thư ghi nhận đã thu tiền mặt
7. Độc giả xem lịch sử mượn và phí phạt còn nợ
8. Quản trị xem thống kê tháng (số lượt mượn, sách mượn nhiều, độc giả quá hạn) và xuất CSV

## Phạm vi CẮT BỎ
- **Không** cho độc giả tự đặt trước hoặc giữ chỗ sách online. Mọi phiếu mượn do thủ thư lập tại quầy
- **Không** thanh toán phí phạt online. Chỉ ghi nhận thu tiền mặt
- **Không** gia hạn online. Muốn gia hạn phải mang sách tới quầy
- **Không** quét mã vạch bằng camera. Thủ thư nhập mã bản sao bằng tay
- **Không** nhắc qua SMS hoặc Zalo. Chỉ email
- **Không** đa chi nhánh, đa thư viện
- **Không** tra cứu ISBN tự động từ dịch vụ bên ngoài
- **Không** quản lý tạp chí, luận văn, tài liệu số
- **Không** ứng dụng mobile

## Ngăn xếp dự kiến
| Thành phần | Lựa chọn | Lý do một dòng |
|---|---|---|
| Backend | NestJS (Node.js 22) | Đã dùng trong đồ án môn Lập trình web nâng cao |
| Frontend | React + Vite | Đã dùng trong cùng đồ án trên |
| CSDL | PostgreSQL 16 | Đã học trong môn CSDL, cần khoá ngoại và giao dịch cho phiếu mượn |
| Cache / hàng đợi | Redis 7 | Mặc định của môn |
| Quản lý gói | npm (workspaces: `apps/api`, `apps/web`) | Đi kèm Node.js, không cần cài thêm |
| Môi trường dev | Docker Compose cho PostgreSQL, Redis, Mailpit; API và web chạy trên máy, dùng cổng mặc định | Hot-reload nhanh, dựng lại môi trường bằng một lệnh |
| Gửi email | SMTP; Mailpit khi phát triển, nhà cung cấp có mức miễn phí khi lên production | Chốt nhà cung cấp ở buổi 12 |

## Thành viên
- Lưu Long Hải — 21211TT0522
- Ngô Đức Hải — 24211TT4856

---
*Duyệt ngày: ___ / ___ / 2026. Giảng viên: NGUYỄN HUY HOÀNG*
