import 'reflect-metadata';
import { ValidationError, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { UPLOAD_DIR } from './uploads/uploads.module';
import { ValidationFailed } from './common/filters/http-exception.filter';

function flatten(errors: ValidationError[], parent = ''): Record<string, string[]> {
  return errors.reduce<Record<string, string[]>>((acc, e) => {
    const key = parent ? `${parent}.${e.property}` : e.property;
    if (e.constraints) acc[key] = Object.values(e.constraints);
    if (e.children?.length) Object.assign(acc, flatten(e.children, key));
    return acc;
  }, {});
}

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.useStaticAssets(UPLOAD_DIR, { prefix: '/uploads/' }); // uploaded images (public, outside the /api prefix)
  app.setGlobalPrefix('api'); // keep Laravel's /api/* URLs so the frontend contract doesn't change
  // CORS_ORIGIN (danh sách, cách nhau bởi dấu phẩy) nếu có; nếu không thì cho phép mọi origin localhost/127.0.0.1
  // (Next dev có thể chạy ở cổng 3001… hoặc mở bằng 127.0.0.1) để dev không bị chặn.
  const allowed = process.env.CORS_ORIGIN?.split(',').map((o) => o.trim());
  app.enableCors({
    origin: allowed ?? /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/,
    credentials: true,
  });
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true, transform: true, transformOptions: { enableImplicitConversion: true },
    exceptionFactory: (errors) => new ValidationFailed(flatten(errors)),
  }));

  const doc = SwaggerModule.createDocument(app,
    new DocumentBuilder().setTitle('e-Clinic API').setVersion('1.0').addBearerAuth().build());
  SwaggerModule.setup('api/docs', app, doc);

  const port = Number(process.env.API_PORT ?? 4000);
  await app.listen(port);
  console.log(`API  → http://localhost:${port}/api   Docs → http://localhost:${port}/api/docs`);
}
bootstrap();
