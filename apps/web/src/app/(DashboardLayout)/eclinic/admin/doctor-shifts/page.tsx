'use client'

import { useState } from 'react'
import CardBox from '@/app/components/shared/CardBox'
import PageHeader from '@/app/components/eclinic/PageHeader'
import StatusBadge from '@/app/components/eclinic/StatusBadge'
import { ActionError, Async } from '@/app/components/eclinic/ApiState'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { api, Paged, post } from '@/lib/eclinic/api'
import { RawDoctorSchedule, toShift } from '@/lib/eclinic/data'
import { useAction, useApi } from '@/lib/eclinic/use-api'
import { initial, slotText, todayLocal } from '@/lib/eclinic/types'
import { Icon } from '@iconify/react'

type Filter = 'all' | 'pending' | 'approved' | 'rejected'
const FILTERS: Record<Filter, string> = { all: 'Tất cả', pending: 'Chờ duyệt', approved: 'Đã duyệt', rejected: 'Từ chối' }

export default function DoctorShiftsPage() {
  const state = useApi(async () => {
    const res = await api<Paged<RawDoctorSchedule>>('/admin/doctor-schedules?per_page=1000')
    return res.data.map(toShift)
  })
  const [filter, setFilter] = useState<Filter>('all')
  const [upcomingOnly, setUpcomingOnly] = useState(true)
  const action = useAction(state.reload)
  const today = todayLocal()

  return (
    <Async state={state}>
      {(items) => {
        const scoped = items.filter((i) => !upcomingOnly || i.date >= today)
        const pendingCount = scoped.filter((i) => i.status === 'pending').length
        const visible = scoped
          .filter((i) => (filter === 'all' ? true : i.status === filter))
          .sort((a, b) => (a.date === b.date ? a.slotStart.localeCompare(b.slotStart) : a.date.localeCompare(b.date)))
        return (
          <CardBox>
            <PageHeader
              title="Duyệt lịch trực bác sĩ"
              description={`Bác sĩ đăng ký lịch trực, quản trị duyệt trước khi bệnh nhân có thể đặt lịch. Đang chờ duyệt: ${pendingCount}.`}
              action={
                <div className="flex gap-2 flex-wrap">
                  {(Object.keys(FILTERS) as Filter[]).map((f) => (
                    <Button
                      key={f}
                      size="sm"
                      variant={filter === f ? 'default' : 'outline'}
                      onClick={() => setFilter(f)}>
                      {FILTERS[f]}
                    </Button>
                  ))}
                  <Button size="sm" variant="ghost" onClick={() => setUpcomingOnly((v) => !v)}>
                    {upcomingOnly ? 'Hiện cả ca đã qua' : 'Chỉ ca sắp tới'}
                  </Button>
                </div>
              }
            />
            <div className="mb-3">
              <ActionError message={action.error} />
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bác sĩ</TableHead>
                  <TableHead>Ngày trực</TableHead>
                  <TableHead>Ca</TableHead>
                  <TableHead>Phòng</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.map((r) => (
                  <TableRow key={r.id} className="hover:bg-muted/40">
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className="text-xs">{initial(r.doctorName)}</AvatarFallback>
                        </Avatar>
                        {r.doctorName}
                      </div>
                    </TableCell>
                    <TableCell>{r.date}</TableCell>
                    <TableCell>{slotText(r)}</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-1 text-muted-foreground">
                        <Icon icon="solar:door-linear" width={14} />
                        {r.clinicRoom || '—'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={r.status} />
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      {r.status === 'pending' && (
                        <>
                          <Button size="sm" disabled={action.busy} onClick={() => action.run(() => post(`/admin/doctor-schedules/${r.id}/approve`))}>
                            Duyệt
                          </Button>
                          <Button size="sm" variant="destructive" disabled={action.busy} onClick={() => action.run(() => post(`/admin/doctor-schedules/${r.id}/reject`))}>
                            Từ chối
                          </Button>
                        </>
                      )}
                      {r.status !== 'pending' && (
                        <Button size="sm" variant="outline" disabled={action.busy} onClick={() => action.run(() => post(`/admin/doctor-schedules/destroy/${r.id}`))}>
                          Xoá
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {visible.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      Không có dữ liệu
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardBox>
        )
      }}
    </Async>
  )
}
