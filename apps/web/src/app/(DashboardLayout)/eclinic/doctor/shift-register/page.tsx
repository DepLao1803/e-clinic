'use client'

import { useState } from 'react'
import CardBox from '@/app/components/shared/CardBox'
import PageHeader from '@/app/components/eclinic/PageHeader'
import { ActionError, Async, NoDoctorProfile } from '@/app/components/eclinic/ApiState'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import StatusBadge from '@/app/components/eclinic/StatusBadge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { api, del, post } from '@/lib/eclinic/api'
import { RawDoctorSchedule, RawSchedule, toShift, toSlots } from '@/lib/eclinic/data'
import { useAuth } from '@/lib/eclinic/auth'
import { useAction, useApi } from '@/lib/eclinic/use-api'
import { slotText, todayLocal } from '@/lib/eclinic/types'
import { Icon } from '@iconify/react'

export default function DoctorShiftRegisterPage() {
  const { user } = useAuth()
  const doctorId = user?.doctor_id
  const state = useApi(async () => {
    if (!doctorId) return { slots: [], mine: [] }
    const [slots, mine] = await Promise.all([
      api<RawSchedule[]>('/schedules'),
      api<RawDoctorSchedule[]>(`/doctor-schedules?doctor_id=${doctorId}`),
    ])
    return { slots: toSlots(slots), mine: mine.map(toShift) }
  }, [doctorId])
  const [date, setDate] = useState('')
  const [picked, setPicked] = useState<string[]>([])
  const [room, setRoom] = useState('')
  const action = useAction(state.reload)

  if (!doctorId) return <NoDoctorProfile />

  const toggle = (id: string) =>
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]))

  const submit = async () => {
    if (!date || picked.length === 0) return
    const ok = await action.run(() =>
      post('/doctor-schedules', { working_date: date, schedule_ids: picked.map(Number), ...(room.trim() ? { room_no: room.trim() } : {}) })
    )
    if (ok) setPicked([])
  }

  const remove = (id: string) => action.run(() => del(`/doctor-schedules/${id}`))

  return (
    <Async state={state}>
      {({ slots, mine }) => (
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 lg:col-span-4">
            <CardBox className="lg:sticky lg:top-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <Icon icon="solar:calendar-add-linear" width={18} />
                </div>
                <h6 className="text-base font-semibold">Đăng ký lịch trực</h6>
              </div>
              <div className="flex flex-col gap-3">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Ngày trực</label>
                  <Input type="date" min={todayLocal()} value={date} onChange={(e) => setDate(e.target.value)} />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Ca khám (chọn một hoặc nhiều)</label>
                  <div className="flex flex-wrap gap-2">
                    {slots.map((s) => (
                      <Button
                        key={s.id}
                        type="button"
                        size="sm"
                        variant={picked.includes(s.id) ? 'default' : 'outline'}
                        onClick={() => toggle(s.id)}>
                        {s.label} ({s.start} - {s.end})
                      </Button>
                    ))}
                    {slots.length === 0 && (
                      <p className="text-sm text-muted-foreground">Quản trị chưa tạo ca khám nào.</p>
                    )}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Phòng khám (tuỳ chọn)</label>
                  <Input placeholder="VD: P101 — bỏ trống để dùng phòng mặc định" value={room} onChange={(e) => setRoom(e.target.value)} />
                </div>
                <ActionError message={action.error} />
                <Button onClick={submit} disabled={action.busy || !date || picked.length === 0}>
                  Đăng ký lịch trực
                </Button>
                <p className="text-xs text-muted-foreground">
                  Yêu cầu ở trạng thái "Chờ duyệt" cho đến khi quản trị xác nhận. Cổng đăng ký chỉ mở vào thứ 7 và Chủ nhật hằng tuần.
                </p>
              </div>
            </CardBox>
          </div>

          <div className="col-span-12 lg:col-span-8">
            <CardBox>
              <PageHeader
                title="Lịch trực của tôi"
                description="Các ca trực sắp tới đã đăng ký và trạng thái duyệt. Chỉ ca đã duyệt mới nhận được lịch hẹn của bệnh nhân."
              />
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ngày</TableHead>
                    <TableHead>Ca</TableHead>
                    <TableHead>Phòng</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mine.map((r) => (
                    <TableRow key={r.id} className="hover:bg-muted/40">
                      <TableCell className="font-medium">{r.date}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center gap-1">
                          <Icon icon="solar:clock-square-linear" width={14} className="text-muted-foreground" />
                          {slotText(r)}
                        </span>
                      </TableCell>
                      <TableCell>{r.clinicRoom || '—'}</TableCell>
                      <TableCell>
                        <StatusBadge status={r.status} />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="destructive" disabled={action.busy} onClick={() => remove(r.id)}>
                          Xoá
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {mine.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        Chưa có lịch trực nào
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardBox>
          </div>
        </div>
      )}
    </Async>
  )
}
