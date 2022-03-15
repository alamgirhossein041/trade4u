import { Module } from '@nestjs/common';
import { KlaytnService } from './klaytn.service';
import { KlaytnController } from './klaytn.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Account } from './account.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Account])],
  controllers: [KlaytnController],
  providers: [KlaytnService],
  exports: [KlaytnService],
})
export class KlaytnModule {}
