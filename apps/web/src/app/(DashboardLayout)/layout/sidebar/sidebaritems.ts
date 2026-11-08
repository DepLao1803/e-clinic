import { uniqueId } from 'lodash'

export interface ChildItem {
  id?: number | string
  name?: string
  icon?: string
  children?: ChildItem[]
  item?: unknown
  url?: string
  color?: string
  disabled?: boolean
  subtitle?: string
  badge?: boolean
  badgeType?: string
  isPro?: boolean
}

export interface MenuItem {
  heading?: string
  roles?: string[] // only users with one of these roles see this section
  name?: string
  icon?: string
  id?: number | string
  to?: string
  items?: MenuItem[]
  children?: ChildItem[]
  url?: string
  disabled?: boolean
  subtitle?: string
  badgeType?: string
  badge?: boolean
  isPro?: boolean
}

const SidebarContent: MenuItem[] = [
  {
    heading: 'E-Clinic · Quản trị',
    roles: ['admin'],
    children: [
      {
        id: uniqueId(),
        name: 'Tổng quan',
        icon: 'solar:widget-5-linear',
        url: '/eclinic/admin/dashboard',
      },
      {
        id: uniqueId(),
        name: 'Chuyên khoa',
        icon: 'solar:medical-kit-linear',
        url: '/eclinic/admin/specialties',
      },
      {
        id: uniqueId(),
        name: 'Dịch vụ',
        icon: 'solar:clipboard-list-linear',
        url: '/eclinic/admin/services',
      },
      {
        id: uniqueId(),
        name: 'Ca khám',
        icon: 'solar:clock-square-linear',
        url: '/eclinic/admin/schedule-slots',
      },
      {
        id: uniqueId(),
        name: 'Duyệt lịch trực',
        icon: 'solar:calendar-mark-linear',
        url: '/eclinic/admin/doctor-shifts',
      },
      {
        id: uniqueId(),
        name: 'Lịch hẹn đã xoá',
        icon: 'solar:trash-bin-trash-linear',
        url: '/eclinic/admin/appointments-trash',
      },
      {
        id: uniqueId(),
        name: 'Bác sĩ',
        icon: 'solar:stethoscope-linear',
        url: '/eclinic/admin/doctors',
      },
      {
        id: uniqueId(),
        name: 'Bệnh nhân',
        icon: 'solar:users-group-rounded-linear',
        url: '/eclinic/admin/patients',
      },
      {
        id: uniqueId(),
        name: 'Hồ sơ cá nhân',
        icon: 'solar:user-circle-linear',
        url: '/eclinic/admin/profile',
      },
    ],
  },
  {
    heading: 'E-Clinic · Bác sĩ',
    roles: ['doctor'],
    children: [
      {
        id: uniqueId(),
        name: 'Tổng quan',
        icon: 'solar:widget-5-linear',
        url: '/eclinic/doctor/dashboard',
      },
      {
        id: uniqueId(),
        name: 'Đăng ký lịch trực',
        icon: 'solar:calendar-add-linear',
        url: '/eclinic/doctor/shift-register',
      },
      {
        id: uniqueId(),
        name: 'Xác nhận lịch hẹn',
        icon: 'solar:clipboard-check-linear',
        url: '/eclinic/doctor/appointments',
      },
      {
        id: uniqueId(),
        name: 'Hàng đợi khám',
        icon: 'solar:users-group-two-rounded-linear',
        url: '/eclinic/doctor/queue',
      },
      {
        id: uniqueId(),
        name: 'Bệnh nhân của tôi',
        icon: 'solar:user-id-linear',
        url: '/eclinic/doctor/patients',
      },
      {
        id: uniqueId(),
        name: 'Đánh giá',
        icon: 'solar:star-linear',
        url: '/eclinic/doctor/reviews',
      },
      {
        id: uniqueId(),
        name: 'Hồ sơ cá nhân',
        icon: 'solar:user-circle-linear',
        url: '/eclinic/doctor/profile',
      },
    ],
  },
  {
    heading: 'E-Clinic · Bệnh nhân',
    roles: ['patient'],
    children: [
      {
        id: uniqueId(),
        name: 'Tổng quan',
        icon: 'solar:widget-5-linear',
        url: '/eclinic/patient/dashboard',
      },
      {
        id: uniqueId(),
        name: 'Đặt lịch khám',
        icon: 'solar:calendar-add-linear',
        url: '/eclinic/patient/booking',
      },
      {
        id: uniqueId(),
        name: 'Số thứ tự',
        icon: 'solar:hashtag-square-linear',
        url: '/eclinic/patient/queue',
      },
      {
        id: uniqueId(),
        name: 'Hồ sơ đã khám',
        icon: 'solar:document-medicine-linear',
        url: '/eclinic/patient/history',
      },
      {
        id: uniqueId(),
        name: 'Đánh giá bác sĩ',
        icon: 'solar:star-linear',
        url: '/eclinic/patient/reviews',
      },
      {
        id: uniqueId(),
        name: 'Hồ sơ cá nhân',
        icon: 'solar:user-circle-linear',
        url: '/eclinic/patient/profile',
      },
    ],
  },
]

export default SidebarContent
