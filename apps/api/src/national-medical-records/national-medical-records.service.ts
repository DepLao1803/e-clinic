import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { fromDateOnly } from '../common/utils/date.util';

/** Replaces Laravel's NationalMedicalService (a PHP mock array) with the real national_medical_records table. */
@Injectable()
export class NationalMedicalRecordsService {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmployeeCode(employeeCode: string) {
    const r = await this.prisma.nationalMedicalRecord.findFirst({ where: { employeeCode, deletedAt: null } });
    if (!r) return null;
    return {
      id: r.id,
      name: r.fullName,
      gender: r.gender,
      title: r.title,
      employee_code: r.employeeCode,
      practitioner_number: r.practitionerNumber,
      identity_card: r.identityCard,
      status: r.status,
      specialties: [r.specialty],
      date_of_birth: fromDateOnly(r.dateOfBirth),
    };
  }
}
