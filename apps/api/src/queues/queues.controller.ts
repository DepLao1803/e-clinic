import { BadRequestException, Body, Controller, Get, HttpCode, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthUser, CurrentUser } from '../common/decorators/current-user.decorator';
import { ResponseMessage } from '../common/decorators/response-message.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { NextPatientDto, QueuesService, UpdateQueueStatusDto } from './queues.service';

@ApiTags('queues') @ApiBearerAuth()
@Controller('queues')
export class QueuesController {
  constructor(private readonly s: QueuesService) {}

  /** ?doctor_id → that doctor's queue today; otherwise the logged-in patient's own tickets. */
  @Get()
  index(@CurrentUser() u: AuthUser, @Query('doctor_id') doctorId?: string) {
    if (doctorId) { this.s.assertDoctorScope(u, +doctorId); return this.s.doctorToday(+doctorId); }
    return this.s.myToday(u.id);
  }

  /** GET /queues/board/:doctorId — numbers only, no patient data. */
  @Get('board/:doctorId')
  board(@Param('doctorId', ParseIntPipe) doctorId: number) { return this.s.board(doctorId); }

  @Post('next') @HttpCode(200) @Roles('doctor', 'admin') @ResponseMessage('Gọi bệnh nhân tiếp theo thành công.')
  next(@CurrentUser() u: AuthUser, @Body() dto: NextPatientDto) {
    const doctorId = dto.doctor_id ?? u.doctorId;
    if (!doctorId) throw new BadRequestException('Thiếu doctor_id.');
    this.s.assertDoctorScope(u, doctorId);
    return this.s.callNext(doctorId);
  }

  @Patch(':id/status') @Roles('doctor', 'admin') @ResponseMessage('Cập nhật trạng thái hàng đợi thành công.')
  status(@Param('id', ParseIntPipe) id: number, @CurrentUser() u: AuthUser, @Body() dto: UpdateQueueStatusDto) {
    return this.s.changeStatus(id, dto.status, u);
  }
}
