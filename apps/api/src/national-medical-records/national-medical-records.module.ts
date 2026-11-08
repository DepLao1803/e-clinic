import { Module } from '@nestjs/common';
import { NationalMedicalRecordsService } from './national-medical-records.service';

@Module({ providers: [NationalMedicalRecordsService], exports: [NationalMedicalRecordsService] })
export class NationalMedicalRecordsModule {}
