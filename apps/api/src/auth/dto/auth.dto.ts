import {
  IsEmail, IsEnum, IsInt, IsOptional, IsString, Matches, Max, MaxLength, Min, MinLength, ValidateIf,
} from 'class-validator';
import { Match } from '../../common/decorators/match.decorator';

export enum Gender { Male = 'Nam', Female = 'Nữ', Other = 'Khác' } // ← align with app/Enums/Gender.php

export class LoginDto {
  @IsString() login: string;     // email | 10-11 digit phone | employee_code
  @IsString() password: string;
}

/** Port of RegisterRequest. snake_case on the wire to stay compatible with the frontend. */
export class RegisterDto {
  // required_without_all:phone,employee_code
  @ValidateIf((o) => o.email !== undefined || (!o.phone && !o.employee_code))
  @IsEmail({}, { message: 'Email không hợp lệ.' }) @MaxLength(255)
  email?: string;

  @ValidateIf((o) => o.phone !== undefined || (!o.email && !o.employee_code))
  @IsString() @MaxLength(10)
  phone?: string;

  @IsString() @MinLength(8, { message: 'Mật khẩu phải có ít nhất 8 ký tự.' }) password: string;
  @IsString() @Match('password', { message: 'Mật khẩu xác nhận không khớp.' }) password_confirmation: string;

  @ValidateIf((o) => !o.employee_code || o.name !== undefined) @IsString() @MaxLength(255) name?: string;
  @IsOptional() @IsEnum(Gender) gender?: Gender;
  @IsOptional() @IsString() date_of_birth?: string;
  @IsOptional() @IsString() address?: string;
  @IsOptional() @IsString() @MaxLength(20) insurance_code?: string;
  @ValidateIf((o) => !o.employee_code || o.identity_card !== undefined) @IsString() @MaxLength(12) identity_card?: string;

  // doctor branch
  @ValidateIf((o) => o.employee_code !== undefined || (!o.email && !o.phone)) @IsString() employee_code?: string;
  @ValidateIf((o) => !!o.employee_code, { message: 'Vui lòng nhập số CCHN khi đăng ký bằng mã định danh chuyên môn.' })
  @IsString({ message: 'Vui lòng nhập số CCHN khi đăng ký bằng mã định danh chuyên môn.' }) practitioner_number?: string;
  @IsOptional() @IsString() biography?: string;
  @ValidateIf((o) => !!o.employee_code) @IsInt() @Min(0) @Max(1_000_000_000) price?: number;
  @ValidateIf((o) => !!o.employee_code) @IsString() @MaxLength(50) clinic_room?: string;
}

export class PreCheckDoctorDto {
  @IsString() employee_code: string;
  @IsOptional() @IsString() practitioner_number?: string;
}

export class UpdateProfileDto {
  @IsOptional() @IsString() @MaxLength(255) name?: string;
  @IsOptional() @IsString() @MaxLength(10) phone?: string;
  @IsOptional() @IsEnum(Gender) gender?: Gender;
  @IsOptional() @IsString() date_of_birth?: string;
  @IsOptional() @IsString() address?: string;
  @IsOptional() @IsString() @MaxLength(20) insurance_code?: string;
  @IsOptional() @IsString() @MaxLength(255) avatar_url?: string;
}

export class ForgotPasswordDto { @IsEmail() email: string; }

export class ResetPasswordDto {
  @IsEmail() email: string;
  @IsString() token: string;
  @IsString() @MinLength(8) password: string;
  @IsString() @Match('password', { message: 'Mật khẩu xác nhận không khớp.' }) password_confirmation: string;
}

export class TwoFactorCodeDto { @IsString() @Matches(/^\d{6}$/, { message: 'Mã gồm 6 chữ số.' }) code: string; }
export class TwoFactorChallengeDto {
  @IsString() challenge_token: string;
  @IsOptional() @Matches(/^\d{6}$/) code?: string;
  @IsOptional() @IsString() recovery_code?: string;
}
export class ConfirmPasswordDto { @IsString() password: string; }
