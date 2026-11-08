'use client'

import { FormEvent, useState } from 'react'
import Link from 'next/link'
import { Icon } from '@iconify/react'
import FullLogo from '@/app/(DashboardLayout)/layout/shared/logo/FullLogo'
import CardBox from '../shared/CardBox'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { errMsg, post } from '@/lib/eclinic/api'

/** POST /auth/forgot-password — the API answers the same way whether or not the email exists. */
export const ForgotPassword = () => {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await post('/auth/forgot-password', { email: email.trim() })
      setSent(true)
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
          <h4 className="text-xl font-bold mb-1">Quên mật khẩu</h4>
          {sent ? (
            <div className="mt-4 flex items-start gap-2 rounded-md bg-lightsuccess text-success text-sm px-3 py-2">
              <Icon icon="solar:check-circle-linear" width={18} className="mt-0.5 shrink-0" />
              <span>
                Nếu email này đã đăng ký, chúng tôi vừa gửi liên kết đặt lại mật khẩu (hiệu lực 60 phút). Hãy kiểm tra hộp thư.
              </span>
            </div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground mb-6">
                Nhập email đã đăng ký để nhận liên kết đặt lại mật khẩu.
              </p>
              <form onSubmit={onSubmit}>
                <Label htmlFor="email" className="font-medium mb-2 block">Email</Label>
                <Input
                  id="email" type="email" autoComplete="email" required placeholder="email@gmail.com"
                  value={email} onChange={(e) => setEmail(e.target.value)}
                />
                {error && (
                  <div className="mt-4 flex items-start gap-2 rounded-md bg-lighterror text-error text-sm px-3 py-2">
                    <Icon icon="solar:danger-circle-linear" width={18} className="mt-0.5 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}
                <Button className="w-full mt-6" type="submit" disabled={loading}>
                  {loading ? 'Đang gửi…' : 'Gửi liên kết đặt lại'}
                </Button>
              </form>
            </>
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
