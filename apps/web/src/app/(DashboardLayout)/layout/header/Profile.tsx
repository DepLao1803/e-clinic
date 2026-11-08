'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Icon } from '@iconify/react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/eclinic/auth'
import SimpleBar from 'simplebar-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'

const ROLE_LABEL = { admin: 'Quản trị viên', doctor: 'Bác sĩ', patient: 'Bệnh nhân' } as const

const Profile = () => {
  const { user, logout } = useAuth()
  const router = useRouter()
  const menu = user ? [{ title: 'Hồ sơ cá nhân', icon: 'solar:user-circle-linear', url: `/eclinic/${user.role}/profile` }] : []

  const onLogout = async () => {
    await logout()
    router.replace('/auth/login')
  }

  return (
    <div className='relative group/menu ps-15 shrink-0'>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <span className='hover:text-primary hover:bg-lightprimary rounded-full flex justify-center items-center cursor-pointer group-hover/menu:bg-lightprimary group-hover/menu:text-primary'>
            {user?.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.avatar_url} alt='avatar' height={35} width={35} className='rounded-full object-cover w-[35px] h-[35px]' />
            ) : (
              <Image src='/images/profile/user-1.jpg' alt='logo' height={35} width={35} className='rounded-full' />
            )}
          </span>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align='end'
          className='w-screen sm:w-[200px] pb-4 pt-2 rounded-sm'>
          {user && (
            <div className='px-4 pb-2 mb-1 border-b border-border'>
              <p className='text-sm font-semibold truncate'>{user.name}</p>
              <p className='text-xs text-muted-foreground'>{ROLE_LABEL[user.role]}</p>
            </div>
          )}
          <SimpleBar>
            {menu.map((item, index) => (
              <DropdownMenuItem key={index} asChild>
                <Link
                  href={item.url}
                  className='px-4 py-2 flex justify-between items-center group/link w-full hover:bg-lightprimary hover:text-primary'>
                  <div className='flex items-center gap-3 w-full'>
                    <Icon
                      icon={item.icon}
                      className='text-lg text-muted-foreground group-hover/link:text-primary'
                    />
                    <h5 className='mb-0 text-sm text-muted-foreground group-hover/link:text-primary'>
                      {item.title}
                    </h5>
                  </div>
                </Link>
              </DropdownMenuItem>
            ))}
          </SimpleBar>

          <DropdownMenuSeparator className='my-2' />

          <div className='px-4'>
            <Button variant='outline' asChild className='w-full rounded-md cursor-pointer'>
              <button type='button' onClick={onLogout}>Đăng xuất</button>
            </Button>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

export default Profile
