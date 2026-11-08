"use client"

import Link from "next/link"
import dynamic from "next/dynamic"
import { Icon } from "@iconify/react/dist/iconify.js"
import { ApexOptions } from "apexcharts"
import CardBox from "@/app/components/shared/CardBox"
import StatCard from "@/app/components/eclinic/StatCard"
import { Async } from "@/app/components/eclinic/ApiState"
import StatusBadge from "@/app/components/eclinic/StatusBadge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { api, Paged } from "@/lib/eclinic/api"
import {
  loadDoctorDirectory,
  RawAppointment,
  RawDoctorSchedule,
  RawUser,
  toAppointment,
  toShift,
} from "@/lib/eclinic/data"
import { useApi } from "@/lib/eclinic/use-api"
import { currency, initial, slotText, todayLocal } from "@/lib/eclinic/types"

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false })

const WEEKDAYS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"]

/** Monday-based index (0..6) of a yyyy-mm-dd date if it falls in the current week, else -1. */
function weekIndex(date: string) {
  const now = new Date()
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - ((now.getDay() + 6) % 7))
  const d = new Date(`${date}T00:00:00`)
  const diff = Math.round((d.getTime() - monday.getTime()) / 86400000)
  return diff >= 0 && diff < 7 ? diff : -1
}

