import { Body, Controller, Delete, Get, HttpCode, Param, ParseIntPipe, Post, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ResponseMessage } from '../common/decorators/response-message.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { ScheduleDto, SchedulesService } from './schedules.service';

@ApiTags('schedules') @ApiBearerAuth()
@Controller('schedules')
export class SchedulesController {
  constructor(private readonly s: SchedulesService) {}
  @Get() list() { return this.s.list(); } // any authenticated user (patients booking, doctors registering shifts)
}

@ApiTags('admin/schedules') @ApiBearerAuth() @Roles('admin')
@Controller('admin/schedules')
export class AdminSchedulesController {
  constructor(private readonly s: SchedulesService) {}
  @Get('trash') trash() { return this.s.trash(); }
  @Get() list() { return this.s.adminList(); }
  @Get(':id') show(@Param('id', ParseIntPipe) id: number) { return this.s.show(id); }
  @Post() @ResponseMessage('Thêm khung giờ thành công.') create(@Body() d: ScheduleDto) { return this.s.create(d); }
  @Put(':id') @ResponseMessage('Cập nhật khung giờ thành công.')
  update(@Param('id', ParseIntPipe) id: number, @Body() d: ScheduleDto) { return this.s.update(id, d); }
  @Delete(':id') @ResponseMessage('Xóa khung giờ thành công.')
  async destroy(@Param('id', ParseIntPipe) id: number) { await this.s.destroy(id); return null; }
  @Post(':id/toggle') @HttpCode(200)
  async toggle(@Param('id', ParseIntPipe) id: number) {
    return { success: true, message: (await this.s.toggle(id)) ? 'Đã bật ca khám.' : 'Đã tắt ca khám.' };
  }
  @Post(':id/forceDelete') @HttpCode(200) @ResponseMessage('Xóa vĩnh viễn khung giờ thành công.')
  async force(@Param('id', ParseIntPipe) id: number) { await this.s.forceDelete(id); return null; }
  @Post(':id/restore') @HttpCode(200) @ResponseMessage('Khôi phục khung giờ thành công.')
  async restore(@Param('id', ParseIntPipe) id: number) { await this.s.restore(id); return null; }
}
