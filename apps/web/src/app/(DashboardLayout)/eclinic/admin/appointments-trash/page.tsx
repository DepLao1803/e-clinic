'use client'

import CardBox from '@/app/components/shared/CardBox'
import PageHeader from '@/app/components/eclinic/PageHeader'
import StatusBadge from '@/app/components/eclinic/StatusBadge'
import { ActionError, Async } from '@/app/components/eclinic/ApiState'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { post } from '@/lib/eclinic/api'
import { RawAppointment, toAppointment } from '@/lib/eclinic/data'
import { useAction, useApi } from '@/lib/eclinic/use-api'

/** Lịch hẹn bị bệnh nhân xoá vào thùng rác: POST /admin/appointments/trash · khôi phục /appointments/:id/restore · xoá vĩnh viễn. */
export default function AdminAppointmentsTrashPage() {
  const state = useApi(async () => (await post<RawAppointment[]>('/admin/appointments/trash')).map(toAppointment))
  const action = useAction(state.reload)

  const restore = (id: string) => action.run(() => post(`/appointments/${id}/restore`))
  const destroy = (id: string) => {
    if (!window.confirm('Xoá vĩnh viễn lịch hẹn này? Không thể hoàn tác.')) return
    action.run(() => post(`/admin/appointments/forceDelete/${id}`))
  }

  return (
    <CardBox>
      <PageHeader title="Lịch hẹn đã xoá" description="Các lịch hẹn nằm trong thùng rác — có thể khôi phục (nếu ngày khám chưa qua và ca còn trống) hoặc xoá vĩnh viễn." />
      <ActionError message={action.error} />
      <Async state={state}>
        {(items) => (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Bệnh nhân</TableHead>
                <TableHead>Bác sĩ</TableHead>
                <TableHead>Ngày · ca</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((a) => (
                <TableRow key={a.id}>
                  <TableCell>{a.patientName}</TableCell>
                  <TableCell>{a.doctorName}</TableCell>
                  <TableCell>{a.date} · {a.slotStart}–{a.slotEnd}</TableCell>
                  <TableCell><StatusBadge status={a.status} /></TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-2 justify-end">
                      <Button size="sm" variant="outline" disabled={action.busy} onClick={() => restore(a.id)}>Khôi phục</Button>
                      <Button size="sm" variant="destructive" disabled={action.busy} onClick={() => destroy(a.id)}>Xoá vĩnh viễn</Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {items.length === 0 && (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-10">Thùng rác trống</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </Async>
    </CardBox>
  )
}
