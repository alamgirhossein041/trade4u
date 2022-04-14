import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { useContainer } from 'class-validator';
import { AppModule } from './modules/main/app.module';
import { AppService } from './modules/main/app.service';
import { LoggerService } from './utils/logger/logger.service';
import { HttpExceptionFilter } from './modules/common/filters/http-exception.filter';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  });
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useLogger(new LoggerService());
  app.enableCors();
  app.useGlobalPipes(new ValidationPipe());
  app.useStaticAssets(join(__dirname, '..', 'public'));
  useContainer(app.select(AppModule), { fallbackOnErrors: true });
  await app.listen(process.env.APP_PORT);
  await AppService.startup();
}
bootstrap();
