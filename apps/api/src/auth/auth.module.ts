import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { DoctorsModule } from '../doctors/doctors.module';
import { NationalMedicalRecordsModule } from '../national-medical-records/national-medical-records.module';
import { RolesModule } from '../roles/roles.module';
import { UsersModule } from '../users/users.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';
import { MailService } from './mail.service';
import { TwoFactorService } from './two-factor.service';

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule], inject: [ConfigService],
      useFactory: (c: ConfigService) => ({
        secret: c.getOrThrow<string>('JWT_SECRET'),
        signOptions: { expiresIn: c.get('JWT_EXPIRES_IN', '7d') as any },
      }),
    }),
    UsersModule, RolesModule, DoctorsModule, NationalMedicalRecordsModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, TwoFactorService, MailService],
  exports: [AuthService],
})
export class AuthModule {}
