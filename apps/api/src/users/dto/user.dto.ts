import { PartialType } from '@nestjs/swagger';
import { IsEmail, IsIn, IsOptional, IsString, Length, MaxLength, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsString() @MaxLength(255) name: string;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsString() @Length(10, 10, { message: 'Số điện thoại gồm 10 chữ số.' }) phone?: string;
  @IsString() @MinLength(8, { message: 'Mật khẩu phải có ít nhất 8 ký tự.' }) password: string;
  @IsOptional() @IsString() @MaxLength(255) avatar_url?: string;
  @IsIn(['admin', 'doctor', 'patient']) role: 'admin' | 'doctor' | 'patient';
}
export class UpdateUserDto extends PartialType(CreateUserDto) {}
