'use client'

import { FormEvent, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import FullLogo from '@/app/(DashboardLayout)/layout/shared/logo/FullLogo'
import Image from 'next/image'
import CardBox from '../shared/CardBox'
import Link from 'next/link'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Icon } from '@iconify/react'
import { ApiError } from '@/lib/eclinic/api'
import { homeFor, useAuth } from '@/lib/eclinic/auth'

const HIGHLIGHTS = [
  { icon: 'solar:calendar-mark-linear', text: 'Đặt lịch khám nhanh chóng, chọn đúng chuyên khoa & bác sĩ' },
  { icon: 'solar:users-group-two-rounded-linear', text: 'Theo dõi hàng đợi khám theo thời gian thực' },
  { icon: 'solar:shield-check-linear', text: 'Hồ sơ khám bệnh được lưu trữ an toàn, riêng tư' },
]

export const Login = () => {
  const router = useRouter()
  const { user, ready, login, completeTwoFactor } = useAuth()

  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [challenge, setChallenge] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Already signed in → straight to the dashboard of *your* role
  useEffect(() => {
    if (ready && user) router.replace(homeFor(user.role))
  }, [ready, user, router])

  const fail = (e: unknown) => {
    if (e instanceof ApiError) setError(e.errors?.login?.[0] ?? e.errors?.code?.[0] ?? e.message)
    else setError('Không kết nối được máy chủ. Hãy kiểm tra API đã chạy chưa.')
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      if (challenge) {
        const u = await completeTwoFactor(challenge, code)
        router.replace(homeFor(u.role)) // role comes from the SERVER, never from a tab the user picked
      } else {
        const r = await login(identifier.trim(), password)
        if (r.status === 'two_factor') setChallenge(r.challengeToken)
        else router.replace(homeFor(r.user.role))
      }
    } catch (err) {
      fail(err)
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
            Nền tảng quản lý phòng khám thông minh
          </h2>
          <p className="text-white/80 mb-8">
            E-Clinic kết nối bệnh nhân, bác sĩ và quản trị viên trong một hệ
            thống duy nhất — đặt lịch, khám bệnh và quản lý dễ dàng hơn.
          </p>
          <div className="flex flex-col gap-4">
            {HIGHLIGHTS.map((h) => (
              <div key={h.text} className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-white/15 flex items-center justify-center shrink-0">
                  <Icon icon={h.icon} width={18} />
                </div>
                <p className="text-sm text-white/90 pt-1.5">{h.text}</p>
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
        <div className="md:min-w-[420px] min-w-max w-full max-w-md">
          <div className="lg:hidden flex justify-center mb-4">
            <FullLogo />
          </div>
          <CardBox>
            <h4 className="text-xl font-bold mb-1">Chào mừng trở lại 👋</h4>
            <p className="text-sm text-muted-foreground mb-6">
              Đăng nhập để tiếp tục — hệ thống tự đưa bạn tới đúng khu vực theo vai trò (bệnh nhân, bác sĩ hoặc quản trị).
            </p>

            <form onSubmit={onSubmit}>
              {!challenge ? (
                <>
                  <div>
                    <Label htmlFor="identifier" className="font-medium mb-2 block">
                      Email, số điện thoại hoặc mã nhân viên
                    </Label>
                    <Input
                      id="identifier" type="text" autoComplete="username" required
                      placeholder="VD: email@gmail.com · 0901234567 · NV-1"
                      value={identifier} onChange={(e) => setIdentifier(e.target.value)}
                    />
                  </div>
                  <div className="mt-4">
                    <Label htmlFor="password" className="font-medium mb-2 block">Mật khẩu</Label>
                    <Input
                      id="password" type="password" autoComplete="current-password" required
                      placeholder="Nhập mật khẩu"
                      value={password} onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                </>
              ) : (
                <div>
                  <Label htmlFor="code" className="font-medium mb-2 block">Mã xác thực hai bước (6 số)</Label>
                  <Input
                    id="code" inputMode="numeric" maxLength={6} autoFocus required placeholder="123456"
                    value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  />
                </div>
              )}

              {error && (
                <div className="mt-4 flex items-start gap-2 rounded-md bg-lighterror text-error text-sm px-3 py-2">
                  <Icon icon="solar:danger-circle-linear" width={18} className="mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="flex flex-wrap gap-6 items-center justify-end my-6">
                <Link href="/auth/forgot-password" className="text-sm font-medium text-primary hover:text-primaryemphasis">
                  Quên mật khẩu?
                </Link>
              </div>

              <Button className="w-full" type="submit" disabled={loading}>
                {loading ? 'Đang xử lý…' : challenge ? 'Xác nhận' : 'Đăng nhập'}
              </Button>
            </form>

            <div className="flex items-center gap-2 justify-center mt-6 flex-wrap">
              <p className="text-base font-medium text-muted-foreground">Chưa có tài khoản?</p>
              <Link href="/auth/register" className="text-sm font-medium text-primary hover:text-primaryemphasis">
                Đăng ký
              </Link>
            </div>
          </CardBox>
        </div>
      </div>
    </div>
  )
}
