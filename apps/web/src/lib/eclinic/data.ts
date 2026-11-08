// Raw API response shapes (snake_case, as sent by the NestJS API) + mappers to the UI types,
// + the few multi-request loaders that more than one page needs.
import { api } from './api'
import type {
  AppointmentStatus,
  AppointmentVM,
  Doctor,
  DoctorShift,
  Patient,
  QueueItem,
  MedicalRecordVM,
  QueueStatus,
  ReviewVM,
  ShiftStatus,
  ScheduleSlot,
  Service,
  Specialty,
  Status,
} from './types'

// ---------------------------------------------------------------------------
// Raw shapes
// ---------------------------------------------------------------------------
export interface RawSchedule { id: number; start_at: string; end_at: string; label?: string | null; is_active?: boolean; deleted_at?: string | null }
export interface RawSpecialty {
  id: number; name: string; slug: string; description: string | null; icon_url: string | null
  is_active: number; deleted_at: string | null; doctors_count?: number
}
export interface RawService {
  id: number; specialty_id: number; name: string; price: string; duration_minutes?: number; description: string | null
  icon_url: string | null; is_active: boolean; deleted_at: string | null; specialty?: { id: number; name: string }
}
export interface RawUser {
  id: number; name: string; email: string | null; gender: string | null; date_of_birth: string | null
  identity_card: string | null; insurance_code?: string | null; phone: string | null; address?: string | null; avatar_url: string | null
  role: 'admin' | 'doctor' | 'patient'; is_active: boolean; doctor_id?: number
}
export interface RawDoctor {
  id: number; user_id: number | null; employee_code: string | null; title: string; price: string
  clinic_room: string; is_active: boolean; biography?: string | null; user?: { id: number; name: string } | null
}
export interface RawAppointment {
  id: number; user_id: number; doctor_id: number; schedule_id: number; appointment_date: string
  reason: string | null; status: string; type: string; created_at: string
  schedule?: RawSchedule
  user?: Partial<RawUser> & { id: number; name: string }
  doctor?: { id: number; user?: { id: number; name: string } | null; specialties?: { id: number; name: string }[] }
  medical_services?: RawService[]
}
export interface RawQueue {
  id: number; appointment_id: number; doctor_id: number; queue_number: number; date: string
  absent_count?: number; status: string; appointment: RawAppointment
}
export interface RawDoctorSchedule {
  id: number; doctor_id: number; schedule_id: number; working_date: string; status: string; room_no: string | null
  schedule?: RawSchedule; doctor?: RawDoctor
}
export interface RawReview {
  id: number; user?: { id: number; name: string }; appointment?: { id: number; appointment_date: string } | null
  doctor_id: number; rating: number; comment: string | null; created_at: string
  doctor?: { id: number; name: string | null }
}
export interface RawSpecialtyDoctor {
  id: number; price: string; description: string | null; title: string; clinic_room: string
  rating_avg: number; rating_count: number; user: { id: number; name: string; avatar_url: string | null } | null
}
export interface RawAdminDoctor {
  id: number; user_id: number | null; employee_code: string | null; title: string; price: string; clinic_room: string
  biography: string | null; is_active: boolean
  user: { id: number; name: string; email: string | null; phone: string | null; avatar_url: string | null } | null
  specialties: { id: number; name: string }[]
}
export interface RawMedicalRecord {
  id: number; appointment_id: number; diagnosis: string; prescription: string; notes: string | null; created_at: string
}

// ---------------------------------------------------------------------------
// Mappers
// ---------------------------------------------------------------------------
const hm = (t?: string | null) => (t ? t.slice(0, 5) : '')

export const toSpecialty = (s: RawSpecialty): Specialty => ({
  id: String(s.id),
  name: s.name,
  description: s.description ?? '',
  status: s.deleted_at ? 'trashed' : s.is_active === 1 ? 'active' : 'inactive',
  iconUrl: s.icon_url ?? undefined,
  doctorsCount: s.doctors_count,
})

export const toService = (s: RawService): Service => ({
  id: String(s.id),
  specialtyId: String(s.specialty_id),
  specialtyName: s.specialty?.name ?? '',
  name: s.name,
  price: Number(s.price) || 0,
  durationMinutes: s.duration_minutes ?? 30,
  description: s.description ?? '',
  status: s.deleted_at ? 'trashed' : s.is_active ? 'active' : 'inactive',
  iconUrl: s.icon_url ?? undefined,
})

/** Sorted by start time. Slots without a custom label are named "Ca N" by position. */
export const toSlots = (list: RawSchedule[], numbered = true): ScheduleSlot[] =>
  [...list]
    .sort((a, b) => a.start_at.localeCompare(b.start_at))
    .map((s, i) => ({
      id: String(s.id),
      label: s.label || (numbered ? `Ca ${i + 1}` : `Ca ${hm(s.start_at)}`),
      start: hm(s.start_at),
      end: hm(s.end_at),
      status: (s.deleted_at ? 'trashed' : s.is_active === false ? 'inactive' : 'active') as Status,
    }))

