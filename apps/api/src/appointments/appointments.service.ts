import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AuthUser } from '../common/decorators/current-user.decorator';
import { todayStr, toDateOnly } from '../common/utils/date.util';
import { PrismaService } from '../prisma/prisma.service';
import { StoreAppointmentDto, UpdateAppointmentDto } from './dto/appointment.dto';

const MAX_PATIENTS_PER_SLOT = 4;

const include = {
  services: { include: { medicalService: true } },
  schedule: true,
  doctor: { include: { user: { select: { id: true, name: true } }, specialties: { include: { specialty: true } } } },
  user: { select: { id: true, name: true, email: true, phone: true, gender: true, dateOfBirth: true, avatarUrl: true } },
} satisfies Prisma.AppointmentInclude;
type Full = Prisma.AppointmentGetPayload<{ include: typeof include }>;

/** Eloquent `medicalServices` / `doctor.specialties` were direct relations; Prisma gives join rows → flatten them. */
function shape(a: Full) {
  const { services, doctor, ...rest } = a;
  return {
    ...rest,
    medicalServices: services.map((s) => s.medicalService),
    doctor: { ...doctor, specialties: doctor.specialties.map((s) => s.specialty) },
  };
}

@Injectable()
export class AppointmentsService {
  constructor(private readonly prisma: PrismaService) {}

  // ---------- AppointmentPolicy ----------
  private isAdmin(u: AuthUser) { return u.roles.includes('admin'); } // Policy::before()
  private assertOwner(u: AuthUser, a: { userId: number }, msg: string) {
    if (!this.isAdmin(u) && a.userId !== u.id) throw new ForbiddenException(msg);
  }

  // ---------- reads ----------
  private async findOrFail(id: number) {
    const a = await this.prisma.appointment.findFirst({ where: { id, deletedAt: null }, include });
    if (!a) throw new NotFoundException('Lịch hẹn không tồn tại hoặc đã bị xóa.');
    return a;
  }
  async listMine(userId: number) {
    return (await this.prisma.appointment.findMany({ where: { userId, deletedAt: null }, include, orderBy: { id: 'desc' } })).map(shape);
  }
  async listAll() { return (await this.prisma.appointment.findMany({ where: { deletedAt: null }, include, orderBy: { id: 'desc' } })).map(shape); }
  /** Every live appointment of one doctor (newest first). Admins may pass any doctor; doctors only their own. */
  async listForDoctor(u: AuthUser, doctorId?: number) {
    const id = this.isAdmin(u) ? doctorId ?? u.doctorId : u.doctorId;
    if (!id) return [];
    return (await this.prisma.appointment.findMany({ where: { doctorId: id, deletedAt: null }, include, orderBy: [{ appointmentDate: 'desc' }, { id: 'desc' }] })).map(shape);
  }
  async show(id: number, u: AuthUser) {
    const a = await this.findOrFail(id);
    this.assertOwner(u, a, 'Bạn không có quyền xem lịch hẹn này.');
    return shape(a);
  }
  async myTrash(userId: number) {
    return (await this.prisma.appointment.findMany({ where: { userId, deletedAt: { not: null } }, include, orderBy: { id: 'desc' } })).map(shape);
  }
  async trash() {
    return (await this.prisma.appointment.findMany({ where: { deletedAt: { not: null } }, include, orderBy: { id: 'desc' } })).map(shape);
  }

  // ---------- business rules ----------
  private assertNotPast(date: string) {
    if (date < todayStr()) throw new BadRequestException('Không thể đặt hoặc dời lịch vào một ngày trong quá khứ.');
  }

  private async checkAvailability(
    tx: Prisma.TransactionClient, userId: number, doctorId: number, scheduleId: number, date: string, excludeId?: number,
  ) {
    const d = toDateOnly(date);
    const live = { appointmentDate: d, status: { not: 'cancelled' }, deletedAt: null, ...(excludeId ? { id: { not: excludeId } } : {}) };

    if (await tx.appointment.findFirst({ where: { ...live, userId, scheduleId } }))
      throw new BadRequestException('Bạn đã có một lịch hẹn khác trong khung giờ này rồi.');

    if (!(await tx.doctorSchedule.findFirst({ where: { doctorId, scheduleId, workingDate: d, status: 'approved', deletedAt: null } })))
      throw new BadRequestException('Bác sĩ không có lịch làm việc vào khung giờ này.');

    if ((await tx.appointment.count({ where: { ...live, doctorId, scheduleId } })) >= MAX_PATIENTS_PER_SLOT)
      throw new BadRequestException('Khung giờ này đã nhận đủ số lượng bệnh nhân tối đa.');
  }

