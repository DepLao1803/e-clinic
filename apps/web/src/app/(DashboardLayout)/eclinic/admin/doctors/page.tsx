'use client'

import { useState } from 'react'
import CardBox from '@/app/components/shared/CardBox'
import PageHeader from '@/app/components/eclinic/PageHeader'
import StatusBadge from '@/app/components/eclinic/StatusBadge'
import ImageUpload from '@/app/components/eclinic/ImageUpload'
import { ActionError, Async } from '@/app/components/eclinic/ApiState'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { api, post, put, Paged } from '@/lib/eclinic/api'
import { loadDoctorDirectory, RawSpecialty, toSpecialty } from '@/lib/eclinic/data'
import { useAction, useApi } from '@/lib/eclinic/use-api'
import { currency, initial, type Doctor } from '@/lib/eclinic/types'
import { Icon } from '@iconify/react'

const emptyForm = {
  name: '', code: '', title: '', clinicRoom: '', price: '', phone: '', email: '', password: '',
  biography: '', specialtyIds: [] as string[], avatar: undefined as string | undefined,
}

export default function DoctorsPage() {
  const state = useApi(async () => {
    const [doctors, specs] = await Promise.all([
      loadDoctorDirectory(),
      api<Paged<RawSpecialty>>('/admin/specialties?per_page=1000'),
    ])
    return { doctors, specialties: specs.data.map(toSpecialty).filter((s) => s.status !== 'trashed') }
  })
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const [edit, setEdit] = useState<Doctor | null>(null)
  const [form, setForm] = useState(emptyForm)
  const action = useAction(state.reload)

  const toggleActive = (d: Doctor) => action.run(() => post(`/admin/user/toggleStatus/${d.userId}`))

  const openAdd = () => {
    action.setError(null)
    setEdit(null)
    setForm(emptyForm)
    setOpen(true)
  }

  const openEdit = (d: Doctor) => {
    action.setError(null)
    setEdit(d)
    setForm({
      name: d.name, code: d.code, title: d.title, clinicRoom: d.clinicRoom, price: String(d.price),
      phone: d.phone, email: d.email, password: '', biography: d.biography,
      specialtyIds: d.specialtyIds, avatar: d.avatar,
    })
    setOpen(true)
  }

  const toggleSpecialty = (id: string) =>
    setForm((f) => ({
      ...f,
      specialtyIds: f.specialtyIds.includes(id) ? f.specialtyIds.filter((x) => x !== id) : [...f.specialtyIds, id],
    }))

  const submit = async () => {
    if (!form.name.trim()) return
    const common = {
      name: form.name.trim(),
      title: form.title.trim(),
      clinic_room: form.clinicRoom.trim(),
      price: Number(form.price) || 0,
      biography: form.biography,
      specialty_ids: form.specialtyIds.map(Number),
      ...(form.phone.trim() ? { phone: form.phone.trim() } : {}),
      ...(form.email.trim() ? { email: form.email.trim() } : {}),
      ...(form.avatar ? { avatar_url: form.avatar } : {}),
    }
    const ok = await action.run(() =>
      edit
        ? put(`/admin/doctors/${edit.id}`, common)
        : post('/admin/doctors', { ...common, employee_code: form.code.trim(), password: form.password })
    )
    if (ok) setOpen(false)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <PageHeader
          title="Danh sách bác sĩ"
          description="Quản trị có thể thêm, sửa thông tin, gán chuyên khoa và khoá/mở tài khoản bác sĩ."
        />
        <div className="flex items-center gap-2 shrink-0">
          <div className="relative">
            <Icon
              icon="solar:magnifer-linear"
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              className="pl-8 w-56"
              placeholder="Tìm theo tên hoặc mã NV..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <Button onClick={openAdd}>
            <Icon icon="solar:user-plus-linear" width={16} className="mr-1.5" />
            Thêm bác sĩ
          </Button>
        </div>
      </div>

      {!open && <ActionError message={action.error} />}

      <Async state={state}>
        {({ doctors, specialties }) => {
          const visible = doctors.filter(
            (d) =>
              d.name.toLowerCase().includes(q.toLowerCase()) ||
              d.code.toLowerCase().includes(q.toLowerCase())
          )
          return (
            <>
              <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {visible.map((d) => (
                  <CardBox key={d.id} className="relative">
                    <div className="absolute top-4 right-4">
                      <StatusBadge status={d.status} />
                    </div>
                    <div className="flex flex-col items-center text-center">
                      <Avatar className="w-16 h-16 mb-3">
                        <AvatarImage src={d.avatar} alt={d.name} />
                        <AvatarFallback className="text-lg">{initial(d.name)}</AvatarFallback>
                      </Avatar>
                      <p className="font-semibold">{d.name}</p>
                      <p className="text-xs text-muted-foreground mb-1">Mã NV: {d.code || '—'}{d.title ? ` · ${d.title}` : ''}</p>
                      <p className="text-sm text-primary font-medium mb-2">
                        {d.specialtyNames.join(', ') || 'Chưa gán chuyên khoa'}
                      </p>
                      <div className="flex items-center gap-1 text-sm text-warning mb-4">
                        <Icon icon="solar:star-bold" width={16} />
                        {d.ratingAvg.toFixed(1)}
                        <span className="text-muted-foreground">({d.ratingCount} đánh giá)</span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5 text-sm text-muted-foreground border-t border-border pt-3">
                      <div className="flex items-center gap-2">
                        <Icon icon="solar:phone-linear" width={15} />
                        {d.phone || '—'}
                      </div>
                      <div className="flex items-center gap-2 truncate">
                        <Icon icon="solar:letter-linear" width={15} />
                        {d.email || '—'}
                      </div>
                      <div className="flex items-center gap-2">
                        <Icon icon="solar:door-linear" width={15} />
                        {d.clinicRoom ? `Phòng ${d.clinicRoom}` : '—'} · {currency(d.price)}
                      </div>
                    </div>

                    <div className="flex gap-2 mt-4">
                      <Button size="sm" variant="outline" className="flex-1" onClick={() => openEdit(d)}>
                        <Icon icon="solar:pen-linear" width={14} className="mr-1" />
                        Sửa
                      </Button>
                      <Button
                        size="sm"
                        variant={d.status === 'active' ? 'outline' : 'default'}
                        className="flex-1"
                        disabled={action.busy || !d.userId}
                        onClick={() => toggleActive(d)}
                      >
                        <Icon icon={d.status === 'active' ? 'solar:lock-linear' : 'solar:lock-unlocked-linear'} className="mr-1" width={14} />
                        {d.status === 'active' ? 'Khoá' : 'Mở khoá'}
                      </Button>
                    </div>
                  </CardBox>
                ))}
                {visible.length === 0 && (
                  <div className="sm:col-span-2 xl:col-span-3 text-center text-muted-foreground py-12">
                    Không tìm thấy bác sĩ phù hợp
                  </div>
                )}
              </div>

              <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{edit ? 'Sửa thông tin bác sĩ' : 'Thêm bác sĩ mới'}</DialogTitle>
                  </DialogHeader>
                  <div className="flex flex-col gap-3">
                    <ImageUpload
                      value={form.avatar}
                      onChange={(v) => setForm({ ...form, avatar: v })}
                      shape="circle"
                      size={80}
                      label="Ảnh đại diện"
                      hint="JPG/PNG, tối đa 2MB"
                      placeholderIcon="solar:user-linear"
                    />
                    <div>
                      <Label className="mb-1.5 block text-sm">Họ tên</Label>
                      <Input
                        placeholder="VD: Nguyễn Văn A"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="mb-1.5 block text-sm">Mã nhân viên</Label>
                        <Input
                          placeholder="VD: BS001"
                          disabled={!!edit}
                          className={edit ? 'opacity-70' : ''}
                          value={form.code}
                          onChange={(e) => setForm({ ...form, code: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label className="mb-1.5 block text-sm">Chức danh</Label>
                        <Input
                          placeholder="VD: Bác sĩ CKI"
                          value={form.title}
                          onChange={(e) => setForm({ ...form, title: e.target.value })}
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="mb-1.5 block text-sm">Chuyên khoa</Label>
                      <div className="flex flex-wrap gap-2">
                        {specialties.map((s) => (
                          <Button
                            key={s.id}
                            type="button"
                            size="sm"
                            variant={form.specialtyIds.includes(s.id) ? 'default' : 'outline'}
                            onClick={() => toggleSpecialty(s.id)}>
                            {s.name}
                          </Button>
                        ))}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="mb-1.5 block text-sm">Phòng khám</Label>
                        <Input
                          placeholder="VD: P101"
                          value={form.clinicRoom}
                          onChange={(e) => setForm({ ...form, clinicRoom: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label className="mb-1.5 block text-sm">Giá khám (VNĐ)</Label>
                        <Input
                          type="number"
                          value={form.price}
                          onChange={(e) => setForm({ ...form, price: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="mb-1.5 block text-sm">Số điện thoại</Label>
                        <Input
                          placeholder="10 chữ số"
                          value={form.phone}
                          onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label className="mb-1.5 block text-sm">Email</Label>
                        <Input
                          type="email"
                          value={form.email}
                          onChange={(e) => setForm({ ...form, email: e.target.value })}
                        />
                      </div>
                    </div>
                    {!edit && (
                      <div>
                        <Label className="mb-1.5 block text-sm">Mật khẩu đăng nhập</Label>
                        <Input
                          type="password"
                          placeholder="Tối thiểu 8 ký tự"
                          value={form.password}
                          onChange={(e) => setForm({ ...form, password: e.target.value })}
                        />
                      </div>
                    )}
                    <div>
                      <Label className="mb-1.5 block text-sm">Giới thiệu</Label>
                      <Input
                        placeholder="Kinh nghiệm, chuyên môn..."
                        value={form.biography}
                        onChange={(e) => setForm({ ...form, biography: e.target.value })}
                      />
                    </div>
                    <ActionError message={action.error} />
                  </div>
                  <DialogFooter className="mt-2">
                    <Button variant="outline" onClick={() => setOpen(false)}>
                      Huỷ
                    </Button>
                    <Button onClick={submit} disabled={action.busy}>
                      {edit ? 'Lưu thay đổi' : 'Thêm bác sĩ'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </>
          )
        }}
      </Async>
    </div>
  )
}
