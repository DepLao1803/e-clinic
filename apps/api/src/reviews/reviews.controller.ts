import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthUser, CurrentUser } from '../common/decorators/current-user.decorator';
import { ResponseMessage } from '../common/decorators/response-message.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { StoreReviewDto } from './dto/review.dto';
import { ReviewsService } from './reviews.service';

@ApiTags('reviews') @ApiBearerAuth()
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly s: ReviewsService) {}
  @Get('my') my(@CurrentUser('id') id: number) { return this.s.mine(id); }
  @Post() @ResponseMessage('Gửi đánh giá thành công') store(@CurrentUser('id') id: number, @Body() dto: StoreReviewDto) { return this.s.create(id, dto); }
  @Get('doctor') doctor(@CurrentUser() u: AuthUser) { return this.s.forDoctor(u.doctorId); }
}

@ApiTags('admin/reviews') @ApiBearerAuth() @Roles('admin')
@Controller('admin/reviews')
export class AdminReviewsController {
  constructor(private readonly s: ReviewsService) {}
  @Get() all() { return this.s.all(); }
}
