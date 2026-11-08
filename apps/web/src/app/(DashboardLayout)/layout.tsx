'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Icon } from '@iconify/react'
import { homeFor, useAuth } from '@/lib/eclinic/auth'
import Header from './layout/header/Header'
import Sidebar from './layout/sidebar/Sidebar'

/**
 * Client-side route guard (UX only — the API enforces the real permissions with JWT + @Roles).
 *  - not logged in            → /auth/login
 *  - logged in, wrong area    → your own dashboard (e.g. a doctor opening /eclinic/admin/*)
 */
function useRoleGuard() {
  const { user, ready } = useAuth()
  const pathname = usePathname()
  const router = useRouter()

  const allowed = !!user && (pathname === `/eclinic/${user.role}` || pathname.startsWith(`/eclinic/${user.role}/`))

  useEffect(() => {
    if (!ready) return
    if (!user) router.replace('/auth/login')
    else if (!allowed) router.replace(homeFor(user.role))
  }, [ready, user, allowed, router])

  return ready && allowed
}

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const canRender = useRoleGuard()

  if (!canRender) {
    return (
      <div className='min-h-screen flex items-center justify-center text-muted-foreground'>
        <Icon icon='solar:refresh-linear' className='animate-spin' width={28} />
      </div>
    )
  }

  return (
    <div className='flex w-full min-h-screen'>
      <div className='page-wrapper flex w-full'>
        {/* Header/sidebar */}
        <div className='xl:block hidden'>
          <Sidebar />
        </div>
        <div className='body-wrapper w-full bg-background'>
          {/* Top Header  */}
          <Header />
          {/* Body Content  */}
          <div className={`container mx-auto px-6 py-30`}>{children}</div>
        </div>
      </div>
    </div>
  )
}
