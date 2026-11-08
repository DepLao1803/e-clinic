import { Injectable, NotFoundException } from '@nestjs/common';
import { ValidationFailed } from '../common/filters/http-exception.filter';
import { slugify } from '../common/utils/date.util';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSpecialtyDto, UpdateSpecialtyDto } from './dto/specialty.dto';

@Injectable()
export class SpecialtiesService {
  constructor(private readonly prisma: PrismaService) {}

  async publicList() {
    const rows = await this.prisma.specialty.findMany({
      where: { deletedAt: null, isActive: 1 }, include: { _count: { select: { doctors: true } } },
    });
    return rows.map(({ _count, ...s }) => ({ ...s, doctorsCount: _count.doctors }));
  }

  async publicShow(id: number) {
    const s = await this.prisma.specialty.findFirst({ where: { id, deletedAt: null, isActive: 1 } });
    if (!s) throw new NotFoundException('Chuyên khoa không tồn tại hoặc đã bị xóa.');
    return s;
  }

  async adminList(page = 1, perPage = 15) {
    const where = { deletedAt: null };
    const [total, data] = await Promise.all([
      this.prisma.specialty.count({ where }),
      this.prisma.specialty.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * perPage, take: perPage }),
    ]);
    return { data, current_page: page, last_page: Math.max(1, Math.ceil(total / perPage)), per_page: perPage, total };
  }

  async adminShow(id: number) {
    const s = await this.prisma.specialty.findFirst({ where: { id, deletedAt: null } });
    if (!s) throw new NotFoundException('Chuyên khoa không tồn tại hoặc đã bị xóa.');
    return s;
  }

  private async assertNameFree(name: string, exceptId?: number) {
    const dup = await this.prisma.specialty.findFirst({ where: { name, ...(exceptId ? { id: { not: exceptId } } : {}) } });
    if (dup) throw new ValidationFailed({ name: ['Tên chuyên khoa đã tồn tại.'] });
  }

  async create(dto: CreateSpecialtyDto) {
    await this.assertNameFree(dto.name);
    return this.prisma.specialty.create({
      data: { name: dto.name, slug: slugify(dto.name), description: dto.description, iconUrl: dto.icon_url },
    });
  }

  async update(id: number, dto: UpdateSpecialtyDto) {
    await this.adminShow(id);
    if (dto.name) await this.assertNameFree(dto.name, id);
    return this.prisma.specialty.update({
      where: { id },
      data: { name: dto.name, slug: dto.name ? slugify(dto.name) : undefined, description: dto.description, iconUrl: dto.icon_url },
    });
  }

  async toggleStatus(id: number) {
    const s = await this.adminShow(id);
    const next = s.isActive === 1 ? 0 : 1;
    await this.prisma.specialty.update({ where: { id }, data: { isActive: next } });
    return next;
  }

  async destroy(id: number) { await this.adminShow(id); await this.prisma.specialty.update({ where: { id }, data: { deletedAt: new Date() } }); }
  trash() { return this.prisma.specialty.findMany({ where: { deletedAt: { not: null } } }); }

  async restore(id: number) {
    const r = await this.prisma.specialty.updateMany({ where: { id, deletedAt: { not: null } }, data: { deletedAt: null } });
    if (!r.count) throw new NotFoundException('Chuyên khoa không tồn tại trong thùng rác.');
  }
  async forceDelete(id: number) {
    const r = await this.prisma.specialty.deleteMany({ where: { id, deletedAt: { not: null } } });
    if (!r.count) throw new NotFoundException('Chuyên khoa không tồn tại trong thùng rác.');
  }

  /** GET /auth/specialties/:id/doctors — DoctorResource collection */
  async doctorsBySpecialty(id: number) {
    const s = await this.prisma.specialty.findFirst({ where: { id, deletedAt: null } });
    if (!s) throw new NotFoundException('Chuyên khoa không tồn tại.');
    const links = await this.prisma.doctorSpecialty.findMany({
      where: { specialtyId: id, doctor: { deletedAt: null, isActive: true } },
      include: { doctor: { include: { user: { select: { id: true, name: true, avatarUrl: true, status: true } } } } },
    });
    const live = links.filter((l) => l.doctor.user?.status === 1); // ẩn bác sĩ có tài khoản bị khoá
    const stats = await this.prisma.review.groupBy({
      by: ['doctorId'], where: { doctorId: { in: live.map((l) => l.doctorId) } }, _avg: { rating: true }, _count: { _all: true },
    });
    const byDoctor = new Map(stats.map((r) => [r.doctorId, r]));
    return live.map(({ doctor: d }) => ({
      id: d.id, price: d.price, description: d.biography, title: d.title, clinicRoom: d.clinicRoom,
      user: d.user && { id: d.user.id, name: d.user.name, avatarUrl: d.user.avatarUrl },
      ratingAvg: Math.round((byDoctor.get(d.id)?._avg.rating ?? 0) * 10) / 10, ratingCount: byDoctor.get(d.id)?._count._all ?? 0,
    }));
  }
}
