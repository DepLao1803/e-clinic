import { Module } from '@nestjs/common';
import { AdminSchedulesController, SchedulesController } from './schedules.controller';
import { SchedulesService } from './schedules.service';

@Module({ controllers: [SchedulesController, AdminSchedulesController], providers: [SchedulesService] })
export class SchedulesModule {}
