import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesService } from './roles.service';

@ApiTags('roles') @ApiBearerAuth()
@Controller('admin/roles')
@Roles('admin')
export class RolesController {
  constructor(private readonly roles: RolesService) {}
  @Get() findAll() { return this.roles.findAll(); }
}
