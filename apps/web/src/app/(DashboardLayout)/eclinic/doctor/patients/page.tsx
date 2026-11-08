'use client'

import CardBox from '@/app/components/shared/CardBox'
import PageHeader from '@/app/components/eclinic/PageHeader'
import StatusBadge from '@/app/components/eclinic/StatusBadge'
import { Async, NoDoctorProfile } from '@/app/components/eclinic/ApiState'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { api } from '@/lib/eclinic/api'
import { RawAppointment, toAppointment } from '@/lib/eclinic/data'
import { useAuth } from '@/lib/eclinic/auth'
import { useApi } from '@/lib/eclinic/use-api'
import { Icon } from '@iconify/react'

export default function DoctorPatientsPage() {
  const { user } = useAuth()
  const doctorId = user?.doctor_id
  const state = useApi(async () => {
    if (!doctorId) return []
    return (await api<RawAppointment[]>('/appointments/doctor')).map(toAppointment)
  }, [doctorId])

  if (!doctorId) return <NoDoctorProfile />

  return (
    <CardBox>
      <PageHeader
        title="Bệnh nhân của tôi"
        description="Bệnh nhân đã đặt lịch khám với bạn kèm tình trạng khám."
      />
      <Async state={state}>
        {(items) => (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Bệnh nhân</TableHead>
                <TableHead>SĐT</TableHead>
                <TableHead>Ngày khám</TableHead>
                <TableHead>Dịch vụ</TableHead>
                <TableHead>Triệu chứng</TableHead>
                <TableHead>Trạng thái</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((a) => (
                <TableRow key={a.id} className="hover:bg-muted/40">
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={a.patientAvatar} alt={a.patientName} />
                        <AvatarFallback className="text-xs">{a.patientName?.[0]}</AvatarFallback>
                      </Avatar>
                      {a.patientName}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{a.patientPhone}</TableCell>
                  <TableCell>{a.date}</TableCell>
                  <TableCell>{a.services.join(', ') || '—'}</TableCell>
                  <TableCell className="max-w-xs truncate">{a.symptom}</TableCell>
                  <TableCell>
                    <StatusBadge status={a.status} />
                  </TableCell>
                </TableRow>
              ))}
              {items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-10">
                    <Icon icon="solar:users-group-rounded-linear" width={28} className="mx-auto mb-2" />
                    Chưa có bệnh nhân nào đặt lịch với bạn
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </Async>
    </CardBox>
  )
}
