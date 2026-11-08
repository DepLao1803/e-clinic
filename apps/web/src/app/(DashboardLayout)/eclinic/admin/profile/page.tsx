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
import { put } from '@/lib/eclinic/api'
import { useAuth } from '@/lib/eclinic/auth'
import { useAction } from '@/lib/eclinic/use-api'
import { Icon } from '@iconify/react'

export default function AdminProfilePage() {
  const { user, refresh } = useAuth()
  const [form, setForm] = useState<{ name: string; phone: string; avatar?: string }>({ name: '', phone: '' })
  const [saved, setSaved] = useState(false)
  const action = useAction()

  useEffect(() => {
    if (user) setForm({ name: user.name, phone: user.phone ?? '', avatar: user.avatar_url ?? undefined })
  }, [user])

  const save = async () => {
    setSaved(false)
    const body: Record<string, string> = { name: form.name.trim() }
    if (form.phone.trim()) body.phone = form.phone.trim()
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
        description="Thông tin tài khoản quản trị hệ thống E-Clinic."
      />

      <CardBox>
        <ImageUpload
          value={form.avatar}
          onChange={(v) => setForm({ ...form, avatar: v })}
          shape="circle"
          size={96}
          label="Ảnh đại diện"
          hint="Tuỳ chọn — JPG/PNG, tối đa 2MB"
          placeholderIcon="solar:shield-user-linear"
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
