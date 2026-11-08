import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { RolesService } from '../roles/roles.service';
import { userInclude, toUserResource } from './user.resource';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService, private readonly roles: RolesService) {}

  findWithRoles(id: number) {
    return this.prisma.user.findFirst({ where: { id, deletedAt: null }, include: userInclude });
  }

  async list(page = 1, perPage = 15) {
    const where = { deletedAt: null };
    const [total, rows] = await Promise.all([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where, include: userInclude, orderBy: { id: 'desc' }, skip: (page - 1) * perPage, take: perPage,
      }),
    ]);
    return {
      data: rows.map(toUserResource), current_page: page,
      last_page: Math.max(1, Math.ceil(total / perPage)), per_page: perPage, total,
    };
  }

  async show(id: number) {
    const u = await this.findWithRoles(id);
    if (!u) throw new NotFoundException('Tài khoản không tồn tại');
    return toUserResource(u);
  }

  async create(dto: CreateUserDto) {
    const user = await this.prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: { name: dto.name, email: dto.email ?? null, phone: dto.phone ?? null, avatarUrl: dto.avatar_url ?? null, password: await bcrypt.hash(dto.password, 10) },
      });
      const role = await this.roles.findOrCreateByName(dto.role, tx);
      await tx.roleUser.create({ data: { userId: created.id, roleId: role.id } });
      return created;
    });
    return toUserResource((await this.findWithRoles(user.id))!);
  }

  async update(id: number, dto: UpdateUserDto) {
    if (!(await this.findWithRoles(id))) throw new NotFoundException('Tài khoản không tồn tại');
    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id },
        data: {
          name: dto.name, email: dto.email, phone: dto.phone, avatarUrl: dto.avatar_url,
          ...(dto.password ? { password: await bcrypt.hash(dto.password, 10) } : {}),
        },
      });
      if (dto.role) {
        const role = await this.roles.findOrCreateByName(dto.role, tx);
        await tx.roleUser.deleteMany({ where: { userId: id } }); // syncRole
        await tx.roleUser.create({ data: { userId: id, roleId: role.id } });
      }
    });
    return toUserResource((await this.findWithRoles(id))!);
  }

  async assertNotAdmin(id: number) {
    const u = await this.findWithRoles(id);
    if (!u) throw new NotFoundException('Tài khoản không tồn tại');
    return u;
  }

  /** Laravel: admins (role id 1) can't be disabled or deleted. We check by role *name*, not magic id. */
  async toggleStatus(id: number) {
    const u = await this.assertNotAdmin(id);
    if (u.roles.some((r) => r.role.name === 'admin'))
      throw new BadRequestException('Không thể vô hiệu hóa tài khoản quản trị viên (Admin).');
    const next = u.status === 1 ? 0 : 1;
    await this.prisma.user.update({ where: { id }, data: { status: next } });
    return next === 1 ? 'Đã kích hoạt tài khoản thành công.' : 'Đã vô hiệu hóa tài khoản thành công.';
  }

  async softDelete(id: number) {
    const u = await this.assertNotAdmin(id);
    if (u.roles.some((r) => r.role.name === 'admin')) throw new BadRequestException('Không thể xóa tài khoản quản trị viên (Admin).');
    await this.prisma.user.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  async trash() {
    const rows = await this.prisma.user.findMany({ where: { deletedAt: { not: null } }, include: userInclude, orderBy: { deletedAt: 'desc' } });
    return rows.map(toUserResource);
  }

  async restore(id: number) {
    const r = await this.prisma.user.updateMany({ where: { id, deletedAt: { not: null } }, data: { deletedAt: null } });
    if (!r.count) throw new NotFoundException('Tài khoản không tồn tại');
  }

  async forceDelete(id: number) {
    const r = await this.prisma.user.deleteMany({ where: { id, deletedAt: { not: null } } });
    if (!r.count) throw new NotFoundException('Tài khoản không tồn tại hoặc chưa được xóa mềm');
  }
}
