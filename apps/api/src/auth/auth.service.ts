import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { randomBytes } from 'crypto';
import * as bcrypt from 'bcryptjs';
import { ValidationFailed } from '../common/filters/http-exception.filter';
import { toDateOnly } from '../common/utils/date.util';
import { DoctorsService } from '../doctors/doctors.service';
import { NationalMedicalRecordsService } from '../national-medical-records/national-medical-records.service';
import { PrismaService } from '../prisma/prisma.service';
import { RolesService } from '../roles/roles.service';
import { UsersService } from '../users/users.service';
import { toUserResource, userInclude } from '../users/user.resource';
import { RegisterDto, ResetPasswordDto, UpdateProfileDto } from './dto/auth.dto';
import { MailService } from './mail.service';
import { sha256 } from './crypto.util';
import { TwoFactorService } from './two-factor.service';

const BAD_LOGIN = 'Thông tin đăng nhập không chính xác hoặc tài khoản đã bị khóa.';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService, private readonly jwt: JwtService, private readonly config: ConfigService,
    private readonly users: UsersService, private readonly roles: RolesService, private readonly doctors: DoctorsService,
    private readonly national: NationalMedicalRecordsService, private readonly twoFactor: TwoFactorService,
    private readonly mail: MailService,
  ) {}

  private signAccess(userId: number) { return this.jwt.signAsync({ sub: userId, type: 'access' }); }

  // ---------------- login ----------------
  private loginField(v: string): 'email' | 'phone' | 'employee_code' {
    if (v.includes('@')) return 'email';
    if (/^[0-9]{10,11}$/.test(v)) return 'phone';
    return 'employee_code';
  }

  async login(login: string, password: string) {
    const field = this.loginField(login);
    let user;
    if (field === 'employee_code') {
      const doc = await this.doctors.findByEmployeeCode(login);
      user = doc?.user && !doc.user.deletedAt ? doc.user : null;
    } else {
      user = await this.prisma.user.findFirst({ where: { [field]: login, deletedAt: null } });
    }
    if (!user) throw new ValidationFailed({ login: [BAD_LOGIN] });
    if (user.status !== 1) throw new ValidationFailed({ login: ['Tài khoản đã bị khóa hoặc vô hiệu hóa. Vui lòng liên hệ Admin.'] });
    // bcryptjs verifies Laravel's $2y$ hashes, so existing passwords keep working after the data migration.
    if (!(await bcrypt.compare(password, user.password))) throw new ValidationFailed({ login: ['Thông tin đăng nhập không chính xác.'] });

    if (this.twoFactor.isEnabled(user)) {
      const challenge = await this.jwt.signAsync({ sub: user.id, type: '2fa' }, { expiresIn: '5m' });
      return { two_factor: true, challenge_token: challenge };
    }
    return this.issueSession(user.id);
  }

  async completeTwoFactor(challengeToken: string, code?: string, recovery?: string) {
    let payload: { sub: number; type: string };
    try { payload = await this.jwt.verifyAsync(challengeToken); } catch { throw new UnauthorizedException('Phiên xác thực đã hết hạn.'); }
    if (payload.type !== '2fa') throw new UnauthorizedException();
    if (!(await this.twoFactor.verify(payload.sub, code, recovery))) throw new ValidationFailed({ code: ['Mã xác thực không đúng.'] });
    return this.issueSession(payload.sub);
  }

  private async issueSession(userId: number) {
    const user = (await this.users.findWithRoles(userId))!;
    return { token: await this.signAccess(userId), user: toUserResource(user) };
  }

  // ---------------- doctor pre-check (RegistrationService::validateNationalDoctor) ----------------
  async preCheckDoctor(employeeCode: string, cchn?: string) {
    const nd = await this.national.findByEmployeeCode(employeeCode);
    if (!nd) throw new ValidationFailed({ employee_code: ['Mã nhân viên không tồn tại trên hệ thống Y tế Quốc gia.'] });
    if (nd.status !== 'active') throw new ValidationFailed({ employee_code: ['Tài khoản chuyên môn này hiện đang bị khóa hoặc không khả dụng.'] });
    if (!cchn) return { status: 'require_cchn', message: 'Vui lòng nhập số Chứng chỉ hành nghề (CCHN) để xác thực.' };
    if (nd.practitioner_number !== cchn) throw new ValidationFailed({ practitioner_number: ['Số chứng chỉ hành nghề không khớp với mã nhân viên này.'] });
    const { name, specialties, gender, date_of_birth, identity_card, title } = nd;
    return { name, specialties, gender, date_of_birth, identity_card, title };
  }

  // ---------------- register (patient | doctor, auto-routed) ----------------
  async register(dto: RegisterDto) {
    // Duplicate checks BEFORE the transaction (same intent as Laravel: don't burn auto-increment IDs).
    const dup = async (where: object, field: string, msg: string) => {
      if (await this.prisma.user.findFirst({ where })) throw new ValidationFailed({ [field]: [msg] });
    };
    if (dto.email) await dup({ email: dto.email }, 'email', 'Email này đã được đăng ký tài khoản.');
    if (dto.phone) await dup({ phone: dto.phone }, 'phone', 'Số điện thoại này đã được đăng ký tài khoản.');
    if (dto.employee_code && (await this.doctors.findByEmployeeCode(dto.employee_code)))
      throw new ValidationFailed({ employee_code: ['Mã định danh chuyên môn này đã được đăng ký tài khoản trước đó.'] });

    const nd = dto.employee_code ? await this.national.findByEmployeeCode(dto.employee_code) : null;
    if (dto.employee_code) {
      if (!nd) throw new ValidationFailed({ employee_code: ['Không thể xác thực mã định danh chuyên môn.'] });
      if (nd.practitioner_number !== dto.practitioner_number)
        throw new ValidationFailed({ practitioner_number: ['Xác thực chứng chỉ hành nghề thất bại.'] });
    }

    const userId = await this.prisma.$transaction(async (tx) => {
      const dob = nd ? nd.date_of_birth : dto.date_of_birth;
      const user = await tx.user.create({
        data: {
          email: dto.email ?? null, phone: dto.phone ?? null,
          password: await bcrypt.hash(dto.password, 10),
          name: nd ? nd.name : dto.name!,
          gender: nd ? nd.gender : dto.gender ?? null,
          dateOfBirth: dob ? toDateOnly(dob.slice(0, 10)) : null,
          identityCard: nd ? nd.identity_card : dto.identity_card ?? null,
          address: dto.address ?? null,
          insuranceCode: dto.insurance_code ?? null,
        },
      });
      const role = await this.roles.findOrCreateByName(nd ? 'doctor' : 'patient', tx);
      await tx.roleUser.create({ data: { userId: user.id, roleId: role.id } });
      if (nd) {
        await this.doctors.createWithSpecialties(tx, {
          userId: user.id, nationalId: String(nd.id), employeeCode: nd.employee_code, practitionerNumber: nd.practitioner_number,
          title: nd.title, biography: dto.biography ?? null, price: dto.price ?? 0, clinicRoom: dto.clinic_room ?? '',
          isActive: true, isVerified: true,
        }, nd.specialties);
      }
      return user.id;
    });
    return this.issueSession(userId);
  }

  // ---------------- profile ----------------
  async profile(userId: number) { return toUserResource((await this.users.findWithRoles(userId))!); }

  async updateProfile(userId: number, dto: UpdateProfileDto) {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        name: dto.name, phone: dto.phone, gender: dto.gender, address: dto.address, insuranceCode: dto.insurance_code, avatarUrl: dto.avatar_url,
        dateOfBirth: dto.date_of_birth ? toDateOnly(dto.date_of_birth.slice(0, 10)) : undefined,
      },
    });
    return this.profile(userId);
  }

  // ---------------- password reset (replaces Fortify's flow; uses the existing password_reset_tokens table) ----------------
  async forgotPassword(email: string) {
    const user = await this.prisma.user.findFirst({ where: { email, deletedAt: null } });
    if (user) {
      const token = randomBytes(32).toString('hex');
      await this.prisma.passwordResetToken.upsert({
        where: { email }, update: { token: sha256(token), createdAt: new Date() }, create: { email, token: sha256(token), createdAt: new Date() },
      });
      const link = `${this.config.get('FRONTEND_URL', 'http://localhost:3000')}/auth/reset-password?token=${token}&email=${encodeURIComponent(email)}`;
      await this.mail.send(email, 'Đặt lại mật khẩu e-Clinic', `<p>Nhấn vào liên kết để đặt lại mật khẩu (hết hạn sau 60 phút):</p><p><a href="${link}">${link}</a></p>`);
    }
    // Same response whether or not the email exists → no account enumeration.
  }

  async resetPassword(dto: ResetPasswordDto) {
    const rec = await this.prisma.passwordResetToken.findUnique({ where: { email: dto.email } });
    const fresh = rec?.createdAt && Date.now() - rec.createdAt.getTime() < 60 * 60 * 1000;
    if (!rec || !fresh || rec.token !== sha256(dto.token)) throw new ValidationFailed({ token: ['Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.'] });
    await this.prisma.$transaction([
      this.prisma.user.updateMany({ where: { email: dto.email }, data: { password: await bcrypt.hash(dto.password, 10) } }),
      this.prisma.passwordResetToken.delete({ where: { email: dto.email } }),
    ]);
  }
}
