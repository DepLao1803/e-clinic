'use client'

import { Icon } from '@iconify/react'
import { Button } from '@/components/ui/button'

export function Loading() {
  return (
    <div className="flex items-center justify-center py-16 text-muted-foreground">
      <Icon icon="solar:refresh-linear" className="animate-spin" width={28} />
    </div>
  )
}

export function ErrorBox({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="rounded-xl border border-error/30 bg-error/5 text-error p-4 text-sm flex items-center justify-between gap-3">
      <span className="flex items-center gap-2">
        <Icon icon="solar:danger-triangle-linear" width={18} />
        {message}
      </span>
      {onRetry && (
        <Button size="sm" variant="outline" onClick={onRetry}>
          Thử lại
        </Button>
      )}
    </div>
  )
}

/** Inline error for the result of an action (save / delete / confirm…). */
export function ActionError({ message }: { message: string | null }) {
  if (!message) return null
  return (
    <p className="text-sm text-error flex items-center gap-1.5">
      <Icon icon="solar:danger-circle-linear" width={16} />
      {message}
    </p>
  )
}

/** Renders loading / error, otherwise `children(data)`. */
export function Async<T>({
  state,
  children,
}: {
  state: { data: T | null; loading: boolean; error: string | null; reload: () => void }
  children: (data: T) => React.ReactNode
}) {
  if (state.data) return <>{children(state.data)}</>
  if (state.error) return <ErrorBox message={state.error} onRetry={state.reload} />
  return <Loading />
}

/** Shown to a doctor-role account that has no linked doctor profile. */
export function NoDoctorProfile() {
  return (
    <div className="rounded-xl border border-dashed p-10 text-center text-muted-foreground text-sm">
      <Icon icon="solar:user-block-linear" width={32} className="mx-auto mb-2" />
      Tài khoản này chưa được liên kết với hồ sơ bác sĩ nên chưa có dữ liệu để hiển thị.
    </div>
  )
}
