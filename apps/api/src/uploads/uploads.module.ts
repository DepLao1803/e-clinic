import { BadRequestException, Body, Controller, Logger, Module, Post, Req, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiTags, ApiBody } from '@nestjs/swagger';
import { randomUUID } from 'crypto';
import { existsSync, mkdirSync, unlinkSync } from 'fs';
import { diskStorage } from 'multer';
import { basename, extname, join, resolve } from 'path';

export const UPLOAD_DIR = resolve(process.env.UPLOAD_DIR ?? join(process.cwd(), 'uploads'));
const MAX_BYTES = 2 * 1024 * 1024;
const TYPES: Record<string, string> = { 'image/jpeg': '.jpg', 'image/jpg': '.jpg', 'image/png': '.png' };

/** POST /api/uploads (multipart, field "file", optional "old_url") → { url }. JPG/PNG ≤ 2 MB */
@ApiTags('uploads') 
@ApiBearerAuth()
@Controller('uploads')
export class UploadsController {
  private readonly logger = new Logger(UploadsController.name);

  @Post() 
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        old_url: { type: 'string', description: 'Truyền URL ảnh cũ vào đây để server tự động xóa' }
      }
    }
  })
  @UseInterceptors(FileInterceptor('file', {
    limits: { fileSize: MAX_BYTES },
    fileFilter: (_req, file, cb) =>
      TYPES[file.mimetype] ? cb(null, true) : cb(new BadRequestException('Chỉ nhận ảnh định dạng JPG hoặc PNG.'), false),
    storage: diskStorage({
      destination: (_req, _file, cb) => { mkdirSync(UPLOAD_DIR, { recursive: true }); cb(null, UPLOAD_DIR); },
      filename: (_req, file, cb) => cb(null, `${randomUUID()}${TYPES[file.mimetype] ?? extname(file.originalname)}`),
    }),
  }))
  upload(
    @UploadedFile() file: { filename: string } | undefined, 
    @Req() req: any,
    @Body('old_url') oldUrl?: string // Lấy thêm trường old_url từ form-data
  ) {
    if (!file) throw new BadRequestException('Chưa chọn file ảnh.');

    // Logic dọn dẹp file cũ
    if (oldUrl) {
      try {
        // Lấy tên file gốc an toàn (Vd: http://localhost:4000/uploads/abc.jpg -> abc.jpg)
        const oldFilename = basename(oldUrl);
        const oldFilePath = join(UPLOAD_DIR, oldFilename);
        
        // Kiểm tra file tồn tại và xóa
        if (existsSync(oldFilePath)) {
          unlinkSync(oldFilePath);
          this.logger.log(`Đã dọn dẹp ảnh cũ: ${oldFilename}`);
        }
      } catch (error) {
        this.logger.error(`Không thể xóa ảnh cũ: ${(error as Error).message}`);
      }
    }

    const base = process.env.PUBLIC_URL ?? `${req.protocol}://${req.get('host')}`;
    return { url: `${base}/uploads/${file.filename}` };
  }
}

@Module({ controllers: [UploadsController] })
export class UploadsModule {}