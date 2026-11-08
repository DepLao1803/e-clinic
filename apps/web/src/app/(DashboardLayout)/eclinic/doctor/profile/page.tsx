'use client'

import { useEffect, useState } from 'react'
import CardBox from '@/app/components/shared/CardBox'
import PageHeader from '@/app/components/eclinic/PageHeader'
import { ActionError, NoDoctorProfile } from '@/app/components/eclinic/ApiState'
import TwoFactorCard from '@/app/components/eclinic/TwoFactorCard'
import ImageUpload from '@/app/components/eclinic/ImageUpload'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { api, put } from '@/lib/eclinic/api'
import { avg, loadDoctorSpecialties, RawReview } from '@/lib/eclinic/data'
import { useAuth } from '@/lib/eclinic/auth'
import { useAction, useApi } from '@/lib/eclinic/use-api'
import { currency } from '@/lib/eclinic/types'
import { Icon } from '@iconify/react'

export default function DoctorProfilePage() {
  const { user, refresh } = useAuth()
  const doctorId = user?.doctor_id
  const extra = useApi(async () => {
    if (!doctorId) return { specialties: [] as string[], ratings: [] as number[] }
    const [specMap, reviews] = await Promise.all([
      loadDoctorSpecialties(),
      api<RawReview[]>('/reviews/doctor'),
    ])
    return { specialties: specMap[String(doctorId)] ?? [], ratings: reviews.map((r) => r.rating) }
  }, [doctorId])
  const [form, setForm] = useState<{ name: string; phone: string; avatar?: string }>({ name: '', phone: '' })
  const [saved, setSaved] = useState(false)
  const action = useAction()

  useEffect(() => {
    if (user) setForm({ name: user.name, phone: user.phone ?? '', avatar: user.avatar_url ?? undefined })
  }, [user])

  if (!doctorId) return <NoDoctorProfile />

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

  const ratings = extra.data?.ratings ?? []

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-6">
      <PageHeader
        title="Hồ sơ cá nhân"
        description="Thông tin hiển thị cho bệnh nhân khi chọn bác sĩ đặt lịch khám."
      />

      <CardBox>
        <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
          <ImageUpload
            value={form.avatar}
            onChange={(v) => setForm({ ...form, avatar: v })}
            shape="circle"
            size={96}
            label="Ảnh đại diện"
            hint="JPG/PNG, tối đa 2MB"
            placeholderIcon="solar:user-linear"
          />
          <div className="flex items-center gap-1 text-warning bg-warning/10 rounded-full px-3 py-1.5 text-sm font-medium">
            <Icon icon="solar:star-bold" width={16} />
            {avg(ratings).toFixed(1)} ({ratings.length} đánh giá)
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <Label className="mb-1.5 block text-sm">Họ và tên</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <Label className="mb-1.5 block text-sm">Chuyên khoa</Label>
            <Input value={extra.data?.specialties.join(', ') ?? ''} disabled className="opacity-70" />
          </div>
          <div>
            <Label className="mb-1.5 block text-sm">Giá khám</Label>
            <Input value={user?.doctor ? currency(Number(user.doctor.price) || 0) : ''} disabled className="opacity-70" />
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

        <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-4">
          <Icon icon="solar:info-circle-linear" width={14} />
          Chuyên khoa, giá khám và email do quản trị cấp/thay đổi, bác sĩ không tự sửa được.
        </p>

        <div className="flex flex-col gap-3 mt-4">
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
