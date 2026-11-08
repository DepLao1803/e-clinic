'use client'

import { useState } from 'react'
import CardBox from '@/app/components/shared/CardBox'
import PageHeader from '@/app/components/eclinic/PageHeader'
import StatusBadge from '@/app/components/eclinic/StatusBadge'
import { ActionError, Async } from '@/app/components/eclinic/ApiState'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { api, del, post, put } from '@/lib/eclinic/api'
import { RawSchedule, toSlots } from '@/lib/eclinic/data'
import { useAction, useApi } from '@/lib/eclinic/use-api'
import type { ScheduleSlot } from '@/lib/eclinic/types'
import { Icon } from '@iconify/react'

const empty = { label: '', start: '', end: '' }

export default function ScheduleSlotsPage() {
  const state = useApi(async () => {
    const [list, trash] = await Promise.all([
      api<RawSchedule[]>('/admin/schedules'),
      api<RawSchedule[]>('/admin/schedules/trash'),
    ])
    return { active: toSlots(list), trashed: toSlots(trash, false) }
  })
  const [showTrash, setShowTrash] = useState(false)
  const [form, setForm] = useState(empty)
  const [editId, setEditId] = useState<string | null>(null)
  const action = useAction(state.reload)

  const resetForm = () => {
    setForm(empty)
    setEditId(null)
  }

  const submit = async () => {
    if (!form.start || !form.end) return
    const body = { start_at: form.start, end_at: form.end, label: form.label.trim() }
    const ok = await action.run(() =>
      editId ? put(`/admin/schedules/${editId}`, body) : post('/admin/schedules', body)
    )
    if (ok) resetForm()
  }

  const edit = (s: ScheduleSlot) => {
    setEditId(s.id)
    setForm({ label: s.label, start: s.start, end: s.end })
  }

  const act = (fn: () => Promise<unknown>) => () => action.run(fn)

  return (
    <div className="grid grid-cols-12 gap-6">
      <div className="col-span-12 lg:col-span-4">
        <CardBox className="lg:sticky lg:top-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Icon icon={editId ? 'solar:pen-linear' : 'solar:add-circle-linear'} width={18} />
            </div>
            <h6 className="text-base font-semibold">
              {editId ? 'Sửa ca khám' : 'Thêm ca khám'}
            </h6>
          </div>
          <div className="flex flex-col gap-3">
            <Input
              placeholder="Tên ca (VD: Ca sáng 1) — bỏ trống để tự đặt"
              value={form.label}
              onChange={(e) => setForm({ ...form, label: e.target.value })}
            />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Bắt đầu</label>
                <Input
                  type="time"
                  value={form.start}
                  onChange={(e) => setForm({ ...form, start: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Kết thúc</label>
                <Input
                  type="time"
                  value={form.end}
                  onChange={(e) => setForm({ ...form, end: e.target.value })}
                />
              </div>
            </div>
            <ActionError message={action.error} />
            <div className="flex gap-2">
              <Button onClick={submit} disabled={action.busy} className="w-full">
                {editId ? 'Lưu thay đổi' : 'Thêm mới'}
              </Button>
              {editId && (
                <Button variant="outline" onClick={resetForm}>
                  Huỷ
                </Button>
              )}
            </div>
          </div>
        </CardBox>
      </div>

      <div className="col-span-12 lg:col-span-8">
        <Async state={state}>
          {({ active, trashed }) => {
            const visible = showTrash ? trashed : active
            return (
              <CardBox>
                <PageHeader
                  title="Quản lý ca khám"
                  description="Các khung giờ khám cố định của phòng khám. Ca bị tắt sẽ không còn cho bác sĩ đăng ký trực."
                  action={
                    <Button variant="outline" onClick={() => setShowTrash((v) => !v)}>
                      <Icon icon="solar:trash-bin-2-linear" className="mr-1.5" width={16} />
                      {showTrash ? 'Xem danh sách' : `Thùng rác (${trashed.length})`}
                    </Button>
                  }
                />
                <div className="grid sm:grid-cols-2 gap-3">
                  {visible.map((s) => (
                    <div key={s.id} className="rounded-xl border border-border p-4 flex flex-col gap-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                            <Icon icon="solar:clock-square-linear" width={20} />
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-sm">{s.label}</p>
                            <p className="text-xs text-muted-foreground">{s.start} - {s.end}</p>
                          </div>
                        </div>
                        <StatusBadge status={s.status} />
                      </div>
                      <div className="flex items-center gap-1.5 justify-end border-t border-border pt-2">
                        {showTrash ? (
                          <>
                            <Button size="sm" variant="outline" disabled={action.busy} onClick={act(() => post(`/admin/schedules/${s.id}/restore`))}>
                              Khôi phục
                            </Button>
                            <Button size="sm" variant="destructive" disabled={action.busy} onClick={act(() => post(`/admin/schedules/${s.id}/forceDelete`))}>
                              Xoá hẳn
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button size="sm" variant="outline" disabled={action.busy} onClick={act(() => post(`/admin/schedules/${s.id}/toggle`))}>
                              {s.status === 'active' ? 'Tắt' : 'Bật'}
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => edit(s)}>
                              Sửa
                            </Button>
                            <Button size="sm" variant="destructive" disabled={action.busy} onClick={act(() => del(`/admin/schedules/${s.id}`))}>
                              Xoá
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                  {visible.length === 0 && (
                    <div className="sm:col-span-2 text-center text-muted-foreground py-10">
                      Không có dữ liệu
                    </div>
                  )}
                </div>
              </CardBox>
            )
          }}
        </Async>
      </div>
    </div>
  )
}
