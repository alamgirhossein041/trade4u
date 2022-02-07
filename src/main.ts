import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { useContainer } from 'class-validator';
import { AppService } from 'modules/main/app.service';
import { TrimStringsPipe } from './modules/common/transformer/trim-strings.pipe';
import { AppModule } from './modules/main/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  app.useGlobalPipes(new TrimStringsPipe(), new ValidationPipe());
  useContainer(app.select(AppModule), { fallbackOnErrors: true });
  await app.listen(AppService.port);
}
bootstrap();
