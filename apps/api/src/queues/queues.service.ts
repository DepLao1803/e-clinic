import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { IsIn, IsInt, IsOptional } from 'class-validator';
import { AuthUser } from '../common/decorators/current-user.decorator';
import { todayStr, toDateOnly } from '../common/utils/date.util';
import { PrismaService } from '../prisma/prisma.service';

export const QUEUE_STATUSES = ['waiting', 'examining', 'done', 'absent'] as const;
/** Số lần vắng tối đa trước khi tự huỷ lịch hẹn. */
const MAX_ABSENT = 2;
export class NextPatientDto { @IsOptional() @IsInt() doctor_id?: number; }
export class UpdateQueueStatusDto { @IsIn(QUEUE_STATUSES as unknown as string[], { message: 'Trạng thái hàng đợi không hợp lệ.' }) status: string; }

const flat = <T extends { services: { medicalService: unknown }[] }>(a: T) => {
  const { services, ...rest } = a;
  return { ...rest, medicalServices: services.map((s) => s.medicalService) };
};

@Injectable()
export class QueuesService {
  constructor(private readonly prisma: PrismaService) {}

  private isAdmin(u: AuthUser) { return u.roles.includes('admin'); }
  private today() { return toDateOnly(todayStr()); }

  async doctorToday(doctorId: number) {
    const rows = await this.prisma.queue.findMany({
      where: { doctorId, date: this.today() },
      include: { appointment: { include: { user: { select: { id: true, name: true, phone: true, gender: true, dateOfBirth: true } }, schedule: true, services: { include: { medicalService: true } } } } },
      orderBy: { queueNumber: 'asc' },
    });
    return rows.map((q) => ({ ...q, appointment: flat(q.appointment) }));
  }

  async myToday(userId: number) {
    const rows = await this.prisma.queue.findMany({
      where: { date: this.today(), appointment: { userId, deletedAt: null } },
      include: { appointment: { include: { schedule: true, doctor: { include: { user: { select: { id: true, name: true } }, specialties: { include: { specialty: true } } } } } } },
      orderBy: { queueNumber: 'asc' },
    });
    return rows.map((q) => ({ ...q, appointment: { ...q.appointment, doctor: { ...q.appointment.doctor, specialties: q.appointment.doctor.specialties.map((s) => s.specialty) } } }));
  }

  /** Anonymous board for patients: which number is being served and which numbers are still waiting today. */
  async board(doctorId: number) {
    const rows = await this.prisma.queue.findMany({
      where: { doctorId, date: this.today(), status: { in: ['waiting', 'examining'] } },
      select: { queueNumber: true, status: true }, orderBy: { queueNumber: 'asc' },
    });
    return {
      serving: rows.find((r) => r.status === 'examining')?.queueNumber ?? null,
      waiting: rows.filter((r) => r.status === 'waiting').map((r) => r.queueNumber),
    };
  }

  /** Hardening vs Laravel: a doctor can only see/drive their own queue (admins: any). */
  assertDoctorScope(u: AuthUser, doctorId: number) {
    if (!this.isAdmin(u) && u.doctorId !== doctorId) throw new ForbiddenException('Bạn không có quyền thao tác hàng đợi của bác sĩ khác.');
  }

  async callNext(doctorId: number) {
    const date = this.today();
    const examining = await this.prisma.queue.findMany({ where: { doctorId, date, status: 'examining' }, select: { appointment: { select: { userId: true } } } });
    const busyUsers = examining.map((e) => e.appointment.userId);

    // skip waiting tickets of a patient who is already being examined today
    const next = await this.prisma.queue.findFirst({
      where: { doctorId, date, status: 'waiting', appointment: { status: 'confirmed', ...(busyUsers.length ? { userId: { notIn: busyUsers } } : {}) } }, // only appointments the doctor has confirmed
      orderBy: { queueNumber: 'asc' },
    });
    if (!next) throw new BadRequestException('Hết bệnh nhân trong hàng đợi hôm nay rồi bác sĩ ơi!');
    return this.prisma.queue.update({ where: { id: next.id }, data: { status: 'examining', startedAt: new Date() } });
  }

  async changeStatus(id: number, status: string, u: AuthUser) {
    const current = await this.prisma.queue.findUnique({ where: { id } });
    if (!current) throw new NotFoundException('Không tìm thấy lượt khám trong hàng đợi.');
    this.assertDoctorScope(u, current.doctorId);

    return this.prisma.$transaction(async (tx) => {
      const queue = await tx.queue.update({ where: { id }, data: { status, ...(status === 'examining' ? { startedAt: new Date() } : {}) } });
      if (status === 'done') {
        await tx.appointment.update({ where: { id: queue.appointmentId }, data: { status: 'completed' } });
      } else if (status === 'absent') {
        const strikes = current.absentCount + 1;
        if (strikes >= MAX_ABSENT) { // vắng lần 2: huỷ lịch hẹn
          await tx.appointment.update({ where: { id: queue.appointmentId }, data: { status: 'cancelled' } });
          return tx.queue.update({ where: { id }, data: { status: 'absent', absentCount: strikes } });
        }
        // vắng lần 1: đẩy xuống cuối hàng, vẫn chờ khám
        const max = await tx.queue.aggregate({ where: { doctorId: current.doctorId, date: current.date }, _max: { queueNumber: true } });
        return tx.queue.update({ where: { id }, data: { status: 'waiting', absentCount: strikes, startedAt: null, queueNumber: (max._max.queueNumber ?? 0) + 1 } });
      }
      return queue;
    });
  }
}
