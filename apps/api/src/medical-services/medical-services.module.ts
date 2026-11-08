import { Module } from '@nestjs/common';
import { AdminMedicalServicesController, PublicMedicalServicesController } from './medical-services.controller';
import { MedicalServicesService } from './medical-services.service';

@Module({ controllers: [PublicMedicalServicesController, AdminMedicalServicesController], providers: [MedicalServicesService] })
export class MedicalServicesModule {}
