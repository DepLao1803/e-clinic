'use client'

import { useMemo, useState } from 'react'
import CardBox from '@/app/components/shared/CardBox'
import PageHeader from '@/app/components/eclinic/PageHeader'
import { ActionError, Async } from '@/app/components/eclinic/ApiState'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { api, post } from '@/lib/eclinic/api'
import {
  RawDoctorSchedule,
  RawService,
  RawSpecialty,
  RawSpecialtyDoctor,
  toService,
  toSpecialty,
} from '@/lib/eclinic/data'
import { useAction, useApi } from '@/lib/eclinic/use-api'
import { currency, initial } from '@/lib/eclinic/types'
import { Icon } from '@iconify/react'

export default function PatientBookingPage() {
  const [specialtyId, setSpecialtyId] = useState('')
  const [doctorId, setDoctorId] = useState('')
  const [serviceId, setServiceId] = useState('')
  const [date, setDate] = useState('')
  const [slotId, setSlotId] = useState('')
  const [type, setType] = useState<'offline' | 'online'>('offline')
  const [symptom, setSymptom] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const action = useAction()

  const specialties = useApi(async () =>
    (await api<RawSpecialty[]>('/specialties')).map(toSpecialty)
  )
  const doctors = useApi(async () => {
    if (!specialtyId) return []
    return api<RawSpecialtyDoctor[]>(`/auth/specialties/${specialtyId}/doctors`)
  }, [specialtyId])
  const services = useApi(async () => {
    if (!specialtyId) return []
    return (await api<RawService[]>(`/medical-services?specialty_id=${specialtyId}`)).map(toService)
  }, [specialtyId])
  // Lịch trực sắp tới của bác sĩ đã chọn → chỉ cho chọn ngày/ca bác sĩ thực sự làm việc.
  const schedules = useApi(async () => {
    if (!doctorId) return []
    return api<RawDoctorSchedule[]>(`/doctor-schedules?doctor_id=${doctorId}&status=approved`)
  }, [doctorId])

  const doctorOptions = doctors.data ?? []
  const serviceOptions = services.data ?? []
  const scheduleRows = schedules.data ?? []
  const dateOptions = useMemo(
    () => [...new Set(scheduleRows.map((r) => r.working_date))].sort(),
    [scheduleRows]
  )
  const slotOptions = useMemo(
    () =>
      scheduleRows
        .filter((r) => r.working_date === date && r.schedule)
        .map((r) => ({ id: String(r.schedule_id), start: r.schedule!.start_at.slice(0, 5), end: r.schedule!.end_at.slice(0, 5) }))
        .sort((a, b) => a.start.localeCompare(b.start)),
    [scheduleRows, date]
  )

  const selectedDoctor = doctorOptions.find((d) => String(d.id) === doctorId)
  const selectedSlot = slotOptions.find((s) => s.id === slotId)
  const selectedService = serviceOptions.find((s) => s.id === serviceId)
  const selectedSpecialty = specialties.data?.find((s) => s.id === specialtyId)

  const canSubmit = specialtyId && doctorId && serviceId && date && slotId && symptom.trim().length > 3

  const submit = async () => {
    if (!canSubmit) return
    const ok = await action.run(() =>
      post('/appointments', {
        doctor_id: Number(doctorId),
        schedule_id: Number(slotId),
        appointment_date: date,
        reason: symptom.trim(),
        type,
        service_ids: [Number(serviceId)],
      })
    )
    if (ok) setSubmitted(true)
  }

  const reset = () => {
    setSubmitted(false)
    setDoctorId('')
    setServiceId('')
    setDate('')
    setSlotId('')
    setSymptom('')
    schedules.reload()
  }

  if (submitted) {
    return (
      <CardBox className="p-10 text-center max-w-lg mx-auto">
        <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
          <Icon icon="solar:check-circle-bold" className="text-success text-4xl" />
        </div>
        <h5 className="text-lg font-semibold mb-2">Đặt lịch thành công!</h5>
        <p className="text-sm text-muted-foreground mb-6">
          Yêu cầu của bạn đã được gửi tới <span className="font-medium text-foreground">{selectedDoctor?.user?.name}</span>.
          Vui lòng chờ bác sĩ xác nhận — theo dõi số thứ tự ở mục &quot;Số thứ tự&quot; vào ngày khám.
        </p>
        <Button onClick={reset}>
          <Icon icon="solar:calendar-add-linear" className="mr-1.5" />
          Đặt lịch khác
        </Button>
      </CardBox>
    )
  }

  return (
    <div className="grid grid-cols-12 gap-6">
      <div className="col-span-12">
        <PageHeader
          title="Đặt lịch khám"
          description="Chọn chuyên khoa, bác sĩ và mô tả triệu chứng để đặt lịch hẹn."
        />
      </div>

      <div className="lg:col-span-8 col-span-12 flex flex-col gap-6">
        {/* Step 1: Specialty */}
        <CardBox>
          <h5 className="card-title mb-4 flex items-center gap-2">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">1</span>
            Chọn chuyên khoa
          </h5>
          <Async state={specialties}>
            {(list) => (
              <div className="grid sm:grid-cols-3 gap-3">
                {list.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => {
                      setSpecialtyId(s.id)
                      setDoctorId('')
                      setServiceId('')
                      setDate('')
                      setSlotId('')
                    }}
                    className={`flex flex-col items-center gap-2 rounded-xl border p-4 text-center transition-all hover:shadow-md ${
                      specialtyId === s.id
                        ? 'border-primary bg-primary/5 ring-1 ring-primary'
                        : 'border-border'
                    }`}
                  >
                    <div
                      className={`w-11 h-11 rounded-full flex items-center justify-center overflow-hidden ${
                        specialtyId === s.id ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {s.iconUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={s.iconUrl} alt={s.name} className="w-full h-full object-cover" />
                      ) : (
                        <Icon icon="solar:medical-kit-linear" width={22} />
                      )}
                    </div>
                    <span className="text-sm font-medium">{s.name}</span>
                  </button>
                ))}
                {list.length === 0 && (
                  <p className="text-sm text-muted-foreground sm:col-span-3">Chưa có chuyên khoa nào.</p>
                )}
              </div>
            )}
          </Async>
        </CardBox>

        {/* Step 2: Doctor */}
        <CardBox className={!specialtyId ? 'opacity-50 pointer-events-none' : ''}>
          <h5 className="card-title mb-4 flex items-center gap-2">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">2</span>
            Chọn bác sĩ
          </h5>
          <div className="grid sm:grid-cols-2 gap-3">
            {doctorOptions.map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => {
                  setDoctorId(String(d.id))
                  setDate('')
                  setSlotId('')
                }}
                className={`flex items-center gap-3 rounded-xl border p-3 text-left transition-all hover:shadow-md ${
                  doctorId === String(d.id) ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-border'
                }`}
              >
                <Avatar className="w-11 h-11">
                  <AvatarImage src={d.user?.avatar_url ?? undefined} alt={d.user?.name} />
                  <AvatarFallback>{initial(d.user?.name)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate">{d.user?.name}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {d.title}{d.clinic_room ? ` · Phòng ${d.clinic_room}` : ''}
                  </p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Icon icon="solar:star-bold" width={12} className="text-warning" />
                    {d.rating_count ? `${d.rating_avg.toFixed(1)} (${d.rating_count})` : 'Chưa có đánh giá'}
                    <span>· {currency(Number(d.price) || 0)}</span>
                  </p>
                </div>
              </button>
            ))}
            {specialtyId && !doctors.loading && doctorOptions.length === 0 && (
              <p className="text-sm text-muted-foreground col-span-2">Chưa có bác sĩ khả dụng cho chuyên khoa này.</p>
            )}
          </div>
        </CardBox>

        {/* Step 3: Service + Date + Slot */}
        <CardBox className={!doctorId ? 'opacity-50 pointer-events-none' : ''}>
          <h5 className="card-title mb-4 flex items-center gap-2">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">3</span>
            Chọn dịch vụ &amp; thời gian
          </h5>
          <div className="flex flex-col gap-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Dịch vụ</label>
              <Select value={serviceId} onValueChange={setServiceId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Chọn dịch vụ" />
                </SelectTrigger>
                <SelectContent>
                  {serviceOptions.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name} — {currency(s.price)} · {s.durationMinutes} phút
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {specialtyId && !services.loading && serviceOptions.length === 0 && (
                <p className="text-xs text-muted-foreground mt-1">Chuyên khoa này chưa có dịch vụ nào.</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Ngày khám</label>
                <Select
                  value={date}
                  onValueChange={(v) => {
                    setDate(v)
                    setSlotId('')
                  }}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Chọn ngày" />
                  </SelectTrigger>
                  <SelectContent>
                    {dateOptions.map((d) => (
                      <SelectItem key={d} value={d}>
                        {d}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Ca khám</label>
                <Select value={slotId} onValueChange={setSlotId} disabled={!date}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Chọn ca" />
                  </SelectTrigger>
                  <SelectContent>
                    {slotOptions.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.start} - {s.end}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {doctorId && !schedules.loading && dateOptions.length === 0 && (
              <p className="text-xs text-muted-foreground">Bác sĩ này chưa mở lịch khám sắp tới.</p>
            )}

            <div>
              <label className="text-sm font-medium mb-1.5 block">Hình thức khám</label>
              <Select value={type} onValueChange={(v) => setType(v as 'offline' | 'online')}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="offline">Khám trực tiếp tại phòng khám</SelectItem>
                  <SelectItem value="online">Khám online</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block">Triệu chứng</label>
              <Textarea
                placeholder="Mô tả triệu chứng của bạn..."
                value={symptom}
                maxLength={255}
                onChange={(e) => setSymptom(e.target.value)}
                rows={4}
              />
            </div>
          </div>
        </CardBox>
      </div>

      {/* Summary sidebar */}
      <div className="lg:col-span-4 col-span-12">
        <CardBox className="lg:sticky lg:top-6">
          <h5 className="card-title mb-4">Tóm tắt lịch hẹn</h5>
          <div className="flex flex-col gap-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Chuyên khoa</span>
              <span className="font-medium">{selectedSpecialty?.name ?? '—'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Bác sĩ</span>
              <span className="font-medium">{selectedDoctor?.user?.name ?? '—'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Dịch vụ</span>
              <span className="font-medium">{selectedService?.name ?? 'Chưa chọn'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Ngày</span>
              <span className="font-medium">{date || '—'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Ca khám</span>
              <span className="font-medium">
                {selectedSlot ? `${selectedSlot.start} - ${selectedSlot.end}` : '—'}
              </span>
            </div>
          </div>
          <div className="mt-4">
            <ActionError message={action.error} />
          </div>
          <Button disabled={!canSubmit || action.busy} onClick={submit} className="w-full mt-4">
            <Icon icon="solar:calendar-add-linear" className="mr-1.5" />
            Đăng ký khám
          </Button>
          {!canSubmit && (
            <p className="text-xs text-muted-foreground mt-2 text-center">
              Vui lòng điền đầy đủ thông tin (triệu chứng tối thiểu 4 ký tự).
            </p>
          )}
        </CardBox>
      </div>
    </div>
  )
}
