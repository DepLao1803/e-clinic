import { Body, Controller, Get, HttpCode, Param, ParseIntPipe, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { ResponseMessage } from '../common/decorators/response-message.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { CreateMedicalServiceDto, MedicalServicesService, UpdateMedicalServiceDto } from './medical-services.service';

@ApiTags('medical-services') @Public()
@Controller('medical-services')
export class PublicMedicalServicesController {
  constructor(private readonly s: MedicalServicesService) {}
  @Get() list(@Query('specialty_id') sid?: string) { return this.s.publicList(sid ? +sid : undefined); }
  @Get(':id') show(@Param('id', ParseIntPipe) id: number) { return this.s.publicShow(id); }
}

@ApiTags('admin/medical-services') @ApiBearerAuth() @Roles('admin')
@Controller('admin/medical-services')
export class AdminMedicalServicesController {
  constructor(private readonly s: MedicalServicesService) {}
  @Get('trash') trash() { return this.s.trash(); }
  @Get() list(@Query('page') p = 1, @Query('per_page') pp = 15) { return this.s.adminList(+p, +pp); }
  @Get(':id') show(@Param('id', ParseIntPipe) id: number) { return this.s.adminShow(id); }
  @Post() @ResponseMessage('Thêm dịch vụ thành công.') create(@Body() d: CreateMedicalServiceDto) { return this.s.create(d); }
  @Post('update/:id') @HttpCode(200) @ResponseMessage('Cập nhật dịch vụ thành công.')
  update(@Param('id', ParseIntPipe) id: number, @Body() d: UpdateMedicalServiceDto) { return this.s.update(id, d); }
  @Post('toggleStatus/:id') @HttpCode(200)
  async toggle(@Param('id', ParseIntPipe) id: number) {
    return { success: true, message: (await this.s.toggleStatus(id)) ? 'Đã kích hoạt dịch vụ.' : 'Đã vô hiệu hóa dịch vụ.' };
  }
  @Post('destroy/:id') @HttpCode(200) @ResponseMessage('Xóa vào thùng rác thành công.')
  async destroy(@Param('id', ParseIntPipe) id: number) { await this.s.destroy(id); return null; }
  @Post('restore/:id') @HttpCode(200) @ResponseMessage('Khôi phục thành công.')
  async restore(@Param('id', ParseIntPipe) id: number) { await this.s.restore(id); return null; }
  @Post('forceDelete/:id') @HttpCode(200) @ResponseMessage('Xóa vĩnh viễn thành công.')
  async force(@Param('id', ParseIntPipe) id: number) { await this.s.forceDelete(id); return null; }
}
