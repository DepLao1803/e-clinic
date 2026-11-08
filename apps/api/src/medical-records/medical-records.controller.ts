import { Body, Controller, Get, Param, ParseIntPipe, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthUser, CurrentUser } from '../common/decorators/current-user.decorator';
import { ResponseMessage } from '../common/decorators/response-message.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { CreateMedicalRecordDto, MedicalRecordsService } from './medical-records.service';

@ApiTags('medical-records') @ApiBearerAuth()
@Controller('medical-records')
export class MedicalRecordsController {
  constructor(private readonly s: MedicalRecordsService) {}
  @Post() @Roles('doctor', 'admin') @ResponseMessage('Lưu hồ sơ bệnh án thành công.')
  create(@CurrentUser() u: AuthUser, @Body() dto: CreateMedicalRecordDto) { return this.s.create(u, dto); }
  @Get('my') my(@CurrentUser('id') id: number) { return this.s.mine(id); }
  @Get('appointment/:id') byAppointment(@Param('id', ParseIntPipe) id: number, @CurrentUser() u: AuthUser) { return this.s.byAppointment(id, u); }
}
