import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Response } from 'express';

/** 422 payload identical to Laravel: { success:false, message, errors:{ field:[msg] } } (feeds showApiError()). */
export class ValidationFailed extends HttpException {
  constructor(errors: Record<string, string[]>, message = 'Dữ liệu không hợp lệ.') {
    super({ success: false, message, errors }, HttpStatus.UNPROCESSABLE_ENTITY);
  }
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('Exceptions');

  catch(exception: unknown, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse<Response>();
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let body: Record<string, unknown> = { success: false, message: 'Có lỗi xảy ra, vui lòng thử lại sau.' };

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const r = exception.getResponse();
      body = typeof r === 'string' ? { success: false, message: r } : { success: false, ...(r as object) };
      if (Array.isArray(body.message)) body.message = (body.message as string[])[0];
      delete body.statusCode; delete body.error;
    } else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      if (exception.code === 'P2002') {
        status = HttpStatus.UNPROCESSABLE_ENTITY;
        const target = ((exception.meta?.target as string[] | string) ?? 'field').toString();
        body = { success: false, message: 'Dữ liệu đã tồn tại.', errors: { [target]: ['Giá trị này đã tồn tại.'] } };
      } else if (exception.code === 'P2003') {
        status = HttpStatus.UNPROCESSABLE_ENTITY;
        body = { success: false, message: 'Dữ liệu tham chiếu không tồn tại.' };
      } else if (exception.code === 'P2025') {
        status = HttpStatus.NOT_FOUND;
        body = { success: false, message: 'Không tìm thấy dữ liệu.' };
      } else {
        this.logger.error(exception.message, exception.stack);
      }
    } else {
      this.logger.error(String(exception), (exception as Error)?.stack);
    }
    res.status(status).json(body);
  }
}
