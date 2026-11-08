'use client'

import CardBox from '@/app/components/shared/CardBox'
import PageHeader from '@/app/components/eclinic/PageHeader'
import { Async, NoDoctorProfile } from '@/app/components/eclinic/ApiState'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { api } from '@/lib/eclinic/api'
import { avg, RawReview, toReview } from '@/lib/eclinic/data'
import { useAuth } from '@/lib/eclinic/auth'
import { useApi } from '@/lib/eclinic/use-api'
import { Icon } from '@iconify/react'

export default function DoctorReviewsPage() {
  const { user } = useAuth()
  const doctorId = user?.doctor_id
  const state = useApi(async () => {
    if (!doctorId) return []
    return (await api<RawReview[]>('/reviews/doctor')).map(toReview)
  }, [doctorId])

  if (!doctorId) return <NoDoctorProfile />

  return (
    <Async state={state}>
      {(items) => {
        const ratingAvg = avg(items.map((r) => r.rating))
        const breakdown = [5, 4, 3, 2, 1].map((star) => ({
          star,
          count: items.filter((r) => r.rating === star).length,
        }))
        return (
          <div className="grid grid-cols-12 gap-6">
            {/* Rating summary */}
            <div className="col-span-12 lg:col-span-4">
              <CardBox className="text-center lg:sticky lg:top-6">
                <p className="text-sm text-muted-foreground mb-1">Điểm đánh giá trung bình</p>
                <div className="text-5xl font-bold text-warning mb-2">{ratingAvg.toFixed(1)}</div>
                <div className="flex items-center justify-center gap-0.5 text-warning mb-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Icon
                      key={i}
                      icon={i < Math.round(ratingAvg) ? 'solar:star-bold' : 'solar:star-linear'}
                      width={18}
                    />
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mb-5">{items.length} lượt đánh giá</p>

                <div className="flex flex-col gap-2 text-left">
                  {breakdown.map(({ star, count }) => (
                    <div key={star} className="flex items-center gap-2 text-xs">
                      <span className="w-8 text-muted-foreground">{star} sao</span>
                      <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full bg-warning rounded-full"
                          style={{ width: `${items.length ? (count / items.length) * 100 : 0}%` }}
                        />
                      </div>
                      <span className="w-5 text-right text-muted-foreground">{count}</span>
                    </div>
                  ))}
                </div>
              </CardBox>
            </div>

            {/* Review list */}
            <div className="col-span-12 lg:col-span-8">
              <CardBox>
                <PageHeader title="Nhận xét từ bệnh nhân" />
                <div className="flex flex-col gap-4">
                  {items.map((r) => (
                    <div key={r.id} className="flex gap-3 border-b border-border pb-4 last:border-0 last:pb-0">
                      <Avatar className="w-10 h-10 shrink-0">
                        <AvatarFallback>{r.patientName?.[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between flex-wrap gap-1">
                          <p className="font-medium text-sm">{r.patientName}</p>
                          <div className="flex items-center gap-0.5 text-warning">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Icon
                                key={i}
                                icon={i < r.rating ? 'solar:star-bold' : 'solar:star-linear'}
                                width={14}
                              />
                            ))}
                          </div>
                        </div>
                        {r.comment && <p className="text-sm text-muted-foreground mt-1">{r.comment}</p>}
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(r.createdAt).toLocaleDateString('vi-VN')}
                        </p>
                      </div>
                    </div>
                  ))}
                  {items.length === 0 && (
                    <div className="text-center text-muted-foreground py-10">
                      <Icon icon="solar:star-linear" width={28} className="mx-auto mb-2" />
                      Chưa có đánh giá nào
                    </div>
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
