import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { RolesModule } from './roles/roles.module';
import { SpecialtiesModule } from './specialties/specialties.module';
import { MedicalServicesModule } from './medical-services/medical-services.module';
import { DoctorsModule } from './doctors/doctors.module';
import { DoctorSchedulesModule } from './doctor-schedules/doctor-schedules.module';
import { SchedulesModule } from './schedules/schedules.module';
import { AppointmentsModule } from './appointments/appointments.module';
import { QueuesModule } from './queues/queues.module';
import { ReviewsModule } from './reviews/reviews.module';
import { MedicalRecordsModule } from './medical-records/medical-records.module';
import { UploadsModule } from './uploads/uploads.module';
import { NationalMedicalRecordsModule } from './national-medical-records/national-medical-records.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ['.env', '../../.env'] }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]),
    PrismaModule,
    AuthModule, UsersModule, RolesModule,
    SpecialtiesModule, MedicalServicesModule,
    DoctorsModule, DoctorSchedulesModule, SchedulesModule,
    AppointmentsModule, QueuesModule,
    ReviewsModule, MedicalRecordsModule, NationalMedicalRecordsModule, UploadsModule,
  ],
  providers: [
    // Order matters: authenticate -> authorise by role -> throttle
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_INTERCEPTOR, useClass: ResponseInterceptor },
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
  ],
})
export class AppModule {}
