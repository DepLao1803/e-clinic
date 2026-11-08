"use client"

import Link from "next/link"
import dynamic from "next/dynamic"
import { Icon } from "@iconify/react/dist/iconify.js"
import { ApexOptions } from "apexcharts"
import CardBox from "@/app/components/shared/CardBox"
import StatCard from "@/app/components/eclinic/StatCard"
import StatusBadge from "@/app/components/eclinic/StatusBadge"
import { Async } from "@/app/components/eclinic/ApiState"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { api } from "@/lib/eclinic/api"
import { RawAppointment, RawQueue, RawReview, toAppointment, toQueue } from "@/lib/eclinic/data"
import { useApi } from "@/lib/eclinic/use-api"
import { initial, slotText, todayLocal } from "@/lib/eclinic/types"

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false })

/** The last 6 calendar months as { key: 'yyyy-mm', label: 'T9' }. */
function lastMonths(n = 6) {
  const now = new Date()
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (n - 1 - i), 1)
    return { key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`, label: `T${d.getMonth() + 1}` }
  })
}

export default function PatientDashboardPage() {
  const state = useApi(async () => {
    const [appts, reviews, queue] = await Promise.all([
      api<RawAppointment[]>("/appointments"),
      api<RawReview[]>("/reviews/my"),
      api<RawQueue[]>("/queues"),
    ])
    return {
      appointments: appts.map(toAppointment),
      reviewCount: reviews.length,
      queue: queue.map(toQueue),
    }
  })

  return (
    <Async state={state}>
      {({ appointments, reviewCount, queue }) => {
        const today = todayLocal()
        const upcoming = appointments
          .filter((a) => (a.status === "pending" || a.status === "confirmed") && a.date >= today)
          .sort((a, b) => a.date.localeCompare(b.date))
        const done = appointments.filter((a) => a.status === "completed")
        const nextAppointment = upcoming[0]
        const nextTicket = nextAppointment ? queue.find((q) => q.appointmentId === nextAppointment.id) : undefined
        const recent = [...appointments].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3)

        const months = lastMonths()
        const visitSeries = [
          { name: "Lượt khám", data: months.map((m) => appointments.filter((a) => a.date.startsWith(m.key) && a.status !== "cancelled").length) },
        ]
        const visitTrend: ApexOptions = {
          chart: { type: "area", toolbar: { show: false }, fontFamily: "inherit", foreColor: "#7C8FAC", height: 220 },
          colors: ["var(--color-primary)"],
          dataLabels: { enabled: false },
          stroke: { curve: "smooth", width: 2 },
          fill: { type: "gradient", gradient: { shadeIntensity: 1, opacityFrom: 0.35, opacityTo: 0.05, stops: [0, 90, 100] } },
          grid: { borderColor: "rgba(0,0,0,0.1)", strokeDashArray: 3 },
          xaxis: { categories: months.map((m) => m.label), axisBorder: { show: false }, axisTicks: { show: false } },
          yaxis: { labels: { formatter: (v: number) => String(Math.round(v)) } },
          tooltip: { theme: "dark" },
        }

        return (
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-12">
              <CardBox className="bg-gradient-to-r from-primary to-primary/70 border-none text-white">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h4 className="text-xl font-bold mb-1">Chào mừng trở lại 👋</h4>
                    <p className="text-white/80 text-sm max-w-md">
                      Theo dõi lịch hẹn, số thứ tự và hồ sơ khám bệnh của bạn ngay tại đây.
                    </p>
                  </div>
                  <Link href="/eclinic/patient/booking">
                    <Button className="bg-white! text-primary! hover:bg-white/90!">
                      <Icon icon="solar:calendar-add-bold" width={18} className="mr-1" />
                      Đặt lịch khám mới
                    </Button>
                  </Link>
                </div>
              </CardBox>
            </div>

            <div className="col-span-12 md:col-span-3">
              <StatCard title="Lịch hẹn sắp tới" value={upcoming.length} icon="solar:calendar-linear" color="primary" />
            </div>
            <div className="col-span-12 md:col-span-3">
              <StatCard title="Đã khám xong" value={done.length} icon="solar:clipboard-check-linear" color="success" />
            </div>
            <div className="col-span-12 md:col-span-3">
              <StatCard
                title="STT hôm nay"
                value={nextTicket?.queueNumber ?? "—"}
                icon="solar:hashtag-square-linear"
                color="warning"
                hint={nextTicket ? "Xem chi tiết hàng đợi" : "Chưa có lượt khám hôm nay"}
              />
            </div>
            <div className="col-span-12 md:col-span-3">
              <StatCard title="Đánh giá đã gửi" value={reviewCount} icon="solar:star-linear" color="secondary" />
            </div>

            <div className="lg:col-span-8 col-span-12">
              <CardBox className="h-full">
                <h5 className="card-title mb-1">Lịch sử khám gần đây</h5>
                <p className="text-sm text-muted-foreground mb-4">6 tháng gần nhất</p>
                <Chart options={visitTrend} series={visitSeries} type="area" height={220} />
              </CardBox>
            </div>
            <div className="lg:col-span-4 col-span-12">
              <CardBox className="h-full">
                <h5 className="card-title mb-4">Lịch hẹn kế tiếp</h5>
                {nextAppointment ? (
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-12 h-12">
                        <AvatarFallback>{initial(nextAppointment.doctorName)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold">{nextAppointment.doctorName}</p>
                        <p className="text-xs text-muted-foreground">{nextAppointment.specialtyName}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Ca khám</span>
                      <span className="font-medium">{slotText(nextAppointment)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Ngày khám</span>
                      <span className="font-medium">{nextAppointment.date}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Trạng thái</span>
                      <StatusBadge status={nextAppointment.status} />
                    </div>
                    <Link href="/eclinic/patient/queue">
                      <Button variant="outline" className="w-full mt-2">
                        Xem hàng đợi
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Icon icon="solar:calendar-linear" width={40} className="mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground mb-3">Bạn chưa có lịch hẹn nào sắp tới</p>
                    <Link href="/eclinic/patient/booking">
                      <Button size="sm">Đặt lịch ngay</Button>
                    </Link>
                  </div>
                )}
              </CardBox>
            </div>

            <div className="col-span-12">
              <CardBox>
                <div className="flex items-center justify-between mb-4">
                  <h5 className="card-title">Hồ sơ đã khám gần đây</h5>
                  <Link href="/eclinic/patient/history" className="text-sm text-primary font-medium">
                    Xem tất cả
                  </Link>
                </div>
                <div className="grid md:grid-cols-3 gap-4">
                  {recent.map((a) => (
                    <div key={a.id} className="border border-border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-muted-foreground">{a.date}</span>
                        <StatusBadge status={a.status} />
                      </div>
                      <p className="font-semibold text-sm mb-1">{a.doctorName}</p>
                      <p className="text-xs text-muted-foreground mb-2">{a.specialtyName}</p>
                      <p className="text-xs line-clamp-2">{a.symptom}</p>
                    </div>
                  ))}
                  {appointments.length === 0 && (
                    <p className="text-sm text-muted-foreground">Chưa có lịch sử khám.</p>
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
