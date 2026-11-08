import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const t = (hhmm: string) => new Date(`1970-01-01T${hhmm}:00.000Z`);

async function main() {
  for (const name of ['admin', 'doctor', 'patient']) {
    await prisma.role.upsert({ where: { name }, update: {}, create: { name } });
  }

  // 8 one-hour slots (same as Laravel ScheduleSeeder)
  if ((await prisma.schedule.count()) === 0) {
    const slots = [['07:00','08:00'],['08:00','09:00'],['09:00','10:00'],['10:00','11:00'],
                   ['13:00','14:00'],['14:00','15:00'],['15:00','16:00'],['16:00','17:00']];
    await prisma.schedule.createMany({ data: slots.map(([s, e]) => ({ startAt: t(s), endAt: t(e) })) });
  }

  for (const [name, slug] of [['Nhi khoa', 'nhi-khoa'], ['Da liễu', 'da-lieu'], ['Thần kinh', 'than-kinh']]) {
    await prisma.specialty.upsert({ where: { slug }, update: {}, create: { name, slug } });
  }

  // National registry (replaces the PHP mock array in NationalMedicalService)
  const national = [
    { fullName: 'Nguyễn Thị A', gender: 'Nữ', title: 'Thạc sĩ, Bác sĩ', employeeCode: 'NV-1', practitionerNumber: 'CCHN-1', identityCard: '000000000001', specialty: 'Nhi khoa', dateOfBirth: new Date('1990-01-15') },
    { fullName: 'Nguyễn Văn B', gender: 'Nam', title: 'Thạc sĩ, Bác sĩ', employeeCode: 'NV-2', practitionerNumber: 'CCHN-2', identityCard: '000000000002', specialty: 'Da liễu', dateOfBirth: new Date('1999-02-14') },
    { fullName: 'Nhubebii', gender: 'Nữ', title: 'Giáo sư, Bác sĩ', employeeCode: 'NV-3', practitionerNumber: 'CCHN-3', identityCard: '000000000003', specialty: 'Thần kinh', dateOfBirth: new Date('1992-12-02') },
  ];
  for (const n of national) {
    await prisma.nationalMedicalRecord.upsert({
      where: { employeeCode: n.employeeCode },
      update: {},
      create: { ...n, issueDate: new Date('2020-01-01'), status: 'active' },
    });
  }

  const email = process.env.SEED_ADMIN_EMAIL ?? 'admin@eclinic.local';
  const password = await bcrypt.hash(process.env.SEED_ADMIN_PASSWORD ?? 'Admin@12345', 10);
  const adminRole = await prisma.role.findUniqueOrThrow({ where: { name: 'admin' } });
  const admin = await prisma.user.upsert({
    where: { email },
    update: {},
    create: { name: 'Quản trị viên', email, password, status: 1 },
  });
  await prisma.roleUser.upsert({
    where: { roleId_userId: { roleId: adminRole.id, userId: admin.id } },
    update: {},
    create: { roleId: adminRole.id, userId: admin.id },
  });
  console.log('Seed OK. Admin:', email);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
