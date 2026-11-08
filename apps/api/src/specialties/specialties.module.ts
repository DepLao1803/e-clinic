import { Module } from '@nestjs/common';
import { AdminSpecialtiesController, PublicSpecialtiesController } from './specialties.controller';
import { SpecialtiesService } from './specialties.service';

@Module({ controllers: [PublicSpecialtiesController, AdminSpecialtiesController], providers: [SpecialtiesService], exports: [SpecialtiesService] })
export class SpecialtiesModule {}
