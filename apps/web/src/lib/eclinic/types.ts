// Kiểu dữ liệu & helper hiển thị dùng chung cho giao diện e-Clinic.
// Dữ liệu thật đến từ NestJS API (xem data.ts để biết cách map từ response).

export type Status = 'active' | 'inactive' | 'trashed'

export interface Specialty {
  id: string
  name: string
  description: string
  status: Status
  iconUrl?: string
  doctorsCount?: number
}

export interface Service {
  id: string
  specialtyId: string
  specialtyName: string
  name: string
  price: number
  durationMinutes: number
  description: string
  status: Status
  iconUrl?: string
}

/** Khung giờ khám (bảng `schedules`): chỉ có giờ bắt đầu/kết thúc. */
export interface ScheduleSlot {
  id: string
  label: string // tên ca do quản trị đặt; nếu trống thì "Ca N" theo thứ tự giờ
  start: string // "07:00"
  end: string // "08:00"
  status: Status
}

export interface Doctor {
  id: string // doctors.id
  userId: string
  code: string // employee_code
  name: string
  title: string
  clinicRoom: string
  price: number
  phone: string
  email: string
  avatar?: string
  specialtyNames: string[]
  specialtyIds: string[]
  biography: string
  ratingAvg: number
  ratingCount: number
  status: Status
}

export interface Patient {
  id: string
  name: string
  phone: string
  email: string
  citizenId: string
  insuranceCode: string
  address: string
  dob: string
  gender: string
  avatarUrl?: string
  active: boolean
}

/** Trạng thái lịch hẹn do API quản lý. */
export type AppointmentStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled'
/** Trạng thái lượt khám trong hàng đợi do API quản lý. */
export type QueueStatus = 'waiting' | 'examining' | 'done' | 'absent'

export interface AppointmentVM {
  id: string
  patientId: string
  patientName: string
  patientPhone: string
  patientAvatar?: string
  doctorId: string
  doctorName: string
  specialtyName: string
  services: string[]
  total: number // tổng giá dịch vụ
  date: string // yyyy-mm-dd
  slotStart: string
  slotEnd: string
  symptom: string
  type: string
  status: AppointmentStatus
  createdAt: string
}

export interface QueueItem {
  id: string
  appointmentId: string
  doctorId: string
  queueNumber: number
  status: QueueStatus
  absentCount: number
  date: string
  appointment: AppointmentVM
}

export type ShiftStatus = 'pending' | 'approved' | 'rejected'

export interface DoctorShift {
  id: string
  doctorId: string
  doctorName: string
  clinicRoom: string // phòng của ca trực (mặc định lấy phòng của bác sĩ)
  date: string
  slotId: string
  slotStart: string
  slotEnd: string
  status: ShiftStatus
}

export interface ReviewVM {
  id: string
  patientName: string
  doctorId: string
  doctorName: string
  appointmentId: string
  rating: number
  comment: string
  createdAt: string
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
export const currency = (n: number) =>
  n.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })

/** yyyy-mm-dd theo giờ máy người dùng (không dùng toISOString vì lệch UTC). */
export const todayLocal = () => new Date().toLocaleDateString('en-CA')

export const slotText = (s: { slotStart: string; slotEnd: string }) => `${s.slotStart} - ${s.slotEnd}`

export const initial = (name?: string) => name?.trim().split(' ').pop()?.[0] ?? '?'

export const statusLabel: Record<Status, string> = {
  active: 'Đang hoạt động',
  inactive: 'Đã tắt',
  trashed: 'Trong thùng rác',
}

export const appointmentStatusLabel: Record<AppointmentStatus, string> = {
  pending: 'Chờ bác sĩ xác nhận',
  confirmed: 'Đã xác nhận',
  completed: 'Đã khám xong',
  cancelled: 'Đã huỷ',
}

export const queueStatusLabel: Record<QueueStatus, string> = {
  waiting: 'Đang chờ',
  examining: 'Đang khám',
  done: 'Đã khám xong',
  absent: 'Vắng mặt',
}

export interface MedicalRecordVM {
  id: string
  appointmentId: string
  diagnosis: string
  prescription: string
  notes: string
  createdAt: string
}
