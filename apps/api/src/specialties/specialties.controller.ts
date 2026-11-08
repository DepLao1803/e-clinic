import { Body, Controller, Get, HttpCode, Param, ParseIntPipe, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { ResponseMessage } from '../common/decorators/response-message.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { CreateSpecialtyDto, UpdateSpecialtyDto } from './dto/specialty.dto';
import { SpecialtiesService } from './specialties.service';

@ApiTags('specialties') @Public()
@Controller()
export class PublicSpecialtiesController {
  constructor(private readonly s: SpecialtiesService) {}
  @Get('specialties') list() { return this.s.publicList(); }
  @Get('specialties/:id') show(@Param('id', ParseIntPipe) id: number) { return this.s.publicShow(id); }
  @Get('auth/specialties/:id/doctors') doctors(@Param('id', ParseIntPipe) id: number) { return this.s.doctorsBySpecialty(id); }
}

/** Legacy paths kept 1:1 (POST /update/:id, POST /destroy/:id …). RESTify later, once the frontend is switched over. */
@ApiTags('admin/specialties') @ApiBearerAuth() @Roles('admin')
@Controller('admin/specialties')
export class AdminSpecialtiesController {
  constructor(private readonly s: SpecialtiesService) {}
  @Get('trash') trash() { return this.s.trash(); }
  @Get() list(@Query('page') page = 1, @Query('per_page') per = 15) { return this.s.adminList(+page, +per); }
  @Get(':id') show(@Param('id', ParseIntPipe) id: number) { return this.s.adminShow(id); }

  @Post() @ResponseMessage('Thêm chuyên khoa thành công.')
  create(@Body() dto: CreateSpecialtyDto) { return this.s.create(dto); }

  @Post('update/:id') @HttpCode(200) @ResponseMessage('Cập nhật chuyên khoa thành công.')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateSpecialtyDto) { return this.s.update(id, dto); }

  @Post('toggleStatus/:id') @HttpCode(200)
  async toggle(@Param('id', ParseIntPipe) id: number) {
    const on = (await this.s.toggleStatus(id)) === 1;
    return { success: true, message: on ? 'Đã kích hoạt chuyên khoa.' : 'Đã vô hiệu hóa chuyên khoa.' };
  }
  @Post('destroy/:id') @HttpCode(200) @ResponseMessage('Xóa vào thùng rác thành công.')
  async destroy(@Param('id', ParseIntPipe) id: number) { await this.s.destroy(id); return null; }
  @Post('restore/:id') @HttpCode(200) @ResponseMessage('Khôi phục thành công.')
  async restore(@Param('id', ParseIntPipe) id: number) { await this.s.restore(id); return null; }
  @Post('forceDelete/:id') @HttpCode(200) @ResponseMessage('Xóa vĩnh viễn thành công.')
  async force(@Param('id', ParseIntPipe) id: number) { await this.s.forceDelete(id); return null; }
}