  /**
   * Queue numbers are per DOCTOR per DAY. (Laravel's generateNextQueueNumber() counted per DAY across all doctors,
   * while the "absent → move to end" logic counted per doctor — inconsistent. See MIGRATION.md → Behaviour changes.)
   */
  private async createQueue(tx: Prisma.TransactionClient, appointmentId: number, doctorId: number, date: string) {
    const max = await tx.queue.aggregate({ where: { doctorId, date: toDateOnly(date) }, _max: { queueNumber: true } });
    await tx.queue.create({
      data: { appointmentId, doctorId, date: toDateOnly(date), queueNumber: (max._max.queueNumber ?? 0) + 1, status: 'waiting' },
    });
  }

  /** Serialise bookings per doctor: closes the check-then-insert race the Laravel version had (overbooking / duplicate queue numbers). */
  private lockDoctor(tx: Prisma.TransactionClient, doctorId: number) {
    return tx.$queryRaw`SELECT id FROM doctors WHERE id = ${doctorId} FOR UPDATE`;
  }

  // ---------- commands ----------
  async create(userId: number, dto: StoreAppointmentDto) {
    this.assertNotPast(dto.appointment_date);
    const serviceIds = [...new Set(dto.service_ids)];

    const id = await this.prisma.$transaction(async (tx) => {
      await this.lockDoctor(tx, dto.doctor_id);
      await this.checkAvailability(tx, userId, dto.doctor_id, dto.schedule_id, dto.appointment_date);
      const services = await tx.medicalService.count({ where: { id: { in: serviceIds }, deletedAt: null, isActive: true } });
      if (services !== serviceIds.length) throw new BadRequestException('Có dịch vụ y tế không hợp lệ hoặc đã ngừng cung cấp.');

      const a = await tx.appointment.create({
        data: {
          userId, doctorId: dto.doctor_id, scheduleId: dto.schedule_id, appointmentDate: toDateOnly(dto.appointment_date),
          reason: dto.reason, type: dto.type, status: 'pending',
          services: { create: serviceIds.map((medicalServiceId) => ({ medicalServiceId })) },
        },
      });
      await this.createQueue(tx, a.id, dto.doctor_id, dto.appointment_date);
      return a.id;
    });
    return shape(await this.findOrFail(id));
  }

  async update(id: number, u: AuthUser, dto: UpdateAppointmentDto) {
    const cur = await this.findOrFail(id);
    this.assertOwner(u, cur, 'Bạn không thể sửa lịch hẹn này vì đây không phải là lịch hẹn của bạn.');

    const { service_ids, ...fields } = dto;
    const touchesSlot = fields.doctor_id !== undefined || fields.schedule_id !== undefined || fields.appointment_date !== undefined;
    if (!Object.keys(fields).length && !service_ids?.length) return shape(cur);

    const curDate = cur.appointmentDate.toISOString().slice(0, 10);
    const next = {
      doctorId: fields.doctor_id ?? cur.doctorId,
      scheduleId: fields.schedule_id ?? cur.scheduleId,
      date: fields.appointment_date ?? curDate,
    };

    await this.prisma.$transaction(async (tx) => {
      if (touchesSlot) {
        this.assertNotPast(next.date);
        await this.lockDoctor(tx, next.doctorId);
        await this.checkAvailability(tx, cur.userId, next.doctorId, next.scheduleId, next.date, id);
      }
      await tx.appointment.update({
        where: { id },
        data: {
          doctorId: fields.doctor_id, scheduleId: fields.schedule_id, status: fields.status, type: fields.type,
          reason: fields.reason?.trim(),
          appointmentDate: fields.appointment_date ? toDateOnly(fields.appointment_date) : undefined,
        },
      });
      if (service_ids?.length) {
        await tx.appointmentMedicalService.deleteMany({ where: { appointmentId: id } }); // sync()
        await tx.appointmentMedicalService.createMany({ data: [...new Set(service_ids)].map((medicalServiceId) => ({ appointmentId: id, medicalServiceId })) });
      }
      if (next.date !== curDate || next.doctorId !== cur.doctorId) {
        await tx.queue.deleteMany({ where: { appointmentId: id } });
        await this.createQueue(tx, id, next.doctorId, next.date);
      }
    });
    return shape(await this.findOrFail(id));
  }

