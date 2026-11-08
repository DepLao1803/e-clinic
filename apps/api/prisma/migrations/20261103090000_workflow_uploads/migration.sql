-- Duyệt lịch trực: dòng cũ coi như đã duyệt, dòng mới mặc định chờ duyệt.
ALTER TABLE `doctor_schedule` ADD COLUMN `status` VARCHAR(20) NOT NULL DEFAULT 'approved',
    ADD COLUMN `room_no` VARCHAR(50) NULL;
ALTER TABLE `doctor_schedule` ALTER COLUMN `status` SET DEFAULT 'pending';
CREATE INDEX `doctor_schedule_status_idx` ON `doctor_schedule`(`status`);

-- Ca khám: tên ca + bật/tắt
ALTER TABLE `schedules` ADD COLUMN `label` VARCHAR(50) NULL,
    ADD COLUMN `is_active` BOOLEAN NOT NULL DEFAULT true;

-- Dịch vụ: thời lượng
ALTER TABLE `medical_services` ADD COLUMN `duration_minutes` INTEGER NOT NULL DEFAULT 30;

-- Bệnh nhân: thẻ BHYT
ALTER TABLE `users` ADD COLUMN `insurance_code` VARCHAR(20) NULL;

-- Hàng đợi: đếm số lần vắng (vắng 2 lần mới huỷ lịch)
ALTER TABLE `queues` ADD COLUMN `absent_count` TINYINT UNSIGNED NOT NULL DEFAULT 0;
