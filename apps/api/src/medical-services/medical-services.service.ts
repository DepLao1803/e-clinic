import { Injectable, NotFoundException } from '@nestjs/common';
import { IsInt, IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { ValidationFailed } from '../common/filters/http-exception.filter';
import { slugify } from '../common/utils/date.util';
import { PrismaService } from '../prisma/prisma.service';

export class CreateMedicalServiceDto {
  @IsInt() specialty_id: number;
  @IsString() @MaxLength(255) name: string;
  @IsNumber() @Min(0) price: number;
  @IsOptional() @IsInt() @Min(1) duration_minutes?: number;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() @MaxLength(255) icon_url?: string;
}
export class UpdateMedicalServiceDto {
  @IsOptional() @IsInt() specialty_id?: number;
  @IsOptional() @IsString() @MaxLength(255) name?: string;
  @IsOptional() @IsNumber() @Min(0) price?: number;
  @IsOptional() @IsInt() @Min(1) duration_minutes?: number;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() @MaxLength(255) icon_url?: string;
}

@Injectable()
export class MedicalServicesService {
  constructor(private readonly prisma: PrismaService) {}
  private readonly inc = { specialty: { select: { id: true, name: true } } };

  publicList(specialtyId?: number) {
    return this.prisma.medicalService.findMany({
      where: { deletedAt: null, isActive: true, ...(specialtyId ? { specialtyId } : {}) }, include: this.inc,
    });
  }
  async publicShow(id: number) {
    const s = await this.prisma.medicalService.findFirst({ where: { id, deletedAt: null, isActive: true }, include: this.inc });
    if (!s) throw new NotFoundException('Dịch vụ không tồn tại.');
    return s;
  }
  async adminList(page = 1, perPage = 15) {
    const where = { deletedAt: null };
    const [total, data] = await Promise.all([
      this.prisma.medicalService.count({ where }),
      this.prisma.medicalService.findMany({ where, include: this.inc, orderBy: { createdAt: 'desc' }, skip: (page - 1) * perPage, take: perPage }),
    ]);
    return { data, current_page: page, last_page: Math.max(1, Math.ceil(total / perPage)), per_page: perPage, total };
  }
  async adminShow(id: number) {
    const s = await this.prisma.medicalService.findFirst({ where: { id, deletedAt: null }, include: this.inc });
    if (!s) throw new NotFoundException('Dịch vụ không tồn tại.');
    return s;
  }
  private async check(dto: { name?: string; specialty_id?: number }, exceptId?: number) {
    if (dto.name && (await this.prisma.medicalService.findFirst({ where: { name: dto.name, ...(exceptId ? { id: { not: exceptId } } : {}) } })))
      throw new ValidationFailed({ name: ['Tên dịch vụ đã tồn tại.'] });
    if (dto.specialty_id && !(await this.prisma.specialty.findFirst({ where: { id: dto.specialty_id, deletedAt: null } })))
      throw new ValidationFailed({ specialty_id: ['Chuyên khoa không tồn tại.'] });
  }
  async create(dto: CreateMedicalServiceDto) {
    await this.check(dto);
    return this.prisma.medicalService.create({
      data: { specialtyId: dto.specialty_id, name: dto.name, slug: slugify(dto.name), price: dto.price, description: dto.description, iconUrl: dto.icon_url, durationMinutes: dto.duration_minutes },
    });
  }
  async update(id: number, dto: UpdateMedicalServiceDto) {
    await this.adminShow(id); await this.check(dto, id);
    return this.prisma.medicalService.update({
      where: { id },
      data: { specialtyId: dto.specialty_id, name: dto.name, slug: dto.name ? slugify(dto.name) : undefined, price: dto.price, description: dto.description, iconUrl: dto.icon_url, durationMinutes: dto.duration_minutes },
    });
  }
  async toggleStatus(id: number) {
    const s = await this.adminShow(id);
    await this.prisma.medicalService.update({ where: { id }, data: { isActive: !s.isActive } });
    return !s.isActive;
  }
  async destroy(id: number) { await this.adminShow(id); await this.prisma.medicalService.update({ where: { id }, data: { deletedAt: new Date() } }); }
  trash() { return this.prisma.medicalService.findMany({ where: { deletedAt: { not: null } } }); }
  async restore(id: number) {
    const r = await this.prisma.medicalService.updateMany({ where: { id, deletedAt: { not: null } }, data: { deletedAt: null } });
    if (!r.count) throw new NotFoundException('Dịch vụ không tồn tại trong thùng rác.');
  }
  async forceDelete(id: number) {
    const r = await this.prisma.medicalService.deleteMany({ where: { id, deletedAt: { not: null } } });
    if (!r.count) throw new NotFoundException('Dịch vụ không tồn tại trong thùng rác.');
  }
}
