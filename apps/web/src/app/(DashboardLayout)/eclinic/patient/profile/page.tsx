'use client'

import { useEffect, useState } from 'react'
import CardBox from '@/app/components/shared/CardBox'
import PageHeader from '@/app/components/eclinic/PageHeader'
import { ActionError } from '@/app/components/eclinic/ApiState'
import TwoFactorCard from '@/app/components/eclinic/TwoFactorCard'
import ImageUpload from '@/app/components/eclinic/ImageUpload'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { put } from '@/lib/eclinic/api'
import { useAuth } from '@/lib/eclinic/auth'
import { useAction } from '@/lib/eclinic/use-api'
import { Icon } from '@iconify/react'

export default function PatientProfilePage() {
  const { user, refresh } = useAuth()
  const [form, setForm] = useState<{ name: string; phone: string; dob: string; gender: string; address: string; insurance: string; avatar?: string }>({
    name: '', phone: '', dob: '', gender: '', address: '', insurance: '',
  })
  const [saved, setSaved] = useState(false)
  const action = useAction()

  useEffect(() => {
    if (user)
      setForm({
        name: user.name,
        phone: user.phone ?? '',
        dob: user.date_of_birth ?? '',
        gender: user.gender ?? '',
        address: user.address ?? '',
        insurance: user.insurance_code ?? '',
        avatar: user.avatar_url ?? undefined,
      })
  }, [user])

  const save = async () => {
    setSaved(false)
    const body: Record<string, string> = { name: form.name.trim() }
    if (form.phone.trim()) body.phone = form.phone.trim()
    if (form.dob) body.date_of_birth = form.dob
    if (form.gender) body.gender = form.gender
    if (form.address.trim()) body.address = form.address.trim()
    if (form.insurance.trim()) body.insurance_code = form.insurance.trim()
    body.avatar_url = form.avatar ?? ''
    const ok = await action.run(async () => {
      await put('/auth/profile', body)
      await refresh()
    })
    if (ok) {
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    }
  }

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-6">
      <PageHeader
        title="Hồ sơ cá nhân"
        description="Thông tin dùng để xác thực khi đặt lịch khám và nhận email nhắc hẹn."
      />

      <CardBox>
        <ImageUpload
          value={form.avatar}
          onChange={(v) => setForm({ ...form, avatar: v })}
          shape="circle"
          size={96}
          label="Ảnh đại diện"
          hint="Tuỳ chọn — JPG/PNG, tối đa 2MB"
          placeholderIcon="solar:user-linear"
        />
        <div className="grid sm:grid-cols-2 gap-4 mt-6">
          <div className="sm:col-span-2">
            <Label className="mb-1.5 block text-sm">Họ và tên</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <Label className="mb-1.5 block text-sm">Số điện thoại</Label>
            <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div>
            <Label className="mb-1.5 block text-sm">Ngày sinh</Label>
            <Input type="date" value={form.dob} onChange={(e) => setForm({ ...form, dob: e.target.value })} />
          </div>
          <div>
            <Label className="mb-1.5 block text-sm">Số CCCD</Label>
            <Input value={user?.identity_card ?? ''} disabled className="opacity-70" />
          </div>
          <div>
            <Label className="mb-1.5 block text-sm">Số thẻ BHYT</Label>
            <Input
              value={form.insurance}
              placeholder="Nếu có"
              onChange={(e) => setForm({ ...form, insurance: e.target.value })}
            />
          </div>
          <div>
            <Label className="mb-1.5 block text-sm">Giới tính</Label>
            <Select value={form.gender || undefined} onValueChange={(v) => setForm({ ...form, gender: v })}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Chọn giới tính" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Nam">Nam</SelectItem>
                <SelectItem value="Nữ">Nữ</SelectItem>
                <SelectItem value="Khác">Khác</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="sm:col-span-2">
            <Label className="mb-1.5 block text-sm">Địa chỉ</Label>
            <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </div>
          <div className="sm:col-span-2">
            <Label className="mb-1.5 block text-sm">Email</Label>
            <Input value={user?.email ?? ''} disabled className="opacity-70" />
          </div>
        </div>

        <div className="flex flex-col gap-3 mt-6">
          <ActionError message={action.error} />
          <div className="flex items-center gap-3">
            <Button onClick={save} disabled={action.busy || !form.name.trim()}>
              <Icon icon="solar:diskette-linear" width={16} className="mr-1.5" />
              Lưu thay đổi
            </Button>
            {saved && (
              <span className="text-sm text-success flex items-center gap-1">
                <Icon icon="solar:check-circle-bold" width={16} />
                Đã lưu
              </span>
            )}
          </div>
        </div>
      </CardBox>

      <TwoFactorCard />
    </div>
  )
}
