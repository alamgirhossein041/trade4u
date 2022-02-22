import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './../auth';
import { CommonModule } from './../common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from '../../modules/user';
import { SeedModule } from '../../modules/seed/seed.module';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: AppService.createConnection,
    }),
    ConfigModule.forRoot({
      envFilePath: [AppService.envConfiguration()],
    }),
    AuthModule,
    CommonModule,
    UserModule,
    SeedModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
