# Thay đổi so với bản gốc

## Cần chạy sau khi cập nhật
```
npm install
npx prisma migrate deploy   # migration 20261103090000_workflow_uploads
npx prisma generate
```
Biến môi trường tuỳ chọn: `UPLOAD_DIR` (mặc định `./uploads`), `PUBLIC_URL` (mặc định lấy từ request, vd. `http://localhost:4000`).

## Database (migration mới)
- `doctor_schedule.status` (pending/approved/rejected; dòng cũ → approved), `doctor_schedule.room_no`
- `schedules.label`, `schedules.is_active`
- `medical_services.duration_minutes`
- `users.insurance_code` (BHYT)
- `queues.absent_count`

## Endpoint mới / đổi
- `GET /appointments/doctor`, `PATCH /appointments/:id/reject`
- `GET /queues/board/:doctorId`; vắng lần 1 → xuống cuối hàng, vắng lần 2 → huỷ lịch
- `POST /admin/doctor-schedules/:id/approve|reject`; `GET /doctor-schedules?status=`; chỉ đặt được ca đã duyệt
- `GET /admin/schedules/trash`, `POST /admin/schedules/:id/toggle|forceDelete`
- `GET|POST /admin/doctors`, `PUT /admin/doctors/:id`
- `POST /uploads` (multipart `file`, JPG/PNG ≤ 2MB) → `{ url }`, file phục vụ tại `/uploads/*`
- `/auth/specialties/:id/doctors` trả thêm avatar, title, phòng, điểm đánh giá
- user resource trả thêm `address`, `insurance_code`; `avatar_url` sửa được qua profile

## Bổ sung (đợt 2)
- `PATCH /appointments/:id/cancel` — bệnh nhân (chủ lịch) hoặc admin huỷ lịch pending/confirmed chưa qua ngày: status → cancelled, xoá số thứ tự, trả lại ca trống.
- `POST /admin/appointments/trash` nay trả đủ quan hệ (bệnh nhân, bác sĩ, ca, dịch vụ) để hiển thị.
- User resource trả thêm `two_factor_enabled`.

## Bổ sung (đợt 3)
- `POST /queues/next` chỉ gọi lịch bác sĩ đã xác nhận (frontend nút "Mời khám" dùng route này).
- `GET /admin/user/trash` trả đủ `role`/`roles` (dùng toUserResource).
- Khôi phục lịch hẹn đã huỷ không tạo lại số thứ tự.
