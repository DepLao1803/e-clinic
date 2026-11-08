'use client'

import { useState } from 'react'
import CardBox from '@/app/components/shared/CardBox'
import PageHeader from '@/app/components/eclinic/PageHeader'
import StatusBadge from '@/app/components/eclinic/StatusBadge'
import { ActionError, Async } from '@/app/components/eclinic/ApiState'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import ImageUpload from '@/app/components/eclinic/ImageUpload'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { api, Paged, post } from '@/lib/eclinic/api'
import { RawSpecialty, toSpecialty } from '@/lib/eclinic/data'
import { useAction, useApi } from '@/lib/eclinic/use-api'
import type { Specialty } from '@/lib/eclinic/types'
import { Icon } from '@iconify/react'

const empty: { name: string; description: string; iconUrl?: string } = { name: '', description: '', iconUrl: undefined }

export default function SpecialtiesPage() {
  const state = useApi(async () => {
    const [list, trash] = await Promise.all([
      api<Paged<RawSpecialty>>('/admin/specialties?per_page=1000'),
      api<RawSpecialty[]>('/admin/specialties/trash'),
    ])
    return { active: list.data.map(toSpecialty), trashed: trash.map(toSpecialty) }
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
    if (!form.name.trim()) return
    const body = { name: form.name.trim(), description: form.description, icon_url: form.iconUrl ?? '' }
    const ok = await action.run(() =>
      editId ? post(`/admin/specialties/update/${editId}`, body) : post('/admin/specialties', body)
    )
    if (ok) resetForm()
  }

  const edit = (s: Specialty) => {
    setEditId(s.id)
    setForm({ name: s.name, description: s.description, iconUrl: s.iconUrl })
  }

  const act = (path: string) => () => action.run(() => post(path))

  return (
    <div className="grid grid-cols-12 gap-6">
      <div className="col-span-12 lg:col-span-4">
        <CardBox className="lg:sticky lg:top-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Icon icon={editId ? 'solar:pen-linear' : 'solar:add-circle-linear'} width={18} />
            </div>
            <h6 className="text-base font-semibold">
              {editId ? 'Sửa chuyên khoa' : 'Thêm chuyên khoa'}
            </h6>
          </div>
          <div className="flex flex-col gap-3">
            <ImageUpload
              value={form.iconUrl}
              onChange={(v) => setForm({ ...form, iconUrl: v })}
              shape="circle"
              size={72}
              label="Icon chuyên khoa"
              hint="Tuỳ chọn — JPG/PNG, tối đa 2MB. Nếu không chọn sẽ dùng icon mặc định."
              placeholderIcon="solar:medical-kit-linear"
            />
            <Input
              placeholder="Tên chuyên khoa"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <Input
              placeholder="Mô tả"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
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
                  title="Quản lý chuyên khoa"
                  description="Thêm, sửa, xoá, khôi phục, bật/tắt chuyên khoa của phòng khám."
                  action={
                    <Button variant="outline" onClick={() => setShowTrash((v) => !v)}>
                      <Icon icon="solar:trash-bin-2-linear" className="mr-1.5" width={16} />
                      {showTrash ? 'Xem danh sách' : `Thùng rác (${trashed.length})`}
                    </Button>
                  }
                />
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tên chuyên khoa</TableHead>
                      <TableHead>Mô tả</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead className="text-right">Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {visible.map((s) => (
                      <TableRow key={s.id} className="hover:bg-muted/40">
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {s.iconUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={s.iconUrl} alt={s.name} className="w-8 h-8 rounded-lg object-cover shrink-0" />
                            ) : (
                              <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                                <Icon icon="solar:medical-kit-linear" width={16} />
                              </div>
                            )}
                            {s.name}
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{s.description}</TableCell>
                        <TableCell>
                          <StatusBadge status={s.status} />
                        </TableCell>
                        <TableCell className="text-right space-x-1">
                          {showTrash ? (
                            <>
                              <Button size="sm" variant="outline" disabled={action.busy} onClick={act(`/admin/specialties/restore/${s.id}`)}>
                                Khôi phục
                              </Button>
                              <Button size="sm" variant="destructive" disabled={action.busy} onClick={act(`/admin/specialties/forceDelete/${s.id}`)}>
                                Xoá hẳn
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button size="sm" variant="outline" disabled={action.busy} onClick={act(`/admin/specialties/toggleStatus/${s.id}`)}>
                                {s.status === 'active' ? 'Tắt' : 'Bật'}
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => edit(s)}>
                                Sửa
                              </Button>
                              <Button size="sm" variant="destructive" disabled={action.busy} onClick={act(`/admin/specialties/destroy/${s.id}`)}>
                                Xoá
                              </Button>
                            </>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                    {visible.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
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
      </div>
    </div>
  )
}