export default function AdminDashboardPage() {
  const state = useApi(async () => {
    const [appts, doctors, users, shifts] = await Promise.all([
      api<RawAppointment[]>("/admin/appointments"),
      loadDoctorDirectory(),
      api<Paged<RawUser>>("/admin/profile?per_page=1000"),
      api<Paged<RawDoctorSchedule>>("/admin/doctor-schedules?per_page=1000"),
    ])
    return {
      appointments: appts.map(toAppointment),
      doctors,
      patientCount: users.data.filter((u) => u.role === "patient").length,
      shifts: shifts.data.map(toShift),
    }
  })

  return (
    <Async state={state}>
      {({ appointments, doctors, patientCount, shifts }) => {
        const today = todayLocal()
        const activeDoctors = doctors.filter((d) => d.status === "active")
        const revenue = appointments
          .filter((a) => a.status !== "cancelled")
          .reduce((sum, a) => sum + a.total, 0)
        const todayCount = appointments.filter((a) => a.date === today).length

        const bySpecialty = new Map<string, number>()
        for (const a of appointments) {
          const key = a.specialtyName || "Chưa rõ"
          bySpecialty.set(key, (bySpecialty.get(key) ?? 0) + 1)
        }
        const weekly = WEEKDAYS.map(() => 0)
        for (const a of appointments) {
          const i = weekIndex(a.date)
          if (i >= 0) weekly[i]++
        }
        const pendingShifts = shifts.filter((s) => s.status === "pending" && s.date >= today)
        const upcomingShifts = pendingShifts
          .sort((a, b) => (a.date === b.date ? a.slotStart.localeCompare(b.slotStart) : a.date.localeCompare(b.date)))
          .slice(0, 5)

        const specialtyLoad: ApexOptions = {
          chart: { type: "donut", fontFamily: "inherit", foreColor: "#7C8FAC", height: 260 },
          labels: [...bySpecialty.keys()],
          colors: ["var(--color-primary)", "var(--color-secondary)", "var(--color-success)", "var(--color-warning)", "var(--color-error)"],
          dataLabels: { enabled: false },
          legend: { position: "bottom" },
          stroke: { show: false },
          plotOptions: { pie: { donut: { size: "70%" } } },
          tooltip: { theme: "dark" },
        }
        const weeklyAppointments: ApexOptions = {
          chart: { type: "area", toolbar: { show: false }, fontFamily: "inherit", foreColor: "#7C8FAC", height: 260 },
          colors: ["var(--color-primary)"],
          dataLabels: { enabled: false },
          stroke: { curve: "smooth", width: 2 },
          fill: { type: "gradient", gradient: { shadeIntensity: 1, opacityFrom: 0.35, opacityTo: 0.05 } },
          grid: { borderColor: "rgba(0,0,0,0.1)", strokeDashArray: 3 },
          xaxis: { categories: WEEKDAYS, axisBorder: { show: false }, axisTicks: { show: false } },
          tooltip: { theme: "dark" },
        }

        return (
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-12">
              <h4 className="text-xl font-bold">Tổng quan phòng khám</h4>
              <p className="text-sm text-muted-foreground">Số liệu lấy trực tiếp từ hệ thống</p>
            </div>

            <div className="col-span-12 md:col-span-3">
              <StatCard title="Lịch hẹn" value={appointments.length} icon="solar:calendar-linear" color="primary" hint={`${todayCount} lịch hôm nay`} />
            </div>
            <div className="col-span-12 md:col-span-3">
              <StatCard title="Bác sĩ hoạt động" value={activeDoctors.length} icon="solar:stethoscope-linear" color="success" hint={`/${doctors.length} tổng số`} />
            </div>
            <div className="col-span-12 md:col-span-3">
              <StatCard title="Bệnh nhân" value={patientCount} icon="solar:users-group-rounded-linear" color="secondary" />
            </div>
            <div className="col-span-12 md:col-span-3">
              <StatCard title="Doanh thu ước tính" value={currency(revenue)} icon="solar:wallet-money-linear" color="warning" hint="Tổng giá dịch vụ (không tính lịch đã huỷ)" />
            </div>

            <div className="lg:col-span-8 col-span-12">
              <CardBox className="h-full">
                <h5 className="card-title mb-1">Lịch hẹn trong tuần</h5>
                <p className="text-sm text-muted-foreground mb-4">Thứ 2 - Chủ nhật, theo ngày khám</p>
                <Chart options={weeklyAppointments} series={[{ name: "Lịch hẹn", data: weekly }]} type="area" height={260} />
              </CardBox>
            </div>
            <div className="lg:col-span-4 col-span-12">
              <CardBox className="h-full">
                <h5 className="card-title mb-4">Tỉ lệ khám theo chuyên khoa</h5>
                {bySpecialty.size > 0 ? (
                  <Chart options={specialtyLoad} series={[...bySpecialty.values()]} type="donut" height={260} />
                ) : (
                  <p className="text-sm text-muted-foreground">Chưa có lịch hẹn nào.</p>
                )}
              </CardBox>
            </div>

            <div className="lg:col-span-5 col-span-12">
              <CardBox className="h-full">
                <div className="flex items-center justify-between mb-4">
                  <h5 className="card-title">Lịch trực chờ duyệt ({pendingShifts.length})</h5>
                  <Link href="/eclinic/admin/doctor-shifts" className="text-sm text-primary font-medium">
                    Duyệt ngay
                  </Link>
                </div>
                <div className="flex flex-col gap-3">
                  {upcomingShifts.map((s) => (
                    <div key={s.id} className="flex items-center justify-between text-sm border-b border-border pb-2 last:border-0">
                      <div className="flex items-center gap-2">
                        <Avatar className="w-8 h-8">
                          <AvatarFallback>{initial(s.doctorName)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{s.doctorName}</p>
                          <p className="text-xs text-muted-foreground">
                            {s.date} · {slotText(s)}{s.clinicRoom ? ` · Phòng ${s.clinicRoom}` : ""}
                          </p>
                        </div>
                      </div>
                      <StatusBadge status={s.status} />
                    </div>
                  ))}
                  {upcomingShifts.length === 0 && (
                    <p className="text-sm text-muted-foreground">Không có lịch trực nào chờ duyệt.</p>
                  )}
                </div>
              </CardBox>
            </div>

            <div className="lg:col-span-7 col-span-12">
              <CardBox className="h-full">
                <div className="flex items-center justify-between mb-4">
                  <h5 className="card-title">Đội ngũ bác sĩ</h5>
                  <Link href="/eclinic/admin/doctors" className="text-sm text-primary font-medium">
                    Quản lý
                  </Link>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  {doctors.slice(0, 4).map((d) => (
                    <div key={d.id} className="flex items-center gap-3 border border-border rounded-lg p-3">
                      <Avatar className="w-11 h-11">
                        <AvatarImage src={d.avatar} alt={d.name} />
                        <AvatarFallback>{initial(d.name)}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{d.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{d.specialtyNames.join(", ") || "—"}</p>
                        <div className="flex items-center gap-1 text-xs text-warning mt-0.5">
                          <Icon icon="solar:star-bold" width={12} />
                          {d.ratingAvg.toFixed(1)} ({d.ratingCount})
                        </div>
                      </div>
                    </div>
                  ))}
                  {doctors.length === 0 && <p className="text-sm text-muted-foreground">Chưa có bác sĩ nào.</p>}
                </div>
              </CardBox>
            </div>
          </div>
        )
      }}
    </Async>
  )
}
