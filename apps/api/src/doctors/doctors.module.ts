import { Module } from '@nestjs/common';
import { AdminDoctorsController, AdminDoctorsService } from './doctors.admin';
import { DoctorsService } from './doctors.service';

@Module({ controllers: [AdminDoctorsController], providers: [DoctorsService, AdminDoctorsService], exports: [DoctorsService] })
export class DoctorsModule {}
