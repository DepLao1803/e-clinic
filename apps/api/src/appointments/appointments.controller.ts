import { Body, Controller, Delete, Get, HttpCode, Param, ParseIntPipe, Patch, Post, Put, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthUser, CurrentUser } from '../common/decorators/current-user.decorator';
import { ResponseMessage } from '../common/decorators/response-message.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { AppointmentsService } from './appointments.service';
import { StoreAppointmentDto, UpdateAppointmentDto } from './dto/appointment.dto';

@ApiTags('appointments') @ApiBearerAuth()
@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly s: AppointmentsService) {}

  @Post() @ResponseMessage('Đặt lịch hẹn thành công.')
  store(@CurrentUser('id') uid: number, @Body() dto: StoreAppointmentDto) { return this.s.create(uid, dto); }

  @Get() index(@CurrentUser('id') uid: number) { return this.s.listMine(uid); }

  @Get('my-trash') @ResponseMessage('Lấy danh sách lịch hẹn đã hủy thành công.')
  myTrash(@CurrentUser('id') uid: number) { return this.s.myTrash(uid); }

  /** Doctor's own appointments (any date) — admins can pass ?doctor_id. Declared before ':id'. */
  @Get('doctor') @Roles('doctor', 'admin')
  forDoctor(@CurrentUser() u: AuthUser, @Query('doctor_id') doctorId?: string) { return this.s.listForDoctor(u, doctorId ? +doctorId : undefined); }

  @Get(':id') show(@Param('id', ParseIntPipe) id: number, @CurrentUser() u: AuthUser) { return this.s.show(id, u); }

  @Put(':id/update') @ResponseMessage('Cập nhật lịch hẹn thành công.')
  update(@Param('id', ParseIntPipe) id: number, @CurrentUser() u: AuthUser, @Body() dto: UpdateAppointmentDto) { return this.s.update(id, u, dto); }

  @Patch(':id/confirm') @ResponseMessage('Xác nhận lịch hẹn thành công.')
  confirm(@Param('id', ParseIntPipe) id: number, @CurrentUser() u: AuthUser) { return this.s.confirm(id, u); }

  @Patch(':id/reject') @ResponseMessage('Đã từ chối lịch hẹn.')
  reject(@Param('id', ParseIntPipe) id: number, @CurrentUser() u: AuthUser) { return this.s.reject(id, u); }

  @Patch(':id/cancel') @ResponseMessage('Đã huỷ lịch hẹn.')
  cancel(@Param('id', ParseIntPipe) id: number, @CurrentUser() u: AuthUser) { return this.s.cancel(id, u); }

  @Delete(':id/destroy') @ResponseMessage('Xóa vào thùng rác thành công.')
  async destroy(@Param('id', ParseIntPipe) id: number, @CurrentUser() u: AuthUser) { await this.s.destroy(id, u); return null; }

  @Post(':id/restore') @HttpCode(200) @ResponseMessage('Khôi phục lịch hẹn thành công.')
  async restore(@Param('id', ParseIntPipe) id: number, @CurrentUser() u: AuthUser) { await this.s.restore(id, u); return null; }
}

@ApiTags('admin/appointments') @ApiBearerAuth() @Roles('admin')
@Controller('admin/appointments')
export class AdminAppointmentsController {
  constructor(private readonly s: AppointmentsService) {}
  @Get() index() { return this.s.listAll(); }
  @Post('trash') @HttpCode(200) trash() { return this.s.trash(); }
  @Post('forceDelete/:id') @HttpCode(200) @ResponseMessage('Xóa vĩnh viễn lịch hẹn thành công.')
  async force(@Param('id', ParseIntPipe) id: number) { await this.s.forceDelete(id); return null; }
}
