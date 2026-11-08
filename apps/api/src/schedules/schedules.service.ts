import { Injectable, NotFoundException } from '@nestjs/common';
import { IsOptional, IsString, Matches, MaxLength } from 'class-validator';
import { ValidationFailed } from '../common/filters/http-exception.filter';
import { toTime } from '../common/utils/date.util';
import { PrismaService } from '../prisma/prisma.service';

const TIME = /^\d{2}:\d{2}(:\d{2})?$/;
export class ScheduleDto {
  @Matches(TIME, { message: 'start_at phải có định dạng H:i:s.' }) start_at: string;
  @Matches(TIME, { message: 'end_at phải có định dạng H:i:s.' }) end_at: string;
  @IsOptional() @IsString() @MaxLength(50) label?: string;
}

@Injectable()
export class SchedulesService {
  constructor(private readonly prisma: PrismaService) {}

  /** Public/authenticated list: only slots that are switched on. */
  list() { return this.prisma.schedule.findMany({ where: { deletedAt: null, isActive: true }, orderBy: { startAt: 'asc' } }); }
  /** Admin list: every non-deleted slot, including switched-off ones. */
  adminList() { return this.prisma.schedule.findMany({ where: { deletedAt: null }, orderBy: { startAt: 'asc' } }); }
  trash() { return this.prisma.schedule.findMany({ where: { deletedAt: { not: null } }, orderBy: { startAt: 'asc' } }); }
  async toggle(id: number) {
    const s = await this.show(id);
    await this.prisma.schedule.update({ where: { id }, data: { isActive: !s.isActive } });
    return !s.isActive;
  }
  async forceDelete(id: number) {
    const r = await this.prisma.schedule.deleteMany({ where: { id, deletedAt: { not: null } } });
    if (!r.count) throw new NotFoundException('Khung giờ không tồn tại trong thùng rác.');
  }
  async show(id: number) {
    const s = await this.prisma.schedule.findFirst({ where: { id, deletedAt: null } });
    if (!s) throw new NotFoundException('Khung giờ không tồn tại.');
    return s;
  }
  private data(dto: ScheduleDto) {
    const [a, b] = [toTime(dto.start_at), toTime(dto.end_at)];
    if (b <= a) throw new ValidationFailed({ end_at: ['Giờ kết thúc phải sau giờ bắt đầu.'] });
    return { startAt: a, endAt: b, label: dto.label?.trim() || null };
  }
  create(dto: ScheduleDto) { return this.prisma.schedule.create({ data: this.data(dto) }); }
  async update(id: number, dto: ScheduleDto) { await this.show(id); return this.prisma.schedule.update({ where: { id }, data: this.data(dto) }); }
  async destroy(id: number) { await this.show(id); await this.prisma.schedule.update({ where: { id }, data: { deletedAt: new Date() } }); }
  async restore(id: number) {
    const r = await this.prisma.schedule.updateMany({ where: { id, deletedAt: { not: null } }, data: { deletedAt: null } });
    if (!r.count) throw new NotFoundException('Khung giờ không tồn tại trong thùng rác.');
  }
}
