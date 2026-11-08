'use client'

import { FormEvent, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { errMsg } from '@/lib/eclinic/api'
import { homeFor, useAuth } from '@/lib/eclinic/auth'
import FullLogo from '@/app/(DashboardLayout)/layout/shared/logo/FullLogo'
import Image from 'next/image'
import CardBox from '../shared/CardBox'
import Link from 'next/link'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Icon } from '@iconify/react'

const STEPS = [
  { icon: 'solar:user-id-linear', text: 'Đăng ký bằng SĐT, CCCD hoặc thẻ BHYT' },
  { icon: 'solar:calendar-add-linear', text: 'Đặt lịch khám với chuyên khoa mong muốn' },
  { icon: 'solar:hashtag-square-linear', text: 'Nhận số thứ tự và theo dõi hàng đợi' },
]

const GENDERS = { nam: 'Nam', nu: 'Nữ', khac: 'Khác' } as const

export const Register = () => {
  const router = useRouter()
  const { user, ready, register } = useAuth()
  const [form, setForm] = useState({
    name: '', phone: '', dob: '', citizenId: '', gender: 'nam' as keyof typeof GENDERS,
    address: '', insurance: '', password: '', confirm: '',
  })
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }))

  useEffect(() => {
    if (ready && user) router.replace(homeFor(user.role))
  }, [ready, user, router])

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    if (form.password !== form.confirm) {
      setError('Mật khẩu xác nhận không khớp.')
      return
    }
    setLoading(true)
    try {
      const payload: Record<string, unknown> = {
        name: form.name.trim(),
        phone: form.phone.trim(),
        identity_card: form.citizenId.trim(),
        gender: GENDERS[form.gender],
        password: form.password,
        password_confirmation: form.confirm,
      }
      if (form.dob) payload.date_of_birth = form.dob
      if (form.address.trim()) payload.address = form.address.trim()
      if (form.insurance.trim()) payload.insurance_code = form.insurance.trim()
      const u = await register(payload)
      router.replace(homeFor(u.role))
    } catch (err) {
      setError(errMsg(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full flex bg-lightprimary">
      {/* Left showcase panel */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-primary to-primary/70 text-white p-12 flex-col justify-between overflow-hidden">
        <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-white/10" />
        <div className="absolute -bottom-32 -left-16 w-80 h-80 rounded-full bg-white/10" />
        <div className="relative z-10">
          <Image src="/images/logos/light-logo.svg" alt="E-Clinic" width={180} height={32} />
        </div>
        <div className="relative z-10 max-w-md">
          <h2 className="text-3xl font-bold mb-4 leading-snug">
            Tham gia E-Clinic chỉ trong vài phút
          </h2>
          <p className="text-white/80 mb-8">
            Tạo tài khoản bệnh nhân để đặt lịch khám, theo dõi hàng đợi và lưu
            lại toàn bộ hồ sơ khám bệnh của bạn.
          </p>
          <div className="flex flex-col gap-4">
            {STEPS.map((s, i) => (
              <div key={s.text} className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-white/15 flex items-center justify-center shrink-0 text-sm font-bold">
                  {i + 1}
                </div>
                <p className="text-sm text-white/90 pt-1.5">{s.text}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="relative z-10 text-xs text-white/60">
          © {new Date().getFullYear()} E-Clinic. Đồ án minh hoạ.
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex justify-center items-center py-10 px-4">
        <div className="md:min-w-[450px] min-w-max w-full max-w-md">
          <div className="lg:hidden flex justify-center mb-4">
            <FullLogo />
          </div>
          <CardBox>
            <form onSubmit={onSubmit}>
              <h4 className="text-xl font-bold mb-1">Tạo tài khoản bệnh nhân</h4>
              <p className="text-sm text-muted-foreground mb-6">
                Điền thông tin cá nhân để bắt đầu sử dụng E-Clinic
              </p>

              <div>
                <Label htmlFor="name1" className="font-medium mb-2 block">
                  Họ và tên
                </Label>
                <Input id="name1" type="text" placeholder="Nhập họ tên" required value={form.name} onChange={(e) => set('name', e.target.value)} />
              </div>

              <div className="grid grid-cols-2 gap-3 mt-4">
                <div>
                  <Label htmlFor="phone1" className="font-medium mb-2 block">
                    Số điện thoại
                  </Label>
                  <Input id="phone1" type="tel" placeholder="09xxxxxxxx" required maxLength={10} value={form.phone} onChange={(e) => set('phone', e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="dob1" className="font-medium mb-2 block">
                    Ngày sinh
                  </Label>
                  <Input id="dob1" type="date" required value={form.dob} onChange={(e) => set('dob', e.target.value)} />
                </div>
              </div>

              <div className="mt-4">
                <Label htmlFor="citizenId1" className="font-medium mb-2 block">
                  Số căn cước công dân
                </Label>
                <Input id="citizenId1" type="text" placeholder="Nhập số CCCD" required maxLength={12} value={form.citizenId} onChange={(e) => set('citizenId', e.target.value)} />
              </div>

              <div className="mt-4">
                <Label htmlFor="insurance1" className="font-medium mb-2 block">
                  Số thẻ BHYT (nếu có)
                </Label>
                <Input id="insurance1" type="text" placeholder="Nhập số thẻ BHYT" maxLength={20} value={form.insurance} onChange={(e) => set('insurance', e.target.value)} />
              </div>

              <div className="grid grid-cols-2 gap-3 mt-4">
                <div>
                  <Label className="font-medium mb-2 block">Giới tính</Label>
                  <Select value={form.gender} onValueChange={(v) => set('gender', v)}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="nam">Nam</SelectItem>
                      <SelectItem value="nu">Nữ</SelectItem>
                      <SelectItem value="khac">Khác</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="address1" className="font-medium mb-2 block">
                    Địa chỉ
                  </Label>
                  <Input id="address1" type="text" placeholder="Nhập địa chỉ" value={form.address} onChange={(e) => set('address', e.target.value)} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-4">
                <div>
                  <Label htmlFor="password1" className="font-medium mb-2 block">
                    Mật khẩu
                  </Label>
                  <Input id="password1" type="password" placeholder="Tối thiểu 8 ký tự" required minLength={8} value={form.password} onChange={(e) => set('password', e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="confirm1" className="font-medium mb-2 block">
                    Nhập lại mật khẩu
                  </Label>
                  <Input id="confirm1" type="password" placeholder="Nhập lại mật khẩu" required value={form.confirm} onChange={(e) => set('confirm', e.target.value)} />
                </div>
              </div>

              <div className="flex items-start gap-2 mt-4 text-xs text-muted-foreground bg-muted/50 rounded-lg p-3">
                <Icon icon="solar:info-circle-linear" width={16} className="shrink-0 mt-0.5" />
                <p>
                  Mọi tài khoản đăng ký tại đây đều là tài khoản bệnh nhân. Tài khoản bác sĩ được cấp
                  riêng kèm mã nhân viên, tài khoản quản trị do hệ thống tạo.
                </p>
              </div>

              {error && (
                <p className="mt-4 text-sm text-error flex items-center gap-1.5">
                  <Icon icon="solar:danger-circle-linear" width={16} />
                  {error}
                </p>
              )}

              <Button type="submit" className="w-full mt-5" disabled={loading}>
                {loading ? 'Đang đăng ký...' : 'Đăng ký'}
              </Button>
              <div className="flex items-center gap-2 justify-center mt-6 flex-wrap">
                <p className="text-base font-medium text-muted-foreground">
                  Đã có tài khoản?
                </p>
                <Link
                  href="/auth/login"
                  className="text-sm font-medium text-primary hover:text-primaryemphasis">
                  Đăng nhập
                </Link>
              </div>
            </form>
          </CardBox>
        </div>
      </div>
    </div>
  )
}
