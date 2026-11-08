import { Body, Controller, Delete, Get, HttpCode, Param, ParseIntPipe, Post, Put, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthUser, CurrentUser } from '../common/decorators/current-user.decorator';
import { ResponseMessage } from '../common/decorators/response-message.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { CreateDoctorScheduleDto, DoctorSchedulesService, UpdateDoctorScheduleDto } from './doctor-schedules.service';

@ApiTags('doctor-schedules') @ApiBearerAuth()
@Controller('doctor-schedules')
export class DoctorSchedulesController {
  constructor(private readonly s: DoctorSchedulesService) {}

  @Get() list(@Query('doctor_id') doctorId?: string, @Query('status') status?: string) { return this.s.mine(doctorId ? +doctorId : undefined, status); }

  @Post() @Roles('doctor') @ResponseMessage('Đăng ký lịch trực thành công.')
  store(@CurrentUser() u: AuthUser, @Body() dto: CreateDoctorScheduleDto) { return this.s.createBulk(u, dto); }

  @Delete(':id') @ResponseMessage('Xóa lịch trực thành công.')
  async destroy(@Param('id', ParseIntPipe) id: number, @CurrentUser() u: AuthUser) { await this.s.destroy(id, u); return null; }
}

@ApiTags('admin/doctor-schedules') @ApiBearerAuth() @Roles('admin')
@Controller('admin/doctor-schedules')
export class AdminDoctorSchedulesController {
  constructor(private readonly s: DoctorSchedulesService) {}
  @Get('doctors') doctors() { return this.s.adminDoctors(); }
  @Get() list(@Query('page') p = 1, @Query('per_page') pp = 15, @Query('doctor_id') d?: string, @Query('status') st?: string) { return this.s.adminList(+p, +pp, d ? +d : undefined, st); }
  @Post('trash') @HttpCode(200) trash() { return this.s.trash(); } // POST kept from Laravel
  @Get(':id') show(@Param('id', ParseIntPipe) id: number) { return this.s.findOne(id); }
  @Put(':id') @ResponseMessage('Cập nhật lịch trực thành công.')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateDoctorScheduleDto) { return this.s.update(id, dto); }
  @Post(':id/approve') @HttpCode(200) @ResponseMessage('Đã duyệt lịch trực.')
  approve(@Param('id', ParseIntPipe) id: number) { return this.s.review(id, 'approved'); }
  @Post(':id/reject') @HttpCode(200) @ResponseMessage('Đã từ chối lịch trực.')
  reject(@Param('id', ParseIntPipe) id: number) { return this.s.review(id, 'rejected'); }
  @Post('destroy/:id') @HttpCode(200) @ResponseMessage('Xóa vào thùng rác thành công.')
  async destroy(@Param('id', ParseIntPipe) id: number, @CurrentUser() u: AuthUser) { await this.s.destroy(id, u); return null; }
  @Post('forceDelete/:id') @HttpCode(200) @ResponseMessage('Xóa vĩnh viễn thành công.')
  async force(@Param('id', ParseIntPipe) id: number) { await this.s.forceDelete(id); return null; }
  @Post(':id/restore') @HttpCode(200) @ResponseMessage('Khôi phục lịch trực thành công.')
  async restore(@Param('id', ParseIntPipe) id: number) { await this.s.restore(id); return null; }
}
