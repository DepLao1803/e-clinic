import { Body, Controller, Get, HttpCode, Post, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthUser, CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { ResponseMessage } from '../common/decorators/response-message.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from './auth.service';
import {
  ForgotPasswordDto, LoginDto, PreCheckDoctorDto, RegisterDto, ResetPasswordDto,
  TwoFactorChallengeDto, TwoFactorCodeDto, UpdateProfileDto,
} from './dto/auth.dto';
import { TwoFactorService } from './two-factor.service';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService, private readonly twoFactor: TwoFactorService, private readonly prisma: PrismaService) {}

  @Public() @Throttle({ default: { limit: 10, ttl: 60_000 } }) @Post('login') @HttpCode(200) @ResponseMessage('Đăng nhập thành công')
  login(@Body() dto: LoginDto) { return this.auth.login(dto.login, dto.password); }

  @Public() @Post('2fa/challenge') @HttpCode(200)
  challenge(@Body() dto: TwoFactorChallengeDto) { return this.auth.completeTwoFactor(dto.challenge_token, dto.code, dto.recovery_code); }

  @Public() @Throttle({ default: { limit: 5, ttl: 60_000 } }) @Post('register') @ResponseMessage('Đăng ký thành công hệ thống e-Clinic')
  register(@Body() dto: RegisterDto) { return this.auth.register(dto); }

  @Public() @Post('pre-check-doctor') @HttpCode(200) @ResponseMessage('Xác thực thông tin bác sĩ thành công.')
  preCheck(@Body() dto: PreCheckDoctorDto) { return this.auth.preCheckDoctor(dto.employee_code, dto.practitioner_number); }

  @Public() @Throttle({ default: { limit: 5, ttl: 60_000 } }) @Post('forgot-password') @HttpCode(200)
  @ResponseMessage('Nếu email tồn tại, chúng tôi đã gửi hướng dẫn đặt lại mật khẩu.')
  async forgot(@Body() dto: ForgotPasswordDto) { await this.auth.forgotPassword(dto.email); return null; }

  @Public() @Post('reset-password') @HttpCode(200) @ResponseMessage('Đặt lại mật khẩu thành công.')
  async reset(@Body() dto: ResetPasswordDto) { await this.auth.resetPassword(dto); return null; }

  // ----- authenticated -----
  @ApiBearerAuth() @Get('profile')
  profile(@CurrentUser('id') id: number) { return this.auth.profile(id); }

  @ApiBearerAuth() @Put('profile') @ResponseMessage('Cập nhật hồ sơ thành công')
  updateProfile(@CurrentUser('id') id: number, @Body() dto: UpdateProfileDto) { return this.auth.updateProfile(id, dto); }

  /** JWT is stateless: the client discards the token. (Add a Redis denylist keyed by jti if you need server-side revocation.) */
  @ApiBearerAuth() @Post('logout') @HttpCode(200) @ResponseMessage('Đăng xuất thành công')
  logout() { return null; }

  @ApiBearerAuth() @Post('2fa/setup')
  async setup(@CurrentUser() u: AuthUser) {
    const row = await this.prisma.user.findUniqueOrThrow({ where: { id: u.id }, select: { email: true } });
    return this.twoFactor.setup(u.id, row.email);
  }
  @ApiBearerAuth() @Post('2fa/confirm') @HttpCode(200)
  confirm(@CurrentUser('id') id: number, @Body() dto: TwoFactorCodeDto) { return this.twoFactor.confirm(id, dto.code); }

  @ApiBearerAuth() @Post('2fa/disable') @HttpCode(200) @ResponseMessage('Đã tắt xác thực hai bước.')
  async disable(@CurrentUser('id') id: number) { await this.twoFactor.disable(id); return null; }
}
