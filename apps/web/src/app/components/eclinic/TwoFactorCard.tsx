'use client'

import { useState } from 'react'
import { Icon } from '@iconify/react'
import CardBox from '@/app/components/shared/CardBox'
import { ActionError } from '@/app/components/eclinic/ApiState'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { post } from '@/lib/eclinic/api'
import { useAuth } from '@/lib/eclinic/auth'
import { useAction } from '@/lib/eclinic/use-api'

/** Bật/tắt xác thực hai bước: POST /auth/2fa/setup → /auth/2fa/confirm (nhận mã khôi phục) · /auth/2fa/disable. */
export default function TwoFactorCard() {
  const { user, refresh } = useAuth()
  const enabled = !!user?.two_factor_enabled
  const [setup, setSetup] = useState<{ secret: string; otpauth_url: string } | null>(null)
  const [code, setCode] = useState('')
  const [recovery, setRecovery] = useState<string[] | null>(null)
  const action = useAction()

  const start = () =>
    action.run(async () => {
      setSetup(await post<{ secret: string; otpauth_url: string }>('/auth/2fa/setup'))
      setCode('')
    })

  const confirm = () =>
    action.run(async () => {
      const r = await post<{ recovery_codes: string[] }>('/auth/2fa/confirm', { code })
      setRecovery(r.recovery_codes)
      setSetup(null)
      await refresh()
    })

  const disable = async () => {
    if (!window.confirm('Tắt xác thực hai bước cho tài khoản này?')) return
    await action.run(async () => {
      await post('/auth/2fa/disable')
      setRecovery(null)
      await refresh()
    })
  }

  return (
    <CardBox>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h5 className="text-base font-semibold flex items-center gap-2">
            <Icon icon="solar:shield-keyhole-minimalistic-linear" width={20} />
            Xác thực hai bước
          </h5>
          <p className="text-sm text-muted-foreground mt-1">
            {enabled ? 'Đang bật — khi đăng nhập sẽ cần thêm mã 6 số từ ứng dụng xác thực.' : 'Đang tắt. Bật để bảo vệ tài khoản bằng ứng dụng xác thực (Google Authenticator, Authy…).'}
          </p>
        </div>
        {enabled ? (
          <Button variant="outline" onClick={disable} disabled={action.busy}>Tắt</Button>
        ) : !setup ? (
          <Button onClick={start} disabled={action.busy}>Bật</Button>
        ) : null}
      </div>

      {setup && (
        <div className="mt-5 flex flex-col gap-3">
          <p className="text-sm">
            1. Trong ứng dụng xác thực, chọn <b>nhập khoá thủ công</b> và dán khoá bên dưới (tài khoản: e-Clinic).
          </p>
          <code className="block rounded-md bg-muted px-3 py-2 text-sm break-all select-all">{setup.secret}</code>
          <p className="text-sm">2. Nhập mã 6 số hiện trong ứng dụng để xác nhận:</p>
          <div className="flex gap-3 max-w-xs">
            <Input
              inputMode="numeric" maxLength={6} placeholder="123456" value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
            />
            <Button onClick={confirm} disabled={action.busy || code.length !== 6}>Xác nhận</Button>
          </div>
        </div>
      )}

      {recovery && (
        <div className="mt-5 rounded-lg border border-warning/40 bg-warning/5 p-3">
          <p className="text-sm font-medium mb-2">Mã khôi phục (chỉ hiển thị một lần — hãy lưu lại, mỗi mã dùng được 1 lần):</p>
          <div className="grid grid-cols-2 gap-1 text-sm font-mono">
            {recovery.map((c) => <span key={c}>{c}</span>)}
          </div>
        </div>
      )}

      <div className="mt-3"><ActionError message={action.error} /></div>
    </CardBox>
  )
}
