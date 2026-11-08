'use client'

import CardBox from '@/app/components/shared/CardBox'
import PageHeader from '@/app/components/eclinic/PageHeader'
import StatusBadge from '@/app/components/eclinic/StatusBadge'
import { ActionError, Async, NoDoctorProfile } from '@/app/components/eclinic/ApiState'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { useState } from 'react'
import { api, patch, post } from '@/lib/eclinic/api'
import { RawQueue, toQueue } from '@/lib/eclinic/data'
import { useAuth } from '@/lib/eclinic/auth'
import { useAction, useApi } from '@/lib/eclinic/use-api'
import { slotText, todayLocal } from '@/lib/eclinic/types'
import { Icon } from '@iconify/react'

// Thời gian khám trung bình cho mỗi bệnh nhân, dùng để ước tính giờ vào khám.
const AVG_MINUTES_PER_PATIENT = 12
// Khớp với API: số lần vắng tối đa trước khi tự huỷ lịch hẹn.
const MAX_ABSENT = 2

export default function DoctorQueuePage() {
  const { user } = useAuth()
  const doctorId = user?.doctor_id
  const state = useApi(async () => {
    if (!doctorId) return []
    return (await api<RawQueue[]>(`/queues?doctor_id=${doctorId}`)).map(toQueue)
  }, [doctorId])
  const action = useAction(state.reload)
  const [finishing, setFinishing] = useState<{ queueId: string; appointmentId: string; patient: string } | null>(null)
  const [record, setRecord] = useState({ diagnosis: '', prescription: '', notes: '' })

  if (!doctorId) return <NoDoctorProfile />

  const setStatus = (queueId: string, status: 'examining' | 'done' | 'absent') =>
    action.run(() => patch(`/queues/${queueId}/status`, { status }))

  const openFinish = (q: { id: string; appointmentId: string; appointment: { patientName: string } }) => {
    action.setError(null)
    setRecord({ diagnosis: '', prescription: '', notes: '' })
    setFinishing({ queueId: q.id, appointmentId: q.appointmentId, patient: q.appointment.patientName })
  }

  // Lưu hồ sơ bệnh án (nếu có nhập) rồi kết thúc lượt khám.
  const finish = async (withRecord: boolean) => {
    if (!finishing) return
    const ok = await action.run(async () => {
      if (withRecord)
        await post('/medical-records', {
          appointment_id: Number(finishing.appointmentId),
          diagnosis: record.diagnosis.trim(),
          prescription: record.prescription.trim(),
          ...(record.notes.trim() ? { notes: record.notes.trim() } : {}),
        })
      await patch(`/queues/${finishing.queueId}/status`, { status: 'done' })
    })
    if (ok) setFinishing(null)
  }

  return (
    <Async state={state}>
      {(items) => {
        const waiting = items
          .filter((q) => q.status === 'waiting' && q.appointment.status !== 'cancelled')
          .sort((a, b) => a.queueNumber - b.queueNumber)
        const current = items.find((q) => q.status === 'examining')
        const done = items.filter((q) => q.status === 'done')
        // Chỉ mời khám những lịch hẹn bác sĩ đã xác nhận.
        const next = waiting.find((q) => q.appointment.status === 'confirmed')

        return (
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-12 grid sm:grid-cols-3 gap-4">
              <CardBox className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-info/10 text-info flex items-center justify-center shrink-0">
                  <Icon icon="solar:users-group-two-rounded-linear" width={22} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Đang chờ</p>
                  <p className="text-xl font-bold">{waiting.length} người</p>
                </div>
              </CardBox>
              <CardBox className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-success/10 text-success flex items-center justify-center shrink-0">
                  <Icon icon="solar:check-circle-linear" width={22} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Đã khám xong</p>
                  <p className="text-xl font-bold">{done.length} người</p>
                </div>
              </CardBox>
              <CardBox className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-warning/10 text-warning flex items-center justify-center shrink-0">
                  <Icon icon="solar:clock-circle-linear" width={22} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">TB mỗi bệnh nhân</p>
                  <p className="text-xl font-bold">{AVG_MINUTES_PER_PATIENT} phút</p>
                </div>
              </CardBox>
            </div>

            <div className="col-span-12 lg:col-span-5">
              <CardBox>
                <h6 className="text-base font-semibold mb-1">Bệnh nhân đang khám</h6>
                <p className="text-sm text-muted-foreground mb-4">
                  Phòng khám hiện tại — {todayLocal()}
                </p>

                {current ? (
                  <div className="rounded-xl border border-primary/30 bg-lightprimary p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-11 h-11 rounded-full bg-primary text-white font-bold">
                          #{current.queueNumber}
                        </div>
                        <div>
                          <div className="font-semibold">{current.appointment.patientName}</div>
                          <div className="text-xs text-muted-foreground">{current.appointment.patientPhone}</div>
                        </div>
                      </div>
                      <StatusBadge status={current.status} />
                    </div>
                    <div className="text-sm text-muted-foreground mb-1">
                      {current.appointment.services.join(', ')}
                    </div>
                    <div className="text-sm bg-background/60 rounded-lg p-2">{current.appointment.symptom}</div>
                    <div className="flex gap-2 mt-4">
                      <Button disabled={action.busy} onClick={() => openFinish(current)}>
                        <Icon icon="solar:check-circle-linear" className="mr-1.5" />
                        Khám xong
                      </Button>
                      <Button variant="outline" disabled={action.busy} onClick={() => setStatus(current.id, 'absent')}>
                        Không đến
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed p-6 text-center text-muted-foreground">
                    <Icon icon="solar:bell-linear" width={28} className="mx-auto mb-2" />
                    Chưa mời bệnh nhân nào. Bấm &quot;Mời khám&quot; để bắt đầu.
                  </div>
                )}

                <div className="mt-4 flex flex-col gap-2">
                  <ActionError message={action.error} />
                  <Button
                    className="w-full"
                    disabled={action.busy || !!current || !next}
                    onClick={() => next && action.run(() => post('/queues/next', { doctor_id: doctorId }))}>
                    <Icon icon="solar:bell-linear" className="mr-1.5" />
                    Mời khám (STT #{next?.queueNumber ?? '-'})
                  </Button>
                  {!current && waiting.length > 0 && !next && (
                    <p className="text-xs text-muted-foreground text-center">
                      Cần xác nhận lịch hẹn trước khi mời khám.
                    </p>
                  )}
                </div>
              </CardBox>
            </div>

            <div className="col-span-12 lg:col-span-7">
              <CardBox>
                <PageHeader
                  title="Hàng đợi"
                  description={`Bệnh nhân được sắp xếp theo số thứ tự. Người không đến khi được gọi sẽ bị chuyển xuống cuối hàng; vắng ${MAX_ABSENT} lần thì lịch hẹn bị huỷ.`}
                />
                <div className="space-y-2">
                  {waiting.map((q, idx) => (
                    <div
                      key={q.id}
                      className={`flex items-center justify-between rounded-xl border p-3 transition-colors ${
                        q.id === next?.id ? 'border-primary/40 bg-primary/5' : 'border-border'
                      }`}>
                      <div className="flex items-center gap-3">
                        <Avatar className="w-9 h-9">
                          <AvatarFallback className={q.id === next?.id ? 'bg-primary text-white' : ''}>
                            {q.queueNumber}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium text-sm">{q.appointment.patientName}</div>
                          <div className="text-xs text-muted-foreground flex items-center gap-1">
                            {slotText(q.appointment)} · {q.appointment.services.join(', ') || '—'}
                            {q.absentCount > 0 && (
                              <Badge variant="lightError" className="text-[10px] px-1.5 py-0">
                                vắng {q.absentCount} lần
                              </Badge>
                            )}
                            {q.appointment.status === 'pending' && (
                              <Badge variant="lightWarning" className="text-[10px] px-1.5 py-0">
                                chờ xác nhận
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground shrink-0">
                        ~{idx * AVG_MINUTES_PER_PATIENT} phút nữa
                      </div>
                    </div>
                  ))}
                  {waiting.length === 0 && (
                    <div className="text-center text-muted-foreground py-10">
                      <Icon icon="solar:users-group-two-rounded-linear" width={32} className="mx-auto mb-2" />
                      Hàng đợi hiện đang trống
                    </div>
                  )}
                </div>
              </CardBox>
            </div>
            <Dialog open={!!finishing} onOpenChange={(o) => !o && setFinishing(null)}>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Hồ sơ bệnh án — {finishing?.patient}</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col gap-3">
                  <div>
                    <Label className="mb-1.5 block text-sm">Chẩn đoán</Label>
                    <Input value={record.diagnosis} onChange={(e) => setRecord({ ...record, diagnosis: e.target.value })} />
                  </div>
                  <div>
                    <Label className="mb-1.5 block text-sm">Đơn thuốc / chỉ định</Label>
                    <Textarea rows={3} value={record.prescription} onChange={(e) => setRecord({ ...record, prescription: e.target.value })} />
                  </div>
                  <div>
                    <Label className="mb-1.5 block text-sm">Ghi chú (tuỳ chọn)</Label>
                    <Textarea rows={2} value={record.notes} onChange={(e) => setRecord({ ...record, notes: e.target.value })} />
                  </div>
                  <ActionError message={action.error} />
                </div>
                <DialogFooter className="mt-2">
                  <Button variant="outline" disabled={action.busy} onClick={() => finish(false)}>
                    Kết thúc, không ghi bệnh án
                  </Button>
                  <Button
                    disabled={action.busy || !record.diagnosis.trim() || !record.prescription.trim()}
                    onClick={() => finish(true)}>
                    Lưu bệnh án &amp; kết thúc
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        )
      }}
    </Async>
  )
}
