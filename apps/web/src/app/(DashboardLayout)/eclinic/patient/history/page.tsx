'use client'

import CardBox from '@/app/components/shared/CardBox'
import PageHeader from '@/app/components/eclinic/PageHeader'
import StatusBadge from '@/app/components/eclinic/StatusBadge'
import { ActionError, Async } from '@/app/components/eclinic/ApiState'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { api, del, patch, post } from '@/lib/eclinic/api'
import { RawAppointment, RawMedicalRecord, toAppointment, toMedicalRecord } from '@/lib/eclinic/data'
import { useAction, useApi } from '@/lib/eclinic/use-api'
import { initial } from '@/lib/eclinic/types'
import { Icon } from '@iconify/react'

export default function PatientHistoryPage() {
  const state = useApi(async () => {
    const [appts, records, trashed] = await Promise.all([
      api<RawAppointment[]>('/appointments'),
      api<RawMedicalRecord[]>('/medical-records/my'),
      api<RawAppointment[]>('/appointments/my-trash'),
    ])
    return {
      trashed: trashed.map(toAppointment),
      items: appts.map(toAppointment).sort((a, b) => b.date.localeCompare(a.date)),
      records: records.map(toMedicalRecord),
    }
  })

  const action = useAction(() => state.reload())
  const today = new Date().toLocaleDateString('en-CA') // YYYY-MM-DD, local time
  const remove = (id: string) => {
    if (!window.confirm('Xoá lịch hẹn này khỏi lịch sử? Bạn có thể khôi phục trong mục "Đã xoá".')) return
    action.run(() => del(`/appointments/${id}/destroy`))
  }
  const restore = (id: string) => action.run(() => post(`/appointments/${id}/restore`))
  const cancel = (id: string) => {
    if (!window.confirm('Bạn chắc chắn muốn huỷ lịch hẹn này?')) return
    action.run(() => patch(`/appointments/${id}/cancel`))
  }

  return (
    <CardBox className="max-w-3xl mx-auto">
      <PageHeader
        title="Hồ sơ khám bệnh"
        description="Lịch sử các lần đặt lịch và khám bệnh của bạn."
      />
      <ActionError message={action.error} />
      <Async state={state}>
        {({ items, records, trashed }) => (
          <div className="flex flex-col">
            {items.map((a, idx) => (
              <div key={a.id} className="flex gap-4">
                {/* Timeline rail */}
                <div className="flex flex-col items-center">
                  <Avatar className="w-10 h-10">
                    <AvatarFallback>{initial(a.doctorName)}</AvatarFallback>
                  </Avatar>
                  {idx < items.length - 1 && <div className="w-px flex-1 bg-border my-1" />}
                </div>
                {/* Content */}
                <div className="flex-1 pb-6">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <p className="font-semibold text-sm">{a.doctorName}</p>
                    <StatusBadge status={a.status} />
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">
                    {a.date} · {a.specialtyName || 'Chưa rõ chuyên khoa'} · {a.services.join(', ') || 'Chưa chọn dịch vụ'}
                  </p>
                  <p className="text-sm bg-muted/50 rounded-lg p-2.5">{a.symptom || 'Không ghi triệu chứng'}</p>
                  {a.status === 'cancelled' && (
                    <Button size="sm" variant="ghost" className="mt-2" disabled={action.busy} onClick={() => remove(a.id)}>
                      <Icon icon="solar:trash-bin-trash-linear" width={16} className="mr-1.5" />
                      Xoá khỏi lịch sử
                    </Button>
                  )}
                  {(a.status === 'pending' || a.status === 'confirmed') && a.date >= today && (
                    <Button size="sm" variant="outline" className="mt-2" disabled={action.busy} onClick={() => cancel(a.id)}>
                      <Icon icon="solar:close-circle-linear" width={16} className="mr-1.5" />
                      Huỷ lịch hẹn
                    </Button>
                  )}
                  {records
                    .filter((r) => r.appointmentId === a.id)
                    .map((r) => (
                      <div key={r.id} className="mt-2 text-sm rounded-lg border border-success/30 bg-success/5 p-2.5">
                        <p className="font-medium flex items-center gap-1.5">
                          <Icon icon="solar:clipboard-check-linear" width={16} /> Kết quả khám
                        </p>
                        <p className="mt-1"><span className="text-muted-foreground">Chẩn đoán:</span> {r.diagnosis}</p>
                        <p><span className="text-muted-foreground">Đơn thuốc / chỉ định:</span> {r.prescription}</p>
                        {r.notes && <p><span className="text-muted-foreground">Ghi chú:</span> {r.notes}</p>}
                      </div>
                    ))}
                </div>
              </div>
            ))}
            {trashed.length > 0 && (
              <div className="mt-4 border-t border-border pt-4">
                <p className="text-sm font-semibold mb-2">Đã xoá ({trashed.length})</p>
                {trashed.map((t) => (
                  <div key={t.id} className="flex items-center justify-between gap-3 text-sm py-1.5">
                    <span className="text-muted-foreground">{t.date} · {t.doctorName} · {t.specialtyName || 'Chưa rõ chuyên khoa'}</span>
                    <Button size="sm" variant="outline" disabled={action.busy} onClick={() => restore(t.id)}>Khôi phục</Button>
                  </div>
                ))}
              </div>
            )}
            {items.length === 0 && (
              <div className="text-center text-muted-foreground py-12">
                <Icon icon="solar:clipboard-text-linear" width={32} className="mx-auto mb-2" />
                Chưa có lịch sử khám bệnh
              </div>
            )}
          </div>
        )}
      </Async>
    </CardBox>
  )
}
