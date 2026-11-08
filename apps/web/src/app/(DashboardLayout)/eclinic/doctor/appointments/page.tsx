'use client'

import CardBox from '@/app/components/shared/CardBox'
import PageHeader from '@/app/components/eclinic/PageHeader'
import StatusBadge from '@/app/components/eclinic/StatusBadge'
import { ActionError, Async, NoDoctorProfile } from '@/app/components/eclinic/ApiState'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Icon } from '@iconify/react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { api, patch } from '@/lib/eclinic/api'
import { RawAppointment, toAppointment } from '@/lib/eclinic/data'
import { useAuth } from '@/lib/eclinic/auth'
import { useAction, useApi } from '@/lib/eclinic/use-api'
import { slotText } from '@/lib/eclinic/types'

export default function DoctorAppointmentsPage() {
  const { user } = useAuth()
  const doctorId = user?.doctor_id
  const state = useApi(async () => {
    if (!doctorId) return []
    return (await api<RawAppointment[]>('/appointments/doctor')).map(toAppointment)
  }, [doctorId])
  const action = useAction(state.reload)

  if (!doctorId) return <NoDoctorProfile />

  const confirm = (appointmentId: string) => action.run(() => patch(`/appointments/${appointmentId}/confirm`))
  const reject = (appointmentId: string) => action.run(() => patch(`/appointments/${appointmentId}/reject`))

  return (
    <Async state={state}>
      {(items) => {
        const pending = items.filter((a) => a.status === 'pending').sort((a, b) => a.date.localeCompare(b.date))
        const others = items.filter((a) => a.status !== 'pending')
        return (
          <div className="flex flex-col gap-6">
            <CardBox>
              <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
                <PageHeader
                  title="Lịch hẹn chờ xác nhận"
                  description="Đọc triệu chứng và xác nhận lịch hẹn hợp lệ trước khi khám, giúp tránh bị phá bằng các lượt đặt ảo."
                />
                {pending.length > 0 && (
                  <span className="flex items-center gap-1.5 text-sm font-semibold text-warning bg-warning/10 rounded-full px-3 py-1.5 shrink-0">
                    <Icon icon="solar:bell-bold" width={16} />
                    {pending.length} lịch hẹn mới
                  </span>
                )}
              </div>
              <div className="mb-3">
                <ActionError message={action.error} />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                {pending.map((a) => {
                  return (
                    <div key={a.id} className="rounded-xl border border-border p-4 flex flex-col gap-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={a.patientAvatar} alt={a.patientName} />
                          <AvatarFallback>{a.patientName?.[0]}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-sm truncate">{a.patientName}</p>
                          <p className="text-xs text-muted-foreground truncate">{a.patientPhone}</p>
                        </div>
                        <span className="text-xs text-muted-foreground text-right shrink-0">
                          {a.date}
                          <br />
                          {slotText(a)}
                        </span>
                      </div>
                      <p className="text-sm bg-muted/50 rounded-lg p-2.5">{a.symptom || 'Không ghi triệu chứng'}</p>
                      <div className="flex gap-2">
                        <Button size="sm" className="flex-1" disabled={action.busy} onClick={() => confirm(a.id)}>
                          <Icon icon="solar:check-circle-linear" className="mr-1" width={16} />
                          Xác nhận
                        </Button>
                        <Button size="sm" variant="destructive" className="flex-1" disabled={action.busy} onClick={() => reject(a.id)}>
                          <Icon icon="solar:close-circle-linear" className="mr-1" width={16} />
                          Từ chối
                        </Button>
                      </div>
                    </div>
                  )
                })}
                {pending.length === 0 && (
                  <div className="md:col-span-2 text-center text-muted-foreground py-10">
                    <Icon icon="solar:clipboard-check-linear" width={32} className="mx-auto mb-2" />
                    Không có lịch hẹn nào đang chờ xác nhận
                  </div>
                )}
              </div>
            </CardBox>

            <CardBox>
              <PageHeader title="Lịch sử xử lý" />
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Bệnh nhân</TableHead>
                    <TableHead>Dịch vụ</TableHead>
                    <TableHead>Thời gian</TableHead>
                    <TableHead>Trạng thái</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {others.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="w-7 h-7">
                            <AvatarImage src={a.patientAvatar} alt={a.patientName} />
                            <AvatarFallback className="text-xs">{a.patientName?.[0]}</AvatarFallback>
                          </Avatar>
                          {a.patientName}
                        </div>
                      </TableCell>
                      <TableCell>{a.services.join(', ') || '—'}</TableCell>
                      <TableCell>{a.date} · {slotText(a)}</TableCell>
                      <TableCell>
                        <StatusBadge status={a.status} />
                      </TableCell>
                    </TableRow>
                  ))}
                  {others.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                        Chưa có lịch sử xử lý
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardBox>
          </div>
        )
      }}
    </Async>
  )
}
