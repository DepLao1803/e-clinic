'use client'

import { useState } from 'react'
import CardBox from '@/app/components/shared/CardBox'
import PageHeader from '@/app/components/eclinic/PageHeader'
import { ActionError, Async } from '@/app/components/eclinic/ApiState'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { api, post } from '@/lib/eclinic/api'
import { RawAppointment, RawReview, toAppointment, toReview } from '@/lib/eclinic/data'
import { useAction, useApi } from '@/lib/eclinic/use-api'
import { initial } from '@/lib/eclinic/types'
import { Icon } from '@iconify/react'

export default function PatientReviewsPage() {
  const state = useApi(async () => {
    const [appts, reviews] = await Promise.all([
      api<RawAppointment[]>('/appointments'),
      api<RawReview[]>('/reviews/my'),
    ])
    return {
      done: appts.map(toAppointment).filter((a) => a.status === 'completed'),
      reviews: reviews.map(toReview),
    }
  })
  const [rating, setRating] = useState<Record<string, number>>({})
  const [comment, setComment] = useState<Record<string, string>>({})
  const [errorFor, setErrorFor] = useState<string | null>(null)
  const action = useAction(state.reload)

  const send = async (appointmentId: string) => {
    setErrorFor(appointmentId)
    await action.run(() =>
      post('/reviews', {
        appointment_id: Number(appointmentId),
        rating: rating[appointmentId],
        ...(comment[appointmentId]?.trim() ? { comment: comment[appointmentId].trim() } : {}),
      })
    )
  }

  return (
    <CardBox className="max-w-2xl mx-auto">
      <PageHeader
        title="Đánh giá bác sĩ"
        description="Chia sẻ trải nghiệm của bạn sau mỗi lần khám để giúp phòng khám cải thiện chất lượng."
      />
      <Async state={state}>
        {({ done, reviews }) => (
          <div className="flex flex-col gap-4">
            {done.map((a) => {
              const reviewed = reviews.find((r) => r.appointmentId === a.id)
              const r = rating[a.id] || 0
              return (
                <div key={a.id} className="border border-border rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <Avatar className="w-10 h-10">
                      <AvatarFallback>{initial(a.doctorName)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium text-sm">{a.doctorName}</div>
                      <div className="text-xs text-muted-foreground">{a.date}</div>
                    </div>
                  </div>

                  {reviewed ? (
                    <div>
                      <div className="flex gap-0.5 text-warning mb-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Icon key={i} icon={i < reviewed.rating ? 'solar:star-bold' : 'solar:star-linear'} />
                        ))}
                      </div>
                      <p className="text-sm text-success flex items-center gap-1.5">
                        <Icon icon="solar:check-circle-bold" /> Cảm ơn bạn đã đánh giá!
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="flex gap-1 mb-3 text-warning text-xl">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => setRating({ ...rating, [a.id]: i + 1 })}>
                            <Icon icon={i < r ? 'solar:star-bold' : 'solar:star-linear'} />
                          </button>
                        ))}
                      </div>
                      <Textarea
                        placeholder="Nhận xét của bạn..."
                        rows={3}
                        value={comment[a.id] || ''}
                        onChange={(e) => setComment({ ...comment, [a.id]: e.target.value })}
                      />
                      {errorFor === a.id && <div className="mt-2"><ActionError message={action.error} /></div>}
                      <Button
                        className="mt-3"
                        size="sm"
                        disabled={!r || action.busy}
                        onClick={() => send(a.id)}>
                        Gửi đánh giá
                      </Button>
                    </>
                  )}
                </div>
              )
            })}
            {done.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                Bạn chưa có lượt khám nào hoàn tất để đánh giá
              </div>
            )}
          </div>
        )}
      </Async>
    </CardBox>
  )
}
