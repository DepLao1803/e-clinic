import { Body, Controller, Get, HttpCode, Injectable, NotFoundException, Param, ParseIntPipe, Post, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import * as bcrypt from 'bcryptjs';
import { ArrayMinSize, IsArray, IsEmail, IsInt, IsOptional, IsString, Length, Max, MaxLength, Min, MinLength } from 'class-validator';
import { ResponseMessage } from '../common/decorators/response-message.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { ValidationFailed } from '../common/filters/http-exception.filter';
import { PrismaService } from '../prisma/prisma.service';

export class CreateDoctorDto {
  @IsString() @MaxLength(255) name: string;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsString() @Length(10, 10, { message: 'Số điện thoại gồm 10 chữ số.' }) phone?: string;
  @IsString() @MinLength(8, { message: 'Mật khẩu phải có ít nhất 8 ký tự.' }) password: string;
  @IsString() @MaxLength(50) employee_code: string;
  @IsOptional() @IsString() @MaxLength(50) practitioner_number?: string;
  @IsString() @MaxLength(100) title: string;
  @IsInt() @Min(0) @Max(1_000_000_000) price: number;
  @IsString() @MaxLength(50) clinic_room: string;
  @IsOptional() @IsString() biography?: string;
  @IsOptional() @IsString() @MaxLength(255) avatar_url?: string;
  @IsArray({ message: 'Vui lòng chọn ít nhất một chuyên khoa.' }) @ArrayMinSize(1, { message: 'Vui lòng chọn ít nhất một chuyên khoa.' }) @IsInt({ each: true }) specialty_ids: number[];
}

export class UpdateDoctorDto {
  @IsOptional() @IsString() @MaxLength(255) name?: string;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsString() @Length(10, 10, { message: 'Số điện thoại gồm 10 chữ số.' }) phone?: string;
  @IsOptional() @IsString() @MaxLength(100) title?: string;
  @IsOptional() @IsInt() @Min(0) @Max(1_000_000_000) price?: number;
  @IsOptional() @IsString() @MaxLength(50) clinic_room?: string;
  @IsOptional() @IsString() biography?: string;
  @IsOptional() @IsString() @MaxLength(255) avatar_url?: string;
  @IsOptional() @IsArray() @ArrayMinSize(1) @IsInt({ each: true }) specialty_ids?: number[];
}

const include = {
  user: { select: { id: true, name: true, email: true, phone: true, avatarUrl: true, status: true } },
  specialties: { include: { specialty: { select: { id: true, name: true } } } },
};

/** Flatten join rows and expose the account status as `is_active`. */
function shape(d: any) {
  const { specialties, user, ...rest } = d;
  return {
    ...rest,
    is_active: user ? user.status === 1 && d.isActive : d.isActive,
    user: user && { id: user.id, name: user.name, email: user.email, phone: user.phone, avatarUrl: user.avatarUrl },
    specialties: specialties.map((s: any) => s.specialty),
  };
}

@Injectable()
export class AdminDoctorsService {
  constructor(private readonly prisma: PrismaService) {}

  async list() {
    return (await this.prisma.doctor.findMany({ where: { deletedAt: null }, include, orderBy: { id: 'asc' } })).map(shape);
  }

  private async one(id: number) {
    const d = await this.prisma.doctor.findFirst({ where: { id, deletedAt: null }, include });
    if (!d) throw new NotFoundException('Bác sĩ không tồn tại.');
    return d;
  }

  private async assertSpecialties(ids: number[]) {
    const n = await this.prisma.specialty.count({ where: { id: { in: ids }, deletedAt: null } });
    if (n !== new Set(ids).size) throw new ValidationFailed({ specialty_ids: ['Có chuyên khoa không tồn tại.'] });
  }

  async create(dto: CreateDoctorDto) {
    if (!dto.email && !dto.phone) throw new ValidationFailed({ email: ['Cần nhập email hoặc số điện thoại để đăng nhập.'] });
    const dup = async (where: object, field: string, msg: string) => {
      if (await this.prisma.user.findFirst({ where })) throw new ValidationFailed({ [field]: [msg] });
    };
    if (dto.email) await dup({ email: dto.email }, 'email', 'Email này đã được đăng ký tài khoản.');
    if (dto.phone) await dup({ phone: dto.phone }, 'phone', 'Số điện thoại này đã được đăng ký tài khoản.');
    if (await this.prisma.doctor.findFirst({ where: { employeeCode: dto.employee_code } }))
      throw new ValidationFailed({ employee_code: ['Mã nhân viên đã tồn tại.'] });
    if (dto.practitioner_number && (await this.prisma.doctor.findFirst({ where: { practitionerNumber: dto.practitioner_number } })))
      throw new ValidationFailed({ practitioner_number: ['Số chứng chỉ hành nghề đã tồn tại.'] });
    const specialtyIds = [...new Set(dto.specialty_ids)];
    await this.assertSpecialties(specialtyIds);

    const id = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: dto.name, email: dto.email ?? null, phone: dto.phone ?? null, avatarUrl: dto.avatar_url ?? null,
          password: await bcrypt.hash(dto.password, 10),
        },
      });
      const role = await tx.role.upsert({ where: { name: 'doctor' }, update: {}, create: { name: 'doctor' } });
      await tx.roleUser.create({ data: { userId: user.id, roleId: role.id } });
      const doctor = await tx.doctor.create({
        data: {
          userId: user.id, employeeCode: dto.employee_code, practitionerNumber: dto.practitioner_number ?? null, title: dto.title,
          biography: dto.biography ?? null, price: dto.price, clinicRoom: dto.clinic_room, isActive: true, isVerified: true,
          specialties: { create: specialtyIds.map((specialtyId) => ({ specialtyId })) },
        },
      });
      return doctor.id;
    });
    return shape(await this.one(id));
  }

  async update(id: number, dto: UpdateDoctorDto) {
    const cur = await this.one(id);
    if (dto.specialty_ids) await this.assertSpecialties([...new Set(dto.specialty_ids)]);
    if (cur.userId && dto.email && (await this.prisma.user.findFirst({ where: { email: dto.email, id: { not: cur.userId } } })))
      throw new ValidationFailed({ email: ['Email này đã được đăng ký tài khoản.'] });
    if (cur.userId && dto.phone && (await this.prisma.user.findFirst({ where: { phone: dto.phone, id: { not: cur.userId } } })))
      throw new ValidationFailed({ phone: ['Số điện thoại này đã được đăng ký tài khoản.'] });

    await this.prisma.$transaction(async (tx) => {
      if (cur.userId) {
        await tx.user.update({ where: { id: cur.userId }, data: { name: dto.name, email: dto.email, phone: dto.phone, avatarUrl: dto.avatar_url } });
      }
      await tx.doctor.update({
        where: { id },
        data: { title: dto.title, price: dto.price, clinicRoom: dto.clinic_room, biography: dto.biography },
      });
      if (dto.specialty_ids) {
        await tx.doctorSpecialty.deleteMany({ where: { doctorId: id } });
        await tx.doctorSpecialty.createMany({ data: [...new Set(dto.specialty_ids)].map((specialtyId) => ({ doctorId: id, specialtyId })) });
      }
    });
    return shape(await this.one(id));
  }
}

@ApiTags('admin/doctors') @ApiBearerAuth() @Roles('admin')
@Controller('admin/doctors')
export class AdminDoctorsController {
  constructor(private readonly s: AdminDoctorsService) {}
  @Get() list() { return this.s.list(); }
  @Post() @ResponseMessage('Thêm bác sĩ thành công.') create(@Body() dto: CreateDoctorDto) { return this.s.create(dto); }
  @Put(':id') @HttpCode(200) @ResponseMessage('Cập nhật bác sĩ thành công.')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateDoctorDto) { return this.s.update(id, dto); }
}
