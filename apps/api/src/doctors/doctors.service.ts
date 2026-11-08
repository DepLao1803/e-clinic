import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DoctorsService {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: number) { return this.prisma.doctor.findFirst({ where: { id, deletedAt: null } }); }

  findByEmployeeCode(employeeCode: string) {
    return this.prisma.doctor.findFirst({ where: { employeeCode, deletedAt: null }, include: { user: true } });
  }

  /** DoctorRepository::createWithSpecialties — specialties are matched by name from the national registry. */
  async createWithSpecialties(
    tx: Prisma.TransactionClient,
    data: Prisma.DoctorUncheckedCreateInput,
    specialtyNames: string[],
  ) {
    const doctor = await tx.doctor.create({ data });
    const specialties = await tx.specialty.findMany({ where: { name: { in: specialtyNames } }, select: { id: true } });
    if (specialties.length) {
      await tx.doctorSpecialty.createMany({ data: specialties.map((s) => ({ doctorId: doctor.id, specialtyId: s.id })) });
    }
    return doctor;
  }
}