  /** Policy::confirm — only the appointment's own doctor (admins bypass). */
  async confirm(id: number, u: AuthUser) {
    const a = await this.findOrFail(id);
    if (!this.isAdmin(u) && !(u.doctorId && u.doctorId === a.doctorId)) throw new ForbiddenException('Bạn không có quyền xác nhận lịch hẹn này.');
    if (a.status !== 'pending') throw new BadRequestException('Chỉ có thể xác nhận lịch hẹn đang chờ xác nhận.');
    await this.prisma.appointment.update({ where: { id }, data: { status: 'confirmed' } });
    return shape(await this.findOrFail(id));
  }

  /** Doctor (of this appointment) or admin declines a pending appointment: cancelled + removed from the queue. */
  async reject(id: number, u: AuthUser) {
    const a = await this.findOrFail(id);
    if (!this.isAdmin(u) && !(u.doctorId && u.doctorId === a.doctorId)) throw new ForbiddenException('Bạn không có quyền từ chối lịch hẹn này.');
    if (a.status !== 'pending') throw new BadRequestException('Chỉ có thể từ chối lịch hẹn đang chờ xác nhận.');
    await this.prisma.$transaction([
      this.prisma.appointment.update({ where: { id }, data: { status: 'cancelled' } }),
      this.prisma.queue.deleteMany({ where: { appointmentId: id } }),
    ]);
    return shape(await this.findOrFail(id));
  }

  /** Owner (patient) or admin cancels a pending/confirmed appointment: status → cancelled, queue ticket removed, slot freed. */
  async cancel(id: number, u: AuthUser) {
    const a = await this.findOrFail(id);
    this.assertOwner(u, a, 'Bạn không có quyền huỷ lịch hẹn này.');
    if (!['pending', 'confirmed'].includes(a.status)) throw new BadRequestException('Chỉ có thể huỷ lịch hẹn đang chờ hoặc đã xác nhận.');
    if (a.appointmentDate.toISOString().slice(0, 10) < todayStr()) throw new BadRequestException('Không thể huỷ lịch hẹn đã qua ngày khám.');
    await this.prisma.$transaction([
      this.prisma.appointment.update({ where: { id }, data: { status: 'cancelled' } }),
      this.prisma.queue.deleteMany({ where: { appointmentId: id } }),
    ]);
    return shape(await this.findOrFail(id));
  }

  async destroy(id: number, u: AuthUser) {
    const a = await this.findOrFail(id);
    this.assertOwner(u, a, 'Bạn không thể xóa lịch hẹn này. Chỉ chủ sở hữu mới có quyền thực hiện.');
    await this.prisma.$transaction([
      this.prisma.appointment.update({ where: { id }, data: { deletedAt: new Date() } }),
      this.prisma.queue.deleteMany({ where: { appointmentId: id } }),
    ]);
  }

  async restore(id: number, u: AuthUser) {
    const a = await this.prisma.appointment.findFirst({ where: { id, deletedAt: { not: null } } });
    if (!a) throw new NotFoundException('Lịch hẹn không tồn tại trong thùng rác.');
    this.assertOwner(u, a, 'Bạn không có quyền khôi phục lịch hẹn này.');
    const date = a.appointmentDate.toISOString().slice(0, 10);
    this.assertNotPast(date);
    await this.prisma.$transaction(async (tx) => {
      await this.lockDoctor(tx, a.doctorId);
      await this.checkAvailability(tx, a.userId, a.doctorId, a.scheduleId, date, id);
      await tx.appointment.update({ where: { id }, data: { deletedAt: null } });
      if (a.status !== 'cancelled') await this.createQueue(tx, id, a.doctorId, date); // a cancelled one stays out of the queue
    });
  }

  async forceDelete(id: number) {
    const r = await this.prisma.appointment.deleteMany({ where: { id } }); // admin-only route
    if (!r.count) throw new NotFoundException('Lịch hẹn không tồn tại.');
  }
}
