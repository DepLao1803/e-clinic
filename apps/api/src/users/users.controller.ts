import { Body, Controller, Delete, Get, HttpCode, Param, ParseIntPipe, Patch, Post, Put, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ResponseMessage } from '../common/decorators/response-message.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';
import { UsersService } from './users.service';

/** Mirrors the `admin/*` user routes of routes/api.php, path for path. */
@ApiTags('admin/users') @ApiBearerAuth()
@Roles('admin')
@Controller('admin')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  // --- /admin/user/* (declared first, like Laravel, so they never collide with /profile/:id)
  @Get('user/trash') trash() { return this.users.trash(); }

  @Post('user/restore/:id') @HttpCode(200) @ResponseMessage('Khôi phục thành công')
  async restore(@Param('id', ParseIntPipe) id: number) { await this.users.restore(id); return null; }

  @Post('user/toggleStatus/:id') @HttpCode(200)
  async toggle(@Param('id', ParseIntPipe) id: number) {
    const message = await this.users.toggleStatus(id);
    return { success: true, message };
  }

  @Post('user/forceDelete/:id') @HttpCode(200) @ResponseMessage('Xóa vĩnh viễn tài khoản thành công.')
  async forceDelete(@Param('id', ParseIntPipe) id: number) { await this.users.forceDelete(id); return null; }

  // --- apiResource('profile')
  @Get('profile')
  index(@Query('page') page = 1, @Query('per_page') perPage = 15) { return this.users.list(+page, +perPage); }

  @Post('profile') @ResponseMessage('Tạo tài khoản thành công')
  store(@Body() dto: CreateUserDto) { return this.users.create(dto); }

  @Get('profile/:id') show(@Param('id', ParseIntPipe) id: number) { return this.users.show(id); }

  @Put('profile/:id') @ResponseMessage('Cập nhật tài khoản thành công')
  put(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateUserDto) { return this.users.update(id, dto); }

  @Patch('profile/:id') @ResponseMessage('Cập nhật tài khoản thành công')
  patch(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateUserDto) { return this.users.update(id, dto); }

  @Delete('profile/:id') @ResponseMessage('Xóa vào thùng rác thành công')
  async destroy(@Param('id', ParseIntPipe) id: number) { await this.users.softDelete(id); return null; }
}
