import { Badge } from '@/components/ui/badge'

const MAP: Record<string, { label: string; variant: any }> = {
  active: { label: 'Đang bật', variant: 'lightSuccess' },
  inactive: { label: 'Đã tắt', variant: 'lightWarning' },
  trashed: { label: 'Thùng rác', variant: 'lightError' },
  pending: { label: 'Chờ duyệt', variant: 'lightWarning' },
  approved: { label: 'Đã duyệt', variant: 'lightSuccess' },
  rejected: { label: 'Từ chối', variant: 'lightError' },
  confirmed: { label: 'Đã xác nhận', variant: 'lightInfo' },
  completed: { label: 'Đã khám xong', variant: 'lightSuccess' },
  waiting: { label: 'Đang chờ', variant: 'lightInfo' },
  examining: { label: 'Đang khám', variant: 'lightPrimary' },
  absent: { label: 'Vắng mặt', variant: 'lightError' },
  in_queue: { label: 'Trong hàng đợi', variant: 'lightInfo' },
  in_progress: { label: 'Đang khám', variant: 'lightPrimary' },
  done: { label: 'Đã khám xong', variant: 'lightSuccess' },
  no_show: { label: 'Không đến', variant: 'lightError' },
  cancelled: { label: 'Đã huỷ', variant: 'lightError' },
}

export default function StatusBadge({ status }: { status: string }) {
  const m = MAP[status] || { label: status, variant: 'lightSecondary' }
  return <Badge variant={m.variant}>{m.label}</Badge>
}
