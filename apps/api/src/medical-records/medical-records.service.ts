import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { IsInt, IsOptional, IsString } from 'class-validator';
import { AuthUser } from '../common/decorators/current-user.decorator';
import { PrismaService } from '../prisma/prisma.service';

export class CreateMedicalRecordDto {
  @IsInt() appointment_id: number;
  @IsString() diagnosis: string;
  @IsString() prescription: string;
  @IsOptional() @IsString() notes?: string;
}

@Injectable()
export class MedicalRecordsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(u: AuthUser, dto: CreateMedicalRecordDto) {
    const a = await this.prisma.appointment.findFirst({ where: { id: dto.appointment_id, deletedAt: null } });
    if (!a) throw new NotFoundException('Lịch hẹn không tồn tại.');
    if (!u.roles.includes('admin') && u.doctorId !== a.doctorId) throw new ForbiddenException('Chỉ bác sĩ phụ trách mới được ghi hồ sơ bệnh án.');
    return this.prisma.medicalRecord.create({ data: { appointmentId: a.id, diagnosis: dto.diagnosis, prescription: dto.prescription, notes: dto.notes } });
  }

  async byAppointment(appointmentId: number, u: AuthUser) {
    const a = await this.prisma.appointment.findFirst({ where: { id: appointmentId } });
    if (!a) throw new NotFoundException('Lịch hẹn không tồn tại.');
    const allowed = u.roles.includes('admin') || a.userId === u.id || (u.doctorId && u.doctorId === a.doctorId);
    if (!allowed) throw new ForbiddenException('Bạn không có quyền xem hồ sơ này.');
    return this.prisma.medicalRecord.findMany({ where: { appointmentId }, orderBy: { id: 'desc' } });
  }

  mine(userId: number) {
    return this.prisma.medicalRecord.findMany({
      where: { appointment: { userId } }, orderBy: { id: 'desc' },
      include: { appointment: { select: { id: true, appointmentDate: true, doctor: { select: { id: true, user: { select: { name: true } } } } } } },
    });
  }
}