export const toPatient = (u: RawUser): Patient => ({
  id: String(u.id),
  name: u.name,
  phone: u.phone ?? '',
  email: u.email ?? '',
  citizenId: u.identity_card ?? '',
  insuranceCode: u.insurance_code ?? '',
  address: u.address ?? '',
  dob: u.date_of_birth ?? '',
  gender: u.gender ?? '',
  avatarUrl: u.avatar_url ?? undefined,
  active: u.is_active,
})

export function toAppointment(a: RawAppointment): AppointmentVM {
  const services = a.medical_services ?? []
  return {
    id: String(a.id),
    patientId: String(a.user_id),
    patientName: a.user?.name ?? '',
    patientPhone: a.user?.phone ?? '',
    patientAvatar: a.user?.avatar_url ?? undefined,
    doctorId: String(a.doctor_id),
    doctorName: a.doctor?.user?.name ?? '',
    specialtyName: a.doctor?.specialties?.[0]?.name ?? '',
    services: services.map((s) => s.name),
    total: services.reduce((sum, s) => sum + (Number(s.price) || 0), 0),
    date: a.appointment_date,
    slotStart: hm(a.schedule?.start_at),
    slotEnd: hm(a.schedule?.end_at),
    symptom: a.reason ?? '',
    type: a.type,
    status: a.status as AppointmentStatus,
    createdAt: a.created_at,
  }
}

export const toQueue = (q: RawQueue): QueueItem => ({
  id: String(q.id),
  appointmentId: String(q.appointment_id),
  doctorId: String(q.doctor_id),
  queueNumber: q.queue_number,
  status: q.status as QueueStatus,
  absentCount: q.absent_count ?? 0,
  date: q.date,
  appointment: toAppointment(q.appointment),
})

export const toShift = (d: RawDoctorSchedule): DoctorShift => ({
  id: String(d.id),
  doctorId: String(d.doctor_id),
  doctorName: d.doctor?.user?.name ?? '',
  clinicRoom: d.room_no || d.doctor?.clinic_room || '',
  date: d.working_date,
  slotId: String(d.schedule_id),
  slotStart: hm(d.schedule?.start_at),
  slotEnd: hm(d.schedule?.end_at),
  status: (d.status as ShiftStatus) ?? 'approved',
})

export const toReview = (r: RawReview): ReviewVM => ({
  id: String(r.id),
  patientName: r.user?.name ?? '',
  doctorId: String(r.doctor_id),
  doctorName: r.doctor?.name ?? '',
  appointmentId: r.appointment ? String(r.appointment.id) : '',
  rating: r.rating,
  comment: r.comment ?? '',
  createdAt: r.created_at,
})

export const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0)

// ---------------------------------------------------------------------------
// Loaders
// ---------------------------------------------------------------------------

/** Doctor id → names of the specialties they belong to (public endpoints, one call per specialty). */
export async function loadDoctorSpecialties(): Promise<Record<string, string[]>> {
  const specs = await api<RawSpecialty[]>('/specialties')
  const lists = await Promise.all(
    specs.map((s) => api<RawSpecialtyDoctor[]>(`/auth/specialties/${s.id}/doctors`).then((ds) => ({ s, ds }))),
  )
  const map: Record<string, string[]> = {}
  for (const { s, ds } of lists) for (const d of ds) (map[String(d.id)] ??= []).push(s.name)
  return map
}

/** Admin: doctors (with account + specialties) plus review stats. */
export async function loadDoctorDirectory(): Promise<Doctor[]> {
  const [doctors, reviews] = await Promise.all([
    api<RawAdminDoctor[]>('/admin/doctors'),
    api<RawReview[]>('/admin/reviews'),
  ])
  return doctors.map((d) => {
    const mine = reviews.filter((r) => r.doctor_id === d.id).map((r) => r.rating)
    return {
      id: String(d.id),
      userId: String(d.user_id ?? ''),
      code: d.employee_code ?? '',
      name: d.user?.name ?? '',
      title: d.title,
      clinicRoom: d.clinic_room,
      price: Number(d.price) || 0,
      phone: d.user?.phone ?? '',
      email: d.user?.email ?? '',
      avatar: d.user?.avatar_url ?? undefined,
      specialtyNames: d.specialties.map((s) => s.name),
      specialtyIds: d.specialties.map((s) => String(s.id)),
      biography: d.biography ?? '',
      ratingAvg: avg(mine),
      ratingCount: mine.length,
      status: (d.is_active ? 'active' : 'inactive') as Status,
    }
  })
}


export const toMedicalRecord = (r: RawMedicalRecord): MedicalRecordVM => ({
  id: String(r.id),
  appointmentId: String(r.appointment_id),
  diagnosis: r.diagnosis,
  prescription: r.prescription,
  notes: r.notes ?? '',
  createdAt: r.created_at,
})
