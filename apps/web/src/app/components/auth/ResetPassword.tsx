'use client'

import { FormEvent, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Icon } from '@iconify/react'
import FullLogo from '@/app/(DashboardLayout)/layout/shared/logo/FullLogo'
import CardBox from '../shared/CardBox'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { errMsg, post } from '@/lib/eclinic/api'

/** POST /auth/reset-password — token + email come from the link in the email (?token=…&email=…). */
export const ResetPassword = () => {
  const router = useRouter()
  const params = useSearchParams()
  const token = params.get('token') ?? ''
  const email = params.get('email') ?? ''

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(false)

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await post('/auth/reset-password', { email, token, password, password_confirmation: confirm })
      setDone(true)
      setTimeout(() => router.replace('/auth/login'), 2000)
    } catch (err) {
      setError(errMsg(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full flex justify-center items-center py-10 px-4 bg-lightprimary">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-4"><FullLogo /></div>
        <CardBox>
          <h4 className="text-xl font-bold mb-1">Đặt lại mật khẩu</h4>
          {!token || !email ? (
            <p className="text-sm text-error mt-3">
              Liên kết không hợp lệ. Hãy <Link href="/auth/forgot-password" className="underline">yêu cầu liên kết mới</Link>.
            </p>
          ) : done ? (
            <div className="mt-4 flex items-start gap-2 rounded-md bg-lightsuccess text-success text-sm px-3 py-2">
              <Icon icon="solar:check-circle-linear" width={18} className="mt-0.5 shrink-0" />
              <span>Đã đặt lại mật khẩu. Đang chuyển về trang đăng nhập…</span>
            </div>
          ) : (
            <form onSubmit={onSubmit}>
              <p className="text-sm text-muted-foreground mb-6">Tài khoản: {email}</p>
              <Label htmlFor="password" className="font-medium mb-2 block">Mật khẩu mới</Label>
              <Input
                id="password" type="password" autoComplete="new-password" required minLength={8}
                placeholder="Ít nhất 8 ký tự" value={password} onChange={(e) => setPassword(e.target.value)}
              />
              <Label htmlFor="confirm" className="font-medium mb-2 mt-4 block">Nhập lại mật khẩu</Label>
              <Input
                id="confirm" type="password" autoComplete="new-password" required minLength={8}
                value={confirm} onChange={(e) => setConfirm(e.target.value)}
              />
              {error && (
                <div className="mt-4 flex items-start gap-2 rounded-md bg-lighterror text-error text-sm px-3 py-2">
                  <Icon icon="solar:danger-circle-linear" width={18} className="mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
              <Button className="w-full mt-6" type="submit" disabled={loading}>
                {loading ? 'Đang lưu…' : 'Đặt lại mật khẩu'}
              </Button>
            </form>
          )}
          <div className="flex justify-center mt-6">
            <Link href="/auth/login" className="text-sm font-medium text-primary hover:text-primaryemphasis">
              ← Quay lại đăng nhập
            </Link>
          </div>
        </CardBox>
      </div>
    </div>
  )
}
