import { Module } from '@nestjs/common';
import { AdminDoctorSchedulesController, DoctorSchedulesController } from './doctor-schedules.controller';
import { DoctorSchedulesService } from './doctor-schedules.service';

@Module({ controllers: [DoctorSchedulesController, AdminDoctorSchedulesController], providers: [DoctorSchedulesService], exports: [DoctorSchedulesService] })
export class DoctorSchedulesModule {}
