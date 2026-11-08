import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ArrayMinSize, IsArray, IsInt, IsOptional, IsString, Matches, MaxLength } from 'class-validator';
import { AuthUser } from '../common/decorators/current-user.decorator';
import { fromDateOnly, todayStr, toDateOnly } from '../common/utils/date.util';
import { PrismaService } from '../prisma/prisma.service';

const YMD = /^\d{4}-\d{2}-\d{2}$/;
export class CreateDoctorScheduleDto {
  @Matches(YMD, { message: 'working_date phải có định dạng YYYY-MM-DD.' }) working_date: string;
  @IsArray() @ArrayMinSize(1) @IsInt({ each: true }) schedule_ids: number[];
  @IsOptional() @IsString() @MaxLength(50) room_no?: string;
}
export class UpdateDoctorScheduleDto {
  @IsOptional() @IsInt() doctor_id?: number;
  @IsOptional() @IsInt() schedule_id?: number;
  @IsOptional() @Matches(YMD) working_date?: string;
  @IsOptional() @IsString() @MaxLength(50) room_no?: string;
}

/** Doctors may register shifts only on these ISO weekdays (6 = Sat, 7 = Sun) — same rule as Laravel. */
const ALLOWED_REGISTRATION_DAYS = [6, 7];
const isoDow = () => { const d = new Date(`${todayStr()}T00:00:00Z`).getUTCDay(); return d === 0 ? 7 : d; };

@Injectable()
export class DoctorSchedulesService {
  constructor(private readonly prisma: PrismaService) {}
  private readonly inc = { schedule: true, doctor: { include: { user: { select: { id: true, name: true } } } } };

  private assertNotPast(date: string, msg: string) { if (date < todayStr()) throw new BadRequestException(msg); }

  async mine(doctorId?: number, status?: string) {
    return this.prisma.doctorSchedule.findMany({
      where: { deletedAt: null, ...(doctorId ? { doctorId } : {}), ...(status ? { status } : {}), workingDate: { gte: toDateOnly(todayStr()) } },
      include: { schedule: true }, orderBy: [{ workingDate: 'asc' }, { scheduleId: 'asc' }],
    });
  }

  async createBulk(user: AuthUser, dto: CreateDoctorScheduleDto) {
    if (!user.doctorId) throw new ForbiddenException('Chỉ bác sĩ mới có thể đăng ký lịch trực.');
    if (!ALLOWED_REGISTRATION_DAYS.includes(isoDow())) throw new BadRequestException('Hệ thống hiện đang đóng cổng đăng ký lịch trực.');
    this.assertNotPast(dto.working_date, 'Không thể đăng ký lịch trực cho ngày trong quá khứ.');
    const doctorId = user.doctorId;
    const date = toDateOnly(dto.working_date);

    const slots = await this.prisma.schedule.count({ where: { id: { in: dto.schedule_ids }, deletedAt: null, isActive: true } });
    if (slots !== new Set(dto.schedule_ids).size) throw new BadRequestException('Có khung giờ không tồn tại.');

    return this.prisma.$transaction(async (tx) => {
      const created = [];
      for (const scheduleId of dto.schedule_ids) {
        const dup = await tx.doctorSchedule.findFirst({ where: { doctorId, scheduleId, workingDate: date } });
        const roomNo = dto.room_no?.trim() || null;
        if (dup && dup.status === 'rejected' && !dup.deletedAt) { // đăng ký lại ca đã bị từ chối
          created.push(await tx.doctorSchedule.update({ where: { id: dup.id }, data: { status: 'pending', roomNo } }));
          continue;
        }
        if (dup) throw new BadRequestException(`Bác sĩ đã có lịch trực trong khung giờ ID ${scheduleId} vào ngày ${dto.working_date}.`);
        created.push(await tx.doctorSchedule.create({ data: { doctorId, scheduleId, workingDate: date, status: 'pending', roomNo } }));
      }
      return created;
    });
  }

  async findOne(id: number) {
    const s = await this.prisma.doctorSchedule.findFirst({ where: { id, deletedAt: null }, include: this.inc });
    if (!s) throw new NotFoundException('Lịch trực không tồn tại.');
    return s;
  }

  async adminList(page = 1, perPage = 15, doctorId?: number, status?: string) {
    const where = { deletedAt: null, ...(doctorId ? { doctorId } : {}), ...(status ? { status } : {}) };
    const [total, data] = await Promise.all([
      this.prisma.doctorSchedule.count({ where }),
      this.prisma.doctorSchedule.findMany({ where, include: this.inc, orderBy: { workingDate: 'desc' }, skip: (page - 1) * perPage, take: perPage }),
    ]);
    return { data, current_page: page, last_page: Math.max(1, Math.ceil(total / perPage)), per_page: perPage, total };
  }

  adminDoctors() {
    return this.prisma.doctor.findMany({ where: { deletedAt: null }, include: { user: { select: { id: true, name: true } } } });
  }

  async update(id: number, dto: UpdateDoctorScheduleDto) {
    const cur = await this.findOne(id);
    if (dto.working_date) this.assertNotPast(dto.working_date, 'Không thể cập nhật lịch trực sang một ngày trong quá khứ.');
    const room = dto.room_no !== undefined ? { roomNo: dto.room_no.trim() || null } : {};
    const next = {
      doctorId: dto.doctor_id ?? cur.doctorId,
      scheduleId: dto.schedule_id ?? cur.scheduleId,
      workingDate: dto.working_date ? toDateOnly(dto.working_date) : cur.workingDate,
    };
    const changed = next.doctorId !== cur.doctorId || next.scheduleId !== cur.scheduleId || +next.workingDate !== +cur.workingDate;
    if (changed && (await this.prisma.doctorSchedule.findFirst({ where: { ...next, id: { not: id } } })))
      throw new BadRequestException('Lịch trực sau khi sửa đổi bị trùng lặp với lịch có sẵn.');
    return this.prisma.doctorSchedule.update({ where: { id }, data: { ...next, ...room } });
  }

  /** Admin approves / rejects a doctor's shift registration. */
  async review(id: number, status: 'approved' | 'rejected') {
    await this.findOne(id);
    return this.prisma.doctorSchedule.update({ where: { id }, data: { status }, include: this.inc });
  }

  /** Doctor can delete own shift; admin any. */
  async destroy(id: number, user: AuthUser) {
    const s = await this.findOne(id);
    if (!user.roles.includes('admin') && s.doctorId !== user.doctorId) throw new ForbiddenException('Bạn không có quyền xóa lịch trực này.');
    await this.prisma.doctorSchedule.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  trash() { return this.prisma.doctorSchedule.findMany({ where: { deletedAt: { not: null } }, include: this.inc }); }
  async restore(id: number) {
    const r = await this.prisma.doctorSchedule.updateMany({ where: { id, deletedAt: { not: null } }, data: { deletedAt: null } });
    if (!r.count) throw new NotFoundException('Lịch trực không tồn tại trong thùng rác.');
  }
  async forceDelete(id: number) {
    const r = await this.prisma.doctorSchedule.deleteMany({ where: { id, deletedAt: { not: null } } });
    if (!r.count) throw new NotFoundException('Lịch trực không tồn tại trong thùng rác.');
  }
}
