'use client'

import { useState } from 'react'
import CardBox from '@/app/components/shared/CardBox'
import PageHeader from '@/app/components/eclinic/PageHeader'
import { ActionError, Async } from '@/app/components/eclinic/ApiState'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { api, del, Paged, post } from '@/lib/eclinic/api'
import { RawUser, toPatient } from '@/lib/eclinic/data'
import { useAction, useApi } from '@/lib/eclinic/use-api'
import { Icon } from '@iconify/react'

export default function PatientsPage() {
  const [trashView, setTrashView] = useState(false)
  const state = useApi(async () => {
    if (trashView) {
      const rows = await api<RawUser[]>('/admin/user/trash')
      return rows.filter((u) => u.role === 'patient').map(toPatient)
    }
    const res = await api<Paged<RawUser>>('/admin/profile?per_page=1000')
    return res.data.filter((u) => u.role === 'patient').map(toPatient)
  }, [trashView])
  const action = useAction(state.reload)
  const [q, setQ] = useState('')

  const toggle = (id: string) => action.run(() => post(`/admin/user/toggleStatus/${id}`))
  const trash = (id: string, name: string) => {
    if (!window.confirm(`Chuyển tài khoản "${name}" vào thùng rác?`)) return
    action.run(() => del(`/admin/profile/${id}`))
  }
  const restore = (id: string) => action.run(() => post(`/admin/user/restore/${id}`))
  const destroy = (id: string, name: string) => {
    if (!window.confirm(`Xoá vĩnh viễn "${name}"? Không thể hoàn tác.`)) return
    action.run(() => post(`/admin/user/forceDelete/${id}`))
  }

  return (
    <CardBox>
      <PageHeader
        title={trashView ? 'Thùng rác bệnh nhân' : 'Danh sách bệnh nhân'}
        description={trashView ? 'Tài khoản đã xoá — có thể khôi phục hoặc xoá vĩnh viễn.' : 'Bệnh nhân đã đăng ký tài khoản trên hệ thống.'}
        action={
          <div className="flex gap-2 flex-wrap items-center">
          <Button size="sm" variant="outline" onClick={() => { setTrashView(!trashView); setQ('') }}>
            <Icon icon={trashView ? 'solar:users-group-rounded-linear' : 'solar:trash-bin-trash-linear'} width={16} className="mr-1.5" />
            {trashView ? 'Danh sách' : 'Thùng rác'}
          </Button>
          <div className="relative">
            <Icon
              icon="solar:magnifer-linear"
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              className="pl-8 w-64"
              placeholder="Tìm theo tên, SĐT, CCCD..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          </div>
        }
      />
      <ActionError message={action.error} />
      <Async state={state}>
        {(patients) => {
          const visible = patients.filter(
            (p) =>
              p.name.toLowerCase().includes(q.toLowerCase()) ||
              p.phone.includes(q) ||
              p.citizenId.includes(q)
          )
          return (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Họ tên</TableHead>
                  <TableHead>SĐT</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>CCCD</TableHead>
                  <TableHead>Thẻ BHYT</TableHead>
                  <TableHead>Ngày sinh</TableHead>
                  <TableHead>Giới tính</TableHead>
                  <TableHead>Địa chỉ</TableHead>
                  <TableHead>Tài khoản</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.map((p) => (
                  <TableRow key={p.id} className="hover:bg-muted/40">
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={p.avatarUrl} alt={p.name} />
                          <AvatarFallback className="text-xs">{p.name[0]}</AvatarFallback>
                        </Avatar>
                        {p.name}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{p.phone || '—'}</TableCell>
                    <TableCell className="text-muted-foreground">{p.email || '—'}</TableCell>
                    <TableCell className="text-muted-foreground">{p.citizenId || '—'}</TableCell>
                    <TableCell>
                      {p.insuranceCode ? <Badge variant="lightSuccess">{p.insuranceCode}</Badge> : <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell>{p.dob || '—'}</TableCell>
                    <TableCell>
                      {p.gender ? <Badge variant="lightPrimary">{p.gender}</Badge> : <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell className="text-muted-foreground max-w-[200px] truncate">{p.address || '—'}</TableCell>
                    <TableCell>
                      <Badge variant={p.active ? 'lightSuccess' : 'lightWarning'}>
                        {p.active ? 'Hoạt động' : 'Bị khoá'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        {trashView ? (
                          <>
                            <Button size="sm" variant="outline" disabled={action.busy} onClick={() => restore(p.id)}>Khôi phục</Button>
                            <Button size="sm" variant="destructive" disabled={action.busy} onClick={() => destroy(p.id, p.name)}>Xoá vĩnh viễn</Button>
                          </>
                        ) : (
                          <>
                            <Button size="sm" variant="outline" disabled={action.busy} onClick={() => toggle(p.id)}>{p.active ? 'Khoá' : 'Mở khoá'}</Button>
                            <Button size="sm" variant="destructive" disabled={action.busy} onClick={() => trash(p.id, p.name)}>Xoá</Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {visible.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center text-muted-foreground py-10">
                      Không tìm thấy bệnh nhân phù hợp
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )
        }}
      </Async>
    </CardBox>
  )
}
