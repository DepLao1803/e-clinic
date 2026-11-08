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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { api, Paged, post } from '@/lib/eclinic/api'
import { RawService, RawSpecialty, toService, toSpecialty } from '@/lib/eclinic/data'
import { useAction, useApi } from '@/lib/eclinic/use-api'
import { currency, type Service } from '@/lib/eclinic/types'
import { Icon } from '@iconify/react'

const empty: { specialtyId: string; name: string; price: string; durationMinutes: string; iconUrl?: string } = {
  specialtyId: '', name: '', price: '', durationMinutes: '', iconUrl: undefined,
}

export default function ServicesPage() {
  const state = useApi(async () => {
    const [list, trash, specs] = await Promise.all([
      api<Paged<RawService>>('/admin/medical-services?per_page=1000'),
      api<RawService[]>('/admin/medical-services/trash'),
      api<Paged<RawSpecialty>>('/admin/specialties?per_page=1000'),
    ])
    return {
      active: list.data.map(toService),
      trashed: trash.map(toService),
      specialties: specs.data.map(toSpecialty),
    }
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
    if (!form.name.trim() || !form.specialtyId) return
    const body = {
      specialty_id: Number(form.specialtyId),
      name: form.name.trim(),
      price: Number(form.price) || 0,
      duration_minutes: Number(form.durationMinutes) || 30,
      icon_url: form.iconUrl ?? '',
    }
    const ok = await action.run(() =>
      editId ? post(`/admin/medical-services/update/${editId}`, body) : post('/admin/medical-services', body)
    )
    if (ok) resetForm()
  }

  const edit = (s: Service) => {
    setEditId(s.id)
    setForm({ specialtyId: s.specialtyId, name: s.name, price: String(s.price), durationMinutes: String(s.durationMinutes), iconUrl: s.iconUrl })
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
              {editId ? 'Sửa dịch vụ' : 'Thêm dịch vụ'}
            </h6>
          </div>
          <div className="flex flex-col gap-3">
            <ImageUpload
              value={form.iconUrl}
              onChange={(v) => setForm({ ...form, iconUrl: v })}
              shape="square"
              size={88}
              label="Ảnh minh hoạ dịch vụ"
              hint="Tuỳ chọn — JPG/PNG, tối đa 2MB."
              placeholderIcon="solar:clipboard-list-linear"
            />
            <Select
              value={form.specialtyId}
              onValueChange={(v) => setForm({ ...form, specialtyId: v })}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Chọn chuyên khoa" />
              </SelectTrigger>
              <SelectContent>
                {(state.data?.specialties ?? []).map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              placeholder="Tên dịch vụ"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <Input
              placeholder="Giá (VNĐ)"
              type="number"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
            />
            <Input
              placeholder="Thời lượng (phút)"
              type="number"
              value={form.durationMinutes}
              onChange={(e) => setForm({ ...form, durationMinutes: e.target.value })}
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
                  title="Quản lý dịch vụ"
                  description="Dịch vụ trực thuộc từng chuyên khoa, ví dụ: Nhổ răng - Răng Hàm Mặt."
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
                      <TableHead>Dịch vụ</TableHead>
                      <TableHead>Chuyên khoa</TableHead>
                      <TableHead>Giá</TableHead>
                      <TableHead>Thời lượng</TableHead>
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
                              <div className="w-8 h-8 rounded-lg bg-secondary/10 text-secondary flex items-center justify-center shrink-0">
                                <Icon icon="solar:clipboard-list-linear" width={16} />
                              </div>
                            )}
                            {s.name}
                          </div>
                        </TableCell>
                        <TableCell>
                          {s.specialtyName || state.data?.specialties.find((x) => x.id === s.specialtyId)?.name}
                        </TableCell>
                        <TableCell className="font-medium">{currency(s.price)}</TableCell>
                        <TableCell className="text-muted-foreground">{s.durationMinutes} phút</TableCell>
                        <TableCell>
                          <StatusBadge status={s.status} />
                        </TableCell>
                        <TableCell className="text-right space-x-1">
                          {showTrash ? (
                            <>
                              <Button size="sm" variant="outline" disabled={action.busy} onClick={act(`/admin/medical-services/restore/${s.id}`)}>
                                Khôi phục
                              </Button>
                              <Button size="sm" variant="destructive" disabled={action.busy} onClick={act(`/admin/medical-services/forceDelete/${s.id}`)}>
                                Xoá hẳn
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button size="sm" variant="outline" disabled={action.busy} onClick={act(`/admin/medical-services/toggleStatus/${s.id}`)}>
                                {s.status === 'active' ? 'Tắt' : 'Bật'}
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => edit(s)}>
                                Sửa
                              </Button>
                              <Button size="sm" variant="destructive" disabled={action.busy} onClick={act(`/admin/medical-services/destroy/${s.id}`)}>
                                Xoá
                              </Button>
                            </>
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
      </div>
    </div>
  )
}
