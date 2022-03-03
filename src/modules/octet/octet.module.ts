import { Module } from '@nestjs/common';
import { OctetService } from './octet.service';
import { OctetController } from './octet.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Account } from './account.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Account])],
  controllers: [OctetController],
  providers: [OctetService],
})
export class OctetModule {}
