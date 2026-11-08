import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ValidationFailed } from '../common/filters/http-exception.filter';
import { PrismaService } from '../prisma/prisma.service';
import { toUserResource, userInclude } from '../users/user.resource';
import { StoreReviewDto } from './dto/review.dto';

const include = {
  user: { select: { id: true, name: true } },
  appointment: { select: { id: true, appointmentDate: true } },
  doctor: { include: { user: { include: userInclude } } },
} satisfies Prisma.ReviewInclude;
type Full = Prisma.ReviewGetPayload<{ include: typeof include }>;

/** Port of Http/Resources/ReviewResource. */
const toResource = (r: Full) => ({
  id: r.id, user: r.user, appointment: r.appointment, doctor_id: r.doctorId, rating: r.rating, comment: r.comment, created_at: r.createdAt,
  doctor: { id: r.doctor.id, user_id: r.doctor.userId, name: r.doctor.user?.name ?? null, user: r.doctor.user ? toUserResource(r.doctor.user) : null },
});

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  async mine(userId: number) { return (await this.prisma.review.findMany({ where: { userId }, include, orderBy: { createdAt: 'desc' } })).map(toResource); }
  async forDoctor(doctorId: number | null) {
    if (!doctorId) return [];
    return (await this.prisma.review.findMany({ where: { doctorId }, include, orderBy: { createdAt: 'desc' } })).map(toResource);
  }
  async all() { return (await this.prisma.review.findMany({ include, orderBy: { createdAt: 'desc' } })).map(toResource); }

  async create(userId: number, dto: StoreReviewDto) {
    const a = await this.prisma.appointment.findFirst({ where: { id: dto.appointment_id, deletedAt: null } });
    const fail = (m: string) => { throw new ValidationFailed({ appointment_id: [m] }); };
    if (!a) fail('Lịch hẹn không tồn tại.');
    if (a!.userId !== userId) fail('Bạn không có quyền đánh giá lịch hẹn này.');
    if (a!.status !== 'completed') fail('Chỉ có thể đánh giá sau khi buổi khám đã hoàn thành.');
    if (await this.prisma.review.findUnique({ where: { appointmentId: a!.id } })) fail('Lịch hẹn này đã được đánh giá.');

    const r = await this.prisma.review.create({
      data: { userId, doctorId: a!.doctorId, appointmentId: a!.id, rating: dto.rating, comment: dto.comment },
      include,
    });
    return toResource(r);
  }
}
