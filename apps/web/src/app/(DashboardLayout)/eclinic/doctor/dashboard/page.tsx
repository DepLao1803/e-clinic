"use client"

import Link from "next/link"
import dynamic from "next/dynamic"
import { Icon } from "@iconify/react/dist/iconify.js"
import { ApexOptions } from "apexcharts"
import CardBox from "@/app/components/shared/CardBox"
import StatCard from "@/app/components/eclinic/StatCard"
import StatusBadge from "@/app/components/eclinic/StatusBadge"
import { Async, NoDoctorProfile } from "@/app/components/eclinic/ApiState"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { api } from "@/lib/eclinic/api"
import { avg, RawAppointment, RawDoctorSchedule, RawQueue, RawReview, toAppointment, toQueue, toReview, toShift } from "@/lib/eclinic/data"
import { useAuth } from "@/lib/eclinic/auth"
import { useApi } from "@/lib/eclinic/use-api"
import { initial, slotText, todayLocal } from "@/lib/eclinic/types"

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false })

export default function DoctorDashboardPage() {
  const { user } = useAuth()
  const doctorId = user?.doctor_id
  const state = useApi(async () => {
    if (!doctorId) return { queue: [], appointments: [], reviews: [], shifts: [] }
    const [queue, appts, reviews, shifts] = await Promise.all([
      api<RawQueue[]>(`/queues?doctor_id=${doctorId}`),
      api<RawAppointment[]>("/appointments/doctor"),
      api<RawReview[]>("/reviews/doctor"),
      api<RawDoctorSchedule[]>(`/doctor-schedules?doctor_id=${doctorId}`),
    ])
    return { queue: queue.map(toQueue), appointments: appts.map(toAppointment), reviews: reviews.map(toReview), shifts: shifts.map(toShift) }
  }, [doctorId])

  if (!doctorId) return <NoDoctorProfile />

  return (
    <Async state={state}>
      {({ queue, appointments, reviews, shifts }) => {
        const pendingConfirm = appointments.filter((a) => a.status === "pending")
        const inQueue = queue.filter((q) => q.status === "waiting" || q.status === "examining")
        const doneToday = queue.filter((q) => q.status === "done")
        const avgRating = reviews.length ? avg(reviews.map((r) => r.rating)).toFixed(1) : "—"

        // Số bệnh nhân hôm nay theo từng ca khám
        const bySlot = new Map<string, number>()
        for (const q of queue) {
          const k = slotText(q.appointment)
          bySlot.set(k, (bySlot.get(k) ?? 0) + 1)
        }
        const slotKeys = [...bySlot.keys()].sort()
        const queueChart: ApexOptions = {
          chart: { type: "bar", toolbar: { show: false }, fontFamily: "inherit", foreColor: "#7C8FAC", height: 220 },
          colors: ["var(--color-primary)"],
          plotOptions: { bar: { borderRadius: 6, columnWidth: "40%" } },
          dataLabels: { enabled: false },
          grid: { borderColor: "rgba(0,0,0,0.1)", strokeDashArray: 3 },
          xaxis: { categories: slotKeys, axisBorder: { show: false }, axisTicks: { show: false } },
          yaxis: { labels: { formatter: (v: number) => String(Math.round(v)) } },
          tooltip: { theme: "dark" },
        }

        return (
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-12">
              <CardBox className="bg-gradient-to-r from-primary to-primary/70 border-none text-white">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-14 h-14 border-2 border-white/60">
                      <AvatarFallback>{initial(user?.name)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h4 className="text-xl font-bold mb-1">Chào bác sĩ {user?.name} 👋</h4>
                      <p className="text-white/80 text-sm">
                        {pendingConfirm.length} lịch hẹn chờ xác nhận · {inQueue.length} bệnh nhân trong hàng đợi hôm nay
                      </p>
                    </div>
                  </div>
                  <Link href="/eclinic/doctor/queue">
                    <Button className="bg-white! text-primary! hover:bg-white/90!">
                      <Icon icon="solar:users-group-two-rounded-bold" width={18} className="mr-1" />
                      Vào phòng khám
                    </Button>
                  </Link>
                </div>
              </CardBox>
            </div>

            <div className="col-span-12 md:col-span-3">
              <StatCard title="Chờ xác nhận" value={pendingConfirm.length} icon="solar:clipboard-check-linear" color="warning" />
            </div>
            <div className="col-span-12 md:col-span-3">
              <StatCard title="Trong hàng đợi" value={inQueue.length} icon="solar:users-group-two-rounded-linear" color="primary" />
            </div>
            <div className="col-span-12 md:col-span-3">
              <StatCard title="Đã khám xong" value={doneToday.length} icon="solar:check-circle-linear" color="success" />
            </div>
            <div className="col-span-12 md:col-span-3">
              <StatCard title="Đánh giá trung bình" value={avgRating} icon="solar:star-bold" color="secondary" hint={`${reviews.length} lượt đánh giá`} />
            </div>

            <div className="lg:col-span-8 col-span-12">
              <CardBox className="h-full">
                <h5 className="card-title mb-1">Số bệnh nhân theo ca khám hôm nay</h5>
                <p className="text-sm text-muted-foreground mb-4">Giúp cân đối thời gian khám, tránh trống ca</p>
                {slotKeys.length > 0 ? (
                  <Chart options={queueChart} series={[{ name: "Bệnh nhân", data: slotKeys.map((k) => bySlot.get(k) ?? 0) }]} type="bar" height={220} />
                ) : (
                  <p className="text-sm text-muted-foreground">Hôm nay chưa có bệnh nhân nào đặt lịch.</p>
                )}
              </CardBox>
            </div>

            <div className="lg:col-span-4 col-span-12">
              <CardBox className="h-full">
                <div className="flex items-center justify-between mb-4">
                  <h5 className="card-title">Lịch trực của tôi</h5>
                  <Link href="/eclinic/doctor/shift-register" className="text-sm text-primary font-medium">
                    Đăng ký
                  </Link>
                </div>
                <div className="flex flex-col gap-3">
                  {shifts.slice(0, 4).map((s) => (
                    <div key={s.id} className="flex items-center justify-between text-sm border-b border-border pb-2 last:border-0">
                      <div>
                        <p className="font-medium">{s.date}</p>
                        <p className="text-xs text-muted-foreground">{slotText(s)}{s.clinicRoom ? ` · Phòng ${s.clinicRoom}` : ""}</p>
                      </div>
                      <StatusBadge status={s.status} />
                    </div>
                  ))}
                  {shifts.length === 0 && <p className="text-sm text-muted-foreground">Chưa đăng ký lịch trực.</p>}
                </div>
                <div className="mt-3 pt-3 border-t border-border flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Đã duyệt</span>
                  <span className="font-semibold text-success">{shifts.filter((x) => x.status === "approved").length} ca</span>
                </div>
              </CardBox>
            </div>

            <div className="col-span-12">
              <CardBox>
                <div className="flex items-center justify-between mb-4">
                  <h5 className="card-title">Lịch hẹn chờ xác nhận</h5>
                  <Link href="/eclinic/doctor/appointments" className="text-sm text-primary font-medium">
                    Xem tất cả
                  </Link>
                </div>
                <div className="grid md:grid-cols-3 gap-4">
                  {pendingConfirm.slice(0, 6).map((a) => (
                    <div key={a.id} className="border border-border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-muted-foreground">{a.date}</span>
                        <StatusBadge status={a.status} />
                      </div>
                      <p className="font-semibold text-sm mb-1">{a.patientName}</p>
                      <p className="text-xs text-muted-foreground mb-2">
                        {a.services.join(", ") || "—"} · {slotText(a)}
                      </p>
                      <p className="text-xs line-clamp-2">{a.symptom}</p>
                    </div>
                  ))}
                  {pendingConfirm.length === 0 && (
                    <p className="text-sm text-muted-foreground">Không có lịch hẹn chờ xác nhận.</p>
                  )}
                </div>
              </CardBox>
            </div>
          </div>
        )
      }}
    </Async>
  )
}
