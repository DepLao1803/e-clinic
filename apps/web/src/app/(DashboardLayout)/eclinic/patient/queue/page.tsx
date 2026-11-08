'use client'

import CardBox from '@/app/components/shared/CardBox'
import PageHeader from '@/app/components/eclinic/PageHeader'
import StatusBadge from '@/app/components/eclinic/StatusBadge'
import { Async } from '@/app/components/eclinic/ApiState'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { api } from '@/lib/eclinic/api'
import { RawQueue, toQueue } from '@/lib/eclinic/data'
import { useApi } from '@/lib/eclinic/use-api'
import { initial, slotText } from '@/lib/eclinic/types'
import { Icon } from '@iconify/react'

interface Board {
  serving: number | null
  waiting: number[]
}

// Thời gian khám trung bình cho mỗi bệnh nhân, dùng để ước tính giờ vào khám.
const AVG_MINUTES_PER_PATIENT = 12

export default function PatientQueuePage() {
  const state = useApi(async () => {
    const items = (await api<RawQueue[]>('/queues')).map(toQueue)
    const ids = [...new Set(items.map((q) => q.doctorId))]
    const boards = await Promise.all(
      ids.map((id) => api<Board>(`/queues/board/${id}`).then((b) => [id, b] as const))
    )
    return { items, boards: Object.fromEntries(boards) as Record<string, Board> }
  })

  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto">
      <PageHeader
        title="Số thứ tự khám bệnh"
        description="Số thứ tự của các lượt khám hôm nay của bạn."
      />
      <Async state={state}>
        {({ items, boards }) => {
          const mine = items.filter((q) => q.status !== 'absent')
          return (
            <>
              {mine.map((q) => {
                const a = q.appointment
                const isReady = q.status === 'examining'
                const board = boards[q.doctorId]
                const ahead = board ? board.waiting.filter((n) => n < q.queueNumber).length + (board.serving ? 1 : 0) : 0
                return (
                  <CardBox key={q.id} className="overflow-hidden">
                    <div className="flex items-center gap-3 -mx-6 -mt-6 mb-6 px-6 py-4 bg-primary/5 border-b border-border">
                      <Avatar className="w-11 h-11">
                        <AvatarFallback>{initial(a.doctorName)}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-sm truncate">{a.doctorName}</p>
                        <p className="text-xs text-muted-foreground truncate">{a.specialtyName}</p>
                      </div>
                      <StatusBadge status={q.status} />
                    </div>

                    <div className="flex flex-col items-center text-center">
                      <div
                        className={`relative flex items-center justify-center w-40 h-40 rounded-full border-8 mb-4 ${
                          isReady ? 'border-success bg-success/10' : 'border-primary/20 bg-primary/5'
                        }`}
                      >
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">STT của bạn</p>
                          <div className={`text-5xl font-bold ${isReady ? 'text-success' : 'text-primary'}`}>
                            {q.queueNumber}
                          </div>
                        </div>
                      </div>

                      <div className="text-sm text-muted-foreground mb-4">
                        {slotText(a)} · {a.date}
                      </div>

                      {q.status === 'waiting' && (
                        <div className="w-full flex items-center justify-center gap-2 text-sm bg-lightinfo text-info rounded-lg py-3 px-4">
                          <Icon icon="solar:clock-circle-linear" width={18} />
                          {a.status === 'pending'
                            ? 'Đang chờ bác sĩ xác nhận lịch hẹn · '
                            : ''}
                          Đang khám số <b>{board?.serving ?? '—'}</b> · còn <b>{ahead}</b> người phía trước · ước tính ~
                          <b>{ahead * AVG_MINUTES_PER_PATIENT}</b> phút
                        </div>
                      )}
                      {isReady && (
                        <div className="w-full flex items-center justify-center gap-2 text-sm bg-lightsuccess text-success rounded-lg py-3 px-4 animate-pulse">
                          <Icon icon="solar:bell-bold" width={18} />
                          Đến lượt bạn — vui lòng vào phòng khám
                        </div>
                      )}
                      {q.status === 'done' && (
                        <div className="w-full flex items-center justify-center gap-2 text-sm bg-lightsuccess text-success rounded-lg py-3 px-4">
                          <Icon icon="solar:check-circle-bold" width={18} />
                          Bạn đã khám xong
                        </div>
                      )}
                    </div>
                  </CardBox>
                )
              })}
              {mine.length === 0 && (
                <CardBox className="p-10 text-center">
                  <Icon icon="solar:users-group-two-rounded-linear" width={40} className="mx-auto text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground">Hôm nay bạn không có lượt khám nào trong hàng đợi</p>
                </CardBox>
              )}
            </>
          )
        }}
      </Async>
    </div>
  )
}
